import { NextRequest, NextResponse } from "next/server";
import {
  ORDER_HUB_AUTH_COOKIE,
  expectedOrderHubAuthToken,
  getOrderHubAccessKey,
  getOrderHubAuthTtlSeconds,
} from "../../../lib/order-hub-auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const accessKey = getOrderHubAccessKey();
  if (!accessKey) {
    return NextResponse.redirect(new URL("/order-hub?auth=not_configured", request.url), {
      status: 303,
    });
  }

  const formData = await request.formData();
  const submittedKey = String(formData.get("accessKey") ?? "").trim();

  if (submittedKey !== accessKey) {
    return NextResponse.redirect(new URL("/order-hub?auth=invalid", request.url), { status: 303 });
  }

  const response = NextResponse.redirect(new URL("/order-hub", request.url), { status: 303 });
  const secureCookie = request.nextUrl.protocol === "https:";
  response.cookies.set({
    name: ORDER_HUB_AUTH_COOKIE,
    value: expectedOrderHubAuthToken(accessKey),
    path: "/",
    httpOnly: true,
    secure: secureCookie,
    sameSite: "lax",
    maxAge: getOrderHubAuthTtlSeconds(),
  });
  return response;
}
