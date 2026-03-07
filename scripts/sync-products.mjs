import fs from "fs";
import path from "path";

const APP_ID = process.env.SOURCE_APP_ID ?? "6972f2b59e2787f045b7ae0d";
const SOURCE_PRODUCTS_URL =
  process.env.SOURCE_PRODUCTS_URL ??
  `https://redhelixresearch.com/api/apps/${APP_ID}/entities/Product`;
const FORCE_OUT_OF_STOCK = process.env.FORCE_OUT_OF_STOCK !== "false";
const PRODUCT_SCOPE = (process.env.PRODUCT_SCOPE ?? "active").toLowerCase();

const CATEGORY_MAP = {
  weight_loss: "Weight Loss",
  recovery_healing: "Recovery & Healing",
  cognitive_focus: "Cognitive & Focus",
  performance_longevity: "Performance",
  sexual_health: "Sexual Health",
  general_health: "General Health",
};

const KEY_ALIASES = new Map([
  ["hbacwater", "bacwater"],
  ["hghsomatropin", "hgh"],
  ["tb500thymosinbeta4", "tb500"],
]);

function cleanText(value) {
  return String(value ?? "")
    .replace(/â€“|â€”|\u2013|\u2014/g, "-")
    .replace(/â€™/g, "'")
    .replace(/Â·/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanName(value) {
  return cleanText(value).replace(/red\s*helix/gi, "").trim();
}

function cleanStrength(value) {
  return cleanText(value).replace(/\u00d7/g, "x");
}

function normalizeKey(value) {
  return cleanText(value).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function toSlug(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function formatPrice(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    return "$0.00";
  }

  return `$${amount.toFixed(2)}`;
}

function toCategory(value) {
  const key = cleanText(value).toLowerCase();
  if (CATEGORY_MAP[key]) {
    return CATEGORY_MAP[key];
  }

  return key
    .split("_")
    .filter(Boolean)
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
    .join(" ");
}

function canonicalCompoundKey(name) {
  const cleaned = cleanName(name);
  const key = normalizeKey(cleaned);

  return KEY_ALIASES.get(key) ?? key;
}

function chooseDisplayName(rows) {
  const names = Array.from(new Set(rows.map((row) => cleanName(row.name)).filter(Boolean)));

  if (names.length === 0) {
    return "Unnamed Compound";
  }

  return names.sort((left, right) => {
    const leftPenalty = Number(left.includes("(")) + Number(left.includes("/")) + Number(left.length > 22);
    const rightPenalty =
      Number(right.includes("(")) + Number(right.includes("/")) + Number(right.length > 22);

    if (leftPenalty !== rightPenalty) {
      return leftPenalty - rightPenalty;
    }

    if (left.length !== right.length) {
      return left.length - right.length;
    }

    return left.localeCompare(right);
  })[0];
}

function chooseCategory(rows) {
  const counts = new Map();

  for (const row of rows) {
    const category = toCategory(row.category ?? "general_health");
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }

  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "General Health";
}

function chooseDescription(rows) {
  for (const row of rows) {
    const description = cleanText(row.description).replace(/red\s*helix/gi, "").trim();
    if (description) {
      return description;
    }
  }

  return "";
}

function readPrice(...values) {
  for (const value of values) {
    const amount = Number(value);
    if (Number.isFinite(amount) && amount > 0) {
      return Number(amount.toFixed(2));
    }
  }

  return null;
}

function readStockQuantity(input) {
  const numeric = Number(input);

  if (!Number.isFinite(numeric)) {
    return null;
  }

  if (numeric < 0) {
    return 0;
  }

  return Math.floor(numeric);
}

function extractSpecs(row) {
  const sourceSpecs = Array.isArray(row.specifications) ? row.specifications : [];

  if (sourceSpecs.length === 0) {
    return [
      {
        label: "Standard",
        price: row.price_from,
        stockQuantity: row.stock_quantity,
        inStock: row.in_stock,
      },
    ];
  }

  const visibleSpecs = sourceSpecs.filter((spec) => !spec?.hidden);
  const specs = visibleSpecs.length > 0 ? visibleSpecs : sourceSpecs;

  return specs.map((spec) => ({
    label: cleanStrength(spec?.name || "Standard"),
    price: spec?.price,
    stockQuantity: spec?.stock_quantity,
    inStock: spec?.in_stock,
  }));
}

function buildVariants(rows) {
  const variants = new Map();

  for (const row of rows) {
    const specs = extractSpecs(row);

    for (const spec of specs) {
      const label = cleanStrength(spec.label || "Standard");
      const priceUsd = readPrice(spec.price, row.price_from);

      if (priceUsd === null) {
        continue;
      }

      const sourceStock =
        readStockQuantity(spec.stockQuantity) ??
        readStockQuantity(row.stock_quantity) ??
        (spec.inStock || row.in_stock ? 1 : 0);

      const stockQuantity = FORCE_OUT_OF_STOCK ? 0 : sourceStock;
      const key = `${normalizeKey(label)}|${priceUsd.toFixed(2)}`;

      const existing = variants.get(key);
      if (!existing) {
        variants.set(key, {
          label,
          priceUsd,
          sourceStockQuantity: sourceStock,
          stockQuantity,
        });
        continue;
      }

      existing.sourceStockQuantity = Math.max(existing.sourceStockQuantity, sourceStock);
      existing.stockQuantity = Math.max(existing.stockQuantity, stockQuantity);
    }
  }

  const list = Array.from(variants.values())
    .sort((a, b) => a.priceUsd - b.priceUsd || a.label.localeCompare(b.label))
    .map((variant) => ({
      id: toSlug(`${variant.label}-${variant.priceUsd.toFixed(2)}`),
      label: variant.label,
      price: formatPrice(variant.priceUsd),
      priceUsd: variant.priceUsd,
      stockQuantity: variant.stockQuantity,
      sourceStockQuantity: variant.sourceStockQuantity,
      backorder: false,
      restockDate: null,
    }));

  return list.length > 0
    ? list
    : [
        {
          id: "standard",
          label: "Standard",
          price: "$0.00",
          priceUsd: 0,
          stockQuantity: 0,
          sourceStockQuantity: 0,
          backorder: false,
          restockDate: null,
        },
      ];
}

async function fetchSourceProducts() {
  const response = await fetch(SOURCE_PRODUCTS_URL, {
    headers: {
      "X-App-Id": APP_ID,
      accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch source products (${response.status})`);
  }

  const payload = await response.json();
  if (!Array.isArray(payload)) {
    throw new Error("Source API returned a non-array payload.");
  }

  return payload;
}

function dedupeProducts(sourceRows) {
  const activeRows = sourceRows.filter((row) => !row?.is_deleted);
  const listingRows =
    PRODUCT_SCOPE === "all"
      ? activeRows
      : activeRows
          .filter((row) => !row?.hidden)
          .filter((row) => cleanText(row?.name).toUpperCase() !== "BAC RESEARCH")
          .filter((row) => {
            const specs = extractSpecs(row);
            if (specs.length === 0) {
              return false;
            }

            return specs.some((spec) => {
              const stock = readStockQuantity(spec.stockQuantity);
              return Boolean(spec.inStock) && (stock === null || stock > 0);
            });
          });
  const groups = new Map();

  for (const row of listingRows) {
    const key = canonicalCompoundKey(row.name || row.id || "");
    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key).push(row);
  }

  const usedSlugs = new Set();

  const products = Array.from(groups.values()).map((rows) => {
    const displayName = chooseDisplayName(rows);
    const baseSlug = toSlug(displayName) || "compound";
    let slug = baseSlug;
    let suffix = 2;

    while (usedSlugs.has(slug)) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }
    usedSlugs.add(slug);

    return {
      name: displayName,
      slug,
      category: chooseCategory(rows),
      description: chooseDescription(rows),
      variants: buildVariants(rows),
    };
  });

  return products.sort((a, b) => a.name.localeCompare(b.name));
}

async function main() {
  const sourceProducts = await fetchSourceProducts();
  const products = dedupeProducts(sourceProducts);
  const outputPath = path.join(process.cwd(), "data", "products.json");

  fs.writeFileSync(outputPath, JSON.stringify(products, null, 2) + "\n", "utf8");

  console.log(
    JSON.stringify(
      {
        sourceCount: sourceProducts.length,
        dedupedCount: products.length,
        outputPath,
        forceOutOfStock: FORCE_OUT_OF_STOCK,
        productScope: PRODUCT_SCOPE,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
