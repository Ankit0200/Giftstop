"""
Simple email utility for gift card delivery.

For the hackathon demo, this logs emails to the console and appends them
to sent_emails.log so we can show judges that emails were "sent".
"""

import logging
from datetime import datetime, timezone
from pathlib import Path

from app.config import settings

logger = logging.getLogger(__name__)

LOG_FILE = Path(__file__).resolve().parent.parent / "sent_emails.log"


def send_gift_card_email(
    recipient_email: str,
    recipient_name: str | None,
    buyer_name: str | None,
    merchant_name: str,
    gift_card_code: str,
    amount: str,
    message: str | None = None,
) -> None:
    """
    Send a gift card delivery email to the recipient.

    In production this would call Resend / SES / etc.
    For the hackathon we log to console + file.
    """
    balance_check_url = f"{settings.FRONTEND_URL}/balance?code={gift_card_code}"
    from_line = buyer_name or "Someone"
    to_line = recipient_name or recipient_email

    subject = f"You received a ${amount} gift card for {merchant_name}!"

    body_lines = [
        f"Hi {to_line},",
        "",
        f"{from_line} sent you a ${amount} gift card for {merchant_name}!",
        "",
    ]

    if message:
        body_lines += [
            "Their message:",
            f'  "{message}"',
            "",
        ]

    body_lines += [
        f"Your gift card code: {gift_card_code}",
        "",
        f"Check your balance anytime: {balance_check_url}",
        "",
        "Present this code at the shop to redeem. Enjoy!",
        "",
        "-- GiftLocal",
    ]

    body = "\n".join(body_lines)

    # ── Build the full log entry ───────────────────────────────────────
    timestamp = datetime.now(timezone.utc).isoformat()
    entry = (
        f"\n{'=' * 60}\n"
        f"GIFT CARD EMAIL  |  {timestamp}\n"
        f"{'=' * 60}\n"
        f"To:      {recipient_email}\n"
        f"Subject: {subject}\n"
        f"{'-' * 60}\n"
        f"{body}\n"
        f"{'=' * 60}\n"
    )

    # Log to console
    logger.info(entry)
    print(entry)  # also print so it shows in uvicorn output

    # Append to file
    with open(LOG_FILE, "a") as f:
        f.write(entry)
