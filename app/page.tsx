import type { Metadata } from "next";
import { redirect } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import ProductsExplorer from "@/components/catalog/ProductsExplorer";
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

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const keys = Object.keys(resolvedSearchParams).filter((key) => key !== "preview");
  const brandRaw = resolvedSearchParams.brand;
  const brandValue = Array.isArray(brandRaw) ? brandRaw[0] : brandRaw;

  if (brandValue && keys.length === 1) {
    const brandSegment = getBrandSegment(brandValue);
    if (brandSegment) {
      redirect(`/brands/${brandSegment}`);
    }
  }

  const all = sortByPrice(products as Product[]);
  const minPrice = all.length > 0 ? all[0].price : 0;
  const maxPrice = all.length > 0 ? all[all.length - 1].price : 0;
  const initialItems = all.slice(0, INITIAL_PAGE_SIZE);
  const initialNextCursor = initialItems.length < all.length ? initialItems.length : null;

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
    <MainLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <ProductsExplorer
        initialItems={initialItems}
        initialNextCursor={initialNextCursor}
        pageSize={INITIAL_PAGE_SIZE}
        minPrice={minPrice}
        maxPrice={maxPrice}
      />
    </MainLayout>
  );
}

