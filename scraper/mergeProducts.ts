import fs from "fs";
import path from "path";
import { createHash } from "crypto";

const BRAND_DATA_DIR = path.join(process.cwd(), "scraper", "data");
const OUTPUT_FILE = path.join(process.cwd(), "data", "products.json");
const NORMALIZED_OUTPUT_FILE = path.join(process.cwd(), "data", "new_products.json");
const CHANGELOG_OUTPUT_FILE = path.join(process.cwd(), "data", "products.changelog.json");
const FILTER_OPTIONS_FILE = path.join(process.cwd(), "data", "filter-options.json");
const TARGET_BRANDS = ["bluestone", "caratlane", "tanishq", "giva", "miabytanshiq", "orra", "candere", "palmonas", "joyalukkas", "melorra", "senco"] as const;

type JsonRecord = Record<string, unknown>;
type EnrichedProduct = JsonRecord & {
  id: string;
  brand: string;
  pyp_product_id: string;
  first_seen_at: string;
  current_price: number;
  previous_price: number | null;
  availability: boolean;
};

type ProductChangelogEntry = {
  at: string;
  type: "new" | "updated" | "price_changed" | "delisted" | "relisted";
  id: string;
  pyp_product_id: string;
  brand: string;
  name: string;
  previous_price?: number | null;
  current_price?: number | null;
};

const STYLE_OCCASION_BUNDLES = [
  "Daily Wear",
  "Engagement & Wedding",
  "Party & Statement",
  "Romantic & Gifting",
  "Nature & Artistic",
  "Modern & Classic",
] as const;

const CANONICAL_GEMSTONES = [
  "Amethyst",
  "Aquamarine",
  "Black Onyx",
  "Black Spinel",
  "Blue Sapphire",
  "Blue Topaz",
  "Chalcedony",
  "Chrome Diopside",
  "Citrine",
  "Crystal Quartz",
  "Diamond",
  "Emerald",
  "Garnet",
  "Green Agate",
  "Green Chalcedony",
  "Iolite",
  "Kundan",
  "Lapis Lazuli",
  "Lemon Quartz",
  "London Blue Topaz",
  "Moonstone",
  "Mother of Pearl",
  "Natural Pearl",
  "Opal",
  "Orange Madeira Citrine",
  "Peridot",
  "Pink Chalcedony",
  "Pink Sapphire",
  "Pink Tourmaline",
  "Polki",
  "Pyrope Garnet",
  "Quartz",
  "Red Garnet",
  "Rose Quartz",
  "Ruby",
  "Sapphire",
  "Scolecite",
  "Smoky Quartz",
  "Sodalite",
  "Spinel",
  "Topaz",
  "Turquoise",
  "Uncut Diamond",
  "White Chalcedony",
  "Zircon",
] as const;

type GemstoneMetadata = {
  gemstones: string[];
  origins: string[];
  treatments: string[];
  cuts: string[];
  isSolitaire: boolean;
};

function normalizeGemstones(rawValue: unknown): GemstoneMetadata {
  const gemstones = new Set<string>();
  const origins = new Set<string>();
  const treatments = new Set<string>();
  const cuts = new Set<string>();
  let isSolitaire = false;

  for (const raw of asStringArray(rawValue)) {
    const key = normalizeTagKey(raw);
    const synthetic = key.startsWith("synthetic ");
    const baseKey = synthetic ? key.replace(/^synthetic /, "") : key;
    const mapping: Record<string, string> = {
      amethyst: "Amethyst",
      aquamarine: "Aquamarine",
      "natural aquamarine gemstone": "Aquamarine",
      "black onyx": "Black Onyx",
      onyx: "Black Onyx",
      "black spinel": "Black Spinel",
      "blue sapphire": "Blue Sapphire",
      "blue topaz": "Blue Topaz",
      "button pearl": "Natural Pearl",
      chalcedony: "Chalcedony",
      "chrome diopside": "Chrome Diopside",
      citrine: "Citrine",
      "crystal quartz": "Crystal Quartz",
      diamond: "Diamond",
      emerald: "Emerald",
      garnet: "Garnet",
      "green agate": "Green Agate",
      "green chalcedony": "Green Chalcedony",
      iolite: "Iolite",
      kundan: "Kundan",
      lapis: "Lapis Lazuli",
      "lapis lazuli": "Lapis Lazuli",
      "lemon quartz": "Lemon Quartz",
      "london blue topaz": "London Blue Topaz",
      "light blue topaz": "Blue Topaz",
      moonstone: "Moonstone",
      "mother of pearl": "Mother of Pearl",
      "natural pearl": "Natural Pearl",
      pearl: "Natural Pearl",
      opal: "Opal",
      "orange madeira citirine": "Orange Madeira Citrine",
      "orange madeira citrine": "Orange Madeira Citrine",
      peridot: "Peridot",
      "pink chalcedony": "Pink Chalcedony",
      "pink sapphire": "Pink Sapphire",
      "pink tourmaline": "Pink Tourmaline",
      polki: "Polki",
      pyrope: "Pyrope Garnet",
      "pyrope garnet": "Pyrope Garnet",
      quartz: "Quartz",
      "red garnet": "Red Garnet",
      "rose quartz": "Rose Quartz",
      ruby: "Ruby",
      sapphire: "Sapphire",
      scolecite: "Scolecite",
      "smoky quartz": "Smoky Quartz",
      sodalite: "Sodalite",
      spinel: "Spinel",
      topaz: "Topaz",
      turquoise: "Turquoise",
      "uncut diamond": "Uncut Diamond",
      zircon: "Zircon",
      "white chalcedony": "White Chalcedony",
      "glass filled ruby": "Ruby",
      "ruby cut": "Ruby",
    };
    if (baseKey === "solitaire") {
      isSolitaire = true;
      continue;
    }
    const canonical = mapping[baseKey];
    if (!canonical) continue;

    gemstones.add(canonical);
    if (synthetic) origins.add(canonical);
    if (baseKey === "glass filled ruby") treatments.add("Glass Filled");
    if (baseKey === "ruby cut") cuts.add("Ruby Cut");
  }

  return {
    gemstones: CANONICAL_GEMSTONES.filter((gemstone) => gemstones.has(gemstone)),
    origins: Array.from(origins).sort((a, b) => a.localeCompare(b)),
    treatments: Array.from(treatments).sort((a, b) => a.localeCompare(b)),
    cuts: Array.from(cuts).sort((a, b) => a.localeCompare(b)),
    isSolitaire,
  };
}

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

function asNumber(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => asString(item))
      .filter(Boolean);
  }

  const single = asString(value);
  return single ? [single] : [];
}

function normalizeTagKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/["']/g, "")
    .replace(/\+/g, " plus ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mapRawTagToStyleOccasionBundle(rawTag: string): (typeof STYLE_OCCASION_BUNDLES)[number] | null {
  const key = normalizeTagKey(rawTag);
  if (!key) return null;

  if (
    /^(adjustable|after sell|b2b|best seller sets(?: 2)?|december collection 2025|enamel changes|free gift|giva royale|less aov|september collection(?: 2025)?|trial|hot|new arrivals|our picks)$/.test(key)
  ) {
    return null;
  }

  if (/^(everyday|casual|work|kids jewelery|kids jewellery|lightweight|minimal|my staple|my staples|staple)$/.test(key)) {
    return "Daily Wear";
  }

  if (/^(band|bridal|bridal inhouse|couple|couple bands|eternity|gold plus diamond|halo|solitaire|wedding collection|engagement|wedding)$/.test(key)) {
    return "Engagement & Wedding";
  }

  if (/^(celebration|chunky|chunky collection|cluster|cocktail|party|sparkling|statement)$/.test(key)) {
    return "Party & Statement";
  }

  if (/^(heart|infinity|knot|love|love all around|love in paris 2023|mothers day ready goods|red valentine 2024|valentine ready goods|valentines 2025|valentines 2026|valentines week|valentines)$/.test(key)) {
    return "Romantic & Gifting";
  }

  if (/^(animal love|beach baby|bird collection|butterfly|cosmic vibes|floral|garden of eden|gem stone|leaf|moonstone readygoods|religious|shakti collection|teal|trail|gifting)$/.test(key)) {
    return "Nature & Artistic";
  }

  if (/^(chevron|classic|classic collection|classic crown ring|glow in motion|layered|men collection|mens jewelery|mens jewelry|mens jewellery|modern|multi tone|signet|stackable|threads of elegance|twist|vanki|vintage)$/.test(key)) {
    return "Modern & Classic";
  }

  return null;
}

function deriveStyleOccasionBundles(styleBrand: string[], occasionBrand: string[]): string[] {
  const bundleSet = new Set<(typeof STYLE_OCCASION_BUNDLES)[number]>();
  for (const rawTag of [...styleBrand, ...occasionBrand]) {
    const mapped = mapRawTagToStyleOccasionBundle(rawTag);
    if (mapped) bundleSet.add(mapped);
  }

  return STYLE_OCCASION_BUNDLES.filter((bundle) => bundleSet.has(bundle));
}

function normalizeBrandKey(brand: string): string {
  return normalizeBrand(brand).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function normalizeIdentityToken(value: string): string {
  return value.trim().toLowerCase();
}

function buildSourceKey(brand: string, sourceProductId: string): string {
  return `${normalizeBrandKey(brand)}::${normalizeIdentityToken(sourceProductId)}`;
}

function buildIdentityKey(brand: string, sourceProductId: string, productUrl: string): string {
  const normalizedUrl = normalizeIdentityToken(productUrl);
  return `${buildSourceKey(brand, sourceProductId)}::${normalizedUrl}`;
}

function buildDeterministicProductId(brand: string, sourceProductId: string, productUrl: string): string {
  const identity = buildIdentityKey(brand, sourceProductId, productUrl);
  const digest = createHash("sha1").update(identity).digest("hex").toUpperCase().slice(0, 18);
  return `PYP${digest}`;
}

function loadExistingCatalog(): EnrichedProduct[] {
  if (!fs.existsSync(OUTPUT_FILE)) return [];

  try {
    const parsed = JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf-8"));
    if (!Array.isArray(parsed)) return [];
    return parsed as EnrichedProduct[];
  } catch {
    return [];
  }
}

function normalizeMalformedSilverPurity(rawValue: string): string {
  const normalized = rawValue.replace(/\s+/g, " ").trim();
  if (/^93\s*KT$/i.test(normalized)) return "Silver925";
  return normalized;
}

function normalizeBrand(rawBrand: string): string {
  if (!rawBrand) return "";

  if (/^giva(?:\s*(?:jewel+ery|jewelry))?$/i.test(rawBrand.trim())) {
    return "GIVA";
  }

  if (/^kalyan$/i.test(rawBrand)) {
    return "Candere";
  }

  if (/^palmonas$/i.test(rawBrand)) {
    return "Palmonas";
  }

  if (/^joyalukkas$/i.test(rawBrand)) {
    return "Joyalukkas";
  }

  if (/^melorra?$/i.test(rawBrand)) {
    return "Melorra";
  }

  if (/^senco?$/i.test(rawBrand)) {
    return "Senco";
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

  if (goldPlated || silverPlated) return "Gold";

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
  if (!normalized) return "Gold";

  if (/silver925/i.test(normalized)) return "Silver";

  // Gold takes precedence for mixed strings like "Platinum 950, 14 KT Two Tone Gold"
  if (/gold/i.test(normalized)) return "Gold";
  if (/rose gold/i.test(normalized)) return "Gold";
  if (/platinum|\b950\s*KT\b/i.test(normalized)) return "Platinum";
  if (/\b\d+\s*KT\b/i.test(normalized)) return "Gold";
  if (/rhodium/i.test(normalized)) return "Silver";
  if (/stainless\s*steel|\bsteel\b/i.test(normalized)) return "Steel";
  if (/silver|sterling/i.test(normalized)) return "Silver";

  return "Gold";
}

function canonicalizeMetalCategory(rawMetal: string): "Gold" | "Silver" | "Platinum" | "Steel" {
  const combined = normalizeMalformedSilverPurity(rawMetal).toLowerCase();

  if (/platinum|\b950\s*k(?:t)?\b/.test(combined)) return "Platinum";
  if (/silver|sterling|silver925|\b925\b|rhodium|white/.test(combined)) return "Silver";
  if (/rose\s*gold|yellow\s*gold|\bgold\b|\b\d+\s*k(?:t)?\b/.test(combined)) return "Gold";
  if (/stainless\s*steel|\bsteel\b/.test(combined)) return "Steel";

  return "Gold";
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

  return normalized;
}

function normalizePrimaryImageUrl(rawUrl: string, brand: string): string {
  const normalized = normalizeMiaByTanishqImageUrl(normalizeImageUrl(rawUrl), brand);

  if (normalizeBrand(brand).toLowerCase() === "bluestone") {
    // BlueStone primary image should prefer the regular product image variant.
    return normalized.replace(/BP-PICS-00000/gi, "PICS-00001");
  }

  return normalized;
}

function isMiaByTanishqBrand(brand: string): boolean {
  const normalizedBrand = normalizeBrand(brand).toLowerCase().replace(/\s+/g, "");
  return normalizedBrand === "miabytanishq";
}

function isTanishqBrand(brand: string): boolean {
  return normalizeBrand(brand).toLowerCase().replace(/\s+/g, "") === "tanishq";
}

function normalizeMiaByTanishqImageUrl(url: string, brand: string): string {
  if (!isMiaByTanishqBrand(brand) && !isTanishqBrand(brand)) return url;
  return url.replace(/([?&])sw=480&sh=480\b/gi, "$1sw=640&sh=640");
}

function shouldDropBlueStoneAllImage(url: string): boolean {
  return /\/video-call-icon\.png$/i.test(url);
}

function isMp4Asset(url: string): boolean {
  return /\.mp4(?:[?#].*)?$/i.test(url);
}

function extractImageSkuFromUrl(url: string): string {
  const match = url.match(/\/([A-Z0-9]+)(?:_\d+)?\.(?:jpg|jpeg|png|webp)(?:[?#].*)?$/i);
  return (match?.[1] ?? "").toLowerCase();
}

function isRelevantProductImageBySku(url: string, productId: string): boolean {
  if (!productId) return true;
  const imageSku = extractImageSkuFromUrl(url);
  if (!imageSku) return true;
  return imageSku === productId.toLowerCase();
}

function shouldEnforceAllImagesSkuMatch(brand: string): boolean {
  const normalizedBrand = normalizeBrand(brand).toLowerCase().replace(/\s+/g, "");
  return normalizedBrand === "tanishq" || normalizedBrand === "miabytanishq";
}

function normalizeAllImages(rawValue: unknown, brand: string, productId: string): unknown {
  if (rawValue == null) return rawValue;

  const isBlueStone = normalizeBrand(brand).toLowerCase() === "bluestone";
  const enforceSkuMatch = shouldEnforceAllImagesSkuMatch(brand);

  const normalizeAndFilter = (value: unknown): string =>
    normalizeMiaByTanishqImageUrl(normalizeImageUrl(asString(value)), brand);

  const shouldKeep = (url: string): boolean => {
    if (url === "") return false;
    if (isMp4Asset(url)) return false;
    if (isBlueStone && shouldDropBlueStoneAllImage(url)) return false;
    if (enforceSkuMatch && !isRelevantProductImageBySku(url, productId)) return false;
    return true;
  };

  if (Array.isArray(rawValue)) {
    return rawValue
      .map((item) => normalizeAndFilter(item))
      .filter((item) => shouldKeep(item));
  }

  if (typeof rawValue === "string") {
    const normalized = normalizeAndFilter(rawValue);
    return shouldKeep(normalized) ? normalized : "";
  }

  return rawValue;
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
  const normalizedProducts = all
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
      const gemstoneMetadata = normalizeGemstones(product.gemstone);
      const styleBrand = asStringArray(product.style);
      const occasionBrand = asStringArray(product.occasion);
      const sourceProductId = asString(product.id) || asString(product.sku) || asString(product.productUrl);
      const normalizedPurity = derivePurity(rawPurity, rawMetal, rawMetalColor, rawName, rawDescription);
      const pypProductId = buildDeterministicProductId(rawBrand, sourceProductId, asString(product.productUrl));

      normalized.brand = normalizeBrand(rawBrand);
      normalized.pyp_product_id = pypProductId;
      normalized.purity = normalizedPurity;
      const derivedMetal = shouldForceSilverMetal(normalizedPurity)
        ? "Silver"
        : deriveBaseMetal(rawMetal, rawPurity, rawMetalColor, rawName, rawDescription);
      normalized.metal = canonicalizeMetalCategory(derivedMetal);
      normalized.metalColor = deriveMetalColor(rawMetalColor, rawMetal, rawPurity);
      normalized.image = normalizePrimaryImageUrl(asString(product.image), rawBrand);
      normalized.style_brand = styleBrand;
      normalized.occasion_brand = occasionBrand;
      normalized.ocassion_brand = occasionBrand;
      normalized.styleOccasion = deriveStyleOccasionBundles(styleBrand, occasionBrand);
      normalized.gemstone = gemstoneMetadata.gemstones;
      if (gemstoneMetadata.origins.length > 0) normalized.gemstoneOrigin = gemstoneMetadata.origins;
      if (gemstoneMetadata.treatments.length > 0) normalized.gemstoneTreatment = gemstoneMetadata.treatments;
      if (gemstoneMetadata.cuts.length > 0) normalized.gemstoneCut = gemstoneMetadata.cuts;
      if (gemstoneMetadata.isSolitaire) normalized.is_solitaire = true;

      if (Object.prototype.hasOwnProperty.call(product, "allImages") && product.allImages != null) {
        const normalizedAllImages = normalizeAllImages(product.allImages, rawBrand, sourceProductId);
        if (Array.isArray(normalizedAllImages)) {
          if (normalizedAllImages.length > 0) {
            normalized.allImages = normalizedAllImages;
          }
        } else if (typeof normalizedAllImages === "string") {
          if (normalizedAllImages) {
            normalized.allImages = normalizedAllImages;
          }
        } else {
          normalized.allImages = normalizedAllImages;
        }
      }

      return normalized;
    });

  fs.mkdirSync(path.dirname(NORMALIZED_OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(NORMALIZED_OUTPUT_FILE, JSON.stringify(normalizedProducts, null, 2), "utf-8");

  const runAt = new Date().toISOString();
  const existingCatalog = loadExistingCatalog();
  const nextCatalog: EnrichedProduct[] = [];
  const changelog: ProductChangelogEntry[] = [];

  const existingByPypId = new Map<string, EnrichedProduct>();
  const existingByIdentity = new Map<string, EnrichedProduct>();
  const existingBySource = new Map<string, EnrichedProduct[]>();
  const matchedExistingProductKeys = new Set<string>();

  for (const existing of existingCatalog) {
    const brand = asString(existing.brand);
    const sourceProductId = asString((existing as JsonRecord).source_product_id) || asString(existing.id) || asString(existing.sku) || asString(existing.productUrl);
    const productUrl = asString(existing.productUrl);
    if (!brand || !sourceProductId || !productUrl) continue;

    const existingPypId = asString((existing as JsonRecord).pyp_product_id);
    if (existingPypId) existingByPypId.set(existingPypId, existing);

    const identityKey = buildIdentityKey(brand, sourceProductId, productUrl);
    const sourceKey = buildSourceKey(brand, sourceProductId);

    existingByIdentity.set(identityKey, existing);
    const bucket = existingBySource.get(sourceKey) ?? [];
    bucket.push(existing);
    existingBySource.set(sourceKey, bucket);
  }

  for (const fresh of normalizedProducts) {
    const brand = asString(fresh.brand);
    const sourceProductId = asString(fresh.id) || asString(fresh.sku) || asString(fresh.productUrl);
    const productUrl = asString(fresh.productUrl);
    const name = asString(fresh.name);
    const price = asNumber(fresh.price);
    const availability = Boolean(fresh.availability);

    if (!brand || !sourceProductId || !productUrl) {
      continue;
    }

    const identityKey = buildIdentityKey(brand, sourceProductId, productUrl);
    const sourceKey = buildSourceKey(brand, sourceProductId);
    const freshPypProductId = asString(fresh.pyp_product_id);

    let matched = (freshPypProductId ? existingByPypId.get(freshPypProductId) : undefined) ?? existingByIdentity.get(identityKey);
    const matchedKey = matched
      ? asString((matched as JsonRecord).pyp_product_id) || asString(matched.id)
      : "";
    if (matched && matchedKey && matchedExistingProductKeys.has(matchedKey)) {
      matched = undefined;
    }

    if (!matched) {
      const sourceCandidates = (existingBySource.get(sourceKey) ?? []).filter(
        (candidate) => !matchedExistingProductKeys.has(asString((candidate as JsonRecord).pyp_product_id) || asString(candidate.id))
      );
      if (sourceCandidates.length === 1) {
        matched = sourceCandidates[0];
      }
    }

    const existingId = matched ? asString(matched.id) : "";
    const existingPypProductId = matched ? asString((matched as JsonRecord).pyp_product_id) : "";
    const existingProductKey = matched ? (existingPypProductId || existingId) : "";
    const existingCurrentPrice = matched ? asNumber((matched as JsonRecord).current_price ?? matched.price) : 0;
    const existingAvailability = matched ? Boolean(matched.availability) : false;

    const nextId = existingId || buildDeterministicProductId(brand, sourceProductId, productUrl);
    const nextPypProductId = existingPypProductId || buildDeterministicProductId(brand, sourceProductId, productUrl);
    const firstSeenAt = matched ? asString(matched.first_seen_at) || runAt : (asString(fresh.updatedAt) || runAt);
    const previousPrice = matched ? existingCurrentPrice : null;

    const enriched: EnrichedProduct = {
      ...fresh,
      id: nextId,
      brand,
      pyp_product_id: nextPypProductId,
      first_seen_at: firstSeenAt,
      current_price: price,
      previous_price: previousPrice,
      availability,
      price,
    };

    nextCatalog.push(enriched);
    if (existingProductKey) {
      matchedExistingProductKeys.add(existingProductKey);
    } else {
      matchedExistingProductKeys.add(nextPypProductId);
    }

    if (!matched) {
      changelog.push({
        at: runAt,
        type: "new",
        id: nextId,
        pyp_product_id: nextPypProductId,
        brand,
        name,
        current_price: price,
      });
      continue;
    }

    const changed = JSON.stringify(fresh) !== JSON.stringify(
      Object.fromEntries(Object.entries(matched as JsonRecord).filter(([key]) =>
        !["id", "pyp_product_id", "first_seen_at", "current_price", "previous_price"].includes(key)
      ))
    );

    if (changed) {
      changelog.push({
        at: runAt,
        type: "updated",
        id: nextId,
        pyp_product_id: nextPypProductId,
        brand,
        name,
      });
    }

    if (existingCurrentPrice !== price) {
      changelog.push({
        at: runAt,
        type: "price_changed",
        id: nextId,
        pyp_product_id: nextPypProductId,
        brand,
        name,
        previous_price: existingCurrentPrice,
        current_price: price,
      });
    }

    if (!existingAvailability && availability) {
      changelog.push({
        at: runAt,
        type: "relisted",
        id: nextId,
        pyp_product_id: nextPypProductId,
        brand,
        name,
      });
    }
  }

  for (const existing of existingCatalog) {
    const existingId = asString(existing.id);
    const existingProductKey = asString((existing as JsonRecord).pyp_product_id) || existingId;
    if (!existingProductKey || matchedExistingProductKeys.has(existingProductKey)) continue;

    const delistedCurrentPrice = asNumber((existing as JsonRecord).current_price ?? existing.price);
    const delistedPreviousPrice = ((existing as JsonRecord).previous_price as number | null | undefined) ?? null;
    const delisted: EnrichedProduct = {
      ...existing,
      availability: false,
      current_price: delistedCurrentPrice,
      previous_price: delistedPreviousPrice ?? (delistedCurrentPrice > 0 ? delistedCurrentPrice : null),
      first_seen_at: asString(existing.first_seen_at),
      pyp_product_id: asString((existing as JsonRecord).pyp_product_id) || buildDeterministicProductId(asString(existing.brand), asString(existing.id), asString(existing.productUrl)),
    };

    nextCatalog.push(delisted);

    if (Boolean(existing.availability)) {
      changelog.push({
        at: runAt,
        type: "delisted",
        id: existingId,
        pyp_product_id: delisted.pyp_product_id,
        brand: asString(existing.brand),
        name: asString(existing.name),
        current_price: asNumber((existing as JsonRecord).current_price ?? existing.price),
      });
    }
  }

  validateCatalog(nextCatalog, normalizedProducts);

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(nextCatalog, null, 2), "utf-8");
  fs.writeFileSync(CHANGELOG_OUTPUT_FILE, JSON.stringify(changelog, null, 2), "utf-8");

  // Generate filter options from the live catalog (available products only).
  const available = nextCatalog.filter((p) => Boolean(p.availability));
  function uniqueSorted(values: string[]): string[] {
    return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }
  function collectArray(field: string): string[] {
    const vals: string[] = [];
    for (const p of available) {
      const v = (p as JsonRecord)[field];
      if (Array.isArray(v)) v.forEach((x) => { if (typeof x === "string" && x.trim()) vals.push(x.trim()); });
      else if (typeof v === "string" && v.trim()) vals.push(v.trim());
    }
    return uniqueSorted(vals);
  }
  const filterOptions = {
    brand: uniqueSorted(available.map((p) => asString(p.brand))),
    metal: uniqueSorted(available.map((p) => asString((p as JsonRecord).metal as string))),
    gemstone: collectArray("gemstone"),
    purity: collectArray("purity"),
    metalColor: collectArray("metalColor"),
    styleOccasion: STYLE_OCCASION_BUNDLES.filter((bundle) =>
      available.some((p) => {
        const values = (p as JsonRecord).styleOccasion;
        return Array.isArray(values) && values.includes(bundle);
      })
    ),
    gender: uniqueSorted(available.map((p) => asString((p as JsonRecord).gender as string))),
    diamondQuality: collectArray("diamondQuality"),
  };
  fs.writeFileSync(FILTER_OPTIONS_FILE, JSON.stringify(filterOptions, null, 2), "utf-8");

  console.log(
    `Normalized ${normalizedProducts.length} products -> data/new_products.json | Reconciled ${nextCatalog.length} products -> data/products.json | Changelog ${changelog.length} events -> data/products.changelog.json`
  );

  return nextCatalog;
}

// ---------------------------------------------------------------------------
// Catalog validation — runs before any file is written
// ---------------------------------------------------------------------------

function validateCatalog(catalog: EnrichedProduct[], normalized: JsonRecord[]): void {
  const VALID_BUNDLES = new Set<string>(STYLE_OCCASION_BUNDLES);
  const errors: string[] = [];

  // 1. Every active normalized product must have a pyp_product_id
  for (const p of normalized) {
    if (!asString(p.pyp_product_id)) {
      errors.push(`Missing pyp_product_id for product: ${asString(p.name)} (brand: ${asString(p.brand)})`);
    }
  }

  // 2. No duplicate pyp_product_id among available catalog products
  const availablePypIds = catalog
    .filter((p) => p.availability)
    .map((p) => asString((p as JsonRecord).pyp_product_id));
  const seen = new Set<string>();
  for (const id of availablePypIds) {
    if (id && seen.has(id)) {
      errors.push(`Duplicate pyp_product_id in available products: ${id}`);
    }
    if (id) seen.add(id);
  }

  // 3. All available products must have current_price > 0
  for (const p of catalog) {
    if (p.availability && asNumber((p as JsonRecord).current_price) <= 0) {
      errors.push(`Available product has zero/missing current_price: ${asString(p.id)} (${asString(p.brand)} - ${asString((p as JsonRecord).name as string)})`);
    }
  }

  // 4. styleOccasion values must only contain valid bundle names
  for (const p of normalized) {
    const bundles = (p as JsonRecord).styleOccasion;
    if (Array.isArray(bundles)) {
      for (const b of bundles) {
        if (typeof b === "string" && b && !VALID_BUNDLES.has(b)) {
          errors.push(`Invalid styleOccasion bundle "${b}" on product: ${asString(p.name)}`);
        }
      }
    }
  }

  // 5. All catalog products must have a non-empty brand
  for (const p of catalog) {
    if (!asString(p.brand)) {
      errors.push(`Product missing brand: ${asString(p.id)}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Catalog validation failed with ${errors.length} error(s):\n${errors.slice(0, 20).map((e, i) => `  ${i + 1}. ${e}`).join("\n")}${errors.length > 20 ? `\n  ... and ${errors.length - 20} more` : ""}`
    );
  }
}

// ---------------------------------------------------------------------------
// Test exports — used by scraper/mergeProducts.test.ts only
// ---------------------------------------------------------------------------

export const _testExports = {
  normalizeBrand,
  normalizePurity,
  normalizeGemstones,
  derivePurity,
  canonicalizeMetalCategory,
  deriveMetalColor,
  mapRawTagToStyleOccasionBundle,
  deriveStyleOccasionBundles,
  buildDeterministicProductId,
  validateCatalog,
  STYLE_OCCASION_BUNDLES,
  CANONICAL_GEMSTONES,
};
