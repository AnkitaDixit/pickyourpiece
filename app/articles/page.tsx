import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";
import { ARTICLE_TOPICS, getAllArticles } from "@/lib/articles";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.pickyourpiece.com";

export const metadata: Metadata = {
  title: "Jewellery Articles | Guides for Rings, Diamonds and Metals",
  description:
    "Magazine-style jewellery articles on engagement rings, diamonds, gemstones, metals, and buying guides.",
  alternates: {
    canonical: "/articles",
  },
  openGraph: {
    type: "website",
    url: `${siteUrl}/articles`,
    title: "Jewellery Articles | PickYourPiece",
    description:
      "Explore jewellery guides for engagement rings, metals, diamonds, care, and buying decisions.",
    images: [
      {
        url: "/heroImage.png",
        width: 1200,
        height: 630,
        alt: "PickYourPiece articles and jewellery guides",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jewellery Articles | PickYourPiece",
    description:
      "Explore jewellery guides for engagement rings, metals, diamonds, care, and buying decisions.",
    images: ["/heroImage.png"],
  },
};

type SearchParamsInput = {
  q?: string | string[];
  topic?: string | string[];
};

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsInput>;
}) {
  const articles = await getAllArticles();
  const resolvedSearchParams = await searchParams;
  const query = (getSingleParam(resolvedSearchParams.q) ?? "").trim().toLowerCase();
  const topicFilter = (getSingleParam(resolvedSearchParams.topic) ?? "").trim();

  const filteredArticles = articles.filter((article) => {
    const matchesQuery =
      query.length === 0 ||
      [article.title, article.description, article.category, article.topic, article.content]
        .join(" ")
        .toLowerCase()
        .includes(query);
    const matchesTopic = topicFilter.length === 0 || article.topic === topicFilter;
    return matchesQuery && matchesTopic;
  });

  const featuredArticle = articles.find((article) => article.featured) ?? articles[0];
  const latestArticles = featuredArticle
    ? filteredArticles.filter((article) => article.slug !== featuredArticle.slug).slice(0, 6)
    : filteredArticles.slice(0, 6);

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "PickYourPiece Articles",
    description: "Magazine-style jewellery articles for buying guides, metals, diamonds, and engagement rings.",
    url: `${siteUrl}/articles`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: filteredArticles.length,
      itemListElement: filteredArticles.map((article, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: article.title,
        url: `${siteUrl}/articles/${article.slug}`,
      })),
    },
  };

  return (
    <MainLayout>
      <div className="articles-page">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        />

        <header className="articles-hero" aria-labelledby="articles-title">
          <p className="articles-kicker">Jewellery Articles</p>
          <h1 id="articles-title">Learn about rings, diamonds, gemstones, metals, and buying guides</h1>
          <p>
            Editorial-style explainers designed for evergreen decisions, from engagement picks to long-term jewellery
            care.
          </p>

          <form className="articles-search" action="/articles" method="get">
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search articles"
              aria-label="Search articles"
            />
            {topicFilter ? <input type="hidden" name="topic" value={topicFilter} /> : null}
          </form>
        </header>

        {featuredArticle ? (
          <section className="articles-section" aria-labelledby="articles-featured-title">
          <div className="articles-section-head">
            <h2 id="articles-featured-title">Featured</h2>
          </div>
          <article className="article-featured-card">
            <div className="article-card-image-wrap">
              <Image
                src={featuredArticle.image}
                alt={featuredArticle.title}
                fill
                sizes="(max-width: 900px) 100vw, 540px"
                className="article-card-image"
              />
            </div>
            <div className="article-featured-content">
              <span className="article-chip">{featuredArticle.category}</span>
              <h3>{featuredArticle.title}</h3>
              <p>{featuredArticle.description}</p>
              <Link href={`/articles/${featuredArticle.slug}`} className="article-link">
                Read featured guide
              </Link>
            </div>
          </article>
          </section>
        ) : null}

        <section className="articles-section" aria-labelledby="articles-latest-title">
          <div className="articles-section-head">
            <h2 id="articles-latest-title">Latest Articles</h2>
          </div>

          <div className="articles-grid" aria-label="Latest articles">
            {latestArticles.map((article) => (
              <article key={article.slug} className="article-card">
                <div className="article-card-image-wrap">
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 900px) 50vw, 33vw"
                    className="article-card-image"
                  />
                </div>
                <span className="article-chip">{article.category}</span>
                <h3>{article.title}</h3>
                <p className="article-description">{article.description}</p>
                <span className="article-read-time">{article.readTime}</span>
                <Link href={`/articles/${article.slug}`} className="article-link">
                  Read article
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="articles-section" aria-labelledby="articles-topics-title">
          <div className="articles-section-head">
            <h2 id="articles-topics-title">Browse by Topic</h2>
          </div>

          <div className="articles-topics" role="list" aria-label="Article topics">
            {ARTICLE_TOPICS.map((topic) => (
              <Link
                key={topic}
                role="listitem"
                href={`/articles?topic=${encodeURIComponent(topic)}`}
                className={`topic-pill${topicFilter === topic ? " active" : ""}`}
              >
                {topic}
              </Link>
            ))}
          </div>

          {query || topicFilter ? (
            <p className="articles-filter-note">
              Showing {filteredArticles.length} result{filteredArticles.length === 1 ? "" : "s"}
              {topicFilter ? ` in ${topicFilter}` : ""}
              {query ? ` for \"${query}\"` : ""}.
            </p>
          ) : null}

          {(query || topicFilter) && filteredArticles.length > 0 ? (
            <div className="articles-grid" aria-label="Filtered articles">
              {filteredArticles.map((article) => (
                <article key={`${article.slug}-filtered`} className="article-card">
                  <div className="article-card-image-wrap">
                    <Image
                      src={article.image}
                      alt={article.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 900px) 50vw, 33vw"
                      className="article-card-image"
                    />
                  </div>
                  <span className="article-chip">{article.category}</span>
                  <h3>{article.title}</h3>
                  <p className="article-description">{article.description}</p>
                  <span className="article-read-time">{article.readTime}</span>
                  <Link href={`/articles/${article.slug}`} className="article-link">
                    Read article
                  </Link>
                </article>
              ))}
            </div>
          ) : null}

          {(query || topicFilter) && filteredArticles.length === 0 ? (
            <p className="articles-filter-note">No articles matched your filters. Try a broader search.</p>
          ) : null}
        </section>
      </div>
    </MainLayout>
  );
}