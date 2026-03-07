import Link from "next/link";
import { notFound } from "next/navigation";
import CheckoutButton from "../../components/CheckoutButton";
import NotifyMeForm from "../../components/NotifyMeForm";
import { findCoasForCompound, getCatalogProducts, getProductBySlug } from "../../lib/catalog";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ notify?: string }>;
};

function notifyMessage(notifyState?: string) {
  switch (notifyState) {
    case "success":
      return {
        classes: "border-emerald-200 bg-emerald-50 text-emerald-700",
        text: "Saved. You will be notified when this item is available.",
      };
    case "invalid_email":
      return {
        classes: "border-amber-200 bg-amber-50 text-amber-700",
        text: "Please enter a valid email address.",
      };
    case "invalid_product":
      return {
        classes: "border-amber-200 bg-amber-50 text-amber-700",
        text: "That product could not be found.",
      };
    case "error":
      return {
        classes: "border-red-200 bg-red-50 text-red-700",
        text: "We could not save your request. Please try again.",
      };
    default:
      return null;
  }
}

export default async function ProductDetailPage({ params, searchParams }: ProductPageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const relatedReports = findCoasForCompound(product.compound, 5);
  const notifyState = notifyMessage(query.notify);

  return (
    <div className="space-y-8 pb-12">
      <nav className="text-sm text-slate-500">
        <Link href="/products" className="font-semibold text-slate-700 hover:text-slate-900">
          Products
        </Link>
        <span className="mx-2">/</span>
        <span>{product.compound}</span>
      </nav>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-9">
          <p className="section-kicker">Compound profile</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900 md:text-4xl">{product.compound}</h1>
          <p className="mt-2 text-slate-600">{product.name}</p>

          {notifyState ? (
            <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-semibold ${notifyState.classes}`}>
              {notifyState.text}
            </div>
          ) : null}

          <p
            className={`mt-4 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
              product.inStock ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"
            }`}
          >
            {product.inStock ? "In Stock" : "Coming Soon"}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Category</p>
              <p className="mt-1 font-semibold text-slate-900">{product.category}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Variants</p>
              <p className="mt-1 font-semibold text-slate-900">{product.variantCount}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Price From</p>
              <p className="mt-1 font-semibold text-sky-700">{product.priceFrom} / vial</p>
            </div>
          </div>

          <div className="mt-6 space-y-3 text-sm text-slate-600">
            <p>
              This listing is provided for analytical and educational reference within controlled research
              settings.
            </p>
            <p>
              Always validate analytical data against your own institutional standards before experimental
              use.
            </p>
            <p>
              Checkout is available only after acknowledging our{" "}
              <Link href="/legal/terms" className="font-semibold text-sky-700 hover:text-sky-900">
                Terms of Use
              </Link>
              .
            </p>
          </div>

          <div className="mt-6 space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Variants</h2>
            {product.variants.map((variant) => (
              <div
                key={variant.id}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{variant.label}</p>
                    <p className="text-sm text-slate-600">
                      {variant.price} per vial - 10 vials: ${(variant.priceUsd * 10).toFixed(2)} - Stock{" "}
                      {variant.stockQuantity}
                    </p>
                  </div>
                  {variant.inStock ? (
                    <CheckoutButton
                      slug={product.slug}
                      variantId={variant.id}
                      label="Buy Variant"
                      className="rounded-full bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800"
                    />
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="cursor-not-allowed rounded-full bg-slate-300 px-4 py-2 text-sm font-semibold text-slate-600"
                    >
                      Coming Soon
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {!product.inStock ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Notify Me</p>
              <p className="mt-1 text-sm text-slate-600">
                Leave your email and preferred variant to be notified when inventory returns.
              </p>
              <div className="mt-3">
                <NotifyMeForm
                  slug={product.slug}
                  returnTo={`/products/${product.slug}`}
                  variants={product.variants.map((variant) => ({
                    id: variant.id,
                    label: `${variant.label} (${variant.price})`,
                  }))}
                />
              </div>
            </div>
          ) : null}

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/products"
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400"
            >
              Back to Catalog
            </Link>
            <Link
              href="/calculator"
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400"
            >
              Open Calculator
            </Link>
          </div>
        </article>

        <aside className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-9">
          <p className="section-kicker">COA references</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Related source-site reports</h2>

          <div className="mt-5 space-y-3">
            {relatedReports.length > 0 ? (
              relatedReports.map((report) => (
                <div key={report.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">{report.peptide}</p>
                  <p className="mt-1 text-sm text-slate-600">Batch {report.batch}</p>
                  <p className="text-sm text-slate-600">Purity {report.purity}</p>
                  <p className="text-sm text-slate-600">Tested {report.testDate}</p>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Source {report.source === "site" ? "Source Site" : "Janoshik Public"}
                  </p>
                  <a
                    href={report.reportUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-2 inline-flex text-sm font-semibold text-sky-700 hover:text-sky-900"
                  >
                    {report.imageUrl ? "Open COA image" : "Open COA report"}
                  </a>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                No matching entries were found in the current COA sources.
              </div>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}

export async function generateStaticParams() {
  return getCatalogProducts().map((product) => ({
    slug: product.slug,
  }));
}
