import fs from "fs";
import path from "path";

const PUBLIC_URL = "https://public.janoshik.com/";

function normalizePeptideName(text) {
  const t = text.toLowerCase();

  if (t.includes("tirzepatide") || t.includes("trizepatide")) return "Tirzepatide";
  if (t.includes("semaglutide")) return "Semaglutide";
  if (t.includes("retatrutide")) return "Retatrutide";
  if (t.includes("cagrilintide")) return "Cagrilintide";
  if (t.includes("tesamorelin")) return "Tesamorelin";
  if (t.includes("tesofensine")) return "Tesofensine";
  if (t.includes("mots")) return "MOTS-C";
  if (t.includes("nad")) return "NAD+";
  if (t.includes("bpc")) return "BPC-157";
  if (t.includes("tb-500") || t.includes("tb500") || t.includes("tb 500")) return "TB-500";
  if (t.includes("ghk")) return "GHK-Cu";
  if (t.includes("epithalon") || t.includes("epitalon")) return "Epithalon";
  if (t.includes("hgh")) return "HGH";
  if (t.includes("bacteriostatic water")) return "Bacteriostatic Water";

  return "Other";
}

function stripTags(html) {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

async function main() {
  const res = await fetch(PUBLIC_URL, {
    headers: {
      "user-agent": "MetaLabs-COA-Library/1.0",
      accept: "text/html",
    },
  });

  if (!res.ok) throw new Error(`Failed to fetch ${PUBLIC_URL}: ${res.status}`);

  const html = await res.text();

  const anchorRe =
    /<a\b[^>]*href="(https:\/\/verify\.janoshik\.com\/tests\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;

  const items = [];
  let m;

  while ((m = anchorRe.exec(html)) !== null) {
    const reportUrl = m[1].trim();
    const rawInner = m[2];
    const title = stripTags(rawInner);

    const idMatch = title.match(/#(\d+)/);
    const testId = idMatch ? idMatch[1] : null;

    items.push({
      peptide: normalizePeptideName(title),
      source: "janoshik",
      title,
      testId,
      reportUrl,
    });
  }

  const seen = new Set();
  const deduped = [];
  for (const it of items) {
    if (seen.has(it.reportUrl)) continue;
    seen.add(it.reportUrl);
    deduped.push(it);
  }

  const grouped = {};
  for (const it of deduped) {
    grouped[it.peptide] ||= [];
    grouped[it.peptide].push(it);
  }

  for (const key of Object.keys(grouped)) {
    grouped[key].sort((a, b) => {
      const ai = a.testId ? parseInt(a.testId, 10) : 0;
      const bi = b.testId ? parseInt(b.testId, 10) : 0;
      return bi - ai;
    });
  }

  const outDir = path.join(process.cwd(), "data");
  fs.mkdirSync(outDir, { recursive: true });

  const outFile = path.join(outDir, "janoshik-public.json");
  fs.writeFileSync(
    outFile,
    JSON.stringify(
      {
        updatedAt: new Date().toISOString(),
        count: deduped.length,
        grouped,
      },
      null,
      2
    ),
    "utf8"
  );

  console.log(`Saved ${deduped.length} Janoshik public entries to ${outFile}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
