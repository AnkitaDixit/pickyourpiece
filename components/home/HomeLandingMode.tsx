"use client";

import Link from "next/link";
import { MoveRight } from "lucide-react";
import { Suspense, useState } from "react";
import SearchBar from "@/components/search/SearchBar";
import ProductPreviewPanel from "@/components/catalog/ProductPreviewPanel";
import { buildProductDetailPath } from "@/lib/product-seo";
import type { Product } from "@/types/product";

const POPULAR_SEARCHES = [
  { label: "💍 Solitaire Rings", query: "solitaire ring" },
  { label: "💎 Diamond Jewellery", query: "diamond jewellery" },
  { label: "✨ Engagement Rings", query: "engagement ring" },
  { label: "🌸 Rose Gold", query: "rose gold ring" },
  { label: "🔥 Trending Now", query: "trending ring" },
];

const CATEGORY_ITEMS = [
  { id: "ring",     label: "Rings",     href: "/ring",     iconSrc: "/categories/ring.png",     sub: "Browse 9,000+", available: true },
  { id: "earrings", label: "Earrings",  href: "/earrings", iconSrc: "/categories/earrings.png", sub: "Coming soon",   available: false },
  { id: "bracelet", label: "Bracelets", href: "/bracelet", iconSrc: "/categories/bracelet.png", sub: "Coming soon",   available: false },
  { id: "pendant",  label: "Pendants",  href: "/pendant",  iconSrc: "/categories/pendant.png",  sub: "Coming soon",   available: false },
];

const BRAND_ENTRIES = [
  ["bluestone", "BlueStone"],
  ["candere", "Candere"],
  ["caratlane", "CaratLane"],
  ["giva", "GIVA"],
  ["mia", "Mia by Tanishq"],
  ["orra", "ORRA"],
  ["tanishq", "Tanishq"],
] as const;

const BRAND_LOGOS: Partial<Record<(typeof BRAND_ENTRIES)[number][0], string>> = {
  bluestone: "/brands/bluestone-logo.png?v=20260709-2338",
  candere: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTk2cwP-ig0xZPxiyWdc_exZwE-jMrHO5374YMNS7iH5swqrOOYX289Qqc&s=10",
  caratlane: "/brands/caratlane-logo.jpg?v=20260709-2338",
  giva: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTdiZUsR4K1BJmDa422342XYCtccq7OfbR9RFdwOuWWAz8IN3bgLWRBLw-_&s=10",
  mia: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRZLWP4f6l2TWiPzB946zFtEE4PaG-MGgTRhsUAncCiQvkUZDkbpH8s_x0&s=10",
  orra: "https://upload.wikimedia.org/wikipedia/commons/3/3e/ORRAJewellery.jpg",
  tanishq: "https://images.assettype.com/nationalherald/2020-10/a42818da-499f-46fe-a8c2-e7d7a6ddc775/Tanishq.jpg",
};

interface DiscoveryShelf {
  id: string;
  title: string;
  emoji: string;
  href: string;
  products: Product[];
}

interface HomeLandingModeProps {
  allCount: number;
  totalBrands: number;
  trendingProducts: Product[];
  discoveryShelves: DiscoveryShelf[];
}

export default function HomeLandingMode({
  allCount,
  totalBrands,
  discoveryShelves,
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
            Explore {allCount.toLocaleString()}+ designs from {totalBrands}+ trusted brands. Filter by price,
            metal, purity, and style in seconds.
          </p>

          <div className="landing-hero-search">
            <Suspense fallback={<div className="searchbar-wrap searchbar-hero" aria-hidden="true" />}>
              <SearchBar
                variant="landing"
                placeholder = "Search by title, brand, description, category, or metal..."
                ariaLabel="Search jewellery catalog"
              />
            </Suspense>
          </div>

          <div className="landing-chip-block" aria-label="Popular quick searches">
            <div className="landing-chip-row">
              <span className="landing-chip-label">Popular Searches</span>
              {POPULAR_SEARCHES.map((item) => (
                <Link key={item.query} className="landing-chip" href={`/?q=${encodeURIComponent(item.query)}`}>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="landing-category-block" aria-label="Browse by category">
            <div className="landing-cat-row">
              {CATEGORY_ITEMS.map((item) => (
                <Link
                  key={item.id}
                  className={`landing-cat-card${item.available ? "" : " is-soon"}`}
                  href={item.available ? item.href : "#"}
                  aria-disabled={!item.available}
                >
                  <div className="landing-cat-card-icon-wrap">
                    <img src={item.iconSrc} alt="" width={38} height={38} aria-hidden="true" className="landing-cat-card-icon" />
                  </div>
                  <div className="landing-cat-card-body">
                    <span className="landing-cat-card-label">{item.label}</span>
                    <span className="landing-cat-card-sub">{item.sub}</span>
                  </div>
                  {item.available && <MoveRight size={15} className="landing-cat-card-arrow" aria-hidden="true" />}
                </Link>
              ))}
              <Link className="landing-category-explore-all" href="/?sort=price-asc">
                Explore all categories
                <MoveRight size={13} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>

        <div className="landing-hero-visual" aria-hidden="true">
          <img src="/heroImageNew.png" alt="Featured jewellery" loading="eager" />
        </div>
      </section>

      <div className={`catalog-split${selectedProduct ? " with-preview" : ""}`}>
        <div className="catalog-split-main">
          <section className="landing-discovery" aria-label="Discover jewellery">
            {discoveryShelves.map((shelf) => (
              <div key={shelf.id} className="discovery-shelf">
                <div className="discovery-shelf-head">
                  <h3 className="discovery-shelf-title">
                    <span aria-hidden="true">{shelf.emoji}</span>
                    {shelf.title}
                  </h3>
                  <Link className="discovery-shelf-all" href={shelf.href}>
                    See all <MoveRight size={13} aria-hidden="true" />
                  </Link>
                </div>
                <div className="discovery-shelf-scroll">
                  {shelf.products.map((product) => {
                    const displayName = product.name.split("(")[0]?.trim() || product.name;
                    const productPath = buildProductDetailPath(product);
                    return (
                      <Link
                        key={product.id}
                        href={productPath ?? "/?sort=price-asc"}
                        className={`discovery-product-card${selectedProduct?.id === product.id ? " is-selected" : ""}`}
                        onClick={(e) => { e.preventDefault(); setSelectedProduct(product); }}
                      >
                        <div className="discovery-product-image">
                          <img src={product.image} alt={`${displayName} by ${product.brand}`} loading="lazy" />
                        </div>
                        <div className="discovery-product-info">
                          <span className="discovery-product-brand">{product.brand}</span>
                          <p className="discovery-product-name">{displayName}</p>
                          <p className="discovery-product-price">₹{product.price.toLocaleString("en-IN")}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
        </div>

        {selectedProduct && (
          <ProductPreviewPanel
            key={selectedProduct.id}
            product={selectedProduct}
            onProductSelect={setSelectedProduct}
            onClose={() => setSelectedProduct(null)}
          />
        )}
      </div>

         <section className="landing-brand-strip" aria-labelledby="landing-brand-strip-title">
        <div className="landing-brand-strip-head">
          <h2 id="landing-brand-strip-title">Shop by Brand</h2>
          <Link href="/ring">View all</Link>
        </div>
        <div className="landing-brand-list">
          {BRAND_ENTRIES.map(([segment, brandName]) => {
            const logo = BRAND_LOGOS[segment] ?? null;
            return (
              <Link key={segment} href={`/brands/${segment}`} className="landing-brand-card" aria-label={`Browse ${brandName}`}>
                <div className="landing-brand-card-logo">
                  {logo ? (
                    <img src={logo} alt={`${brandName} logo`} loading="lazy" className="landing-brand-logo-image" />
                  ) : (
                    <span className="landing-brand-card-initial">{brandName[0]}</span>
                  )}
                </div>
                <span className="landing-brand-card-name">{brandName}</span>
              </Link>
            );
          })}
        </div>
      </section>

    </div>
  );
}
