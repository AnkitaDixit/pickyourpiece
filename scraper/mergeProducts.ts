import fs from "fs";
import path from "path";

const BRAND_DATA_DIR = path.join(process.cwd(), "scraper", "data");
const OUTPUT_FILE = path.join(process.cwd(), "data", "products.json");
const TARGET_BRANDS = ["bluestone", "caratlane", "tanishq", "giva", "mia", "orra", "candere"] as const;

type JsonRecord = Record<string, unknown>;

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

  return rawBrand;
}

function normalizePurity(rawPurity: string): string {
  if (!rawPurity) return "";

  return normalizeMalformedSilverPurity(rawPurity)
    .replace(/(\d+)\s*KT/gi, "$1KT")
    .replace(/Platinum\s*950/gi, "Platinum950")
    .replace(/Silver\s*925/gi, "Silver925")
    .replace(/\s*,\s*/g, ", ");
}

function derivePurity(rawPurity: string, rawMetal: string): string {
  const normalizedExisting = normalizePurity(rawPurity);
  if (normalizedExisting) return normalizedExisting;

  const matches = rawMetal.match(/(\d+\s*KT|Platinum\s*950|Silver\s*925)/gi) ?? [];
  if (matches.length === 0) return "";

  const unique = Array.from(new Set(matches.map((item) => normalizePurity(item))));
  return unique.join(", ");
}

function deriveBaseMetal(rawMetal: string): string {
  const normalized = normalizeMalformedSilverPurity(rawMetal);
  if (!normalized) return "";

  if (/silver925/i.test(normalized)) return "Silver";

  // Gold takes precedence for mixed strings like "Platinum 950, 14 KT Two Tone Gold"
  if (/gold/i.test(normalized)) return "Gold";
  if (/platinum|\b950\s*KT\b/i.test(normalized)) return "Platinum";
  if (/\b\d+\s*KT\b/i.test(normalized)) return "Gold";
  if (/silver|sterling/i.test(normalized)) return "Silver";

  return normalized;
}

function shouldForceSilverMetal(purity: string): boolean {
  return /925/i.test(purity);
}

function deriveMetalColor(rawColor: string, rawMetal: string): string {
  const normalizedColor = rawColor.replace(/\s+/g, " ").trim();

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
      const normalizedPurity = derivePurity(rawPurity, rawMetal);

      normalized.brand = normalizeBrand(rawBrand);
      normalized.purity = normalizedPurity;
      normalized.metal = shouldForceSilverMetal(normalizedPurity) ? "Silver" : deriveBaseMetal(rawMetal);
      normalized.metalColor = deriveMetalColor(rawMetalColor, rawMetal);

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
