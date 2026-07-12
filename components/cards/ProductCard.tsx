"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/types/product";
import { PanelRightOpen } from "lucide-react";

interface Props {
  product: Product;
  imageLoading?: "lazy" | "eager";
  onSelect?: (product: Product) => void;
  isSelected?: boolean;
}

const BRAND_LOGOS: Record<string, string> = {
  bluestone: "/brands/bluestone-logo.png?v=20260709-2338",
  caratlane: "/brands/caratlane-logo.jpg?v=20260709-2338",
  tanishq: "https://images.assettype.com/nationalherald/2020-10/a42818da-499f-46fe-a8c2-e7d7a6ddc775/Tanishq.jpg",
  giva: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTdiZUsR4K1BJmDa422342XYCtccq7OfbR9RFdwOuWWAz8IN3bgLWRBLw-_&s=10",
  miabytanishq: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRZLWP4f6l2TWiPzB946zFtEE4PaG-MGgTRhsUAncCiQvkUZDkbpH8s_x0&s=10",
  orra: "http://upload.wikimedia.org/wikipedia/commons/3/3e/ORRAJewellery.jpg",
  candere: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTk2cwP-ig0xZPxiyWdc_exZwE-jMrHO5374YMNS7iH5swqrOOYX289Qqc&s=10",
};

export default function ProductCard({ product, imageLoading = "lazy", onSelect, isSelected = false }: Props) {
  const brandKey = useMemo(() => product.brand.toLowerCase().replace(/\s+/g, ""), [product.brand]);
  const displayName = useMemo(() => product.name.split("(")[0]?.trim() || product.name, [product.name]);
  const meta = useMemo(
    () => [product.purity ?? "", product.gemstone?.[0] ?? "", product.metalColor ?? ""].filter(Boolean).join(" · "),
    [product.gemstone, product.metalColor, product.purity]
  );
  const metaText = meta || "Metal and gemstone details available";
  const logoSrc = BRAND_LOGOS[brandKey] ?? null;
  const [brokenLogos, setBrokenLogos] = useState<Record<string, true>>({});
  const showLogo = Boolean(logoSrc) && !brokenLogos[brandKey];
  const brandClassName = `product-card-brand product-card-brand--${brandKey}`;
  return (
    <button
      type="button"
      data-product-id={product.id}
      className={`product-card${isSelected ? " is-selected" : ""}`}
      onClick={() => onSelect?.(product)}
    >
      <div className="product-card-image-wrap">
        <img
          className="product-card-image"
          src={product.image}
          alt={displayName}
          loading={imageLoading}
        />
      </div>

      <div className="product-card-info">
        <div className="product-card-brand-row">
          {/* <span className={`product-card-brand-logo${showLogo ? " has-image" : ""}`}>
            {showLogo && logoSrc ? (
              <img
                src={logoSrc}
                alt={`${product.brand} logo`}
                className="product-card-brand-logo-img"
                width={20}
                height={20}
                loading="lazy"
                onError={() =>
                  setBrokenLogos((prev) => ({
                    ...prev,
                    [brandKey]: true,
                  }))
                }
              />
            ) : (
              product.brand[0]
            )}
          </span> */}

          <span >{product.brand}</span>
        </div>

        <p className="product-card-title">{displayName}</p>
        <p className={`product-card-meta${meta ? "" : " is-fallback"}`}>{metaText}</p>

        <div className="product-card-price-row">
          <span className="product-card-price">
            {product.price != null
              ? `₹${product.price.toLocaleString("en-IN")}`
              : "Price on request"}
          </span>

          <span className="product-card-cta" aria-hidden="true">
            <PanelRightOpen
              className="product-card-link"
              size={14}
              strokeWidth={1.8}
            />
          </span>
        </div>
      </div>
    </button>
  );
}

