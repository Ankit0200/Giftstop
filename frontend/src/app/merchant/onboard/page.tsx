"use client";

import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function MerchantOnboardPage() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [brandColor, setBrandColor] = useState("#1a3a2a");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [pin, setPin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ slug: string; name: string } | null>(null);

  function autoSlug(v: string) {
    return v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/merchants/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug: slug || autoSlug(name), email, brand_color: brandColor, phone: phone || undefined, address: address || undefined, pin: pin || undefined, password: password || undefined }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || "Failed"); }
      const m = await res.json();
      // Auto-login the new merchant
      localStorage.setItem("merchant_session", JSON.stringify({ slug: m.slug, name: m.name, id: m.id }));
      setCreated({ slug: m.slug, name: m.name });
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong"); }
    finally { setLoading(false); }
  }

  /* ═══ SUCCESS ═══ */
  if (created) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-6" style={{ backgroundColor: "var(--color-cream)" }}>
        <div className="max-w-lg w-full anim-scale-up text-center">
          {/* Stamp */}
          <div className="inline-block anim-stamp mb-8">
            <div className="w-24 h-24 rounded-full border-4 flex items-center justify-center" style={{ borderColor: "var(--color-forest)" }}>
              <div className="text-center">
                <svg className="w-8 h-8 mx-auto" style={{ color: "var(--color-forest)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-[8px] font-bold uppercase tracking-[0.2em] block mt-0.5" style={{ color: "var(--color-forest)" }}>Approved</span>
              </div>
            </div>
          </div>

          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: "Fraunces, serif", color: "var(--color-forest)" }}>
            Welcome aboard.
          </h1>
          <p className="text-lg mb-10" style={{ color: "var(--color-ink-faded)" }}>
            <span style={{ fontFamily: "Fraunces, serif", fontStyle: "italic" }}>{created.name}</span> is now live on GiftStop.
          </p>

          <div className="rounded-xl p-6 space-y-5 text-left border" style={{ backgroundColor: "var(--color-paper)", borderColor: "var(--color-gold)", borderWidth: "1px" }}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5" style={{ color: "var(--color-gold)" }}>Your Gift Card Page</p>
              <a href={`/shop/${created.slug}`} className="text-lg font-semibold hover:underline break-all" style={{ color: "var(--color-forest)" }}>
                {typeof window !== "undefined" && window.location.origin}/shop/{created.slug}
              </a>
            </div>
            <div className="h-px" style={{ backgroundColor: "var(--color-gold)", opacity: 0.2 }} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5" style={{ color: "var(--color-gold)" }}>Dashboard</p>
              <a href={`/merchant/${created.slug}/dashboard`} className="text-lg font-semibold hover:underline break-all" style={{ color: "var(--color-forest)" }}>
                {typeof window !== "undefined" && window.location.origin}/merchant/{created.slug}/dashboard
              </a>
            </div>
          </div>

          <div className="mt-8 flex gap-3 justify-center">
            <a href={`/shop/${created.slug}`} className="px-8 py-3 rounded-lg font-semibold transition-all hover:-translate-y-0.5" style={{ backgroundColor: "var(--color-forest)", color: "var(--color-gold-pale)" }}>
              View Shop Page
            </a>
            <a href={`/merchant/${created.slug}/dashboard`} className="px-8 py-3 rounded-lg font-semibold border transition-all hover:-translate-y-0.5" style={{ borderColor: "var(--color-forest)", color: "var(--color-forest)" }}>
              Open Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  /* ═══ LANDING PAGE ═══ */
  return (
    <div style={{ backgroundColor: "var(--color-cream)" }}>

      {/* ▸ HERO */}
      <section className="relative overflow-hidden grain" style={{ backgroundColor: "var(--color-forest)" }}>
        <div className="max-w-6xl mx-auto px-6 py-24 lg:py-32 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <div className="anim-fade-up">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-semibold uppercase tracking-[0.15em] mb-8" style={{ borderColor: "rgba(196,151,59,0.3)", color: "var(--color-gold)" }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "var(--color-gold)" }} />
                No monthly fees &middot; Free to start
              </div>

              <h1 className="text-5xl lg:text-[3.5rem] font-bold leading-[1.08] tracking-tight" style={{ fontFamily: "Fraunces, serif", color: "var(--color-cream)" }}>
                Your shop deserves{" "}
                <span className="relative inline-block">
                  a gift card
                  <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" fill="none"><path d="M1 5.5C40 2 60 2 100 4C140 6 160 3 199 5" stroke="var(--color-gold)" strokeWidth="2" strokeLinecap="round" /></svg>
                </span>{" "}
                program.
              </h1>

              <p className="mt-6 text-lg leading-relaxed max-w-md" style={{ color: "rgba(250,247,242,0.6)" }}>
                Customers want to gift your shop but can&apos;t. GiftStop gives you a branded page in 60 seconds. You pay nothing unless we make you a sale.
              </p>

              <div className="mt-10 flex gap-4">
                <a href="#signup" className="px-8 py-3.5 rounded-lg font-bold text-lg transition-all hover:-translate-y-0.5 hover:shadow-xl" style={{ backgroundColor: "var(--color-gold)", color: "var(--color-forest)" }}>
                  Get Started Free
                </a>
                <a href="#how" className="px-8 py-3.5 rounded-lg font-semibold text-lg border transition-all hover:-translate-y-0.5" style={{ borderColor: "rgba(196,151,59,0.3)", color: "var(--color-cream)" }}>
                  How It Works
                </a>
              </div>

              {/* Stats row */}
              <div className="mt-14 flex gap-10">
                {[["5%", "Commission"], ["60s", "Setup"], ["$0", "Monthly"]].map(([v, l]) => (
                  <div key={v}>
                    <p className="text-3xl font-bold" style={{ fontFamily: "Fraunces, serif", color: "var(--color-gold)" }}>{v}</p>
                    <p className="text-xs uppercase tracking-[0.15em] mt-1" style={{ color: "rgba(250,247,242,0.4)" }}>{l}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — floating card */}
            <div className="hidden lg:flex justify-center anim-slide-right delay-3">
              <div className="anim-float relative">
                {/* Card */}
                <div className="w-80 rounded-2xl p-8 shadow-2xl relative overflow-hidden" style={{ backgroundColor: "var(--color-cream)" }}>
                  {/* Corner ornament */}
                  <div className="absolute top-0 right-0 w-20 h-20" style={{ borderBottom: "1px solid var(--color-gold)", borderLeft: "1px solid var(--color-gold)", borderBottomLeftRadius: "16px", opacity: 0.3 }} />
                  <div className="absolute bottom-0 left-0 w-20 h-20" style={{ borderTop: "1px solid var(--color-gold)", borderRight: "1px solid var(--color-gold)", borderTopRightRadius: "16px", opacity: 0.3 }} />

                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: "var(--color-forest)" }}>
                      <span className="text-xs font-bold" style={{ color: "var(--color-gold)", fontFamily: "Fraunces, serif" }}>J</span>
                    </div>
                    <span className="text-sm font-semibold" style={{ color: "var(--color-forest)" }}>Joe&apos;s Coffee</span>
                    <span className="ml-auto text-[9px] uppercase tracking-[0.2em]" style={{ color: "var(--color-gold)" }}>Gift Card</span>
                  </div>

                  <p className="text-5xl font-bold" style={{ fontFamily: "Fraunces, serif", color: "var(--color-forest)" }}>$50</p>
                  <p className="text-xs mt-1" style={{ color: "var(--color-ink-faded)" }}>Redeemable in-store</p>

                  <div className="mt-6 py-3 px-4 rounded-lg text-center border" style={{ borderColor: "var(--color-gold)", borderWidth: "1px", borderStyle: "dashed" }}>
                    <p className="text-[9px] uppercase tracking-[0.2em] mb-1" style={{ color: "var(--color-gold)" }}>Card Code</p>
                    <p className="text-lg font-mono font-bold tracking-[0.1em]" style={{ color: "var(--color-forest)" }}>ABCD-EFGH-1234</p>
                  </div>

                  <p className="text-[10px] text-center mt-4 uppercase tracking-[0.15em]" style={{ color: "var(--color-ink-faded)" }}>Powered by GiftStop</p>
                </div>
                {/* Shadow card */}
                <div className="absolute inset-0 rounded-2xl -rotate-6 -z-10 opacity-20" style={{ backgroundColor: "var(--color-gold)" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom edge */}
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ backgroundColor: "var(--color-gold)", opacity: 0.4 }} />
      </section>

      {/* ▸ MARQUEE TICKER */}
      <section className="overflow-hidden py-4 border-b" style={{ backgroundColor: "var(--color-cream-dark)", borderColor: "var(--color-gold)", borderBottomWidth: "1px", opacity: 1 }}>
        <div className="flex anim-ticker whitespace-nowrap">
          {Array(2).fill(null).map((_, i) => (
            <div key={i} className="flex items-center gap-8 px-4">
              {["Cafes", "Salons", "Bakeries", "Gyms", "Barbers", "Boutiques", "Studios", "Restaurants", "Spas", "Florists"].map((t) => (
                <span key={`${i}-${t}`} className="flex items-center gap-3 text-sm font-medium" style={{ color: "var(--color-ink-faded)" }}>
                  <span className="text-xs" style={{ color: "var(--color-gold)" }}>&#9830;</span>
                  {t}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ▸ FEATURES */}
      <section className="px-6 py-24" style={{ backgroundColor: "var(--color-cream)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="rule-ornament text-[10px] font-bold uppercase tracking-[0.25em] mb-6 max-w-xs mx-auto">Why GiftStop</p>
            <h2 className="text-4xl font-bold" style={{ fontFamily: "Fraunces, serif", color: "var(--color-forest)" }}>
              Everything you need,<br />nothing you don&apos;t.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {[
              { n: "01", title: "Zero upfront cost", desc: "You only pay 5% when a gift card actually sells. No setup fees, no monthly charges, no risk." },
              { n: "02", title: "Live in 60 seconds", desc: "Fill out one form, get a branded gift card page with your colors and name. Share the link anywhere." },
              { n: "03", title: "Bank-grade security", desc: "Stripe handles the money. PCI-compliant, encrypted, with fraud protection built in from day one." },
              { n: "04", title: "Real-time dashboard", desc: "Track every sale, outstanding balance, and redemption as they happen. Know exactly where you stand." },
            ].map((f, i) => (
              <div key={f.n} className={`group p-7 rounded-xl border transition-all hover:-translate-y-1 hover:shadow-lg anim-fade-up delay-${i + 1}`}
                style={{ backgroundColor: "var(--color-paper)", borderColor: "var(--color-gold)", borderWidth: "1px" }}>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] block mb-3" style={{ color: "var(--color-gold)" }}>{f.n}</span>
                <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "Fraunces, serif", color: "var(--color-forest)" }}>{f.title}</h3>
                <p className="leading-relaxed" style={{ color: "var(--color-ink-faded)" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ▸ HOW IT WORKS */}
      <section id="how" className="px-6 py-24 grain" style={{ backgroundColor: "var(--color-forest)" }}>
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] mb-6" style={{ color: "var(--color-gold)" }}>&#9830; &nbsp;How It Works&nbsp; &#9830;</p>
            <h2 className="text-4xl font-bold" style={{ fontFamily: "Fraunces, serif", color: "var(--color-cream)" }}>
              Three steps. That&apos;s it.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { n: "I", title: "Register", desc: "Your shop name, email, brand color. Takes less time than ordering a coffee." },
              { n: "II", title: "Share", desc: "You get a unique URL. Post it on Instagram, tape it to your counter, text it to regulars." },
              { n: "III", title: "Earn", desc: "Customers buy gift cards, money goes to your Stripe account. We take 5%, you keep the rest." },
            ].map((s, i) => (
              <div key={s.n} className={`text-center anim-fade-up delay-${i + 2}`}>
                <div className="w-16 h-16 rounded-full border-2 flex items-center justify-center mx-auto mb-5" style={{ borderColor: "var(--color-gold)" }}>
                  <span className="text-xl font-bold" style={{ fontFamily: "Fraunces, serif", color: "var(--color-gold)" }}>{s.n}</span>
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "Fraunces, serif", color: "var(--color-cream)" }}>{s.title}</h3>
                <p className="leading-relaxed" style={{ color: "rgba(250,247,242,0.5)" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ▸ SIGNUP FORM */}
      <section id="signup" className="px-6 py-24" style={{ backgroundColor: "var(--color-cream)" }}>
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-10">
            <p className="rule-ornament text-[10px] font-bold uppercase tracking-[0.25em] mb-6 max-w-xs mx-auto">Get Started</p>
            <h2 className="text-3xl font-bold" style={{ fontFamily: "Fraunces, serif", color: "var(--color-forest)" }}>
              Create your gift card page
            </h2>
            <p className="mt-2" style={{ color: "var(--color-ink-faded)" }}>60 seconds. No credit card. No catch.</p>
          </div>

          <form onSubmit={handleSubmit} className="rounded-2xl border p-8 md:p-10 space-y-5" style={{ backgroundColor: "var(--color-paper)", borderColor: "var(--color-gold)", borderWidth: "1px" }}>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] block mb-2" style={{ color: "var(--color-gold)" }}>Shop Name</label>
              <input type="text" value={name} onChange={(e) => { setName(e.target.value); if (!slug || slug === autoSlug(name)) setSlug(autoSlug(e.target.value)); }}
                required placeholder="Joe's Coffee"
                className="w-full border rounded-lg px-4 py-3 transition-all" style={{ borderColor: "var(--color-cream-dark)", color: "var(--color-ink)", backgroundColor: "var(--color-cream)" }} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] block mb-2" style={{ color: "var(--color-gold)" }}>Page URL</label>
              <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: "var(--color-cream-dark)" }}>
                <span className="px-4 py-3 text-sm flex items-center" style={{ backgroundColor: "var(--color-cream-dark)", color: "var(--color-ink-faded)" }}>/shop/</span>
                <input type="text" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="joes-coffee" className="flex-1 px-4 py-3 font-mono text-sm" style={{ color: "var(--color-ink)", backgroundColor: "var(--color-cream)" }} />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] block mb-2" style={{ color: "var(--color-gold)" }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                required placeholder="hello@joescoffee.com"
                className="w-full border rounded-lg px-4 py-3 transition-all" style={{ borderColor: "var(--color-cream-dark)", color: "var(--color-ink)", backgroundColor: "var(--color-cream)" }} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] block mb-2" style={{ color: "var(--color-gold)" }}>Brand Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="w-11 h-11 rounded-lg cursor-pointer border" style={{ borderColor: "var(--color-cream-dark)" }} />
                  <input type="text" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="flex-1 border rounded-lg px-3 py-3 font-mono text-sm" style={{ borderColor: "var(--color-cream-dark)", color: "var(--color-ink)", backgroundColor: "var(--color-cream)" }} />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] block mb-2" style={{ color: "var(--color-gold)" }}>Phone <span className="font-normal normal-case tracking-normal" style={{ color: "var(--color-ink-faded)" }}>(optional)</span></label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567"
                  className="w-full border rounded-lg px-4 py-3" style={{ borderColor: "var(--color-cream-dark)", color: "var(--color-ink)", backgroundColor: "var(--color-cream)" }} />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] block mb-2" style={{ color: "var(--color-gold)" }}>Address <span className="font-normal normal-case tracking-normal" style={{ color: "var(--color-ink-faded)" }}>(optional)</span></label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St, Anytown USA"
                className="w-full border rounded-lg px-4 py-3" style={{ borderColor: "var(--color-cream-dark)", color: "var(--color-ink)", backgroundColor: "var(--color-cream)" }} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] block mb-2" style={{ color: "var(--color-gold)" }}>Redemption PIN <span className="font-normal normal-case tracking-normal" style={{ color: "var(--color-ink-faded)" }}>(4 digits — used when redeeming cards at your shop)</span></label>
              <input type="text" value={pin} onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 4); setPin(v); }} placeholder="1234" maxLength={4} inputMode="numeric" pattern="[0-9]*"
                className="w-full border rounded-lg px-4 py-3 font-mono text-lg tracking-[0.5em]" style={{ borderColor: "var(--color-cream-dark)", color: "var(--color-ink)", backgroundColor: "var(--color-cream)" }} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] block mb-2" style={{ color: "var(--color-gold)" }}>Dashboard Password <span className="font-normal normal-case tracking-normal" style={{ color: "var(--color-ink-faded)" }}>(to log in to your dashboard)</span></label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Choose a password" required
                className="w-full border rounded-lg px-4 py-3" style={{ borderColor: "var(--color-cream-dark)", color: "var(--color-ink)", backgroundColor: "var(--color-cream)" }} />
            </div>

            {error && (
              <div className="rounded-lg p-3 text-sm border" style={{ backgroundColor: "rgba(196,93,74,0.08)", borderColor: "var(--color-rose)", color: "var(--color-rose)" }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-4 rounded-lg font-bold text-lg transition-all disabled:opacity-50 hover:-translate-y-0.5 hover:shadow-lg"
              style={{ backgroundColor: "var(--color-forest)", color: "var(--color-gold-pale)" }}>
              {loading ? "Setting up..." : "Create My Shop — Free"}
            </button>

            <p className="text-center text-xs" style={{ color: "var(--color-ink-faded)" }}>
              No credit card &middot; 5% commission on sales only
            </p>
          </form>
        </div>
      </section>

      {/* ▸ BOTTOM CTA */}
      <section className="px-6 py-20 grain relative overflow-hidden" style={{ backgroundColor: "var(--color-forest)" }}>
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: "Fraunces, serif", color: "var(--color-cream)" }}>
            Stop leaving money<br />on the table.
          </h2>
          <p className="text-lg mb-8" style={{ color: "rgba(250,247,242,0.5)" }}>
            Every person who wants to gift your shop but can&apos;t is revenue you&apos;ll never see.
          </p>
          <a href="#signup" className="inline-block px-10 py-4 rounded-lg font-bold text-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
            style={{ backgroundColor: "var(--color-gold)", color: "var(--color-forest)" }}>
            Get Started Free &rarr;
          </a>
        </div>
      </section>
    </div>
  );
}
