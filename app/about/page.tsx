import type { Metadata } from "next";
import MainLayout from "@/components/layout/MainLayout";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.pickyourpiece.com";

export const metadata: Metadata = {
  title: "About Pick Your Piece (PYP)",
  description:
    "Learn about Pick Your Piece (PYP), a one-stop jewellery comparison platform that helps shoppers compare brands, prices, styles, metals, and purity in one place.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    type: "website",
    url: `${siteUrl}/about`,
    title: "About Pick Your Piece (PYP)",
    description:
      "Pick Your Piece (PYP) is a one-stop jewellery comparison platform that helps shoppers avoid decision overload by comparing top brands in one place.",
    images: [
      {
        url: "/heroImage.png",
        width: 1200,
        height: 630,
        alt: "About Pick Your Piece",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About Pick Your Piece (PYP)",
    description:
      "Pick Your Piece (PYP) helps shoppers compare jewellery across brands in one place so they can buy smarter and faster.",
    images: ["/heroImage.png"],
  },
};

export default function AboutPage() {
  const aboutSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About Pick Your Piece (PYP)",
    url: `${siteUrl}/about`,
    isPartOf: {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
    },
    about: {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "Pick Your Piece",
      alternateName: ["PYP", "PickYourPiece", "PyP"],
    },
  };

  return (
    <MainLayout>
      <div className="articles-page">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }} />

        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "About" },
          ]}
        />

        <header className="articles-hero" aria-labelledby="about-title">
          <p className="articles-kicker">About</p>
          <h1 id="about-title">About Pick Your Piece (PYP)</h1>
          <p>
            Pick Your Piece, also searched as PickYourPiece or PYP, is a one-stop jewellery comparison platform built
            to help shoppers discover, compare, and choose jewellery with confidence.
          </p>
        </header>

        <section className="articles-section" aria-labelledby="about-mission-title">
          <div className="articles-section-head">
            <h2 id="about-mission-title">Our Mission</h2>
          </div>
          <p className="article-description">
            Our mission is to simplify online jewellery discovery by bringing multiple brands into one searchable
            experience with practical filters for price, style, metal, purity, and occasion.
          </p>
        </section>

        <section className="articles-section" aria-labelledby="about-vision-title">
          <div className="articles-section-head">
            <h2 id="about-vision-title">Our Vision: One-Stop Jewellery Comparison</h2>
          </div>
          <p className="article-description">
            Online jewellery shopping can feel overwhelming when you open dozens of tabs across many brands,
            marketplaces, and collections. Our vision is to make Pick Your Piece the one-stop solution where shoppers
            do not get lost in endless browsing and instead make faster, smarter, and more confident decisions.
          </p>
          <p className="article-description">
            We focus on transparent jewellery comparison, clear product discovery, and buyer-first information so every
            user can compare options side by side before buying.
          </p>
        </section>

        <section className="articles-section" aria-labelledby="about-seo-title">
          <div className="articles-section-head">
            <h2 id="about-seo-title">Why Pick Your Piece Helps You Buy Better</h2>
          </div>
          <ul className="articles-hero-metrics" aria-label="Benefits of Pick Your Piece">
            <li>Compare jewellery prices across top brands in one place</li>
            <li>Discover rings by metal, purity, style, occasion, and budget</li>
            <li>Reduce decision fatigue with clean filters and comparison-first discovery</li>
            <li>Find better-value jewellery without jumping between multiple websites</li>
          </ul>
        </section>

        <section className="articles-section" aria-labelledby="about-trust-title">
          <div className="articles-section-head">
            <h2 id="about-trust-title">Built for Modern Jewellery Shoppers</h2>
          </div>
          <p className="article-description">
            Whether you are shopping for an engagement ring, a gift, or an everyday style upgrade, Pick Your Piece is
            designed to support practical, informed buying decisions with less confusion and more clarity.
          </p>
          <p className="article-description">
            We continue improving our catalogue quality, filters, and buying guides so users can discover jewellery
            faster and compare confidently.
          </p>
        </section>

        <section className="articles-section" aria-labelledby="about-platform-title">
          <div className="articles-section-head">
            <h2 id="about-platform-title">What You Can Do on Pick Your Piece</h2>
          </div>
          <ul className="articles-hero-metrics" aria-label="Platform capabilities">
            <li>Compare jewellery listings across brands</li>
            <li>Filter by price, metal, purity, style, and occasion</li>
            <li>Explore buying guides and educational articles</li>
          </ul>
        </section>
      </div>
    </MainLayout>
  );
}
