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

export const dynamic = "force-dynamic";

const allProducts = products as Product[];
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

function sortProducts(items: Product[], sort: ProductSort): Product[] {
  const copy = [...items];
  copy.sort((a, b) => {
    const aPrice = typeof a.price === "number" ? a.price : Number.MAX_SAFE_INTEGER;
    const bPrice = typeof b.price === "number" ? b.price : Number.MAX_SAFE_INTEGER;
    return sort === "price-asc" ? aPrice - bPrice : bPrice - aPrice;
  });

  return copy;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const cursor = parsePositiveInt(searchParams.get("cursor"), 0);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parsePositiveInt(searchParams.get("limit"), DEFAULT_LIMIT)));
  const filters = parseFilters(searchParams);
  const sort = parseSort(searchParams.get("sort"));
  const priceRange = parsePriceRange(searchParams);

  const filtered = allProducts.filter((product) => {
    if (typeof product.price !== "number") return false;
    if (product.price < priceRange.min || product.price > priceRange.max) return false;
    return matchesProductFilters(product, filters);
  });
  const sorted = sortProducts(filtered, sort);

  const start = Math.min(cursor, sorted.length);
  const end = Math.min(start + limit, sorted.length);

  const items = sorted.slice(start, end);
  const nextCursor = end < sorted.length ? end : null;

  return Response.json({
    items,
    nextCursor,
    total: sorted.length,
  });
}
