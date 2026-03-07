const effectiveDate = "March 6, 2026";

export default function PrivacyPage() {
  return (
    <div className="space-y-8 pb-12">
      <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-10">
        <p className="section-kicker">Legal</p>
        <h1 className="section-title mt-2">Privacy Policy</h1>
        <p className="mt-3 text-sm text-slate-500">Effective date: {effectiveDate}</p>
        <p className="mt-3 max-w-3xl text-slate-600">
          This policy explains how Meta Labs Research collects and uses personal information.
        </p>
      </section>

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-7 text-sm text-slate-700 shadow-sm md:p-10">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">1. Information we collect</h2>
          <p className="mt-2">
            We may collect contact information you submit, order metadata, product selections, and technical
            data such as IP address and user-agent for security and fraud prevention.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">2. How we use information</h2>
          <p className="mt-2">
            We use collected data to process orders, respond to inquiries, send inventory notifications,
            maintain site security, and improve platform reliability.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">3. Payment processing</h2>
          <p className="mt-2">
            Payments are processed by Square. Payment card details are collected directly by Square and are
            governed by Square&apos;s privacy and security standards.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">4. Data sharing</h2>
          <p className="mt-2">
            We share data only with service providers needed to run checkout, hosting, and operations, or as
            required by law.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">5. Data retention</h2>
          <p className="mt-2">
            We retain records only as long as reasonably necessary for operational, legal, and accounting
            purposes.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">6. Your rights</h2>
          <p className="mt-2">
            Depending on your jurisdiction, you may have rights to request access, correction, or deletion of
            personal information, subject to legal exceptions.
          </p>
        </div>
      </section>
    </div>
  );
}
