import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "GiftStop — Gift Cards for the Shops You Love",
  description:
    "Buy digital gift cards for your favorite local shops — cafes, salons, bakeries & more.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSans.variable} antialiased`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600;0,9..144,700;0,9..144,800;0,9..144,900;1,9..144,400;1,9..144,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="min-h-screen font-[family-name:var(--font-dm)]"
        style={{ backgroundColor: "var(--color-cream)" }}
      >
        {/* Nav */}
        <nav className="sticky top-0 z-50 border-b" style={{ backgroundColor: "var(--color-cream)", borderColor: "var(--color-gold)", borderBottomWidth: "1px", borderBottomStyle: "solid", opacity: 0.98 }}>
          <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: "var(--color-forest)" }}>
                <span className="text-sm font-bold" style={{ color: "var(--color-gold)", fontFamily: "Fraunces, serif" }}>G</span>
              </div>
              <span className="text-lg font-bold tracking-tight" style={{ color: "var(--color-forest)", fontFamily: "Fraunces, serif" }}>
                GiftStop
              </span>
            </a>
            <div className="flex items-center gap-1 text-sm">
              {[
                { href: "/", label: "Buy" },
                { href: "/redeem", label: "Redeem" },
                { href: "/balance", label: "Balance" },
              ].map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="nav-link px-3 py-1.5 rounded-md font-medium transition-colors"
                >
                  {l.label}
                </a>
              ))}
              <div className="w-px h-4 mx-2" style={{ backgroundColor: "var(--color-gold)", opacity: 0.3 }} />
              <a
                href="/merchant/login"
                className="nav-link px-3 py-1.5 rounded-md font-medium transition-colors"
              >
                Log In
              </a>
              <a
                href="/merchant/onboard"
                className="px-4 py-1.5 rounded-md text-sm font-semibold transition-all"
                style={{ backgroundColor: "var(--color-forest)", color: "var(--color-gold-pale)" }}
              >
                For Shops
              </a>
            </div>
          </div>
        </nav>

        <main>{children}</main>

        {/* Footer */}
        <footer className="border-t py-8 px-6" style={{ borderColor: "var(--color-gold)", borderTopWidth: "1px", opacity: 0.3 }}>
          <div className="max-w-6xl mx-auto text-center text-xs" style={{ color: "var(--color-ink-faded)" }}>
            GiftStop &middot; Gift cards for the shops you love
          </div>
        </footer>
      </body>
    </html>
  );
}
