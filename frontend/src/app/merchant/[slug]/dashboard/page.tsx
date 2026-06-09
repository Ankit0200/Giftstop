"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Merchant { id: string; name: string; slug: string; brand_color: string; logo_url: string | null; }
interface Stats { total_cards_sold: number; total_revenue: number; outstanding_liability: number; total_redeemed: number; active_cards: number; }
interface CardSummary { id: string; code: string; original_amount: number; current_balance: number; status: string; buyer_email: string | null; recipient_name: string | null; created_at: string; }
interface RedemptionItem { id: string; gift_card_code: string; amount: number; balance_before: number; balance_after: number; redeemed_by: string | null; created_at: string; }
interface Analytics { total_cards: number; fully_redeemed: number; partially_used: number; unused: number; breakage_rate: number; breakage_amount: string; avg_redemption: string; daily_sales: { date: string; count: number; total: string }[]; }

type Tab = "overview" | "cards" | "redemptions" | "analytics";

export default function DashboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [cards, setCards] = useState<CardSummary[]>([]);
  const [redemptions, setRedemptions] = useState<RedemptionItem[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [notFound, setNotFound] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  // Auth check
  useEffect(() => {
    const session = localStorage.getItem("merchant_session");
    if (!session) {
      router.push("/merchant/login");
      return;
    }
    try {
      const parsed = JSON.parse(session);
      if (parsed.slug !== slug) {
        router.push("/merchant/login");
        return;
      }
      setAuthorized(true);
    } catch {
      router.push("/merchant/login");
    }
  }, [slug, router]);

  useEffect(() => {
    if (!authorized) return;
    fetch(`${API}/api/merchants/${slug}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setMerchant).catch(() => setNotFound(true));
  }, [slug, authorized]);

  useEffect(() => {
    if (!merchant) return;
    fetch(`${API}/api/merchants/${slug}/dashboard/stats`).then((r) => r.json()).then(setStats);
    fetch(`${API}/api/merchants/${slug}/dashboard/cards`).then((r) => r.json()).then(setCards);
    fetch(`${API}/api/merchants/${slug}/dashboard/redemptions`).then((r) => r.json()).then(setRedemptions);
    fetch(`${API}/api/merchants/${slug}/dashboard/analytics`).then((r) => r.json()).then(setAnalytics);
  }, [merchant, slug]);

  if (notFound) return (
    <div className="min-h-[60vh] flex items-center justify-center" style={{ backgroundColor: "var(--color-cream)" }}>
      <p style={{ color: "var(--color-ink-faded)", fontFamily: "Fraunces, serif" }}>Shop not found.</p>
    </div>
  );

  if (!merchant || !stats) return (
    <div className="min-h-[60vh] flex items-center justify-center" style={{ backgroundColor: "var(--color-cream)" }}>
      <div className="flex items-center gap-3" style={{ color: "var(--color-ink-faded)" }}>
        <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: "var(--color-gold)", borderTopColor: "transparent" }} />
        <span style={{ fontFamily: "Fraunces, serif", fontStyle: "italic" }}>Loading your dashboard...</span>
      </div>
    </div>
  );

  const rev = Number(stats.total_revenue);
  const liab = Number(stats.outstanding_liability);
  const rmd = Number(stats.total_redeemed);
  const liabPct = rev > 0 ? Math.min((liab / rev) * 100, 100) : 0;
  const rmdPct = rev > 0 ? Math.min((rmd / rev) * 100, 100) : 0;

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: "overview", label: "Overview", icon: "I" },
    { key: "cards", label: "Gift Cards", icon: "II" },
    { key: "redemptions", label: "Redemptions", icon: "III" },
    { key: "analytics", label: "Analytics", icon: "IV" },
  ];

  return (
    <div style={{ backgroundColor: "var(--color-cream)" }} className="min-h-screen">

      {/* ── HEADER ───────────────────────────────────────────────── */}
      <div className="relative overflow-hidden grain" style={{ backgroundColor: "var(--color-forest)" }}>
        {/* Decorative corner ornaments */}
        <div className="absolute top-4 left-6 text-sm" style={{ color: "var(--color-gold)", opacity: 0.2, fontFamily: "Fraunces, serif" }}>&#9830;</div>
        <div className="absolute top-4 right-6 text-sm" style={{ color: "var(--color-gold)", opacity: 0.2, fontFamily: "Fraunces, serif" }}>&#9830;</div>
        {/* Gold line accent at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ backgroundColor: "var(--color-gold)", opacity: 0.3 }} />

        <div className="relative max-w-6xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-md flex items-center justify-center shadow-lg" style={{ backgroundColor: "var(--color-gold)", border: "2px solid var(--color-gold-light)" }}>
                <span className="text-2xl font-bold" style={{ color: "var(--color-forest)", fontFamily: "Fraunces, serif" }}>
                  {merchant.name[0]}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: "var(--color-gold-pale)", fontFamily: "Fraunces, serif" }}>
                  {merchant.name}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--color-gold)" }} />
                  <span className="text-sm" style={{ color: "var(--color-gold)", opacity: 0.7, fontFamily: "Fraunces, serif", fontStyle: "italic" }}>
                    Merchant Dashboard
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <a href={`/shop/${slug}`}
                className="px-5 py-2.5 rounded-md text-sm font-semibold transition-all"
                style={{ border: "1px solid var(--color-gold)", color: "var(--color-gold)" }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--color-gold)"; e.currentTarget.style.color = "var(--color-forest)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--color-gold)"; }}
              >
                View Shop Page
              </a>
              <a href="/redeem"
                className="px-5 py-2.5 rounded-md text-sm font-semibold transition-all"
                style={{ backgroundColor: "var(--color-gold)", color: "var(--color-forest)" }}>
                Redeem Card
              </a>
              <button
                onClick={() => { localStorage.removeItem("merchant_session"); router.push("/merchant/login"); }}
                className="px-5 py-2.5 rounded-md text-sm font-semibold transition-all"
                style={{ border: "1px solid var(--color-gold)", color: "var(--color-gold)", opacity: 0.7 }}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* ── STATS ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {[
            { label: "Cards Sold", value: stats.total_cards_sold.toString(), sub: `${stats.active_cards} active`, accent: "var(--color-forest)" },
            { label: "Total Revenue", value: `$${rev.toFixed(2)}`, sub: "Lifetime sales", accent: "var(--color-gold)" },
            { label: "Outstanding", value: `$${liab.toFixed(2)}`, sub: `${liabPct.toFixed(0)}% unredeemed`, accent: "var(--color-rose)", bar: liabPct },
            { label: "Redeemed", value: `$${rmd.toFixed(2)}`, sub: `${rmdPct.toFixed(0)}% of revenue`, accent: "var(--color-forest-light)", bar: rmdPct },
          ].map((s, i) => (
            <div key={s.label}
              className="relative rounded-md p-5 anim-fade-up"
              style={{
                backgroundColor: "var(--color-paper)",
                border: "1px solid var(--color-gold)",
                borderTopWidth: "3px",
                borderTopColor: s.accent,
                animationDelay: `${i * 0.1}s`,
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--color-ink-faded)" }}>
                {s.label}
              </p>
              <p className="text-3xl font-bold tracking-tight" style={{ color: "var(--color-forest)", fontFamily: "Fraunces, serif" }}>
                {s.value}
              </p>
              {"bar" in s && s.bar !== undefined ? (
                <div className="mt-3">
                  <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ backgroundColor: "var(--color-cream-dark)" }}>
                    <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${s.bar}%`, backgroundColor: s.accent }} />
                  </div>
                  <p className="text-xs mt-1.5" style={{ color: "var(--color-ink-faded)" }}>{s.sub}</p>
                </div>
              ) : (
                <p className="text-xs mt-2" style={{ color: "var(--color-ink-faded)" }}>{s.sub}</p>
              )}
            </div>
          ))}
        </div>

        {/* ── TABS ───────────────────────────────────────────────── */}
        <div className="rounded-md overflow-hidden" style={{ backgroundColor: "var(--color-paper)", border: "1px solid var(--color-gold)" }}>
          {/* Tab bar */}
          <div className="px-6" style={{ borderBottom: "1px solid var(--color-gold)", backgroundColor: "var(--color-cream)" }}>
            <div className="flex gap-1">
              {TABS.map((t) => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className="flex items-center gap-2.5 px-5 py-4 text-sm font-semibold transition-all"
                  style={{
                    borderBottom: tab === t.key ? "2px solid var(--color-forest)" : "2px solid transparent",
                    color: tab === t.key ? "var(--color-forest)" : "var(--color-ink-faded)",
                    backgroundColor: tab === t.key ? "var(--color-paper)" : "transparent",
                    fontFamily: "Fraunces, serif",
                  }}
                >
                  <span className="text-xs" style={{ color: "var(--color-gold)", fontStyle: "italic" }}>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* OVERVIEW */}
            {tab === "overview" && (
              <div className="grid md:grid-cols-2 gap-8">
                {/* Recent Sales */}
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold" style={{ color: "var(--color-forest)", fontFamily: "Fraunces, serif" }}>Recent Sales</h3>
                    <button onClick={() => setTab("cards")} className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-gold)" }}>View All</button>
                  </div>
                  {cards.length === 0 ? (
                    <div className="text-center py-12 rounded-md" style={{ backgroundColor: "var(--color-cream)", border: "1px dashed var(--color-gold)" }}>
                      <div className="text-3xl mb-3" style={{ color: "var(--color-gold)", fontFamily: "Fraunces, serif" }}>&#9671;</div>
                      <p className="text-sm font-medium" style={{ color: "var(--color-ink-light)" }}>No gift cards yet</p>
                      <p className="text-xs mt-1" style={{ color: "var(--color-ink-faded)" }}>Share your shop link to start selling</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cards.slice(0, 5).map((c) => (
                        <div key={c.id} className="flex items-center gap-4 p-4 rounded-md transition-colors"
                          style={{ backgroundColor: "var(--color-cream)", border: "1px solid var(--color-gold)" }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--color-cream-dark)"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--color-cream)"}
                        >
                          <div className="w-10 h-10 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--color-forest)" }}>
                            <span className="text-xs font-bold" style={{ color: "var(--color-gold)", fontFamily: "Fraunces, serif" }}>${Number(c.original_amount).toFixed(0)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-mono text-sm font-semibold" style={{ color: "var(--color-forest)" }}>{c.code}</p>
                            <p className="text-xs truncate" style={{ color: "var(--color-ink-faded)" }}>
                              {c.recipient_name ? `For ${c.recipient_name}` : c.buyer_email || new Date(c.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-bold" style={{ color: "var(--color-forest)", fontFamily: "Fraunces, serif" }}>${Number(c.original_amount).toFixed(2)}</p>
                            <span className="text-xs font-semibold" style={{ color: c.status === "active" ? "var(--color-forest-light)" : "var(--color-ink-faded)" }}>{c.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Redemptions */}
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold" style={{ color: "var(--color-forest)", fontFamily: "Fraunces, serif" }}>Recent Redemptions</h3>
                    <button onClick={() => setTab("redemptions")} className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-gold)" }}>View All</button>
                  </div>
                  {redemptions.length === 0 ? (
                    <div className="text-center py-12 rounded-md" style={{ backgroundColor: "var(--color-cream)", border: "1px dashed var(--color-gold)" }}>
                      <div className="text-3xl mb-3" style={{ color: "var(--color-gold)", fontFamily: "Fraunces, serif" }}>&#9671;</div>
                      <p className="text-sm font-medium" style={{ color: "var(--color-ink-light)" }}>No redemptions yet</p>
                      <p className="text-xs mt-1" style={{ color: "var(--color-ink-faded)" }}>They&apos;ll show up here in real-time</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {redemptions.slice(0, 5).map((r) => (
                        <div key={r.id} className="flex items-center gap-4 p-4 rounded-md transition-colors"
                          style={{ backgroundColor: "var(--color-cream)", border: "1px solid var(--color-gold)" }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--color-cream-dark)"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--color-cream)"}
                        >
                          <div className="w-10 h-10 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--color-forest-light)" }}>
                            <svg className="w-5 h-5" style={{ color: "var(--color-gold-pale)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-mono text-sm font-semibold" style={{ color: "var(--color-forest)" }}>{r.gift_card_code}</p>
                            <p className="text-xs" style={{ color: "var(--color-ink-faded)" }}>{new Date(r.created_at).toLocaleString()}</p>
                          </div>
                          <p className="font-bold shrink-0" style={{ color: "var(--color-rose)", fontFamily: "Fraunces, serif" }}>-${Number(r.amount).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CARDS TABLE */}
            {tab === "cards" && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold" style={{ color: "var(--color-forest)", fontFamily: "Fraunces, serif" }}>All Gift Cards</h3>
                  <span className="text-sm font-medium" style={{ color: "var(--color-ink-faded)" }}>{cards.length} total</span>
                </div>
                <div className="overflow-x-auto rounded-md" style={{ border: "1px solid var(--color-gold)" }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: "var(--color-cream)" }}>
                        {["Code", "Original", "Balance", "Status", "Buyer", "Date"].map((h) => (
                          <th key={h} className="text-left px-4 py-3.5 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-gold)", borderBottom: "1px solid var(--color-gold)" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {cards.map((c, i) => (
                        <tr key={c.id} className="transition-colors"
                          style={{ borderBottom: i < cards.length - 1 ? "1px solid var(--color-cream-dark)" : "none" }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--color-cream)"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                        >
                          <td className="px-4 py-3.5 font-mono font-semibold" style={{ color: "var(--color-forest)" }}>{c.code}</td>
                          <td className="px-4 py-3.5" style={{ color: "var(--color-ink-light)" }}>${Number(c.original_amount).toFixed(2)}</td>
                          <td className="px-4 py-3.5 font-bold" style={{ color: "var(--color-forest)", fontFamily: "Fraunces, serif" }}>${Number(c.current_balance).toFixed(2)}</td>
                          <td className="px-4 py-3.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                              style={{
                                backgroundColor: c.status === "active" ? "var(--color-forest)" : c.status === "redeemed" ? "var(--color-cream-dark)" : "var(--color-gold-pale)",
                                color: c.status === "active" ? "var(--color-gold-pale)" : c.status === "redeemed" ? "var(--color-ink-faded)" : "var(--color-gold)",
                              }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{
                                backgroundColor: c.status === "active" ? "var(--color-gold)" : c.status === "redeemed" ? "var(--color-ink-faded)" : "var(--color-gold)"
                              }} />
                              {c.status}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 max-w-[150px] truncate" style={{ color: "var(--color-ink-faded)" }}>{c.buyer_email || "\u2014"}</td>
                          <td className="px-4 py-3.5" style={{ color: "var(--color-ink-faded)" }}>{new Date(c.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                      {cards.length === 0 && (
                        <tr><td colSpan={6} className="px-4 py-16 text-center" style={{ color: "var(--color-ink-faded)" }}>No gift cards yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* REDEMPTIONS TABLE */}
            {tab === "redemptions" && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold" style={{ color: "var(--color-forest)", fontFamily: "Fraunces, serif" }}>Redemption History</h3>
                  <span className="text-sm font-medium" style={{ color: "var(--color-ink-faded)" }}>{redemptions.length} total</span>
                </div>
                <div className="overflow-x-auto rounded-md" style={{ border: "1px solid var(--color-gold)" }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: "var(--color-cream)" }}>
                        {["Card Code", "Amount", "Before", "After", "Date"].map((h) => (
                          <th key={h} className="text-left px-4 py-3.5 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-gold)", borderBottom: "1px solid var(--color-gold)" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {redemptions.map((r, i) => (
                        <tr key={r.id} className="transition-colors"
                          style={{ borderBottom: i < redemptions.length - 1 ? "1px solid var(--color-cream-dark)" : "none" }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--color-cream)"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                        >
                          <td className="px-4 py-3.5 font-mono font-semibold" style={{ color: "var(--color-forest)" }}>{r.gift_card_code}</td>
                          <td className="px-4 py-3.5">
                            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold"
                              style={{ backgroundColor: "var(--color-forest)", color: "var(--color-gold-pale)" }}>
                              -${Number(r.amount).toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-3.5" style={{ color: "var(--color-ink-faded)" }}>${Number(r.balance_before).toFixed(2)}</td>
                          <td className="px-4 py-3.5" style={{ color: "var(--color-ink-faded)" }}>${Number(r.balance_after).toFixed(2)}</td>
                          <td className="px-4 py-3.5" style={{ color: "var(--color-ink-faded)" }}>{new Date(r.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                      {redemptions.length === 0 && (
                        <tr><td colSpan={5} className="px-4 py-16 text-center" style={{ color: "var(--color-ink-faded)" }}>No redemptions yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ANALYTICS */}
            {tab === "analytics" && analytics && (
              <div className="space-y-8">
                {/* Breakage & Avg */}
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="rounded-md p-5" style={{ backgroundColor: "var(--color-cream)", border: "1px solid var(--color-gold)" }}>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--color-gold)" }}>Breakage Rate</p>
                    <p className="text-4xl font-bold" style={{ color: "var(--color-forest)", fontFamily: "Fraunces, serif" }}>{analytics.breakage_rate}%</p>
                    <p className="text-sm mt-1" style={{ color: "var(--color-ink-faded)" }}>${analytics.breakage_amount} unredeemed value</p>
                    <p className="text-xs mt-3" style={{ color: "var(--color-ink-faded)", fontStyle: "italic" }}>
                      Industry avg is 10-15%. Higher breakage = more profit retained.
                    </p>
                  </div>
                  <div className="rounded-md p-5" style={{ backgroundColor: "var(--color-cream)", border: "1px solid var(--color-gold)" }}>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--color-gold)" }}>Avg. Redemption</p>
                    <p className="text-4xl font-bold" style={{ color: "var(--color-forest)", fontFamily: "Fraunces, serif" }}>${analytics.avg_redemption}</p>
                    <p className="text-sm mt-1" style={{ color: "var(--color-ink-faded)" }}>per transaction</p>
                  </div>
                </div>

                {/* Card Status Breakdown */}
                <div>
                  <h3 className="text-lg font-bold mb-4" style={{ color: "var(--color-forest)", fontFamily: "Fraunces, serif" }}>Card Status Breakdown</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: "Unused", count: analytics.unused, color: "var(--color-gold)" },
                      { label: "Partially Used", count: analytics.partially_used, color: "var(--color-forest-light)" },
                      { label: "Fully Redeemed", count: analytics.fully_redeemed, color: "var(--color-forest)" },
                    ].map((s) => (
                      <div key={s.label} className="rounded-md p-4 text-center" style={{ backgroundColor: "var(--color-paper)", border: "1px solid var(--color-gold)" }}>
                        <p className="text-3xl font-bold mb-1" style={{ color: s.color, fontFamily: "Fraunces, serif" }}>{s.count}</p>
                        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-ink-faded)" }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                  {analytics.total_cards > 0 && (
                    <div className="mt-4 flex rounded-full overflow-hidden h-3" style={{ backgroundColor: "var(--color-cream-dark)" }}>
                      {analytics.unused > 0 && (
                        <div style={{ width: `${(analytics.unused / analytics.total_cards) * 100}%`, backgroundColor: "var(--color-gold)" }} title={`${analytics.unused} unused`} />
                      )}
                      {analytics.partially_used > 0 && (
                        <div style={{ width: `${(analytics.partially_used / analytics.total_cards) * 100}%`, backgroundColor: "var(--color-forest-light)" }} title={`${analytics.partially_used} partial`} />
                      )}
                      {analytics.fully_redeemed > 0 && (
                        <div style={{ width: `${(analytics.fully_redeemed / analytics.total_cards) * 100}%`, backgroundColor: "var(--color-forest)" }} title={`${analytics.fully_redeemed} redeemed`} />
                      )}
                    </div>
                  )}
                </div>

                {/* Daily Sales */}
                {analytics.daily_sales.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold mb-4" style={{ color: "var(--color-forest)", fontFamily: "Fraunces, serif" }}>Recent Sales</h3>
                    <div className="overflow-x-auto rounded-md" style={{ border: "1px solid var(--color-gold)" }}>
                      <table className="w-full text-sm">
                        <thead>
                          <tr style={{ backgroundColor: "var(--color-cream)" }}>
                            {["Date", "Cards Sold", "Revenue"].map((h) => (
                              <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-gold)", borderBottom: "1px solid var(--color-gold)" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.daily_sales.map((d, i) => (
                            <tr key={d.date} style={{ borderBottom: i < analytics.daily_sales.length - 1 ? "1px solid var(--color-cream-dark)" : "none" }}>
                              <td className="px-4 py-3" style={{ color: "var(--color-ink-light)" }}>{new Date(d.date).toLocaleDateString()}</td>
                              <td className="px-4 py-3 font-semibold" style={{ color: "var(--color-forest)" }}>{d.count}</td>
                              <td className="px-4 py-3 font-bold" style={{ color: "var(--color-forest)", fontFamily: "Fraunces, serif" }}>${Number(d.total).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {analytics.total_cards === 0 && (
                  <div className="text-center py-12 rounded-md" style={{ border: "1px dashed var(--color-gold)" }}>
                    <div className="text-3xl mb-3" style={{ color: "var(--color-gold)", fontFamily: "Fraunces, serif" }}>&#9671;</div>
                    <p className="font-medium" style={{ color: "var(--color-ink-light)" }}>No data yet</p>
                    <p className="text-xs mt-1" style={{ color: "var(--color-ink-faded)" }}>Analytics will appear once gift cards are sold</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
