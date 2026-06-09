"use client";

import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface BalanceInfo {
  code: string;
  original_amount: number;
  current_balance: number;
  status: string;
  merchant_name: string;
  created_at: string;
}

export default function BalancePage() {
  const [code, setCode] = useState("");
  const [balance, setBalance] = useState<BalanceInfo | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setBalance(null);

    try {
      const res = await fetch(
        `${API}/api/cards/balance/${code.trim().toUpperCase()}`
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Card not found");
      }
      setBalance(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Card not found");
    } finally {
      setLoading(false);
    }
  }

  const bal = balance ? Number(balance.current_balance) : 0;
  const orig = balance ? Number(balance.original_amount) : 0;
  const pct = orig > 0 ? (bal / orig) * 100 : 0;

  return (
    <div style={{ backgroundColor: "var(--color-cream)" }} className="min-h-[80vh]">
      {/* Header */}
      <div className="relative grain" style={{ backgroundColor: "var(--color-forest)" }}>
        <div className="absolute top-4 left-6 text-sm" style={{ color: "var(--color-gold)", opacity: 0.2, fontFamily: "Fraunces, serif" }}>&#9830;</div>
        <div className="absolute top-4 right-6 text-sm" style={{ color: "var(--color-gold)", opacity: 0.2, fontFamily: "Fraunces, serif" }}>&#9830;</div>
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ backgroundColor: "var(--color-gold)", opacity: 0.3 }} />

        <div className="max-w-sm mx-auto py-12 px-4 text-center">
          <p className="text-xs uppercase tracking-[0.2em] mb-3" style={{ color: "var(--color-gold)" }}>Gift Card</p>
          <h1 className="text-3xl font-bold" style={{ color: "var(--color-gold-pale)", fontFamily: "Fraunces, serif" }}>Check Balance</h1>
        </div>
      </div>

      <div className="max-w-sm mx-auto px-4 -mt-4 pb-12 relative z-10">
        {/* Search form */}
        <form onSubmit={handleCheck} className="space-y-4 anim-fade-up">
          <div className="rounded-md p-5" style={{ backgroundColor: "var(--color-paper)", border: "1px solid var(--color-gold)" }}>
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] block mb-2" style={{ color: "var(--color-gold)" }}>Gift Card Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(""); }}
              required
              placeholder="XXXX-XXXX-XXXX"
              className="w-full border rounded-md px-4 py-3 font-mono text-xl tracking-wider text-center"
              style={{ borderColor: "var(--color-gold)", color: "var(--color-forest)", backgroundColor: "var(--color-cream)" }}
            />
          </div>

          {error && (
            <div className="rounded-md p-3 text-sm" style={{ backgroundColor: "rgba(196,93,74,0.08)", border: "1px solid var(--color-rose)", color: "var(--color-rose)" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-md font-bold text-lg disabled:opacity-50 transition-all hover:-translate-y-0.5"
            style={{ backgroundColor: "var(--color-forest)", color: "var(--color-gold-pale)" }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "var(--color-gold-pale)", borderTopColor: "transparent" }} />
                Checking...
              </span>
            ) : "Check Balance"}
          </button>
        </form>

        {/* Result */}
        {balance && (
          <div className="mt-6 rounded-md overflow-hidden anim-scale-up" style={{ border: "1px solid var(--color-gold)" }}>
            {/* Card header */}
            <div className="p-5 text-center grain" style={{ backgroundColor: "var(--color-forest)" }}>
              <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--color-gold)", fontFamily: "Fraunces, serif", fontStyle: "italic" }}>{balance.merchant_name}</p>
              <p className="text-5xl font-bold my-2" style={{ color: "var(--color-gold-pale)", fontFamily: "Fraunces, serif" }}>
                ${bal.toFixed(2)}
              </p>
              <p className="text-sm" style={{ color: "var(--color-gold)", opacity: 0.7 }}>
                of ${orig.toFixed(2)} original
              </p>
              {/* Balance bar */}
              <div className="mt-4 mx-auto max-w-[200px]">
                <div className="w-full rounded-full h-2 overflow-hidden" style={{ backgroundColor: "rgba(196,151,59,0.2)" }}>
                  <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: "var(--color-gold)" }} />
                </div>
                <p className="text-xs mt-1.5" style={{ color: "var(--color-gold)", opacity: 0.6 }}>{pct.toFixed(0)}% remaining</p>
              </div>
            </div>

            {/* Details */}
            <div className="p-5 space-y-3" style={{ backgroundColor: "var(--color-paper)" }}>
              {[
                { label: "Status", value: balance.status, highlight: balance.status === "active" },
                { label: "Code", value: balance.code, mono: true },
                { label: "Purchased", value: new Date(balance.created_at).toLocaleDateString() },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center text-sm">
                  <span style={{ color: "var(--color-ink-faded)" }}>{row.label}</span>
                  <span
                    className={`font-semibold capitalize ${row.mono ? "font-mono" : ""}`}
                    style={{
                      color: row.highlight ? "var(--color-forest)" : "var(--color-ink-light)",
                    }}
                  >
                    {row.highlight && <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: "var(--color-forest-light)" }} />}
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
