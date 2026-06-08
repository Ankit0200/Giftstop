"""Seed script: creates a demo merchant so the buy flow works immediately."""
from app.database import SessionLocal, engine, Base
from app.models import Merchant

Base.metadata.create_all(bind=engine)

db = SessionLocal()

if not db.query(Merchant).filter(Merchant.slug == "joes-coffee").first():
    demo = Merchant(
        name="Joe's Coffee",
        slug="joes-coffee",
        email="joe@example.com",
        brand_color="#8B4513",
        address="123 Main St, Anytown USA",
    )
    db.add(demo)
    db.commit()
    print(f"Created demo merchant: {demo.name} (id={demo.id})")
else:
    print("Demo merchant already exists")

db.close()
