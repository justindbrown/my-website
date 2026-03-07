import Link from "next/link";

export default function CheckoutSuccessPage() {
  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:p-10">
      <p className="section-kicker">Checkout</p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-900">Payment submitted</h1>
      <p className="mt-4 text-slate-600">
        Thanks. If payment was approved, Square will confirm the order and provide receipt details.
      </p>
      <p className="mt-2 text-xs text-slate-500">
        Orders are governed by our <Link href="/legal/terms" className="font-semibold text-sky-700 hover:text-sky-900">Terms</Link> and{" "}
        <Link href="/legal/shipping-returns" className="font-semibold text-sky-700 hover:text-sky-900">Shipping & Returns Policy</Link>.
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Return eligibility is extremely limited and all sales are final except where required by law.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/products" className="rounded-full bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800">
          Continue Shopping
        </Link>
        <Link href="/coas" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400">
          View COA Library
        </Link>
      </div>
    </div>
  );
}
