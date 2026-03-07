export type UspsServiceAlert = {
  title: string;
  summary: string;
};

export type UspsAlertPayload = {
  updatedAt: string | null;
  alerts: UspsServiceAlert[];
  sourceUrl: string;
};

const USPS_ALERTS_URL = "https://about.usps.com/newsroom/service-alerts/";

function cleanText(value: string | null | undefined): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code: string) => {
      const parsed = Number.parseInt(code, 10);
      return Number.isFinite(parsed) ? String.fromCharCode(parsed) : "";
    });
}

function stripHtml(value: string): string {
  return decodeHtml(value.replace(/<[^>]+>/g, " "));
}

function truncateText(value: string, limit: number): string {
  if (value.length <= limit) {
    return value;
  }

  return `${value.slice(0, limit - 1).trim()}...`;
}

export async function getUspsServiceAlerts(limit = 3): Promise<UspsAlertPayload> {
  try {
    const response = await fetch(USPS_ALERTS_URL, {
      next: { revalidate: 1800 },
      headers: {
        accept: "text/html",
      },
    });

    if (!response.ok) {
      throw new Error(`USPS service alerts fetch failed (${response.status})`);
    }

    const html = await response.text();
    const updatedAtMatch = html.match(
      /<p class="release-date">\s*([^<]+?)\s*<\/p>/i
    );
    const updatedAt = updatedAtMatch ? cleanText(stripHtml(updatedAtMatch[1])) : null;

    const alerts: UspsServiceAlert[] = [];
    const cardRegex = /<div class="card border-danger">([\s\S]*?)<\/div>\s*<\/div>/gi;
    let cardMatch: RegExpExecArray | null;

    while ((cardMatch = cardRegex.exec(html)) !== null && alerts.length < limit) {
      const cardHtml = cardMatch[1];
      const titleMatch = cardHtml.match(/<h2[^>]*>\s*([\s\S]*?)\s*<\/h2>/i);
      const summaryMatch = cardHtml.match(/<p[^>]*>\s*([\s\S]*?)\s*<\/p>/i);

      const title = cleanText(stripHtml(titleMatch?.[1] ?? ""));
      const summary = cleanText(stripHtml(summaryMatch?.[1] ?? ""));

      if (!title) {
        continue;
      }

      alerts.push({
        title,
        summary: truncateText(summary, 260),
      });
    }

    return {
      updatedAt,
      alerts,
      sourceUrl: USPS_ALERTS_URL,
    };
  } catch {
    return {
      updatedAt: null,
      alerts: [],
      sourceUrl: USPS_ALERTS_URL,
    };
  }
}
