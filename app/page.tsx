import Image from "next/image";
import Link from "next/link";
import {
  getCatalogProducts,
  getCoaStats,
  getLatestCoas,
  getPeptideCoverage,
} from "./lib/catalog";
import { getUspsServiceAlerts } from "./lib/usps-alerts";

const trustMetrics = [
  { label: "Third-Party Reports", value: "Verified" },
  { label: "Fast Fulfillment", value: "24-48h" },
  { label: "Compound Purity Target", value: "99%+" },
  { label: "Secure Checkout", value: "SSL" },
];

export default async function HomePage() {
  const products = getCatalogProducts().slice(0, 6);
  const latestCoas = getLatestCoas(6);
  const peptideCoverage = getPeptideCoverage(8);
  const stats = getCoaStats();
  const uspsAlerts = await getUspsServiceAlerts(3);

  const updatedOn = new Date(stats.updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-14 pb-14">
      <section className="hero-panel reveal-up">
        <div className="hero-grid" aria-hidden="true" />
        <div className="relative z-10 grid gap-8 px-6 py-10 md:grid-cols-[1.2fr_0.8fr] md:px-10 md:py-12">
          <div className="space-y-6">
            <p className="hero-kicker">Precision compounds for advanced lab workflows</p>
            <h1 className="hero-title">
              Built for rigorous research,
              <span className="block text-sky-300">supported by transparent COA data.</span>
            </h1>
            <p className="max-w-2xl text-base text-sky-50/90 md:text-lg">
              Meta Labs Research combines validated sourcing with a growing COA library so your team can
              evaluate purity and consistency before every study.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/products" className="primary-pill">
                Browse Products
              </Link>
              <Link href="/coas" className="secondary-pill">
                View COA Library
              </Link>
            </div>
          </div>

          <aside className="glass-panel space-y-4 rounded-3xl p-6 md:p-7">
            <div className="flex items-center gap-3">
              <Image
                src="/vial-metlabs.svg"
                alt="Research vial icon"
                width={48}
                height={48}
                className="h-12 w-12"
              />
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-sky-200">Quality Snapshot</p>
                <p className="text-lg font-semibold text-white">Validated Test Coverage</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-white/10 p-3 text-sky-100">
                <p className="text-xs uppercase tracking-[0.2em] text-sky-300">COAs tracked</p>
                <p className="mt-1 text-xl font-bold text-white">{stats.totalReports}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 text-sky-100">
                <p className="text-xs uppercase tracking-[0.2em] text-sky-300">Updated</p>
                <p className="mt-1 text-base font-semibold text-white">{updatedOn}</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-sky-100/90">
              All listings and calculations are provided strictly for laboratory research contexts.
            </p>
          </aside>
        </div>
      </section>

      <section className="rounded-3xl border border-amber-200 bg-amber-50/70 p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="section-kicker !text-amber-700">Carrier updates</p>
            <h2 className="section-title">USPS Service Alerts</h2>
          </div>
          <a
            href={uspsAlerts.sourceUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="text-sm font-semibold text-amber-700 hover:text-amber-900"
          >
            Open USPS alerts
          </a>
        </div>

        {uspsAlerts.updatedAt ? (
          <p className="mt-2 text-xs text-amber-700">{uspsAlerts.updatedAt}</p>
        ) : (
          <p className="mt-2 text-xs text-amber-700">Live alert details unavailable right now.</p>
        )}

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {uspsAlerts.alerts.length > 0 ? (
            uspsAlerts.alerts.map((alert) => (
              <article
                key={alert.title}
                className="rounded-2xl border border-amber-200 bg-white/90 p-4"
              >
                <h3 className="text-sm font-semibold text-slate-900">{alert.title}</h3>
                <p className="mt-2 text-sm text-slate-700">{alert.summary || "See USPS alert page for details."}</p>
              </article>
            ))
          ) : (
            <article className="rounded-2xl border border-amber-200 bg-white/90 p-4 md:col-span-3">
              <p className="text-sm text-slate-700">
                USPS alert cards could not be loaded. Use the USPS alerts link for current national disruptions.
              </p>
            </article>
          )}
        </div>
      </section>

      <section className="grid gap-4 px-2 sm:grid-cols-2 lg:grid-cols-4">
        {trustMetrics.map((metric, index) => (
          <article
            key={metric.label}
            className="reveal-up rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{metric.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{metric.value}</p>
          </article>
        ))}
      </section>

      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="section-kicker">Featured line</p>
            <h2 className="section-title">Popular research compounds</h2>
          </div>
          <Link href="/products" className="text-sm font-semibold text-sky-700 hover:text-sky-900">
            View full catalog
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product, index) => (
            <article
              key={product.slug}
              className="reveal-up rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
              style={{ animationDelay: `${index * 75}ms` }}
            >
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{product.category}</p>
              <h3 className="mt-3 text-xl font-semibold text-slate-900">{product.compound}</h3>
              <p className="mt-1 text-sm text-slate-600">{product.name}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                {product.variantCount} variant{product.variantCount === 1 ? "" : "s"}
              </p>
              <div className="mt-5 flex items-center justify-between">
                <p className="text-lg font-semibold text-sky-700">From {product.priceFrom} / vial</p>
                <Link
                  href={`/products/${product.slug}`}
                  className="rounded-full border border-sky-200 px-4 py-2 text-sm font-semibold text-sky-700 hover:border-sky-400 hover:text-sky-900"
                >
                  Details
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="section-kicker">Coverage</p>
          <h2 className="section-title">Most-tested peptides</h2>
          <div className="mt-5 grid gap-3">
            {peptideCoverage.map((entry) => (
              <div
                key={entry.peptide}
                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <p className="font-medium text-slate-800">{entry.peptide}</p>
                <p className="text-sm font-semibold text-sky-700">{entry.count} reports</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="section-kicker">Latest reports</p>
              <h2 className="section-title">Recent COA entries</h2>
            </div>
            <Link href="/coas" className="text-sm font-semibold text-sky-700 hover:text-sky-900">
              Open library
            </Link>
          </div>

          <div className="mt-5 grid gap-3">
            {latestCoas.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">{item.peptide}</p>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Batch {item.batch}
                  </p>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Purity {item.purity} - Tested {item.testDate}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Source {item.source === "site" ? "Source Site" : "Janoshik Public"}
                </p>
                <a
                  href={item.reportUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-3 inline-flex text-sm font-semibold text-sky-700 hover:text-sky-900"
                >
                  {item.imageUrl ? "View COA image" : "Open COA report"}
                </a>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-sky-300/40 bg-[linear-gradient(120deg,#0f2f4f,#174c79,#1d6aa5)] p-8 text-sky-50 shadow-lg md:p-10">
        <p className="text-xs uppercase tracking-[0.22em] text-sky-200">Compliance notice</p>
        <h2 className="mt-3 text-2xl font-semibold text-white md:text-3xl">
          Products listed are intended for controlled laboratory studies only.
        </h2>
        <p className="mt-3 max-w-3xl text-sm text-sky-100 md:text-base">
          Meta Labs Research does not market products for diagnostic, therapeutic, veterinary, or personal
          consumption uses. Always follow your institution&apos;s protocols and applicable regulations.
        </p>
        <p className="mt-2 text-xs text-sky-200">
          Review full policies:{" "}
          <Link href="/legal/terms" className="font-semibold text-white hover:text-sky-100">
            Terms
          </Link>{" "}
          |{" "}
          <Link href="/legal/privacy" className="font-semibold text-white hover:text-sky-100">
            Privacy
          </Link>{" "}
          |{" "}
          <Link href="/legal/shipping-returns" className="font-semibold text-white hover:text-sky-100">
            Shipping & Returns
          </Link>
        </p>
      </section>
    </div>
  );
}
