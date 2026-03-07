"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import CheckoutButton from "../components/CheckoutButton";
import type { CatalogProduct } from "../lib/catalog";

type ProductsCatalogClientProps = {
  products: CatalogProduct[];
};

function textMatches(product: CatalogProduct, query: string): boolean {
  if (!query) {
    return true;
  }

  const value = query.toLowerCase();
  const haystack = [
    product.name,
    product.compound,
    product.description,
    product.category,
    ...product.variants.map((variant) => variant.label),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(value);
}

export default function ProductsCatalogClient({ products }: ProductsCatalogClientProps) {
  const categories = useMemo(
    () => Array.from(new Set(products.map((product) => product.category))).sort((a, b) => a.localeCompare(b)),
    [products]
  );
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [query, setQuery] = useState("");

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const categoryMatch = activeCategory === "All" || product.category === activeCategory;
      return categoryMatch && textMatches(product, query.trim().toLowerCase());
    });
  }, [products, activeCategory, query]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter by description, compound, category, or strength..."
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400"
          />
          <p className="self-center text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            {filteredProducts.length} matching products
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveCategory("All")}
            className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
              activeCategory === "All"
                ? "border-sky-400 bg-sky-100 text-sky-800"
                : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
                activeCategory === category
                  ? "border-sky-400 bg-sky-100 text-sky-800"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filteredProducts.map((product, index) => (
          <article
            key={product.slug}
            className="reveal-up rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            style={{ animationDelay: `${index * 65}ms` }}
          >
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{product.category}</p>
            <h2 className="mt-3 text-xl font-semibold text-slate-900">{product.compound}</h2>
            <p className="mt-1 text-sm text-slate-600">{product.name}</p>
            {product.description ? (
              <p className="mt-2 line-clamp-2 text-sm text-slate-600">{product.description}</p>
            ) : null}
            <p
              className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                product.inStock ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"
              }`}
            >
              {product.inStock ? "In Stock" : "Out of Stock"}
            </p>

            <dl className="mt-5 grid grid-cols-2 gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-slate-500">Default Variant</dt>
                <dd className="mt-1 font-semibold text-slate-900">{product.strength}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-slate-500">Price From</dt>
                <dd className="mt-1 font-semibold text-sky-700">{product.priceFrom} / vial</dd>
              </div>
            </dl>

            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              {product.variantCount} variant{product.variantCount === 1 ? "" : "s"}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Link
                href={`/products/${product.slug}`}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400"
              >
                View Details
              </Link>
              {product.inStock ? (
                <CheckoutButton slug={product.slug} variantId={product.defaultVariant.id} compact />
              ) : (
                <button
                  type="button"
                  disabled
                  className="cursor-not-allowed rounded-full bg-slate-300 px-4 py-2 text-sm font-semibold text-slate-600"
                >
                  Out of Stock
                </button>
              )}
              <Link href="/coas" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
                Check COAs
              </Link>
            </div>
          </article>
        ))}
      </section>

      {filteredProducts.length === 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600 shadow-sm">
          No products matched that description/category filter.
        </section>
      ) : null}
    </div>
  );
}
