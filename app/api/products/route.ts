import type { NextRequest } from "next/server";
import products from "@/data/products.json";
import type { Product } from "@/types/product";
import {
  DEFAULT_PRODUCT_SORT,
  PRODUCT_FILTER_KEYS,
  PRODUCT_SORT_OPTIONS,
  type ProductFilters,
  type ProductSort,
} from "@/types/filters";

type SearchableProduct = Product & { description?: string };

interface SearchMeta {
  originalQuery: string;
  appliedQuery: string;
  suggestedQuery: string | null;
  showingSuggestedResults: boolean;
}

export const dynamic = "force-dynamic";

const allProducts = products as SearchableProduct[];
const DEFAULT_LIMIT = 48;
const MAX_LIMIT = 120;
const PRICE_BOUNDS = allProducts.reduce(
  (acc, item) => {
    const price = typeof item.price === "number" ? item.price : Number.MAX_SAFE_INTEGER;
    return {
      min: Math.min(acc.min, price),
      max: Math.max(acc.max, price),
    };
  },
  { min: Number.MAX_SAFE_INTEGER, max: 0 }
);

const normalizeSearchText = (value: string): string => value
  .toLowerCase()
  .replace(/[^a-z0-9\s]+/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const searchableProducts = allProducts.map((product) => {
  const name = normalizeSearchText(product.name);
  const description = normalizeSearchText(product.description ?? "");
  const brand = normalizeSearchText(product.brand);
  const category = normalizeSearchText(product.category);
  const metal = normalizeSearchText(product.metal);
  const combined = normalizeSearchText([
    product.name,
    product.description ?? "",
    product.brand,
    product.category,
    product.metal,
  ].join(" "));

  return {
    product,
    name,
    description,
    brand,
    category,
    metal,
    combined,
    tokens: Array.from(new Set(combined.split(" ").filter(Boolean))),
  };
});

const tokenFrequency = searchableProducts.reduce((map, entry) => {
  for (const token of entry.tokens) {
    map.set(token, (map.get(token) ?? 0) + 1);
  }
  return map;
}, new Map<string, number>());

const searchableVocabulary = Array.from(tokenFrequency.keys());

function getAllowedTypoDistance(term: string): number {
  if (term.length >= 9) return 2;
  if (term.length >= 6) return 1;
  return 0;
}

function getEditDistanceWithinLimit(source: string, target: string, limit: number): number | null {
  const sourceLength = source.length;
  const targetLength = target.length;

  if (Math.abs(sourceLength - targetLength) > limit) return null;

  const previous = Array.from({ length: targetLength + 1 }, (_, index) => index);
  const current = new Array<number>(targetLength + 1);

  for (let row = 1; row <= sourceLength; row += 1) {
    current[0] = row;
    let rowMin = current[0];

    for (let column = 1; column <= targetLength; column += 1) {
      const cost = source[row - 1] === target[column - 1] ? 0 : 1;
      const insertion = current[column - 1] + 1;
      const deletion = previous[column] + 1;
      const substitution = previous[column - 1] + cost;
      const value = Math.min(insertion, deletion, substitution);
      current[column] = value;
      if (value < rowMin) rowMin = value;
    }

    if (rowMin > limit) return null;

    for (let column = 0; column <= targetLength; column += 1) {
      previous[column] = current[column];
    }
  }

  return previous[targetLength] <= limit ? previous[targetLength] : null;
}

function getBestTokenMatchScore(tokens: string[], term: string): number {
  let bestScore = -1;

  for (const token of tokens) {
    if (token === term) return 0;
    if (token.startsWith(term) || token.includes(term) || term.includes(token)) {
      bestScore = Math.max(bestScore, 0);
      continue;
    }

    const allowedDistance = getAllowedTypoDistance(term);
    if (allowedDistance === 0) continue;

    const distance = getEditDistanceWithinLimit(term, token, allowedDistance);
    if (distance == null) continue;

    const fuzzyPenalty = distance === 1 ? 14 : 28;
    if (bestScore === -1 || fuzzyPenalty < bestScore) {
      bestScore = fuzzyPenalty;
    }
  }

  return bestScore;
}

function getSuggestedToken(term: string): string | null {
  if (tokenFrequency.has(term)) return term;

  const allowedDistance = getAllowedTypoDistance(term);
  if (allowedDistance === 0) return null;

  let bestToken: string | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  let bestFrequency = -1;

  for (const candidate of searchableVocabulary) {
    if (Math.abs(candidate.length - term.length) > allowedDistance) continue;

    const distance = getEditDistanceWithinLimit(term, candidate, allowedDistance);
    if (distance == null) continue;

    const frequency = tokenFrequency.get(candidate) ?? 0;
    if (
      distance < bestDistance ||
      (distance === bestDistance && frequency > bestFrequency)
    ) {
      bestToken = candidate;
      bestDistance = distance;
      bestFrequency = frequency;
    }
  }

  return bestToken;
}

function buildSuggestedQuery(query: string): string | null {
  const terms = query.split(" ").filter(Boolean);
  let changed = false;

  const suggestedTerms = terms.map((term) => {
    const suggestion = getSuggestedToken(term);
    if (!suggestion) return term;
    if (suggestion !== term) changed = true;
    return suggestion;
  });

  return changed ? suggestedTerms.join(" ") : null;
}

function parseFilters(searchParams: URLSearchParams): ProductFilters {
  const result = {} as ProductFilters;

  for (const key of PRODUCT_FILTER_KEYS) {
    result[key] = searchParams
      .getAll(key)
      .map((value) => value.trim())
      .filter(Boolean);
  }

  return result;
}

function matchesArrayValue(values: string[] | undefined, selected: string[]): boolean {
  if (!values || values.length === 0) return false;
  return selected.some((value) => values.includes(value));
}

function matchesScalarValue(value: string | boolean | undefined, selected: string[]): boolean {
  if (selected.length === 0) return true;
  if (value === undefined) return false;
  return selected.includes(String(value));
}

function matchesProductFilters(product: Product, filters: ProductFilters): boolean {
  if (!matchesScalarValue(product.brand, filters.brand)) return false;
  if (!matchesScalarValue(product.category, filters.category)) return false;
  if (!matchesScalarValue(product.metal, filters.metal)) return false;
  if (filters.gemstone.length > 0 && !matchesArrayValue(product.gemstone, filters.gemstone)) return false;
  if (filters.occasion.length > 0 && !matchesArrayValue(product.occasion, filters.occasion)) return false;
  if (filters.style.length > 0 && !matchesArrayValue(product.style, filters.style)) return false;
  if (!matchesScalarValue(product.gender, filters.gender)) return false;
  if (!matchesScalarValue(product.availability, filters.availability)) return false;
  if (!matchesScalarValue(product.purity, filters.purity)) return false;
  if (!matchesScalarValue(product.metalColor, filters.metalColor)) return false;
  if (!matchesScalarValue(product.diamondQuality, filters.diamondQuality)) return false;

  return true;
}

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) return fallback;
  return parsed;
}

function parseSort(value: string | null): ProductSort {
  if (!value) return DEFAULT_PRODUCT_SORT;
  if ((PRODUCT_SORT_OPTIONS as readonly string[]).includes(value)) {
    return value as ProductSort;
  }
  return DEFAULT_PRODUCT_SORT;
}

function parsePriceRange(searchParams: URLSearchParams): { min: number; max: number } {
  const minRaw = parsePositiveInt(searchParams.get("minPrice"), PRICE_BOUNDS.min);
  const maxRaw = parsePositiveInt(searchParams.get("maxPrice"), PRICE_BOUNDS.max);

  const min = Math.max(PRICE_BOUNDS.min, minRaw);
  const max = Math.min(PRICE_BOUNDS.max, maxRaw);

  return {
    min: Math.min(min, max),
    max: Math.max(min, max),
  };
}

function parseQuery(value: string | null): string {
  return normalizeSearchText(value ?? "");
}

function scoreSearchField(
  field: string,
  query: string,
  terms: string[],
  weights: { exact: number; prefix: number; includes: number; term: number }
): number {
  if (!field) return 0;

  let score = 0;

  if (field === query) score += weights.exact;
  else if (field.startsWith(query)) score += weights.prefix;
  else if (field.includes(query)) score += weights.includes;

  for (const term of terms) {
    if (field === term) score += weights.term + 10;
    else if (field.startsWith(term)) score += weights.term;
    else if (field.includes(term)) score += Math.max(6, Math.floor(weights.term / 2));
  }

  return score;
}

function scoreProductSearch(
  entry: (typeof searchableProducts)[number],
  query: string,
  terms: string[]
): number {
  if (!query) return 0;

  let fuzzyPenalty = 0;
  for (const term of terms) {
    const matchScore = getBestTokenMatchScore(entry.tokens, term);
    if (matchScore < 0) return -1;
    fuzzyPenalty += matchScore;
  }

  return (
    scoreSearchField(entry.name, query, terms, { exact: 180, prefix: 130, includes: 90, term: 42 }) +
    scoreSearchField(entry.brand, query, terms, { exact: 90, prefix: 64, includes: 44, term: 24 }) +
    scoreSearchField(entry.description, query, terms, { exact: 70, prefix: 48, includes: 34, term: 18 }) +
    scoreSearchField(entry.category, query, terms, { exact: 36, prefix: 22, includes: 18, term: 10 }) +
    scoreSearchField(entry.metal, query, terms, { exact: 28, prefix: 20, includes: 14, term: 9 }) -
    fuzzyPenalty
  );
}

function sortProducts(
  items: Array<{ product: SearchableProduct; score: number }>,
  sort: ProductSort,
  hasQuery: boolean,
  hasExplicitSort: boolean
): Product[] {
  const copy = [...items];
  copy.sort((a, b) => {
    const aPrice = typeof a.product.price === "number" ? a.product.price : Number.MAX_SAFE_INTEGER;
    const bPrice = typeof b.product.price === "number" ? b.product.price : Number.MAX_SAFE_INTEGER;

    // If user explicitly chooses a sort, honor that sort first.
    if (hasExplicitSort && aPrice !== bPrice) {
      return sort === "price-asc" ? aPrice - bPrice : bPrice - aPrice;
    }

    // Otherwise keep best-match relevance as the primary search order.
    if (hasQuery && a.score !== b.score) {
      return b.score - a.score;
    }

    if (aPrice !== bPrice) {
      return sort === "price-asc" ? aPrice - bPrice : bPrice - aPrice;
    }

    return 0;
  });

  return copy.map((entry) => entry.product);
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const hasExplicitSort = searchParams.has("sort");
  const cursor = parsePositiveInt(searchParams.get("cursor"), 0);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parsePositiveInt(searchParams.get("limit"), DEFAULT_LIMIT)));
  const filters = parseFilters(searchParams);
  const sort = parseSort(searchParams.get("sort"));
  const priceRange = parsePriceRange(searchParams);
  const query = parseQuery(searchParams.get("q"));
  const suggestedQuery = query ? buildSuggestedQuery(query) : null;
  const appliedQuery = suggestedQuery ?? query;
  const queryTerms = appliedQuery ? appliedQuery.split(" ").filter(Boolean) : [];

  const filtered = searchableProducts
    .filter(({ product }) => {
      if (typeof product.price !== "number") return false;
      if (product.price < priceRange.min || product.price > priceRange.max) return false;
      return matchesProductFilters(product, filters);
    })
    .map((entry) => ({
      product: entry.product,
      score: appliedQuery ? scoreProductSearch(entry, appliedQuery, queryTerms) : 0,
    }))
    .filter((entry) => entry.score >= 0);

  const sorted = sortProducts(filtered, sort, Boolean(appliedQuery), hasExplicitSort);

  const start = Math.min(cursor, sorted.length);
  const end = Math.min(start + limit, sorted.length);

  const items = sorted.slice(start, end);
  const nextCursor = end < sorted.length ? end : null;
  const search: SearchMeta | null = query
    ? {
      originalQuery: query,
      appliedQuery: appliedQuery || query,
      suggestedQuery,
      showingSuggestedResults: Boolean(suggestedQuery),
    }
    : null;

  return Response.json({
    items,
    nextCursor,
    total: sorted.length,
    search,
  });
}
