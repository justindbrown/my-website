import { NextResponse } from "next/server";
import { getCatalogProducts } from "../../lib/catalog";
import { getNotifyRequestCount } from "../../lib/notify-store";
import { logEvent } from "../../lib/observability";

export const runtime = "nodejs";

export async function GET() {
  try {
    const catalogProducts = getCatalogProducts();
    const notifyRequests = await getNotifyRequestCount();

    return NextResponse.json(
      {
        status: "ok",
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        nodeEnv: process.env.NODE_ENV ?? "unknown",
        squareConfigured: Boolean(process.env.SQUARE_ACCESS_TOKEN && process.env.SQUARE_LOCATION_ID),
        catalogProductCount: catalogProducts.length,
        notifyRequestCount: notifyRequests,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    await logEvent("error", "health_check_failed", {
      message: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
