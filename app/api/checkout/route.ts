import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getProductBySlug, getProductVariant } from "../../lib/catalog";
import { logEvent } from "../../lib/observability";

export const runtime = "nodejs";

const FREE_SHIPPING_THRESHOLD_CENTS = 30000;
const SHIPPING_FEE_CENTS = 1500;

type CheckoutPayload = {
  slug: string;
  variantId: string | null;
  quantity: number;
  finalSaleAcknowledged: boolean;
};

function hasResearchAcknowledgement(request: NextRequest): boolean {
  return (
    request.cookies.get("mlr_research_gate_v2")?.value === "accepted" ||
    request.cookies.get("mlr_research_gate_v1")?.value === "accepted"
  );
}

function parseUnitAmount(price: string): number | null {
  const amount = Number.parseFloat(price.replace(/[^0-9.]+/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return Math.round(amount * 100);
}

async function getPayload(request: NextRequest): Promise<CheckoutPayload> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = await request.json();
    const slug = String(body.slug ?? "").trim();
    const variantId = String(body.variantId ?? "").trim() || null;
    const quantity = Number.parseInt(String(body.quantity ?? "1"), 10);
    const finalSaleAcknowledged =
      body.finalSaleAcknowledged === true ||
      String(body.finalSaleAcknowledged ?? "")
        .trim()
        .toLowerCase() === "yes";

    return {
      slug,
      variantId,
      quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
      finalSaleAcknowledged,
    };
  }

  const formData = await request.formData();
  const slug = String(formData.get("slug") ?? "").trim();
  const variantId = String(formData.get("variantId") ?? "").trim() || null;
  const quantity = Number.parseInt(String(formData.get("quantity") ?? "1"), 10);
  const finalSaleAcknowledged =
    String(formData.get("finalSaleAcknowledged") ?? "")
      .trim()
      .toLowerCase() === "yes";

  return {
    slug,
    variantId,
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    finalSaleAcknowledged,
  };
}

function getSquareApiBaseUrl(): string {
  const explicitBase = process.env.SQUARE_API_BASE_URL?.trim();
  if (explicitBase) {
    return explicitBase.replace(/\/$/, "");
  }

  const environment = (process.env.SQUARE_ENVIRONMENT ?? "production").toLowerCase();
  return environment === "sandbox"
    ? "https://connect.squareupsandbox.com"
    : "https://connect.squareup.com";
}

async function createSquareCheckoutLink(input: {
  name: string;
  description: string;
  amountCents: number;
}) {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID;
  const squareVersion = process.env.SQUARE_API_VERSION ?? "2024-11-20";

  if (!accessToken || !locationId) {
    throw new Error("Square is not configured. Missing SQUARE_ACCESS_TOKEN or SQUARE_LOCATION_ID.");
  }

  const response = await fetch(`${getSquareApiBaseUrl()}/v2/online-checkout/payment-links`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Square-Version": squareVersion,
    },
    body: JSON.stringify({
      idempotency_key: randomUUID(),
      quick_pay: {
        name: input.name,
        location_id: locationId,
        price_money: {
          amount: input.amountCents,
          currency: "USD",
        },
      },
      checkout_options: {
        ask_for_shipping_address: true,
        redirect_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/checkout/success`,
      },
      description: input.description,
    }),
  });

  const payload = await response.json();

  if (!response.ok) {
    const details = JSON.stringify(payload);
    throw new Error(`Square checkout creation failed: ${response.status} ${details}`);
  }

  const url = payload?.payment_link?.url;
  if (typeof url !== "string" || !url) {
    throw new Error("Square did not return a checkout URL.");
  }

  return url;
}

function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export async function POST(request: NextRequest) {
  try {
    const accept = request.headers.get("accept") ?? "";
    const contentType = request.headers.get("content-type") ?? "";
    const wantsJson = accept.includes("application/json") || contentType.includes("application/json");

    const { slug, variantId, quantity, finalSaleAcknowledged } = await getPayload(request);

    if (!slug) {
      return NextResponse.json({ error: "Missing product slug." }, { status: 400 });
    }

    if (!hasResearchAcknowledgement(request)) {
      if (wantsJson) {
        return NextResponse.json(
          { error: "Research-use acknowledgment is required before checkout." },
          { status: 403 }
        );
      }

      return NextResponse.redirect(new URL("/legal/terms?ack=required", request.url), { status: 303 });
    }

    if (!finalSaleAcknowledged) {
      if (wantsJson) {
        return NextResponse.json(
          { error: "Final-sale policy acknowledgment is required before checkout." },
          { status: 400 }
        );
      }

      return NextResponse.redirect(new URL("/legal/shipping-returns", request.url), { status: 303 });
    }

    const product = getProductBySlug(slug);
    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const variant = getProductVariant(product, variantId);
    if (!variant) {
      return NextResponse.json({ error: "Variant not found." }, { status: 404 });
    }

    if (!variant.inStock) {
      await logEvent("warn", "checkout_blocked_out_of_stock", {
        slug: product.slug,
        variantId: variant.id,
      });
      return NextResponse.json({ error: "Product is currently out of stock." }, { status: 409 });
    }

    const unitAmount = parseUnitAmount(variant.price);
    if (!unitAmount) {
      return NextResponse.json({ error: "Product has invalid pricing." }, { status: 400 });
    }

    const safeQuantity = Math.min(Math.max(quantity, 1), 20);
    const subtotalCents = unitAmount * safeQuantity;
    const shippingFeeCents =
      subtotalCents < FREE_SHIPPING_THRESHOLD_CENTS ? SHIPPING_FEE_CENTS : 0;
    const amountCents = subtotalCents + shippingFeeCents;
    const squareCheckoutName = `${safeQuantity} amount of Product`;
    const squareCheckoutDescription = `Research order - Qty ${safeQuantity} - Subtotal ${formatUsd(subtotalCents)} - Shipping ${formatUsd(shippingFeeCents)}`;

    const checkoutUrl = await createSquareCheckoutLink({
      name: squareCheckoutName,
      description: squareCheckoutDescription,
      amountCents,
    });

    await logEvent("info", "checkout_link_created", {
      slug: product.slug,
      variantId: variant.id,
      quantity: safeQuantity,
      subtotalUsd: Number((subtotalCents / 100).toFixed(2)),
      shippingUsd: Number((shippingFeeCents / 100).toFixed(2)),
      totalUsd: Number((amountCents / 100).toFixed(2)),
    });

    return NextResponse.redirect(checkoutUrl, { status: 303 });
  } catch (error) {
    await logEvent("error", "checkout_failed", {
      message: error instanceof Error ? error.message : String(error),
    });

    const message = error instanceof Error ? error.message : "Checkout initialization failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
