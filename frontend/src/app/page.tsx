"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Merchant {
  id: string;
  name: string;
  slug: string;
  brand_color: string;
}

export default function HomePage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/merchants/`)
      .then((r) => r.json())
      .then(setMerchants)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ backgroundColor: "var(--color-cream)" }}>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden grain" style={{ backgroundColor: "var(--color-forest)" }}>
        {/* Corner ornaments */}
        <div className="absolute top-6 left-8 text-lg" style={{ color: "var(--color-gold)", opacity: 0.15, fontFamily: "Fraunces, serif" }}>&#9830;</div>
        <div className="absolute top-6 right-8 text-lg" style={{ color: "var(--color-gold)", opacity: 0.15, fontFamily: "Fraunces, serif" }}>&#9830;</div>
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ backgroundColor: "var(--color-gold)", opacity: 0.3 }} />

        <div className="max-w-4xl mx-auto px-6 py-20 md:py-28 text-center relative">
          <p className="text-xs uppercase tracking-[0.3em] mb-4 anim-fade-up" style={{ color: "var(--color-gold)" }}>
            Gift Cards for the Shops You Love
          </p>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6 anim-fade-up delay-1" style={{ color: "var(--color-gold-pale)", fontFamily: "Fraunces, serif" }}>
            Support Local.<br />Gift&nbsp;Beautifully.
          </h1>
          <p className="text-lg md:text-xl max-w-xl mx-auto mb-10 anim-fade-up delay-2" style={{ color: "var(--color-gold)", opacity: 0.8, fontFamily: "Fraunces, serif", fontStyle: "italic" }}>
            Buy digital gift cards for your favorite local shops &mdash; cafés, salons, bakeries &amp; more. Delivered instantly, redeemed with a&nbsp;scan.
          </p>
          <div className="flex gap-4 justify-center anim-fade-up delay-3">
            <a href="#shops" className="px-8 py-3 rounded-md font-semibold text-lg transition-all hover:-translate-y-0.5" style={{ backgroundColor: "var(--color-gold)", color: "var(--color-forest)" }}>
              Browse Shops
            </a>
            <a href="/merchant/onboard" className="px-8 py-3 rounded-md font-semibold text-lg transition-all hover:-translate-y-0.5" style={{ border: "1px solid var(--color-gold)", color: "var(--color-gold)" }}>
              List Your Shop
            </a>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <p className="rule-ornament text-[10px] font-bold uppercase tracking-[0.25em] mb-10 max-w-xs mx-auto text-center" style={{ color: "var(--color-gold)" }}>
          How It Works
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { num: "I", title: "Pick a Shop", desc: "Browse local shops on GiftStop and choose one you love." },
            { num: "II", title: "Buy a Gift Card", desc: "Choose an amount, pay securely with Stripe, and get a QR code instantly." },
            { num: "III", title: "They Redeem", desc: "The recipient shows the QR code at the shop. One scan and it's done." },
          ].map((step, i) => (
            <div key={step.num} className="text-center anim-fade-up" style={{ animationDelay: `${i * 0.15}s` }}>
              <div className="w-14 h-14 rounded-md mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: "var(--color-forest)" }}>
                <span className="text-sm font-bold" style={{ color: "var(--color-gold)", fontFamily: "Fraunces, serif", fontStyle: "italic" }}>{step.num}</span>
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: "var(--color-forest)", fontFamily: "Fraunces, serif" }}>{step.title}</h3>
              <p className="text-sm" style={{ color: "var(--color-ink-light)" }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SHOPS ─────────────────────────────────────────────── */}
      <section id="shops" className="max-w-4xl mx-auto px-6 pb-20">
        <p className="rule-ornament text-[10px] font-bold uppercase tracking-[0.25em] mb-10 max-w-xs mx-auto text-center" style={{ color: "var(--color-gold)" }}>
          Local Shops
        </p>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-6 h-6 border-2 rounded-full animate-spin mx-auto" style={{ borderColor: "var(--color-gold)", borderTopColor: "transparent" }} />
            <p className="text-sm mt-3" style={{ color: "var(--color-ink-faded)", fontFamily: "Fraunces, serif", fontStyle: "italic" }}>Loading shops...</p>
          </div>
        ) : merchants.length === 0 ? (
          <div className="text-center py-16 rounded-md" style={{ border: "1px dashed var(--color-gold)" }}>
            <div className="text-4xl mb-4" style={{ color: "var(--color-gold)", fontFamily: "Fraunces, serif" }}>&#9671;</div>
            <p className="font-semibold mb-1" style={{ color: "var(--color-forest)", fontFamily: "Fraunces, serif" }}>No shops yet</p>
            <p className="text-sm mb-4" style={{ color: "var(--color-ink-faded)" }}>Be the first to list your shop on GiftStop.</p>
            <a href="/merchant/onboard" className="px-6 py-2.5 rounded-md font-semibold text-sm transition-all" style={{ backgroundColor: "var(--color-forest)", color: "var(--color-gold-pale)" }}>
              List Your Shop
            </a>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {merchants.map((m, i) => (
              <a
                key={m.id}
                href={`/shop/${m.slug}`}
                className="group rounded-md overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg anim-fade-up"
                style={{ backgroundColor: "var(--color-paper)", border: "1px solid var(--color-gold)", animationDelay: `${i * 0.1}s` }}
              >
                {/* Color banner */}
                <div className="h-20 relative grain" style={{ backgroundColor: "var(--color-forest)" }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold" style={{ color: "var(--color-gold)", fontFamily: "Fraunces, serif", opacity: 0.3 }}>{m.name[0]}</span>
                  </div>
                  {/* Corner ornaments */}
                  <div className="absolute top-2 left-3 text-[8px]" style={{ color: "var(--color-gold)", opacity: 0.3 }}>&#9830;</div>
                  <div className="absolute top-2 right-3 text-[8px]" style={{ color: "var(--color-gold)", opacity: 0.3 }}>&#9830;</div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--color-gold)" }}>
                      <span className="text-sm font-bold" style={{ color: "var(--color-forest)", fontFamily: "Fraunces, serif" }}>{m.name[0]}</span>
                    </div>
                    <div>
                      <h3 className="font-bold group-hover:underline" style={{ color: "var(--color-forest)", fontFamily: "Fraunces, serif" }}>{m.name}</h3>
                      <p className="text-xs" style={{ color: "var(--color-ink-faded)" }}>Buy a gift card &rarr;</p>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
