import type { Metadata } from "next";
import MainLayout from "@/components/layout/MainLayout";
import HomeCatalogMode from "@/components/home/HomeCatalogMode";
import products from "@/data/products.json";
import { buildProductDetailPath, getBrandSegment } from "@/lib/product-seo";
import type { Product } from "@/types/product";

const INITIAL_PAGE_SIZE = 48;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.pickyourpiece.com";

export const metadata: Metadata = {
  title: "Ring Catalog | PickYourPiece",
  description: "Compare ring prices, styles, metals, and purity across trusted jewellery brands.",
  alternates: {
    canonical: "/ring",
  },
  openGraph: {
    type: "website",
    url: `${siteUrl}/ring`,
    title: "Ring Catalog | PickYourPiece",
    description: "Compare ring prices, styles, metals, and purity across trusted jewellery brands.",
    images: [
      {
        url: "/heroImage.png",
        width: 1200,
        height: 630,
        alt: "PickYourPiece ring catalog",
      },
    ],
  },
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

export default async function RingPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const previewRaw = resolvedSearchParams.preview;
  const previewValue = Array.isArray(previewRaw) ? previewRaw[0] : previewRaw;

  const relevantSeed = getDailyRelevantSeed();
  const all = sortByRelevant(products as Product[], relevantSeed);
  const bounds = getPriceBounds(all);
  const minPrice = all.length > 0 ? bounds.min : 0;
  const maxPrice = all.length > 0 ? bounds.max : 0;
  const initialItems = all.slice(0, INITIAL_PAGE_SIZE);
  const initialNextCursor = initialItems.length < all.length ? initialItems.length : null;
  const initialSelectedProduct = previewValue
    ? all.find((product) => buildProductDetailPath(product) === previewValue) ?? null
    : null;

  return (
    <MainLayout showNavbarSearch showNavbarBrand={false}>
      <HomeCatalogMode
        initialItems={initialItems}
        initialNextCursor={initialNextCursor}
        pageSize={INITIAL_PAGE_SIZE}
        minPrice={minPrice}
        maxPrice={maxPrice}
        initialSelectedProduct={initialSelectedProduct}
      />
    </MainLayout>
  );
}
