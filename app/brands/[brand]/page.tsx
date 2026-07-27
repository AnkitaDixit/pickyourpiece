import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import ProductsExplorer from "@/components/catalog/ProductsExplorer";
import products from "@/data/products.json";
import type { Product } from "@/types/product";
import { buildProductDetailPath, getBrandDisplayName, getBrandSegment } from "@/lib/product-seo";

const INITIAL_PAGE_SIZE = 48;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.pickyourpiece.com";

type RouteParams = {
  brand: string;
};

function hashText(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function getDailyRelevantSeed(): string {
  return new Date().toISOString().slice(0, 10);
}

function sortByRelevant(items: Product[], seed: string) {
  const buckets = new Map<string, Product[]>();

  for (const item of items) {
    const brandKey = (getBrandSegment(item.brand) ?? item.brand ?? "unknown").trim().toLowerCase() || "unknown";
    const list = buckets.get(brandKey);
    if (list) {
      list.push(item);
    } else {
      buckets.set(brandKey, [item]);
    }
  }

  for (const [brandKey, entries] of buckets) {
    entries.sort((a, b) => hashText(`${seed}:${brandKey}:${a.id}:${a.name}`) - hashText(`${seed}:${brandKey}:${b.id}:${b.name}`));
  }

  const brandOrder = Array.from(buckets.keys()).sort((a, b) => hashText(`${seed}:${a}`) - hashText(`${seed}:${b}`));
  const output: Product[] = [];
  let hasItems = true;

  while (hasItems) {
    hasItems = false;

    for (const brandKey of brandOrder) {
      const queue = buckets.get(brandKey);
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

function getPriceBounds(items: Product[]) {
  return items.reduce(
    (bounds, item) => {
      const price = typeof item.price === "number" ? item.price : Number.MAX_SAFE_INTEGER;
      return {
        min: Math.min(bounds.min, price),
        max: Math.max(bounds.max, price),
      };
    },
    { min: Number.MAX_SAFE_INTEGER, max: 0 }
  );
}

function getBrandProducts(brandSegment: string): Product[] {
  const brandDisplayName = getBrandDisplayName(brandSegment);
  if (!brandDisplayName) return [];

  return (products as Product[]).filter((product) => getBrandSegment(product.brand) === brandSegment);
}

export async function generateStaticParams() {
  const segments = new Set(
    (products as Product[])
      .map((product) => getBrandSegment(product.brand))
      .filter((segment): segment is string => Boolean(segment))
  );

  return Array.from(segments).map((brand) => ({ brand }));
}

export async function generateMetadata({ params }: { params: Promise<RouteParams> }): Promise<Metadata> {
  const { brand } = await params;
  const brandDisplayName = getBrandDisplayName(brand);
  if (!brandDisplayName) {
    return {
      title: "Brand not found",
      robots: { index: false, follow: false },
    };
  }

  const canonicalPath = `/brands/${brand}`;
  const title = `${brandDisplayName} Rings | Compare Prices and Styles`;
  const description = `Explore and compare ${brandDisplayName} rings by price, style, metal, and purity on PickYourPiece.`;
  const brandItems = getBrandProducts(brand);
  const primaryImage = brandItems.find((item) => typeof item.image === "string" && item.image.trim())?.image;

  return {
    title,
    description,
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}${canonicalPath}`,
      type: "website",
      images: primaryImage ? [{ url: primaryImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: primaryImage ? [primaryImage] : undefined,
    },
  };
}

export default async function BrandPage({ params }: { params: Promise<RouteParams> }) {
  const { brand } = await params;
  const brandDisplayName = getBrandDisplayName(brand);
  if (!brandDisplayName) notFound();

  const relevantSeed = getDailyRelevantSeed();
  const all = sortByRelevant(getBrandProducts(brand), relevantSeed);
  if (all.length === 0) notFound();

  const bounds = getPriceBounds(all);
  const minPrice = all.length > 0 ? bounds.min : 0;
  const maxPrice = all.length > 0 ? bounds.max : 0;
  const initialItems = all.slice(0, INITIAL_PAGE_SIZE);
  const initialNextCursor = initialItems.length < all.length ? initialItems.length : null;

  const canonicalPath = `/brands/${brand}`;
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${brandDisplayName} Ring Catalog`,
    description: `Compare ${brandDisplayName} ring collections by price, style, metal and purity.`,
    url: `${siteUrl}${canonicalPath}`,
    mainEntity: {
      "@type": "ItemList",
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      numberOfItems: all.length,
      itemListElement: initialItems.slice(0, 12).map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Product",
          name: product.name,
          brand: product.brand,
          image: product.image,
          url: buildProductDetailPath(product) ? `${siteUrl}${buildProductDetailPath(product)}` : product.productUrl,
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

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${siteUrl}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Brands",
        item: `${siteUrl}/brands/${brand}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: brandDisplayName,
        item: `${siteUrl}${canonicalPath}`,
      },
    ],
  };

  return (
    <MainLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <ProductsExplorer
        initialItems={initialItems}
        initialNextCursor={initialNextCursor}
        pageSize={INITIAL_PAGE_SIZE}
        minPrice={minPrice}
        maxPrice={maxPrice}
        hiddenFilterKeys={["brand"]}
        forcedFilters={{ brand: [brandDisplayName] }}
      />
    </MainLayout>
  );
}
