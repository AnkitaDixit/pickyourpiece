import type { Metadata } from "next";
import { cache, type ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ArticleCardVisual from "@/components/cards/ArticleCardVisual";
import MainLayout from "@/components/layout/MainLayout";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import { getAllArticles } from "@/lib/articles";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.pickyourpiece.com";
const getAllArticlesCached = cache(async () => getAllArticles());
const getArticleBySlugCached = cache(async (slug: string) => {
  const articles = await getAllArticlesCached();
  return articles.find((article) => article.slug === slug);
});

type RouteParams = {
  slug: string;
};

const ARTICLE_CATALOG_SHORTCODE_REGEX = /\[(?:product_grid|product_compare)\s+[^\]]+\]\s*/gi;

function stripArticleCatalogShortcodes(content: string): string {
  ARTICLE_CATALOG_SHORTCODE_REGEX.lastIndex = 0;
  return content.replace(ARTICLE_CATALOG_SHORTCODE_REGEX, "").trim();
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
  const articles = await getAllArticlesCached();
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlugCached(slug);

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
    keywords: article.keywords,
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
  const allArticles = await getAllArticlesCached();
  const article = allArticles.find((entry) => entry.slug === slug);

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
    keywords: article.keywords,
    dateModified: article.lastModified,
  };

  const relatedArticles = allArticles.filter((entry) => entry.slug !== article.slug).slice(0, 3);
  const articleContent = stripArticleCatalogShortcodes(article.content);
  const tocItems = articleContent
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
                {articleContent}
              </ReactMarkdown>
            </div>
          </div>
        </article>

        <a className="article-scroll-top" href="#article-top" aria-label="Back to top">
          Top
        </a>

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
