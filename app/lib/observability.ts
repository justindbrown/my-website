import { appendFile, mkdir } from "fs/promises";
import path from "path";

type LogLevel = "info" | "warn" | "error";

const logsDir = path.join(process.cwd(), "data", "logs");
const appLogPath = path.join(logsDir, "app.log");

function isFileLoggingEnabled(): boolean {
  return process.env.ENABLE_FILE_LOGS !== "false";
}

async function appendLogLine(line: string): Promise<void> {
  if (!isFileLoggingEnabled()) {
    return;
  }

  await mkdir(logsDir, { recursive: true });
  await appendFile(appLogPath, `${line}\n`, "utf8");
}

export async function logEvent(
  level: LogLevel,
  event: string,
  details: Record<string, unknown> = {}
): Promise<void> {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    details,
  };

  const payload = JSON.stringify(entry);

  if (level === "error") {
    console.error(payload);
  } else if (level === "warn") {
    console.warn(payload);
  } else {
    console.log(payload);
  }

  try {
    await appendLogLine(payload);
  } catch (error) {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "error",
        event: "log_write_failed",
        details: { message: error instanceof Error ? error.message : String(error) },
      })
    );
  }
}
