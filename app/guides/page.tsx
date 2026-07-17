import type { Metadata } from "next";
import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import { getAllArticles } from "@/lib/articles";
import { GUIDE_HUBS, getGuideHubArticles } from "@/lib/guides";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.pickyourpiece.com";

export const metadata: Metadata = {
  title: "Jewellery Guides Hub | Engagement Rings, Diamonds, Gold, Silver and More",
  description:
    "Explore SEO-focused jewellery topic hubs for engagement rings, diamonds, gold, silver, gemstones, ring size, jewellery care, and gift guides.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/guides" },
  openGraph: {
    type: "website",
    url: `${siteUrl}/guides`,
    title: "Jewellery Guides Hub | PickYourPiece",
    description:
      "Browse topic hubs covering engagement ring guides, diamond education, metal guides, sizing, care, and gift planning.",
    images: [{ url: "/heroImage.png", width: 1200, height: 630, alt: "Jewellery guides hub" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jewellery Guides Hub | PickYourPiece",
    description:
      "Browse topic hubs covering engagement ring guides, diamond education, metal guides, sizing, care, and gift planning.",
    images: ["/heroImage.png"],
  },
};

export default async function GuidesPage() {
  const articles = await getAllArticles();

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "PickYourPiece Guides Hub",
    description:
      "Topic hubs for engagement rings, diamonds, gold, silver, gemstones, ring size, jewellery care, and gift guides.",
    url: `${siteUrl}/guides`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: GUIDE_HUBS.length,
      itemListElement: GUIDE_HUBS.map((hub, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: hub.title,
        url: `${siteUrl}/guides/${hub.slug}`,
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
            { label: "Guides" },
          ]}
        />

        <header className="articles-hero" aria-labelledby="guides-title">
          <p className="articles-kicker">Topic Hubs</p>
          <h1 id="guides-title">Explore Jewellery Guides by Topic</h1>
          <p>
            Find focused hub pages for broad keywords across engagement rings, diamonds, metals, ring size,
            jewellery care, and gifting.
          </p>
        </header>

        <section className="articles-section" aria-labelledby="guides-hubs-title">
          <div className="articles-section-head">
            <h2 id="guides-hubs-title">Guide Hubs</h2>
          </div>

          <div className="articles-grid" aria-label="Guide hubs">
            {GUIDE_HUBS.map((hub) => {
              const count = getGuideHubArticles(hub, articles, 12).length;
              return (
                <article key={hub.slug} className="article-card">
                  <Link href={`/guides/${hub.slug}`} className="article-card-link" aria-label={`Open ${hub.title}`}>
                    <span className="article-chip">{hub.kicker}</span>
                    <h3>{hub.title}</h3>
                    <p className="article-description">{hub.description}</p>
                    <span className="article-read-time">{count} related guide{count === 1 ? "" : "s"}</span>
                    <span className="article-link">Open hub</span>
                  </Link>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
