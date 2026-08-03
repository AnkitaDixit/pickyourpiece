"use client";

import { useEffect, useMemo, useRef, useState, type TouchEvent } from "react";
import type { Product } from "@/types/product";
import { ChevronLeft, ChevronRight, PanelRightOpen } from "lucide-react";

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
  giva: "https://cdn.shopify.com/s/files/1/0061/8378/0442/files/Artboard_1_1_4.png?v=1755502668",
  palmonas: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQP_TFMjp4QLM89RGzLpBaGMmS9q4eX04dfFkihs9oa1rI_dhfgDvvEDlmN&s=10",
  miabytanishq: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRZLWP4f6l2TWiPzB946zFtEE4PaG-MGgTRhsUAncCiQvkUZDkbpH8s_x0&s=10",
  orra: "https://cdn0.weddingwire.in/vendor/3272/3_2/960/jpg/orra-logo.jpeg",
  candere: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTk2cwP-ig0xZPxiyWdc_exZwE-jMrHO5374YMNS7iH5swqrOOYX289Qqc&s=10",
  joyalukkas: "https://play-lh.googleusercontent.com/iJyXMNc-K3qZ2lO2Q4tXsdJMOEYQUb-oB35vlD383z_whP1hoV63KUOs8pqSfB3_SzMmsxmoWGDF2GLj2J_nJQ",
  melorra: "https://play-lh.googleusercontent.com/rm0fhzoROT81QQwcrErnDdxAD7D4Ag8MuXJuhHTBKILS0LP9cniKbsNICZOWdehDRaYuHwW-D8nWZwz13s8fE5I",
  senco: "https://s3-symbol-logo.tradingview.com/senco-gold-ltd--600.png",
};

export default function ProductCard({ product, imageLoading = "lazy", onSelect, isSelected = false }: Props) {
  const SWIPE_THRESHOLD = 36;
  const brandKey = useMemo(() => product.brand.toLowerCase().replace(/\s+/g, ""), [product.brand]);
  const productImages = useMemo(() => {
    const fromAllImages = Array.isArray(product.allImages)
      ? product.allImages
      : typeof product.allImages === "string"
      ? [product.allImages]
      : [];

    const merged = [product.image, ...fromAllImages]
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter((item) => item.length > 0);

    return Array.from(new Set(merged));
  }, [product.allImages, product.image]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isImageTransitionLoading, setIsImageTransitionLoading] = useState(false);
  const [suppressNextClick, setSuppressNextClick] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  useEffect(() => {
    setActiveImageIndex(0);
    setIsImageTransitionLoading(false);
  }, [product.id]);

  useEffect(() => {
    if (activeImageIndex < productImages.length) return;
    setActiveImageIndex(0);
  }, [activeImageIndex, productImages.length]);

  const activeImage = productImages[activeImageIndex] ?? product.image;
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

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (productImages.length < 2) return;
    const touch = event.touches[0];
    if (!touch) return;
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (productImages.length < 2) return;

    const startX = touchStartXRef.current;
    const startY = touchStartYRef.current;
    touchStartXRef.current = null;
    touchStartYRef.current = null;

    if (startX == null || startY == null) return;

    const touch = event.changedTouches[0];
    if (!touch) return;

    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;
    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) >= SWIPE_THRESHOLD;
    if (!isHorizontalSwipe) return;

    event.preventDefault();
    event.stopPropagation();
    setSuppressNextClick(true);

    setActiveImageIndex((current) => {
      if (deltaX < 0) {
        return Math.min(current + 1, productImages.length - 1);
      }

      return Math.max(current - 1, 0);
    });
  };

  const handleCardClick = () => {
    if (suppressNextClick) {
      setSuppressNextClick(false);
      return;
    }

    onSelect?.(product);
  };

  const goToImageAtIndex = (nextIndex: number) => {
    const boundedNextIndex = Math.max(0, Math.min(nextIndex, productImages.length - 1));
    if (boundedNextIndex === activeImageIndex) return;
    setIsImageTransitionLoading(true);
    setActiveImageIndex(boundedNextIndex);
  };

  const showPreviousImage = (event?: { preventDefault: () => void; stopPropagation: () => void }) => {
    event?.preventDefault();
    event?.stopPropagation();
    goToImageAtIndex(activeImageIndex - 1);
  };

  const showNextImage = (event?: { preventDefault: () => void; stopPropagation: () => void }) => {
    event?.preventDefault();
    event?.stopPropagation();
    goToImageAtIndex(activeImageIndex + 1);
  };

  return (
    <button
      type="button"
      data-product-id={product.id}
      className={`product-card${isSelected ? " is-selected" : ""}`}
      onClick={handleCardClick}
      data-analytics-event="product_card_open"
      data-analytics-section="catalog_grid"
      data-analytics-type="product_card"
      data-analytics-label="open_product_preview"
      data-analytics-brand={product.brand}
      data-analytics-product-id={String(product.id)}
      data-analytics-product-name={displayName}
      data-analytics-category={product.category}
    >
      <div className="product-card-image-wrap" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <img
          className={`product-card-image${isImageTransitionLoading ? " is-loading" : ""}`}
          src={activeImage}
          alt={displayName}
          loading={imageLoading}
          onLoad={() => setIsImageTransitionLoading(false)}
          onError={() => setIsImageTransitionLoading(false)}
        />
        {isImageTransitionLoading ? <div className="product-card-image-loading" aria-hidden="true" /> : null}
        {productImages.length > 1 ? (
          <>
            <span
              className="product-card-carousel-arrow product-card-carousel-arrow-left"
              role="button"
              tabIndex={0}
              aria-label="Show previous image"
              onMouseDown={(event) => event.preventDefault()}
              onClick={(event) => showPreviousImage(event)}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                showPreviousImage(event);
              }}
            >
              <ChevronLeft size={16} strokeWidth={2.2} />
            </span>
            <span
              className="product-card-carousel-arrow product-card-carousel-arrow-right"
              role="button"
              tabIndex={0}
              aria-label="Show next image"
              onMouseDown={(event) => event.preventDefault()}
              onClick={(event) => showNextImage(event)}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                showNextImage(event);
              }}
            >
              <ChevronRight size={16} strokeWidth={2.2} />
            </span>
          </>
        ) : null}
        {productImages.length > 1 ? (
          <div className="product-card-carousel-dots" aria-label="Product image options">
            {productImages.map((image, index) => {
              const isActive = index === activeImageIndex;

              return (
                <span
                  key={`${product.id}-${image}-${index}`}
                  className={`product-card-carousel-dot${isActive ? " is-active" : ""}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`View image ${index + 1}`}
                  onMouseDown={(event) => {
                    event.preventDefault();
                  }}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    goToImageAtIndex(index);
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.preventDefault();
                    event.stopPropagation();
                    goToImageAtIndex(index);
                  }}
                />
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="product-card-info">
        <div className="product-card-brand-row">
          <span className={`product-card-brand-logo${showLogo ? " has-image" : ""}`}>
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
          </span>

          <span>{product.brand}</span>
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

