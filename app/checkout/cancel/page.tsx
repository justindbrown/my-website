import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:p-10">
      <p className="section-kicker">Checkout</p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-900">Checkout canceled</h1>
      <p className="mt-4 text-slate-600">
        No payment was processed. You can return to the product catalog and start checkout again when ready.
      </p>
      <p className="mt-2 text-xs text-slate-500">
        Review policy details before checkout in our{" "}
        <Link href="/legal/terms" className="font-semibold text-sky-700 hover:text-sky-900">
          Terms
        </Link>
        .
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/products" className="rounded-full bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800">
          Back to Products
        </Link>
        <Link href="/" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400">
          Home
        </Link>
      </div>
    </div>
  );
}
