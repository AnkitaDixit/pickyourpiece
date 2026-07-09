import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import ProductsExplorer from "@/components/catalog/ProductsExplorer";
import products from "@/data/products.json";
import type { Product } from "@/types/product";
import { getBrandDisplayName, getBrandSegment } from "@/lib/product-seo";

const INITIAL_PAGE_SIZE = 48;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.pickyourpiece.com";

type RouteParams = {
  brand: string;
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

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}${canonicalPath}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function BrandPage({ params }: { params: Promise<RouteParams> }) {
  const { brand } = await params;
  const brandDisplayName = getBrandDisplayName(brand);
  if (!brandDisplayName) notFound();

  const all = sortByPrice(getBrandProducts(brand));
  if (all.length === 0) notFound();

  const minPrice = all.length > 0 ? all[0].price : 0;
  const maxPrice = all.length > 0 ? all[all.length - 1].price : 0;
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
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
