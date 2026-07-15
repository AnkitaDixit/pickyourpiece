import { cache } from "react";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  buildProductDetailSlug,
  formatFieldLabel,
  getBrandSegment,
  getPrimaryProductId,
  parseProductSlugCandidates,
  toNameSlug,
} from "@/lib/product-seo";
import { buildTrackedBrandUrl } from "@/lib/outbound-tracking";

type RouteParams = {
  brand: string;
  slug: string;
};

type SourceProduct = Record<string, unknown>;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.pickyourpiece.com";

const BRAND_LOGOS: Record<string, string> = {
  bluestone: "/brands/bluestone-logo.png?v=20260709-2338",
  caratlane: "/brands/caratlane-logo.jpg?v=20260709-2338",
  tanishq: "https://images.assettype.com/nationalherald/2020-10/a42818da-499f-46fe-a8c2-e7d7a6ddc775/Tanishq.jpg",
  giva: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTdiZUsR4K1BJmDa422342XYCtccq7OfbR9RFdwOuWWAz8IN3bgLWRBLw-_&s=10",
  miabytanishq: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRZLWP4f6l2TWiPzB946zFtEE4PaG-MGgTRhsUAncCiQvkUZDkbpH8s_x0&s=10",
  mia: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRZLWP4f6l2TWiPzB946zFtEE4PaG-MGgTRhsUAncCiQvkUZDkbpH8s_x0&s=10",
  orra: "http://upload.wikimedia.org/wikipedia/commons/3/3e/ORRAJewellery.jpg",
  candere: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTk2cwP-ig0xZPxiyWdc_exZwE-jMrHO5374YMNS7iH5swqrOOYX289Qqc&s=10",
};

const readBrandProducts = cache(async (brandSegment: string): Promise<SourceProduct[]> => {
  const filePath = path.join(process.cwd(), "scraper", "data", `${brandSegment}.json`);
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((entry): entry is SourceProduct => Boolean(entry) && typeof entry === "object");
});

const productToName = (product: SourceProduct): string => {
  if (typeof product.name === "string" && product.name.trim()) return product.name;
  return "Ring";
};

const productToBrand = (product: SourceProduct, routeBrand: string): string => {
  if (typeof product.brand === "string" && product.brand.trim()) return product.brand;
  return routeBrand;
};

const resolveProduct = async (brandParam: string, slugParam: string): Promise<{ product: SourceProduct; canonicalPath: string }> => {
  const brandSegment = getBrandSegment(brandParam);
  if (!brandSegment) notFound();

  const slugCandidates = parseProductSlugCandidates(slugParam);
  if (slugCandidates.length === 0) notFound();

  let products: SourceProduct[] = [];
  try {
    products = await readBrandProducts(brandSegment);
  } catch {
    notFound();
  }

  let match = products.find((entry) => {
    const id = getPrimaryProductId(entry);
    return typeof id === "string" && slugCandidates.some((candidate) => candidate.id.toLowerCase() === id.toLowerCase());
  });

  if (!match) {
    match = products.find((entry) => {
      const entryName = productToName(entry);
      return slugCandidates.some((candidate) => candidate.nameSlug === toNameSlug(entryName));
    });
  }

  if (!match) notFound();

  const canonicalId = getPrimaryProductId(match);
  if (!canonicalId) notFound();

  const canonicalBrand = getBrandSegment(productToBrand(match, brandSegment)) ?? brandSegment;
  const canonicalSlug = buildProductDetailSlug(productToName(match), canonicalId);
  const canonicalPath = `/product/${canonicalBrand}/${canonicalSlug}`;

  return { product: match, canonicalPath };
};

const valueToNode = (key: string, value: unknown): React.ReactNode => {
  if (value == null || value === "") return <span>-</span>;

  if (key === "availability" && typeof value === "boolean") {
    return (
      <span className={`availability-badge ${value ? "in-stock" : "out-of-stock"}`}>
        {value ? "In Stock" : "Out of Stock"}
      </span>
    );
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return <span>{String(value)}</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return <span>[]</span>;
    const primitive = value.every((entry) => ["string", "number", "boolean"].includes(typeof entry));
    if (primitive) {
      return <span>{value.map((entry) => String(entry)).join(", ")}</span>;
    }
    return <pre className="product-detail-json">{JSON.stringify(value, null, 2)}</pre>;
  }

  return <pre className="product-detail-json">{JSON.stringify(value, null, 2)}</pre>;
};

export async function generateMetadata({ params }: { params: Promise<RouteParams> }): Promise<Metadata> {
  const { brand, slug } = await params;
  const { product, canonicalPath } = await resolveProduct(brand, slug);

  const name = productToName(product);
  const brandName = productToBrand(product, brand);
  const image = typeof product.image === "string" ? product.image : undefined;
  const metal = typeof product.metal === "string" ? product.metal : "";
  const purity = typeof product.purity === "string" ? product.purity : "";
  const gemstone = Array.isArray(product.gemstone)
    ? product.gemstone.filter((entry): entry is string => typeof entry === "string" && Boolean(entry.trim())).join(", ")
    : "";
  const description =
    typeof product.description === "string" && product.description.trim()
      ? product.description
      : `${name} by ${brandName}`;
  const keywords = [name, brandName, "ring", metal, purity, gemstone]
    .map((value) => value.trim())
    .filter(Boolean);

  return {
    title: `${name} | ${brandName} | PickYourPiece`,
    description,
    keywords,
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: `${name} | ${brandName}`,
      description,
      url: `${siteUrl}${canonicalPath}`,
      images: image ? [{ url: image }] : undefined,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} | ${brandName}`,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<RouteParams> }) {
  const { brand, slug } = await params;
  const { product, canonicalPath } = await resolveProduct(brand, slug);

  if (`/product/${brand}/${slug}` !== canonicalPath) {
    redirect(canonicalPath);
  }

  const name = productToName(product);
  const brandName = productToBrand(product, brand);
  const price = typeof product.price === "number" ? product.price : null;
  const currency = typeof product.currency === "string" ? product.currency : "INR";
  const image = typeof product.image === "string" ? product.image : "";
  const productUrl = typeof product.productUrl === "string" ? product.productUrl : "";
  const trackedProductUrl = buildTrackedBrandUrl(productUrl, {
    context: "product_detail",
    brand: brandName,
    productId: getPrimaryProductId(product) ?? undefined,
  });
  console.log("Tracked product URL:", trackedProductUrl);
  const description = typeof product.description === "string" ? product.description : "";
  const category = typeof product.category === "string" ? product.category : "";
  const metal = typeof product.metal === "string" ? product.metal : "";
  const purity = typeof product.purity === "string" ? product.purity : "";
  const metalColor = typeof product.metalColor === "string" ? product.metalColor : "";
  const gemstone = Array.isArray(product.gemstone)
    ? product.gemstone.filter((entry): entry is string => typeof entry === "string" && Boolean(entry.trim())).join(", ")
    : "";
  const isAvailable = typeof product.availability === "boolean" ? product.availability : null;
  const availability = isAvailable == null ? "" : isAvailable ? "In Stock" : "Out of Stock";
  const brandLogo = BRAND_LOGOS[(getBrandSegment(brandName) ?? "").toLowerCase()] ?? null;

  const quickFacts = [
    category,
    metal ? `${metal}${metalColor ? ` / ${metalColor}` : ""}` : "",
    purity,
    gemstone,
    availability,
  ].filter(Boolean);

  const allImages = Array.isArray(product.allImages)
    ? product.allImages.filter((entry): entry is string => typeof entry === "string" && Boolean(entry.trim()))
    : [];
  const galleryImages = Array.from(new Set([image, ...allImages].filter(Boolean)));
  const rows = Object.entries(product)
    .filter(([key]) => !["allImages", "brand", "description", "image", "name", "productUrl"].includes(key))
    .sort(([a], [b]) => a.localeCompare(b));
  const hasExternalLink = Boolean(productUrl);
  const pageUrl = `${siteUrl}${canonicalPath}`;
  const brandBrowseHref = `/ring/?brand=${encodeURIComponent(brandName)}`;

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    image: galleryImages.length > 0 ? galleryImages : undefined,
    description: description || undefined,
    sku: typeof product.sku === "string" ? product.sku : undefined,
    brand: {
      "@type": "Brand",
      name: brandName,
    },
    category: category || "Ring",
    offers: {
      "@type": "Offer",
      url: productUrl || pageUrl,
      priceCurrency: currency,
      price: price ?? undefined,
      availability:
        isAvailable == null
          ? undefined
          : isAvailable
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
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
        name: "Rings",
        item: `${siteUrl}/?category=Ring`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: brandName,
        item: `${siteUrl}/ring/?brand=${encodeURIComponent(brandName)}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name,
        item: pageUrl,
      },
    ],
  };

  return (
    <div className="product-detail-page">
      <div className="product-detail-shell">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />

        <nav className="product-detail-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span className="product-detail-breadcrumb-sep">&gt;</span>
          <Link href="/?category=Ring">Rings</Link>
          <span className="product-detail-breadcrumb-sep">&gt;</span>
          <Link href={brandBrowseHref}>{brandName}</Link>
          <span className="product-detail-breadcrumb-sep">&gt;</span>
          <span className="current" aria-current="page">{name}</span>
        </nav>

        <article className="product-detail-card">
          <section className="product-detail-hero">
            <div className="product-detail-media-column">
              {image ? <img src={image} alt={name} className="product-detail-image" /> : <div className="product-detail-image-fallback" />}

              {galleryImages.length > 1 && (
                <div className="product-detail-thumb-strip" aria-label="Additional product images">
                  {galleryImages.slice(0, 4).map((url, index) => (
                    <img
                      key={url}
                      src={url}
                      alt={index === 0 ? `${name} primary image` : `${name} alternate view ${index}`}
                      className="product-detail-thumb"
                      loading="lazy"
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="product-detail-headline">
              <p className="product-detail-kicker">Product profile</p>

              <div className="product-detail-brand-row">
                {brandLogo
                  ? <img src={brandLogo} alt={`${brandName} logo`} className="product-detail-brand-logo-img" loading="lazy" />
                  : <span className="product-detail-brand-fallback" aria-hidden="true">{brandName[0]}</span>}
                <p className="product-detail-brand">{brandName}</p>
              </div>

              <h1 className="product-detail-name">{name}</h1>

              <div className="product-detail-summary-card">
                <div>
                  <p className="product-detail-summary-label">Current price</p>
                  <p className="product-detail-price">
                    {price != null ? `${currency} ${price.toLocaleString("en-IN")}` : "Price on request"}
                  </p>
                </div>

                {isAvailable != null && (
                  <div className="product-detail-summary-meta">
                    <p className="product-detail-summary-label">Availability</p>
                    <span className={`availability-badge ${isAvailable ? "in-stock" : "out-of-stock"}`}>
                      {isAvailable ? "Available now" : "Currently unavailable"}
                    </span>
                  </div>
                )}
              </div>

              {quickFacts.length > 0 && (
                <div className="product-detail-facts-panel">
                  <p className="product-detail-facts-title">At a glance</p>
                  <ul className="product-detail-facts" aria-label="Key product highlights">
                    {quickFacts.map((fact) => <li key={fact}>{fact}</li>)}
                  </ul>
                </div>
              )}

              {description && <p className="product-detail-description">{description}</p>}

              <div className="product-detail-actions">
                <Link href={brandBrowseHref} className="product-detail-back-link">
                  Browse more from {brandName}
                </Link>

                {hasExternalLink && (
                  <a
                    href={trackedProductUrl}
                    target="_blank"
                    rel="noopener"
                    className="product-detail-visit-btn"
                  >
                    View on {brandName}
                  </a>
                )}
              </div>
            </div>
          </section>

          {galleryImages.length > 1 && (
            <section className="product-detail-gallery">
              <div className="product-detail-section-heading">
                <p>Image library</p>
                <h2>More views of the piece</h2>
              </div>
              <div className="product-detail-gallery-grid">
                {galleryImages.slice(1, 9).map((url) => (
                  <img key={url} src={url} alt={`${name} image`} className="product-detail-gallery-image" loading="lazy" />
                ))}
              </div>
            </section>
          )}

          <section className="product-detail-data">
            <div className="product-detail-section-heading">
              <p>Specifications</p>
              <h2>Everything we know about this design</h2>
            </div>
            <dl className="product-detail-grid">
              {rows.map(([key, value]) => (
                <div key={key} className="product-detail-row">
                  <dt>{formatFieldLabel(key)}</dt>
                  <dd>{valueToNode(key, value)}</dd>
                </div>
              ))}
            </dl>
          </section>
        </article>
      </div>
    </div>
  );
}
