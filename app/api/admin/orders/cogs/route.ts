import { NextRequest, NextResponse } from "next/server";
import { isOrderHubAuthorizedRequest } from "../../../../lib/order-hub-auth";
import { saveOrderCogs } from "../../../../lib/order-finance";

export const runtime = "nodejs";

type CogsPayload = {
  orderId: string;
  cogsUsd: number;
};

async function parsePayload(request: NextRequest): Promise<CogsPayload> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = await request.json();
    const orderId = String(body.orderId ?? "").trim();
    const cogsUsd = Number(body.cogsUsd ?? 0);
    return {
      orderId,
      cogsUsd: Number.isFinite(cogsUsd) ? cogsUsd : 0,
    };
  }

  const formData = await request.formData();
  const orderId = String(formData.get("orderId") ?? "").trim();
  const cogsUsd = Number(formData.get("cogsUsd") ?? 0);
  return {
    orderId,
    cogsUsd: Number.isFinite(cogsUsd) ? cogsUsd : 0,
  };
}

export async function POST(request: NextRequest) {
  if (!isOrderHubAuthorizedRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await parsePayload(request);
  if (!payload.orderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  }

  if (!Number.isFinite(payload.cogsUsd) || payload.cogsUsd < 0) {
    return NextResponse.json({ error: "Invalid cogsUsd" }, { status: 400 });
  }

  await saveOrderCogs(payload.orderId, payload.cogsUsd);
  return NextResponse.json({ ok: true }, { status: 200 });
}
