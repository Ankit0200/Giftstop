# GiftLocal

Gift card platform for small local shops. Customers buy digital gift cards, shops redeem them — the platform takes a small commission.

## Quick Start

### 1. Database (PostgreSQL)

```bash
createdb giftlocal
psql giftlocal < backend/sql/schema.sql
```

### 2. Backend (FastAPI)

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Copy and fill in your keys
cp .env.example .env
# Edit .env with your Stripe test keys and DB URL

# Seed a demo merchant
python -m app.seed

# Run the server
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend (Next.js)

```bash
cd frontend
npm install

# Copy and fill in your keys
cp .env.example .env.local
# Edit .env.local with your Stripe publishable key

npm run dev
```

Open http://localhost:3000.

## Project Structure

```
backend/
  sql/schema.sql        — PostgreSQL schema + atomic redemption function
  app/
    main.py             — FastAPI app entry point
    config.py           — Environment config
    database.py         — SQLAlchemy engine + session
    models.py           — ORM models (5 tables)
    schemas.py          — Pydantic request/response schemas
    seed.py             — Demo data seeder
    routes/
      merchants.py      — Merchant CRUD
      cards.py          — Buy flow + atomic redemption + balance check

frontend/
  src/app/
    page.tsx            — Buy gift card (Stripe payment)
    redeem/page.tsx     — Redeem gift card (merchant-facing)
    balance/page.tsx    — Check gift card balance
```

## The Redemption Transaction (Key Technical Decision)

Gift cards are money. The redemption must be atomic to prevent double-spend:

```python
# SELECT ... FOR UPDATE locks the row
card = db.query(GiftCard).filter(...).with_for_update().first()

# Validate balance
if card.current_balance < amount:
    raise ...

# Deduct + record — committed together
card.current_balance -= amount
db.add(Redemption(...))
db.commit()
```

Without `FOR UPDATE`, two concurrent $50 redemptions on a $75 card could both read `balance=75`, both pass the check, and drain $100. The row lock serializes access so the second request waits and sees the real balance.

This is why we chose Aurora PostgreSQL over DynamoDB — we need real ACID transactions with row-level locking.
