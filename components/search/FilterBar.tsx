"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import type { PriceRange, ProductFilterKey, ProductFilters } from "@/types/filters";
import { hasActivePriceRange, PRODUCT_FILTER_KEYS, EMPTY_PRODUCT_FILTERS } from "@/types/filters";
import type { ProductSort } from "@/types/filters";

// ── Compact price label (Indian K/L notation) ──────────────────────────────────
function formatPriceCompact(value: number): string {
  if (value >= 100_000) {
    const l = value / 100_000;
    return `₹${Number.isInteger(l) ? l : l.toFixed(1)}L`;
  }
  if (value >= 1_000) {
    const k = value / 1_000;
    return `₹${Number.isInteger(k) ? k : k.toFixed(1)}K`;
  }
  return `₹${value}`;
}

// ── Log-scale helpers ──────────────────────────────────────────────────────────
// Logarithmic scale so equal slider movement = equal % price change.
// Without this, ₹800–₹1L (where most jewellery lives) is squished into
// the leftmost 7% of a ₹800–₹14L slider.
function priceToLogPct(price: number, min: number, max: number): number {
  const logMin = Math.log(Math.max(1, min));
  const logMax = Math.log(Math.max(1, max));
  return ((Math.log(Math.max(1, price)) - logMin) / (logMax - logMin)) * 100;
}
function logPctToPrice(pct: number, min: number, max: number): number {
  const logMin = Math.log(Math.max(1, min));
  const logMax = Math.log(Math.max(1, max));
  return Math.exp(logMin + (pct / 100) * (logMax - logMin));
}
function snapPrice(value: number, min: number, max: number): number {
  const magnitude = Math.pow(10, Math.floor(Math.log10(Math.max(1, value))) - 1);
  const step = Math.max(100, magnitude * 5);
  return Math.max(min, Math.min(max, Math.round(value / step) * step));
}

// ── Custom dual-range slider ───────────────────────────────────────────────────
function PriceRangeSlider({
  priceRange,
  priceBounds,
  onMinChange,
  onMaxChange,
}: {
  priceRange: PriceRange;
  priceBounds: PriceRange;
  step?: number;
  onMinChange: (v: number) => void;
  onMaxChange: (v: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const minPct = priceToLogPct(priceRange.min, priceBounds.min, priceBounds.max);
  const maxPct = priceToLogPct(priceRange.max, priceBounds.min, priceBounds.max);

  const getValueFromClientX = useCallback((clientX: number) => {
    if (!trackRef.current) return priceBounds.min;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    return snapPrice(logPctToPrice(pct, priceBounds.min, priceBounds.max), priceBounds.min, priceBounds.max);
  }, [priceBounds.min, priceBounds.max]);

  // Keyboard: ~4% of log range per press = proportional feel at any price level
  const keyStep = useCallback((current: number, dir: 1 | -1) => {
    const logMin = Math.log(Math.max(1, priceBounds.min));
    const logMax = Math.log(Math.max(1, priceBounds.max));
    const newLog = Math.log(Math.max(1, current)) + dir * (logMax - logMin) * 0.04;
    return snapPrice(Math.exp(Math.max(logMin, Math.min(logMax, newLog))), priceBounds.min, priceBounds.max);
  }, [priceBounds.min, priceBounds.max]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  }, []);

  const handleMinPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    onMinChange(Math.min(getValueFromClientX(e.clientX), priceRange.max));
  }, [getValueFromClientX, onMinChange, priceRange.max]);

  const handleMaxPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    onMaxChange(Math.max(getValueFromClientX(e.clientX), priceRange.min));
  }, [getValueFromClientX, onMaxChange, priceRange.min]);

  const handleMinKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft")  { e.preventDefault(); onMinChange(Math.max(priceBounds.min, keyStep(priceRange.min, -1))); }
    if (e.key === "ArrowRight") { e.preventDefault(); onMinChange(Math.min(priceRange.max, keyStep(priceRange.min, 1))); }
  }, [onMinChange, priceBounds.min, priceRange.min, priceRange.max, keyStep]);

  const handleMaxKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft")  { e.preventDefault(); onMaxChange(Math.max(priceRange.min, keyStep(priceRange.max, -1))); }
    if (e.key === "ArrowRight") { e.preventDefault(); onMaxChange(Math.min(priceBounds.max, keyStep(priceRange.max, 1))); }
  }, [onMaxChange, priceBounds.max, priceRange.min, priceRange.max, keyStep]);

  const handleTrackPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).classList.contains("filter-price-thumb")) return;
    const v = getValueFromClientX(e.clientX);
    const vPct = priceToLogPct(v, priceBounds.min, priceBounds.max);
    if (Math.abs(vPct - minPct) <= Math.abs(vPct - maxPct)) {
      onMinChange(Math.min(v, priceRange.max));
    } else {
      onMaxChange(Math.max(v, priceRange.min));
    }
  }, [getValueFromClientX, onMinChange, onMaxChange, priceRange.min, priceRange.max, priceBounds.min, priceBounds.max, minPct, maxPct]);

  return (
    <div className="filter-price-range-slider" ref={trackRef} onPointerDown={handleTrackPointerDown}>
      <div className="filter-price-range-track" />
      <div
        className="filter-price-range-track active"
        style={{ left: `${minPct}%`, width: `${Math.max(0, maxPct - minPct)}%` }}
      />
      <div
        className="filter-price-thumb"
        style={{ left: `${minPct}%` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handleMinPointerMove}
        onKeyDown={handleMinKeyDown}
        role="slider"
        aria-label="Minimum price"
        aria-valuemin={priceBounds.min}
        aria-valuemax={priceRange.max}
        aria-valuenow={priceRange.min}
        tabIndex={0}
      />
      <div
        className="filter-price-thumb"
        style={{ left: `${maxPct}%` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handleMaxPointerMove}
        onKeyDown={handleMaxKeyDown}
        role="slider"
        aria-label="Maximum price"
        aria-valuemin={priceRange.min}
        aria-valuemax={priceBounds.max}
        aria-valuenow={priceRange.max}
        tabIndex={0}
      />
    </div>
  );
}

const FILTERS = [
  {
    key: "brand",
    label: "Brand",
    options: ["BlueStone", "Candere", "Caratlane", "GIVA", "Mia by Tanishq", "ORRA", "Palmonas", "Tanishq"],
  },
  {
    key: "metal",
    label: "Metal",
    options: ["Gold", "Platinum", "Silver", "Steel"],
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
  const [activeFilterTab, setActiveFilterTab] = useState<ProductFilterKey | "price">("brand");
  // Draft state — only committed when "Done" is pressed
  const [draftFilters, setDraftFilters] = useState<ProductFilters>(filters);
  const [draftPriceRange, setDraftPriceRange] = useState<PriceRange>(priceRange);
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

  // Reset to first visible tab whenever the sheet opens — handled in the click handler below

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

  // sliderMetrics kept for potential future use but PriceRangeSlider now uses dynamic snapping
  // const sliderMetrics = ...

  // sliderStep kept for potential future use but PriceRangeSlider now uses dynamic snapping
  // const sliderStep = ...

  const closeMobileSheets = () => {
    setIsMobileFiltersOpen(false);
    setIsMobileSortOpen(false);
  };

  // Commit draft and close
  const applyFiltersAndClose = () => {
    for (const key of PRODUCT_FILTER_KEYS) {
      if (JSON.stringify(draftFilters[key]) !== JSON.stringify(filters[key])) {
        onFilterChange(key, draftFilters[key]);
      }
    }
    if (draftPriceRange.min !== priceRange.min || draftPriceRange.max !== priceRange.max) {
      onPriceRangeChange(draftPriceRange);
    }
    setIsMobileFiltersOpen(false);
  };

  // Reset draft to empty and immediately apply
  const resetDraftAndApply = () => {
    const emptyFilters = { ...EMPTY_PRODUCT_FILTERS };
    const emptyPrice = { min: priceBounds.min, max: priceBounds.max };
    setDraftFilters(emptyFilters);
    setDraftPriceRange(emptyPrice);
    onResetFilters();
  };

  const draftPriceActive = hasActivePriceRange(draftPriceRange, priceBounds);
  const draftToggleValue = (key: ProductFilterKey, value: string) => {
    const current = draftFilters[key];
    setDraftFilters(prev => ({
      ...prev,
      [key]: current.includes(value) ? current.filter(v => v !== value) : [...current, value],
    }));
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
                {formatPriceCompact(priceRange.min)}
              </span>
              <PriceRangeSlider
                priceRange={priceRange}
                priceBounds={priceBounds}
                onMinChange={handleMinChange}
                onMaxChange={handleMaxChange}
              />
              <span className="filter-price-bound-label">
                {formatPriceCompact(priceRange.max)}
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
            const first = FILTERS.find(f => !hiddenFilterKeys.includes(f.key));
            setActiveFilterTab(first ? (first.key as ProductFilterKey) : "price");
            setDraftFilters({ ...filters });
            setDraftPriceRange({ ...priceRange });
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
        <section
          className="mobile-sheet"
          role="dialog"
          aria-modal="true"
          aria-label="Filters"
          ref={(el) => {
            if (!el) return;
            // Swipe-down-to-close — standard mobile bottom sheet pattern
            const handle = el.querySelector<HTMLElement>(".mobile-sheet-handle");
            if (!handle) return;
            let startY = 0;
            let delta = 0;
            const onDown = (e: PointerEvent) => {
              handle.setPointerCapture(e.pointerId);
              startY = e.clientY;
              delta = 0;
              el.style.transition = "none";
            };
            const onMove = (e: PointerEvent) => {
              if (!handle.hasPointerCapture(e.pointerId)) return;
              delta = Math.max(0, e.clientY - startY);
              el.style.transform = `translateY(${delta}px)`;
            };
            const onUp = () => {
              el.style.transition = "";
              if (delta > 80) {
                el.style.transform = "translateY(110%)";
                // swipe-down = discard draft
                setTimeout(() => setIsMobileFiltersOpen(false), 200);
              } else {
                el.style.transform = "";
              }
              delta = 0;
            };
            handle.addEventListener("pointerdown", onDown);
            handle.addEventListener("pointermove", onMove);
            handle.addEventListener("pointerup", onUp);
          }}
        >
          <div className="mobile-sheet-handle" aria-hidden="true" />
          <div className="mobile-sheet-header">
            <h3>Filters</h3>
            <button type="button" className="mobile-sheet-close" onClick={applyFiltersAndClose}>
              Done
            </button>
          </div>

          <div className="mobile-filter-two-panel">
            {/* Left: filter category tabs */}
            <nav className="mobile-filter-tabs" aria-label="Filter categories">
              {FILTERS.map((filter) => {
                if (hiddenFilterKeys.includes(filter.key)) return null;
                const count = draftFilters[filter.key].length;
                const isActive = activeFilterTab === filter.key;
                return (
                  <button
                    key={filter.key}
                    type="button"
                    className={`mobile-filter-tab${isActive ? " is-active" : ""}${count > 0 ? " has-selection" : ""}`}
                    onClick={() => setActiveFilterTab(filter.key as ProductFilterKey)}
                  >
                    <span className="mobile-filter-tab-label">{filter.label}</span>
                    {count > 0 && <span className="mobile-filter-tab-count">{count}</span>}
                  </button>
                );
              })}
              <button
                type="button"
                className={`mobile-filter-tab${activeFilterTab === "price" ? " is-active" : ""}${draftPriceActive ? " has-selection" : ""}`}
                onClick={() => setActiveFilterTab("price")}
              >
                <span className="mobile-filter-tab-label">Price</span>
                {draftPriceActive && <span className="mobile-filter-tab-dot" aria-hidden="true" />}
              </button>
            </nav>

            {/* Right: options panel */}
            <div className="mobile-filter-panel">
              {activeFilterTab === "price" ? (
                <div className="mobile-price-box">
                  <PriceRangeSlider
                    priceRange={draftPriceRange}
                    priceBounds={priceBounds}
                    onMinChange={(v) => setDraftPriceRange(prev => ({ ...prev, min: Math.min(v, prev.max) }))}
                    onMaxChange={(v) => setDraftPriceRange(prev => ({ ...prev, max: Math.max(v, prev.min) }))}
                  />
                  <div className="mobile-price-values">
                    <span>{formatPriceCompact(draftPriceRange.min)}</span>
                    <span>{formatPriceCompact(draftPriceRange.max)}</span>
                  </div>
                </div>
              ) : (() => {
                const filter = FILTERS.find(f => f.key === activeFilterTab);
                if (!filter) return null;
                return (
                  <>
                    <div className="mobile-filter-panel-actions">
                      <button type="button" onClick={() => setDraftFilters(prev => ({ ...prev, [filter.key]: [...filter.options] }))}>Select all</button>
                      <button type="button" onClick={() => setDraftFilters(prev => ({ ...prev, [filter.key]: [] }))}>Clear</button>
                    </div>
                    <div className="mobile-filter-options">
                      {filter.options.map((option) => {
                        const checked = draftFilters[filter.key].includes(option);
                        return (
                          <label key={option} className="mobile-filter-option">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => draftToggleValue(filter.key, option)}
                            />
                            <span>{option}</span>
                          </label>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {(draftFilters !== filters || draftPriceActive || priceActive) && (
            <div className="mobile-filter-reset-bar">
              <button type="button" className="mobile-sheet-reset" onClick={resetDraftAndApply}>
                Reset all filters
              </button>
            </div>
          )}
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

