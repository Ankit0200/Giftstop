from pydantic import BaseModel, EmailStr
from decimal import Decimal
from uuid import UUID
from datetime import datetime
from typing import Optional


# --- Merchant ---
class MerchantCreate(BaseModel):
    name: str
    slug: str
    email: EmailStr
    logo_url: Optional[str] = None
    brand_color: str = "#4F46E5"
    phone: Optional[str] = None
    address: Optional[str] = None
    pin: Optional[str] = None
    password: Optional[str] = None


class MerchantResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    logo_url: Optional[str]
    brand_color: str
    email: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Purchase / Buy Flow ---
class PurchaseRequest(BaseModel):
    merchant_id: UUID
    amount: Decimal
    buyer_email: EmailStr
    buyer_name: Optional[str] = None
    recipient_email: Optional[EmailStr] = None
    recipient_name: Optional[str] = None
    message: Optional[str] = None


class PurchaseResponse(BaseModel):
    purchase_id: UUID
    gift_card_code: str
    amount: Decimal
    stripe_client_secret: str
    merchant_name: str


# --- Redemption ---
class RedeemRequest(BaseModel):
    code: str
    amount: Decimal
    merchant_id: UUID
    pin: Optional[str] = None


class RedeemResponse(BaseModel):
    success: bool
    message: str
    remaining_balance: Optional[Decimal] = None
    redemption_id: Optional[UUID] = None


# --- Balance Check ---
class BalanceResponse(BaseModel):
    code: str
    original_amount: Decimal
    current_balance: Decimal
    status: str
    merchant_name: str
    created_at: datetime


# --- Payment confirmation ---
class ConfirmPaymentRequest(BaseModel):
    payment_intent_id: str


# --- Merchant Dashboard ---
class DashboardStats(BaseModel):
    total_cards_sold: int
    total_revenue: Decimal
    outstanding_liability: Decimal
    total_redeemed: Decimal
    active_cards: int

    model_config = {"from_attributes": True}


class RedemptionHistoryItem(BaseModel):
    id: UUID
    gift_card_code: str
    amount: Decimal
    balance_before: Decimal
    balance_after: Decimal
    redeemed_by: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class GiftCardSummary(BaseModel):
    id: UUID
    code: str
    original_amount: Decimal
    current_balance: Decimal
    status: str
    buyer_email: Optional[str]
    recipient_name: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Stripe Connect ---
class StripeConnectResponse(BaseModel):
    onboarding_url: str
