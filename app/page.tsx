import type { Metadata } from "next";
import MainLayout from "@/components/layout/MainLayout";
import HomeCatalogMode from "@/components/home/HomeCatalogMode";
import HomeLandingMode from "@/components/home/HomeLandingMode";
import type { Product } from "@/types/product";
import products from "@/data/products.json";
import { getBrandSegment } from "@/lib/product-seo";

const INITIAL_PAGE_SIZE = 48;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.pickyourpiece.com";

export const metadata: Metadata = {
  title: "PickYourPiece | Compare Ring Prices, Styles, and Brands",
  description:
    "Explore thousands of rings and compare prices, styles, metals, and purity across trusted jewellery brands.",
  alternates: {
    canonical: "/",
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
    const ringItem = brandItems.find((product) => product.name.toLowerCase().includes("ring"));
    return ringItem ?? brandItems[0] ?? null;
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

  const trendingProducts = pickEditorsProducts(all);

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "PickYourPiece Ring Catalog",
    description:
      "Compare ring collections from multiple jewellery brands with live filters and price range controls.",
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
        />
      ) : (
        <HomeLandingMode
          allCount={all.length}
          totalBrands={totalBrands}
          trendingProducts={trendingProducts}
        />
      )}
    </MainLayout>
  );
}

