import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { OrderHubOrder } from "./order-hub";

export type OrderCogsEntry = {
  cogsUsd: number;
  updatedAt: string;
};

export type OrderCogsMap = Record<string, OrderCogsEntry>;

export type TaxBreakdown = {
  grossRevenueUsd: number;
  totalCogsUsd: number;
  taxableProfitUsd: number;
  paidOrderCount: number;
};

const cogsPath = path.join(process.cwd(), "data", "order-cogs.json");

function roundMoney(value: number): number {
  return Number(value.toFixed(2));
}

export async function readOrderCogsMap(): Promise<OrderCogsMap> {
  try {
    const content = await readFile(cogsPath, "utf8");
    const parsed = JSON.parse(content) as OrderCogsMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export async function saveOrderCogs(orderId: string, cogsUsd: number): Promise<OrderCogsMap> {
  const current = await readOrderCogsMap();
  current[orderId] = {
    cogsUsd: roundMoney(Math.max(0, cogsUsd)),
    updatedAt: new Date().toISOString(),
  };

  await mkdir(path.dirname(cogsPath), { recursive: true });
  await writeFile(cogsPath, JSON.stringify(current, null, 2) + "\n", "utf8");
  return current;
}

export function buildTaxBreakdown(orders: OrderHubOrder[], cogsMap: OrderCogsMap): TaxBreakdown {
  let grossRevenueUsd = 0;
  let totalCogsUsd = 0;
  let paidOrderCount = 0;

  for (const order of orders) {
    if (order.paymentStatus !== "paid") {
      continue;
    }

    paidOrderCount += 1;
    grossRevenueUsd += order.amountUsd;
    totalCogsUsd += cogsMap[order.id]?.cogsUsd ?? 0;
  }

  grossRevenueUsd = roundMoney(grossRevenueUsd);
  totalCogsUsd = roundMoney(totalCogsUsd);

  return {
    grossRevenueUsd,
    totalCogsUsd,
    taxableProfitUsd: roundMoney(grossRevenueUsd - totalCogsUsd),
    paidOrderCount,
  };
}
