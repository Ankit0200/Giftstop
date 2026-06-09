"use client";

import { useEffect, useState, use } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface CardInfo {
  code: string;
  original_amount: string;
  current_balance: string;
  status: string;
  merchant_id: string;
  merchant_name: string;
  merchant_slug: string;
  requires_pin: boolean;
}

interface RedeemResult {
  success: boolean;
  message: string;
  remaining_balance?: string;
  redemption_id?: string;
}

export default function RedeemCodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [card, setCard] = useState<CardInfo | null>(null);
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<RedeemResult | null>(null);

  useEffect(() => {
    fetch(`${API}/api/cards/lookup/${code}`)
      .then((r) => {
        if (!r.ok) throw new Error("Card not found");
        return r.json();
      })
      .then(setCard)
      .catch(() => setError("Gift card not found"))
      .finally(() => setLoading(false));
  }, [code]);

  async function handleRedeem(e: React.FormEvent) {
    e.preventDefault();
    if (!card) return;
    setRedeeming(true);
    setError("");

    const redeemAmount = parseFloat(amount);
    if (!redeemAmount || redeemAmount <= 0) {
      setError("Enter a valid amount");
      setRedeeming(false);
      return;
    }

    try {
      const res = await fetch(`${API}/api/cards/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: card.code,
          amount: redeemAmount,
          merchant_id: card.merchant_id,
          pin: pin || undefined,
        }),
      });
      const data = await res.json();
      setResult(data);
      if (!data.success) setError(data.message);
    } catch {
      setError("Redemption failed");
    } finally {
      setRedeeming(false);
    }
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center" style={{ backgroundColor: "var(--color-cream)" }}>
        <div className="flex items-center gap-3" style={{ color: "var(--color-ink-faded)" }}>
          <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: "var(--color-gold)", borderTopColor: "transparent" }} />
          <span style={{ fontFamily: "Fraunces, serif", fontStyle: "italic" }}>Looking up gift card...</span>
        </div>
      </div>
    );
  }

  // Not found
  if (!card) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center" style={{ backgroundColor: "var(--color-cream)" }}>
        <div className="text-center">
          <div className="text-4xl mb-4" style={{ color: "var(--color-gold)", fontFamily: "Fraunces, serif" }}>&#9671;</div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-forest)", fontFamily: "Fraunces, serif" }}>Card Not Found</h1>
          <p className="mt-1" style={{ color: "var(--color-ink-faded)" }}>The code &ldquo;{code}&rdquo; doesn&apos;t match any gift card.</p>
          <a href="/" className="inline-block mt-4 font-medium" style={{ color: "var(--color-gold)" }}>Go Home</a>
        </div>
      </div>
    );
  }

  const balance = Number(card.current_balance);
  const original = Number(card.original_amount);

  // Success
  if (result?.success) {
    const remaining = Number(result.remaining_balance);
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4" style={{ backgroundColor: "var(--color-cream)" }}>
        <div className="max-w-sm w-full text-center anim-scale-up">
          {/* Success stamp */}
          <div className="inline-block anim-stamp mb-6">
            <div className="w-20 h-20 rounded-full border-4 flex items-center justify-center" style={{ borderColor: "var(--color-forest)" }}>
              <svg className="w-8 h-8" style={{ color: "var(--color-forest)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--color-forest)", fontFamily: "Fraunces, serif" }}>Redeemed!</h2>

          <div className="rounded-md p-5 my-6" style={{ backgroundColor: "var(--color-paper)", border: "1px solid var(--color-gold)" }}>
            <p className="text-sm mb-1" style={{ color: "var(--color-ink-faded)" }}>Amount deducted</p>
            <p className="text-3xl font-bold mb-4" style={{ color: "var(--color-rose)", fontFamily: "Fraunces, serif" }}>-${parseFloat(amount).toFixed(2)}</p>
            <div className="h-px w-full mb-4" style={{ backgroundColor: "var(--color-gold)", opacity: 0.3 }} />
            <p className="text-sm mb-1" style={{ color: "var(--color-ink-faded)" }}>Remaining balance</p>
            <p className="text-3xl font-bold" style={{ color: "var(--color-forest)", fontFamily: "Fraunces, serif" }}>${remaining.toFixed(2)}</p>
          </div>

          <p className="text-sm" style={{ color: "var(--color-ink-faded)" }}>Card: <span className="font-mono font-semibold" style={{ color: "var(--color-forest)" }}>{card.code}</span></p>

          <button
            onClick={() => { setResult(null); setAmount(""); setPin(""); }}
            className="mt-6 px-6 py-2.5 rounded-md font-semibold transition-all"
            style={{ backgroundColor: "var(--color-forest)", color: "var(--color-gold-pale)" }}
          >
            Redeem Again
          </button>
        </div>
      </div>
    );
  }

  // Redemption form
  return (
    <div style={{ backgroundColor: "var(--color-cream)" }} className="min-h-[70vh]">
      {/* Header */}
      <div className="relative grain" style={{ backgroundColor: "var(--color-forest)" }}>
        <div className="absolute top-4 left-6 text-sm" style={{ color: "var(--color-gold)", opacity: 0.2, fontFamily: "Fraunces, serif" }}>&#9830;</div>
        <div className="absolute top-4 right-6 text-sm" style={{ color: "var(--color-gold)", opacity: 0.2, fontFamily: "Fraunces, serif" }}>&#9830;</div>
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ backgroundColor: "var(--color-gold)", opacity: 0.3 }} />

        <div className="max-w-sm mx-auto py-10 px-4 text-center">
          <p className="text-xs uppercase tracking-[0.2em] mb-2" style={{ color: "var(--color-gold)" }}>Redeem Gift Card</p>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-gold-pale)", fontFamily: "Fraunces, serif" }}>{card.merchant_name}</h1>
        </div>
      </div>

      <div className="max-w-sm mx-auto px-4 -mt-4 pb-12 relative z-10">
        {/* Card info */}
        <div className="rounded-md p-5 mb-6 relative anim-fade-up" style={{ backgroundColor: "var(--color-paper)", border: "1px solid var(--color-gold)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-wider" style={{ color: "var(--color-gold)" }}>Card Code</p>
              <p className="font-mono text-lg font-bold" style={{ color: "var(--color-forest)" }}>{card.code}</p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold`} style={{
              backgroundColor: card.status === "active" ? "var(--color-forest)" : "var(--color-cream-dark)",
              color: card.status === "active" ? "var(--color-gold-pale)" : "var(--color-ink-faded)",
            }}>{card.status}</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs" style={{ color: "var(--color-ink-faded)" }}>Original</p>
              <p className="text-lg font-bold" style={{ color: "var(--color-ink-light)", fontFamily: "Fraunces, serif" }}>${original.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--color-ink-faded)" }}>Balance</p>
              <p className="text-2xl font-bold" style={{ color: "var(--color-forest)", fontFamily: "Fraunces, serif" }}>${balance.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {card.status !== "active" ? (
          <div className="text-center py-8">
            <p className="font-semibold" style={{ color: "var(--color-ink-faded)", fontFamily: "Fraunces, serif" }}>This card has been fully redeemed.</p>
          </div>
        ) : (
          <form onSubmit={handleRedeem} className="space-y-4 anim-fade-up delay-1">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] block mb-2" style={{ color: "var(--color-gold)" }}>Amount to Redeem</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold" style={{ color: "var(--color-forest)", fontFamily: "Fraunces, serif" }}>$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  max={balance}
                  required
                  className="w-full border rounded-md pl-10 pr-4 py-3 text-lg font-bold"
                  style={{ borderColor: "var(--color-gold)", color: "var(--color-forest)", backgroundColor: "var(--color-cream)", fontFamily: "Fraunces, serif" }}
                />
              </div>
              <div className="flex gap-2 mt-2">
                {[balance, Math.min(balance, 10), Math.min(balance, 25)].filter((v, i, a) => a.indexOf(v) === i && v > 0).map((v) => (
                  <button key={v} type="button" onClick={() => setAmount(v.toFixed(2))}
                    className="px-3 py-1 rounded-md text-xs font-semibold transition-all"
                    style={{ border: "1px solid var(--color-gold)", color: "var(--color-forest)", backgroundColor: amount === v.toFixed(2) ? "var(--color-gold-pale)" : "transparent" }}
                  >
                    {v === balance ? "Full balance" : `$${v.toFixed(2)}`}
                  </button>
                ))}
              </div>
            </div>

            {card.requires_pin && (
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] block mb-2" style={{ color: "var(--color-gold)" }}>Merchant PIN</label>
                <input
                  type="text"
                  value={pin}
                  onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 4); setPin(v); }}
                  placeholder="&#9679; &#9679; &#9679; &#9679;"
                  maxLength={4}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  className="w-full border rounded-md px-4 py-3 font-mono text-xl tracking-[0.5em] text-center"
                  style={{ borderColor: "var(--color-gold)", color: "var(--color-forest)", backgroundColor: "var(--color-cream)" }}
                />
                <p className="text-xs mt-1" style={{ color: "var(--color-ink-faded)" }}>Enter the 4-digit PIN set during shop registration</p>
              </div>
            )}

            {error && (
              <div className="rounded-md p-3 text-sm" style={{ backgroundColor: "rgba(196,93,74,0.08)", border: "1px solid var(--color-rose)", color: "var(--color-rose)" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={redeeming}
              className="w-full py-3.5 rounded-md font-bold text-lg disabled:opacity-50 transition-all"
              style={{ backgroundColor: "var(--color-forest)", color: "var(--color-gold-pale)" }}
            >
              {redeeming ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "var(--color-gold-pale)", borderTopColor: "transparent" }} />
                  Redeeming...
                </span>
              ) : (
                `Redeem ${amount ? `$${parseFloat(amount).toFixed(2)}` : ""}`
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
