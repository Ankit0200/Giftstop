"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RedeemPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = code.trim().toUpperCase();
    if (!cleaned) {
      setError("Please enter a gift card code");
      return;
    }
    router.push(`/redeem/${cleaned}`);
  }

  return (
    <div style={{ backgroundColor: "var(--color-cream)" }} className="min-h-[80vh]">
      {/* Header */}
      <div className="relative grain" style={{ backgroundColor: "var(--color-forest)" }}>
        <div className="absolute top-4 left-6 text-sm" style={{ color: "var(--color-gold)", opacity: 0.2, fontFamily: "Fraunces, serif" }}>&#9830;</div>
        <div className="absolute top-4 right-6 text-sm" style={{ color: "var(--color-gold)", opacity: 0.2, fontFamily: "Fraunces, serif" }}>&#9830;</div>
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ backgroundColor: "var(--color-gold)", opacity: 0.3 }} />

        <div className="max-w-sm mx-auto py-12 px-4 text-center">
          <p className="text-xs uppercase tracking-[0.2em] mb-3" style={{ color: "var(--color-gold)" }}>For Shop Owners</p>
          <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--color-gold-pale)", fontFamily: "Fraunces, serif" }}>Redeem a Gift Card</h1>
          <p style={{ color: "var(--color-gold)", opacity: 0.7, fontFamily: "Fraunces, serif", fontStyle: "italic" }}>Scan the customer&apos;s QR code or enter the card code below</p>
        </div>
      </div>

      <div className="max-w-sm mx-auto px-4 -mt-4 pb-12 relative z-10">
        {/* QR scan prompt */}
        <div className="rounded-md p-6 mb-6 text-center anim-fade-up" style={{ backgroundColor: "var(--color-paper)", border: "1px solid var(--color-gold)" }}>
          <div className="w-16 h-16 rounded-md flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "var(--color-forest)" }}>
            <svg className="w-8 h-8" style={{ color: "var(--color-gold)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
            </svg>
          </div>
          <p className="font-semibold mb-1" style={{ color: "var(--color-forest)", fontFamily: "Fraunces, serif" }}>Scan QR Code</p>
          <p className="text-sm" style={{ color: "var(--color-ink-faded)" }}>
            Use your phone camera to scan the customer&apos;s QR code. It will open the redemption page automatically.
          </p>
        </div>

        {/* Divider */}
        <div className="rule-ornament text-xs uppercase tracking-[0.15em] mb-6" style={{ fontFamily: "Fraunces, serif", color: "var(--color-gold)" }}>or enter code manually</div>

        {/* Manual code entry */}
        <form onSubmit={handleSubmit} className="space-y-4 anim-fade-up delay-2">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] block mb-2" style={{ color: "var(--color-gold)" }}>Gift Card Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(""); }}
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
            className="w-full py-3.5 rounded-md font-bold text-lg transition-all hover:-translate-y-0.5"
            style={{ backgroundColor: "var(--color-forest)", color: "var(--color-gold-pale)" }}
          >
            Look Up Card
          </button>
        </form>
      </div>
    </div>
  );
}
