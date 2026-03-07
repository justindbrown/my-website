import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export type NotifyRequest = {
  id: string;
  createdAt: string;
  email: string;
  slug: string;
  productName: string;
  variantId: string | null;
  variantLabel: string | null;
  sourceIp: string | null;
  userAgent: string | null;
};

const notifyPath = path.join(process.cwd(), "data", "notify-requests.json");

async function readNotifyRequests(): Promise<NotifyRequest[]> {
  try {
    const content = await readFile(notifyPath, "utf8");
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? (parsed as NotifyRequest[]) : [];
  } catch {
    return [];
  }
}

async function writeNotifyRequests(requests: NotifyRequest[]): Promise<void> {
  await mkdir(path.dirname(notifyPath), { recursive: true });
  await writeFile(notifyPath, JSON.stringify(requests, null, 2) + "\n", "utf8");
}

export async function saveNotifyRequest(input: {
  email: string;
  slug: string;
  productName: string;
  variantId?: string | null;
  variantLabel?: string | null;
  sourceIp?: string | null;
  userAgent?: string | null;
}): Promise<NotifyRequest> {
  const current = await readNotifyRequests();
  const entry: NotifyRequest = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    email: input.email,
    slug: input.slug,
    productName: input.productName,
    variantId: input.variantId ?? null,
    variantLabel: input.variantLabel ?? null,
    sourceIp: input.sourceIp ?? null,
    userAgent: input.userAgent ?? null,
  };

  current.push(entry);
  await writeNotifyRequests(current);
  return entry;
}

export async function getNotifyRequestCount(): Promise<number> {
  const current = await readNotifyRequests();
  return current.length;
}
