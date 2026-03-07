import janoshikData from "../../data/janoshik-public.json";
import productData from "../../data/products.json";
import siteCoaData from "../../data/site-coas.json";

export type CatalogVariant = {
  id: string;
  label: string;
  price: string;
  priceUsd: number;
  stockQuantity: number;
  sourceStockQuantity: number;
  backorder: boolean;
  restockDate: string | null;
  inStock: boolean;
};

export type CatalogProduct = {
  name: string;
  slug: string;
  category: string;
  description: string;
  compound: string;
  variants: CatalogVariant[];
  variantCount: number;
  defaultVariant: CatalogVariant;
  price: string;
  priceFrom: string;
  strength: string;
  stockQuantity: number;
  backorder: boolean;
  restockDate: string | null;
  inStock: boolean;
};

export type SiteCoaItem = {
  id: string;
  peptide: string;
  batch: string;
  purity: string;
  testDate: string;
  lab: string;
  imageUrl: string | null;
  reportUrl: string;
  source: "site" | "janoshik";
  title: string;
};

type ProductSeed = {
  name: string;
  slug: string;
  category: string;
  description?: string;
  variants?: ProductVariantSeed[];
};

type ProductVariantSeed = {
  id?: string;
  label?: string;
  price?: string;
  priceUsd?: number;
  stockQuantity?: number;
  sourceStockQuantity?: number;
  backorder?: boolean;
  restockDate?: string | null;
};

type SiteCoaSeed = {
  peptide?: string;
  batch?: string;
  purity?: string;
  testDate?: string;
  lab?: string;
  imageUrl?: string;
};

type SiteCoaPayload = {
  updatedAt: string;
  source: string;
  count: number;
  items: SiteCoaSeed[];
};

type JanoshikEntry = {
  peptide?: string;
  source?: string;
  title?: string;
  testId?: string | null;
  reportUrl?: string;
};

type JanoshikPayload = {
  updatedAt?: string;
  count?: number;
  grouped?: Record<string, JanoshikEntry[]>;
};

const products = productData as ProductSeed[];
const siteCoas = siteCoaData as SiteCoaPayload;
const janoshik = janoshikData as JanoshikPayload;

function cleanText(value: string | null | undefined): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function compoundFromName(name: string): string {
  return cleanText(name).split("(")[0].trim();
}

function normalizeForSearch(value: string): string {
  return cleanText(value).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function testDateMs(value: string): number {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatPrice(value: number): string {
  return `$${value.toFixed(2)}`;
}

function parsePrice(variant: ProductVariantSeed): number {
  if (Number.isFinite(variant.priceUsd)) {
    return Number(variant.priceUsd);
  }

  const parsed = Number.parseFloat(String(variant.price ?? "").replace(/[^0-9.]+/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeVariant(seed: ProductVariantSeed, index: number): CatalogVariant {
  const priceUsd = Number(parsePrice(seed).toFixed(2));
  const stockQuantity = Number.isFinite(seed.stockQuantity)
    ? Math.max(0, Math.floor(seed.stockQuantity ?? 0))
    : 0;
  const sourceStockQuantity = Number.isFinite(seed.sourceStockQuantity)
    ? Math.max(0, Math.floor(seed.sourceStockQuantity ?? 0))
    : stockQuantity;
  const backorder = Boolean(seed.backorder);
  const inStock = stockQuantity > 0 || backorder;

  return {
    id: cleanText(seed.id) || `variant-${index + 1}`,
    label: cleanText(seed.label) || "Standard",
    price: priceUsd > 0 ? formatPrice(priceUsd) : "$0.00",
    priceUsd,
    stockQuantity,
    sourceStockQuantity,
    backorder,
    restockDate: seed.restockDate ? cleanText(seed.restockDate) : null,
    inStock,
  };
}

function defaultVariant(variants: CatalogVariant[]): CatalogVariant {
  const inStockVariant = variants.find((variant) => variant.inStock);
  return inStockVariant ?? variants[0];
}

function minPrice(variants: CatalogVariant[]): number {
  const priced = variants.filter((variant) => variant.priceUsd > 0);
  if (priced.length === 0) {
    return 0;
  }

  return Math.min(...priced.map((variant) => variant.priceUsd));
}

function compoundKeywords(compound: string): string[] {
  const normalized = normalizeForSearch(compound);

  if (normalized === "reta" || normalized.includes("retatrutide")) {
    return ["retatrutide", "rt", "reta"];
  }

  if (normalized.includes("tirzepatide") || normalized === "trz") {
    return ["tirzepatide", "trz"];
  }

  if (normalized.includes("tesamorelin")) {
    return ["tesamorelin"];
  }

  if (normalized === "tb5bpc5" || normalized.includes("tb500") || normalized.includes("bpc157")) {
    return ["tb500", "tb5", "bpc157", "bpc5", "tb-500", "bpc-157", "wolverine"];
  }

  if (normalized === "bac" || normalized.includes("bacwater")) {
    return ["bac", "bacwater", "bacteriostaticwater", "bacteriostatic"];
  }

  return [normalized];
}

function asNumber(value: string | null | undefined): number {
  const parsed = Number.parseInt(String(value ?? "").replace(/[^0-9]+/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function coaSort(left: SiteCoaItem, right: SiteCoaItem): number {
  if (left.source !== right.source) {
    return left.source === "site" ? -1 : 1;
  }

  if (left.source === "site" && right.source === "site") {
    return testDateMs(right.testDate) - testDateMs(left.testDate);
  }

  return asNumber(right.batch) - asNumber(left.batch);
}

function isLikelySampleTitle(value: string): boolean {
  return /\bsample\b/i.test(value);
}

function dedupeByReportUrl(items: SiteCoaItem[]): SiteCoaItem[] {
  const seen = new Set<string>();
  const deduped: SiteCoaItem[] = [];

  for (const item of items) {
    if (!item.reportUrl || seen.has(item.reportUrl)) {
      continue;
    }

    seen.add(item.reportUrl);
    deduped.push(item);
  }

  return deduped;
}

function siteCoaItems(): SiteCoaItem[] {
  const normalized: SiteCoaItem[] = [];

  (siteCoas.items ?? []).forEach((item, index) => {
    const peptide = cleanText(item.peptide);
    const batch = cleanText(item.batch);
    const purity = cleanText(item.purity);
    const testDate = cleanText(item.testDate);
    const lab = cleanText(item.lab);
    const imageUrl = cleanText(item.imageUrl);

    if (!peptide || !imageUrl) {
      return;
    }

    normalized.push({
      id: `site-${index + 1}`,
      peptide,
      batch: batch || "Unknown",
      purity: purity || "Unknown",
      testDate: testDate || "Unknown",
      lab: lab || "Unknown",
      imageUrl,
      reportUrl: imageUrl,
      source: "site",
      title: `${peptide} ${batch}`.trim(),
    });
  });

  return normalized;
}

function janoshikEntries(): JanoshikEntry[] {
  const grouped = janoshik.grouped ?? {};
  const all: JanoshikEntry[] = [];

  for (const key of Object.keys(grouped)) {
    const entries = grouped[key] ?? [];
    for (const entry of entries) {
      all.push(entry);
    }
  }

  return all;
}

const cachedSiteCoaItems = siteCoaItems();
const cachedJanoshikEntries = janoshikEntries();

function findSiteCoasForCompound(compound: string): SiteCoaItem[] {
  const keywords = compoundKeywords(compound);

  return cachedSiteCoaItems.filter((item) => {
    const searchable = normalizeForSearch(item.peptide);
    return keywords.some((keyword) => searchable.includes(keyword));
  });
}

function findJanoshikCoasForCompound(compound: string, limit: number): SiteCoaItem[] {
  const keywords = compoundKeywords(compound);

  const matches = cachedJanoshikEntries
    .filter((entry) => {
      const title = cleanText(entry.title);
      const reportUrl = cleanText(entry.reportUrl);
      if (!title || !reportUrl || isLikelySampleTitle(title)) {
        return false;
      }

      const searchable = normalizeForSearch(`${entry.peptide ?? ""} ${title}`);
      return keywords.some((keyword) => searchable.includes(keyword));
    })
    .sort((left, right) => asNumber(right.testId) - asNumber(left.testId))
    .map((entry, index) => {
      const title = cleanText(entry.title);
      const reportUrl = cleanText(entry.reportUrl);
      const testId = cleanText(entry.testId);
      return {
        id: `janoshik-${testId || index + 1}`,
        peptide: cleanText(compound),
        batch: testId ? `JAN-${testId}` : "JAN-PUBLIC",
        purity: "See report",
        testDate: "Public report",
        lab: "Janoshik Analytical",
        imageUrl: null,
        reportUrl,
        source: "janoshik" as const,
        title,
      };
    });

  return dedupeByReportUrl(matches).slice(0, limit);
}

function uniqueCatalogCompounds(): string[] {
  const compounds = new Set(getCatalogProducts().map((product) => product.compound));
  return Array.from(compounds);
}

function catalogCoverageCoas(perCompound = 3): SiteCoaItem[] {
  const coverage = uniqueCatalogCompounds().flatMap((compound) => findCoasForCompound(compound, perCompound));
  return dedupeByReportUrl(coverage);
}

export function getCatalogProducts(): CatalogProduct[] {
  return products
    .map((product) => {
      const variants = (product.variants ?? []).map((variant, index) => normalizeVariant(variant, index));
      if (variants.length === 0) {
        return null;
      }

      const primary = defaultVariant(variants);
      const lowestPrice = minPrice(variants);
      const totalStock = variants.reduce((sum, variant) => sum + variant.stockQuantity, 0);
      const hasBackorder = variants.some((variant) => variant.backorder);

      return {
        name: cleanText(product.name),
        slug: cleanText(product.slug),
        category: cleanText(product.category),
        description: cleanText(product.description),
        compound: compoundFromName(product.name),
        variants,
        variantCount: variants.length,
        defaultVariant: primary,
        price: lowestPrice > 0 ? formatPrice(lowestPrice) : "$0.00",
        priceFrom: lowestPrice > 0 ? formatPrice(lowestPrice) : "$0.00",
        strength: primary.label,
        stockQuantity: totalStock,
        backorder: hasBackorder,
        restockDate: variants.map((variant) => variant.restockDate).find((value) => Boolean(value)) ?? null,
        inStock: variants.some((variant) => variant.inStock),
      };
    })
    .filter((product): product is CatalogProduct => product !== null);
}

export function getProductBySlug(slug: string): CatalogProduct | undefined {
  return getCatalogProducts().find((product) => product.slug === slug);
}

export function getProductVariant(
  product: CatalogProduct,
  variantId?: string | null
): CatalogVariant | undefined {
  if (!variantId) {
    return product.defaultVariant;
  }

  return product.variants.find((variant) => variant.id === variantId) ?? product.defaultVariant;
}

export function getLatestCoas(limit = 8): SiteCoaItem[] {
  const merged = dedupeByReportUrl([...cachedSiteCoaItems, ...catalogCoverageCoas(3)]).sort(coaSort);
  return merged.slice(0, limit);
}

export function getPeptideCoverage(limit = 12): Array<{ peptide: string; count: number }> {
  const compounds = uniqueCatalogCompounds();

  const coverage = compounds.map((compound) => ({
    peptide: compound,
    count: findCoasForCompound(compound, 5).length,
  }));

  return coverage.sort((left, right) => right.count - left.count).slice(0, limit);
}

export function findCoasForCompound(compound: string, limit = 6): SiteCoaItem[] {
  const primary = findSiteCoasForCompound(compound).sort(coaSort);
  if (primary.length >= limit) {
    return primary.slice(0, limit);
  }

  const fallback = findJanoshikCoasForCompound(compound, limit - primary.length);
  return dedupeByReportUrl([...primary, ...fallback]).slice(0, limit);
}

export function getCoaStats(): { updatedAt: string; totalReports: number } {
  const updatedAtCandidates = [cleanText(siteCoas.updatedAt), cleanText(janoshik.updatedAt)]
    .filter(Boolean)
    .map((value) => ({ value, ms: testDateMs(value) }))
    .sort((left, right) => right.ms - left.ms);

  return {
    updatedAt: updatedAtCandidates[0]?.value ?? new Date(0).toISOString(),
    totalReports: dedupeByReportUrl([...cachedSiteCoaItems, ...catalogCoverageCoas(3)]).length,
  };
}
