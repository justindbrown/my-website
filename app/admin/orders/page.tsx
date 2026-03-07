import { cookies } from "next/headers";
import OrdersAdminClient from "./OrdersAdminClient";
import { getOrderHubPayload } from "../../lib/order-hub";
import {
  ORDER_HUB_AUTH_COOKIE,
  getOrderHubAccessKey,
  isOrderHubAuthorizedCookie,
} from "../../lib/order-hub-auth";
import { readOrderCogsMap } from "../../lib/order-finance";

export const dynamic = "force-dynamic";

type AdminOrdersPageProps = {
  searchParams: Promise<{ auth?: string }>;
};

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const accessKey = getOrderHubAccessKey();
  const query = await searchParams;
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(ORDER_HUB_AUTH_COOKIE)?.value;

  if (!accessKey) {
    return (
      <div className="mx-auto max-w-xl space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:p-10">
        <p className="section-kicker">Admin Access</p>
        <h1 className="section-title mt-2">Orders Management Locked</h1>
        <p className="text-sm text-slate-600">
          Set <code>ORDER_HUB_ACCESS_KEY</code> in <code>.env.local</code> to unlock this page.
        </p>
      </div>
    );
  }

  if (!isOrderHubAuthorizedCookie(authCookie)) {
    return (
      <div className="mx-auto max-w-xl space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:p-10">
        <p className="section-kicker">Admin Access</p>
        <h1 className="section-title mt-2">Orders Management Login</h1>
        <p className="text-sm text-slate-600">Enter your Order Hub access key to continue.</p>
        {query.auth === "invalid" ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
            Invalid access key. Try again.
          </p>
        ) : null}

        <form action="/api/order-hub/auth" method="post" className="space-y-3">
          <input
            type="password"
            name="accessKey"
            required
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400"
            placeholder="Access key"
          />
          <button
            type="submit"
            className="rounded-full bg-sky-700 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-800"
          >
            Unlock Orders Management
          </button>
        </form>
      </div>
    );
  }

  const [payload, cogsMap] = await Promise.all([getOrderHubPayload(), readOrderCogsMap()]);
  const rows = payload.orders.map((order) => ({
    ...order,
    cogsUsd: cogsMap[order.id]?.cogsUsd ?? 0,
  }));

  return <OrdersAdminClient initialRows={rows} notice={payload.notice} />;
}
