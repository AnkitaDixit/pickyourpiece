"use client";

import Link from "next/link";
import { ArrowLeft, Building2, Gift, Hand, MoveRight, RefreshCw, ShieldCheck, Sparkles, Tag, WalletCards, X } from "lucide-react";
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

const HAND_QUIZ_QUESTIONS = [
  {
    title: "How would you describe your fingers?",
    options: [
      ["Short & petite", "short", "🤏"],
      ["Long & slender", "long", "🤲"],
      ["Medium / proportional", "medium", "🖐️"],
      ["I’m not sure", "unsure", "✨"],
    ],
  },
  {
    title: "How would you describe the overall shape of your hand?",
    options: [
      ["Wide / broad", "wide", "🖐️"],
      ["Narrow / slim", "narrow", "🤚"],
      ["Long / rectangular", "rectangular", "📐"],
      ["Rounded / soft", "rounded", "🌸"],
    ],
  },
  {
    title: "What kind of visual effect do you want from your ring?",
    options: [
      ["Make my fingers look longer", "longer", "↕️"],
      ["Make my fingers look more delicate", "delicate", "✨"],
      ["Make my hands look more balanced", "balanced", "⚖️"],
      ["I just want the ring to look beautiful", "beautiful", "💍"],
    ],
  },
  {
    title: "What kind of ring style do you usually prefer?",
    options: [
      ["Minimal & delicate", "minimal", "🌿"],
      ["Classic & elegant", "classic", "🤍"],
      ["Bold & glamorous", "bold", "🔥"],
      ["Unique & statement-making", "statement", "🎨"],
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

type HandQuizAnswers = {
  fingers?: string;
  handShape?: string;
  visualEffect?: string;
  style?: string;
};

type HandQuizResult = {
  title: string;
  description: string;
  bestFor: string;
  tips: string;
  styleOccasions: string[];
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
  const [handQuizOpen, setHandQuizOpen] = useState(false);
  const [handQuizStep, setHandQuizStep] = useState(0);
  const [handQuizAnswers, setHandQuizAnswers] = useState<HandQuizAnswers>({});
  const [handQuizResult, setHandQuizResult] = useState<HandQuizResult | null>(null);

  const closeFinder = () => {
    setFinderOpen(false);
    setFinderStep(0);
    setFinderAnswers({});
  };

  const closeHandQuiz = () => {
    setHandQuizOpen(false);
    setHandQuizStep(0);
    setHandQuizAnswers({});
    setHandQuizResult(null);
  };

  const getHandQuizResult = (answers: HandQuizAnswers): HandQuizResult => {
    const styleOccasions = new Set<string>();
    const addStyle = (value: string | undefined) => {
      if (value) styleOccasions.add(value);
    };

    if (answers.fingers === "short") addStyle("Daily Wear");
    if (answers.fingers === "long" || answers.fingers === "medium") addStyle("Modern & Classic");
    if (answers.handShape === "narrow") addStyle("Daily Wear");
    if (answers.handShape === "wide" || answers.handShape === "rectangular") addStyle("Modern & Classic");
    if (answers.handShape === "rounded") addStyle("Romantic & Gifting");
    if (answers.visualEffect === "longer" || answers.visualEffect === "balanced") addStyle("Modern & Classic");
    if (answers.visualEffect === "delicate") addStyle("Daily Wear");
    if (answers.style === "minimal") addStyle("Daily Wear");
    if (answers.style === "classic") addStyle("Modern & Classic");
    if (answers.style === "bold") addStyle("Party & Statement");
    if (answers.style === "statement") addStyle("Nature & Artistic");

    if (answers.fingers === "short" || answers.visualEffect === "longer" || answers.handShape === "rectangular") {
      return {
        title: "Elongated & Elegant",
        description: "Your proportions are especially suited to oval, pear and marquise-shaped rings, which can create a longer, more elongated appearance.",
        bestFor: "Oval • Pear • Marquise",
        tips: "Slim bands • Elongated stones • Vertical settings",
        styleOccasions: Array.from(styleOccasions),
      };
    }

    if (answers.visualEffect === "delicate" || answers.style === "minimal" || answers.handShape === "narrow") {
      return {
        title: "Delicate & Refined",
        description: "Your style shines with graceful silhouettes and lighter details that keep your hands looking effortlessly elegant.",
        bestFor: "Round • Cushion • Petite cluster",
        tips: "Slim bands • Fine pavé • Low-profile settings",
        styleOccasions: Array.from(styleOccasions),
      };
    }

    if (answers.visualEffect === "balanced" || answers.style === "bold" || answers.handShape === "wide") {
      return {
        title: "Balanced & Beautiful",
        description: "Proportional designs and confident details can bring beautiful balance to your hand shape.",
        bestFor: "Cushion • Emerald • Oval",
        tips: "Medium-width bands • Halo settings • Symmetrical designs",
        styleOccasions: Array.from(styleOccasions),
      };
    }

    return {
      title: "Effortlessly Beautiful",
      description: "You have the freedom to explore a wide range of silhouettes. Start with the shapes and details that make you feel most like yourself.",
      bestFor: "Oval • Round • Cushion",
      tips: "Try different proportions • Mix textures • Choose what feels like you",
      styleOccasions: Array.from(styleOccasions),
    };
  };

  const completeHandQuiz = (result: HandQuizResult) => {
    const params = new URLSearchParams({ sort: "relevant" });
    for (const styleOccasion of result.styleOccasions) {
      params.append("styleOccasion", styleOccasion);
    }
    window.location.assign(`/ring?${params.toString()}`);
  };

  const selectHandQuizOption = (value: string) => {
    const keys: (keyof HandQuizAnswers)[] = ["fingers", "handShape", "visualEffect", "style"];
    const nextAnswers = { ...handQuizAnswers, [keys[handQuizStep]]: value };
    setHandQuizAnswers(nextAnswers);
    if (handQuizStep === HAND_QUIZ_QUESTIONS.length - 1) {
      setHandQuizResult(getHandQuizResult(nextAnswers));
      return;
    }
    setHandQuizStep((step) => step + 1);
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
            Compare across brands.
            <span>Find your Perfect Piece.</span>
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
          

          <div
            className="landing-feature-cards"
            aria-label="Ways to discover jewellery"
            data-analytics-section="home_feature_cards"
            data-analytics-type="feature_card_group"
          >
            <article className="landing-feature-card landing-feature-card-budget">
              <WalletCards className="landing-feature-card-icon" size={27} strokeWidth={1.8} aria-hidden="true" />
              <h2>Finds by Budget</h2>
              <p>Find the best pieces in your budget.</p>
              <div className="landing-feature-card-budget-links">
                <div className="landing-feature-card-actions">
                  <Link
                    href="/?maxPrice=25000"
                    data-analytics-event="home_feature_card_budget_click"
                    data-analytics-section="home_feature_cards"
                    data-analytics-type="budget_option"
                    data-analytics-label="under_25k"
                    data-analytics-destination="/?maxPrice=25000"
                  >
                    Under ₹25k <MoveRight size={14} aria-hidden="true" />
                  </Link>
                  <Link
                    href="/?maxPrice=100000"
                    data-analytics-event="home_feature_card_budget_click"
                    data-analytics-section="home_feature_cards"
                    data-analytics-type="budget_option"
                    data-analytics-label="under_1_lakh"
                    data-analytics-destination="/?maxPrice=100000"
                  >
                    Under ₹1 Lakh <MoveRight size={14} aria-hidden="true" />
                  </Link>
                  {/* <Link href="/?minPrice=100000">₹1 Lakh+ <MoveRight size={14} aria-hidden="true" /></Link> */}
                </div>
                <Link
                  className="landing-feature-card-cta"
                  href="/?sort=price-asc"
                  data-analytics-event="home_feature_card_explore_all_click"
                  data-analytics-section="home_feature_cards"
                  data-analytics-type="feature_card_cta"
                  data-analytics-label="explore_all_budget"
                  data-analytics-destination="/?sort=price-asc"
                >
                  Explore all <MoveRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </article>

            
            <article className="landing-feature-card landing-feature-card-personalized">
              <Sparkles className="landing-feature-card-icon" size={27} strokeWidth={1.8} aria-hidden="true" />
              <h2>Personalized Picks</h2>
              <p>Answer 5 quick questions and get picks just for you.</p>
              <button
                className="landing-feature-card-primary-cta"
                type="button"
                onClick={() => setFinderOpen(true)}
                data-analytics-event="home_feature_card_finder_click"
                data-analytics-section="home_feature_cards"
                data-analytics-type="feature_card_cta"
                data-analytics-label="find_my_perfect_piece"
                data-analytics-destination="/ring"
              >
                Find My Perfect Piece
              </button>
              <small>◷ Takes 30 seconds</small>
            </article>

            <article className="landing-feature-card landing-feature-card-hand-quiz">
              <Hand className="landing-feature-card-icon" size={27} strokeWidth={1.8} aria-hidden="true" />
              <h2>Free Hand Type Quiz</h2>
              <p>Find the perfect ring for your hand type with 4 quick questions.</p>
              <button
                className="landing-feature-card-primary-cta"
                type="button"
                onClick={() => setHandQuizOpen(true)}
                data-analytics-event="home_feature_card_hand_quiz_click"
                data-analytics-section="home_feature_cards"
                data-analytics-type="feature_card_cta"
                data-analytics-label="free_ring_fit_quiz"
                data-analytics-destination="/ring"
              >
                Take the free quiz
              </button>
              <small>No sign-up required</small>
            </article>
{/* 
            <article className="landing-feature-card studio-ig-post studio-ig-post-compare_cards landing-feature-card-compare">
            
                <Sparkles className="landing-feature-card-icon" size={27} strokeWidth={1.8} aria-hidden="true" />
          <h2>Compare and Choose</h2>
             
              <div className="landing-compare-row">
                {trendingProducts.slice(0, 2).map((product, index) => (
                  <div className="landing-compare-card" key={product.id}>
                    <b>{index === 0 ? "A" : "B"}</b>
                    <img src={product.image} alt="" loading="lazy" />
                    <small>{product.brand}</small>
                    <strong>₹{product.price.toLocaleString("en-IN")}</strong>
                  </div>
                ))}
                <span className="landing-compare-vs">VS</span>
              </div>
              <Link className="landing-compare-cta" href="/ring">COMPARE NOW <MoveRight size={14} aria-hidden="true" /></Link>
            </article> */}

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
        <div
          className="finder-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="finder-title"
          data-analytics-event="home_finder_open"
          data-analytics-section="home_feature_cards"
          data-analytics-type="finder"
          data-analytics-label="find_my_perfect_piece"
        >
          <div className="finder-modal">
            <button
              className="finder-close"
              type="button"
              onClick={closeFinder}
              aria-label="Close finder"
              data-analytics-event="home_finder_close"
              data-analytics-section="home_feature_cards"
              data-analytics-type="finder_control"
              data-analytics-label="close"
            >
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
                  data-analytics-event="home_finder_question_answered"
                  data-analytics-section="home_feature_cards"
                  data-analytics-type="finder_question"
                  data-analytics-label={`question_${finderStep + 1}`}
                  data-analytics-value={value}
                >
                  <span className="finder-option-emoji" aria-hidden="true">{visual}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
            <div className="finder-footer">
              {finderStep > 0 ? (
                <button
                  type="button"
                  className="finder-back"
                  onClick={() => setFinderStep((step) => step - 1)}
                  data-analytics-event="home_finder_back"
                  data-analytics-section="home_feature_cards"
                  data-analytics-type="finder_control"
                  data-analytics-label={`question_${finderStep + 1}`}
                >
                  <ArrowLeft size={15} aria-hidden="true" /> Back
                </button>
              ) : <span />}
              <span>Choose one to continue</span>
            </div>
          </div>
        </div>
      )}

      {handQuizOpen && (
        <div
          className="finder-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="hand-quiz-title"
          data-analytics-event="home_hand_quiz_open"
          data-analytics-section="home_feature_cards"
          data-analytics-type="hand_quiz"
          data-analytics-label="free_ring_fit_quiz"
        >
          <div className="finder-modal">
            <button
              className="finder-close"
              type="button"
              onClick={closeHandQuiz}
              aria-label="Close ring fit quiz"
              data-analytics-event="home_hand_quiz_close"
              data-analytics-section="home_feature_cards"
              data-analytics-type="hand_quiz_control"
              data-analytics-label="close"
            >
              <X size={20} aria-hidden="true" />
            </button>
            <div className="finder-progress" aria-label={`Question ${handQuizStep + 1} of ${HAND_QUIZ_QUESTIONS.length}`}>
              <span style={{ width: `${((handQuizStep + 1) / HAND_QUIZ_QUESTIONS.length) * 100}%` }} />
            </div>
            <div className="finder-heading">
              {handQuizResult ? (
                <>
                  <span className="finder-step">Your result</span>
                  <h2 id="hand-quiz-title">Your best match: {handQuizResult.title}</h2>
                  <p>{handQuizResult.description}</p>
                </>
              ) : (
                <>
                  <span className="finder-step">Question {handQuizStep + 1} of {HAND_QUIZ_QUESTIONS.length}</span>
                  <h2 id="hand-quiz-title">{HAND_QUIZ_QUESTIONS[handQuizStep].title}</h2>
                  <p>Your answers help us surface ring styles that suit your proportions.</p>
                </>
              )}
            </div>
            {handQuizResult ? (
              <div className="hand-quiz-result">
                <div className="hand-quiz-result-section">
                  <strong>Best for you</strong>
                  <span>{handQuizResult.bestFor}</span>
                </div>
                <div className="hand-quiz-result-section">
                  <strong>Try</strong>
                  <span>{handQuizResult.tips}</span>
                </div>
                <button
                  type="button"
                  className="landing-feature-card-primary-cta"
                  onClick={() => completeHandQuiz(handQuizResult)}
                  data-analytics-event="home_hand_quiz_results_click"
                  data-analytics-section="home_feature_cards"
                  data-analytics-type="hand_quiz_cta"
                  data-analytics-label="see_rings_picked_for_hand"
                  data-analytics-destination="/ring"
                >
                  See rings picked for your hand <MoveRight size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="finder-back hand-quiz-retake"
                  onClick={() => {
                    setHandQuizStep(0);
                    setHandQuizAnswers({});
                    setHandQuizResult(null);
                  }}
                >
                  Retake quiz
                </button>
              </div>
            ) : (
              <>
                <div className="finder-options">
                  {HAND_QUIZ_QUESTIONS[handQuizStep].options.map(([label, value, visual]) => (
                    <button
                      key={label}
                      type="button"
                      className="finder-option"
                      onClick={() => selectHandQuizOption(value)}
                      data-analytics-event="home_hand_quiz_answered"
                      data-analytics-section="home_feature_cards"
                      data-analytics-type="hand_quiz_question"
                      data-analytics-label={`question_${handQuizStep + 1}`}
                      data-analytics-value={value}
                    >
                      <span className="finder-option-emoji" aria-hidden="true">{visual}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
                <div className="finder-footer">
                  {handQuizStep > 0 ? (
                    <button
                      type="button"
                      className="finder-back"
                      onClick={() => setHandQuizStep((step) => step - 1)}
                      data-analytics-event="home_hand_quiz_back"
                      data-analytics-section="home_feature_cards"
                      data-analytics-type="hand_quiz_control"
                      data-analytics-label={`question_${handQuizStep + 1}`}
                    >
                      <ArrowLeft size={15} aria-hidden="true" /> Back
                    </button>
                  ) : <span />}
                  <span>Choose one to continue</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
