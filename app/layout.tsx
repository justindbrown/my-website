import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import ResearchUseGate from "./components/ResearchUseGate";
import {
  AGE_VERIFIED_COOKIE,
  AGE_VERIFIED_VALUE,
  RESEARCH_GATE_COOKIE,
  RESEARCH_GATE_VALUE,
} from "./lib/research-gate";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Meta Labs Research",
    template: "%s | Meta Labs Research",
  },
  description:
    "Premium research compounds with transparent third-party COA access and fast U.S. fulfillment.",
  openGraph: {
    title: "Meta Labs Research",
    description:
      "Premium research compounds with transparent third-party COA access and fast U.S. fulfillment.",
    images: ["/Meta Labs Research Logo.png"],
    type: "website",
  },
};

const navItems = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/coas", label: "COA Library" },
  { href: "/faq", label: "FAQ" },
  { href: "/calculator", label: "Calculator" },
  { href: "/order-hub", label: "Order Hub" },
  { href: "/legal", label: "Legal" },
];

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const gateCookie = cookieStore.get(RESEARCH_GATE_COOKIE)?.value;
  const ageCookie = cookieStore.get(AGE_VERIFIED_COOKIE)?.value;
  const initialAcknowledged = gateCookie === RESEARCH_GATE_VALUE && ageCookie === AGE_VERIFIED_VALUE;
  const year = new Date().getFullYear();

  return (
    <html lang="en">
      <body className="site-body">
        <ResearchUseGate initialAcknowledged={initialAcknowledged} />
        <div className="site-shell">
          <div className="site-alert">
            Research use only. Not for human consumption.
          </div>

          <header className="site-header">
            <Link href="/" className="brand-mark" aria-label="Meta Labs Research home">
              <Image
                src="/Meta Labs Research Logo.png"
                alt="Meta Labs Research logo"
                width={44}
                height={44}
                priority
                className="h-11 w-11 rounded-full border border-sky-200 bg-white object-contain"
              />
              <span className="brand-title">Meta Labs Research</span>
            </Link>

            <nav className="site-nav" aria-label="Main navigation">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="site-nav-link">
                  {item.label}
                </Link>
              ))}
            </nav>

            <Link href="/products" className="site-cta">
              Shop Compounds
            </Link>
          </header>

          <main className="site-main">{children}</main>

          <footer className="site-footer">
            <p className="text-sm text-slate-500">
              (c) {year} Meta Labs Research. All rights reserved.
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Support Email:{" "}
              <a href="mailto:metalabsres@gmail.com" className="font-semibold text-sky-700 hover:text-sky-900">
                metalabsres@gmail.com
              </a>
            </p>
            <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-500">
              <Link href="/legal/terms" className="hover:text-slate-700">
                Terms
              </Link>
              <Link href="/legal/privacy" className="hover:text-slate-700">
                Privacy
              </Link>
              <Link href="/legal/shipping-returns" className="hover:text-slate-700">
                Shipping & Returns
              </Link>
            </p>
            <p className="text-xs text-slate-400">
              Laboratory and analytical research use only.
            </p>
          </footer>
        </div>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

