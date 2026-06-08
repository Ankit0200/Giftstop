import secrets
import string
from decimal import Decimal

import stripe
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.email import send_gift_card_email
from app.models import GiftCard, Purchase, Merchant, Redemption
from app.schemas import (
    PurchaseRequest, PurchaseResponse,
    RedeemRequest, RedeemResponse,
    BalanceResponse, ConfirmPaymentRequest,
)

stripe.api_key = settings.STRIPE_SECRET_KEY

router = APIRouter(prefix="/api/cards", tags=["cards"])


def generate_card_code() -> str:
    """Generate a 12-character alphanumeric gift card code like XXXX-XXXX-XXXX."""
    chars = string.ascii_uppercase + string.digits
    raw = "".join(secrets.choice(chars) for _ in range(12))
    return f"{raw[:4]}-{raw[4:8]}-{raw[8:12]}"


# ─── BUY FLOW ────────────────────────────────────────────────────────────────

@router.post("/buy", response_model=PurchaseResponse)
def buy_gift_card(data: PurchaseRequest, db: Session = Depends(get_db)):
    """
    Step 1 of buy flow: create a Stripe PaymentIntent + gift card (pending).
    The frontend uses the client_secret to complete payment via Stripe Elements.
    """
    merchant = db.query(Merchant).filter(Merchant.id == data.merchant_id).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")

    amount_cents = int(data.amount * 100)
    platform_fee_cents = int(amount_cents * settings.PLATFORM_FEE_PERCENT / 100)

    # Create Stripe PaymentIntent
    intent_params = {
        "amount": amount_cents,
        "currency": "usd",
        "metadata": {"merchant_id": str(merchant.id)},
    }
    # If merchant has Stripe Connect, route funds with platform fee
    if merchant.stripe_account_id:
        intent_params["transfer_data"] = {"destination": merchant.stripe_account_id}
        intent_params["application_fee_amount"] = platform_fee_cents

    intent = stripe.PaymentIntent.create(**intent_params)

    # Generate unique card code
    code = generate_card_code()
    while db.query(GiftCard).filter(GiftCard.code == code).first():
        code = generate_card_code()

    # Create gift card (active immediately for hackathon simplicity)
    gift_card = GiftCard(
        code=code,
        merchant_id=merchant.id,
        original_amount=data.amount,
        current_balance=data.amount,
        status="active",
    )
    db.add(gift_card)
    db.flush()

    # Create purchase record
    purchase = Purchase(
        gift_card_id=gift_card.id,
        merchant_id=merchant.id,
        buyer_email=data.buyer_email,
        buyer_name=data.buyer_name,
        recipient_email=data.recipient_email,
        recipient_name=data.recipient_name,
        message=data.message,
        amount=data.amount,
        stripe_payment_intent_id=intent.id,
        payment_status="pending",
    )
    db.add(purchase)
    db.commit()
    db.refresh(purchase)

    return PurchaseResponse(
        purchase_id=purchase.id,
        gift_card_code=gift_card.code,
        amount=data.amount,
        stripe_client_secret=intent.client_secret,
        merchant_name=merchant.name,
    )


@router.post("/confirm-payment")
def confirm_payment(data: ConfirmPaymentRequest, db: Session = Depends(get_db)):
    """
    After Stripe confirms payment on the frontend, mark the purchase as completed.
    """
    purchase = db.query(Purchase).filter(
        Purchase.stripe_payment_intent_id == data.payment_intent_id
    ).first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")

    # Verify with Stripe
    intent = stripe.PaymentIntent.retrieve(data.payment_intent_id)
    if intent.status == "succeeded":
        purchase.payment_status = "completed"
        db.commit()

        # Send gift card email to recipient if provided
        if purchase.recipient_email:
            merchant = db.query(Merchant).filter(Merchant.id == purchase.merchant_id).first()
            send_gift_card_email(
                recipient_email=purchase.recipient_email,
                recipient_name=purchase.recipient_name,
                buyer_name=purchase.buyer_name,
                merchant_name=merchant.name if merchant else "a local shop",
                gift_card_code=purchase.gift_card.code,
                amount=str(purchase.amount),
                message=purchase.message,
            )

        return {"status": "completed", "gift_card_code": purchase.gift_card.code}
    else:
        return {"status": intent.status}


# ─── REDEMPTION (THE CRITICAL PIECE) ─────────────────────────────────────────

@router.post("/redeem", response_model=RedeemResponse)
def redeem_gift_card(data: RedeemRequest, db: Session = Depends(get_db)):
    """
    Atomic gift card redemption using SELECT FOR UPDATE.

    This is the centerpiece of the platform. The transaction:
    1. Locks the gift card row (SELECT ... FOR UPDATE) so no concurrent
       transaction can read or modify it until we commit.
    2. Validates: card exists, is active, belongs to this merchant, has
       sufficient balance.
    3. Deducts the amount and inserts a redemption record.
    4. All in ONE atomic transaction — commit or rollback together.

    Why this matters:
    Without row-level locking, two simultaneous $50 redemptions on a $75 card
    could both read balance=$75, both pass the check, and drain $100. The
    SELECT FOR UPDATE ensures the second request waits for the first to finish,
    then sees the real (updated) balance.
    """
    # Step 1: Lock the card row
    card = (
        db.query(GiftCard)
        .filter(GiftCard.code == data.code)
        .with_for_update()  # SELECT ... FOR UPDATE
        .first()
    )

    if not card:
        return RedeemResponse(success=False, message="Gift card not found")

    if card.status != "active":
        return RedeemResponse(
            success=False,
            message=f"Gift card is {card.status}",
            remaining_balance=card.current_balance,
        )

    if card.merchant_id != data.merchant_id:
        return RedeemResponse(
            success=False,
            message="Gift card does not belong to this merchant",
        )

    # Verify merchant PIN if the merchant has one set
    merchant = db.query(Merchant).filter(Merchant.id == data.merchant_id).first()
    if merchant and merchant.pin:
        if not data.pin or data.pin != merchant.pin:
            return RedeemResponse(
                success=False,
                message="Invalid merchant PIN",
            )

    if card.current_balance < data.amount:
        return RedeemResponse(
            success=False,
            message=f"Insufficient balance. Available: ${card.current_balance}",
            remaining_balance=card.current_balance,
        )

    # Step 2: Deduct balance
    balance_before = card.current_balance
    card.current_balance -= data.amount
    if card.current_balance == 0:
        card.status = "redeemed"

    # Step 3: Insert redemption record
    redemption = Redemption(
        gift_card_id=card.id,
        merchant_id=data.merchant_id,
        amount=data.amount,
        balance_before=balance_before,
        balance_after=card.current_balance,
    )
    db.add(redemption)

    # Step 4: Atomic commit — balance update + redemption record together
    db.commit()
    db.refresh(redemption)

    return RedeemResponse(
        success=True,
        message="Redemption successful",
        remaining_balance=card.current_balance,
        redemption_id=redemption.id,
    )


# ─── CARD LOOKUP (for QR redemption page) ────────────────────────────────────

@router.get("/lookup/{code}")
def lookup_card(code: str, db: Session = Depends(get_db)):
    """Look up a gift card by code — returns card info + merchant details for the redemption page."""
    card = db.query(GiftCard).filter(GiftCard.code == code).first()
    if not card:
        raise HTTPException(status_code=404, detail="Gift card not found")

    merchant = db.query(Merchant).filter(Merchant.id == card.merchant_id).first()

    return {
        "code": card.code,
        "original_amount": str(card.original_amount),
        "current_balance": str(card.current_balance),
        "status": card.status,
        "merchant_id": str(card.merchant_id),
        "merchant_name": merchant.name if merchant else "Unknown",
        "merchant_slug": merchant.slug if merchant else "",
        "requires_pin": bool(merchant and merchant.pin),
    }


# ─── BALANCE CHECK ───────────────────────────────────────────────────────────

@router.get("/balance/{code}", response_model=BalanceResponse)
def check_balance(code: str, db: Session = Depends(get_db)):
    card = db.query(GiftCard).filter(GiftCard.code == code).first()
    if not card:
        raise HTTPException(status_code=404, detail="Gift card not found")

    return BalanceResponse(
        code=card.code,
        original_amount=card.original_amount,
        current_balance=card.current_balance,
        status=card.status,
        merchant_name=card.merchant.name,
        created_at=card.created_at,
    )
