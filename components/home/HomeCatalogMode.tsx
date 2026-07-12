import ProductsExplorer from "@/components/catalog/ProductsExplorer";
import type { Product } from "@/types/product";

interface HomeCatalogModeProps {
  initialItems: Product[];
  initialNextCursor: number | null;
  pageSize: number;
  minPrice: number;
  maxPrice: number;
}

export default function HomeCatalogMode({
  initialItems,
  initialNextCursor,
  pageSize,
  minPrice,
  maxPrice,
}: HomeCatalogModeProps) {
  return (
    <ProductsExplorer
      initialItems={initialItems}
      initialNextCursor={initialNextCursor}
      pageSize={pageSize}
      minPrice={minPrice}
      maxPrice={maxPrice}
    />
  );
}
