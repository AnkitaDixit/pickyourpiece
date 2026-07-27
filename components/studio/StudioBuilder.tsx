"use client";

import Image from "next/image";
import { toPng } from "html-to-image";
import { useCallback, useMemo, useRef, useState } from "react";
import { buildProductDetailPath } from "@/lib/product-seo";

type StudioTemplate = {
  id: string;
  label: string;
  description: string;
  width: number;
  height: number;
};

type ProductOption = {
  id: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  productUrl: string;
  category: string;
  style: string[];
};

type SortMode = "featured" | "price_asc" | "price_desc";
type CompareSideId = "left" | "right";

type BrandOption = {
  value: string;
  label: string;
};

type InstagramPostTemplateType = "compare_cards" | "similar_pieces" | "price_comparison" | "best_under_budget";

type StudioBuilderProps = {
  products: ProductOption[];
};

const TEMPLATES: StudioTemplate[] = [
  { id: "instagram_post", label: "Instagram Post", description: "Instagram original portrait 4:5", width: 1080, height: 1350 },
  { id: "instagram_carousel", label: "Instagram Carousel", description: "Portrait carousel slide", width: 1080, height: 1350 },
  { id: "pinterest_pin", label: "Pinterest Pin", description: "Tall discovery pin", width: 1000, height: 1500 },
  { id: "twitter", label: "Twitter", description: "Wide social card", width: 1600, height: 900 },
  { id: "facebook", label: "Facebook", description: "Feed-friendly card", width: 1200, height: 630 },
];

const INSTAGRAM_POST_TEMPLATE_OPTIONS: {
  id: InstagramPostTemplateType;
  label: string;
  description: string;
}[] = [
  {
    id: "compare_cards",
    label: "Compare Cards",
    description: "Side-by-side product comparison with direct price context.",
  },
  {
    id: "similar_pieces",
    label: "Similar Pieces",
    description: "Show 5 alternatives when someone likes a single design.",
  },
  {
    id: "price_comparison",
    label: "Price Comparison",
    description: "Compare similar style prices across brands at a glance.",
  },
  {
    id: "best_under_budget",
    label: "Best Under Budget",
    description: "Highlight top picks under a target budget bucket.",
  },
];

const COMPARE_SIDES: { id: CompareSideId; label: string }[] = [
  { id: "left", label: "Card A" },
  { id: "right", label: "Card B" },
];

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

const PICKYOURPIECE_SITE_URL = "https://www.pickyourpiece.com";

function toCurrency(value: number) {
  return `INR ${value.toLocaleString("en-IN")}`;
}

function buildHashtags(parts: string[]) {
  return parts
    .map((item) => item.trim().toLowerCase().replace(/[^a-z0-9]+/g, ""))
    .filter(Boolean)
    .map((item) => `#${item}`)
    .slice(0, 8)
    .join(" ");
}

function interleaveByBrand(items: ProductOption[]) {
  const buckets = new Map<string, ProductOption[]>();

  for (const item of items) {
    const key = (item.brand || "unknown").trim();
    const group = buckets.get(key);
    if (group) {
      group.push(item);
    } else {
      buckets.set(key, [item]);
    }
  }

  const brands = Array.from(buckets.keys()).sort((a, b) => a.localeCompare(b));
  const output: ProductOption[] = [];
  let hasItems = true;

  while (hasItems) {
    hasItems = false;
    for (const brand of brands) {
      const queue = buckets.get(brand);
      if (!queue || queue.length === 0) continue;

      const next = queue.shift();
      if (next) {
        output.push(next);
      }

      if (queue.length > 0) {
        hasItems = true;
      }
    }
  }

  return output;
}


function clampLabel(text: string, maxLength: number) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`;
}

function normalizeBrand(brand: string) {
  return brand.trim().toLowerCase();
}

function getBrandLogoSrc(brand: string | undefined) {
  if (!brand) return null;
  return BRAND_LOGOS[normalizeBrand(brand)] ?? null;
}

function getCaptionProductUrl(product: ProductOption | undefined) {
  if (!product) return "/";

  const detailPath = buildProductDetailPath(product);
  if (detailPath) {
    return `${PICKYOURPIECE_SITE_URL}${detailPath}`;
  }

  const normalizedName = product.name.trim().toLowerCase();
  if (normalizedName.includes("odalia") || normalizedName.includes("odilia")) {
    return "https://www.pickyourpiece.com/product/bluestone/the-odalia-ring-76891";
  }

  return product.productUrl ?? "/";
}

function hasImage(product: ProductOption | undefined) {
  return Boolean(product?.image && product.image.trim().length > 0);
}

function sortProducts(items: ProductOption[], sortMode: SortMode) {
  if (sortMode === "price_asc") {
    return [...items].sort((a, b) => a.price - b.price);
  }

  if (sortMode === "price_desc") {
    return [...items].sort((a, b) => b.price - a.price);
  }

  return items;
}

export default function StudioBuilder({
  products,
}: StudioBuilderProps) {
  const INITIAL_VISIBLE_PICKER_ITEMS = 120;
  const PICKER_BATCH_SIZE = 120;

  const previewCanvasRef = useRef<HTMLDivElement | null>(null);
  const [templateId, setTemplateId] = useState(TEMPLATES[0].id);
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id ?? "");
  const [compareRightProductId, setCompareRightProductId] = useState(products[1]?.id ?? products[0]?.id ?? "");
  const [compareSelectionTarget, setCompareSelectionTarget] = useState<CompareSideId>("left");
  const [compareSideFilters, setCompareSideFilters] = useState<Record<CompareSideId, { brand: string; sort: SortMode }>>({
    left: { brand: "all", sort: "featured" },
    right: { brand: "all", sort: "featured" },
  });
  const [selectedBrandFilter, setSelectedBrandFilter] = useState("all");
  const [priceSort, setPriceSort] = useState<SortMode>("featured");
  const [instagramPostTemplate, setInstagramPostTemplate] = useState<InstagramPostTemplateType>("compare_cards");
  const [budgetCap, setBudgetCap] = useState(50000);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [visiblePickerCount, setVisiblePickerCount] = useState(INITIAL_VISIBLE_PICKER_ITEMS);

  const template = useMemo(
    () => TEMPLATES.find((item) => item.id === templateId) ?? TEMPLATES[0],
    [templateId]
  );

  const ringProducts = useMemo(() => {
    const onlyRings = products.filter((product) => {
      const haystack = `${product.category} ${product.name} ${product.style.join(" ")}`.toLowerCase();
      return haystack.includes("ring");
    });

    return onlyRings.length > 0 ? onlyRings : products;
  }, [products]);

  const interleavedRingProducts = useMemo(() => interleaveByBrand(ringProducts), [ringProducts]);
  const isCompareCardsTemplate = templateId === "instagram_post" && instagramPostTemplate === "compare_cards";

  const ringBrandOptions = useMemo<BrandOption[]>(() => {
    const brandMap = new Map<string, string>();

    for (const product of ringProducts) {
      const rawBrand = (product.brand || "").trim();
      if (!rawBrand) continue;

      const key = normalizeBrand(rawBrand);
      if (!brandMap.has(key)) {
        brandMap.set(key, rawBrand);
      }
    }

    return Array.from(brandMap.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([value, label]) => ({ value, label }));
  }, [ringProducts]);

  const filteredProducts = useMemo(() => {
    const byBrand = selectedBrandFilter === "all"
      ? interleavedRingProducts
      : ringProducts.filter((product) => normalizeBrand(product.brand) === selectedBrandFilter);

    return sortProducts(byBrand, priceSort);
  }, [interleavedRingProducts, priceSort, ringProducts, selectedBrandFilter]);

  const comparePickerProducts = useMemo(() => {
    const activeSideFilter = compareSideFilters[compareSelectionTarget];
    const byBrand = activeSideFilter.brand === "all"
      ? interleavedRingProducts
      : ringProducts.filter((product) => normalizeBrand(product.brand) === activeSideFilter.brand);

    return sortProducts(byBrand, activeSideFilter.sort);
  }, [compareSelectionTarget, compareSideFilters, interleavedRingProducts, ringProducts]);

  const pickerProducts = isCompareCardsTemplate ? comparePickerProducts : filteredProducts;

  const displayedPickerProducts = useMemo(
    () => pickerProducts.slice(0, visiblePickerCount),
    [pickerProducts, visiblePickerCount]
  );

  const handlePickerScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const nearBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 220;

    if (!nearBottom) return;
    if (visiblePickerCount >= pickerProducts.length) return;

    setVisiblePickerCount((current) => Math.min(current + PICKER_BATCH_SIZE, pickerProducts.length));
  }, [pickerProducts.length, visiblePickerCount]);

  const selectedProduct = useMemo(
    () => ringProducts.find((item) => item.id === selectedProductId) ?? ringProducts[0] ?? products[0],
    [products, ringProducts, selectedProductId]
  );

  const compareRightProduct = useMemo(() => {
    const explicitRight = ringProducts.find((item) => item.id === compareRightProductId);
    if (explicitRight && explicitRight.id !== selectedProduct?.id) {
      return explicitRight;
    }

    const differentWithImage = ringProducts.find(
      (item) => item.id !== selectedProduct?.id && hasImage(item)
    );

    if (differentWithImage) {
      return differentWithImage;
    }

    return ringProducts.find((item) => item.id !== selectedProduct?.id) ?? selectedProduct;
  }, [compareRightProductId, ringProducts, selectedProduct]);

  const relatedProducts = useMemo(() => {
    const pool = filteredProducts.length ? filteredProducts : products;
    const base = selectedProduct ?? pool[0];
    if (!base) return pool.slice(0, 12);

    const sameCategory = pool.filter((item) => item.id !== base.id && item.category === base.category);
    const sameStyle = pool.filter(
      (item) =>
        item.id !== base.id &&
        item.style.some((styleItem) => base.style.includes(styleItem))
    );
    const fallback = pool.filter((item) => item.id !== base.id);

    const combined = [base, ...sameCategory, ...sameStyle, ...fallback];
    const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());
    return unique.slice(0, 20);
  }, [filteredProducts, products, selectedProduct]);

  const comparePair = useMemo(() => {
    const left = selectedProduct;
    const right = compareRightProduct ?? relatedProducts[1] ?? relatedProducts[0] ?? selectedProduct;
    return { left, right };
  }, [compareRightProduct, relatedProducts, selectedProduct]);

  const similarPieces = useMemo(() => relatedProducts.slice(0, 5), [relatedProducts]);

  const priceComparisonRows = useMemo(() => {
    const pool = relatedProducts.length ? relatedProducts : filteredProducts;
    const byBrand = new Map<string, ProductOption>();

    for (const product of pool) {
      const existing = byBrand.get(product.brand);
      if (!existing || product.price < existing.price) {
        byBrand.set(product.brand, product);
      }
      if (byBrand.size >= 5) break;
    }

    return Array.from(byBrand.values())
      .sort((a, b) => a.price - b.price)
      .slice(0, 3);
  }, [filteredProducts, relatedProducts]);

  const budgetProducts = useMemo(() => {
    const pool = (filteredProducts.length ? filteredProducts : products).filter((item) => item.price <= budgetCap);
    return pool.slice(0, 4);
  }, [budgetCap, filteredProducts, products]);

  const instagramPostInfo = useMemo(() => {
    const left = comparePair.left;
    const right = comparePair.right;
    const compareBrands = left && right ? `${left.brand} vs ${right.brand}` : "Compare Across Brands";
    const budgetStyle = "Rings";

    if (instagramPostTemplate === "compare_cards") {
      const leftName = left?.name ?? "Product A";
      const rightName = right?.name ?? "Product B";
      const leftUrl = getCaptionProductUrl(left);
      const rightUrl = getCaptionProductUrl(right);

      return {
        title: compareBrands,
        subtitle: `${leftName} vs ${rightName}`,
        caption: `PickYourPiece helps you compare jewellery across brands in one place. Explore rings, earrings, pendants, and bracelets with smart filters, price range, and live catalog updates. Compare ${left?.brand ?? "Brand A"} and ${right?.brand ?? "Brand B"} side by side before buying.\n\nProducts in this comparison:\n1. ${leftName} - ${leftUrl}\n2. ${rightName} - ${rightUrl}`,
        hashtags: buildHashtags(["pickyourpiece", left?.brand ?? "BrandA", right?.brand ?? "BrandB", "CompareRings", "JewelleryComparison"]),
        cta: "/?q=ring",
      };
    }

    if (instagramPostTemplate === "similar_pieces") {
      return {
        title: "Love this ring?",
        subtitle: "Here are 5 similar ones.",
        caption: "Found a design you like? Compare similar alternatives in seconds.",
        hashtags: buildHashtags([selectedProduct?.brand ?? "Jewellery", "SimilarRings", "RingAlternatives", "PickYourPiece"]),
        cta: selectedProduct?.productUrl ?? "/",
      };
    }

    if (instagramPostTemplate === "price_comparison") {
      return {
        title: "Same Style",
        subtitle: "Different prices across brands",
        caption: "Price differences can be huge for similar styles. Compare before checkout.",
        hashtags: buildHashtags(["Rings", "PriceComparison", "JewelleryDeals", "PickYourPiece"]),
        cta: "/?sort=price-asc",
      };
    }

    return {
      title: `Best ${budgetStyle}`,
      subtitle: `Under ${toCurrency(budgetCap)}`,
      caption: `Top ${budgetStyle.toLowerCase()} picks under ${toCurrency(budgetCap)}.`,
      hashtags: buildHashtags([budgetStyle, "UnderBudget", "SmartBuy", "PickYourPiece"]),
      cta: `/?maxPrice=${budgetCap}`,
    };
  }, [
    budgetCap,
    comparePair.left,
    comparePair.right,
    instagramPostTemplate,
    selectedProduct,
  ]);

  const draft = useMemo(() => {
    if (templateId === "instagram_post") {
      return {
        title: instagramPostInfo.title,
        caption: instagramPostInfo.caption,
        hashtags: instagramPostInfo.hashtags,
        cta: instagramPostInfo.cta,
        image: selectedProduct?.image ?? "",
      };
    }

    if (selectedProduct) {
      const title = `${selectedProduct.name} | ${selectedProduct.brand}`;
      const caption = `Spotlight: ${selectedProduct.name} by ${selectedProduct.brand} at ${toCurrency(selectedProduct.price)}. Compare options before you buy on PickYourPiece.`;
      const hashtags = buildHashtags([
        selectedProduct.brand,
        selectedProduct.category,
        ...selectedProduct.style,
        "PickYourPiece",
      ]);
      return {
        title,
        caption,
        hashtags,
        cta: selectedProduct.productUrl,
        image: selectedProduct.image,
      };
    }

    return {
      title: "PickYourPiece Social Draft",
      caption: "Create and ship social creatives directly from your internal studio.",
      hashtags: "#PickYourPiece",
      cta: "/",
      image: "",
    };
  }, [
    instagramPostInfo.caption,
    instagramPostInfo.cta,
    instagramPostInfo.hashtags,
    instagramPostInfo.title,
    selectedProduct,
    templateId,
  ]);

  const previewRatio = `${template.width} / ${template.height}`;

  const copyText = async (value: string) => {
    if (!value || typeof navigator === "undefined" || !navigator.clipboard) return;
    await navigator.clipboard.writeText(value);
  };

  const downloadPreviewPng = async () => {
    if (typeof document === "undefined") return;
    const previewNode = previewCanvasRef.current;
    if (!previewNode) return;

    setDownloadError("");
    setIsDownloading(true);

    try {
      const exportWidth = templateId === "instagram_post" ? 1080 : template.width;
      const exportHeight = templateId === "instagram_post" ? 1350 : template.height;
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      // Render directly at target export dimensions to avoid blurry upscaling.
      const dataUrl = await toPng(previewNode, {
        cacheBust: true,
        pixelRatio: 1,
        backgroundColor: "#ffffff",
        canvasWidth: exportWidth,
        canvasHeight: exportHeight,
      });

      const fileBase = `${template.id}-${instagramPostTemplate}-rings-preview`;
      const safeFile = fileBase.replace(/[^a-z0-9_-]+/gi, "-").toLowerCase();
      const anchor = document.createElement("a");
      anchor.href = dataUrl;
      anchor.download = `${safeFile}.png`;
      anchor.click();
    } catch {
      setDownloadError("Could not generate PNG from preview styles. Try a different product image if CORS blocks capture.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="studio-shell">
      <aside className="studio-controls">
        <div className="studio-control-group">
          <label htmlFor="studio-template">Format</label>
          <select id="studio-template" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
            {TEMPLATES.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
          <p>{template.description} • {template.width} x {template.height}</p>
        </div>

        {templateId === "instagram_post" ? (
          <div className="studio-control-group">
            <label htmlFor="studio-instagram-template">Template Type</label>
            <select
              id="studio-instagram-template"
              value={instagramPostTemplate}
              onChange={(e) => setInstagramPostTemplate(e.target.value as InstagramPostTemplateType)}
            >
              {INSTAGRAM_POST_TEMPLATE_OPTIONS.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
            <p>{INSTAGRAM_POST_TEMPLATE_OPTIONS.find((item) => item.id === instagramPostTemplate)?.description}</p>
          </div>
        ) : null}

        {templateId === "instagram_post" && instagramPostTemplate === "best_under_budget" ? (
          <div className="studio-control-group">
            <label htmlFor="studio-budget-cap">Budget Cap (INR)</label>
            <input
              id="studio-budget-cap"
              type="number"
              min={1000}
              step={500}
              value={budgetCap}
              onChange={(e) => setBudgetCap(Number(e.target.value) || 50000)}
            />
          </div>
        ) : null}

        <div className="studio-control-group">
          <label>Ring Catalog</label>
          <p>Showing all ring products with preview thumbnails.</p>
        </div>
        {isCompareCardsTemplate ? (
          <div className="studio-compare-picker-target" role="group" aria-label="Compare card image selection">
            {COMPARE_SIDES.map((side) => (
              <button
                key={side.id}
                type="button"
                className={compareSelectionTarget === side.id ? "active" : ""}
                onClick={() => {
                  setCompareSelectionTarget(side.id);
                  setVisiblePickerCount(INITIAL_VISIBLE_PICKER_ITEMS);
                }}
              >
                Select {side.label}
              </button>
            ))}
            <div className="studio-picker-toolbar">
              <div className="studio-control-group">
                <label htmlFor="studio-compare-brand-filter">Brand ({compareSelectionTarget === "left" ? "A" : "B"})</label>
                <select
                  id="studio-compare-brand-filter"
                  value={compareSideFilters[compareSelectionTarget].brand}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCompareSideFilters((current) => ({
                      ...current,
                      [compareSelectionTarget]: {
                        ...current[compareSelectionTarget],
                        brand: value,
                      },
                    }));
                    setVisiblePickerCount(INITIAL_VISIBLE_PICKER_ITEMS);
                  }}
                >
                  <option value="all">All brands</option>
                  {ringBrandOptions.map((brand) => (
                    <option key={`compare-${brand.value}`} value={brand.value}>{brand.label}</option>
                  ))}
                </select>
              </div>
              <div className="studio-control-group">
                <label htmlFor="studio-compare-price-sort">Sort ({compareSelectionTarget === "left" ? "A" : "B"})</label>
                <select
                  id="studio-compare-price-sort"
                  value={compareSideFilters[compareSelectionTarget].sort}
                  onChange={(e) => {
                    const value = e.target.value as SortMode;
                    setCompareSideFilters((current) => ({
                      ...current,
                      [compareSelectionTarget]: {
                        ...current[compareSelectionTarget],
                        sort: value,
                      },
                    }));
                    setVisiblePickerCount(INITIAL_VISIBLE_PICKER_ITEMS);
                  }}
                >
                  <option value="featured">Featured</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>
            </div>
            <p>Pick products from the list for each compare card.</p>
          </div>
        ) : (
          <div className="studio-picker-toolbar">
            <div className="studio-control-group">
              <label htmlFor="studio-brand-filter">Brand Filter</label>
              <select
                id="studio-brand-filter"
                value={selectedBrandFilter}
                onChange={(e) => {
                  setSelectedBrandFilter(e.target.value);
                  setVisiblePickerCount(INITIAL_VISIBLE_PICKER_ITEMS);
                }}
              >
                <option value="all">All brands</option>
                {ringBrandOptions.map((brand) => (
                  <option key={brand.value} value={brand.value}>{brand.label}</option>
                ))}
              </select>
            </div>
            <div className="studio-control-group">
              <label htmlFor="studio-price-sort">Price Sort</label>
              <select
                id="studio-price-sort"
                value={priceSort}
                onChange={(e) => {
                  setPriceSort(e.target.value as SortMode);
                  setVisiblePickerCount(INITIAL_VISIBLE_PICKER_ITEMS);
                }}
              >
                <option value="featured">Featured</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        )}
        <div
          className="studio-list-picker"
          role="listbox"
          aria-label="Products"
          onScroll={handlePickerScroll}
        >
          {displayedPickerProducts.map((product) => {
            const isLeftSelected = product.id === selectedProductId;
            const isRightSelected = product.id === compareRightProduct?.id;
            const buttonClass = [
              isLeftSelected ? "active-left" : "",
              isRightSelected ? "active-right" : "",
            ].filter(Boolean).join(" ");

            return (
            <button
              key={product.id}
              type="button"
              className={buttonClass}
              onClick={() => {
                if (templateId === "instagram_post" && instagramPostTemplate === "compare_cards") {
                  if (compareSelectionTarget === "right") {
                    if (product.id === selectedProductId) {
                      const alternateLeft = ringProducts.find((item) => item.id !== product.id && hasImage(item))
                        ?? ringProducts.find((item) => item.id !== product.id);
                      if (alternateLeft) {
                        setSelectedProductId(alternateLeft.id);
                      }
                    }
                    setCompareRightProductId(product.id);
                    return;
                  }

                  if (product.id === compareRightProductId) {
                    const alternateRight = ringProducts.find((item) => item.id !== product.id && hasImage(item))
                      ?? ringProducts.find((item) => item.id !== product.id);
                    if (alternateRight) {
                      setCompareRightProductId(alternateRight.id);
                    }
                  }
                }

                setSelectedProductId(product.id);
              }}
            >
              <div className="studio-picker-row">
                <div className="studio-picker-thumb">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      unoptimized
                      sizes="72px"
                    />
                  ) : null}
                </div>
                <div className="studio-picker-copy">
                  <span>{product.name}</span>
                  <small>{product.brand} • {product.category} • {toCurrency(product.price)}</small>
                </div>
              </div>
            </button>
            );
          })}
          {visiblePickerCount < pickerProducts.length ? (
            <p className="studio-picker-loading">Loading more rings...</p>
          ) : null}
        </div>
      </aside>

      <section className="studio-preview">
        <div ref={previewCanvasRef} className="studio-preview-canvas" style={{ aspectRatio: previewRatio }}>
          {templateId === "instagram_post" ? (
            <div className={`studio-ig-post studio-ig-post-${instagramPostTemplate}`}>
              {instagramPostTemplate === "compare_cards" ? (
                <>
                  <div className="studio-ig-header">
                    <h2>What&apos;s your <span className="studio-ig-pick-word">Pick</span>?</h2>
                    <p>{instagramPostInfo.subtitle}</p>
                  </div>
                  <div className="studio-ig-compare-row">
                    <article key={comparePair.left?.id ?? "left-placeholder"} className="studio-ig-card">
                      <span className="studio-ig-card-badge">
                        {getBrandLogoSrc(comparePair.left?.brand) ? (
                          <Image
                            src={getBrandLogoSrc(comparePair.left?.brand) ?? ""}
                            alt={`${comparePair.left?.brand ?? "Brand"} badge logo`}
                            width={38}
                            height={11}
                            className="studio-ig-card-badge-logo"
                            unoptimized
                          />
                        ) : "A"}
                      </span>
                      {comparePair.left?.image ? (
                        <Image
                          src={comparePair.left.image}
                          alt={comparePair.left.name}
                          fill
                          unoptimized
                          sizes="(max-width: 1000px) 40vw, 280px"
                        />
                      ) : (
                        <div className="studio-ig-card-empty">No image available</div>
                      )}
                      <div className="studio-ig-card-copy">
                        <div className="studio-ig-card-brand">
                          <span className="studio-ig-card-brand-name">{comparePair.left?.brand ?? "Brand"}</span>
                        </div>
                        <p>{clampLabel(comparePair.left?.name ?? "Product", 34)}</p>
                        <strong>{toCurrency(comparePair.left?.price ?? 0)}</strong>
                      </div>
                    </article>
                    <span className="studio-ig-vs">VS</span>
                    <article key={comparePair.right?.id ?? "right-placeholder"} className="studio-ig-card">
                      <span className="studio-ig-card-badge">
                        {getBrandLogoSrc(comparePair.right?.brand) ? (
                          <Image
                            src={getBrandLogoSrc(comparePair.right?.brand) ?? ""}
                            alt={`${comparePair.right?.brand ?? "Brand"} badge logo`}
                            width={38}
                            height={11}
                            className="studio-ig-card-badge-logo"
                            unoptimized
                          />
                        ) : "B"}
                      </span>
                      {comparePair.right?.image ? (
                        <Image
                          src={comparePair.right.image}
                          alt={comparePair.right.name}
                          fill
                          unoptimized
                          sizes="(max-width: 1000px) 40vw, 280px"
                        />
                      ) : (
                        <div className="studio-ig-card-empty">No image available</div>
                      )}
                      <div className="studio-ig-card-copy">
                        <div className="studio-ig-card-brand">
                          <span className="studio-ig-card-brand-name">{comparePair.right?.brand ?? "Brand"}</span>
                        </div>
                        <p>{clampLabel(comparePair.right?.name ?? "Product", 34)}</p>
                        <strong>{toCurrency(comparePair.right?.price ?? 0)}</strong>
                      </div>
                    </article>
                  </div>
                  <p className="studio-ig-cta">Compare 30+ more similar rings {"->"}</p>
                </>
              ) : null}

              {instagramPostTemplate === "similar_pieces" ? (
                <>
                  <div className="studio-ig-header">
                    <h2>Love this ring?</h2>
                    <p>Here are 5 similar ones.</p>
                  </div>
                  <div className="studio-ig-grid-five">
                    {similarPieces.map((product) => (
                      <article key={product.id} className="studio-ig-piece">
                        {product.image ? (
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            unoptimized
                            sizes="(max-width: 1000px) 30vw, 190px"
                          />
                        ) : null}
                      </article>
                    ))}
                  </div>
                  <p className="studio-ig-cta">Compare them {"->"}</p>
                </>
              ) : null}

              {instagramPostTemplate === "price_comparison" ? (
                <>
                  <div className="studio-ig-header">
                    <h2>Same Style</h2>
                  </div>
                  <div className="studio-ig-price-list">
                    {priceComparisonRows.map((product) => (
                      <div key={product.id} className="studio-ig-price-row">
                        <span>{product.brand}</span>
                        <strong>{toCurrency(product.price)}</strong>
                      </div>
                    ))}
                  </div>
                  <p className="studio-ig-cta">Compare all {"->"}</p>
                </>
              ) : null}

              {instagramPostTemplate === "best_under_budget" ? (
                <>
                  <div className="studio-ig-header">
                    <h2>{instagramPostInfo.title}</h2>
                    <p>{instagramPostInfo.subtitle}</p>
                  </div>
                  <div className="studio-ig-grid-four">
                    {budgetProducts.map((product) => (
                      <article key={product.id} className="studio-ig-piece">
                        {product.image ? (
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            unoptimized
                            sizes="(max-width: 1000px) 35vw, 220px"
                          />
                        ) : null}
                      </article>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <>
              {draft.image ? (
                <Image
                  src={draft.image}
                  alt={draft.title}
                  fill
                  unoptimized
                  sizes="(max-width: 1000px) 100vw, 620px"
                />
              ) : null}
              <div className="studio-preview-overlay" />
              <div className="studio-preview-copy">
                <p className="studio-preview-kicker">{template.label}</p>
                <h2>{draft.title}</h2>
                <p>{draft.caption}</p>
                <small>{draft.hashtags}</small>
              </div>
            </>
          )}
        </div>

        <div className="studio-output">
          <h3>Draft Output</h3>
          <label>Caption</label>
          <textarea readOnly value={`${draft.caption}\n\n${draft.hashtags}`} />

          <label>Target URL</label>
          <input readOnly value={draft.cta} />

          <div className="studio-output-actions">
            <button type="button" onClick={() => void copyText(`${draft.caption}\n\n${draft.hashtags}`)}>Copy Caption</button>
            <button type="button" onClick={() => void copyText(draft.cta)}>Copy URL</button>
            <button type="button" onClick={() => void downloadPreviewPng()} disabled={isDownloading}>
              {isDownloading ? "Generating PNG..." : "Download PNG"}
            </button>
            <a href={draft.cta} target="_blank" rel="noopener noreferrer">Open Link</a>
          </div>
          {downloadError ? <p className="studio-download-error">{downloadError}</p> : null}
        </div>
      </section>
    </div>
  );
}
