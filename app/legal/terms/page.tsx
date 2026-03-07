import Link from "next/link";

const effectiveDate = "March 6, 2026";

type TermsPageProps = {
  searchParams: Promise<{ ack?: string }>;
};

export default async function TermsPage({ searchParams }: TermsPageProps) {
  const query = await searchParams;
  const acknowledgementRequired = query.ack === "required";

  return (
    <div className="space-y-8 pb-12">
      <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-10">
        <p className="section-kicker">Legal</p>
        <h1 className="section-title mt-2">Terms of Use</h1>
        <p className="mt-3 text-sm text-slate-500">Effective date: {effectiveDate}</p>
        <p className="mt-3 max-w-3xl text-slate-600">
          By using this site or purchasing through checkout, you agree to these terms.
        </p>
        {acknowledgementRequired ? (
          <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            Please acknowledge the research-use notice to continue to checkout.
          </p>
        ) : null}
      </section>

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-7 text-sm text-slate-700 shadow-sm md:p-10">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">1. Research-use only</h2>
          <p className="mt-2">
            All products are sold strictly for lawful laboratory research and analytical use. Products are
            not intended for human consumption, self-administration, veterinary use, diagnostic use, or
            therapeutic use.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">2. Eligibility and buyer responsibility</h2>
          <p className="mt-2">
            You must be 21 years of age or older and legally permitted to purchase these products in your
            jurisdiction. You are solely responsible for verifying local, state, and federal compliance
            before ordering.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">3. Orders, pricing, and payment</h2>
          <p className="mt-2">
            Orders are subject to acceptance and availability. Prices may be updated without notice.
            Checkout is processed by Square. Card data is handled by Square and not stored by this site.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">4. Shipping and returns</h2>
          <p className="mt-2">
            Shipping windows, delivery terms, and return eligibility are described in our{" "}
            <Link href="/legal/shipping-returns" className="font-semibold text-sky-700 hover:text-sky-900">
              Shipping & Returns Policy
            </Link>
            . By placing an order, you agree that orders under $300 merchandise subtotal include a $15
            shipping fee, all sales are final except where a mandatory legal right applies, and approved
            return shipping costs are customer responsibility unless required by law.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">5. No medical advice or claims</h2>
          <p className="mt-2">
            Site content is informational only and is not medical advice. No statement on this site is
            intended to diagnose, treat, cure, or prevent any disease.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">6. Limitation of liability</h2>
          <p className="mt-2">
            To the maximum extent permitted by law, Meta Labs Research is not liable for indirect,
            consequential, incidental, or special damages related to site use, product misuse, or legal
            non-compliance by the purchaser.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">7. Policy updates</h2>
          <p className="mt-2">
            We may revise these terms from time to time. Updated terms take effect when posted.
          </p>
        </div>
      </section>
    </div>
  );
}
