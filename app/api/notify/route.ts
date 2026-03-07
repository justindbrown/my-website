import { NextRequest, NextResponse } from "next/server";
import { getProductBySlug, getProductVariant } from "../../lib/catalog";
import { saveNotifyRequest } from "../../lib/notify-store";
import { logEvent } from "../../lib/observability";

export const runtime = "nodejs";

type NotifyPayload = {
  email: string;
  slug: string;
  variantId: string | null;
  returnTo: string;
};

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function parsePayloadFromForm(request: NextRequest, formData: FormData): NotifyPayload {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const slug = String(formData.get("slug") ?? "").trim();
  const variantIdRaw = String(formData.get("variantId") ?? "").trim();
  const returnToRaw = String(formData.get("returnTo") ?? "").trim();

  const safeReturnTo =
    returnToRaw.startsWith("/") && !returnToRaw.startsWith("//")
      ? returnToRaw
      : request.nextUrl.searchParams.get("returnTo") || "/products";

  return {
    email,
    slug,
    variantId: variantIdRaw || null,
    returnTo: safeReturnTo,
  };
}

async function parsePayload(request: NextRequest): Promise<NotifyPayload> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const slug = String(body.slug ?? "").trim();
    const variantId = String(body.variantId ?? "").trim() || null;
    const returnTo = String(body.returnTo ?? "/products").trim();

    return {
      email,
      slug,
      variantId,
      returnTo: returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/products",
    };
  }

  const formData = await request.formData();
  return parsePayloadFromForm(request, formData);
}

function withNotifyStatus(returnTo: string, status: string): string {
  const separator = returnTo.includes("?") ? "&" : "?";
  return `${returnTo}${separator}notify=${status}`;
}

function sourceIpFromRequest(request: NextRequest): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return request.headers.get("x-real-ip");
}

export async function POST(request: NextRequest) {
  const accept = request.headers.get("accept") ?? "";
  const wantsJson = accept.includes("application/json");

  try {
    const payload = await parsePayload(request);

    if (!isValidEmail(payload.email)) {
      if (wantsJson) {
        return NextResponse.json({ error: "Invalid email." }, { status: 400 });
      }

      return NextResponse.redirect(
        new URL(withNotifyStatus(payload.returnTo, "invalid_email"), request.url),
        303
      );
    }

    const product = getProductBySlug(payload.slug);
    if (!product) {
      if (wantsJson) {
        return NextResponse.json({ error: "Product not found." }, { status: 404 });
      }

      return NextResponse.redirect(
        new URL(withNotifyStatus(payload.returnTo, "invalid_product"), request.url),
        303
      );
    }

    const variant = getProductVariant(product, payload.variantId);
    await saveNotifyRequest({
      email: payload.email,
      slug: product.slug,
      productName: product.name,
      variantId: variant?.id ?? null,
      variantLabel: variant?.label ?? null,
      sourceIp: sourceIpFromRequest(request),
      userAgent: request.headers.get("user-agent"),
    });

    await logEvent("info", "notify_request_saved", {
      slug: product.slug,
      variantId: variant?.id ?? null,
    });

    if (wantsJson) {
      return NextResponse.json({ ok: true }, { status: 201 });
    }

    return NextResponse.redirect(new URL(withNotifyStatus(payload.returnTo, "success"), request.url), 303);
  } catch (error) {
    await logEvent("error", "notify_request_failed", {
      message: error instanceof Error ? error.message : String(error),
    });

    if (wantsJson) {
      return NextResponse.json({ error: "Failed to save notify request." }, { status: 500 });
    }

    return NextResponse.redirect(new URL(withNotifyStatus("/products", "error"), request.url), 303);
  }
}
