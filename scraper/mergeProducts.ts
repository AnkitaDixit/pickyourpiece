import fs from "fs";
import path from "path";

const BRAND_DATA_DIR = path.join(process.cwd(), "scraper", "data");
const OUTPUT_FILE = path.join(process.cwd(), "data", "products.json");
const TARGET_BRANDS = ["bluestone", "caratlane", "tanishq", "giva", "mia", "orra", "candere", "palmonas"] as const;

type JsonRecord = Record<string, unknown>;

function buildMetalFingerprint(...values: string[]): string {
  return values
    .map((value) => normalizeMalformedSilverPurity(value))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeMalformedSilverPurity(rawValue: string): string {
  const normalized = rawValue.replace(/\s+/g, " ").trim();
  if (/^93\s*KT$/i.test(normalized)) return "Silver925";
  return normalized;
}

function normalizeBrand(rawBrand: string): string {
  if (!rawBrand) return "";

  if (/^giva\s*jewel+ery$/i.test(rawBrand) || /^giva\s*jewelry$/i.test(rawBrand)) {
    return "GIVA";
  }

  if (/^kalyan$/i.test(rawBrand)) {
    return "Candere";
  }

  if (/^palmonas$/i.test(rawBrand)) {
    return "Palmonas";
  }

  return rawBrand;
}

function normalizePurity(rawPurity: string): string {
  if (!rawPurity) return "";

  return normalizeMalformedSilverPurity(rawPurity)
    .replace(/(\d+)\s*K\b/gi, "$1KT")
    .replace(/(\d+)\s*KT/gi, "$1KT")
    .replace(/Platinum\s*950/gi, "Platinum950")
    .replace(/Silver\s*925/gi, "Silver925")
    .replace(/\s*,\s*/g, ", ");
}

function isPlated(...values: string[]): boolean {
  return /(plated|plating|vermeil)/i.test(buildMetalFingerprint(...values));
}

function hasSilverBase(combined: string): boolean {
  return /(silver|sterling|silver925|\b925\b)/i.test(combined);
}

function hasGoldBase(combined: string): boolean {
  return /(rose\s*gold|yellow\s*gold|\bgold\b|\b\d+\s*k(?:t)?\b)/i.test(combined);
}

function hasPlatinumBase(combined: string): boolean {
  return /(platinum|platinum\s*950|\b950\s*k(?:t)?\b)/i.test(combined);
}

function hasGoldPlating(combined: string): boolean {
  return /(gold\s*(?:tone\s*)?plated|gold\s*plating|gold\s*vermeil|vermeil|\d+\s*k(?:t)?\s*gold\s*(?:tone\s*)?plated)/i.test(combined);
}

function hasSilverPlating(combined: string): boolean {
  return /(silver\s*plated|silver\s*plating|rhodium\s*plated|rhodium\s*plating)/i.test(combined);
}

function hasSilverBaseWithGoldPlating(...values: string[]): boolean {
  const combined = buildMetalFingerprint(...values);
  return hasSilverBase(combined) && hasGoldPlating(combined);
}

function deriveMetalByPlatingRules(...values: string[]): string | null {
  const [rawPurity = "", rawMetal = "", rawMetalColor = "", rawName = "", rawDescription = ""] = values;
  const structured = buildMetalFingerprint(rawPurity, rawMetal, rawMetalColor);
  const combined = buildMetalFingerprint(rawPurity, rawMetal, rawMetalColor, rawName, rawDescription);
  const goldPlated = hasGoldPlating(combined);
  const silverPlated = hasSilverPlating(combined);
  const plated = goldPlated || silverPlated;

  if (!plated) return null;

  // Rule 1: Gold plating on silver must remain Silver.
  if (goldPlated && hasSilverBase(structured)) return "Silver";

  // Rule 1.5: Explicit steel base should remain Steel even when gold-plated.
  if (/stainless\s*steel|\bsteel\b/i.test(structured)) return "Steel";

  // Rule 2: Any plating on silver/gold/platinum keeps the base metal.
  if (hasSilverBase(structured)) return "Silver";
  if (hasGoldBase(structured)) return "Gold";
  if (hasPlatinumBase(structured)) return "Platinum";

  if (goldPlated || silverPlated) return "Steel";

  return null;
}

function derivePlatedMetal(rawPurity: string, rawMetal: string, rawMetalColor: string): "Gold" | "Silver" | "Steel" | null {
  const combined = buildMetalFingerprint(rawPurity, rawMetal, rawMetalColor);

  if (!isPlated(combined)) return null;
  if (hasSilverBaseWithGoldPlating(rawPurity, rawMetal, rawMetalColor)) return null;
  if (/stainless\s*steel|\bsteel\b/i.test(combined)) return "Steel";
  if (/rose\s*gold|yellow\s*gold|\bgold\b|\b\d+\s*k\b/i.test(combined)) return "Gold";
  if (/silver|rhodium|white/i.test(combined)) return "Silver";

  return null;
}

function derivePurity(rawPurity: string, rawMetal: string, rawMetalColor: string, rawName: string, rawDescription: string): string {
  if (isPlated(rawPurity, rawMetal, rawMetalColor, rawName, rawDescription)) return "";

  const normalizedExisting = normalizePurity(rawPurity);
  if (normalizedExisting) return normalizedExisting;

  const matches = rawMetal.match(/(\d+\s*KT|Platinum\s*950|Silver\s*925)/gi) ?? [];
  if (matches.length === 0) return "";

  const unique = Array.from(new Set(matches.map((item) => normalizePurity(item))));
  return unique.join(", ");
}

function deriveBaseMetal(rawMetal: string, rawPurity: string, rawMetalColor: string, rawName: string, rawDescription: string): string {
  const platedMetal = deriveMetalByPlatingRules(rawPurity, rawMetal, rawMetalColor, rawName, rawDescription);
  if (platedMetal) return platedMetal;

  if (hasSilverBaseWithGoldPlating(rawPurity, rawMetal, rawMetalColor, rawName, rawDescription)) return "Silver";

  const fallbackPlatedMetal = derivePlatedMetal(rawPurity, rawMetal, rawMetalColor);
  if (fallbackPlatedMetal) return fallbackPlatedMetal;

  const normalized = normalizeMalformedSilverPurity(rawMetal);
  if (!normalized) return "Steel";

  if (/silver925/i.test(normalized)) return "Silver";

  // Gold takes precedence for mixed strings like "Platinum 950, 14 KT Two Tone Gold"
  if (/gold/i.test(normalized)) return "Gold";
  if (/rose gold/i.test(normalized)) return "Gold";
  if (/platinum|\b950\s*KT\b/i.test(normalized)) return "Platinum";
  if (/\b\d+\s*KT\b/i.test(normalized)) return "Gold";
  if (/rhodium/i.test(normalized)) return "Silver";
  if (/stainless\s*steel|\bsteel\b/i.test(normalized)) return "Steel";
  if (/silver|sterling/i.test(normalized)) return "Silver";

  return "Steel";
}

function canonicalizeMetalCategory(rawMetal: string): "Gold" | "Silver" | "Platinum" | "Steel" {
  const combined = normalizeMalformedSilverPurity(rawMetal).toLowerCase();

  if (/platinum|\b950\s*k(?:t)?\b/.test(combined)) return "Platinum";
  if (/silver|sterling|silver925|\b925\b|rhodium|white/.test(combined)) return "Silver";
  if (/rose\s*gold|yellow\s*gold|\bgold\b|\b\d+\s*k(?:t)?\b/.test(combined)) return "Gold";
  if (/stainless\s*steel|\bsteel\b/.test(combined)) return "Steel";

  return "Steel";
}

function shouldForceSilverMetal(purity: string): boolean {
  return /925/i.test(purity);
}

function deriveMetalColor(rawColor: string, rawMetal: string, rawPurity: string): string {
  const normalizedColor = rawColor.replace(/\s+/g, " ").trim();

  // Preserve explicit color intent first.
  if (/rose\s*gold/i.test(normalizedColor)) return "Rose Gold";
  if (/yellow\s*gold|^gold\b/i.test(normalizedColor)) return "Gold";
  if (/silver|rhodium|steel/i.test(normalizedColor)) return "Silver";
  if (/platinum/i.test(normalizedColor)) return "Platinum";

  const platedMetal = derivePlatedMetal(rawPurity, rawMetal, rawColor);
  if (platedMetal === "Gold") return "Gold";
  if (platedMetal === "Silver") return "Silver";
  if (platedMetal === "Steel") return "Silver";

  if (/^\d+\s*K\s*gold plated$/i.test(normalizedColor) || /^gold plated$/i.test(normalizedColor) || /^yellow$/i.test(normalizedColor) || /^yellow gold$/i.test(normalizedColor)) {
    return "Gold";
  }

  if (/^\d+\s*K\s*rose gold plated$/i.test(normalizedColor) || /^rose$/i.test(normalizedColor) || /^rose gold plated$/i.test(normalizedColor)) {
    return "Rose Gold";
  }

  if (/^rhodium plated$/i.test(normalizedColor) || /^steel$/i.test(normalizedColor)) {
    return "Silver";
  }

  if (/^gold plated$/i.test(normalizedColor) || /^yellow$/i.test(normalizedColor) || /^yellow gold$/i.test(normalizedColor)) {
    return "Gold";
  }

  if (/^oxidised silver$/i.test(normalizedColor) || /^silver$/i.test(normalizedColor)) {
    return "Silver";
  }

  if (/^rose$/i.test(normalizedColor) || /^rose gold plated$/i.test(normalizedColor)) {
    return "Rose Gold";
  }

  if (normalizedColor) return normalizedColor;

  const probes: [RegExp, string][] = [
    [/three\s*tone/i, "Three Tone"],
    [/two\s*tone/i, "Two Tone"],
    [/white/i, "White"],
    [/rhodium|stainless\s*steel|\bsteel\b/i, "Silver"],
    [/yellow/i, "Gold"],
    [/rose/i, "Rose Gold"],
    [/platinum/i, "Platinum"],
    [/(oxidised\s+silver|silver)/i, "Silver"],
  ];

  for (const [pattern, label] of probes) {
    if (pattern.test(rawMetal)) return label;
  }

  return "";
}

function hasValidImage(product: JsonRecord): boolean {
  const image = asString(product.image);
  return image !== "" && !/icon\.png$/i.test(image);
}

function normalizeImageUrl(rawUrl: string): string {
  if (!rawUrl) return "";

  let normalized = rawUrl;

  // Magento-style cached image URLs:
  // /media/catalog/product/cache/<id>/image/<size>/<hash>/... -> /media/catalog/product/...
  // /media/catalog/product/image/<size>/<hash>/... -> /media/catalog/product/...
  normalized = normalized.replace(
    /(\/media\/catalog\/product)\/(?:cache\/[^/]+\/)?image\/[^/]+\/[^/]+(?=\/)/gi,
    "$1"
  );

  // Generic cache segment cleanup for other sources.
  normalized = normalized.replace(/\/cache\/[^/]+/gi, "");

  // BlueStone image variant normalization.
  normalized = normalized.replace(/BP-PICS-00000/gi, "PICS-00001");

  return normalized;
}

function hasValidPrice(product: JsonRecord): boolean {
  return Number(product.price) > 0;
}

function getSharedKeys(datasets: JsonRecord[][]): string[] {
  if (datasets.length === 0) return [];

  const keySets = datasets.map((rows) => {
    const set = new Set<string>();
    for (const row of rows) {
      Object.keys(row).forEach((key) => set.add(key));
    }
    return set;
  });

  const [firstSet, ...restSets] = keySets;
  return Array.from(firstSet).filter((key) => restSets.every((set) => set.has(key)));
}

export function mergeProducts(): JsonRecord[] {
  if (!fs.existsSync(BRAND_DATA_DIR)) return [];

  const files = TARGET_BRANDS.map((brand) => `${brand}.json`).filter((file) =>
    fs.existsSync(path.join(BRAND_DATA_DIR, file))
  );

  const byBrand: JsonRecord[][] = [];
  const all: JsonRecord[] = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(BRAND_DATA_DIR, file), "utf-8");
    const products: JsonRecord[] = JSON.parse(raw);
    byBrand.push(products);
    all.push(...products);
  }

  const sharedKeys = getSharedKeys(byBrand);
  const merged = all
    .filter((product) => hasValidImage(product) && hasValidPrice(product))
    .map((product) => {
      const normalized: JsonRecord = {};
      for (const key of sharedKeys) {
        normalized[key] = product[key];
      }

      const rawBrand = asString(product.brand);
      const rawMetal = asString(product.metal);
      const rawPurity = asString(product.purity);
      const rawMetalColor = asString(product.metalColor);
      const rawName = asString(product.name);
      const rawDescription = asString(product.description);
      const normalizedPurity = derivePurity(rawPurity, rawMetal, rawMetalColor, rawName, rawDescription);

      normalized.brand = normalizeBrand(rawBrand);
      normalized.purity = normalizedPurity;
      const derivedMetal = shouldForceSilverMetal(normalizedPurity)
        ? "Silver"
        : deriveBaseMetal(rawMetal, rawPurity, rawMetalColor, rawName, rawDescription);
      normalized.metal = canonicalizeMetalCategory(derivedMetal);
      normalized.metalColor = deriveMetalColor(rawMetalColor, rawMetal, rawPurity);
      normalized.image = normalizeImageUrl(asString(product.image));

      return normalized;
    });

  // Write merged output for the UI
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(merged, null, 2), "utf-8");

  console.log(
    `Merged ${merged.length} products from ${files.length} brands with ${sharedKeys.length} shared fields → data/products.json`
  );
  return merged;
}
