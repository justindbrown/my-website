import Link from "next/link";

const faqs: Array<{ question: string; answer: string }> = [
  {
    question: "Are your products for human consumption?",
    answer:
      "No. All products are sold strictly for laboratory and analytical research use only. They are not intended for human or veterinary use.",
  },
  {
    question: "Do I need to accept legal terms before checkout?",
    answer:
      "Yes. Checkout requires research-use acknowledgment and final-sale policy acknowledgment before a payment link is created.",
  },
  {
    question: "What payment processor do you use?",
    answer:
      "Checkout is processed by Square. Payment card details are handled by Square, not stored directly by this site.",
  },
  {
    question: "What is your return policy?",
    answer:
      "All sales are final to the fullest extent permitted by law, with only narrow exceptions for verified shipment error or documented carrier damage under the policy claim window. Customer is responsible for return shipping costs on approved returns unless required by law.",
  },
  {
    question: "How much is shipping?",
    answer:
      "Orders under $300 merchandise subtotal are charged a flat $15 shipping fee. Orders at or above $300 subtotal ship free unless special handling applies.",
  },
  {
    question: "Where can I view shipping disruption notices?",
    answer:
      "USPS Service Alerts are displayed on the home page and Shipping & Returns page, with a direct link to USPS for live updates.",
  },
  {
    question: "How do I view COAs?",
    answer:
      "Use the COA Library page to browse available reports. Where available, source-site COA images are shown; additional compounds use Janoshik public report links.",
  },
  {
    question: "Can I request out-of-stock notifications?",
    answer:
      "Yes. On an out-of-stock product page, use the Notify form to submit your email and preferred variant.",
  },
  {
    question: "Do you have an admin order dashboard?",
    answer:
      "Yes. Order Hub and Admin Orders Management are available for authorized admin sessions, including COGS entries and CSV export for tax prep.",
  },
];

export default function FaqPage() {
  return (
    <div className="space-y-8 pb-12">
      <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-10">
        <p className="section-kicker">Support</p>
        <h1 className="section-title mt-2">Frequently Asked Questions</h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Quick answers for ordering, policies, compliance, and operations.
        </p>
        <p className="mt-3 text-sm text-slate-700">
          Support Email:{" "}
          <a href="mailto:metalabsres@gmail.com" className="font-semibold text-sky-700 hover:text-sky-900">
            metalabsres@gmail.com
          </a>
        </p>
      </section>

      <section className="space-y-3">
        {faqs.map((item) => (
          <details
            key={item.question}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm open:border-sky-300"
          >
            <summary className="cursor-pointer list-none pr-4 text-base font-semibold text-slate-900">
              {item.question}
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">{item.answer}</p>
          </details>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-7 text-sm text-slate-600 shadow-sm md:p-10">
        <p>
          Need policy specifics? Review{" "}
          <Link href="/legal/terms" className="font-semibold text-sky-700 hover:text-sky-900">
            Terms
          </Link>
          ,{" "}
          <Link href="/legal/privacy" className="font-semibold text-sky-700 hover:text-sky-900">
            Privacy
          </Link>
          , and{" "}
          <Link href="/legal/shipping-returns" className="font-semibold text-sky-700 hover:text-sky-900">
            Shipping & Returns
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
