import type { Metadata } from "next";
import MainLayout from "@/components/layout/MainLayout";
import HomeCatalogMode from "@/components/home/HomeCatalogMode";
import products from "@/data/products.json";
import { buildProductDetailPath } from "@/lib/product-seo";
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

function sortByPrice(items: Product[]) {
  const copy = [...items];
  copy.sort((a, b) => {
    const aPrice = typeof a.price === "number" ? a.price : Number.MAX_SAFE_INTEGER;
    const bPrice = typeof b.price === "number" ? b.price : Number.MAX_SAFE_INTEGER;
    return aPrice - bPrice;
  });
  return copy;
}

export default async function RingPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const previewRaw = resolvedSearchParams.preview;
  const previewValue = Array.isArray(previewRaw) ? previewRaw[0] : previewRaw;

  const all = sortByPrice(products as Product[]);
  const minPrice = all.length > 0 ? all[0].price : 0;
  const maxPrice = all.length > 0 ? all[all.length - 1].price : 0;
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
