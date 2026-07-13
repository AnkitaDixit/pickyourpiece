"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import type { PriceRange, ProductFilterKey, ProductFilters } from "@/types/filters";
import { hasActivePriceRange, PRODUCT_FILTER_KEYS } from "@/types/filters";
import type { ProductSort } from "@/types/filters";

const FILTERS = [
  {
    key: "brand",
    label: "Brand",
    options: ["BlueStone", "Candere", "Caratlane", "GIVA", "Mia by Tanishq", "ORRA", "Tanishq"],
  },
  {
    key: "metal",
    label: "Metal",
    options: ["Gold", "Platinum", "Silver"],
  },
  {
    key: "gemstone",
    label: "Gemstone",
    options: [
      "Amethyst",
      "Aquamarine",
      "Citrine",
      "Diamond",
      "Emerald",
      "Garnet",
      "Gemstone",
      "Gold",
      "Opal",
      "Pearl",
      "Platinum",
      "Ruby",
      "Sapphire",
      "Silver",
      "Solitaire",
      "Topaz",
    ],
  },
  {
    key: "purity",
    label: "Purity",
    options: [
      "9KT",
      "14KT",
      "18KT",
      "22KT",
      "Platinum950",
      "Platinum950, 14KT",
      "Platinum950, 18KT",
      "Silver925",
    ],
  },
  {
    key: "metalColor",
    label: "Color",
    options: ["Gold", "Platinum", "Rose Gold", "Silver", "Three Tone", "Two Tone", "White"],
  },
  {
    key: "style",
    label: "Style",
    options: [
      "Band",
      "Butterfly",
      "Chevron",
      "Cluster",
      "Cocktail",
      "Eternity",
      "Everyday",
      "Floral",
      "Halo",
      "Heart",
      "Infinity",
      "Minimal",
      "Solitaire",
      "Stackable",
      "Statement",
      "Vanki",
      "Vintage",
    ],
  },
  {
    key: "occasion",
    label: "Occasion",
    options: ["Engagement", "Everyday", "Gifting"],
  },
  {
    key: "gender",
    label: "Gender",
    options: ["Men", "Women"],
  },
  {
    key: "diamondQuality",
    label: "Diamond Quality",
    options: ["EF-VVS", "FG-SI", "GH-SI", "GH-VS", "GH-VS H&A", "GH-VVS H&A", "IJ-SI", "White-Syndicate"],
  },
] as const;

interface Props {
  filters: ProductFilters;
  priceRange: PriceRange;
  priceBounds: PriceRange;
  sortBy: ProductSort;
  hiddenFilterKeys?: ProductFilterKey[];
  onFilterChange: (key: ProductFilterKey, value: string[]) => void;
  onPriceRangeChange: (value: PriceRange) => void;
  onSortChange: (value: ProductSort) => void;
  onResetFilters: () => void;
}

export default function FilterBar({
  filters,
  priceRange,
  priceBounds,
  sortBy,
  hiddenFilterKeys = [],
  onFilterChange,
  onPriceRangeChange,
  onSortChange,
  onResetFilters,
}: Props) {
  const [openKey, setOpenKey] = useState<ProductFilterKey | null>(null);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [isMobileSortOpen, setIsMobileSortOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === "undefined") return;

    const syncFilterbarHeight = () => {
      const nextHeight = Math.max(55, Math.ceil(root.getBoundingClientRect().height));
      document.documentElement.style.setProperty("--filterbar-height", `${nextHeight}px`);
    };

    syncFilterbarHeight();

    const observer = new ResizeObserver(() => {
      syncFilterbarHeight();
    });

    observer.observe(root);
    window.addEventListener("resize", syncFilterbarHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncFilterbarHeight);
      document.documentElement.style.setProperty("--filterbar-height", "55px");
    };
  }, []);

  const sortLabel = sortBy === "price-desc" ? "Price: High to Low" : "Price: Low to High";

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const clickedInsideAnyDropdown = Boolean(target.closest(".filter-select-wrap"));
      if (!clickedInsideAnyDropdown) {
        setOpenKey(null);
        setIsSortOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  useEffect(() => {
    if (!isMobileFiltersOpen && !isMobileSortOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsMobileFiltersOpen(false);
      setIsMobileSortOpen(false);
      setOpenKey(null);
      setIsSortOpen(false);
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isMobileFiltersOpen, isMobileSortOpen]);

  const activeOptionFilterCount = PRODUCT_FILTER_KEYS.reduce(
    (count, key) => (hiddenFilterKeys.includes(key) ? count : (filters[key].length > 0 ? count + 1 : count)),
    0
  );
  const priceActive = hasActivePriceRange(priceRange, priceBounds);
  const activeFilterCount = activeOptionFilterCount + (priceActive ? 1 : 0);
  const hasActiveFilters = activeFilterCount > 0;

  const selectedCountMap = useMemo(() => {
    const map: Partial<Record<ProductFilterKey, number>> = {};
    for (const key of PRODUCT_FILTER_KEYS) {
      map[key] = filters[key].length;
    }
    return map;
  }, [filters]);

  const toggleValue = (key: ProductFilterKey, value: string) => {
    const current = filters[key];
    if (current.includes(value)) {
      onFilterChange(
        key,
        current.filter((item) => item !== value)
      );
      return;
    }

    onFilterChange(key, [...current, value]);
  };

  const handleMinChange = (nextMin: number) => {
    onPriceRangeChange({
      min: Math.min(nextMin, priceRange.max),
      max: priceRange.max,
    });
  };

  const handleMaxChange = (nextMax: number) => {
    onPriceRangeChange({
      min: priceRange.min,
      max: Math.max(nextMax, priceRange.min),
    });
  };

  const sliderMetrics = useMemo(() => {
    const span = Math.max(1, priceBounds.max - priceBounds.min);
    const minPercent = ((priceRange.min - priceBounds.min) / span) * 100;
    const maxPercent = ((priceRange.max - priceBounds.min) / span) * 100;
    return {
      span,
      minPercent,
      maxPercent,
    };
  }, [priceBounds.max, priceBounds.min, priceRange.max, priceRange.min]);

  const sliderStep = useMemo(() => {
    if (sliderMetrics.span <= 1000) return 10;
    if (sliderMetrics.span <= 10000) return 50;
    if (sliderMetrics.span <= 100000) return 100;
    return 500;
  }, [sliderMetrics.span]);

  const closeMobileSheets = () => {
    setIsMobileFiltersOpen(false);
    setIsMobileSortOpen(false);
  };

  const mobileSortLabel = sortBy === "price-desc" ? "High to Low" : "Low to High";

  return (
    <>
      <div className="filterbar filterbar-desktop" ref={rootRef}>
        <div className="filterbar-left">
          <button type="button" className="filter-btn-primary" aria-label="Filters">
            <SlidersHorizontal size={15} />
            Filters
            {hasActiveFilters && <span className="filter-active-count">{activeFilterCount}</span>}
          </button>

          {FILTERS.map((filter) => (
            hiddenFilterKeys.includes(filter.key)
              ? null
              : (
            <div
              key={filter.key}
              className={`filter-select-wrap${filters[filter.key].length > 0 ? " active" : ""}`}
            >
              <button
                type="button"
                className="filter-dropdown-trigger"
                onClick={() => {
                  setIsSortOpen(false);
                  setOpenKey((prev) => (prev === filter.key ? null : filter.key));
                }}
              >
                <span className="filter-select-label">{filter.label}</span>
                <span className="filter-select-value">
                  {selectedCountMap[filter.key] ? `${selectedCountMap[filter.key]} selected` : "All"}
                </span>
              </button>

              {openKey === filter.key && (
                <div className="filter-dropdown-menu" role="menu" aria-label={filter.label}>
                  <div className="filter-dropdown-actions">
                    <button
                      type="button"
                      className="filter-dropdown-action"
                      onClick={() => onFilterChange(filter.key, [...filter.options])}
                    >
                      Select all
                    </button>
                    <button
                      type="button"
                      className="filter-dropdown-action"
                      onClick={() => onFilterChange(filter.key, [])}
                    >
                      Clear
                    </button>
                  </div>

                  <div className="filter-dropdown-options">
                    {filter.options.map((option) => {
                      const checked = filters[filter.key].includes(option);
                      return (
                        <label key={option} className="filter-checkbox-option">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleValue(filter.key, option)}
                          />
                          <span>{option}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
              )
          ))}

          <div className={`filter-select-wrap filter-price-range-wrap${priceActive ? " active" : ""}`}>
            <div className="filter-price-range-slider-row">
              <span className="filter-select-label filter-price-title">Price</span>
              <span className="filter-price-bound-label">
                {priceRange.min.toLocaleString("en-IN")}
              </span>
              <div className="filter-price-range-slider" role="group" aria-label="Price range">
                <div className="filter-price-range-track" />
                <div
                  className="filter-price-range-track active"
                  style={{
                    left: `${sliderMetrics.minPercent}%`,
                    width: `${Math.max(0, sliderMetrics.maxPercent - sliderMetrics.minPercent)}%`,
                  }}
                />
                <input
                  className="filter-price-range-input min"
                  type="range"
                  min={priceBounds.min}
                  max={priceBounds.max}
                  step={sliderStep}
                  value={priceRange.min}
                  onChange={(event) => handleMinChange(Number(event.target.value))}
                  aria-label="Minimum price"
                />
                <input
                  className="filter-price-range-input max"
                  type="range"
                  min={priceBounds.min}
                  max={priceBounds.max}
                  step={sliderStep}
                  value={priceRange.max}
                  onChange={(event) => handleMaxChange(Number(event.target.value))}
                  aria-label="Maximum price"
                />
              </div>
              <span className="filter-price-bound-label">
                {priceRange.max.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {hasActiveFilters && (
            <button type="button" className="filter-btn-reset" onClick={onResetFilters}>
              Reset filters
            </button>
          )}
        </div>

        <div className="filterbar-right">
          <div className={`filter-select-wrap filter-sort-wrap${isSortOpen ? " active" : ""}`}>
            <button
              type="button"
              className="filter-dropdown-trigger filter-sort-trigger"
              onClick={() => {
                setOpenKey(null);
                setIsSortOpen((prev) => !prev);
              }}
            >
              <span className="filter-select-label">Sort by: </span>
              <span className="filter-select-value">{sortLabel}</span>
            </button>

            {isSortOpen && (
              <div className="filter-dropdown-menu filter-sort-menu" role="menu" aria-label="Sort by">
                <button
                  type="button"
                  className={`filter-sort-option${sortBy === "price-asc" ? " active" : ""}`}
                  onClick={() => {
                    onSortChange("price-asc");
                    setIsSortOpen(false);
                  }}
                >
                  Price: Low to High
                </button>
                <button
                  type="button"
                  className={`filter-sort-option${sortBy === "price-desc" ? " active" : ""}`}
                  onClick={() => {
                    onSortChange("price-desc");
                    setIsSortOpen(false);
                  }}
                >
                  Price: High to Low
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mobile-filter-dock" role="toolbar" aria-label="Catalog controls">
        <button
          type="button"
          className="mobile-filter-dock-btn"
          onClick={() => {
            setOpenKey(null);
            setIsSortOpen(false);
            setIsMobileSortOpen(false);
            setIsMobileFiltersOpen(true);
          }}
        >
          <span className="mobile-filter-dock-label">Filters</span>
          {hasActiveFilters && <span className="filter-active-count">{activeFilterCount}</span>}
        </button>
        <button
          type="button"
          className="mobile-filter-dock-btn"
          onClick={() => {
            setOpenKey(null);
            setIsSortOpen(false);
            setIsMobileFiltersOpen(false);
            setIsMobileSortOpen(true);
          }}
        >
          <span className="mobile-filter-dock-label">Sort</span>
          <span className="mobile-filter-dock-value">{mobileSortLabel}</span>
        </button>
      </div>

      {(isMobileFiltersOpen || isMobileSortOpen) && (
        <button
          type="button"
          className="mobile-sheet-backdrop"
          aria-label="Close panel"
          onClick={closeMobileSheets}
        />
      )}

      {isMobileFiltersOpen && (
        <section className="mobile-sheet" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="mobile-sheet-handle" aria-hidden="true" />
          <div className="mobile-sheet-header">
            <h3>Filters</h3>
            <button type="button" className="mobile-sheet-close" onClick={() => setIsMobileFiltersOpen(false)}>
              Close
            </button>
          </div>
          <div className="mobile-sheet-body">
            {FILTERS.map((filter) => {
              if (hiddenFilterKeys.includes(filter.key)) return null;

              return (
                <div key={filter.key} className="mobile-filter-section">
                  <div className="mobile-filter-section-head">
                    <p>{filter.label}</p>
                    <div className="mobile-filter-section-actions">
                      <button type="button" onClick={() => onFilterChange(filter.key, [...filter.options])}>
                        All
                      </button>
                      <button type="button" onClick={() => onFilterChange(filter.key, [])}>
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="mobile-filter-options">
                    {filter.options.map((option) => {
                      const checked = filters[filter.key].includes(option);
                      return (
                        <label key={option} className="mobile-filter-option">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleValue(filter.key, option)}
                          />
                          <span>{option}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div className="mobile-filter-section">
              <div className="mobile-filter-section-head">
                <p>Price</p>
              </div>
              <div className="mobile-price-box">
                <div className="filter-price-range-slider" role="group" aria-label="Price range">
                  <div className="filter-price-range-track" />
                  <div
                    className="filter-price-range-track active"
                    style={{
                      left: `${sliderMetrics.minPercent}%`,
                      width: `${Math.max(0, sliderMetrics.maxPercent - sliderMetrics.minPercent)}%`,
                    }}
                  />
                  <input
                    className="filter-price-range-input min"
                    type="range"
                    min={priceBounds.min}
                    max={priceBounds.max}
                    step={sliderStep}
                    value={priceRange.min}
                    onChange={(event) => handleMinChange(Number(event.target.value))}
                    aria-label="Minimum price"
                  />
                  <input
                    className="filter-price-range-input max"
                    type="range"
                    min={priceBounds.min}
                    max={priceBounds.max}
                    step={sliderStep}
                    value={priceRange.max}
                    onChange={(event) => handleMaxChange(Number(event.target.value))}
                    aria-label="Maximum price"
                  />
                </div>
                <div className="mobile-price-values">
                  <span>{priceRange.min.toLocaleString("en-IN")}</span>
                  <span>{priceRange.max.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mobile-sheet-footer">
            {hasActiveFilters && (
              <button
                type="button"
                className="mobile-sheet-reset"
                onClick={() => {
                  onResetFilters();
                }}
              >
                Reset filters
              </button>
            )}
            <button type="button" className="mobile-sheet-apply" onClick={() => setIsMobileFiltersOpen(false)}>
              Done
            </button>
          </div>
        </section>
      )}

      {isMobileSortOpen && (
        <section className="mobile-sheet mobile-sort-sheet" role="dialog" aria-modal="true" aria-label="Sort options">
          <div className="mobile-sheet-handle" aria-hidden="true" />
          <div className="mobile-sheet-header">
            <h3>Sort</h3>
            <button type="button" className="mobile-sheet-close" onClick={() => setIsMobileSortOpen(false)}>
              Close
            </button>
          </div>
          <div className="mobile-sheet-body mobile-sort-options">
            <button
              type="button"
              className={`mobile-sort-option${sortBy === "price-asc" ? " active" : ""}`}
              onClick={() => {
                onSortChange("price-asc");
                setIsMobileSortOpen(false);
              }}
            >
              Price: Low to High
            </button>
            <button
              type="button"
              className={`mobile-sort-option${sortBy === "price-desc" ? " active" : ""}`}
              onClick={() => {
                onSortChange("price-desc");
                setIsMobileSortOpen(false);
              }}
            >
              Price: High to Low
            </button>
          </div>
        </section>
      )}
    </>
  );
}

