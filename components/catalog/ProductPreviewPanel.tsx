"use client";

import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/types/product";
import { buildProductDetailPath, getBrandSegment } from "@/lib/product-seo";

interface Props {
  product: Product;
  onClose: () => void;
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

export default function ProductPreviewPanel({ product, onClose }: Props) {
  const [detail, setDetail] = useState<DetailRecord | null>(null);

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
  const detailPath = buildProductDetailPath(product);
  const brandSegment = getBrandSegment(brand) ?? "";
  const logoSrc = BRAND_LOGOS[brandSegment.toLowerCase()] ?? null;

  const detailRows = useMemo(() => {
    return Object.entries(merged)
      .filter(([key]) => !["allImages", "tags"].includes(key))
      .sort(([a], [b]) => a.localeCompare(b));
  }, [merged]);

  return (
    <aside className="catalog-preview" aria-live="polite">
      <div className="catalog-preview-inner">
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
          <p className="catalog-preview-price">{currency} {price.toLocaleString("en-IN")}</p>
          {description && <p className="catalog-preview-description">{description}</p>}

          <div className="catalog-preview-actions">
            <a href={productUrl} target="_blank" rel="noopener noreferrer" className="catalog-preview-cta">
              Visit Brand Website
            </a>
            {detailPath && (
              <a href={detailPath} className="catalog-preview-link">
                Open Dedicated Page
              </a>
            )}
          </div>
        </div>

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
