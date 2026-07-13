"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/types/product";
import { buildProductDetailPath, getBrandSegment } from "@/lib/product-seo";

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

export default function ProductPreviewPanel({ product, onClose, onProductSelect }: Props) {
  const [detail, setDetail] = useState<DetailRecord | null>(null);
  const [similarItems, setSimilarItems] = useState<Product[]>([]);

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
  const description = typeof merged.description === "string" ? merged.description : "";
  const price = typeof merged.price === "number" ? merged.price : product.price;
  const currency = typeof merged.currency === "string" ? merged.currency : product.currency;
  const productUrl = typeof merged.productUrl === "string" ? merged.productUrl : product.productUrl;
  const availability = typeof merged.availability === "boolean" ? merged.availability : product.availability;
  const brandSegment = getBrandSegment(brand) ?? "";
  const detailPath = buildProductDetailPath(product);
  const logoSrc = BRAND_LOGOS[brandSegment.toLowerCase()] ?? null;
  const brandBrowseHref = `/?brand=${encodeURIComponent(brand)}`;

  const detailRows = useMemo(() => {
    return Object.entries(merged)
      .filter(([key]) => !["allImages", "tags"].includes(key))
      .sort(([a], [b]) => a.localeCompare(b));
  }, [merged]);

  useEffect(() => {
    const controller = new AbortController();

    const loadSimilarItems = async () => {
      try {
        const params = new URLSearchParams({
          brand,
          category: product.category,
          limit: "60",
          sort: "price-asc",
        });

        const response = await fetch(`/api/products?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          setSimilarItems([]);
          return;
        }

        const payload = (await response.json()) as { items?: Product[] };
        const candidates = Array.isArray(payload.items) ? payload.items : [];
        const currentPrice = typeof product.price === "number" ? product.price : 0;
        const currentGemstones = Array.isArray(product.gemstone) ? product.gemstone : [];
        const currentBrandSegment = getBrandSegment(product.brand);

        const ranked = candidates
          .filter((candidate) => candidate.id !== product.id)
          .map((candidate) => {
            let score = 0;

            const candidateBrandSegment = getBrandSegment(candidate.brand);

            if (candidateBrandSegment && currentBrandSegment && candidateBrandSegment === currentBrandSegment) score += 4;
            if (candidate.category === product.category) score += 3;
            if (candidate.metal === product.metal) score += 2;
            if (candidate.purity && product.purity && candidate.purity === product.purity) score += 1;
            if (candidate.metalColor && product.metalColor && candidate.metalColor === product.metalColor) score += 1;

            const sharedGemstones = (candidate.gemstone ?? []).filter((gem) => currentGemstones.includes(gem)).length;
            score += sharedGemstones * 1.5;

            const priceDelta = Math.abs((candidate.price ?? 0) - currentPrice);
            const priceDeltaRatio = currentPrice > 0 ? priceDelta / currentPrice : 1;
            score += Math.max(0, 2 - priceDeltaRatio * 4);

            return { candidate, score, priceDelta };
          })
          .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
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
    <aside className="catalog-preview" aria-live="polite">
      <div className="catalog-preview-inner">
        <div className="catalog-preview-sheet-handle" aria-hidden="true">
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
            <Link href={brandBrowseHref} className="product-detail-back-link">
              Browse more from {brand}
            </Link>
            {detailPath ? (
              <Link href={detailPath} target="_blank" rel="noopener noreferrer" className="catalog-preview-detail-link">
                View details
              </Link>
            ) : null}
            <a href={productUrl} target="_blank" rel="noopener noreferrer" className="catalog-preview-source-link">
              View on {brand}
            </a>
          </div>

          {similarItems.length > 0 && (
            <div className="catalog-preview-similar">
              <p className="catalog-preview-similar-title">Similar pieces</p>
              <div className="catalog-preview-similar-grid">
                {similarItems.map((item) => {
                  const itemName = item.name.split("(")[0]?.trim() || item.name;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="catalog-preview-similar-card"
                      onClick={() => onProductSelect?.(item)}
                    >
                      <img src={item.image} alt={itemName} loading="lazy" className="catalog-preview-similar-image" />
                      <span className="catalog-preview-similar-name">{itemName}</span>
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
