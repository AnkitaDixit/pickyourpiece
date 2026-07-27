"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import FilterBar from "@/components/search/FilterBar";
import InfiniteProductGrid from "@/components/cards/InfiniteProductGrid";
import ProductPreviewPanel from "@/components/catalog/ProductPreviewPanel";
import type { Product } from "@/types/product";
import { buildProductDetailPath } from "@/lib/product-seo";
import {
  DEFAULT_PRODUCT_SORT,
  EMPTY_PRODUCT_FILTERS,
  hasActivePriceRange,
  PRODUCT_FILTER_KEYS,
  PRODUCT_SORT_OPTIONS,
  type PriceRange,
  type ProductFilterKey,
  type ProductFilters,
  type ProductSort,
} from "@/types/filters";
import { getAnalyticsContextFromPath, normalizeAnalyticsCategory, trackEvent } from "@/lib/analytics";

function getCatalogSection(pathname: string): string {
  return pathname === "/" ? "homepage_catalog" : pathname.replace(/^\//, "") || "catalog";
}

function getCatalogCategory(pathname: string, forcedFilters?: Partial<ProductFilters>): string {
  const forcedCategory = forcedFilters?.category?.[0];
  return normalizeAnalyticsCategory(forcedCategory) ?? getAnalyticsContextFromPath(pathname).catalog_category;
}

function summarizeChangedFilterValues(previous: string[], next: string[]) {
  const previousSet = new Set(previous);
  const nextSet = new Set(next);
  const added = next.filter((value) => !previousSet.has(value));
  const removed = previous.filter((value) => !nextSet.has(value));

  return { added, removed };
}

function countActiveFilters(filters: ProductFilters, priceRange: PriceRange, bounds: PriceRange) {
  const optionCount = PRODUCT_FILTER_KEYS.reduce((count, key) => count + (filters[key].length > 0 ? 1 : 0), 0);
  return optionCount + (hasActivePriceRange(priceRange, bounds) ? 1 : 0);
}

interface Props {
  initialItems: Product[];
  initialNextCursor: number | null;
  pageSize: number;
  minPrice: number;
  maxPrice: number;
  initialSelectedProduct?: Product | null;
  hiddenFilterKeys?: ProductFilterKey[];
  forcedFilters?: Partial<ProductFilters>;
}

export default function ProductsExplorer({
  initialItems,
  initialNextCursor,
  pageSize,
  minPrice,
  maxPrice,
  initialSelectedProduct = null,
  hiddenFilterKeys = [],
  forcedFilters,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const catalogQueryString = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("preview");
    return params.toString();
  }, [searchParams]);

  const replaceCatalogParams = (mutate: (params: URLSearchParams) => void) => {
    const currentParams = new URLSearchParams(catalogQueryString);
    const previewValue = currentParams.get("preview");
    currentParams.delete("preview");

    const nextParams = new URLSearchParams(currentParams.toString());
    mutate(nextParams);

    const current = toCanonicalQuery(currentParams);
    const next = toCanonicalQuery(nextParams);
    if (current === next) return;

    if (previewValue) {
      nextParams.set("preview", previewValue);
    }

    const fullNext = nextParams.toString();
    router.replace(fullNext ? `${pathname}?${fullNext}` : pathname, { scroll: false });
  };

  const toCanonicalQuery = (params: URLSearchParams): string => {
    const sorted = Array.from(params.entries()).sort(([aKey, aValue], [bKey, bValue]) => {
      if (aKey === bKey) return aValue.localeCompare(bValue);
      return aKey.localeCompare(bKey);
    });
    return new URLSearchParams(sorted).toString();
  };

  const parsedFromUrl = useMemo(() => {
    const params = new URLSearchParams(catalogQueryString);
    const parsedFilters = { ...EMPTY_PRODUCT_FILTERS } as ProductFilters;
    for (const key of PRODUCT_FILTER_KEYS) {
      parsedFilters[key] = params
        .getAll(key)
        .map((value) => value.trim())
        .filter(Boolean);
    }

    const sortRaw = params.get("sort") ?? DEFAULT_PRODUCT_SORT;
    const parsedSort = (PRODUCT_SORT_OPTIONS as readonly string[]).includes(sortRaw)
      ? (sortRaw as ProductSort)
      : DEFAULT_PRODUCT_SORT;

    const minRaw = Number.parseInt(params.get("minPrice") ?? String(minPrice), 10);
    const maxRaw = Number.parseInt(params.get("maxPrice") ?? String(maxPrice), 10);
    const safeMin = Number.isFinite(minRaw) ? minRaw : minPrice;
    const safeMax = Number.isFinite(maxRaw) ? maxRaw : maxPrice;
    const clampedMin = Math.max(minPrice, Math.min(safeMin, maxPrice));
    const clampedMax = Math.max(minPrice, Math.min(safeMax, maxPrice));

    return {
      filters: parsedFilters,
      sortBy: parsedSort,
      searchQuery: (params.get("q") ?? "").trim(),
      priceRange: {
        min: Math.min(clampedMin, clampedMax),
        max: Math.max(clampedMin, clampedMax),
      } as PriceRange,
    };
  }, [catalogQueryString, maxPrice, minPrice]);

  const filters = parsedFromUrl.filters;
  const sortBy = parsedFromUrl.sortBy;
  const searchQuery = parsedFromUrl.searchQuery;
  const priceRange = parsedFromUrl.priceRange;
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(initialSelectedProduct);
  const catalogUrlRef = useRef<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const currentUrl = new URL(window.location.href);
    const currentParams = new URLSearchParams(currentUrl.search);

    const toPathWithQuery = (params: URLSearchParams) => {
      const query = params.toString();
      return query ? `${currentUrl.pathname}?${query}` : currentUrl.pathname;
    };

    const currentPathWithQuery = `${currentUrl.pathname}${currentUrl.search}`;
    const catalogParams = new URLSearchParams(currentParams.toString());
    catalogParams.delete("preview");
    const catalogPathWithQuery = toPathWithQuery(catalogParams);

    if (!selectedProduct) {
      if (!catalogUrlRef.current) {
        if (currentParams.has("preview")) {
          window.history.replaceState(null, "", catalogPathWithQuery);
        }
        return;
      }

      if (currentPathWithQuery !== catalogUrlRef.current) {
        window.history.replaceState(null, "", catalogUrlRef.current);
      }
      catalogUrlRef.current = "";
      return;
    }

    const detailPath = buildProductDetailPath(selectedProduct);
    if (!detailPath) return;

    if (!catalogUrlRef.current) {
      catalogUrlRef.current = catalogPathWithQuery;
    }

    const previewParams = new URLSearchParams(catalogParams.toString());
    previewParams.set("preview", detailPath);
    const previewUrl = toPathWithQuery(previewParams);

    if (currentPathWithQuery === previewUrl) {
      return;
    }

    if (currentParams.has("preview")) {
      window.history.replaceState(null, "", previewUrl);
      return;
    }

    window.history.pushState(null, "", previewUrl);
  }, [selectedProduct]);

  useEffect(() => {
    if (!selectedProduct) return;

    const handlePopState = () => {
      setSelectedProduct(null);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [selectedProduct]);

  const handleFilterChange = (key: ProductFilterKey, value: string[]) => {
    const previousValues = filters[key];
    const { added, removed } = summarizeChangedFilterValues(previousValues, value);
    const action =
      value.length === 0 && previousValues.length > 0
        ? "clear"
        : added.length > 0 && removed.length === 0 && value.length > previousValues.length
          ? added.length > 1
            ? "select_all"
            : "add"
          : removed.length > 0 && added.length === 0
            ? "remove"
            : "replace";

    const nextFilters = { ...filters, [key]: value };

    trackEvent("filter_change", {
      element_section: getCatalogSection(pathname),
      catalog_category: getCatalogCategory(pathname, forcedFilters),
      filter_key: key,
      filter_action: action,
      changed_values_added: added.join(" | "),
      changed_values_removed: removed.join(" | "),
      filter_value_count: value.length,
      filter_values: value.join(" | "),
      active_filter_count_after: countActiveFilters(nextFilters, priceRange, { min: minPrice, max: maxPrice }),
    });
    replaceCatalogParams((params) => {
      params.delete(key);
      for (const nextValue of value) {
        params.append(key, nextValue);
      }
    });
  };

  const handlePriceRangeChange = (value: PriceRange) => {
    const previousPriceRange = priceRange;
    const changedMin = value.min !== previousPriceRange.min;
    const changedMax = value.max !== previousPriceRange.max;
    const action =
      value.min === minPrice && value.max === maxPrice && hasActivePriceRange(previousPriceRange, { min: minPrice, max: maxPrice })
        ? "reset"
        : changedMin && changedMax
          ? "update_both"
          : changedMin
            ? "update_min"
            : changedMax
              ? "update_max"
              : "no_change";

    if (action !== "no_change") {
      trackEvent("price_filter_change", {
        element_section: getCatalogSection(pathname),
        catalog_category: getCatalogCategory(pathname, forcedFilters),
        filter_key: "price",
        filter_action: action,
        previous_min_price: previousPriceRange.min,
        previous_max_price: previousPriceRange.max,
        selected_min_price: value.min,
        selected_max_price: value.max,
        active_filter_count_after: countActiveFilters(filters, value, { min: minPrice, max: maxPrice }),
      });
    }

    replaceCatalogParams((params) => {
      if (hasActivePriceRange(value, { min: minPrice, max: maxPrice })) {
        params.set("minPrice", String(value.min));
        params.set("maxPrice", String(value.max));
        return;
      }

      params.delete("minPrice");
      params.delete("maxPrice");
    });
  };

  const handleSortChange = (value: ProductSort) => {
    trackEvent("sort_change", {
      element_section: getCatalogSection(pathname),
      catalog_category: getCatalogCategory(pathname, forcedFilters),
      sort_value: value,
    });
    replaceCatalogParams((params) => {
      if (value === DEFAULT_PRODUCT_SORT) {
        params.delete("sort");
        return;
      }

      params.set("sort", value);
    });
  };

  const handleResetFilters = () => {
    trackEvent("filters_reset", {
      element_section: getCatalogSection(pathname),
      catalog_category: getCatalogCategory(pathname, forcedFilters),
      active_filter_count_before: countActiveFilters(filters, priceRange, { min: minPrice, max: maxPrice }),
    });
    replaceCatalogParams((params) => {
      for (const key of PRODUCT_FILTER_KEYS) {
        params.delete(key);
      }

      params.delete("sort");
      params.delete("minPrice");
      params.delete("maxPrice");
    });
  };

  const handleClosePreview = () => {
    if (typeof window !== "undefined") {
      const currentUrl = new URL(window.location.href);
      const nextParams = new URLSearchParams(currentUrl.search);
      nextParams.delete("preview");
      const nextQuery = nextParams.toString();
      const nextPathWithQuery = nextQuery ? `${currentUrl.pathname}?${nextQuery}` : currentUrl.pathname;

      // Keep the latest live filter/query state and only remove preview.
      catalogUrlRef.current = nextPathWithQuery;
    }

    setSelectedProduct(null);
  };

  // Keep object identity stable for memo-sensitive children.
  const stableFilters = filters;

  return (
    <>
      <FilterBar
        filters={stableFilters}
        priceRange={priceRange}
        priceBounds={{ min: minPrice, max: maxPrice }}
        sortBy={sortBy}
        hiddenFilterKeys={hiddenFilterKeys}
        onFilterChange={handleFilterChange}
        onPriceRangeChange={handlePriceRangeChange}
        onSortChange={handleSortChange}
        onResetFilters={handleResetFilters}
      />
      <div className={`catalog-split${selectedProduct ? " with-preview" : ""}`}>
        <div className="catalog-split-main">
          <InfiniteProductGrid
            initialItems={initialItems}
            initialNextCursor={initialNextCursor}
            pageSize={pageSize}
            filters={stableFilters}
            searchQuery={searchQuery}
            priceRange={priceRange}
            priceBounds={{ min: minPrice, max: maxPrice }}
            sortBy={sortBy}
            onResetFilters={handleResetFilters}
            onProductSelect={setSelectedProduct}
            selectedProductId={selectedProduct?.id ?? null}
            forcedFilters={forcedFilters}
          />
        </div>

        {selectedProduct && (
          <ProductPreviewPanel
            key={selectedProduct.id}
            product={selectedProduct}
            onProductSelect={setSelectedProduct}
            onClose={handleClosePreview}
          />
        )}
      </div>
    </>
  );
}
