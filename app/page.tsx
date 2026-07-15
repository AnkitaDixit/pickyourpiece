import type { Metadata } from "next";
import MainLayout from "@/components/layout/MainLayout";
import HomeCatalogMode from "@/components/home/HomeCatalogMode";
import HomeLandingMode from "@/components/home/HomeLandingMode";
import type { Product } from "@/types/product";
import products from "@/data/products.json";
import { buildProductDetailPath, getBrandSegment } from "@/lib/product-seo";

const INITIAL_PAGE_SIZE = 48;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.pickyourpiece.com";

export const metadata: Metadata = {
  title: "PickYourPiece | Compare Jewellery Prices Across Brands",
  description:
    "Compare jewellery across brands and discover rings, earrings, pendants, and bracelets by price, style, metal, and purity.",
  keywords: [
    "compare jewellery across brands",
    "jewellery price comparison India",
    "compare jewellery online",
    "best jewellery comparison platform",
    "jewellery designs and price",
    "ring designs and price",
    "diamond ring designs and price",
    "gold jewellery designs and price",
    "earring designs and price",
    "bracelet designs and price",
    "ring price comparison",
    "compare jewellery brands",
    "diamond ring comparison",
    "gold ring prices India",
    "engagement ring comparison",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "PickYourPiece | Compare Jewellery Prices Across Brands",
    description:
      "Compare jewellery across brands and discover rings, earrings, pendants, and bracelets by price, style, metal, and purity.",
    images: [
      {
        url: "/heroImage.png",
        width: 1200,
        height: 630,
        alt: "PickYourPiece jewellery comparison",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PickYourPiece | Compare Jewellery Prices Across Brands",
    description:
      "Compare jewellery across brands and discover rings, earrings, pendants, and bracelets by price, style, metal, and purity.",
    images: ["/heroImage.png"],
  },
};

function sortByPrice(items: Product[]) {
  const copy = [...items];
  copy.sort((a, b) => {
    const aPrice = typeof a.price === "number" ? a.price : Number.MAX_SAFE_INTEGER;
    const bPrice = typeof b.price === "number" ? b.price : Number.MAX_SAFE_INTEGER;
    return aPrice - bPrice;
  });
  return copy;
}

const EDITOR_PICK_BRANDS = [
  "bluestone",
  "candere",
  "caratlane",
  "giva",
  "mia",
  "orra",
  "tanishq",
] as const;

const EDITOR_PICK_NAME_BY_BRAND: Partial<Record<(typeof EDITOR_PICK_BRANDS)[number], string>> = {
  candere: "fab fit minimal diamond stackable ring",
  caratlane: "timeless splendor solitaire ring",
  giva: "silver glittering ring",
  mia: "starlit heart 14 kt gold & diamond ring",
  tanishq: "harmony glow diamond ring",
};

function scoreImageQuality(image: string): number {
  if (!image) return -100;

  const normalized = image.trim().toLowerCase();
  if (!normalized) return -100;

  let score = 0;

  if (normalized.startsWith("https://")) score += 4;
  else if (normalized.startsWith("http://")) score += 2;

  if (/\.(webp|png|jpe?g)(\?|$)/.test(normalized)) score += 2;
  if (/w_(1024|1200|1600)|1024|1200|1600|zoom|large|original/.test(normalized)) score += 2;
  if (/dw\/image|media\/catalog|shopify\.com\/s\/files|cdn\./.test(normalized)) score += 2;

  if (/placeholder|default|no[-_]?image|coming[-_]?soon|dummy/.test(normalized)) {
    score -= 8;
  }

  return score;
}

function scoreEditorPick(product: Product): number {
  let score = scoreImageQuality(product.image);

  if (product.name.toLowerCase().includes("ring")) score += 3;
  if (product.availability) score += 1;

  return score;
}

function pickEditorsProducts(items: Product[]): Product[] {
  const byBrand = new Map<string, Product[]>();

  for (const item of items) {
    const segment = getBrandSegment(item.brand);
    if (!segment) continue;

    const current = byBrand.get(segment);
    if (current) {
      current.push(item);
    } else {
      byBrand.set(segment, [item]);
    }
  }

  return EDITOR_PICK_BRANDS.map((brandSegment) => {
    const brandItems = byBrand.get(brandSegment) ?? [];
    if (brandItems.length === 0) return null;

    const preferredName = EDITOR_PICK_NAME_BY_BRAND[brandSegment];
    if (preferredName) {
      const exactMatch = brandItems.find((product) => product.name.trim().toLowerCase() === preferredName);
      if (exactMatch) return exactMatch;

      const partialMatch = brandItems.find((product) => product.name.toLowerCase().includes(preferredName));
      if (partialMatch) return partialMatch;
    }

    const ringItems = brandItems.filter((product) => product.name.toLowerCase().includes("ring"));
    const candidates = ringItems.length > 0 ? ringItems : brandItems;

    return candidates.reduce((best, current) => {
      if (!best) return current;

      const bestScore = scoreEditorPick(best);
      const currentScore = scoreEditorPick(current);

      if (currentScore !== bestScore) {
        return currentScore > bestScore ? current : best;
      }

      return current.price < best.price ? current : best;
    }, null as Product | null);
  }).filter((product): product is Product => product !== null);
}

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const previewIgnoredKeys = Object.keys(resolvedSearchParams).filter((key) => key !== "preview");
  const keys = previewIgnoredKeys.filter((key) => key !== "mode");
  const previewRaw = resolvedSearchParams.preview;
  const previewValue = Array.isArray(previewRaw) ? previewRaw[0] : previewRaw;
  const modeRaw = resolvedSearchParams.mode;
  const modeValue = Array.isArray(modeRaw) ? modeRaw[0] : modeRaw;

  const all = sortByPrice(products as Product[]);
  const totalBrands = new Set(all.map((product) => product.brand).filter(Boolean)).size;
  const minPrice = all.length > 0 ? all[0].price : 0;
  const maxPrice = all.length > 0 ? all[all.length - 1].price : 0;
  const initialItems = all.slice(0, INITIAL_PAGE_SIZE);
  const initialNextCursor = initialItems.length < all.length ? initialItems.length : null;
  const isCatalogMode = keys.length > 0 || Boolean(previewValue) || modeValue === "catalog";
  const initialSelectedProduct = previewValue
    ? all.find((product) => buildProductDetailPath(product) === previewValue) ?? null
    : null;

  const trendingProducts = pickEditorsProducts(all);

  function pickShelf(
    filter: (p: Product) => boolean,
    limit = 8,
    maxPerBrand = 2,
  ): Product[] {
    const filtered = all.filter(filter);

    // Group best-scoring products per brand
    const byBrand = new Map<string, Product[]>();
    for (const p of filtered) {
      const seg = getBrandSegment(p.brand) ?? p.brand.toLowerCase().replace(/\s+/g, "");
      const bucket = byBrand.get(seg) ?? [];
      bucket.push(p);
      byBrand.set(seg, bucket);
    }
    // Sort each brand's bucket by image quality (best first)
    for (const [seg, bucket] of byBrand) {
      byBrand.set(seg, bucket.sort((a, b) => scoreImageQuality(b.image) - scoreImageQuality(a.image)));
    }

    // Round-robin across brands so the shelf is brand-diverse
    const result: Product[] = [];
    for (let round = 0; round < maxPerBrand && result.length < limit; round++) {
      for (const bucket of byBrand.values()) {
        if (result.length >= limit) break;
        if (round < bucket.length) result.push(bucket[round]);
      }
    }
    return result;
  }

  const discoveryShelves = [
    {
      id: "trending",
      title: "Trending Today",
      emoji: "🔥",
      href: "/?sort=price-asc",
      products: trendingProducts,
    },
    {
      id: "budget",
      title: "Under ₹10,000",
      emoji: "💸",
      href: "/?maxPrice=10000",
      products: pickShelf(p => p.price <= 10_000),
    },
    {
      id: "engagement",
      title: "Engagement Rings",
      emoji: "💍",
      href: "/?q=engagement+ring",
      products: pickShelf(p =>
        p.occasion?.some(o => o.toLowerCase().includes("engagement")) ||
        p.style?.some(s => s.toLowerCase().includes("solitaire")) ||
        p.name.toLowerCase().includes("engagement")
      ),
    },
    {
      id: "giftsforher",
      title: "Gifts for Her",
      emoji: "🌸",
      href: "/?q=gift+jewellery",
      products: pickShelf(p =>
        p.occasion?.some(o => o.toLowerCase().includes("gift")) ||
        ((p.gender === "Women" || p.gender === "Unisex") && p.price >= 3000 && p.price <= 30_000)
      ),
    },
    {
      id: "minimal",
      title: "Minimal Jewellery",
      emoji: "✨",
      href: "/?q=minimal",
      products: pickShelf(p =>
        p.style?.some(s => ["minimal", "simple", "solitaire", "classic"].includes(s.toLowerCase())) ||
        p.name.toLowerCase().includes("minimal") ||
        p.name.toLowerCase().includes("solitaire")
      ),
    },
    {
      id: "diamond",
      title: "Diamond Picks",
      emoji: "💎",
      href: "/?q=diamond",
      products: pickShelf(p => p.gemstone?.some(g => g.toLowerCase().includes("diamond"))),
    },
  ].filter(shelf => shelf.products.length >= 2);

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "PickYourPiece Jewellery Comparison Catalog",
    description:
      "Compare jewellery across brands with live filters for category, price, style, metal, and purity.",
    url: siteUrl,
    mainEntity: {
      "@type": "ItemList",
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      numberOfItems: all.length,
      itemListElement: initialItems.slice(0, 10).map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Product",
          name: product.name,
          brand: product.brand,
          image: product.image,
          url: product.productUrl,
          offers: {
            "@type": "Offer",
            priceCurrency: product.currency,
            price: product.price,
            availability: product.availability
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          },
        },
      })),
    },
  };

  return (
    <MainLayout showNavbarSearch={isCatalogMode} showNavbarBrand={!isCatalogMode}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      {isCatalogMode ? (
        <HomeCatalogMode
          initialItems={initialItems}
          initialNextCursor={initialNextCursor}
          pageSize={INITIAL_PAGE_SIZE}
          minPrice={minPrice}
          maxPrice={maxPrice}
          initialSelectedProduct={initialSelectedProduct}
        />
      ) : (
        <HomeLandingMode
          allCount={all.length}
          totalBrands={totalBrands}
          trendingProducts={trendingProducts}
          discoveryShelves={discoveryShelves}
        />
      )}
    </MainLayout>
  );
}

