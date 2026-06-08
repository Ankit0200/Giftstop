from decimal import Decimal

import stripe
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import Merchant, GiftCard, Purchase, Redemption
from app.schemas import (
    MerchantCreate, MerchantResponse,
    DashboardStats, RedemptionHistoryItem, GiftCardSummary,
    StripeConnectResponse,
)

stripe.api_key = settings.STRIPE_SECRET_KEY

router = APIRouter(prefix="/api/merchants", tags=["merchants"])


@router.post("/", response_model=MerchantResponse)
def create_merchant(data: MerchantCreate, db: Session = Depends(get_db)):
    existing = db.query(Merchant).filter(Merchant.slug == data.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Slug already taken")

    merchant = Merchant(**data.model_dump())
    db.add(merchant)
    db.commit()
    db.refresh(merchant)
    return merchant


@router.post("/login")
def login_merchant(data: dict, db: Session = Depends(get_db)):
    """Simple merchant login with email + password."""
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")

    merchant = db.query(Merchant).filter(
        func.lower(Merchant.email) == email
    ).first()

    if not merchant or merchant.password != password:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return {
        "slug": merchant.slug,
        "name": merchant.name,
        "id": str(merchant.id),
    }


@router.get("/", response_model=list[MerchantResponse])
def list_merchants(db: Session = Depends(get_db)):
    return db.query(Merchant).filter(Merchant.is_active == True).all()


@router.get("/{slug}", response_model=MerchantResponse)
def get_merchant(slug: str, db: Session = Depends(get_db)):
    merchant = db.query(Merchant).filter(Merchant.slug == slug).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    return merchant


# ─── STRIPE CONNECT ONBOARDING ──────────────────────────────────────────────

@router.post("/{slug}/connect", response_model=StripeConnectResponse)
def start_stripe_connect(slug: str, db: Session = Depends(get_db)):
    """Create a Stripe Connect account for the merchant and return the onboarding URL."""
    merchant = db.query(Merchant).filter(Merchant.slug == slug).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")

    if not merchant.stripe_account_id:
        account = stripe.Account.create(
            type="express",
            country="US",
            email=merchant.email,
            capabilities={"card_payments": {"requested": True}, "transfers": {"requested": True}},
            business_profile={"name": merchant.name},
        )
        merchant.stripe_account_id = account.id
        db.commit()

    link = stripe.AccountLink.create(
        account=merchant.stripe_account_id,
        refresh_url=f"{settings.FRONTEND_URL}/merchant/{slug}/dashboard",
        return_url=f"{settings.FRONTEND_URL}/merchant/{slug}/dashboard",
        type="account_onboarding",
    )

    return StripeConnectResponse(onboarding_url=link.url)


# ─── MERCHANT DASHBOARD ─────────────────────────────────────────────────────

@router.get("/{slug}/dashboard/stats", response_model=DashboardStats)
def dashboard_stats(slug: str, db: Session = Depends(get_db)):
    merchant = db.query(Merchant).filter(Merchant.slug == slug).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")

    mid = merchant.id

    total_cards_sold = db.query(func.count(GiftCard.id)).filter(
        GiftCard.merchant_id == mid
    ).scalar() or 0

    total_revenue = db.query(func.coalesce(func.sum(Purchase.amount), 0)).filter(
        Purchase.merchant_id == mid,
        Purchase.payment_status == "completed",
    ).scalar()

    outstanding_liability = db.query(
        func.coalesce(func.sum(GiftCard.current_balance), 0)
    ).filter(
        GiftCard.merchant_id == mid,
        GiftCard.status == "active",
    ).scalar()

    total_redeemed = db.query(
        func.coalesce(func.sum(Redemption.amount), 0)
    ).filter(Redemption.merchant_id == mid).scalar()

    active_cards = db.query(func.count(GiftCard.id)).filter(
        GiftCard.merchant_id == mid,
        GiftCard.status == "active",
    ).scalar() or 0

    return DashboardStats(
        total_cards_sold=total_cards_sold,
        total_revenue=Decimal(str(total_revenue)),
        outstanding_liability=Decimal(str(outstanding_liability)),
        total_redeemed=Decimal(str(total_redeemed)),
        active_cards=active_cards,
    )


@router.get("/{slug}/dashboard/cards", response_model=list[GiftCardSummary])
def dashboard_cards(slug: str, db: Session = Depends(get_db)):
    merchant = db.query(Merchant).filter(Merchant.slug == slug).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")

    cards = (
        db.query(GiftCard)
        .filter(GiftCard.merchant_id == merchant.id)
        .order_by(GiftCard.created_at.desc())
        .limit(100)
        .all()
    )

    result = []
    for card in cards:
        purchase = db.query(Purchase).filter(Purchase.gift_card_id == card.id).first()
        result.append(GiftCardSummary(
            id=card.id,
            code=card.code,
            original_amount=card.original_amount,
            current_balance=card.current_balance,
            status=card.status,
            buyer_email=purchase.buyer_email if purchase else None,
            recipient_name=purchase.recipient_name if purchase else None,
            created_at=card.created_at,
        ))

    return result


@router.get("/{slug}/dashboard/redemptions", response_model=list[RedemptionHistoryItem])
def dashboard_redemptions(slug: str, db: Session = Depends(get_db)):
    merchant = db.query(Merchant).filter(Merchant.slug == slug).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")

    redemptions = (
        db.query(Redemption)
        .filter(Redemption.merchant_id == merchant.id)
        .order_by(Redemption.created_at.desc())
        .limit(100)
        .all()
    )

    result = []
    for r in redemptions:
        card = db.query(GiftCard).filter(GiftCard.id == r.gift_card_id).first()
        result.append(RedemptionHistoryItem(
            id=r.id,
            gift_card_code=card.code if card else "N/A",
            amount=r.amount,
            balance_before=r.balance_before,
            balance_after=r.balance_after,
            redeemed_by=r.redeemed_by,
            created_at=r.created_at,
        ))

    return result


# ─── ANALYTICS ──────────────────────────────────────────────────────────────

@router.get("/{slug}/dashboard/analytics")
def dashboard_analytics(slug: str, db: Session = Depends(get_db)):
    """Analytics data: breakage rate, redemption timing, card status breakdown."""
    merchant = db.query(Merchant).filter(Merchant.slug == slug).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")

    mid = merchant.id

    total_sold = db.query(
        func.coalesce(func.sum(GiftCard.original_amount), 0)
    ).filter(GiftCard.merchant_id == mid).scalar()

    total_redeemed = db.query(
        func.coalesce(func.sum(Redemption.amount), 0)
    ).filter(Redemption.merchant_id == mid).scalar()

    total_cards = db.query(func.count(GiftCard.id)).filter(
        GiftCard.merchant_id == mid
    ).scalar() or 0

    fully_redeemed = db.query(func.count(GiftCard.id)).filter(
        GiftCard.merchant_id == mid, GiftCard.status == "redeemed",
    ).scalar() or 0

    partially_used = db.query(func.count(GiftCard.id)).filter(
        GiftCard.merchant_id == mid, GiftCard.status == "active",
        GiftCard.current_balance < GiftCard.original_amount,
    ).scalar() or 0

    unused = db.query(func.count(GiftCard.id)).filter(
        GiftCard.merchant_id == mid, GiftCard.status == "active",
        GiftCard.current_balance == GiftCard.original_amount,
    ).scalar() or 0

    breakage_amount = float(total_sold) - float(total_redeemed)
    breakage_rate = (breakage_amount / float(total_sold) * 100) if float(total_sold) > 0 else 0

    avg_redemption = db.query(
        func.coalesce(func.avg(Redemption.amount), 0)
    ).filter(Redemption.merchant_id == mid).scalar()

    from sqlalchemy import cast, Date
    daily_sales = db.query(
        cast(Purchase.created_at, Date).label("date"),
        func.count(Purchase.id).label("count"),
        func.sum(Purchase.amount).label("total"),
    ).filter(
        Purchase.merchant_id == mid, Purchase.payment_status == "completed",
    ).group_by(cast(Purchase.created_at, Date)).order_by(
        cast(Purchase.created_at, Date).desc()
    ).limit(30).all()

    return {
        "total_cards": total_cards,
        "fully_redeemed": fully_redeemed,
        "partially_used": partially_used,
        "unused": unused,
        "breakage_rate": round(breakage_rate, 1),
        "breakage_amount": str(round(breakage_amount, 2)),
        "avg_redemption": str(round(float(avg_redemption), 2)),
        "daily_sales": [
            {"date": str(d.date), "count": d.count, "total": str(d.total)}
            for d in daily_sales
        ],
    }
