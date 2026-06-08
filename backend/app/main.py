from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.routes import merchants, cards

# Create tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="GiftLocal API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(merchants.router)
app.include_router(cards.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
