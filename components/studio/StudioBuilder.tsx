"use client";

import Image from "next/image";
import { toPng } from "html-to-image";
import { useCallback, useMemo, useRef, useState } from "react";
import { buildProductDetailPath } from "@/lib/product-seo";
import StudioCompareCard from "@/components/studio/StudioCompareCard";
import StudioCompareFooter from "@/components/studio/StudioCompareFooter";
import StudioSideControlPanel, {
  type SideFilterState,
  type SideFrameState,
} from "@/components/studio/StudioSideControlPanel";

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
  allImages?: string[] | string;
  productUrl: string;
  category: string;
  style: string[];
  gemstone: string[];
  metal: string;
  color: string;
};

type SortMode = "featured" | "price_asc" | "price_desc";
type CompareSideId = "left" | "right";
type SimilarSlotId = "slot1" | "slot2" | "slot3" | "slot4";

type BrandOption = {
  value: string;
  label: string;
};

type InstagramPostTemplateType = "compare_cards" | "similar_pieces" | "best_under_budget";

type StudioBuilderProps = {
  products: ProductOption[];
};

type ProductImageFrame = {
  x: number;
  y: number;
  zoom: number;
};

const DEFAULT_PRODUCT_IMAGE_FRAME: ProductImageFrame = {
  x: 0,
  y: 0,
  zoom: 1,
};

const IMAGE_FRAME_LIMITS = {
  x: { min: -120, max: 120, step: 1 },
  y: { min: -120, max: 120, step: 1 },
  zoom: { min: 0.6, max: 2.4, step: 0.01 },
} as const;

function clampFrameValue(kind: keyof ProductImageFrame, value: number) {
  const bounds = IMAGE_FRAME_LIMITS[kind];
  return Math.min(bounds.max, Math.max(bounds.min, value));
}

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
    description: "Show 4 alternatives when someone likes a single design.",
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

const SIMILAR_SLOTS: { id: SimilarSlotId; label: string }[] = [
  { id: "slot1", label: "Image 1" },
  { id: "slot2", label: "Image 2" },
  { id: "slot3", label: "Image 3" },
  { id: "slot4", label: "Image 4" },
];

const PICKYOURPIECE_SITE_URL = "https://www.pickyourpiece.com";

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

function createDefaultSideFilter(): SideFilterState {
  return {
    query: "",
    brand: "all",
    gemstone: "all",
    style: "all",
    metal: "all",
    color: "all",
    sort: "featured",
  };
}

function toCurrency(value: number) {
  return `INR ${value.toLocaleString("en-IN")}`;
}

function getBrandBadgeText(brand: string) {
  return brand
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

function getBrandKey(brand: string) {
  return brand.toLowerCase().replace(/\s+/g, "");
}

function buildHashtags(parts: string[]) {
  return parts
    .map((item) => item.trim().toLowerCase().replace(/[^a-z0-9]+/g, ""))
    .filter(Boolean)
    .map((item) => `#${item}`)
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

function normalizeFacetKey(value: string) {
  return value.trim().toLowerCase();
}

function toFacetOptions(values: string[]): BrandOption[] {
  const bucket = new Map<string, string>();

  for (const raw of values) {
    const clean = raw.trim();
    if (!clean) continue;

    const key = normalizeFacetKey(clean);
    if (!bucket.has(key)) {
      bucket.set(key, clean);
    }
  }

  return Array.from(bucket.entries())
    .sort((a, b) => a[1].localeCompare(b[1]))
    .map(([value, label]) => ({ value, label }));
}

function bumpQueryParamSize(url: string, key: string, target: number) {
  const pattern = new RegExp(`([?&])(${key})=(\\d+)`, "gi");
  return url.replace(pattern, (_match, sep: string, paramKey: string, value: string) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric >= target) {
      return `${sep}${paramKey}=${value}`;
    }
    return `${sep}${paramKey}=${target}`;
  });
}

function getHighResStudioImageUrl(url: string) {
  let upgraded = url;

  // Common jewellery CDN params used in this catalog.
  upgraded = bumpQueryParamSize(upgraded, "sw", 1600);
  upgraded = bumpQueryParamSize(upgraded, "sh", 1600);

  // Generic width/height query params used by many image providers.
  upgraded = bumpQueryParamSize(upgraded, "w", 1600);
  upgraded = bumpQueryParamSize(upgraded, "h", 1600);
  upgraded = bumpQueryParamSize(upgraded, "width", 1600);
  upgraded = bumpQueryParamSize(upgraded, "height", 1600);

  return upgraded;
}

function getStudioImageSrc(url: string | undefined) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) {
    const highResUrl = getHighResStudioImageUrl(url);
    return `/api/studio-image?url=${encodeURIComponent(highResUrl)}`;
  }
  return url;
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

function getCaptionImageUrl(imageUrl: string | undefined) {
  if (!imageUrl) return "";
  if (/^https?:\/\//i.test(imageUrl)) {
    return imageUrl;
  }

  const normalizedPath = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
  return `${PICKYOURPIECE_SITE_URL}${normalizedPath}`;
}

function hasImage(product: ProductOption | undefined) {
  return Boolean(product?.image && product.image.trim().length > 0);
}

function getProductImages(product: ProductOption | undefined): string[] {
  if (!product) return [];

  const fromAllImages = Array.isArray(product.allImages)
    ? product.allImages
    : typeof product.allImages === "string"
    ? [product.allImages]
    : [];

  const merged = [product.image, ...fromAllImages]
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);

  return Array.from(new Set(merged));
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
  const initialBudgetProducts = products.filter((product) => product.price <= 50000);
  const initialBudgetFallback = initialBudgetProducts.length > 0 ? initialBudgetProducts : products;

  const previewCanvasRef = useRef<HTMLDivElement | null>(null);
  const [templateId, setTemplateId] = useState(TEMPLATES[0].id);
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id ?? "");
  const [compareRightProductId, setCompareRightProductId] = useState(products[1]?.id ?? products[0]?.id ?? "");
  const [compareSelectionTarget, setCompareSelectionTarget] = useState<CompareSideId>("left");
  const [compareSideFilters, setCompareSideFilters] = useState<Record<CompareSideId, SideFilterState>>({
    left: createDefaultSideFilter(),
    right: createDefaultSideFilter(),
  });
  const [similarSelectionTarget, setSimilarSelectionTarget] = useState<SimilarSlotId>("slot1");
  const [similarSlotProductIds, setSimilarSlotProductIds] = useState<Record<SimilarSlotId, string>>({
    slot1: products[0]?.id ?? "",
    slot2: products[1]?.id ?? products[0]?.id ?? "",
    slot3: products[2]?.id ?? products[0]?.id ?? "",
    slot4: products[3]?.id ?? products[0]?.id ?? "",
  });
  const [similarSideFilters, setSimilarSideFilters] = useState<Record<SimilarSlotId, SideFilterState>>({
    slot1: createDefaultSideFilter(),
    slot2: createDefaultSideFilter(),
    slot3: createDefaultSideFilter(),
    slot4: createDefaultSideFilter(),
  });
  const [budgetSelectionTarget, setBudgetSelectionTarget] = useState<SimilarSlotId>("slot1");
  const [budgetSlotProductIds, setBudgetSlotProductIds] = useState<Record<SimilarSlotId, string>>({
    slot1: initialBudgetFallback[0]?.id ?? products[0]?.id ?? "",
    slot2: initialBudgetFallback[1]?.id ?? initialBudgetFallback[0]?.id ?? products[0]?.id ?? "",
    slot3: initialBudgetFallback[2]?.id ?? initialBudgetFallback[0]?.id ?? products[0]?.id ?? "",
    slot4: initialBudgetFallback[3]?.id ?? initialBudgetFallback[0]?.id ?? products[0]?.id ?? "",
  });
  const [budgetSideFilters, setBudgetSideFilters] = useState<Record<SimilarSlotId, SideFilterState>>({
    slot1: createDefaultSideFilter(),
    slot2: createDefaultSideFilter(),
    slot3: createDefaultSideFilter(),
    slot4: createDefaultSideFilter(),
  });
  const [selectedBrandFilter, setSelectedBrandFilter] = useState("all");
  const [priceSort, setPriceSort] = useState<SortMode>("featured");
  const [instagramPostTemplate, setInstagramPostTemplate] = useState<InstagramPostTemplateType>("compare_cards");
  const [budgetCap, setBudgetCap] = useState(50000);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [visiblePickerCount, setVisiblePickerCount] = useState(INITIAL_VISIBLE_PICKER_ITEMS);
  const [selectedImageIndexByProductId, setSelectedImageIndexByProductId] = useState<Record<string, number>>({});
  const [imageFrameByProductId, setImageFrameByProductId] = useState<Record<string, ProductImageFrame>>({});
  const [brokenBrandLogos, setBrokenBrandLogos] = useState<Record<string, true>>({});

  const getProductDisplayImage = useCallback((product: ProductOption | undefined) => {
    const images = getProductImages(product);
    if (images.length === 0) return "";
    if (!product) return images[0];

    const rawIndex = selectedImageIndexByProductId[product.id] ?? 0;
    const safeIndex = Math.min(Math.max(rawIndex, 0), images.length - 1);
    return images[safeIndex] ?? images[0];
  }, [selectedImageIndexByProductId]);

  const cycleProductImage = useCallback((product: ProductOption, delta: number) => {
    const images = getProductImages(product);
    if (images.length <= 1) return;

    setSelectedImageIndexByProductId((current) => {
      const currentIndex = current[product.id] ?? 0;
      const nextIndex = (currentIndex + delta + images.length) % images.length;
      return {
        ...current,
        [product.id]: nextIndex,
      };
    });
  }, []);

  const getProductImageFrame = useCallback((product: ProductOption | undefined): ProductImageFrame => {
    if (!product) return DEFAULT_PRODUCT_IMAGE_FRAME;

    const saved = imageFrameByProductId[product.id];
    if (!saved) return DEFAULT_PRODUCT_IMAGE_FRAME;

    return {
      x: clampFrameValue("x", saved.x),
      y: clampFrameValue("y", saved.y),
      zoom: clampFrameValue("zoom", saved.zoom),
    };
  }, [imageFrameByProductId]);

  const updateProductImageFrame = useCallback((
    productId: string,
    key: keyof ProductImageFrame,
    value: number
  ) => {
    const safeValue = clampFrameValue(key, value);
    setImageFrameByProductId((current) => {
      const existing = current[productId] ?? DEFAULT_PRODUCT_IMAGE_FRAME;
      return {
        ...current,
        [productId]: {
          ...existing,
          [key]: safeValue,
        },
      };
    });
  }, []);

  const resetProductImageFrame = useCallback((productId: string) => {
    setImageFrameByProductId((current) => {
      if (!current[productId]) return current;
      const next = { ...current };
      delete next[productId];
      return next;
    });
  }, []);

  const getProductImageStyle = useCallback((product: ProductOption | undefined) => {
    const frame = getProductImageFrame(product);
    return {
      objectFit: "cover" as const,
      objectPosition: `calc(50% + ${frame.x}px) calc(50% + ${frame.y}px)`,
      transform: `scale(${frame.zoom})`,
      transformOrigin: "center center",
    };
  }, [getProductImageFrame]);

  const renderBrandBadge = useCallback((brand: string) => {
    const brandKey = getBrandKey(brand);
    const logoSrc = BRAND_LOGOS[brandKey];
    const isBroken = Boolean(brokenBrandLogos[brandKey]);
    const canShowLogo = Boolean(logoSrc) && !isBroken;

    if (canShowLogo && logoSrc) {
      return (
        <span className="studio-ig-piece-brand-badge studio-ig-piece-brand-badge-has-image" aria-hidden="true">
          <Image
            src={getStudioImageSrc(logoSrc)}
            alt=""
            className="studio-ig-piece-brand-badge-img"
            width={14}
            height={14}
            loading="lazy"
            unoptimized
            sizes="14px"
            onError={() => {
              setBrokenBrandLogos((current) => ({
                ...current,
                [brandKey]: true,
              }));
            }}
          />
        </span>
      );
    }

    return <span className="studio-ig-piece-brand-badge" aria-hidden="true">{getBrandBadgeText(brand)}</span>;
  }, [brokenBrandLogos]);

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
  const isSimilarPiecesTemplate = templateId === "instagram_post" && instagramPostTemplate === "similar_pieces";
  const isBestUnderBudgetTemplate = templateId === "instagram_post" && instagramPostTemplate === "best_under_budget";

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

  const allCatalogBrandHashtagParts = useMemo(() => {
    const brandMap = new Map<string, string>();

    for (const product of products) {
      const rawBrand = (product.brand || "").trim();
      if (!rawBrand) continue;

      const key = normalizeBrand(rawBrand);
      if (!brandMap.has(key)) {
        brandMap.set(key, rawBrand);
      }
    }

    return Array.from(brandMap.values()).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const similarStyleOptions = useMemo<BrandOption[]>(() => {
    const styles = ringProducts.flatMap((product) => product.style ?? []);
    return toFacetOptions(styles);
  }, [ringProducts]);

  const similarGemstoneOptions = useMemo<BrandOption[]>(() => {
    const gemstones = ringProducts.flatMap((product) => product.gemstone ?? []);
    return toFacetOptions(gemstones);
  }, [ringProducts]);

  const compareMetalOptions = useMemo<BrandOption[]>(() => {
    const metals = ringProducts.map((product) => product.metal || "");
    return toFacetOptions(metals);
  }, [ringProducts]);

  const compareColorOptions = useMemo<BrandOption[]>(() => {
    const colors = ringProducts.map((product) => product.color || "");
    return toFacetOptions(colors);
  }, [ringProducts]);

  const filteredProducts = useMemo(() => {
    const byBrand = selectedBrandFilter === "all"
      ? interleavedRingProducts
      : ringProducts.filter((product) => normalizeBrand(product.brand) === selectedBrandFilter);

    return sortProducts(byBrand, priceSort);
  }, [interleavedRingProducts, priceSort, ringProducts, selectedBrandFilter]);

  const applySideFilter = useCallback((items: ProductOption[], activeSideFilter: SideFilterState) => {
    const byBrand = activeSideFilter.brand === "all"
      ? items
      : items.filter((product) => normalizeBrand(product.brand) === activeSideFilter.brand);

    const query = activeSideFilter.query.trim().toLowerCase();
    const filtered = byBrand.filter((product) => {
      if (activeSideFilter.gemstone !== "all") {
        const gemstoneMatch = (product.gemstone ?? []).some(
          (gemstone) => normalizeFacetKey(gemstone) === activeSideFilter.gemstone
        );
        if (!gemstoneMatch) return false;
      }

      if (activeSideFilter.style !== "all") {
        const styleMatch = (product.style ?? []).some(
          (style) => normalizeFacetKey(style) === activeSideFilter.style
        );
        if (!styleMatch) return false;
      }

      if (activeSideFilter.metal !== "all" && normalizeFacetKey(product.metal || "") !== activeSideFilter.metal) {
        return false;
      }

      if (activeSideFilter.color !== "all" && normalizeFacetKey(product.color || "") !== activeSideFilter.color) {
        return false;
      }

      if (!query) return true;

      const searchHaystack = [
        product.name,
        product.brand,
        product.category,
        ...(product.style ?? []),
        ...(product.gemstone ?? []),
        product.metal,
        product.color,
      ].join(" ").toLowerCase();

      return searchHaystack.includes(query);
    });

    return sortProducts(filtered, activeSideFilter.sort);
  }, []);

  const comparePickerProducts = useMemo(() => {
    const activeSideFilter = compareSideFilters[compareSelectionTarget];
    return applySideFilter(interleavedRingProducts, activeSideFilter);
  }, [applySideFilter, compareSelectionTarget, compareSideFilters, interleavedRingProducts]);

  const similarPickerProducts = useMemo(() => {
    const activeSideFilter = similarSideFilters[similarSelectionTarget];
    return applySideFilter(interleavedRingProducts, activeSideFilter);
  }, [applySideFilter, interleavedRingProducts, similarSelectionTarget, similarSideFilters]);

  const budgetEligibleProducts = useMemo(
    () => interleavedRingProducts.filter((product) => product.price <= budgetCap),
    [budgetCap, interleavedRingProducts]
  );

  const budgetPickerProducts = useMemo(() => {
    const activeSideFilter = budgetSideFilters[budgetSelectionTarget];
    return applySideFilter(budgetEligibleProducts, activeSideFilter);
  }, [applySideFilter, budgetEligibleProducts, budgetSelectionTarget, budgetSideFilters]);

  const updateCompareSideFilter = useCallback((
    side: CompareSideId,
    key: keyof SideFilterState,
    value: string | SortMode
  ) => {
    setCompareSideFilters((current) => ({
      ...current,
      [side]: {
        ...current[side],
        [key]: value,
      },
    }));
    setVisiblePickerCount(INITIAL_VISIBLE_PICKER_ITEMS);
  }, [INITIAL_VISIBLE_PICKER_ITEMS]);

  const updateSimilarSideFilter = useCallback((
    side: SimilarSlotId,
    key: keyof SideFilterState,
    value: string | SortMode
  ) => {
    setSimilarSideFilters((current) => ({
      ...current,
      [side]: {
        ...current[side],
        [key]: value,
      },
    }));
    setVisiblePickerCount(INITIAL_VISIBLE_PICKER_ITEMS);
  }, [INITIAL_VISIBLE_PICKER_ITEMS]);

  const updateBudgetSideFilter = useCallback((
    side: SimilarSlotId,
    key: keyof SideFilterState,
    value: string | SortMode
  ) => {
    setBudgetSideFilters((current) => ({
      ...current,
      [side]: {
        ...current[side],
        [key]: value,
      },
    }));
    setVisiblePickerCount(INITIAL_VISIBLE_PICKER_ITEMS);
  }, [INITIAL_VISIBLE_PICKER_ITEMS]);

  const pickerProducts = isCompareCardsTemplate
    ? comparePickerProducts
    : isSimilarPiecesTemplate
    ? similarPickerProducts
    : isBestUnderBudgetTemplate
    ? budgetPickerProducts
    : filteredProducts;

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

  const hasLargeComparePriceDifference = useMemo(() => {
    const leftPrice = comparePair.left?.price ?? 0;
    const rightPrice = comparePair.right?.price ?? 0;
    if (leftPrice <= 0 || rightPrice <= 0) return false;

    const lower = Math.min(leftPrice, rightPrice);
    const deltaRatio = Math.abs(leftPrice - rightPrice) / lower;
    return deltaRatio > 0.3;
  }, [comparePair.left?.price, comparePair.right?.price]);

  const compareSubtitle = hasLargeComparePriceDifference
    ? "Similar style. Different price."
    : "Similar style. Similar price.";

  const productById = useMemo(
    () => new Map(ringProducts.map((product) => [product.id, product])),
    [ringProducts]
  );

  const similarPieces = useMemo(() => {
    const fallbackPool = similarPickerProducts.length > 0
      ? similarPickerProducts
      : interleavedRingProducts;

    return SIMILAR_SLOTS.map((slot, index) => {
      const chosenId = similarSlotProductIds[slot.id];
      const chosen = chosenId ? productById.get(chosenId) : undefined;
      return chosen ?? fallbackPool[index] ?? interleavedRingProducts[index] ?? selectedProduct;
    }).filter((item): item is ProductOption => Boolean(item));
  }, [interleavedRingProducts, productById, selectedProduct, similarPickerProducts, similarSlotProductIds]);

  const budgetProducts = useMemo(() => {
    const fallbackPool = budgetEligibleProducts.length > 0 ? budgetEligibleProducts : interleavedRingProducts;

    return SIMILAR_SLOTS.map((slot, index) => {
      const chosenId = budgetSlotProductIds[slot.id];
      const chosen = chosenId ? productById.get(chosenId) : undefined;
      return chosen ?? fallbackPool[index] ?? interleavedRingProducts[index] ?? selectedProduct;
    }).filter((item): item is ProductOption => Boolean(item));
  }, [budgetEligibleProducts, budgetSlotProductIds, interleavedRingProducts, productById, selectedProduct]);

  const instagramPostInfo = useMemo(() => {
    const left = comparePair.left;
    const right = comparePair.right;
    const compareBrands = left && right ? `${left.brand} vs ${right.brand}` : "Compare Across Brands";
    const budgetStyle = "Rings";
    const compareTemplateIntro =
      "PickYourPiece helps you compare jewellery across brands in one place. Explore rings, earrings, pendants, and bracelets with smart filters, price range, and live catalog updates.";

    if (instagramPostTemplate === "compare_cards") {
      const leftName = left?.name ?? "Product A";
      const rightName = right?.name ?? "Product B";
      const leftUrl = getCaptionProductUrl(left);
      const rightUrl = getCaptionProductUrl(right);
      const leftImageUrl = getCaptionImageUrl(getProductDisplayImage(left));
      const rightImageUrl = getCaptionImageUrl(getProductDisplayImage(right));

      return {
        title: compareBrands,
        subtitle: `${leftName} vs ${rightName}`,
        caption: `${compareTemplateIntro} Compare ${left?.brand ?? "Brand A"} and ${right?.brand ?? "Brand B"} side by side before buying.\n\nProducts in this comparison:\n1. ${leftName} - ${leftUrl}\n   Image URL: ${leftImageUrl || "N/A"}\n2. ${rightName} - ${rightUrl}\n   Image URL: ${rightImageUrl || "N/A"}`,
        hashtags: buildHashtags(["pickyourpiece", "CompareRings", "JewelleryComparison", ...allCatalogBrandHashtagParts]),
        cta: "/?q=ring",
      };
    }

    if (instagramPostTemplate === "similar_pieces") {
      const similarProductsWithUrls = similarPieces
        .map((product, index) => {
          const productUrl = getCaptionProductUrl(product);
          const imageUrl = getCaptionImageUrl(getProductDisplayImage(product));
          return `${index + 1}. ${product.name} - ${productUrl}\n   Image URL: ${imageUrl || "N/A"}`;
        })
        .join("\n");

      return {
        title: "Love this ring?",
        subtitle: "We found similar styles across top brands.",
        caption: `${compareTemplateIntro} Found a design you like? Compare similar alternatives in seconds.\n\nProducts in this template:\n${similarProductsWithUrls}`,
        hashtags: buildHashtags(["pickyourpiece", "SimilarRings", "RingAlternatives", ...allCatalogBrandHashtagParts]),
        cta: selectedProduct?.productUrl ?? "/",
      };
    }

    const budgetProductsWithUrls = budgetProducts
      .map((product, index) => {
        const productUrl = getCaptionProductUrl(product);
        const imageUrl = getCaptionImageUrl(getProductDisplayImage(product));
        return `${index + 1}. ${product.name} - ${productUrl}\n   Image URL: ${imageUrl || "N/A"}`;
      })
      .join("\n");

    return {
      title: `Best ${budgetStyle}`,
      subtitle: `Under ${toCurrency(budgetCap)}`,
      caption: `${compareTemplateIntro} Top ${budgetStyle.toLowerCase()} picks under ${toCurrency(budgetCap)}.\n\nProducts in this template:\n${budgetProductsWithUrls}`,
      hashtags: buildHashtags(["pickyourpiece", budgetStyle, "UnderBudget", "SmartBuy", ...allCatalogBrandHashtagParts]),
      cta: `/?maxPrice=${budgetCap}`,
    };
  }, [
    allCatalogBrandHashtagParts,
    budgetCap,
    budgetProducts,
    comparePair.left,
    comparePair.right,
    getProductDisplayImage,
    instagramPostTemplate,
    similarPieces,
    selectedProduct,
  ]);

  const draft = useMemo(() => {
    if (templateId === "instagram_post") {
      return {
        title: instagramPostInfo.title,
        caption: instagramPostInfo.caption,
        hashtags: instagramPostInfo.hashtags,
        cta: instagramPostInfo.cta,
        image: getProductDisplayImage(selectedProduct),
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
        image: getProductDisplayImage(selectedProduct),
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
    getProductDisplayImage,
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
      const exportPixelRatio = 2;

      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      // Use currently loaded images to keep repeated exports visually identical.
      const previewImages = Array.from(previewNode.querySelectorAll("img"));
      await Promise.all(
        previewImages.map(async (image) => {
          if (!image.complete) {
            await new Promise<void>((resolve) => {
              image.addEventListener("load", () => resolve(), { once: true });
              image.addEventListener("error", () => resolve(), { once: true });
            });
          }

          if (typeof image.decode === "function") {
            try {
              await image.decode();
            } catch {
              // Ignore decode errors and fall back to whatever is currently painted.
            }
          }
        })
      );

      // Always render at ultra-high DPI for maximum export sharpness.
      const dataUrl = await toPng(previewNode, {
        cacheBust: false,
        includeQueryParams: true,
        pixelRatio: exportPixelRatio,
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
            <div className="studio-compare-capsules" role="tablist" aria-label="Compare card side selector">
              {COMPARE_SIDES.map((side) => (
                <button
                  key={`compare-capsule-${side.id}`}
                  type="button"
                  className={`studio-compare-capsule ${compareSelectionTarget === side.id ? "active" : ""}`}
                  role="tab"
                  aria-selected={compareSelectionTarget === side.id}
                  onClick={() => {
                    setCompareSelectionTarget(side.id);
                    setVisiblePickerCount(INITIAL_VISIBLE_PICKER_ITEMS);
                  }}
                >
                  {side.label}
                </button>
              ))}
            </div>

            {(() => {
              const side = compareSelectionTarget;
              const sideFilter = compareSideFilters[side];
              const sideLabel = side === "left" ? "Card A" : "Card B";
              const sideProduct = side === "left" ? comparePair.left : comparePair.right;
              const sideFrame: SideFrameState | undefined = sideProduct
                ? getProductImageFrame(sideProduct)
                : undefined;

              return (
                <StudioSideControlPanel
                  title={`${sideLabel} Controls`}
                  activeLabel={`Picking For ${sideLabel}`}
                  sideId={`compare-${side}`}
                  filter={sideFilter}
                  onFilterChange={(key, value) => updateCompareSideFilter(side, key, value)}
                  brandOptions={ringBrandOptions}
                  gemstoneOptions={similarGemstoneOptions}
                  styleOptions={similarStyleOptions}
                  metalOptions={compareMetalOptions}
                  colorOptions={compareColorOptions}
                  frame={sideFrame}
                  onFrameChange={sideProduct ? (key, value) => updateProductImageFrame(sideProduct.id, key, value) : undefined}
                  onResetFrame={sideProduct ? () => resetProductImageFrame(sideProduct.id) : undefined}
                  frameLimits={IMAGE_FRAME_LIMITS}
                />
              );
            })()}

            <p>Switch Card A/B capsules to edit that card and pick products from the list.</p>
          </div>
        ) : isSimilarPiecesTemplate ? (
          <div className="studio-compare-picker-target" role="group" aria-label="Similar pieces image selection">
            <div className="studio-compare-capsules studio-compare-capsules--four" role="tablist" aria-label="Similar piece slot selector">
              {SIMILAR_SLOTS.map((slot) => (
                <button
                  key={`similar-capsule-${slot.id}`}
                  type="button"
                  className={`studio-compare-capsule ${similarSelectionTarget === slot.id ? "active" : ""}`}
                  role="tab"
                  aria-selected={similarSelectionTarget === slot.id}
                  onClick={() => {
                    setSimilarSelectionTarget(slot.id);
                    setVisiblePickerCount(INITIAL_VISIBLE_PICKER_ITEMS);
                  }}
                >
                  {slot.label}
                </button>
              ))}
            </div>

            {(() => {
              const slot = similarSelectionTarget;
              const slotFilter = similarSideFilters[slot];
              const slotLabel = SIMILAR_SLOTS.find((item) => item.id === slot)?.label ?? "Image";
              const slotProduct = productById.get(similarSlotProductIds[slot]) ?? similarPieces[0];
              const slotFrame: SideFrameState | undefined = slotProduct
                ? getProductImageFrame(slotProduct)
                : undefined;

              return (
                <StudioSideControlPanel
                  title={`${slotLabel} Controls`}
                  activeLabel={`Picking For ${slotLabel}`}
                  sideId={`similar-${slot}`}
                  filter={slotFilter}
                  onFilterChange={(key, value) => updateSimilarSideFilter(slot, key, value)}
                  brandOptions={ringBrandOptions}
                  gemstoneOptions={similarGemstoneOptions}
                  styleOptions={similarStyleOptions}
                  metalOptions={compareMetalOptions}
                  colorOptions={compareColorOptions}
                  frame={slotFrame}
                  onFrameChange={slotProduct ? (key, value) => updateProductImageFrame(slotProduct.id, key, value) : undefined}
                  onResetFrame={slotProduct ? () => resetProductImageFrame(slotProduct.id) : undefined}
                  frameLimits={IMAGE_FRAME_LIMITS}
                />
              );
            })()}

            <p>Switch Image 1-4 capsules to edit that image and pick products from the list.</p>
          </div>
        ) : isBestUnderBudgetTemplate ? (
          <div className="studio-compare-picker-target" role="group" aria-label="Best under budget image selection">
            <div className="studio-compare-capsules studio-compare-capsules--four" role="tablist" aria-label="Budget piece slot selector">
              {SIMILAR_SLOTS.map((slot) => (
                <button
                  key={`budget-capsule-${slot.id}`}
                  type="button"
                  className={`studio-compare-capsule ${budgetSelectionTarget === slot.id ? "active" : ""}`}
                  role="tab"
                  aria-selected={budgetSelectionTarget === slot.id}
                  onClick={() => {
                    setBudgetSelectionTarget(slot.id);
                    setVisiblePickerCount(INITIAL_VISIBLE_PICKER_ITEMS);
                  }}
                >
                  {slot.label}
                </button>
              ))}
            </div>

            {(() => {
              const slot = budgetSelectionTarget;
              const slotFilter = budgetSideFilters[slot];
              const slotLabel = SIMILAR_SLOTS.find((item) => item.id === slot)?.label ?? "Image";
              const slotProduct = productById.get(budgetSlotProductIds[slot]) ?? budgetProducts[0];
              const slotFrame: SideFrameState | undefined = slotProduct
                ? getProductImageFrame(slotProduct)
                : undefined;

              return (
                <StudioSideControlPanel
                  title={`${slotLabel} Controls`}
                  activeLabel={`Picking For ${slotLabel}`}
                  sideId={`budget-${slot}`}
                  filter={slotFilter}
                  onFilterChange={(key, value) => updateBudgetSideFilter(slot, key, value)}
                  brandOptions={ringBrandOptions}
                  gemstoneOptions={similarGemstoneOptions}
                  styleOptions={similarStyleOptions}
                  metalOptions={compareMetalOptions}
                  colorOptions={compareColorOptions}
                  frame={slotFrame}
                  onFrameChange={slotProduct ? (key, value) => updateProductImageFrame(slotProduct.id, key, value) : undefined}
                  onResetFrame={slotProduct ? () => resetProductImageFrame(slotProduct.id) : undefined}
                  frameLimits={IMAGE_FRAME_LIMITS}
                />
              );
            })()}

            <p>Switch Image 1-4 capsules to edit that image. Budget cap automatically limits every slot picker.</p>
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
            const isLeftSelected = isCompareCardsTemplate && product.id === selectedProductId;
            const isRightSelected = isCompareCardsTemplate && product.id === compareRightProduct?.id;
            const isSimilarSelected = isSimilarPiecesTemplate && product.id === similarSlotProductIds[similarSelectionTarget];
            const isBudgetSelected = isBestUnderBudgetTemplate && product.id === budgetSlotProductIds[budgetSelectionTarget];
            const productImages = getProductImages(product);
            const activeThumbImage = getProductDisplayImage(product);
            const rawImageIndex = selectedImageIndexByProductId[product.id] ?? 0;
            const activeImageIndex = Math.min(Math.max(rawImageIndex, 0), Math.max(productImages.length - 1, 0));
            const buttonClass = [
              isLeftSelected ? "active-left" : "",
              isRightSelected ? "active-right" : "",
              isSimilarSelected ? "active-similar" : "",
              isBudgetSelected ? "active-similar" : "",
            ].filter(Boolean).join(" ");

            return (
              <div key={product.id} className="studio-picker-item">
                <button
                  type="button"
                  className={`studio-picker-select ${buttonClass}`.trim()}
                  onClick={() => {
                    if (templateId === "instagram_post" && instagramPostTemplate === "similar_pieces") {
                      setSimilarSlotProductIds((current) => ({
                        ...current,
                        [similarSelectionTarget]: product.id,
                      }));
                      return;
                    }

                    if (templateId === "instagram_post" && instagramPostTemplate === "best_under_budget") {
                      setBudgetSlotProductIds((current) => ({
                        ...current,
                        [budgetSelectionTarget]: product.id,
                      }));
                      return;
                    }

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
                      {activeThumbImage ? (
                        <Image
                          src={getStudioImageSrc(activeThumbImage)}
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
                {productImages.length > 1 ? (
                  <div className="studio-picker-image-controls" role="group" aria-label={`Image options for ${product.name}`}>
                    <button
                      type="button"
                      className="studio-picker-image-nav"
                      aria-label="Previous image"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        cycleProductImage(product, -1);
                      }}
                    >
                      &lsaquo;
                    </button>
                    <small>{activeImageIndex + 1}/{productImages.length}</small>
                    <button
                      type="button"
                      className="studio-picker-image-nav"
                      aria-label="Next image"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        cycleProductImage(product, 1);
                      }}
                    >
                      &rsaquo;
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
          {visiblePickerCount < pickerProducts.length ? (
            <p className="studio-picker-loading">Loading more rings...</p>
          ) : null}
        </div>
      </aside>

      <section className="studio-preview">
        <div className="studio-preview-scroll">
          <div ref={previewCanvasRef} className="studio-preview-canvas" style={{ aspectRatio: previewRatio }}>
            {templateId === "instagram_post" ? (
              <div className={`studio-ig-post studio-ig-post-${instagramPostTemplate}`}>
              {instagramPostTemplate === "compare_cards" ? (
                <>
                  <div className="studio-ig-compare-topbar">
                    <div className="studio-ig-compare-brandmark" aria-label="PickYourPiece">
                      <span className="navbar-logo-text">
                        Pick<span className="navbar-logo-red">Your</span>Piece
                      </span>
                      <small>COMPARE. CHOOSE. BUY SMARTER.</small>
                    </div>
                  </div>

                  <div className="studio-ig-header studio-ig-header-compare">
                    <h2>What&apos;s Your <span className="studio-ig-pick-word">Pick?</span></h2>
                    <p>
                      {compareSubtitle} <span>Which one wins?</span>
                    </p>
                  </div>

                  <div className="studio-ig-compare-row">
                    <StudioCompareCard
                      badge="A"
                      imageSrc={getStudioImageSrc(getProductDisplayImage(comparePair.left))}
                      imageAlt={comparePair.left?.name ?? "Product"}
                      imageStyle={getProductImageStyle(comparePair.left)}
                      brandLabel={comparePair.left?.brand ?? "Brand"}
                      nameLabel={clampLabel(comparePair.left?.name ?? "Product", 34)}
                      priceLabel={toCurrency(comparePair.left?.price ?? 0)}
                    />
                    <span className="studio-ig-vs">VS</span>
                    <StudioCompareCard
                      badge="B"
                      imageSrc={getStudioImageSrc(getProductDisplayImage(comparePair.right))}
                      imageAlt={comparePair.right?.name ?? "Product"}
                      imageStyle={getProductImageStyle(comparePair.right)}
                      brandLabel={comparePair.right?.brand ?? "Brand"}
                      nameLabel={clampLabel(comparePair.right?.name ?? "Product", 34)}
                      priceLabel={toCurrency(comparePair.right?.price ?? 0)}
                    />
                  </div>

                  <div className="studio-ig-compare-trust-strip" role="note" aria-label="Trust signals">
                    <div>
                      <b>COMPARE PRICES</b>
                      <small>Across 8+ Brands</small>
                    </div>
                    <div>
                      <b>10K+ PIECES</b>
                      <small>Updated Daily</small>
                    </div>
                    <div>
                      <b>TRUSTED & RELIABLE</b>
                      <small>100% Independent</small>
                    </div>
                  </div>

                  <StudioCompareFooter
                    title="Compare Across Brands."
                    highlight="Find Your Perfect Piece."
                    ctaLabel="COMPARE NOW"
                    ctaAriaLabel="Compare now"
                    siteLabel="pickyourpiece.com"
                  />
                </>
              ) : null}

              {instagramPostTemplate === "similar_pieces" ? (
                <>
                  <div className="studio-ig-header studio-ig-header-compare" style={{marginTop: "12px"}}>
                    <h2>Love this ring?</h2>
                    <p>
                      We found similar styles across top brands. <span>Pick your favorite.</span>
                    </p>
                  </div>

                  <div className="studio-ig-similar-layout">
                    {similarPieces[0] ? (
                      <article className="studio-ig-piece studio-ig-piece-hero">
                        {getProductDisplayImage(similarPieces[0]) ? (
                          <Image
                            src={getStudioImageSrc(getProductDisplayImage(similarPieces[0]))}
                            alt={similarPieces[0].name}
                            fill
                            unoptimized
                            sizes="(max-width: 1000px) 90vw, 720px"
                            style={getProductImageStyle(similarPieces[0])}
                          />
                        ) : null}
                        <div className="studio-ig-piece-meta">
                          <span className="studio-ig-piece-brand-wrap">
                            {renderBrandBadge(similarPieces[0].brand)}
                            <span className="studio-ig-piece-brand">{similarPieces[0].brand}</span>
                          </span>
                          <strong className="studio-ig-piece-price">{toCurrency(similarPieces[0].price)}</strong>
                        </div>
                      </article>
                    ) : null}

                    <div className="studio-ig-similar-row">
                      {similarPieces.slice(1, 4).map((product, index) => (
                        <article key={`${product.id}-${index + 1}`} className="studio-ig-piece studio-ig-piece-small">
                          {getProductDisplayImage(product) ? (
                            <Image
                              src={getStudioImageSrc(getProductDisplayImage(product))}
                              alt={product.name}
                              fill
                              unoptimized
                              sizes="(max-width: 1000px) 30vw, 220px"
                              style={getProductImageStyle(product)}
                            />
                          ) : null}
                          <div className="studio-ig-piece-meta">
                            <span className="studio-ig-piece-brand-wrap">
                              {renderBrandBadge(product.brand)}
                              <span className="studio-ig-piece-brand">{product.brand}</span>
                            </span>
                            <strong className="studio-ig-piece-price">{toCurrency(product.price)}</strong>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>

                  <StudioCompareFooter
                    title="Compare Across Brands."
                    highlight="Find Your Perfect Piece."
                    ctaLabel="COMPARE NOW"
                    ctaAriaLabel="Compare now"
                    siteLabel="pickyourpiece.com"
                  />
                </>
              ) : null}

              {instagramPostTemplate === "best_under_budget" ? (
                <>
                  <div className="studio-ig-header">
                    <h2>{instagramPostInfo.title}</h2>
                    <p>{instagramPostInfo.subtitle}</p>
                  </div>
                  <div className="studio-ig-grid-four">
                    {budgetProducts.map((product, index) => (
                      <article key={`${product.id}-${index + 1}`} className="studio-ig-piece">
                        {getProductDisplayImage(product) ? (
                          <Image
                            src={getStudioImageSrc(getProductDisplayImage(product))}
                            alt={product.name}
                            fill
                            unoptimized
                            sizes="(max-width: 1000px) 35vw, 220px"
                            style={getProductImageStyle(product)}
                          />
                        ) : null}
                        <div className="studio-ig-piece-meta">
                          <span className="studio-ig-piece-brand-wrap">
                            {renderBrandBadge(product.brand)}
                            <span className="studio-ig-piece-brand">{product.brand}</span>
                          </span>
                          <strong className="studio-ig-piece-price">{toCurrency(product.price)}</strong>
                        </div>
                      </article>
                    ))}
                  </div>

                  <StudioCompareFooter
                    title="Compare Across Brands."
                    highlight="Find Your Perfect Piece."
                    ctaLabel="COMPARE NOW"
                    ctaAriaLabel="Compare now"
                    siteLabel="pickyourpiece.com"
                  />
                </>
              ) : null}
              </div>
            ) : (
              <>
                {draft.image ? (
                  <Image
                    src={getStudioImageSrc(draft.image)}
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
