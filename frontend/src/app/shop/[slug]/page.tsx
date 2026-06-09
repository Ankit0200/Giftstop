"use client";

import { useEffect, useState, use } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { QRCodeSVG } from "qrcode.react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

interface Merchant {
  id: string;
  name: string;
  slug: string;
  brand_color: string;
  logo_url: string | null;
}

interface BuyResponse {
  purchase_id: string;
  gift_card_code: string;
  amount: number;
  stripe_client_secret: string;
  merchant_name: string;
}

const PRESET_AMOUNTS = [25, 50, 75, 100];

function CheckoutForm({
  clientSecret,
  giftCardCode,
  amount,
  merchantName,
  onComplete,
}: {
  clientSecret: string;
  giftCardCode: string;
  amount: number;
  merchantName: string;
  onComplete: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPaying(true);
    setError("");

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: "if_required",
    });

    if (stripeError) {
      setError(stripeError.message || "Payment failed");
      setPaying(false);
    } else {
      await fetch(`${API}/api/cards/confirm-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_intent_id: clientSecret.split("_secret_")[0],
        }),
      });
      onComplete();
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4" style={{ backgroundColor: "var(--color-cream)" }}>
      <div className="max-w-md w-full anim-fade-up">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold" style={{ color: "var(--color-forest)", fontFamily: "Fraunces, serif" }}>Complete Payment</h2>
          <p className="mt-1" style={{ color: "var(--color-ink-faded)", fontFamily: "Fraunces, serif", fontStyle: "italic" }}>Secure checkout powered by Stripe</p>
        </div>

        {/* Order summary — gift card style */}
        <div className="relative rounded-md p-6 mb-6 grain" style={{ backgroundColor: "var(--color-forest)" }}>
          {/* Corner ornaments */}
          <div className="absolute top-2 left-3 text-xs" style={{ color: "var(--color-gold)", opacity: 0.4 }}>&#9830;</div>
          <div className="absolute top-2 right-3 text-xs" style={{ color: "var(--color-gold)", opacity: 0.4 }}>&#9830;</div>
          <div className="absolute bottom-2 left-3 text-xs" style={{ color: "var(--color-gold)", opacity: 0.4 }}>&#9830;</div>
          <div className="absolute bottom-2 right-3 text-xs" style={{ color: "var(--color-gold)", opacity: 0.4 }}>&#9830;</div>

          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: "var(--color-gold)", fontFamily: "Fraunces, serif", fontStyle: "italic" }}>Gift card for {merchantName}</p>
              <p className="text-3xl font-bold mt-1" style={{ color: "var(--color-gold-pale)", fontFamily: "Fraunces, serif" }}>${amount}.00</p>
            </div>
            <div className="rounded-md px-4 py-3 text-center" style={{ border: "1px dashed var(--color-gold)", borderStyle: "dashed" }}>
              <p className="text-xs uppercase tracking-wider" style={{ color: "var(--color-gold)", opacity: 0.7 }}>Code</p>
              <p className="font-mono font-bold text-sm" style={{ color: "var(--color-gold-pale)" }}>{giftCardCode}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-md p-4" style={{ backgroundColor: "var(--color-paper)", border: "1px solid var(--color-gold)" }}>
            <PaymentElement />
          </div>
          {error && (
            <div className="rounded-md p-3 text-sm flex items-center gap-2" style={{ backgroundColor: "#fef2f2", border: "1px solid var(--color-rose)", color: "var(--color-rose)" }}>
              <span style={{ fontFamily: "Fraunces, serif" }}>!</span>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={!stripe || paying}
            className="w-full py-3.5 rounded-md font-semibold disabled:opacity-50 transition-all"
            style={{ backgroundColor: "var(--color-forest)", color: "var(--color-gold-pale)" }}
          >
            {paying ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "var(--color-gold-pale)", borderTopColor: "transparent" }} />
                Processing...
              </span>
            ) : (
              `Pay $${amount}.00`
            )}
          </button>
          <div className="flex items-center justify-center gap-1.5 text-xs" style={{ color: "var(--color-ink-faded)" }}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            Secured with 256-bit SSL encryption
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ShopPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [amount, setAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [message, setMessage] = useState("");
  const [buyResponse, setBuyResponse] = useState<BuyResponse | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/merchants/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setMerchant)
      .catch(() => setNotFound(true));
  }, [slug]);

  if (notFound) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center" style={{ backgroundColor: "var(--color-cream)" }}>
        <div className="text-center">
          <div className="text-4xl mb-4" style={{ color: "var(--color-gold)", fontFamily: "Fraunces, serif" }}>&#9671;</div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--color-forest)", fontFamily: "Fraunces, serif" }}>Shop Not Found</h1>
          <p className="mt-1" style={{ color: "var(--color-ink-faded)" }}>This shop doesn&apos;t exist or is no longer active.</p>
          <a href="/" className="inline-block mt-4 font-medium" style={{ color: "var(--color-gold)", fontFamily: "Fraunces, serif" }}>Browse all shops</a>
        </div>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center" style={{ backgroundColor: "var(--color-cream)" }}>
        <div className="flex items-center gap-3" style={{ color: "var(--color-ink-faded)" }}>
          <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: "var(--color-gold)", borderTopColor: "transparent" }} />
          <span style={{ fontFamily: "Fraunces, serif", fontStyle: "italic" }}>Loading...</span>
        </div>
      </div>
    );
  }

  async function handleBuy(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const finalAmount = customAmount ? parseFloat(customAmount) : amount;
    if (finalAmount < 5 || finalAmount > 500) {
      setError("Amount must be between $5 and $500");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API}/api/cards/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant_id: merchant!.id,
          amount: finalAmount,
          buyer_email: buyerEmail,
          buyer_name: buyerName || undefined,
          recipient_email: recipientEmail || undefined,
          recipient_name: recipientName || undefined,
          message: message || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Purchase failed");
      }

      const data = await res.json();
      setBuyResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Purchase failed");
    } finally {
      setLoading(false);
    }
  }

  // ── Success Screen ──────────────────────────────────────────────────────
  if (success && buyResponse) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4" style={{ backgroundColor: "var(--color-cream)" }}>
        <div className="max-w-md w-full text-center space-y-6 anim-fade-up">
          {/* Gift card visual */}
          <div className="relative anim-scale-up delay-1">
            <div className="rounded-md p-8 overflow-hidden relative grain" style={{ backgroundColor: "var(--color-forest)" }}>
              {/* Corner ornaments */}
              <div className="absolute top-3 left-4 text-sm" style={{ color: "var(--color-gold)", opacity: 0.3 }}>&#9830;</div>
              <div className="absolute top-3 right-4 text-sm" style={{ color: "var(--color-gold)", opacity: 0.3 }}>&#9830;</div>
              <div className="absolute bottom-3 left-4 text-sm" style={{ color: "var(--color-gold)", opacity: 0.3 }}>&#9830;</div>
              <div className="absolute bottom-3 right-4 text-sm" style={{ color: "var(--color-gold)", opacity: 0.3 }}>&#9830;</div>

              {/* Gold border inset */}
              <div className="absolute inset-2 rounded-sm" style={{ border: "1px solid var(--color-gold)", opacity: 0.2 }} />

              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-md flex items-center justify-center" style={{ backgroundColor: "var(--color-gold)" }}>
                      <span className="text-lg font-bold" style={{ color: "var(--color-forest)", fontFamily: "Fraunces, serif" }}>{merchant.name[0]}</span>
                    </div>
                    <span className="font-semibold" style={{ color: "var(--color-gold-pale)", fontFamily: "Fraunces, serif" }}>{merchant.name}</span>
                  </div>
                  <span className="text-sm" style={{ color: "var(--color-gold)", fontFamily: "Fraunces, serif", fontStyle: "italic" }}>Gift Card</span>
                </div>

                <p className="text-4xl font-bold" style={{ color: "var(--color-gold-pale)", fontFamily: "Fraunces, serif" }}>${buyResponse.amount}.00</p>

                <div className="mt-6 rounded-md p-4 text-center" style={{ border: "1px dashed var(--color-gold)" }}>
                  <p className="text-xs uppercase tracking-wider mb-3" style={{ color: "var(--color-gold)", opacity: 0.7 }}>Scan to Redeem</p>
                  <div className="flex justify-center mb-3">
                    <div className="p-2 rounded-md" style={{ backgroundColor: "var(--color-gold-pale)" }}>
                      <QRCodeSVG
                        value={`${typeof window !== "undefined" ? window.location.origin : ""}/redeem/${buyResponse.gift_card_code}`}
                        size={140}
                        fgColor="#1a3a2a"
                        bgColor="#f5ecd7"
                        level="M"
                      />
                    </div>
                  </div>
                  <p className="font-mono font-bold tracking-wider text-sm" style={{ color: "var(--color-gold-pale)" }}>
                    {buyResponse.gift_card_code}
                  </p>
                </div>
              </div>
            </div>

            {/* Stamp */}
            <div className="absolute -top-3 -right-3 anim-stamp delay-3">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--color-gold)", border: "3px solid var(--color-forest)" }}>
                <span className="text-xs font-bold uppercase text-center leading-tight" style={{ color: "var(--color-forest)", fontFamily: "Fraunces, serif" }}>Paid</span>
              </div>
            </div>
          </div>

          <div className="anim-fade-up delay-2">
            <h2 className="text-xl font-bold" style={{ color: "var(--color-forest)", fontFamily: "Fraunces, serif" }}>Purchase Successful!</h2>
            <p className="mt-1" style={{ color: "var(--color-ink-light)", fontFamily: "Fraunces, serif", fontStyle: "italic" }}>
              Present this code at {merchant.name} to redeem your gift card.
            </p>
          </div>

          <div className="flex gap-3 justify-center anim-fade-up delay-3">
            <button
              onClick={() => { setBuyResponse(null); setSuccess(false); }}
              className="px-6 py-2.5 rounded-md font-semibold transition-all"
              style={{ backgroundColor: "var(--color-forest)", color: "var(--color-gold-pale)" }}
            >
              Buy Another
            </button>
            <a
              href="/balance"
              className="px-6 py-2.5 rounded-md font-semibold transition-colors"
              style={{ border: "1px solid var(--color-gold)", color: "var(--color-forest)" }}
            >
              Check Balance
            </a>
          </div>

          <p className="text-xs anim-fade-up delay-4" style={{ color: "var(--color-ink-faded)" }}>
            A copy has been saved. You can check your balance anytime.
          </p>
        </div>
      </div>
    );
  }

  // ── Payment Screen ──────────────────────────────────────────────────────
  if (buyResponse) {
    return (
      <Elements
        stripe={stripePromise}
        options={{ clientSecret: buyResponse.stripe_client_secret }}
      >
        <CheckoutForm
          clientSecret={buyResponse.stripe_client_secret}
          giftCardCode={buyResponse.gift_card_code}
          amount={buyResponse.amount}
          merchantName={merchant.name}
          onComplete={() => setSuccess(true)}
        />
      </Elements>
    );
  }

  // ── Buy Form ────────────────────────────────────────────────────────────
  return (
    <div style={{ backgroundColor: "var(--color-cream)" }}>
      {/* Hero Header */}
      <div className="relative overflow-hidden grain" style={{ backgroundColor: "var(--color-forest)" }}>
        {/* Corner ornaments */}
        <div className="absolute top-4 left-6 text-sm" style={{ color: "var(--color-gold)", opacity: 0.2, fontFamily: "Fraunces, serif" }}>&#9830;</div>
        <div className="absolute top-4 right-6 text-sm" style={{ color: "var(--color-gold)", opacity: 0.2, fontFamily: "Fraunces, serif" }}>&#9830;</div>
        {/* Gold line accent at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ backgroundColor: "var(--color-gold)", opacity: 0.3 }} />

        <div className="max-w-lg mx-auto py-12 px-4 relative">
          <div className="flex items-center gap-4 mb-4 anim-fade-up">
            {merchant.logo_url ? (
              <img
                src={merchant.logo_url}
                alt={merchant.name}
                className="w-16 h-16 rounded-md object-cover shadow-lg"
                style={{ border: "2px solid var(--color-gold)" }}
              />
            ) : (
              <div className="w-16 h-16 rounded-md flex items-center justify-center shadow-lg" style={{ backgroundColor: "var(--color-gold)" }}>
                <span className="text-2xl font-bold" style={{ color: "var(--color-forest)", fontFamily: "Fraunces, serif" }}>{merchant.name[0]}</span>
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold" style={{ color: "var(--color-gold-pale)", fontFamily: "Fraunces, serif" }}>{merchant.name}</h1>
              <p className="mt-0.5" style={{ color: "var(--color-gold)", opacity: 0.8, fontFamily: "Fraunces, serif", fontStyle: "italic" }}>Send a gift card to someone special</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="max-w-lg mx-auto px-4 -mt-4 pb-12 relative z-10">
        <div className="rounded-md p-6 md:p-8 anim-fade-up delay-1" style={{ backgroundColor: "var(--color-paper)", border: "1px solid var(--color-gold)" }}>
          <form onSubmit={handleBuy} className="space-y-6">
            {/* Amount */}
            <div>
              <label className="block text-sm font-semibold mb-3" style={{ color: "var(--color-forest)", fontFamily: "Fraunces, serif" }}>
                Choose Amount
              </label>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {PRESET_AMOUNTS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => { setAmount(a); setCustomAmount(""); }}
                    className="py-3 rounded-md font-semibold text-lg transition-all"
                    style={
                      amount === a && !customAmount
                        ? { backgroundColor: "var(--color-forest)", color: "var(--color-gold-pale)", border: "1px solid var(--color-forest)" }
                        : { backgroundColor: "var(--color-cream)", color: "var(--color-forest)", border: "1px solid var(--color-gold)", fontFamily: "Fraunces, serif" }
                    }
                  >
                    ${a}
                  </button>
                ))}
              </div>
              <input
                type="number"
                placeholder="Or enter custom amount ($5 - $500)"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                min={5}
                max={500}
                step="0.01"
                className="w-full rounded-md px-4 py-2.5 transition-colors"
                style={{ backgroundColor: "var(--color-cream)", border: "1px solid var(--color-gold)", color: "var(--color-forest)" }}
              />
            </div>

            {/* Divider */}
            <div className="rule-ornament text-xs uppercase tracking-wider" style={{ fontFamily: "Fraunces, serif" }}>Your details</div>

            {/* Buyer Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-gold)" }}>
                  Your Email
                </label>
                <input
                  type="email"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  required
                  placeholder="you@email.com"
                  className="w-full rounded-md px-4 py-2.5"
                  style={{ backgroundColor: "var(--color-cream)", border: "1px solid var(--color-gold)", color: "var(--color-forest)" }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-gold)" }}>
                  Your Name
                </label>
                <input
                  type="text"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full rounded-md px-4 py-2.5"
                  style={{ backgroundColor: "var(--color-cream)", border: "1px solid var(--color-gold)", color: "var(--color-forest)" }}
                />
              </div>
            </div>

            {/* Divider */}
            <div className="rule-ornament text-xs uppercase tracking-wider" style={{ fontFamily: "Fraunces, serif" }}>Recipient (optional)</div>

            {/* Recipient */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-gold)" }}>
                  Their Email
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="friend@email.com"
                  className="w-full rounded-md px-4 py-2.5"
                  style={{ backgroundColor: "var(--color-cream)", border: "1px solid var(--color-gold)", color: "var(--color-forest)" }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-gold)" }}>
                  Their Name
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full rounded-md px-4 py-2.5"
                  style={{ backgroundColor: "var(--color-cream)", border: "1px solid var(--color-gold)", color: "var(--color-forest)" }}
                />
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-gold)" }}>
                Personal Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Happy birthday! Enjoy a treat on me."
                className="w-full rounded-md px-4 py-2.5 resize-none"
                style={{ backgroundColor: "var(--color-cream)", border: "1px solid var(--color-gold)", color: "var(--color-forest)" }}
              />
            </div>

            {error && (
              <div className="rounded-md p-3 text-sm flex items-center gap-2" style={{ backgroundColor: "#fef2f2", border: "1px solid var(--color-rose)", color: "var(--color-rose)" }}>
                <span style={{ fontFamily: "Fraunces, serif" }}>!</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-md font-semibold disabled:opacity-50 transition-all text-lg"
              style={{ backgroundColor: "var(--color-forest)", color: "var(--color-gold-pale)" }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: "var(--color-gold-pale)", borderTopColor: "transparent" }} />
                  Creating...
                </span>
              ) : (
                `Buy $${customAmount || amount} Gift Card`
              )}
            </button>

            {/* Trust signals */}
            <div className="flex items-center justify-center gap-5 text-xs pt-2" style={{ color: "var(--color-ink-faded)" }}>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                Secure payment
              </span>
              <span style={{ color: "var(--color-gold)", opacity: 0.3 }}>&middot;</span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                Stripe protected
              </span>
              <span style={{ color: "var(--color-gold)", opacity: 0.3 }}>&middot;</span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
                Support local
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
