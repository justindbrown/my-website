import fs from "fs/promises";
import path from "path";

const baseUrl = (
  process.env.UPTIME_MONITOR_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  "http://127.0.0.1:3000"
).replace(/\/$/, "");

const healthUrl = `${baseUrl}/api/health`;
const timeoutMs = Number(process.env.UPTIME_TIMEOUT_MS ?? 10000);

const logsDir = path.join(process.cwd(), "data", "logs");
const uptimeLogPath = path.join(logsDir, "uptime.log");

async function appendLine(line) {
  await fs.mkdir(logsDir, { recursive: true });
  await fs.appendFile(uptimeLogPath, `${line}\n`, "utf8");
}

async function checkHealth() {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(healthUrl, {
      method: "GET",
      headers: { accept: "application/json" },
      signal: controller.signal,
    });

    const latencyMs = Date.now() - started;
    const body = await response.json().catch(() => ({}));
    const healthy = response.ok && body.status === "ok";

    const entry = {
      timestamp: new Date().toISOString(),
      url: healthUrl,
      statusCode: response.status,
      latencyMs,
      healthy,
    };

    await appendLine(JSON.stringify(entry));
    console.log(JSON.stringify(entry));

    if (!healthy) {
      process.exitCode = 1;
    }
  } catch (error) {
    const entry = {
      timestamp: new Date().toISOString(),
      url: healthUrl,
      statusCode: 0,
      latencyMs: Date.now() - started,
      healthy: false,
      error: error instanceof Error ? error.message : String(error),
    };

    await appendLine(JSON.stringify(entry));
    console.log(JSON.stringify(entry));
    process.exitCode = 1;
  } finally {
    clearTimeout(timer);
  }
}

checkHealth();
