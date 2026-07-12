"use client";

import Link from "next/link";
import { PanelRightOpen } from "lucide-react";
import { Suspense, useState } from "react";
import SearchBar from "@/components/search/SearchBar";
import ProductPreviewPanel from "@/components/catalog/ProductPreviewPanel";
import type { Product } from "@/types/product";

const POPULAR_SEARCHES = [
  { label: "💍 Solitaire Rings", query: "solitaire ring" },
  { label: "💎 Diamond Jewellery", query: "diamond jewellery" },
  { label: "✨ Engagement Rings", query: "engagement ring" },
  { label: "🌸 Rose Gold", query: "rose gold ring" },
  { label: "🔥 Trending Now", query: "trending ring" },
];

interface HomeLandingModeProps {
  allCount: number;
  totalBrands: number;
  trendingProducts: Product[];
}

export default function HomeLandingMode({
  allCount,
  totalBrands,
  trendingProducts,
}: HomeLandingModeProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  return (
    <div className="landing-page">
      <section className="landing-hero" aria-labelledby="landing-hero-title">
        <div className="landing-hero-copy">
          <h1 id="landing-hero-title" className="landing-hero-title">
            Find the perfect jewellery.
            <span>Compare every brand.</span>
          </h1>
          <p className="landing-hero-subtitle">
            Explore {allCount.toLocaleString()}+ designs from {totalBrands} trusted brands. Filter by price,
            metal, purity, and style in seconds.
          </p>

          <div className="landing-hero-search">
            <Suspense fallback={<div className="searchbar-wrap searchbar-hero" aria-hidden="true" />}>
              <SearchBar
                variant="landing"
                placeholder="Search rings, earrings, necklaces, brands..."
                ariaLabel="Search jewellery catalog"
              />
            </Suspense>
          </div>

          <div className="landing-chip-block" aria-label="Popular quick searches">
            <p className="landing-chip-label">Popular Searches</p>
            <div className="landing-chip-row">
              {POPULAR_SEARCHES.map((item) => (
                <Link key={item.query} className="landing-chip" href={`/?q=${encodeURIComponent(item.query)}`}>
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="landing-chip-view-all-wrap">
              <Link className="landing-chip-view-all" href="/?sort=price-asc">
                Explore all pieces
              </Link>
            </div>
          </div>
        </div>

        <div className="landing-hero-visual" aria-hidden="true">
          <img src="/heroImage.png" alt="Featured jewellery" />
        </div>
      </section>

      {/* <section className="landing-brand-strip" aria-label="Trusted brands">
        <div className="landing-brand-strip-head">
          <p>Trusted by {totalBrands} top jewellery brands</p>
          <Link href="/brands/bluestone">View all brands</Link>
        </div>
        <div className="landing-brand-list">
          {brandEntries.map(([segment, brandName]) => {
            const logo = BRAND_LOGOS[segment] ?? null;
            return (
              <Link key={segment} href={`/brands/${segment}`} className="landing-brand-item">
                {logo ? <img src={logo} alt={`${brandName} logo`} loading="lazy" /> : <span>{brandName}</span>}
              </Link>
            );
          })}
        </div>
      </section> */}

      <section className="landing-trending" aria-labelledby="landing-trending-title">
        <div className="landing-section-head">
          <h2 id="landing-trending-title">Editors Picks</h2>
          <Link href="/?sort=price-asc">View all</Link>
        </div>
        {trendingProducts.length > 0 ? (
          <div className={`catalog-split${selectedProduct ? " with-preview" : ""}`}>
            <div className="catalog-split-main">
              <div className="landing-trending-grid content-grid">
                {trendingProducts.map((product) => {
                  const displayName = product.name.split("(")[0]?.trim() || product.name;
                  const meta = [product.purity ?? "", product.gemstone?.[0] ?? "", product.metalColor ?? ""]
                    .filter(Boolean)
                    .join(" · ");
                  const metaText = meta || "Metal and gemstone details available";
                  return (
                    <button
                      key={product.id}
                      type="button"
                      className={`product-card${selectedProduct?.id === product.id ? " is-selected" : ""}`}
                      onClick={() => setSelectedProduct(product)}
                    >
                      <div className="product-card-image-wrap">
                        <img src={product.image} alt={displayName} loading="lazy" className="product-card-image" />
                      </div>
                      <div className="product-card-info">
                        <div className="product-card-brand-row">
                          {/* <span className="product-card-brand-logo" aria-hidden="true">
                            {product.brand[0]}
                          </span> */}
                          <span>{product.brand}</span>
                        </div>

                        <p className="product-card-title">{displayName}</p>
                        <p className={`product-card-meta${meta ? "" : " is-fallback"}`}>{metaText}</p>

                        <div className="product-card-price-row">
                          <p className="product-card-price">₹{product.price.toLocaleString("en-IN")}</p>
                          <span className="product-card-cta" aria-hidden="true">
                            <PanelRightOpen className="product-card-link" size={14} strokeWidth={1.8} />
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedProduct && (
              <ProductPreviewPanel
                key={selectedProduct.id}
                product={selectedProduct}
                onClose={() => setSelectedProduct(null)}
              />
            )}
          </div>
        ) : (
          <div className="landing-trending-empty">
            Trending products are loading. Try a quick search to start comparing designs.
          </div>
        )}
      </section>
    </div>
  );
}
