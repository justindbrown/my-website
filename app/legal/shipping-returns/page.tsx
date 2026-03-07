import { getUspsServiceAlerts } from "../../lib/usps-alerts";

const effectiveDate = "March 6, 2026";

export default async function ShippingReturnsPage() {
  const uspsAlerts = await getUspsServiceAlerts(3);

  return (
    <div className="space-y-8 pb-12">
      <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-10">
        <p className="section-kicker">Legal</p>
        <h1 className="section-title mt-2">Shipping & Returns Policy</h1>
        <p className="mt-3 text-sm text-slate-500">Effective date: {effectiveDate}</p>
        <p className="mt-3 max-w-3xl text-slate-600">
          This policy applies to all orders placed through Meta Labs Research.
        </p>
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

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-7 text-sm text-slate-700 shadow-sm md:p-10">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">1. Order processing</h2>
          <p className="mt-2">
            Orders are processed after successful payment authorization and compliance checks. Processing times
            can vary by volume, holiday schedule, and carrier capacity.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">2. Shipping restrictions</h2>
          <p className="mt-2">
            Orders may be declined or canceled where local law or carrier policy restricts delivery of
            research compounds.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">3. Shipping charges</h2>
          <p className="mt-2">
            Orders with merchandise subtotal under $300.00 are charged a flat $15.00 shipping fee.
            Orders at or above $300.00 subtotal ship free, excluding any special handling fees.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">4. All sales final policy</h2>
          <p className="mt-2">
            To the fullest extent permitted by law, all orders are final sale and non-returnable once placed.
            We do not accept returns for buyer&apos;s remorse, ordering mistakes, delayed transit, or refusal of
            delivery.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">5. Extremely limited exception window</h2>
          <p className="mt-2">
            The only potential exception is a verified carrier-damaged package or verified shipment error
            attributable to us. Any claim must be submitted within 24 hours of marked delivery and include:
            order number, shipping label photo, outer package photos, inner packaging photos, and product
            photos.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">6. Non-eligible claims</h2>
          <p className="mt-2">
            Claims are not eligible if products are opened, used, transferred, or stored outside controlled
            conditions after delivery. Missing claim documentation automatically disqualifies review.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">7. Remedy limitations and return shipping</h2>
          <p className="mt-2">
            If a claim is approved, remedy is at our sole discretion: replacement, store credit, or partial
            refund. Customer is responsible for all return shipping costs and transit risk on approved
            returns unless otherwise required by law. Original shipping fees are non-refundable unless
            required by law.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">8. Chargeback and fraud handling</h2>
          <p className="mt-2">
            Fraudulent or abusive chargebacks may result in account and order restrictions. We reserve all
            rights to submit order and shipment evidence to payment processors and financial institutions.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">9. Policy controls</h2>
          <p className="mt-2">
            We may revise this policy at any time. The version posted at checkout time governs that purchase,
            except where prohibited by applicable law.
          </p>
        </div>
      </section>
    </div>
  );
}
