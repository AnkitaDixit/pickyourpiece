import type { Product } from "@/types/product";

const BRAND_ALIAS_TO_SEGMENT: Record<string, string> = {
  bluestone: "bluestone",
  caratlane: "caratlane",
  tanishq: "tanishq",
  giva: "giva",
  orra: "orra",
  candere: "candere",
  mia: "mia",
  "mia by tanishq": "mia",
  miabytanishq: "mia",
};

export const BRAND_SEGMENT_TO_DISPLAY: Record<string, string> = {
  bluestone: "BlueStone",
  caratlane: "Caratlane",
  tanishq: "Tanishq",
  giva: "GIVA",
  mia: "Mia by Tanishq",
  orra: "ORRA",
  candere: "Candere",
};

const slugify = (value: string): string => {
  return value
    .toLowerCase()
    .trim()
    .replace(/["']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const normalizeBrandKey = (value: string): string => {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
};

export const getBrandSegment = (brand: string): string | null => {
  const normalized = normalizeBrandKey(brand);
  const compact = normalized.replace(/\s+/g, "");
  return BRAND_ALIAS_TO_SEGMENT[normalized] ?? BRAND_ALIAS_TO_SEGMENT[compact] ?? null;
};

export const getBrandDisplayName = (brandSegment: string): string | null => {
  return BRAND_SEGMENT_TO_DISPLAY[brandSegment] ?? null;
};

export const buildProductDetailSlug = (name: string, id: string | number): string => {
  const nameSlug = slugify(name);
  const idPart = String(id).trim();
  return `${nameSlug}-${idPart}`;
};

export const buildProductDetailPath = (product: Pick<Product, "brand" | "name" | "id">): string | null => {
  const brand = getBrandSegment(product.brand);
  if (!brand) return null;
  return `/product/${brand}/${buildProductDetailSlug(product.name, product.id)}`;
};

export const parseProductSlug = (slug: string): { nameSlug: string; id: string } | null => {
  const trimmed = slug.trim().toLowerCase();
  const splitAt = trimmed.lastIndexOf("-");
  if (splitAt <= 0 || splitAt === trimmed.length - 1) return null;

  const nameSlug = trimmed.slice(0, splitAt);
  const id = decodeURIComponent(trimmed.slice(splitAt + 1));
  if (!nameSlug || !id) return null;

  return { nameSlug, id };
};

export const parseProductSlugCandidates = (slug: string): Array<{ nameSlug: string; id: string }> => {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return [];

  const parts = normalized.split("-").filter(Boolean);
  if (parts.length < 2) return [];

  const candidates: Array<{ nameSlug: string; id: string }> = [];
  for (let split = parts.length - 1; split >= 1; split -= 1) {
    const nameSlug = parts.slice(0, split).join("-");
    const id = decodeURIComponent(parts.slice(split).join("-"));
    if (!nameSlug || !id) continue;
    candidates.push({ nameSlug, id });
  }

  return candidates;
};

export const getPrimaryProductId = (record: Record<string, unknown>): string | null => {
  const candidates = [record.id, record.sku, record.handle];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
    if (typeof candidate === "number") return String(candidate);
  }
  return null;
};

export const formatFieldLabel = (key: string): string => {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const toNameSlug = (value: string): string => slugify(value);
