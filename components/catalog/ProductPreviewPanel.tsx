"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "@/types/product";
import { buildProductDetailPath, getBrandSegment } from "@/lib/product-seo";
import { buildTrackedBrandUrl } from "@/lib/outbound-tracking";

interface Props {
  product: Product;
  onClose: () => void;
  onProductSelect?: (product: Product) => void;
}

const BRAND_LOGOS: Record<string, string> = {
  bluestone: "/brands/bluestone-logo.png?v=20260709-2338",
  caratlane: "/brands/caratlane-logo.jpg?v=20260709-2338",
  tanishq: "https://images.assettype.com/nationalherald/2020-10/a42818da-499f-46fe-a8c2-e7d7a6ddc775/Tanishq.jpg",
  giva: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTdiZUsR4K1BJmDa422342XYCtccq7OfbR9RFdwOuWWAz8IN3bgLWRBLw-_&s=10",
  palmonas: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQP_TFMjp4QLM89RGzLpBaGMmS9q4eX04dfFkihs9oa1rI_dhfgDvvEDlmN&s=10",
  miabytanishq: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRZLWP4f6l2TWiPzB946zFtEE4PaG-MGgTRhsUAncCiQvkUZDkbpH8s_x0&s=10",
  mia: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRZLWP4f6l2TWiPzB946zFtEE4PaG-MGgTRhsUAncCiQvkUZDkbpH8s_x0&s=10",
  orra: "http://upload.wikimedia.org/wikipedia/commons/3/3e/ORRAJewellery.jpg",
  candere: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTk2cwP-ig0xZPxiyWdc_exZwE-jMrHO5374YMNS7iH5swqrOOYX289Qqc&s=10",
};

type DetailRecord = Record<string, unknown>;

const formatLabel = (value: string) => {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const normalizeToken = (value: string) => value.trim().toLowerCase();

const countSharedValues = (left: string[] = [], right: string[] = []) => {
  if (!left.length || !right.length) return 0;
  const rightSet = new Set(right.map(normalizeToken));
  return left.reduce((count, item) => (rightSet.has(normalizeToken(item)) ? count + 1 : count), 0);
};

export default function ProductPreviewPanel({ product, onClose, onProductSelect }: Props) {
  const [detail, setDetail] = useState<DetailRecord | null>(null);
  const [similarItems, setSimilarItems] = useState<Product[]>([]);
  const panelRef = useRef<HTMLElement>(null);
  const dragStartY = useRef(0);
  const dragDelta = useRef(0);
  const dragging = useRef(false);

  const onDragStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    dragDelta.current = 0;
    dragging.current = true;
    if (panelRef.current) panelRef.current.style.transition = "none";
  };

  const onDragMove = (e: React.TouchEvent) => {
    if (!dragging.current) return;
    const delta = Math.max(0, e.touches[0].clientY - dragStartY.current);
    dragDelta.current = delta;
    if (panelRef.current) panelRef.current.style.transform = `translateY(${delta}px)`;
  };

  const onDragEnd = () => {
    if (!dragging.current) return;
    dragging.current = false;
    const panel = panelRef.current;
    if (!panel) return;
    if (dragDelta.current > 80) {
      panel.style.transition = "transform 220ms ease";
      panel.style.transform = "translateY(110%)";
      setTimeout(onClose, 210);
    } else {
      panel.style.transition = "transform 300ms cubic-bezier(0.32, 0.72, 0, 1)";
      panel.style.transform = "";
    }
    dragDelta.current = 0;
  };

  useEffect(() => {
    const controller = new AbortController();

    const loadDetail = async () => {
      try {
        const params = new URLSearchParams({
          brand: product.brand,
          id: String(product.id),
        });

        const response = await fetch(`/api/product-detail?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          setDetail(null);
          return;
        }

        const payload = (await response.json()) as { item?: DetailRecord };
        setDetail(payload.item ?? null);
      } catch {
        if (!controller.signal.aborted) {
          setDetail(null);
        }
      }
    };

    void loadDetail();

    return () => controller.abort();
  }, [product]);

  const merged = (detail ?? product) as DetailRecord;
  const name = typeof merged.name === "string" ? merged.name : product.name;
  const brand = typeof merged.brand === "string" ? merged.brand : product.brand;
  const image = typeof merged.image === "string" ? merged.image : product.image;
  const price = typeof merged.price === "number" ? merged.price : product.price;
  const currency = typeof merged.currency === "string" ? merged.currency : product.currency;
  const productUrl = typeof merged.productUrl === "string" ? merged.productUrl : product.productUrl;
  const trackedProductUrl = buildTrackedBrandUrl(productUrl, {
    context: "preview_panel",
    brand,
    productId: String(product.id),
  });
  console.log("Tracked product URL:", trackedProductUrl);
  const availability = typeof merged.availability === "boolean" ? merged.availability : product.availability;
  const brandSegment = getBrandSegment(brand) ?? "";
  const detailPath = buildProductDetailPath(product);
  const logoSrc = BRAND_LOGOS[brandSegment.toLowerCase()] ?? null;
  const brandBrowseHref = `/ring/?brand=${encodeURIComponent(brand)}`;

  const detailRows = useMemo(() => {
    return Object.entries(merged)
      .filter(([key]) => !["allImages", "tags"].includes(key))
      .sort(([a], [b]) => a.localeCompare(b));
  }, [merged]);

  useEffect(() => {
    const controller = new AbortController();

    const loadSimilarItems = async () => {
      try {
        const currentPrice = typeof product.price === "number" ? product.price : 0;
        const minAllowedPrice = currentPrice > 0 ? Math.floor(currentPrice * 0.75) : 0;
        const maxAllowedPrice = currentPrice > 0 ? Math.ceil(currentPrice * 1.25) : 0;

        const params = new URLSearchParams({
          category: product.category,
          limit: "240",
          sort: "price-asc",
        });

        if (currentPrice > 0) {
          params.set("minPrice", String(minAllowedPrice));
          params.set("maxPrice", String(maxAllowedPrice));
        }

        const response = await fetch(`/api/products?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          setSimilarItems([]);
          return;
        }

        const payload = (await response.json()) as { items?: Product[] };
        const candidates = Array.isArray(payload.items) ? payload.items : [];
        const maxAllowedPriceForFilter = currentPrice > 0 ? currentPrice * 1.25 : Number.POSITIVE_INFINITY;
        const maxAllowedDelta = currentPrice > 0 ? currentPrice * 0.25 : 1;
        const currentGemstones = Array.isArray(product.gemstone) ? product.gemstone : [];
        const currentStyles = Array.isArray(product.style) ? product.style : [];
        const currentBrandSegment = getBrandSegment(product.brand) ?? normalizeToken(product.brand);
        const normalizedProductMetal = normalizeToken(product.metal ?? "");
        const normalizedProductColor = normalizeToken(product.metalColor ?? "");

        const ranked = candidates
          .filter((candidate) => {
            if (candidate.id === product.id) return false;

            const candidatePrice = typeof candidate.price === "number" ? candidate.price : 0;
            return candidatePrice >= minAllowedPrice && candidatePrice <= maxAllowedPriceForFilter;
          })
          .map((candidate) => {
            const sharedStyleCount = countSharedValues(candidate.style, currentStyles);
            const sharedGemstoneCount = countSharedValues(candidate.gemstone, currentGemstones);
            const metalMatch = Number(normalizeToken(candidate.metal ?? "") === normalizedProductMetal);
            const priceDelta = Math.abs((candidate.price ?? 0) - currentPrice);
            const priceCloseness = Math.max(0, 1 - priceDelta / maxAllowedDelta);
            const colorMatch = Number(normalizeToken(candidate.metalColor ?? "") === normalizedProductColor);
            const candidateBrandSegment = getBrandSegment(candidate.brand) ?? normalizeToken(candidate.brand);
            const differentBrandBonus = Number(candidateBrandSegment !== currentBrandSegment);
            const weightedScore =
              sharedGemstoneCount * 10 +
              sharedStyleCount * 4 +
              metalMatch * 2 +
              priceCloseness * 1.5 +
              colorMatch +
              differentBrandBonus * 2;

            return {
              candidate,
              sharedStyleCount,
              sharedGemstoneCount,
              weightedScore,
              differentBrandBonus,
              metalMatch,
              priceCloseness,
              colorMatch,
              priceDelta,
            };
          })
          .sort((a, b) => {
            // Strong relevance score with style/gemstone leading.
            if (b.weightedScore !== a.weightedScore) return b.weightedScore - a.weightedScore;

            // Deterministic fallback with explicit priority order.
            if (b.sharedGemstoneCount !== a.sharedGemstoneCount) return b.sharedGemstoneCount - a.sharedGemstoneCount;
            if (b.sharedStyleCount !== a.sharedStyleCount) return b.sharedStyleCount - a.sharedStyleCount;
            if (b.differentBrandBonus !== a.differentBrandBonus) return b.differentBrandBonus - a.differentBrandBonus;
            if (b.metalMatch !== a.metalMatch) return b.metalMatch - a.metalMatch;
            if (b.priceCloseness !== a.priceCloseness) return b.priceCloseness - a.priceCloseness;
            if (b.colorMatch !== a.colorMatch) return b.colorMatch - a.colorMatch;
            return a.priceDelta - b.priceDelta;
          })
          .slice(0, 6)
          .map((entry) => entry.candidate);

        setSimilarItems(ranked);
      } catch {
        if (!controller.signal.aborted) {
          setSimilarItems([]);
        }
      }
    };

    void loadSimilarItems();

    return () => controller.abort();
  }, [product, brand]);

  return (
    <aside className="catalog-preview" aria-live="polite" ref={panelRef}>
      <div className="catalog-preview-inner">
        <div
          className="catalog-preview-sheet-handle"
          onTouchStart={onDragStart}
          onTouchMove={onDragMove}
          onTouchEnd={onDragEnd}
          aria-hidden="true"
        >
          <span className="catalog-preview-sheet-bar" />
        </div>

        <div className="catalog-preview-topbar">
          <div className="catalog-preview-brand-row">
            {logoSrc
              ? <img src={logoSrc} alt={`${brand} logo`} className="catalog-preview-brand-logo" loading="lazy" />
              : <span className="catalog-preview-brand-fallback">{brand[0]}</span>}
            <p>{brand}</p>
          </div>
          <button type="button" className="catalog-preview-close" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="catalog-preview-hero">
          <img src={image} alt={name} className="catalog-preview-image" />
          <h2>{name}</h2>
          <div className="catalog-preview-meta-row">
            <p className="catalog-preview-meta-label">Source: {brand}</p>
            <span className={`availability-badge ${availability ? "in-stock" : "out-of-stock"}`}>
              {availability ? "Available" : "Unavailable"}
            </span>
          </div>
          <p className="catalog-preview-price">{currency} {price.toLocaleString("en-IN")}</p>
          {/* {description && <p className="catalog-preview-description">{description}</p>} */}

          <div className="catalog-preview-actions">
            <Link
              href={brandBrowseHref}
              className="product-detail-back-link"
              data-analytics-event="brand_browse_click"
              data-analytics-section="product_preview"
              data-analytics-type="cta"
              data-analytics-label="browse_more_from_brand"
              data-analytics-brand={brand}
              data-analytics-product-id={String(product.id)}
              data-analytics-product-name={name}
              data-analytics-destination={brandBrowseHref}
              data-analytics-category={product.category}
            >
              Browse more from {brand}
            </Link>
            {detailPath ? (
              <Link
                href={detailPath}
                target="_blank"
                rel="noopener noreferrer"
                className="catalog-preview-detail-link"
                data-analytics-event="product_preview_detail_click"
                data-analytics-section="product_preview"
                data-analytics-type="cta"
                data-analytics-label="view_product_details"
                data-analytics-brand={brand}
                data-analytics-product-id={String(product.id)}
                data-analytics-product-name={name}
                data-analytics-destination={detailPath}
                data-analytics-category={product.category}
              >
                View details
              </Link>
            ) : null}
            <a
              href={trackedProductUrl}
              target="_blank"
              rel="noopener"
              className="catalog-preview-source-link"
              data-analytics-event="brand_outbound_click"
              data-analytics-section="product_preview"
              data-analytics-type="cta"
              data-analytics-label="visit_brand_site"
              data-analytics-brand={brand}
              data-analytics-product-id={String(product.id)}
              data-analytics-product-name={name}
              data-analytics-destination={trackedProductUrl}
              data-analytics-category={product.category}
            >
              View on {brand}
            </a>
          </div>

          {similarItems.length > 0 && (
            <div className="catalog-preview-similar">
              <p className="catalog-preview-similar-title">Similar pieces</p>
              <div className="catalog-preview-similar-grid">
                {similarItems.map((item) => {
                  const itemName = item.name.split("(")[0]?.trim() || item.name;
                  const itemBrandSegment = getBrandSegment(item.brand)?.toLowerCase() ?? "";
                  const itemBrandLogo = BRAND_LOGOS[itemBrandSegment] ?? null;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="catalog-preview-similar-card"
                      onClick={() => onProductSelect?.(item)}
                      data-analytics-event="product_preview_similar_click"
                      data-analytics-section="product_preview"
                      data-analytics-type="similar_product"
                      data-analytics-label="open_similar_product"
                      data-analytics-brand={item.brand}
                      data-analytics-product-id={String(item.id)}
                      data-analytics-product-name={itemName}
                      data-analytics-category={item.category}
                    >
                      <img src={item.image} alt={itemName} loading="lazy" className="catalog-preview-similar-image" />
                      <span className="catalog-preview-similar-name">{itemName}</span>
                      <span className="catalog-preview-similar-brand-row">
                        {itemBrandLogo
                          ? <img src={itemBrandLogo} alt="" loading="lazy" aria-hidden="true" className="catalog-preview-similar-brand-logo" />
                          : <span className="catalog-preview-similar-brand-fallback" aria-hidden="true">{item.brand[0]}</span>}
                        <span className="catalog-preview-similar-brand">{item.brand}</span>
                      </span>
                      <span className="catalog-preview-similar-price">{item.currency} {item.price.toLocaleString("en-IN")}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <p className="catalog-preview-section-title">Specifications</p>
        <div className="catalog-preview-specs">
          {detailRows.map(([key, value]) => (
            <div key={key} className="catalog-preview-row">
              <p>{formatLabel(key)}</p>
              <span>
                {Array.isArray(value)
                  ? value.join(", ")
                  : String(value ?? "-")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
