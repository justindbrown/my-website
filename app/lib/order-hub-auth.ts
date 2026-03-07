import { createHash } from "crypto";
import type { NextRequest } from "next/server";

export const ORDER_HUB_AUTH_COOKIE = "mlr_order_hub_auth";

export function getOrderHubAccessKey(): string | null {
  const key = process.env.ORDER_HUB_ACCESS_KEY?.trim();
  return key ? key : null;
}

export function isOrderHubAuthConfigured(): boolean {
  return Boolean(getOrderHubAccessKey());
}

export function expectedOrderHubAuthToken(accessKey: string): string {
  return createHash("sha256").update(`order-hub:v2:${accessKey}`).digest("hex");
}

export function getOrderHubAuthTtlSeconds(): number {
  const raw = Number.parseInt(String(process.env.ORDER_HUB_AUTH_TTL_SECONDS ?? "900"), 10);
  if (!Number.isFinite(raw) || raw <= 0) {
    return 900;
  }

  return Math.max(60, Math.min(raw, 60 * 60 * 24));
}

export function isOrderHubAuthorizedCookie(cookieValue: string | undefined): boolean {
  const accessKey = getOrderHubAccessKey();
  if (!accessKey) {
    return false;
  }

  if (!cookieValue) {
    return false;
  }

  return cookieValue === expectedOrderHubAuthToken(accessKey);
}

export function isOrderHubAuthorizedRequest(request: NextRequest): boolean {
  return isOrderHubAuthorizedCookie(request.cookies.get(ORDER_HUB_AUTH_COOKIE)?.value);
}
