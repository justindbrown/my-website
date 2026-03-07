import { NextRequest, NextResponse } from "next/server";
import { readOrderCogsMap, buildTaxBreakdown } from "../../../../lib/order-finance";
import { getOrderHubPayload } from "../../../../lib/order-hub";
import { isOrderHubAuthorizedRequest } from "../../../../lib/order-hub-auth";

export const runtime = "nodejs";

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

function asMoney(value: number): string {
  return value.toFixed(2);
}

export async function GET(request: NextRequest) {
  if (!isOrderHubAuthorizedRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scope = (request.nextUrl.searchParams.get("scope") ?? "paid").toLowerCase();
  const payload = await getOrderHubPayload();
  const cogsMap = await readOrderCogsMap();
  const orders = scope === "all" ? payload.orders : payload.orders.filter((order) => order.paymentStatus === "paid");

  const header = [
    "display_id",
    "payment_id",
    "created_at",
    "status",
    "payment_status",
    "customer_email",
    "customer_name",
    "customer_phone",
    "customer_address_1",
    "customer_address_2",
    "customer_city",
    "customer_state",
    "customer_postal_code",
    "customer_country",
    "items",
    "gross_usd",
    "cogs_usd",
    "taxable_profit_usd",
  ];

  const rows = orders.map((order) => {
    const cogs = cogsMap[order.id]?.cogsUsd ?? 0;
    const taxable = Number((order.amountUsd - cogs).toFixed(2));
    return [
      order.displayId,
      order.id,
      order.createdAt,
      order.status,
      order.paymentStatus,
      order.customer.email,
      order.customer.name,
      order.customer.phone,
      order.customer.addressLine1,
      order.customer.addressLine2,
      order.customer.city,
      order.customer.state,
      order.customer.postalCode,
      order.customer.country,
      order.lineItems.join(" | "),
      asMoney(order.amountUsd),
      asMoney(cogs),
      asMoney(taxable),
    ].map((value) => escapeCsv(String(value)));
  });

  const breakdown = buildTaxBreakdown(payload.orders, cogsMap);
  const summaryRows = [
    [],
    ["summary_scope", scope],
    ["summary_paid_orders", String(breakdown.paidOrderCount)],
    ["summary_gross_revenue_usd", asMoney(breakdown.grossRevenueUsd)],
    ["summary_total_cogs_usd", asMoney(breakdown.totalCogsUsd)],
    ["summary_taxable_profit_usd", asMoney(breakdown.taxableProfitUsd)],
  ];

  const csv = [header, ...rows, ...summaryRows].map((row) => row.join(",")).join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=\"orders-tax-${scope}-${new Date()
        .toISOString()
        .slice(0, 10)}.csv\"`,
      "Cache-Control": "no-store",
    },
  });
}
