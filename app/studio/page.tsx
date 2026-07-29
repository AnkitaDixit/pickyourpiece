import Link from "next/link";
import { redirect } from "next/navigation";
import products from "@/data/products.json";
import type { Product } from "@/types/product";
import StudioBuilder from "@/components/studio/StudioBuilder";
import { isStudioAuthenticated, logoutStudio } from "@/app/studio/actions";

type StudioProduct = {
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

function toStudioProduct(product: Product): StudioProduct {
  return {
    id: String(product.id),
    name: product.name,
    brand: product.brand,
    price: product.price,
    image: product.image,
    allImages: product.allImages,
    productUrl: product.productUrl,
    category: product.category,
    style: Array.isArray(product.style) ? product.style : [],
    gemstone: Array.isArray(product.gemstone) ? product.gemstone : [],
    metal: (product.metal || "").trim(),
    color: (product.metalColor || "").trim(),
  };
}

export default async function StudioPage() {
  const authenticated = await isStudioAuthenticated();
  if (!authenticated) {
    redirect("/studio/login?next=/studio");
  }

  const allProducts = products as Product[];
  const studioProducts = allProducts.map(toStudioProduct);

  return (
    <main className="studio-page">
      <header className="studio-header">
        <div>
          <p className="studio-kicker">Internal Tool</p>
          <h1>Social Content Studio</h1>
          <p>Build social-ready drafts from your live catalog data without leaving the product workspace.</p>
        </div>

        <div className="studio-header-actions">
          <Link href="/" className="studio-link-btn">Back to site</Link>
          <form action={logoutStudio}>
            <button type="submit" className="studio-logout-btn">Logout</button>
          </form>
        </div>
      </header>

      <StudioBuilder products={studioProducts} />
    </main>
  );
}
