"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { OrderHubOrder, OrderHubPayload, OrderHubStatus } from "../lib/order-hub";

type OrderHubClientProps = {
  payload: OrderHubPayload;
};

type SortMode = "newest" | "oldest" | "highest" | "lowest";

const STATUS_LABELS: Record<OrderHubStatus, string> = {
  awaiting_payment: "Awaiting Payment",
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_CLASSES: Record<OrderHubStatus, string> = {
  awaiting_payment: "border-amber-200 bg-amber-50 text-amber-800",
  pending: "border-yellow-200 bg-yellow-50 text-yellow-800",
  processing: "border-blue-200 bg-blue-50 text-blue-800",
  shipped: "border-indigo-200 bg-indigo-50 text-indigo-800",
  delivered: "border-emerald-200 bg-emerald-50 text-emerald-800",
  cancelled: "border-rose-200 bg-rose-50 text-rose-800",
};

function orderMatches(order: OrderHubOrder, query: string): boolean {
  if (!query) {
    return true;
  }

  const value = query.toLowerCase();
  const haystack = [
    order.displayId,
    order.customerEmail,
    order.lineItems.join(" "),
    STATUS_LABELS[order.status],
    order.trackingNumber ?? "",
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(value);
}

function applySort(orders: OrderHubOrder[], mode: SortMode): OrderHubOrder[] {
  const sorted = [...orders];

  if (mode === "newest") {
    return sorted.sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
  }

  if (mode === "oldest") {
    return sorted.sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt));
  }

  if (mode === "highest") {
    return sorted.sort((left, right) => right.amountUsd - left.amountUsd);
  }

  return sorted.sort((left, right) => left.amountUsd - right.amountUsd);
}

function formatDate(value: string): string {
  const date = new Date(value);
  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export default function OrderHubClient({ payload }: OrderHubClientProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderHubStatus>("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [trackedOnly, setTrackedOnly] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);

  const filteredOrders = useMemo(() => {
    const byQuery = payload.orders.filter((order) => orderMatches(order, query));
    const byStatus =
      statusFilter === "all" ? byQuery : byQuery.filter((order) => order.status === statusFilter);
    const byTracking = trackedOnly
      ? byStatus.filter((order) => order.trackingState === "tracked")
      : byStatus;
    return applySort(byTracking, sortMode);
  }, [payload.orders, query, sortMode, statusFilter, trackedOnly]);

  const predictiveMetrics = useMemo(() => {
    const openOrders = payload.orders.filter((order) =>
      ["awaiting_payment", "pending", "processing", "shipped"].includes(order.status)
    ).length;
    const trackedOrders = payload.orders.filter((order) => order.trackingState === "tracked").length;
    const paidOrders = payload.orders.filter((order) => order.paymentStatus === "paid").length;
    return {
      openOrders,
      trackedOrders,
      paidOrders,
    };
  }, [payload.orders]);

  return (
    <div className="space-y-8 pb-12">
      <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-10">
        <p className="section-kicker">Operations</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900 md:text-6xl">
          ORDER <span className="text-rose-700">HUB</span>
        </h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Manage orders, shipping, tracking, and revenue in one place.
        </p>

        {payload.notice ? (
          <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            {payload.notice}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTrackedOnly((current) => !current)}
            className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white ${
              trackedOnly ? "bg-violet-700" : "bg-violet-500"
            }`}
          >
            Tracking Hub
          </button>
          <button
            type="button"
            onClick={() => setShowPredictions((current) => !current)}
            className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white ${
              showPredictions ? "bg-rose-700" : "bg-rose-500"
            }`}
          >
            Predictions
          </button>
          <Link
            href="/admin/orders"
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white"
          >
            Tax Report
          </Link>
          <form action="/api/order-hub/logout" method="post">
            <button
              type="submit"
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-700 hover:border-slate-400 hover:text-slate-900"
            >
              Sign Out
            </button>
          </form>
        </div>
      </section>

      {showPredictions ? (
        <section className="grid gap-3 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Open Orders</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{predictiveMetrics.openOrders}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Tracked Orders</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{predictiveMetrics.trackedOrders}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Paid Orders</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{predictiveMetrics.paidOrders}</p>
          </article>
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <article className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">Awaiting Payment</p>
          <p className="mt-2 text-3xl font-bold text-amber-900">{payload.metrics.awaitingPayment}</p>
        </article>
        <article className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-yellow-800">Pending</p>
          <p className="mt-2 text-3xl font-bold text-yellow-900">{payload.metrics.pending}</p>
        </article>
        <article className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-800">Processing</p>
          <p className="mt-2 text-3xl font-bold text-blue-900">{payload.metrics.processing}</p>
        </article>
        <article className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-800">Shipped</p>
          <p className="mt-2 text-3xl font-bold text-indigo-900">{payload.metrics.shipped}</p>
        </article>
        <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">Delivered</p>
          <p className="mt-2 text-3xl font-bold text-emerald-900">{payload.metrics.delivered}</p>
        </article>
        <article className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-800">Cancelled</p>
          <p className="mt-2 text-3xl font-bold text-rose-900">{payload.metrics.cancelled}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">Revenue</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{formatMoney(payload.metrics.revenueUsd)}</p>
        </article>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search orders, customers, tracking..."
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as "all" | OrderHubStatus)}
            className="rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-sky-400"
          >
            <option value="all">All Orders</option>
            <option value="awaiting_payment">Awaiting Payment</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as SortMode)}
            className="rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-sky-400"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Value</option>
            <option value="lowest">Lowest Value</option>
          </select>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm md:p-4">
        <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          {filteredOrders.length} orders {trackedOnly ? "(tracked only)" : ""}
        </div>

        <div className="space-y-2">
          {filteredOrders.map((order) => (
            <article key={order.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-base font-bold text-slate-900">{order.displayId}</p>
                  <p className="text-sm text-slate-600">{order.customerEmail}</p>
                  <p className="mt-1 text-sm text-slate-700">{order.lineItems.join(" | ")}</p>
                </div>

                <div className="text-right">
                  <p className="text-lg font-bold text-rose-700">{formatMoney(order.amountUsd)}</p>
                  <p className="text-xs text-slate-500">{formatDate(order.createdAt)}</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.12em]">
                <span className={`rounded-full border px-2.5 py-1 ${STATUS_CLASSES[order.status]}`}>
                  {STATUS_LABELS[order.status]}
                </span>
                <span
                  className={`rounded-full border px-2.5 py-1 ${
                    order.paymentStatus === "paid"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : order.paymentStatus === "failed"
                        ? "border-rose-200 bg-rose-50 text-rose-800"
                        : "border-amber-200 bg-amber-50 text-amber-800"
                  }`}
                >
                  {order.paymentStatus}
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-700">
                  {order.itemCount} item{order.itemCount === 1 ? "" : "s"}
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-700">
                  {order.trackingState === "tracked" ? "Tracked" : "No Tracking"}
                </span>
              </div>
            </article>
          ))}

          {filteredOrders.length === 0 ? (
            <article className="rounded-2xl border border-slate-100 bg-slate-50 p-8 text-center text-sm text-slate-600">
              No orders found for this filter.
            </article>
          ) : null}
        </div>
      </section>
    </div>
  );
}
