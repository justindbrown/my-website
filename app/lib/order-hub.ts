import { readFile } from "fs/promises";
import path from "path";

export type OrderHubStatus =
  | "awaiting_payment"
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type OrderHubCustomer = {
  email: string;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type OrderHubOrder = {
  id: string;
  displayId: string;
  customerEmail: string;
  customer: OrderHubCustomer;
  createdAt: string;
  amountUsd: number;
  itemCount: number;
  lineItems: string[];
  status: OrderHubStatus;
  paymentStatus: "paid" | "pending" | "failed";
  trackingState: "tracked" | "not_tracked";
  trackingNumber: string | null;
};

export type OrderHubMetrics = {
  awaitingPayment: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  revenueUsd: number;
};

export type OrderHubPayload = {
  source: "square" | "none";
  updatedAt: string;
  orders: OrderHubOrder[];
  metrics: OrderHubMetrics;
  notice: string | null;
};

type SquarePayment = {
  id: string;
  status?: string;
  created_at?: string;
  amount_money?: {
    amount?: number;
  };
  buyer_email_address?: string;
  order_id?: string;
};

type SquareOrderLineItem = {
  name?: string;
  quantity?: string;
};

type SquareFulfillment = {
  state?: string;
  shipment_details?: {
    tracking_number?: string;
    recipient?: {
      display_name?: string;
      email_address?: string;
      phone_number?: string;
      address?: {
        address_line_1?: string;
        address_line_2?: string;
        locality?: string;
        administrative_district_level_1?: string;
        postal_code?: string;
        country?: string;
      };
    };
  };
};

type SquareOrder = {
  id: string;
  reference_id?: string;
  line_items?: SquareOrderLineItem[];
  fulfillments?: SquareFulfillment[];
};

type StatusOverride = {
  status?: OrderHubStatus;
  trackingNumber?: string | null;
};

type OrderHubExclusions = {
  orderIds: string[];
  customerEmails: string[];
  displayIds: string[];
  displayIdPrefixes: string[];
};

function asUpper(value: string | undefined): string {
  return String(value ?? "").trim().toUpperCase();
}

function toCurrencyValue(cents: number | undefined): number {
  if (!Number.isFinite(cents)) {
    return 0;
  }

  return Number(((cents ?? 0) / 100).toFixed(2));
}

function parseQuantity(value: string | undefined): number {
  const parsed = Number.parseInt(String(value ?? "1"), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function parseCreatedAt(value: string | undefined): string {
  const parsed = Date.parse(String(value ?? ""));
  if (!Number.isFinite(parsed)) {
    return new Date(0).toISOString();
  }

  return new Date(parsed).toISOString();
}

function cleanText(value: string | undefined): string {
  return String(value ?? "").trim();
}

function normalizeEmail(value: string): string {
  return cleanText(value).toLowerCase();
}

function normalizeDisplayId(value: string): string {
  return cleanText(value).replace(/^#/, "").toLowerCase();
}

function inferStatus(payment: SquarePayment, order: SquareOrder | undefined): OrderHubStatus {
  const paymentStatus = asUpper(payment.status);
  const fulfillment = order?.fulfillments?.[0];
  const fulfillmentState = asUpper(fulfillment?.state);
  const hasTracking = Boolean(fulfillment?.shipment_details?.tracking_number);

  if (paymentStatus === "FAILED" || paymentStatus === "CANCELED") {
    return "cancelled";
  }

  if (paymentStatus === "PENDING") {
    return "awaiting_payment";
  }

  if (paymentStatus === "APPROVED") {
    return "pending";
  }

  if (paymentStatus === "COMPLETED") {
    if (fulfillmentState === "COMPLETED") {
      return "delivered";
    }

    if (fulfillmentState === "CANCELED" || fulfillmentState === "FAILED") {
      return "cancelled";
    }

    if (hasTracking) {
      return "shipped";
    }

    return "processing";
  }

  return "pending";
}

function inferPaymentState(paymentStatus: string | undefined): "paid" | "pending" | "failed" {
  const status = asUpper(paymentStatus);

  if (status === "COMPLETED") {
    return "paid";
  }

  if (status === "FAILED" || status === "CANCELED") {
    return "failed";
  }

  return "pending";
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

function getSquareHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
    "Square-Version": process.env.SQUARE_API_VERSION ?? "2024-11-20",
  };
}

async function fetchSquarePayments(limit = 100): Promise<SquarePayment[]> {
  const baseUrl = getSquareApiBaseUrl();
  const response = await fetch(`${baseUrl}/v2/payments?sort_order=DESC&limit=${limit}`, {
    method: "GET",
    headers: getSquareHeaders(),
    cache: "no-store",
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(`Square payments fetch failed: ${response.status} ${JSON.stringify(payload)}`);
  }

  return Array.isArray(payload?.payments) ? (payload.payments as SquarePayment[]) : [];
}

async function fetchSquareOrders(orderIds: string[]): Promise<Map<string, SquareOrder>> {
  if (orderIds.length === 0) {
    return new Map();
  }

  const baseUrl = getSquareApiBaseUrl();
  const locationId = process.env.SQUARE_LOCATION_ID;
  const response = await fetch(`${baseUrl}/v2/orders/batch-retrieve`, {
    method: "POST",
    headers: getSquareHeaders(),
    body: JSON.stringify({
      location_id: locationId,
      order_ids: orderIds.slice(0, 100),
    }),
    cache: "no-store",
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`Square orders fetch failed: ${response.status} ${JSON.stringify(payload)}`);
  }

  const orders = Array.isArray(payload?.orders) ? (payload.orders as SquareOrder[]) : [];
  return new Map(orders.map((order) => [order.id, order]));
}

async function readStatusOverrides(): Promise<Record<string, StatusOverride>> {
  try {
    const overridesPath = path.join(process.cwd(), "data", "order-status-overrides.json");
    const content = await readFile(overridesPath, "utf8");
    const parsed = JSON.parse(content) as Record<string, StatusOverride>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function readOrderExclusions(): Promise<OrderHubExclusions> {
  try {
    const exclusionsPath = path.join(process.cwd(), "data", "order-exclusions.json");
    const content = await readFile(exclusionsPath, "utf8");
    const parsed = JSON.parse(content) as
      | string[]
      | {
          orderIds?: string[];
          paymentIds?: string[];
          customerEmails?: string[];
          displayIds?: string[];
          displayIdPrefixes?: string[];
        };

    if (Array.isArray(parsed)) {
      return {
        orderIds: parsed.map((value) => String(value).trim()).filter(Boolean),
        customerEmails: [],
        displayIds: [],
        displayIdPrefixes: [],
      };
    }

    const readStringList = (values: string[] | undefined, normalizer?: (value: string) => string) =>
      Array.isArray(values)
        ? values
            .map((value) => String(value))
            .map((value) => (normalizer ? normalizer(value) : value.trim()))
            .filter(Boolean)
        : [];

    const orderIds = [
      ...readStringList(parsed?.orderIds),
      ...readStringList(parsed?.paymentIds),
    ];
    const customerEmails = readStringList(parsed?.customerEmails, normalizeEmail);
    const displayIds = readStringList(parsed?.displayIds, normalizeDisplayId);
    const displayIdPrefixes = readStringList(parsed?.displayIdPrefixes, normalizeDisplayId);

    return {
      orderIds,
      customerEmails,
      displayIds,
      displayIdPrefixes,
    };
  } catch {
    return {
      orderIds: [],
      customerEmails: [],
      displayIds: [],
      displayIdPrefixes: [],
    };
  }
}

function isLikelySampleOrder(order: OrderHubOrder): boolean {
  const email = normalizeEmail(order.customerEmail);
  const displayId = cleanText(order.displayId).toLowerCase();
  const hasPlaceholderItems =
    order.lineItems.length === 0 ||
    order.lineItems.some((line) => cleanText(line).toLowerCase() === "no line items provided");

  if (email === "unknown@customer" && hasPlaceholderItems) {
    return true;
  }

  if (email.endsWith("@example.com") || email.includes("+test@")) {
    return true;
  }

  if (/(sample|demo|test)/.test(displayId)) {
    return true;
  }

  return false;
}

function buildMetrics(orders: OrderHubOrder[]): OrderHubMetrics {
  const metrics: OrderHubMetrics = {
    awaitingPayment: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    revenueUsd: 0,
  };

  for (const order of orders) {
    if (order.status === "awaiting_payment") {
      metrics.awaitingPayment += 1;
    } else if (order.status === "pending") {
      metrics.pending += 1;
    } else if (order.status === "processing") {
      metrics.processing += 1;
    } else if (order.status === "shipped") {
      metrics.shipped += 1;
    } else if (order.status === "delivered") {
      metrics.delivered += 1;
    } else if (order.status === "cancelled") {
      metrics.cancelled += 1;
    }

    if (order.paymentStatus === "paid") {
      metrics.revenueUsd += order.amountUsd;
    }
  }

  metrics.revenueUsd = Number(metrics.revenueUsd.toFixed(2));
  return metrics;
}

function buildDisplayId(payment: SquarePayment, order: SquareOrder | undefined): string {
  const reference = String(order?.reference_id ?? "").trim();
  if (reference) {
    return reference.startsWith("#") ? reference : `#${reference}`;
  }

  return `#MLR-${payment.id.slice(0, 8).toUpperCase()}`;
}

export async function getOrderHubPayload(): Promise<OrderHubPayload> {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN?.trim();
  const locationId = process.env.SQUARE_LOCATION_ID?.trim();

  if (!accessToken || !locationId) {
    const emptyOrders: OrderHubOrder[] = [];
    return {
      source: "none",
      updatedAt: new Date().toISOString(),
      orders: emptyOrders,
      metrics: buildMetrics(emptyOrders),
      notice: "Square is not configured. Set SQUARE_ACCESS_TOKEN and SQUARE_LOCATION_ID to load live orders.",
    };
  }

  try {
    const [payments, overrides, exclusions] = await Promise.all([
      fetchSquarePayments(100),
      readStatusOverrides(),
      readOrderExclusions(),
    ]);
    const orderIds = Array.from(new Set(payments.map((payment) => payment.order_id).filter(Boolean))) as string[];
    const orderMap = await fetchSquareOrders(orderIds);

    const orders: OrderHubOrder[] = payments.map((payment) => {
      const order = payment.order_id ? orderMap.get(payment.order_id) : undefined;
      const lineItems = Array.isArray(order?.line_items)
        ? order!.line_items!.map((line) => {
            const name = String(line.name ?? "Item").trim();
            const quantity = parseQuantity(line.quantity);
            return `${name} x${quantity}`;
          })
        : [];
      const itemCount =
        lineItems.length > 0
          ? (order?.line_items ?? []).reduce((sum, item) => sum + parseQuantity(item.quantity), 0)
          : 1;
      const fulfillment = order?.fulfillments?.[0];
      const inferredStatus = inferStatus(payment, order);
      const override = overrides[payment.id];
      const status = override?.status ?? inferredStatus;
      const trackingNumber = override?.trackingNumber ?? fulfillment?.shipment_details?.tracking_number ?? null;

      return {
        id: payment.id,
        displayId: buildDisplayId(payment, order),
        customerEmail:
          cleanText(payment.buyer_email_address) ||
          cleanText(fulfillment?.shipment_details?.recipient?.email_address) ||
          "unknown@customer",
        customer: {
          email:
            cleanText(payment.buyer_email_address) ||
            cleanText(fulfillment?.shipment_details?.recipient?.email_address) ||
            "unknown@customer",
          name: cleanText(fulfillment?.shipment_details?.recipient?.display_name) || "Unknown Customer",
          phone: cleanText(fulfillment?.shipment_details?.recipient?.phone_number),
          addressLine1: cleanText(fulfillment?.shipment_details?.recipient?.address?.address_line_1),
          addressLine2: cleanText(fulfillment?.shipment_details?.recipient?.address?.address_line_2),
          city: cleanText(fulfillment?.shipment_details?.recipient?.address?.locality),
          state: cleanText(
            fulfillment?.shipment_details?.recipient?.address?.administrative_district_level_1
          ),
          postalCode: cleanText(fulfillment?.shipment_details?.recipient?.address?.postal_code),
          country: cleanText(fulfillment?.shipment_details?.recipient?.address?.country),
        },
        createdAt: parseCreatedAt(payment.created_at),
        amountUsd: toCurrencyValue(payment.amount_money?.amount),
        itemCount,
        lineItems: lineItems.length > 0 ? lineItems : ["No line items provided"],
        status,
        paymentStatus: inferPaymentState(payment.status),
        trackingState: trackingNumber ? "tracked" : "not_tracked",
        trackingNumber,
      };
    });

    const hideSampleOrders = process.env.ORDER_HUB_HIDE_SAMPLE_ORDERS !== "false";
    const excludedOrderIds = new Set(exclusions.orderIds);
    const excludedEmails = new Set(exclusions.customerEmails);
    const excludedDisplayIds = new Set(exclusions.displayIds);
    const visibleOrders = orders.filter((order) => {
      if (excludedOrderIds.has(order.id)) {
        return false;
      }

      if (excludedEmails.has(normalizeEmail(order.customerEmail))) {
        return false;
      }

      const normalizedDisplayId = normalizeDisplayId(order.displayId);
      if (excludedDisplayIds.has(normalizedDisplayId)) {
        return false;
      }

      if (exclusions.displayIdPrefixes.some((prefix) => normalizedDisplayId.startsWith(prefix))) {
        return false;
      }

      if (hideSampleOrders && isLikelySampleOrder(order)) {
        return false;
      }

      return true;
    });

    const sortedOrders = visibleOrders.sort(
      (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt)
    );

    return {
      source: "square",
      updatedAt: new Date().toISOString(),
      orders: sortedOrders,
      metrics: buildMetrics(sortedOrders),
      notice: null,
    };
  } catch (error) {
    const emptyOrders: OrderHubOrder[] = [];
    return {
      source: "none",
      updatedAt: new Date().toISOString(),
      orders: emptyOrders,
      metrics: buildMetrics(emptyOrders),
      notice:
        error instanceof Error
          ? `Could not load Square orders: ${error.message}`
          : "Could not load Square orders.",
    };
  }
}
