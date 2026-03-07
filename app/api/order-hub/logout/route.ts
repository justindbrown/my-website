import { NextRequest, NextResponse } from "next/server";
import { ORDER_HUB_AUTH_COOKIE } from "../../../lib/order-hub-auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/order-hub", request.url), { status: 303 });
  response.cookies.set({
    name: ORDER_HUB_AUTH_COOKIE,
    value: "",
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    expires: new Date(0),
  });
  return response;
}
