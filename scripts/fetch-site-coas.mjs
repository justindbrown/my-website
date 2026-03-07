import fs from "fs";
import path from "path";

const SITE_URL = "https://redhelixresearch.com";

function parseScriptUrl(html) {
  const match = html.match(/<script[^>]+src="([^\"]*\/assets\/index-[^\"]+\.js)"/i);
  if (!match) throw new Error("Could not find app bundle URL on site homepage.");

  const src = match[1];
  if (src.startsWith("http")) return src;
  return `${SITE_URL}${src}`;
}

function parseDate(value) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      "user-agent": "MetaLabs-COA-Sync/1.0",
      accept: "text/html,application/javascript",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }

  return res.text();
}

async function main() {
  const homepage = await fetchText(SITE_URL);
  const bundleUrl = parseScriptUrl(homepage);
  const bundle = await fetchText(bundleUrl);

  const coaRegex =
    /\{peptide:"([^\"]+)",batch:"([^\"]+)",purity:"([^\"]+)",testDate:"([^\"]+)",lab:"([^\"]+)",imageUrl:"([^\"]+)"\}/g;

  const items = [];
  let match;

  while ((match = coaRegex.exec(bundle)) !== null) {
    items.push({
      peptide: match[1],
      batch: match[2],
      purity: match[3],
      testDate: match[4],
      lab: match[5],
      imageUrl: match[6],
    });
  }

  const uniqueMap = new Map();
  for (const item of items) {
    if (!uniqueMap.has(item.imageUrl)) {
      uniqueMap.set(item.imageUrl, item);
    }
  }

  const uniqueItems = Array.from(uniqueMap.values()).sort(
    (a, b) => parseDate(b.testDate) - parseDate(a.testDate)
  );

  const payload = {
    updatedAt: new Date().toISOString(),
    source: SITE_URL,
    count: uniqueItems.length,
    items: uniqueItems,
  };

  const outputPath = path.join(process.cwd(), "data", "site-coas.json");
  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2), "utf8");

  console.log(`Saved ${payload.count} site COA records to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
