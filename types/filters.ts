export const PRODUCT_FILTER_KEYS = [
  "brand",
  "category",
  "metal",
  "gemstone",
  "occasion",
  "style",
  "gender",
  "availability",
  "purity",
  "metalColor",
  "diamondQuality",
] as const;

export const PRODUCT_SORT_OPTIONS = [
  "price-asc",
  "price-desc",
] as const;

export const DEFAULT_PRODUCT_SORT = "price-asc" as const;

export type ProductFilterKey = (typeof PRODUCT_FILTER_KEYS)[number];
export type ProductFilters = Record<ProductFilterKey, string[]>;
export type ProductSort = (typeof PRODUCT_SORT_OPTIONS)[number];
export interface PriceRange {
  min: number;
  max: number;
}

export const EMPTY_PRODUCT_FILTERS: ProductFilters = {
  brand: [],
  category: [],
  metal: [],
  gemstone: [],
  occasion: [],
  style: [],
  gender: [],
  availability: [],
  purity: [],
  metalColor: [],
  diamondQuality: [],
};

export function hasActiveFilters(filters: ProductFilters): boolean {
  return PRODUCT_FILTER_KEYS.some((key) => filters[key].length > 0);
}

export function hasActivePriceRange(priceRange: PriceRange, bounds: PriceRange): boolean {
  return priceRange.min > bounds.min || priceRange.max < bounds.max;
}
