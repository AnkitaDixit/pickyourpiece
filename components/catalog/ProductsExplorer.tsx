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
  const CATALOG_MODE_PARAM = "mode";
  const CATALOG_MODE_VALUE = "catalog";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const toCanonicalQuery = (params: URLSearchParams): string => {
    const sorted = Array.from(params.entries()).sort(([aKey, aValue], [bKey, bValue]) => {
      if (aKey === bKey) return aValue.localeCompare(bValue);
      return aKey.localeCompare(bKey);
    });
    return new URLSearchParams(sorted).toString();
  };

  const parsedFromUrl = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
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
  }, [maxPrice, minPrice, searchParams]);

  const [filters, setFilters] = useState<ProductFilters>(parsedFromUrl.filters);
  const [sortBy, setSortBy] = useState<ProductSort>(parsedFromUrl.sortBy);
  const [searchQuery, setSearchQuery] = useState(parsedFromUrl.searchQuery);
  const [priceRange, setPriceRange] = useState<PriceRange>(parsedFromUrl.priceRange);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(initialSelectedProduct);
  const isApplyingUrlStateRef = useRef(false);
  const catalogUrlRef = useRef<string>("");

  const urlSignature = useMemo(() => JSON.stringify(parsedFromUrl), [parsedFromUrl]);

  useEffect(() => {
    isApplyingUrlStateRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFilters(parsedFromUrl.filters);
    setSortBy(parsedFromUrl.sortBy);
    setSearchQuery(parsedFromUrl.searchQuery);
    setPriceRange(parsedFromUrl.priceRange);
  // Intentionally keyed by signature so unrelated query params (e.g. preview)
  // do not rehydrate filter state and trigger visual loading churn.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSignature]);

  useEffect(() => {
    if (!initialSelectedProduct) return;

    setSelectedProduct((prev) => {
      if (prev?.id === initialSelectedProduct.id) return prev;
      return prev ?? initialSelectedProduct;
    });
  }, [initialSelectedProduct]);

  useEffect(() => {
    if (isApplyingUrlStateRef.current) {
      isApplyingUrlStateRef.current = false;
      return;
    }

    const params = new URLSearchParams();

    for (const key of PRODUCT_FILTER_KEYS) {
      for (const value of filters[key]) {
        params.append(key, value);
      }
    }

    if (sortBy !== DEFAULT_PRODUCT_SORT) {
      params.set("sort", sortBy);
    }

    if (searchQuery) {
      params.set("q", searchQuery);
    }

    if (hasActivePriceRange(priceRange, { min: minPrice, max: maxPrice })) {
      params.set("minPrice", String(priceRange.min));
      params.set("maxPrice", String(priceRange.max));
    }

    const currentParams = new URLSearchParams(searchParams.toString());
    const previewValue = currentParams.get("preview");
    currentParams.delete("preview");
    currentParams.delete(CATALOG_MODE_PARAM);

    if (pathname === "/" && params.toString().length === 0) {
      params.set(CATALOG_MODE_PARAM, CATALOG_MODE_VALUE);
    }

    const current = toCanonicalQuery(currentParams);
    const nextForComparison = new URLSearchParams(params.toString());
    nextForComparison.delete(CATALOG_MODE_PARAM);
    const next = toCanonicalQuery(nextForComparison);
    if (current === next) return;

    if (previewValue) {
      params.set("preview", previewValue);
    }

    const fullNext = params.toString();
    router.replace(fullNext ? `${pathname}?${fullNext}` : pathname, { scroll: false });
  }, [filters, maxPrice, minPrice, pathname, priceRange, router, searchParams, searchQuery, sortBy]);

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
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters(EMPTY_PRODUCT_FILTERS);
    setSortBy(DEFAULT_PRODUCT_SORT);
    setPriceRange({ min: minPrice, max: maxPrice });
  };

  // Keep object identity stable for memo-sensitive children.
  const stableFilters = useMemo(() => filters, [filters]);

  return (
    <>
      <FilterBar
        filters={stableFilters}
        priceRange={priceRange}
        priceBounds={{ min: minPrice, max: maxPrice }}
        sortBy={sortBy}
        hiddenFilterKeys={hiddenFilterKeys}
        onFilterChange={handleFilterChange}
        onPriceRangeChange={setPriceRange}
        onSortChange={setSortBy}
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
            onClose={() => {
              setSelectedProduct(null);
            }}
          />
        )}
      </div>
    </>
  );
}
