-- GiftLocal Platform Schema
-- Database: Aurora PostgreSQL
-- Why PostgreSQL: Gift cards are money. Redemption requires atomic transactions
-- (SELECT FOR UPDATE + balance deduction + redemption insert) to prevent double-spend
-- and negative balances under concurrent requests.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Merchants: shops that sell gift cards through the platform
CREATE TABLE merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,  -- URL-friendly identifier
    logo_url TEXT,
    brand_color VARCHAR(7) DEFAULT '#4F46E5',  -- hex color
    stripe_account_id VARCHAR(255),  -- Stripe Connect account
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_merchants_slug ON merchants(slug);

-- Users: simple auth for the hackathon
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'merchant', 'admin')),
    merchant_id UUID REFERENCES merchants(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- Gift cards: the core entity
CREATE TABLE gift_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(16) NOT NULL UNIQUE,  -- human-readable redemption code
    merchant_id UUID NOT NULL REFERENCES merchants(id),
    original_amount NUMERIC(10, 2) NOT NULL CHECK (original_amount > 0),
    current_balance NUMERIC(10, 2) NOT NULL CHECK (current_balance >= 0),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    CONSTRAINT balance_not_exceeds_original CHECK (current_balance <= original_amount)
);

CREATE INDEX idx_gift_cards_code ON gift_cards(code);
CREATE INDEX idx_gift_cards_merchant ON gift_cards(merchant_id);

-- Purchases: records of gift card buys
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gift_card_id UUID NOT NULL REFERENCES gift_cards(id),
    merchant_id UUID NOT NULL REFERENCES merchants(id),
    buyer_email VARCHAR(255) NOT NULL,
    buyer_name VARCHAR(255),
    recipient_email VARCHAR(255),
    recipient_name VARCHAR(255),
    message TEXT,  -- personal message from buyer
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    stripe_payment_intent_id VARCHAR(255),
    stripe_charge_id VARCHAR(255),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_purchases_gift_card ON purchases(gift_card_id);
CREATE INDEX idx_purchases_merchant ON purchases(merchant_id);

-- Redemptions: every time a card is used
CREATE TABLE redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gift_card_id UUID NOT NULL REFERENCES gift_cards(id),
    merchant_id UUID NOT NULL REFERENCES merchants(id),
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    balance_before NUMERIC(10, 2) NOT NULL,
    balance_after NUMERIC(10, 2) NOT NULL,
    redeemed_by VARCHAR(255),  -- merchant staff identifier
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_redemptions_gift_card ON redemptions(gift_card_id);
CREATE INDEX idx_redemptions_merchant ON redemptions(merchant_id);

-- ============================================================================
-- REDEMPTION TRANSACTION (the critical piece)
-- ============================================================================
-- This is a PostgreSQL function that performs atomic gift card redemption.
-- It uses SELECT ... FOR UPDATE to lock the card row, preventing concurrent
-- redemptions from causing double-spend or negative balance.
--
-- Why this matters:
-- Without row-level locking, two simultaneous $50 redemptions on a $75 card
-- could both read balance=$75, both succeed, and drain $100 from a $75 card.
-- SELECT FOR UPDATE serializes access: the second transaction waits for the
-- first to commit, then sees the updated balance.
-- ============================================================================

CREATE OR REPLACE FUNCTION redeem_gift_card(
    p_code VARCHAR,
    p_amount NUMERIC,
    p_merchant_id UUID
) RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    remaining_balance NUMERIC,
    redemption_id UUID
) AS $$
DECLARE
    v_card gift_cards%ROWTYPE;
    v_redemption_id UUID;
BEGIN
    -- Step 1: Lock the card row with FOR UPDATE
    -- This prevents any other transaction from reading or modifying this row
    -- until we commit or rollback.
    SELECT * INTO v_card
    FROM gift_cards
    WHERE code = p_code
    FOR UPDATE;

    -- Card not found
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Gift card not found'::TEXT, 0::NUMERIC, NULL::UUID;
        RETURN;
    END IF;

    -- Card not active
    IF v_card.status != 'active' THEN
        RETURN QUERY SELECT FALSE, ('Gift card is ' || v_card.status)::TEXT, v_card.current_balance, NULL::UUID;
        RETURN;
    END IF;

    -- Card belongs to a different merchant
    IF v_card.merchant_id != p_merchant_id THEN
        RETURN QUERY SELECT FALSE, 'Gift card does not belong to this merchant'::TEXT, 0::NUMERIC, NULL::UUID;
        RETURN;
    END IF;

    -- Insufficient balance
    IF v_card.current_balance < p_amount THEN
        RETURN QUERY SELECT FALSE, ('Insufficient balance. Available: $' || v_card.current_balance::TEXT)::TEXT, v_card.current_balance, NULL::UUID;
        RETURN;
    END IF;

    -- Step 2: Deduct the balance
    UPDATE gift_cards
    SET current_balance = current_balance - p_amount,
        status = CASE WHEN current_balance - p_amount = 0 THEN 'redeemed' ELSE 'active' END,
        updated_at = NOW()
    WHERE id = v_card.id;

    -- Step 3: Insert redemption record
    INSERT INTO redemptions (gift_card_id, merchant_id, amount, balance_before, balance_after)
    VALUES (v_card.id, p_merchant_id, p_amount, v_card.current_balance, v_card.current_balance - p_amount)
    RETURNING id INTO v_redemption_id;

    -- All three steps are in one transaction — atomic commit
    RETURN QUERY SELECT TRUE, 'Redemption successful'::TEXT, (v_card.current_balance - p_amount)::NUMERIC, v_redemption_id;
END;
$$ LANGUAGE plpgsql;
