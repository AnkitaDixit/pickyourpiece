import type { Metadata } from "next";
import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";
import ArticleCardVisual from "@/components/cards/ArticleCardVisual";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import { ARTICLE_TOPICS, getAllArticles } from "@/lib/articles";
import { GUIDE_HUBS } from "@/lib/guides";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.pickyourpiece.com";

export const metadata: Metadata = {
  title: "Jewellery Articles | Guides for Rings, Diamonds and Metals",
  description:
    "Magazine-style jewellery articles on engagement rings, diamonds, gemstones, metals, and buying guides.",
  robots: {
    index: true,
    follow: true,
  },
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
    ? filteredArticles.filter((article) => article.slug !== featuredArticle.slug)
    : filteredArticles;

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

        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Articles" },
          ]}
        />

        <header className="articles-hero" aria-labelledby="articles-title">
          <p className="articles-kicker">Jewellery Buying Guides</p>
          <h1 id="articles-title">Learn from experts before you buy.</h1>
          <p>
            Educational content built on real jewellery comparison data so you can choose with confidence.
          </p>

          <ul className="articles-hero-metrics" aria-label="Articles proof points">
            <li>10k+ rings compared</li>
            <li>8 trusted brands</li>
            <li>{Math.max(20, articles.length)}+ buying guides</li>
          </ul>

          <form className="articles-search" action="/articles" method="get">
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search articles"
              aria-label="Search articles"
            />
            <button type="submit">Search Articles</button>
            {topicFilter ? <input type="hidden" name="topic" value={topicFilter} /> : null}
          </form>
        </header>

        <section className="articles-section" aria-labelledby="articles-topics-title">
          <div className="articles-section-head">
            <h2 id="articles-topics-title">Browse by Topic</h2>
          </div>

          <div className="articles-topics" role="list" aria-label="Article topics">
            <Link
              role="listitem"
              href="/articles"
              scroll={false}
              aria-current={topicFilter.length === 0 ? "page" : undefined}
              className={`topic-pill${topicFilter.length === 0 ? " active" : ""}`}
            >
              All
            </Link>
            {ARTICLE_TOPICS.map((topic) => (
              <Link
                key={topic}
                role="listitem"
                href={`/articles?topic=${encodeURIComponent(topic)}`}
                scroll={false}
                data-topic={topic}
                aria-current={topicFilter === topic ? "page" : undefined}
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
                  <Link href={`/articles/${article.slug}`} className="article-card-link" aria-label={`Read ${article.title}`}>
                    <div className="article-card-image-wrap">
                      <ArticleCardVisual
                        slug={article.slug}
                        title={article.title}
                      />
                    </div>
                    <span className="article-chip" data-topic={article.topic}>{article.topic}</span>
                    <h3>{article.title}</h3>
                    <p className="article-description">{article.description}</p>
                    <span className="article-read-time">{article.readTime}</span>
                    <span className="article-link">Read article</span>
                  </Link>
                </article>
              ))}
            </div>
          ) : null}

          {(query || topicFilter) && filteredArticles.length === 0 ? (
            <p className="articles-filter-note">No articles matched your filters. Try a broader search.</p>
          ) : null}
        </section>

        {featuredArticle ? (
          <section className="articles-section" aria-labelledby="articles-featured-title">
          <div className="articles-section-head">
            <h2 id="articles-featured-title">Featured</h2>
          </div>
          <article className="article-featured-card">
            <Link
              href={`/articles/${featuredArticle.slug}`}
              className="article-featured-link"
              aria-label={`Read ${featuredArticle.title}`}
            >
              <div className="article-card-image-wrap">
                <ArticleCardVisual
                  slug={featuredArticle.slug}
                  title={featuredArticle.title}
                  featured
                />
              </div>
              <div className="article-featured-content">
                <span className="article-chip" data-topic={featuredArticle.topic}>{featuredArticle.topic}</span>
                <h3>{featuredArticle.title}</h3>
                <p>{featuredArticle.description}</p>
                <span className="article-link">Read article</span>
              </div>
            </Link>
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
                <Link href={`/articles/${article.slug}`} className="article-card-link" aria-label={`Read ${article.title}`}>
                  <div className="article-card-image-wrap">
                    <ArticleCardVisual
                      slug={article.slug}
                      title={article.title}
                    />
                  </div>
                  <span className="article-chip" data-topic={article.topic}>{article.topic}</span>
                  <h3>{article.title}</h3>
                  <p className="article-description">{article.description}</p>
                  <span className="article-read-time">{article.readTime}</span>
                  <span className="article-link">Read article</span>
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="articles-section" aria-labelledby="articles-guidebar-title">
          <div className="articles-section-head">
            <h2 id="articles-guidebar-title">Guide Bar</h2>
          </div>

          <div className="articles-guidebar" role="list" aria-label="Guides hubs quick links">
            <Link role="listitem" href="/guides" className="topic-pill">
              All Guides
            </Link>
            {GUIDE_HUBS.map((hub) => (
              <Link key={hub.slug} role="listitem" href={`/guides/${hub.slug}`} className="topic-pill">
                {hub.title}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </MainLayout>
  );
}