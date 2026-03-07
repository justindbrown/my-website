"use client";

import { useMemo, useState } from "react";
import type { OrderHubOrder } from "../../lib/order-hub";

type AdminOrderRow = OrderHubOrder & {
  cogsUsd: number;
};

type OrdersAdminClientProps = {
  initialRows: AdminOrderRow[];
  notice: string | null;
};

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function formatDate(value: string): string {
  const date = new Date(value);
  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

export default function OrdersAdminClient({ initialRows, notice }: OrdersAdminClientProps) {
  const [rows, setRows] = useState<AdminOrderRow[]>(initialRows);
  const [query, setQuery] = useState("");
  const [draftCogs, setDraftCogs] = useState<Record<string, string>>(
    Object.fromEntries(initialRows.map((row) => [row.id, row.cogsUsd.toFixed(2)]))
  );
  const [savingById, setSavingById] = useState<Record<string, boolean>>({});
  const [statusById, setStatusById] = useState<Record<string, string>>({});

  const filteredRows = useMemo(() => {
    if (!query.trim()) {
      return rows;
    }

    const value = query.toLowerCase();
    return rows.filter((row) => {
      const haystack = [
        row.displayId,
        row.customer.email,
        row.customer.name,
        row.customer.phone,
        row.lineItems.join(" "),
        row.status,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(value);
    });
  }, [rows, query]);

  const summary = useMemo(() => {
    const paidRows = rows.filter((row) => row.paymentStatus === "paid");
    const grossRevenueUsd = paidRows.reduce((sum, row) => sum + row.amountUsd, 0);
    const totalCogsUsd = paidRows.reduce((sum, row) => sum + row.cogsUsd, 0);
    const taxableProfitUsd = grossRevenueUsd - totalCogsUsd;
    return {
      paidOrders: paidRows.length,
      grossRevenueUsd: Number(grossRevenueUsd.toFixed(2)),
      totalCogsUsd: Number(totalCogsUsd.toFixed(2)),
      taxableProfitUsd: Number(taxableProfitUsd.toFixed(2)),
    };
  }, [rows]);

  async function saveCogs(orderId: string) {
    const value = Number.parseFloat(String(draftCogs[orderId] ?? "0"));
    const cogsUsd = Number.isFinite(value) && value > 0 ? Number(value.toFixed(2)) : 0;

    setSavingById((current) => ({ ...current, [orderId]: true }));
    setStatusById((current) => ({ ...current, [orderId]: "" }));

    try {
      const response = await fetch("/api/admin/orders/cogs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId, cogsUsd }),
      });

      if (!response.ok) {
        throw new Error(`Save failed (${response.status})`);
      }

      setRows((current) =>
        current.map((row) => (row.id === orderId ? { ...row, cogsUsd } : row))
      );
      setStatusById((current) => ({ ...current, [orderId]: "Saved" }));
    } catch {
      setStatusById((current) => ({ ...current, [orderId]: "Save failed" }));
    } finally {
      setSavingById((current) => ({ ...current, [orderId]: false }));
    }
  }

  return (
    <div className="space-y-8 pb-12">
      <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-10">
        <p className="section-kicker">Admin</p>
        <h1 className="section-title mt-2">Orders Management</h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Tax breakdowns, customer records, and COGS deductions for reporting.
        </p>

        {notice ? (
          <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            {notice}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          <a
            href="/api/admin/orders/export-csv?scope=paid"
            className="rounded-full bg-sky-700 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-sky-800"
          >
            Export Paid CSV
          </a>
          <a
            href="/api/admin/orders/export-csv?scope=all"
            className="rounded-full border border-slate-300 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-700 hover:border-slate-500"
          >
            Export All CSV
          </a>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Paid Orders</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{summary.paidOrders}</p>
        </article>
        <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Gross Revenue</p>
          <p className="mt-2 text-3xl font-bold text-emerald-900">{formatMoney(summary.grossRevenueUsd)}</p>
        </article>
        <article className="rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-700">Total COGS</p>
          <p className="mt-2 text-3xl font-bold text-rose-900">{formatMoney(summary.totalCogsUsd)}</p>
        </article>
        <article className="rounded-2xl border border-violet-200 bg-violet-50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700">Taxable Profit Est.</p>
          <p className="mt-2 text-3xl font-bold text-violet-900">{formatMoney(summary.taxableProfitUsd)}</p>
        </article>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search order id, customer, phone, item..."
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400"
        />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm md:p-4">
        <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          {filteredRows.length} orders
        </div>

        <div className="space-y-2">
          {filteredRows.map((row) => {
            const taxableProfit = Number((row.amountUsd - row.cogsUsd).toFixed(2));
            const customerAddress = [
              row.customer.addressLine1,
              row.customer.addressLine2,
              row.customer.city,
              row.customer.state,
              row.customer.postalCode,
              row.customer.country,
            ]
              .filter(Boolean)
              .join(", ");

            return (
              <article key={row.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="grid gap-3 lg:grid-cols-[1.3fr_1fr_0.8fr]">
                  <div>
                    <p className="text-base font-bold text-slate-900">{row.displayId}</p>
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{formatDate(row.createdAt)}</p>
                    <p className="mt-2 text-sm text-slate-800">{row.customer.name}</p>
                    <p className="text-sm text-slate-600">{row.customer.email}</p>
                    {row.customer.phone ? <p className="text-sm text-slate-600">{row.customer.phone}</p> : null}
                    {customerAddress ? <p className="mt-1 text-sm text-slate-600">{customerAddress}</p> : null}
                    <p className="mt-2 text-sm text-slate-700">{row.lineItems.join(" • ")}</p>
                  </div>

                  <div className="space-y-1 text-sm">
                    <p className="font-semibold text-slate-700">Status: <span className="capitalize">{row.status.replace("_", " ")}</span></p>
                    <p className="font-semibold text-slate-700">Payment: <span className="uppercase">{row.paymentStatus}</span></p>
                    <p className="font-semibold text-emerald-800">Gross: {formatMoney(row.amountUsd)}</p>
                    <p className="font-semibold text-rose-800">COGS: {formatMoney(row.cogsUsd)}</p>
                    <p className="font-semibold text-violet-800">Taxable: {formatMoney(taxableProfit)}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      COGS (USD)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={draftCogs[row.id] ?? "0.00"}
                      onChange={(event) =>
                        setDraftCogs((current) => ({ ...current, [row.id]: event.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
                    />
                    <button
                      type="button"
                      onClick={() => saveCogs(row.id)}
                      disabled={Boolean(savingById[row.id])}
                      className="rounded-full bg-sky-700 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white disabled:opacity-60"
                    >
                      {savingById[row.id] ? "Saving..." : "Save COGS"}
                    </button>
                    {statusById[row.id] ? (
                      <p className="text-xs font-semibold text-slate-600">{statusById[row.id]}</p>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}

          {filteredRows.length === 0 ? (
            <article className="rounded-2xl border border-slate-100 bg-slate-50 p-8 text-center text-sm text-slate-600">
              No orders found for this filter.
            </article>
          ) : null}
        </div>
      </section>
    </div>
  );
}
