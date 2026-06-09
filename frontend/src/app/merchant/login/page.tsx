"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function MerchantLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API}/api/merchants/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Login failed");
      }

      const data = await res.json();
      // Store session in localStorage
      localStorage.setItem("merchant_session", JSON.stringify({
        slug: data.slug,
        name: data.name,
        id: data.id,
      }));
      router.push(`/merchant/${data.slug}/dashboard`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ backgroundColor: "var(--color-cream)" }} className="min-h-[80vh]">
      {/* Header */}
      <div className="relative grain" style={{ backgroundColor: "var(--color-forest)" }}>
        <div className="absolute top-4 left-6 text-sm" style={{ color: "var(--color-gold)", opacity: 0.2, fontFamily: "Fraunces, serif" }}>&#9830;</div>
        <div className="absolute top-4 right-6 text-sm" style={{ color: "var(--color-gold)", opacity: 0.2, fontFamily: "Fraunces, serif" }}>&#9830;</div>
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ backgroundColor: "var(--color-gold)", opacity: 0.3 }} />

        <div className="max-w-sm mx-auto py-12 px-4 text-center">
          <p className="text-xs uppercase tracking-[0.2em] mb-3" style={{ color: "var(--color-gold)" }}>Merchant Portal</p>
          <h1 className="text-3xl font-bold" style={{ color: "var(--color-gold-pale)", fontFamily: "Fraunces, serif" }}>Welcome Back</h1>
          <p className="mt-2" style={{ color: "var(--color-gold)", opacity: 0.7, fontFamily: "Fraunces, serif", fontStyle: "italic" }}>Log in to manage your shop</p>
        </div>
      </div>

      <div className="max-w-sm mx-auto px-4 -mt-4 pb-12 relative z-10">
        <form onSubmit={handleLogin} className="space-y-5 anim-fade-up">
          <div className="rounded-md p-6" style={{ backgroundColor: "var(--color-paper)", border: "1px solid var(--color-gold)" }}>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] block mb-2" style={{ color: "var(--color-gold)" }}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@yourshop.com"
                  className="w-full border rounded-md px-4 py-3"
                  style={{ borderColor: "var(--color-gold)", color: "var(--color-forest)", backgroundColor: "var(--color-cream)" }}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] block mb-2" style={{ color: "var(--color-gold)" }}>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Your dashboard password"
                  className="w-full border rounded-md px-4 py-3"
                  style={{ borderColor: "var(--color-gold)", color: "var(--color-forest)", backgroundColor: "var(--color-cream)" }}
                />
              </div>
            </div>
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
                Logging in...
              </span>
            ) : "Log In"}
          </button>

          <div className="text-center">
            <p className="text-sm" style={{ color: "var(--color-ink-faded)" }}>
              Don&apos;t have an account?{" "}
              <a href="/merchant/onboard" className="font-semibold" style={{ color: "var(--color-forest)" }}>Register your shop</a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
