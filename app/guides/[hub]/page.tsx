import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import ArticleCardVisual from "@/components/cards/ArticleCardVisual";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import { getAllArticles } from "@/lib/articles";
import { GUIDE_HUBS, getGuideHubArticles, getGuideHubBySlug } from "@/lib/guides";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.pickyourpiece.com";

type RouteParams = {
  hub: string;
};

export async function generateStaticParams() {
  return GUIDE_HUBS.map((hub) => ({ hub: hub.slug }));
}

export async function generateMetadata({ params }: { params: Promise<RouteParams> }): Promise<Metadata> {
  const { hub } = await params;
  const selectedHub = getGuideHubBySlug(hub);

  if (!selectedHub) {
    return {
      title: "Guides | PickYourPiece",
      robots: { index: false, follow: false },
    };
  }

  const canonicalPath = `/guides/${selectedHub.slug}`;

  return {
    title: `${selectedHub.title} | PickYourPiece Guides`,
    description: selectedHub.description,
    keywords: selectedHub.seoKeywords,
    robots: { index: true, follow: true },
    alternates: { canonical: canonicalPath },
    openGraph: {
      type: "website",
      url: `${siteUrl}${canonicalPath}`,
      title: `${selectedHub.title} | PickYourPiece`,
      description: selectedHub.description,
      images: [{ url: "/heroImage.png", width: 1200, height: 630, alt: selectedHub.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${selectedHub.title} | PickYourPiece`,
      description: selectedHub.description,
      images: ["/heroImage.png"],
    },
  };
}

export default async function GuideHubPage({ params }: { params: Promise<RouteParams> }) {
  const { hub } = await params;
  const selectedHub = getGuideHubBySlug(hub);

  if (!selectedHub) {
    notFound();
  }

  const allArticles = await getAllArticles();
  const hubArticles = getGuideHubArticles(selectedHub, allArticles, 24);
  const fallbackArticles = allArticles.filter((article) => !hubArticles.some((entry) => entry.slug === article.slug)).slice(0, 6);

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: selectedHub.title,
    description: selectedHub.description,
    url: `${siteUrl}/guides/${selectedHub.slug}`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: hubArticles.length,
      itemListElement: hubArticles.map((article, index) => ({
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
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />

        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Guides", href: "/guides" },
            { label: selectedHub.title },
          ]}
        />

        <header className="articles-hero" aria-labelledby="guide-hub-title">
          <p className="articles-kicker">{selectedHub.kicker}</p>
          <h1 id="guide-hub-title">{selectedHub.title}</h1>
          <p>{selectedHub.intro}</p>

          <div className="articles-topics" role="list" aria-label="Primary keyword targets">
            {[selectedHub.primaryKeyword, ...selectedHub.seoKeywords.slice(1, 4)].map((keyword) => (
              <Link
                key={keyword}
                role="listitem"
                href={`/articles?q=${encodeURIComponent(keyword)}`}
                className="topic-pill"
              >
                {keyword}
              </Link>
            ))}
          </div>
        </header>

        <section className="articles-section" aria-labelledby="hub-guides-title">
          <div className="articles-section-head">
            <h2 id="hub-guides-title">Guides in This Hub</h2>
          </div>

          {hubArticles.length > 0 ? (
            <div className="articles-grid" aria-label={`${selectedHub.title} guides`}>
              {hubArticles.map((article) => (
                <article key={article.slug} className="article-card">
                  <Link href={`/articles/${article.slug}`} className="article-card-link" aria-label={`Read ${article.title}`}>
                    <div className="article-card-image-wrap">
                      <ArticleCardVisual slug={article.slug} title={article.title} />
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
          ) : (
            <>
              <p className="articles-filter-note">
                This hub is growing. Start with these related guides while we expand dedicated content.
              </p>
              <div className="articles-grid" aria-label="Related fallback guides">
                {fallbackArticles.map((article) => (
                  <article key={article.slug} className="article-card">
                    <Link href={`/articles/${article.slug}`} className="article-card-link" aria-label={`Read ${article.title}`}>
                      <div className="article-card-image-wrap">
                        <ArticleCardVisual slug={article.slug} title={article.title} />
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
            </>
          )}
        </section>

        <section className="articles-section" aria-labelledby="more-hubs-title">
          <div className="articles-section-head">
            <h2 id="more-hubs-title">Explore Other Hubs</h2>
          </div>
          <div className="articles-topics" role="list" aria-label="Other topic hubs">
            {GUIDE_HUBS.filter((entry) => entry.slug !== selectedHub.slug).map((entry) => (
              <Link key={entry.slug} role="listitem" href={`/guides/${entry.slug}`} className="topic-pill">
                {entry.title}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
