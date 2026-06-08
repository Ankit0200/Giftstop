import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Numeric, Boolean, Text, ForeignKey, DateTime, CheckConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class Merchant(Base):
    __tablename__ = "merchants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), nullable=False, unique=True)
    logo_url = Column(Text)
    brand_color = Column(String(7), default="#4F46E5")
    stripe_account_id = Column(String(255))
    email = Column(String(255), nullable=False)
    phone = Column(String(50))
    address = Column(Text)
    pin = Column(String(4))
    password = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    gift_cards = relationship("GiftCard", back_populates="merchant")
    purchases = relationship("Purchase", back_populates="merchant")
    redemptions = relationship("Redemption", back_populates="merchant")


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255))
    role = Column(String(20), default="customer")
    merchant_id = Column(UUID(as_uuid=True), ForeignKey("merchants.id"))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class GiftCard(Base):
    __tablename__ = "gift_cards"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(16), nullable=False, unique=True)
    merchant_id = Column(UUID(as_uuid=True), ForeignKey("merchants.id"), nullable=False)
    original_amount = Column(Numeric(10, 2), nullable=False)
    current_balance = Column(Numeric(10, 2), nullable=False)
    status = Column(String(20), default="active")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime(timezone=True))

    __table_args__ = (
        CheckConstraint("original_amount > 0", name="ck_original_amount_positive"),
        CheckConstraint("current_balance >= 0", name="ck_balance_non_negative"),
        CheckConstraint("current_balance <= original_amount", name="ck_balance_not_exceeds_original"),
    )

    merchant = relationship("Merchant", back_populates="gift_cards")
    purchase = relationship("Purchase", back_populates="gift_card", uselist=False)
    redemptions = relationship("Redemption", back_populates="gift_card")


class Purchase(Base):
    __tablename__ = "purchases"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    gift_card_id = Column(UUID(as_uuid=True), ForeignKey("gift_cards.id"), nullable=False)
    merchant_id = Column(UUID(as_uuid=True), ForeignKey("merchants.id"), nullable=False)
    buyer_email = Column(String(255), nullable=False)
    buyer_name = Column(String(255))
    recipient_email = Column(String(255))
    recipient_name = Column(String(255))
    message = Column(Text)
    amount = Column(Numeric(10, 2), nullable=False)
    stripe_payment_intent_id = Column(String(255))
    stripe_charge_id = Column(String(255))
    payment_status = Column(String(20), default="pending")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    gift_card = relationship("GiftCard", back_populates="purchase")
    merchant = relationship("Merchant", back_populates="purchases")


class Redemption(Base):
    __tablename__ = "redemptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    gift_card_id = Column(UUID(as_uuid=True), ForeignKey("gift_cards.id"), nullable=False)
    merchant_id = Column(UUID(as_uuid=True), ForeignKey("merchants.id"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    balance_before = Column(Numeric(10, 2), nullable=False)
    balance_after = Column(Numeric(10, 2), nullable=False)
    redeemed_by = Column(String(255))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    gift_card = relationship("GiftCard", back_populates="redemptions")
    merchant = relationship("Merchant", back_populates="redemptions")
