"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SearchX } from "lucide-react";
import ProductCard from "@/components/cards/ProductCard";
import SkeletonCard from "@/components/cards/SkeletonCard";
import type { Product } from "@/types/product";
import {
  DEFAULT_PRODUCT_SORT,
  hasActivePriceRange,
  hasActiveFilters,
  PRODUCT_FILTER_KEYS,
  type PriceRange,
  type ProductSort,
  type ProductFilters,
} from "@/types/filters";

interface ProductsResponse {
  items: Product[];
  nextCursor: number | null;
  total: number;
}

interface Props {
  initialItems: Product[];
  initialNextCursor: number | null;
  pageSize?: number;
  filters: ProductFilters;
  priceRange: PriceRange;
  priceBounds: PriceRange;
  sortBy: ProductSort;
  onResetFilters: () => void;
  onProductSelect?: (product: Product) => void;
  selectedProductId?: string | null;
  forcedFilters?: Partial<ProductFilters>;
}

export default function InfiniteProductGrid({
  initialItems,
  initialNextCursor,
  pageSize = 48,
  filters,
  priceRange,
  priceBounds,
  sortBy,
  onResetFilters,
  onProductSelect,
  selectedProductId,
  forcedFilters = {},
}: Props) {
  const MIN_FILTER_LOADER_MS = 550;

  const [items, setItems] = useState<Product[]>(initialItems);
  const [nextCursor, setNextCursor] = useState<number | null>(initialNextCursor);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadMoreError, setHasLoadMoreError] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [hasBootstrapError, setHasBootstrapError] = useState(false);
  const [showFilterLoader, setShowFilterLoader] = useState(false);
  const [debouncedPriceRange, setDebouncedPriceRange] = useState(priceRange);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const filterLoaderStartedAtRef = useRef<number | null>(null);
  const filterLoaderHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPriceRange(priceRange);
    }, 300);

    return () => clearTimeout(timer);
  }, [priceRange]);

  const filtersActive = hasActiveFilters(filters) || hasActivePriceRange(priceRange, priceBounds);
  const sortActive = sortBy !== DEFAULT_PRODUCT_SORT;
  const shouldShowFilterLoader = isBootstrapping && (filtersActive || sortActive);
  const canLoadMore = nextCursor !== null && !isLoading && !isBootstrapping && !showFilterLoader;
  const serializedFilters = JSON.stringify({ filters, priceRange: debouncedPriceRange });

  const loadingSkeletonCount = useMemo(() => Math.min(12, pageSize), [pageSize]);

  const buildUrl = useCallback(
    (cursor: number) => {
      const params = new URLSearchParams({
        cursor: String(cursor),
        limit: String(pageSize),
      });

      for (const key of PRODUCT_FILTER_KEYS) {
        const values = [...(forcedFilters[key] ?? []), ...filters[key]];
        for (const value of values) {
          params.append(key, value);
        }
      }

      params.set("minPrice", String(debouncedPriceRange.min));
      params.set("maxPrice", String(debouncedPriceRange.max));

      if (sortBy !== DEFAULT_PRODUCT_SORT) {
        params.set("sort", sortBy);
      }

      return `/api/products?${params.toString()}`;
    },
    [debouncedPriceRange.max, debouncedPriceRange.min, filters, forcedFilters, pageSize, sortBy]
  );

  const loadMore = useCallback(async () => {
    if (!canLoadMore || nextCursor === null) return;

    setIsLoading(true);
    setHasLoadMoreError(false);

    try {
      const response = await fetch(buildUrl(nextCursor));
      if (!response.ok) throw new Error("Failed to load products");

      const payload = (await response.json()) as ProductsResponse;
      setItems((prev) => [...prev, ...payload.items]);
      setNextCursor(payload.nextCursor);
    } catch {
      setHasLoadMoreError(true);
    } finally {
      setIsLoading(false);
    }
  }, [buildUrl, canLoadMore, nextCursor]);

  const fetchFirstPageForFilters = useCallback(async () => {
    if (!filtersActive && !sortActive) {
      setItems(initialItems);
      setNextCursor(initialNextCursor);
      setHasLoadMoreError(false);
      setHasBootstrapError(false);
      setIsBootstrapping(false);
      return;
    }

    setIsBootstrapping(true);
    setHasBootstrapError(false);
    setHasLoadMoreError(false);

    try {
      const response = await fetch(buildUrl(0));
      if (!response.ok) throw new Error("Failed to load filtered products");

      const payload = (await response.json()) as ProductsResponse;
      setItems(payload.items);
      setNextCursor(payload.nextCursor);
    } catch {
      setHasBootstrapError(true);
      setItems([]);
      setNextCursor(null);
    } finally {
      setIsBootstrapping(false);
    }
  }, [buildUrl, filtersActive, initialItems, initialNextCursor, sortActive]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchFirstPageForFilters();
  }, [fetchFirstPageForFilters, serializedFilters]);

  useEffect(() => {
    const target = sentinelRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting) {
          void loadMore();
        }
      },
      {
        root: null,
        rootMargin: "600px 0px",
        threshold: 0,
      }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [loadMore]);

  useEffect(() => {
    if (shouldShowFilterLoader) {
      if (filterLoaderHideTimerRef.current) {
        clearTimeout(filterLoaderHideTimerRef.current);
        filterLoaderHideTimerRef.current = null;
      }

      if (!showFilterLoader) {
        filterLoaderStartedAtRef.current = Date.now();
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setShowFilterLoader(true);
      }

      return;
    }

    if (!showFilterLoader) return;

    const startedAt = filterLoaderStartedAtRef.current;
    const elapsed = startedAt ? Date.now() - startedAt : MIN_FILTER_LOADER_MS;
    const remaining = Math.max(0, MIN_FILTER_LOADER_MS - elapsed);

    filterLoaderHideTimerRef.current = setTimeout(() => {
      setShowFilterLoader(false);
      filterLoaderStartedAtRef.current = null;
      filterLoaderHideTimerRef.current = null;
    }, remaining);

    return () => {
      if (filterLoaderHideTimerRef.current) {
        clearTimeout(filterLoaderHideTimerRef.current);
        filterLoaderHideTimerRef.current = null;
      }
    };
  }, [MIN_FILTER_LOADER_MS, shouldShowFilterLoader, showFilterLoader]);

  useEffect(() => {
    return () => {
      if (filterLoaderHideTimerRef.current) {
        clearTimeout(filterLoaderHideTimerRef.current);
      }
    };
  }, []);

  return (
    <>
      <div className="content-grid">
        {showFilterLoader
          ? (
            <div className="content-grid-loading" role="status" aria-live="polite">
              <div className="brand-loader-mark" aria-hidden="true" />
              <p className="brand-loader-title">PickYourPiece</p>
              <p className="brand-loader-text">Applying filters and loading matching products...</p>
            </div>
          )
          : isBootstrapping
          ? Array.from({ length: 24 }).map((_, i) => <SkeletonCard key={`boot-${i}`} />)
          : hasBootstrapError
          ? (
            <div className="content-grid-empty">
              <h3 className="empty-state-title">Could not load products</h3>
              <p className="empty-state-text">Please try again. We will fetch the latest matching items.</p>
              <button type="button" className="empty-state-action" onClick={() => void fetchFirstPageForFilters()}>
                Retry
              </button>
            </div>
          )
          : items.length === 0
          ? (
            <div className="content-grid-empty">
              <div className="empty-state-icon" aria-hidden="true">
                <SearchX size={22} />
              </div>
              <h3 className="empty-state-title">
                {filtersActive
                  ? "Sorry, no products match your current criteria"
                  : "Sorry, no products are available right now"}
              </h3>
              <p className="empty-state-text">
                {filtersActive
                  ? "Try editing your filters for broader results."
                  : "Please check back in a bit while we refresh the catalog."}
              </p>
              {filtersActive && (
                <button type="button" className="empty-state-action" onClick={onResetFilters}>
                  Clear all filters
                </button>
              )}
            </div>
          )
          : items.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              imageLoading={index < 4 ? "eager" : "lazy"}
              onSelect={onProductSelect}
              isSelected={selectedProductId === product.id}
            />
          ))}

        {isLoading && !showFilterLoader && Array.from({ length: loadingSkeletonCount }).map((_, i) => <SkeletonCard key={`loading-${i}`} />)}
      </div>

      <div ref={sentinelRef} className="infinite-sentinel" aria-hidden="true" />

      {isBootstrapping && !showFilterLoader && <p className="infinite-status">Fetching products...</p>}
      {isLoading && !showFilterLoader && <p className="infinite-status">Loading more products...</p>}
      {hasLoadMoreError && !showFilterLoader && (
        <p className="infinite-status">
          Could not load more products.
          <button type="button" className="infinite-retry" onClick={() => void loadMore()}>
            Retry
          </button>
        </p>
      )}
    </>
  );
}
