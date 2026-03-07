import Link from "next/link";
import { getCatalogProducts } from "../lib/catalog";
import ProductsCatalogClient from "./ProductsCatalogClient";

export default function ProductsPage() {
  const products = getCatalogProducts();

  return (
    <div className="space-y-8 pb-12">
      <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-10">
        <p className="section-kicker">Catalog</p>
        <h1 className="section-title mt-2">Research compound inventory</h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Browse our current inventory with transparent strength labeling and direct access to corresponding
          COA coverage.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          By placing an order, you agree to our{" "}
          <Link href="/legal/terms" className="font-semibold text-sky-700 hover:text-sky-900">
            Terms
          </Link>{" "}
          and confirm research-use only handling.
        </p>
      </section>

      <ProductsCatalogClient products={products} />
    </div>
  );
}
