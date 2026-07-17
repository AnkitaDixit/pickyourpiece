import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ArticleCardVisual from "@/components/cards/ArticleCardVisual";
import MainLayout from "@/components/layout/MainLayout";
import { getAllArticles, getArticleBySlug } from "@/lib/articles";
import products from "@/data/products.json";
import type { Product } from "@/types/product";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.pickyourpiece.com";

type RouteParams = {
  slug: string;
};

type SearchIntent = {
  heading: string;
  subheading: string;
  searchQuery: string;
  terms: string[];
};

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
              <ReactMarkdown
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
                {article.content}
              </ReactMarkdown>
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
                <div className="article-card-image-wrap">
                  <ArticleCardVisual slug={entry.slug} title={entry.title} />
                </div>
                <span className="article-chip">{entry.category}</span>
                <h3>{entry.title}</h3>
                <p className="article-description">{entry.description}</p>
                <span className="article-read-time">{entry.readTime}</span>
                <Link href={`/articles/${entry.slug}`} className="article-link">
                  Read article
                </Link>
              </article>
            ))}
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
