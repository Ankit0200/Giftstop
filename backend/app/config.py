import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/giftlocal"
    )
    STRIPE_SECRET_KEY: str = os.getenv("STRIPE_SECRET_KEY", "sk_test_xxx")
    STRIPE_WEBHOOK_SECRET: str = os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_xxx")
    PLATFORM_FEE_PERCENT: float = float(os.getenv("PLATFORM_FEE_PERCENT", "5.0"))
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    RESEND_API_KEY: str = os.getenv("RESEND_API_KEY", "")


settings = Settings()
