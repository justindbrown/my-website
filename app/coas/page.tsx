/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { getCoaStats, getLatestCoas, getPeptideCoverage } from "../lib/catalog";

export default function CoaLibraryPage() {
  const stats = getCoaStats();
  const latestReports = getLatestCoas(24);
  const peptideCoverage = getPeptideCoverage(16);

  const updatedOn = new Date(stats.updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-8 pb-12">
      <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-10">
        <p className="section-kicker">Quality library</p>
        <h1 className="section-title mt-2">Certificate of analysis index</h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          This page prioritizes source-site COAs and fills missing catalog compounds with Janoshik
          public report links.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total records</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.totalReports}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Last synced</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{updatedOn}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Need dosage support?</p>
            <Link href="/calculator" className="mt-1 inline-flex text-base font-semibold text-sky-700 hover:text-sky-900">
              Open calculator
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Coverage by peptide</h2>
          <div className="mt-4 grid gap-3">
            {peptideCoverage.map((entry) => (
              <div
                key={entry.peptide}
                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <p className="font-medium text-slate-900">{entry.peptide}</p>
                <p className="text-sm font-semibold text-sky-700">{entry.count}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Latest entries</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {latestReports.map((report) => (
              <div key={report.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                {report.imageUrl ? (
                  <div className="mb-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <img
                      src={report.imageUrl}
                      alt={`${report.peptide} COA`}
                      loading="lazy"
                      className="h-40 w-full object-cover object-top"
                    />
                  </div>
                ) : (
                  <div className="mb-3 rounded-xl border border-slate-200 bg-white px-4 py-5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    COA report link
                  </div>
                )}
                <div className="space-y-1 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">{report.peptide}</p>
                  <p>Batch: {report.batch}</p>
                  <p>Purity: {report.purity}</p>
                  <p>Test date: {report.testDate}</p>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Source: {report.source === "site" ? "Source Site" : "Janoshik Public"}
                  </p>
                </div>
                <a
                  href={report.reportUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-3 inline-flex text-sm font-semibold text-sky-700 hover:text-sky-900"
                >
                  {report.imageUrl ? "Open COA image" : "Open COA report"}
                </a>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
