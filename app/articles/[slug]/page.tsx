import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ArticleCardVisual from "@/components/cards/ArticleCardVisual";
import MainLayout from "@/components/layout/MainLayout";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import { getAllArticles, getArticleBySlug } from "@/lib/articles";
import { buildProductDetailPath } from "@/lib/product-seo";
import products from "@/data/products.json";
import type { Product } from "@/types/product";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.pickyourpiece.com";
const SIGNIFICANT_PRICE_GAP_RATIO = 0.3;

type RouteParams = {
  slug: string;
};

type SearchIntent = {
  heading: string;
  subheading: string;
  searchQuery: string;
  terms: string[];
};

type ArticleInlineBlock =
  | { type: "markdown"; content: string }
  | { type: "product_grid"; style: string; limit: number; sort: "price_asc" | "price_desc" }
  | {
      type: "product_compare";
      title: string;
      caption?: string;
      style?: string;
      gemstone?: string;
      metal?: string;
      metalColor?: string;
      minPrice?: number;
      maxPrice?: number;
      sort: "price_asc" | "price_desc";
    };

const PRODUCT_GRID_SHORTCODE_REGEX = /\[product_grid\s+([^\]]+)\]/gi;
const PRODUCT_COMPARE_SHORTCODE_REGEX = /\[product_compare\s+([^\]]+)\]/gi;

const RELATED_SEARCH_BY_SLUG: Record<string, SearchIntent> = {
  "how-to-choose-engagement-ring": {
    heading: "Shop Engagement Rings",
    subheading: "Compare Across Brands",
    searchQuery: "engagement ring",
    terms: ["engagement", "solitaire", "halo", "diamond", "wedding"],
  },
  "engagement-ring-budget": {
    heading: "Shop Budget-Friendly Engagement Rings",
    subheading: "Find best-value picks",
    searchQuery: "engagement ring budget",
    terms: ["engagement", "diamond", "minimal", "everyday"],
  },
  "gold-vs-platinum": {
    heading: "Shop Gold & Platinum Rings",
    subheading: "Compare metal options",
    searchQuery: "gold platinum ring",
    terms: ["gold", "platinum", "ring"],
  },
  "how-to-measure-ring-size-at-home": {
    heading: "Shop Rings by Fit-Friendly Styles",
    subheading: "Explore adjustable and daily-wear rings",
    searchQuery: "daily wear ring",
    terms: ["ring", "daily", "minimal", "band"],
  },
  "lab-diamond-guide": {
    heading: "Shop Lab-Diamond Style Rings",
    subheading: "Compare modern diamond looks",
    searchQuery: "diamond ring",
    terms: ["diamond", "solitaire", "halo", "ring"],
  },
  "diamond-shapes-guide": {
    heading: "Shop Diamond Shape Inspired Rings",
    subheading: "Find the silhouette you love",
    searchQuery: "diamond shape ring",
    terms: ["diamond", "solitaire", "cluster", "ring"],
  },
  "rose-gold-guide": {
    heading: "Shop Rose Gold Rings",
    subheading: "Compare warm-tone favourites",
    searchQuery: "rose gold ring",
    terms: ["rose gold", "ring", "gold"],
  },
  "ring-size-guide": {
    heading: "Shop Everyday Fit Rings",
    subheading: "Comfortable styles across brands",
    searchQuery: "everyday ring",
    terms: ["everyday", "band", "minimal", "ring"],
  },
  "solitaire-vs-halo": {
    heading: "Shop Solitaire & Halo Rings",
    subheading: "Compare hero engagement styles",
    searchQuery: "solitaire halo ring",
    terms: ["solitaire", "halo", "engagement", "diamond"],
  },
};

function normalizeSearchText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]+/g, " ").replace(/\s+/g, " ").trim();
}

function toCurrency(value: number): string {
  return `INR ${value.toLocaleString("en-IN")}`;
}

function getArticleImageSrc(url: string): string {
  if (/^https?:\/\//i.test(url)) {
    return `/api/studio-image?url=${encodeURIComponent(url)}`;
  }
  return url;
}

const FULL_CATALOG_HREF = "/ring?sort=price-desc";

function getProductCardImage(product: Product & Record<string, unknown>): string {
  const candidates: string[] = [];

  if (typeof product.image === "string") {
    candidates.push(product.image);
  }

  if (Array.isArray(product.allImages)) {
    for (const item of product.allImages) {
      if (typeof item === "string") {
        candidates.push(item);
      }
    }
  } else if (typeof product.allImages === "string") {
    candidates.push(product.allImages);
  }

  return candidates.map((item) => item.trim()).find((item) => item.length > 0) ?? "";
}

function buildDescriptiveProductAlt(product: Product & Record<string, unknown>): string {
  const parts: string[] = [];
  const name = (product.name ?? "").trim();
  const purity = (product.purity ?? "").trim();
  const metalColor = (product.metalColor ?? "").trim();
  const metal = (product.metal ?? "").trim();
  const style = Array.isArray(product.style) ? (product.style[0] ?? "").trim() : "";
  const gemstone = Array.isArray(product.gemstone) ? (product.gemstone[0] ?? "").trim() : "";

  if (name) {
    parts.push(name);
  }

  const materialBits = [purity, metalColor, metal].filter(Boolean).join(" ");
  if (materialBits) {
    parts.push(`in ${materialBits}`);
  }

  if (style) {
    parts.push(`${style.toLowerCase()} style`);
  }

  if (gemstone) {
    parts.push(`${gemstone.toLowerCase()} accents`);
  }

  const alt = parts.join(" ").replace(/\s+/g, " ").trim();
  return alt || "Jewellery product ring";
}

function parseShortcodeAttributes(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const attrRegex = /(\w+)="([^"]*)"/g;

  for (const match of raw.matchAll(attrRegex)) {
    const key = match[1];
    const value = match[2];
    if (key) {
      attrs[key] = value;
    }
  }

  return attrs;
}

function normalizeFilterValue(value: unknown): string {
  if (typeof value !== "string") return "";
  return normalizeSearchText(value);
}

function filterCatalogProducts(
  items: Array<Product & Record<string, unknown>>,
  criteria: {
    style?: string;
    gemstone?: string;
    metal?: string;
    metalColor?: string;
    minPrice?: number;
    maxPrice?: number;
  }
) {
  const styleNeedle = normalizeFilterValue(criteria.style);
  const gemstoneNeedle = normalizeFilterValue(criteria.gemstone);
  const metalNeedle = normalizeFilterValue(criteria.metal);
  const metalColorNeedle = normalizeFilterValue(criteria.metalColor);

  return items.filter((product) => {
    const styleValues = Array.isArray(product.style) ? product.style : [];
    const gemstoneValues = Array.isArray(product.gemstone) ? product.gemstone : [];

    if (styleNeedle) {
      const styleMatch = styleValues.some((style) => normalizeSearchText(style) === styleNeedle);
      if (!styleMatch) return false;
    }

    if (gemstoneNeedle) {
      const gemstoneMatch = gemstoneValues.some((gem) => normalizeSearchText(gem) === gemstoneNeedle);
      if (!gemstoneMatch) return false;
    }

    if (metalNeedle && normalizeSearchText(product.metal ?? "") !== metalNeedle) {
      return false;
    }

    if (metalColorNeedle && normalizeSearchText(product.metalColor ?? "") !== metalColorNeedle) {
      return false;
    }

    if (typeof criteria.minPrice === "number" && Number.isFinite(criteria.minPrice) && product.price < criteria.minPrice) {
      return false;
    }

    if (typeof criteria.maxPrice === "number" && Number.isFinite(criteria.maxPrice) && product.price > criteria.maxPrice) {
      return false;
    }

    return true;
  });
}

function pickSignificantCrossBrandPair(
  items: Array<Product & Record<string, unknown>>
): { left: Product & Record<string, unknown>; right: Product & Record<string, unknown> } | null {
  let best:
    | {
        left: Product & Record<string, unknown>;
        right: Product & Record<string, unknown>;
        ratio: number;
      }
    | null = null;

  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      const a = items[i];
      const b = items[j];
      if (!a || !b) continue;

      const brandA = normalizeSearchText(a.brand ?? "");
      const brandB = normalizeSearchText(b.brand ?? "");
      if (!brandA || !brandB || brandA === brandB) continue;

      const lower = Math.min(a.price, b.price);
      if (!Number.isFinite(lower) || lower <= 0) continue;

      const ratio = Math.abs(a.price - b.price) / lower;
      if (ratio < SIGNIFICANT_PRICE_GAP_RATIO) continue;

      if (!best || ratio > best.ratio) {
        best = { left: a, right: b, ratio };
      }
    }
  }

  if (!best) return null;

  return best.left.price >= best.right.price
    ? { left: best.left, right: best.right }
    : { left: best.right, right: best.left };
}

function parseArticleInlineBlocks(content: string): ArticleInlineBlock[] {
  const blocks: ArticleInlineBlock[] = [];
  const tokens: Array<{ start: number; end: number; block: ArticleInlineBlock }> = [];

  PRODUCT_GRID_SHORTCODE_REGEX.lastIndex = 0;

  for (const match of content.matchAll(PRODUCT_GRID_SHORTCODE_REGEX)) {
    const full = match[0];
    const attrsRaw = match[1] ?? "";
    const attrs = parseShortcodeAttributes(attrsRaw);
    const style = attrs.style?.trim();
    const limitRaw = attrs.limit;
    const start = match.index ?? 0;
    const end = start + full.length;

    if (style) {
      const parsedLimit = Number(limitRaw);
      const safeLimit = Number.isFinite(parsedLimit)
        ? Math.min(20, Math.max(1, parsedLimit))
        : 8;
      const sort = attrs.sort === "price_asc" ? "price_asc" : "price_desc";
      tokens.push({
        start,
        end,
        block: { type: "product_grid", style, limit: safeLimit, sort },
      });
    }
  }

  PRODUCT_COMPARE_SHORTCODE_REGEX.lastIndex = 0;
  for (const match of content.matchAll(PRODUCT_COMPARE_SHORTCODE_REGEX)) {
    const full = match[0];
    const attrsRaw = match[1] ?? "";
    const attrs = parseShortcodeAttributes(attrsRaw);
    const start = match.index ?? 0;
    const end = start + full.length;

    const title = attrs.title?.trim();
    if (!title) continue;

    const minPrice = Number(attrs.minPrice);
    const maxPrice = Number(attrs.maxPrice);
    const sort = attrs.sort === "price_desc" ? "price_desc" : "price_asc";

    tokens.push({
      start,
      end,
      block: {
        type: "product_compare",
        title,
        caption: attrs.caption?.trim(),
        style: attrs.style?.trim(),
        gemstone: attrs.gemstone?.trim(),
        metal: attrs.metal?.trim(),
        metalColor: attrs.metalColor?.trim(),
        minPrice: Number.isFinite(minPrice) ? minPrice : undefined,
        maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
        sort,
      },
    });
  }

  const orderedTokens = tokens.sort((a, b) => a.start - b.start);
  let lastIndex = 0;
  for (const token of orderedTokens) {
    const markdownChunk = content.slice(lastIndex, token.start).trim();
    if (markdownChunk) {
      blocks.push({ type: "markdown", content: markdownChunk });
    }
    blocks.push(token.block);
    lastIndex = token.end;
  }

  const tail = content.slice(lastIndex).trim();
  if (tail) {
    blocks.push({ type: "markdown", content: tail });
  }

  return blocks.length > 0 ? blocks : [{ type: "markdown", content }];
}

function getSearchIntent(slug: string): SearchIntent {
  return RELATED_SEARCH_BY_SLUG[slug] ?? {
    heading: "Shop Rings",
    subheading: "Compare Across Brands",
    searchQuery: "ring",
    terms: ["ring"],
  };
}

function countMatchingProducts(items: Array<Product & Record<string, unknown>>, terms: string[]): number {
  const normalizedTerms = terms.map((term) => normalizeSearchText(term)).filter(Boolean);
  if (normalizedTerms.length === 0) return items.length;

  return items.filter((product) => {
    const haystack = normalizeSearchText(
      [
        product.name,
        product.brand,
        product.category,
        product.metal,
        product.purity ?? "",
        (product.gemstone ?? []).join(" "),
        (product.style ?? []).join(" "),
        (product.occasion ?? []).join(" "),
        typeof product.description === "string" ? product.description : "",
      ].join(" ")
    );

    return normalizedTerms.some((term) => haystack.includes(term));
  }).length;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function toPlainText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(toPlainText).join("");
  }

  if (node && typeof node === "object" && "props" in node) {
    return toPlainText((node as { props?: { children?: ReactNode } }).props?.children ?? "");
  }

  return "";
}

export async function generateStaticParams() {
  const articles = await getAllArticles();
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return {
      title: "Article Not Found | PickYourPiece",
      robots: { index: false, follow: false },
    };
  }

  const canonicalPath = `/articles/${article.slug}`;

  return {
    title: `${article.title} | PickYourPiece Articles`,
    description: article.description,
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      type: "article",
      url: `${siteUrl}${canonicalPath}`,
      title: article.title,
      description: article.description,
      images: [
        {
          url: article.image,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
      images: [article.image],
    },
  };
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    image: `${siteUrl}${article.image}`,
    author: {
      "@type": "Organization",
      name: "PickYourPiece",
    },
    publisher: {
      "@type": "Organization",
      name: "PickYourPiece",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/logo.png`,
      },
    },
    mainEntityOfPage: `${siteUrl}/articles/${article.slug}`,
    articleSection: article.topic,
  };

  const allArticles = await getAllArticles();
  const relatedArticles = allArticles.filter((entry) => entry.slug !== article.slug).slice(0, 3);
  const intent = getSearchIntent(article.slug);
  const catalog = products as Array<Product & Record<string, unknown>>;
  const articleBlocks = parseArticleInlineBlocks(article.content);
  const matchedProductCount = countMatchingProducts(catalog, intent.terms);
  const relatedProductsHref = `/ring?q=${encodeURIComponent(intent.searchQuery)}`;
  const tocItems = article.content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("## "))
    .map((line) => line.replace(/^##\s+/, ""))
    .map((heading) => ({ label: heading, id: slugify(heading) }));

  return (
    <MainLayout>
      <div className="articles-page article-detail-page">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
        />

        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Articles", href: "/articles" },
            { label: article.title },
          ]}
        />

        <article className="article-detail" id="article-top">
          <header className="article-detail-header">
            <p className="articles-kicker">{article.category}</p>
            <h1>{article.title}</h1>
            <p className="article-detail-meta">{article.readTime}</p>
            <p className="article-detail-intro">{article.description}</p>
          </header>

          <div className="article-detail-body">
            {tocItems.length > 0 ? (
              <aside className="article-toc" aria-label="Article sections">
                <p>On this page</p>
                <nav>
                  {tocItems.map((item) => (
                    <a key={item.id} href={`#${item.id}`}>
                      {item.label}
                    </a>
                  ))}
                </nav>
              </aside>
            ) : null}

            <div className="article-detail-content article-markdown">
              {articleBlocks.map((block, index) => {
                if (block.type === "markdown") {
                  return (
                    <ReactMarkdown
                      key={`md-block-${index}`}
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h2: ({ children }) => {
                          const text = toPlainText(children);
                          const id = slugify(text);
                          return (
                            <h2 id={id}>
                              <a href={`#${id}`} aria-label={`Jump to section ${text}`}>
                                {children}
                              </a>
                            </h2>
                          );
                        },
                        h3: ({ children }) => {
                          const text = toPlainText(children);
                          const id = slugify(text);
                          return <h3 id={id}>{children}</h3>;
                        },
                      }}
                    >
                      {block.content}
                    </ReactMarkdown>
                  );
                }

                if (block.type === "product_compare") {
                  const filtered = filterCatalogProducts(catalog, {
                    style: block.style,
                    gemstone: block.gemstone,
                    metal: block.metal,
                    metalColor: block.metalColor,
                    minPrice: block.minPrice,
                    maxPrice: block.maxPrice,
                  });

                  const ordered = [...filtered].sort((a, b) => {
                    if (block.sort === "price_desc") return b.price - a.price;
                    return a.price - b.price;
                  });

                  const pair = pickSignificantCrossBrandPair(ordered);
                  if (!pair) {
                    return null;
                  }

                  const { left, right } = pair;
                  const delta = Math.abs(left.price - right.price);

                  return (
                    <section
                      key={`product-compare-${block.title}-${index}`}
                      className="article-inline-product-compare"
                      aria-label={block.title}
                    >
                      <p className="article-inline-product-grid-kicker">Comparison Example</p>
                      <h3>{block.title}</h3>
                      <div className="article-inline-product-compare-row">
                        {[left, right].map((product) => {
                          const detailPath = buildProductDetailPath(product);
                          const href = detailPath ?? product.productUrl;
                          const isExternal = /^https?:\/\//i.test(href);
                          const productImage = getProductCardImage(product);
                          const productAlt = buildDescriptiveProductAlt(product);

                          return (
                            <a
                              key={`${block.title}-${product.id}`}
                              href={href}
                              className="article-inline-product-card"
                              {...(isExternal ? { target: "_blank", rel: "noreferrer" } : {})}
                            >
                              <div className="article-inline-product-thumb">
                                {productImage ? (
                                  <Image
                                    src={getArticleImageSrc(productImage)}
                                    alt={productAlt}
                                    fill
                                    unoptimized
                                    sizes="(max-width: 900px) 44vw, 220px"
                                  />
                                ) : null}
                              </div>
                              <span className="article-inline-product-brand">{product.brand}</span>
                              <strong className="article-inline-product-name">{product.name}</strong>
                              <span className="article-inline-product-price">{toCurrency(product.price)}</span>
                            </a>
                          );
                        })}
                      </div>
                      {block.caption ? (
                        <p className="article-inline-product-compare-caption">{block.caption}</p>
                      ) : null}
                      <p className="article-inline-product-compare-note">
                        Price gap in this example: <strong>{toCurrency(delta)}</strong>
                      </p>
                      <div className="article-inline-product-actions">
                        <Link href={FULL_CATALOG_HREF} className="article-inline-see-all-link">
                          See all in catalog
                        </Link>
                      </div>
                    </section>
                  );
                }

                const styleNeedle = normalizeSearchText(block.style);
                const matches = filterCatalogProducts(catalog, { style: styleNeedle })
                  .sort((a, b) => {
                    if (block.sort === "price_asc") return a.price - b.price;
                    return b.price - a.price;
                  })
                  .slice(0, block.limit);

                if (matches.length === 0) {
                  return null;
                }

                return (
                  <section
                    key={`product-grid-${block.style}-${index}`}
                    className="article-inline-product-grid"
                    aria-label={`${block.style} product cards`}
                  >
                    <p className="article-inline-product-grid-kicker">Filtered by style: {block.style}</p>
                    <div className="article-inline-product-grid-list">
                      {matches.map((product) => {
                        const detailPath = buildProductDetailPath(product);
                        const href = detailPath ?? product.productUrl;
                        const isExternal = /^https?:\/\//i.test(href);
                        const productImage = getProductCardImage(product);
                        const productAlt = buildDescriptiveProductAlt(product);

                        return (
                          <a
                            key={`${block.style}-${product.id}`}
                            href={href}
                            className="article-inline-product-card"
                            {...(isExternal ? { target: "_blank", rel: "noreferrer" } : {})}
                          >
                            <div className="article-inline-product-thumb">
                              {productImage ? (
                                <Image
                                  src={getArticleImageSrc(productImage)}
                                  alt={productAlt}
                                  fill
                                  unoptimized
                                  sizes="(max-width: 900px) 42vw, 180px"
                                />
                              ) : null}
                            </div>
                            <span className="article-inline-product-brand">{product.brand}</span>
                            <strong className="article-inline-product-name">{product.name}</strong>
                            <span className="article-inline-product-price">{toCurrency(product.price)}</span>
                          </a>
                        );
                      })}
                    </div>
                    <div className="article-inline-product-actions">
                      <Link href={FULL_CATALOG_HREF} className="article-inline-see-all-link">
                        See all in catalog
                      </Link>
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        </article>

        <a className="article-scroll-top" href="#article-top" aria-label="Back to top">
          Top
        </a>

        <section className="article-related-shop" aria-labelledby="related-products-title">
          <p className="articles-kicker">Related Products</p>
          <h2 id="related-products-title">{intent.heading}</h2>
          <p className="article-related-subheading">{intent.subheading}</p>
          <div className="article-related-metrics" aria-label="Related product stats">
            <span>{matchedProductCount.toLocaleString("en-IN")}+ Designs</span>
            <span>Compare Across Brands</span>
          </div>
          <Link href={relatedProductsHref} className="article-related-cta">
            Compare Across Brands →
          </Link>
        </section>

        <section className="articles-section" aria-labelledby="related-articles-title">
          <div className="articles-section-head">
            <h2 id="related-articles-title">More Articles</h2>
          </div>

          <div className="articles-grid">
            {relatedArticles.map((entry) => (
              <article key={entry.slug} className="article-card">
                <Link href={`/articles/${entry.slug}`} className="article-card-link" aria-label={`Read ${entry.title}`}>
                  <div className="article-card-image-wrap">
                    <ArticleCardVisual slug={entry.slug} title={entry.title} />
                  </div>
                  <span className="article-chip" data-topic={entry.topic}>{entry.topic}</span>
                  <h3>{entry.title}</h3>
                  <p className="article-description">{entry.description}</p>
                  <span className="article-read-time">{entry.readTime}</span>
                  <span className="article-link">Read article</span>
                </Link>
              </article>
            ))}
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
