"use client";

import Link from "next/link";

type CheckoutButtonProps = {
  slug: string;
  variantId?: string;
  quantity?: number;
  label?: string;
  className?: string;
  compact?: boolean;
};

export default function CheckoutButton({
  slug,
  variantId,
  quantity = 1,
  label = "Buy Now",
  className,
  compact = false,
}: CheckoutButtonProps) {
  const checkboxId = `final-sale-${slug}-${variantId ?? "default"}`;

  return (
    <form action="/api/checkout" method="post" className="space-y-2">
      <input type="hidden" name="slug" value={slug} />
      {variantId ? <input type="hidden" name="variantId" value={variantId} /> : null}
      <input type="hidden" name="quantity" value={quantity} />
      <label htmlFor={checkboxId} className="flex items-start gap-2 text-xs text-slate-600">
        <input
          id={checkboxId}
          name="finalSaleAcknowledged"
          type="checkbox"
          value="yes"
          required
          className="mt-0.5 h-3.5 w-3.5"
        />
        <span>
          {compact ? "Final sale policy accepted." : "I understand all sales are final except where required by law."}{" "}
          Orders under $300 include a $15 shipping fee.{" "}
          <Link href="/legal/shipping-returns" className="font-semibold text-sky-700 hover:text-sky-900">
            Review policy
          </Link>
          .
        </span>
      </label>
      <button
        type="submit"
        className={
          className ??
          "rounded-full bg-sky-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-800"
        }
      >
        {label}
      </button>
    </form>
  );
}
