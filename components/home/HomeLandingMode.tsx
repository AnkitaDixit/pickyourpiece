"use client";

import Link from "next/link";
import { ArrowLeft, Building2, Gift, MoveRight, RefreshCw, ShieldCheck, Sparkles, Tag, WalletCards, X } from "lucide-react";
import { Suspense, useState } from "react";
import SearchBar from "@/components/search/SearchBar";
import ProductPreviewPanel from "@/components/catalog/ProductPreviewPanel";
import { buildProductDetailPath, getBrandSegment } from "@/lib/product-seo";
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
  ["miabytanishq", "Mia by Tanishq"],
  ["orra", "ORRA"],
  ["joyalukkas", "Joyalukkas"],
  ["melorra", "Melorra"],
  ["palmonas", "Palmonas"],
  ["senco", "Senco"],
  ["tanishq", "Tanishq"],
] as const;

const BRAND_LOGOS: Partial<Record<(typeof BRAND_ENTRIES)[number][0], string>> = {
  bluestone: "/brands/bluestone-logo.png",
  caratlane: "/brands/caratlane-logo.jpg",
  tanishq: "/brands/tanishq-logo.jpg",
  giva: "/brands/giva-logo.png",
  palmonas: "/brands/palmonas-logo.jpg",
  miabytanishq: "/brands/mia-logo.jpg",
  orra: "/brands/orra-logo.jpeg",
  candere: "/brands/candere-logo.jpg",
  joyalukkas: "/brands/joyalukkas-logo.jpg",
  melorra: "/brands/melorra-logo.jpg",
  senco: "/brands/senco-logo.png",
};

const FINDER_QUESTIONS = [
  {
    title: "What are you shopping for?",
    description: "This helps us match the right style and occasion.",
    options: [
      ["Engagement ring", "Engagement & Wedding", "💍"],
      ["Gift", "Romantic & Gifting", "🎁"],
      ["Everyday wear", "Daily Wear", "✨"],
      ["Party / statement piece", "Party & Statement", "🎉"],
      ["Something artistic / unique", "Nature & Artistic", "🌸"],
      ["Just browsing", "Modern & Classic", "🤍"],
    ],
  },
  {
    title: "What is your budget?",
    description: "We’ll prioritize pieces that feel right for your budget.",
    options: [
      ["Under ₹25,000", "0:25000"],
      ["₹25,000 – ₹50,000", "25000:50000"],
      ["₹50,000 – ₹1 lakh", "50000:100000"],
      ["₹1 – ₹3 lakh", "100000:300000"],
      ["₹3 lakh+", "300000:"],
    ],
  },
  {
    title: "Which metal do you prefer?",
    description: "Choose a favorite, or keep it open.",
    options: [
      ["Gold", "Gold", "🟡"],
      ["Platinum", "Platinum", "🤍"],
      ["Silver", "Silver", "✨"],
      ["I’m not sure", "", "🌈"],
    ],
  },
  {
    title: "Which look do you like most?",
    description: "Pick the visual style that feels most like you.",
    options: [
      ["Minimal & delicate", "minimal", "✨"],
      ["Classic diamond", "classic", "💎"],
      ["Bold & glamorous", "bold", "🔥"],
      ["Colorful gemstone", "colorful", "🌈"],
    ],
  },
  {
    title: "Who is it for?",
    description: "This helps us fine-tune your recommendations.",
    options: [
      ["Women", "Women", "👩"],
      ["Men", "Men", "👨"],
      ["Kids", "Kids", "👧"],
      ["Unisex", "Unisex", "👫"],
      ["Not sure", "", "🤍"],
    ],
  },
] as const;

type FinderAnswers = {
  occasion?: string;
  budget?: string;
  metal?: string;
  look?: string;
  gender?: string;
};

interface DiscoveryShelf {
  id: string;
  title: string;
  artSrc: string;
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
  discoveryShelves,
}: HomeLandingModeProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [finderOpen, setFinderOpen] = useState(false);
  const [finderStep, setFinderStep] = useState(0);
  const [finderAnswers, setFinderAnswers] = useState<FinderAnswers>({});

  const closeFinder = () => {
    setFinderOpen(false);
    setFinderStep(0);
    setFinderAnswers({});
  };

  const completeFinder = (answers: FinderAnswers) => {
    const params = new URLSearchParams({ sort: "relevant" });
    if (answers.occasion) params.append("styleOccasion", answers.occasion);
    if (answers.metal) params.append("metal", answers.metal);
    if (answers.gender) params.append("gender", answers.gender);
    if (answers.budget) {
      const [min, max] = answers.budget.split(":");
      if (min) params.set("minPrice", min);
      if (max) params.set("maxPrice", max);
    }
    if (answers.look === "classic") {
      params.append("gemstone", "Diamond");
      params.append("styleOccasion", "Engagement & Wedding");
    } else if (answers.look === "minimal") {
      params.append("styleOccasion", "Daily Wear");
      params.append("styleOccasion", "Modern & Classic");
    } else if (answers.look === "bold") {
      params.append("styleOccasion", "Party & Statement");
    } else if (answers.look === "colorful") {
      params.set("q", "gemstone");
    }
    window.location.assign(`/ring?${params.toString()}`);
  };

  const selectFinderOption = (value: string) => {
    const keys: (keyof FinderAnswers)[] = ["occasion", "budget", "metal", "look", "gender"];
    const nextAnswers = { ...finderAnswers, [keys[finderStep]]: value };
    setFinderAnswers(nextAnswers);
    if (finderStep === FINDER_QUESTIONS.length - 1) {
      completeFinder(nextAnswers);
      return;
    }
    setFinderStep((step) => step + 1);
  };

  return (
    <div className="landing-page">
      <section className="landing-hero" aria-labelledby="landing-hero-title">
        <div className="landing-hero-copy">
          <p className="landing-hero-eyebrow">
            <Sparkles size={13} strokeWidth={2} aria-hidden="true" />
            <span>India&apos;s smarter way to shop jewellery</span>
          </p>
          <h1 id="landing-hero-title" className="landing-hero-title">
            One Search.
            <span>Every jewellery brand.</span>
          </h1>
          {/* <p className="landing-hero-subtitle">
            Explore {allCount.toLocaleString()}+ designs across brands to find your perfect piece.
          </p> */}

          <div className="landing-trust-marker" aria-label="PickYourPiece trust markers" role="list">
            <div className="landing-trust-item" role="listitem">
              <Tag className="landing-trust-icon" size={27} strokeWidth={1.8} aria-hidden="true" />
              <span><strong>{allCount.toLocaleString()}+</strong><small>Designs</small></span>
            </div>
            <div className="landing-trust-item" role="listitem">
              <Building2 className="landing-trust-icon" size={27} strokeWidth={1.8} aria-hidden="true" />
              <span><strong>{BRAND_ENTRIES.length}+</strong><small>Top Brands</small></span>
            </div>
            <div className="landing-trust-item" role="listitem">
              <RefreshCw className="landing-trust-icon" size={27} strokeWidth={1.8} aria-hidden="true" />
              <span><strong>Updated</strong><small>Fresh Prices</small></span>
            </div>
            <div className="landing-trust-item" role="listitem">
              <ShieldCheck className="landing-trust-icon" size={27} strokeWidth={1.8} aria-hidden="true" />
              <span><strong>Independent</strong><small>No Markup</small></span>
            </div>
          </div>

          <div className="landing-feature-cards" aria-label="Ways to discover jewellery">
            <article className="landing-feature-card landing-feature-card-budget">
              <WalletCards className="landing-feature-card-icon" size={27} strokeWidth={1.8} aria-hidden="true" />
              <h2>Finds by Budget</h2>
              <p>Find the best pieces in your budget.</p>
              <div className="landing-feature-card-budget-links">
                <div className="landing-feature-card-actions">
                  <Link href="/?maxPrice=25000">Under ₹25k <MoveRight size={14} aria-hidden="true" /></Link>
                  <Link href="/?maxPrice=100000">Under ₹1 Lakh <MoveRight size={14} aria-hidden="true" /></Link>
                  {/* <Link href="/?minPrice=100000">₹1 Lakh+ <MoveRight size={14} aria-hidden="true" /></Link> */}
                </div>
                <Link className="landing-feature-card-cta" href="/?sort=price-asc">
                  Explore all <MoveRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </article>

            {/* <article className="landing-feature-card landing-feature-card-gift">
              <Gift className="landing-feature-card-icon" size={27} strokeWidth={1.8} aria-hidden="true" />
              <h2>Buying a Gift?</h2>
              <p>Pick the perfect jewellery for your loved one.</p>
              <div className="landing-feature-card-actions">
                <Link href="/?q=gift+for+wife">For Wife</Link>
                <Link href="/?q=gift+for+girlfriend">For Girlfriend</Link>
                <Link href="/?q=gift+for+mother">For Mother</Link>
                <Link href="/?q=anniversary+gift">Anniversary</Link>
              </div>
              <Link className="landing-feature-card-cta" href="/?q=jewellery+gift">
                Explore gift ideas <MoveRight size={16} aria-hidden="true" />
              </Link>
            </article> */}

            <article className="landing-feature-card landing-feature-card-personalized">
              <Sparkles className="landing-feature-card-icon" size={27} strokeWidth={1.8} aria-hidden="true" />
              <h2>Personalized Picks</h2>
              <p>Answer 5 quick questions and get picks just for you.</p>
              <button className="landing-feature-card-primary-cta" type="button" onClick={() => setFinderOpen(true)}>
                Find My Perfect Piece
              </button>
              <small>◷ Takes 30 seconds</small>
            </article>
          </div>

          {/* <div className="landing-hero-search">
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
                <Link
                  key={item.query}
                  className="landing-chip"
                  href={`/?q=${encodeURIComponent(item.query)}`}
                  data-analytics-event="home_quick_search_click"
                  data-analytics-section="home_hero"
                  data-analytics-type="quick_search"
                  data-analytics-label={item.label}
                  data-analytics-query={item.query}
                  data-analytics-destination={`/?q=${encodeURIComponent(item.query)}`}
                  data-analytics-category="home"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div> */}

               <section className="landing-brand-strip" aria-labelledby="landing-brand-strip-title">
        <div className="landing-brand-strip-head">
          <h2 id="landing-brand-strip-title">Compare by Brand</h2>
          <Link
            href="/ring"
            data-analytics-event="home_brand_strip_view_all_click"
            data-analytics-section="home_brand_strip"
            data-analytics-type="cta"
            data-analytics-label="view_all_brands"
            data-analytics-destination="/ring"
            data-analytics-category="ring"
          >
            View all
          </Link>
        </div>
        <div className="landing-brand-list">
          {BRAND_ENTRIES.map(([segment, brandName]) => {
            const logo = BRAND_LOGOS[segment] ?? null;
            return (
              <Link
                key={segment}
                href={`/brands/${segment}`}
                className="landing-brand-card"
                aria-label={`Browse ${brandName}`}
                data-analytics-event="home_brand_card_click"
                data-analytics-section="home_brand_strip"
                data-analytics-type="brand_card"
                data-analytics-label={brandName}
                data-analytics-brand={brandName}
                data-analytics-destination={`/brands/${segment}`}
                data-analytics-category="ring"
              >
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
          
          {/* <div className="landing-category-block" aria-label="Browse by category">
             <h2 style={{padding: "8px"}}>Browse Categories</h2>
            <div className="landing-cat-row">
              {CATEGORY_ITEMS.map((item) => (
                <Link
                  key={item.id}
                  className={`landing-cat-card${item.available ? "" : " is-soon"}`}
                  href={item.available ? item.href : "#"}
                  aria-disabled={!item.available}
                  data-analytics-event="home_category_card_click"
                  data-analytics-section="home_categories"
                  data-analytics-type="category_card"
                  data-analytics-label={item.label}
                  data-analytics-destination={item.available ? item.href : "#"}
                  data-analytics-category={item.id}
                >
                  <div className="landing-cat-card-icon-wrap">
                    <img src={item.iconSrc} alt="" width={38} height={38} aria-hidden="true" className="landing-cat-card-icon" />
                  </div>
                  <div className="landing-cat-card-body">
                    <span className="landing-cat-card-label">{item.label}</span>
                    <span className="landing-cat-card-sub">
                      {item.id === "ring" ? `Browse ${allCount.toLocaleString()}+` : item.sub}
                    </span>
                  </div>
                  {item.available && <MoveRight size={15} className="landing-cat-card-arrow" aria-hidden="true" />}
                </Link>
              ))}
              <Link
                className="landing-category-explore-all"
                href="/?sort=price-asc"
                data-analytics-event="home_explore_all_categories_click"
                data-analytics-section="home_categories"
                data-analytics-type="cta"
                data-analytics-label="explore_all_categories"
                data-analytics-destination="/?sort=price-asc"
                data-analytics-category="ring"
              >
                Explore all categories
                <MoveRight size={13} aria-hidden="true" />
              </Link>
            </div>
          </div> */}
        </div>

        <div className="landing-hero-visual" aria-hidden="true">
          <img src="/heroImageNew.png" alt="Featured jewellery" loading="eager" />
        </div>
      </section>

        <div className="landing-category-block" aria-label="Browse by category">
             <h2 style={{padding: "8px"}}>Browse Categories</h2>
            <div className="landing-cat-row">
              {CATEGORY_ITEMS.map((item) => (
                <Link
                  key={item.id}
                  className={`landing-cat-card${item.available ? "" : " is-soon"}`}
                  href={item.available ? item.href : "#"}
                  aria-disabled={!item.available}
                  data-analytics-event="home_category_card_click"
                  data-analytics-section="home_categories"
                  data-analytics-type="category_card"
                  data-analytics-label={item.label}
                  data-analytics-destination={item.available ? item.href : "#"}
                  data-analytics-category={item.id}
                >
                  <div className="landing-cat-card-icon-wrap">
                    <img src={item.iconSrc} alt="" width={38} height={38} aria-hidden="true" className="landing-cat-card-icon" />
                  </div>
                  <div className="landing-cat-card-body">
                    <span className="landing-cat-card-label">{item.label}</span>
                    <span className="landing-cat-card-sub">
                      {item.id === "ring" ? `Browse ${allCount.toLocaleString()}+` : item.sub}
                    </span>
                  </div>
                  {item.available && <MoveRight size={15} className="landing-cat-card-arrow" aria-hidden="true" />}
                </Link>
              ))}
              <Link
                className="landing-category-explore-all"
                href="/?sort=price-asc"
                data-analytics-event="home_explore_all_categories_click"
                data-analytics-section="home_categories"
                data-analytics-type="cta"
                data-analytics-label="explore_all_categories"
                data-analytics-destination="/?sort=price-asc"
                data-analytics-category="ring"
              >
                Explore all categories
                <MoveRight size={13} aria-hidden="true" />
              </Link>
            </div>
          </div>

      <div className={`catalog-split${selectedProduct ? " with-preview" : ""}`}>
        
        <div className="catalog-split-main">
          <section className="landing-discovery" aria-label="Discover jewellery">
            {discoveryShelves.map((shelf) => (
              <div key={shelf.id} className="discovery-shelf">
                <div className="discovery-shelf-head">
                  <h3 className="discovery-shelf-title">
                    <span
                      className="discovery-shelf-art"
                      style={{ backgroundImage: `url(${shelf.artSrc})` }}
                      aria-hidden="true"
                    />
                    {shelf.title}
                  </h3>
                  <Link
                    className="discovery-shelf-all"
                    href={shelf.href}
                    data-analytics-event="home_collection_view_all_click"
                    data-analytics-section="home_collection"
                    data-analytics-type="collection_cta"
                    data-analytics-label={shelf.title}
                    data-analytics-destination={shelf.href}
                    data-analytics-category="ring"
                  >
                    See all <MoveRight size={13} aria-hidden="true" />
                  </Link>
                </div>
                <div className="discovery-shelf-scroll">
                  {shelf.products.map((product) => {
                    const displayName = product.name.split("(")[0]?.trim() || product.name;
                    const productPath = buildProductDetailPath(product);
                    const brandSegment = getBrandSegment(product.brand) ?? "";
                    const brandLogo = BRAND_LOGOS[brandSegment as keyof typeof BRAND_LOGOS] ?? null;
                    return (
                      <Link
                        key={product.id}
                        href={productPath ?? "/?sort=price-asc"}
                        className={`discovery-product-card${selectedProduct?.id === product.id ? " is-selected" : ""}`}
                        onClick={(e) => { e.preventDefault(); setSelectedProduct(product); }}
                        data-analytics-event="home_collection_product_click"
                        data-analytics-section="home_collection"
                        data-analytics-type="featured_product"
                        data-analytics-label={shelf.title}
                        data-analytics-brand={product.brand}
                        data-analytics-product-id={String(product.id)}
                        data-analytics-product-name={displayName}
                        data-analytics-destination={productPath ?? "/?sort=price-asc"}
                        data-analytics-category={product.category}
                      >
                        <div className="discovery-product-image">
                          <img src={product.image} alt={`${displayName} by ${product.brand}`} loading="lazy" />
                        </div>
                        <div className="discovery-product-info">
                          <div className="discovery-product-brand-row">
                            {brandLogo && (
                              <img src={brandLogo} alt="" width={14} height={14} aria-hidden="true" className="discovery-product-brand-logo" />
                            )}
                            <span className="discovery-product-brand">{product.brand}</span>
                          </div>
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

      {finderOpen && (
        <div className="finder-overlay" role="dialog" aria-modal="true" aria-labelledby="finder-title">
          <div className="finder-modal">
            <button className="finder-close" type="button" onClick={closeFinder} aria-label="Close finder">
              <X size={20} aria-hidden="true" />
            </button>
            <div className="finder-progress" aria-label={`Question ${finderStep + 1} of ${FINDER_QUESTIONS.length}`}>
              <span style={{ width: `${((finderStep + 1) / FINDER_QUESTIONS.length) * 100}%` }} />
            </div>
            <div className="finder-heading">
              <span className="finder-step">Question {finderStep + 1} of {FINDER_QUESTIONS.length}</span>
              <h2 id="finder-title">{FINDER_QUESTIONS[finderStep].title}</h2>
              <p>{FINDER_QUESTIONS[finderStep].description}</p>
            </div>
            <div className={`finder-options${finderStep === 3 ? " is-visual" : ""}`}>
              {FINDER_QUESTIONS[finderStep].options.map(([label, value, visual]) => (
                <button
                  key={label}
                  type="button"
                  className="finder-option"
                  onClick={() => selectFinderOption(value)}
                >
                  <span className="finder-option-emoji" aria-hidden="true">{visual}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
            <div className="finder-footer">
              {finderStep > 0 ? (
                <button type="button" className="finder-back" onClick={() => setFinderStep((step) => step - 1)}>
                  <ArrowLeft size={15} aria-hidden="true" /> Back
                </button>
              ) : <span />}
              <span>Choose one to continue</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
