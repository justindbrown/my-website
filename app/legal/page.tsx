import Link from "next/link";

const pages = [
  {
    href: "/legal/terms",
    title: "Terms of Use",
    description: "Commercial, checkout, and permitted-use rules for this site.",
  },
  {
    href: "/legal/privacy",
    title: "Privacy Policy",
    description: "How Meta Labs Research collects, uses, and protects data.",
  },
  {
    href: "/legal/shipping-returns",
    title: "Shipping & Returns",
    description: "Order fulfillment, delivery, and return eligibility terms.",
  },
];

export default function LegalIndexPage() {
  return (
    <div className="space-y-8 pb-12">
      <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-10">
        <p className="section-kicker">Legal</p>
        <h1 className="section-title mt-2">Site policies</h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          These policies govern all use of Meta Labs Research and all checkout activity.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {pages.map((page) => (
          <article
            key={page.href}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-slate-900">{page.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{page.description}</p>
            <Link
              href={page.href}
              className="mt-4 inline-flex text-sm font-semibold text-sky-700 hover:text-sky-900"
            >
              Open policy
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}
