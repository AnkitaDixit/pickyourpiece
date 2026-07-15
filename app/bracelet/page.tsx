import type { Metadata } from "next";
import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.pickyourpiece.com";

export const metadata: Metadata = {
  title: "Bracelet Comparison | PickYourPiece",
  description:
    "Compare bracelet designs and prices across jewellery brands. Explore curated picks and stay updated as new collections are added.",
  alternates: {
    canonical: "/bracelet",
  },
  openGraph: {
    type: "website",
    url: `${siteUrl}/bracelet`,
    title: "Bracelet Comparison | PickYourPiece",
    description:
      "Compare bracelet designs and prices across jewellery brands with curated updates from multiple brands.",
    images: [
      {
        url: "/heroImage.png",
        width: 1200,
        height: 630,
        alt: "PickYourPiece bracelet comparison",
      },
    ],
  },
};

export default function BraceletPage() {
  return (
    <MainLayout showNavbarBrand>
      <section className="coming-soon-page">
        <p className="coming-soon-kicker">Category</p>
        <h1>Bracelet</h1>
        <p>Coming soon. We are curating bracelet collections from major brands.</p>
        <p>
          Start comparing live products in our <Link href="/ring">Ring Catalog</Link> or read buying guides in
          <Link href="/articles"> Articles</Link>.
        </p>

        <h2>Planned Bracelet Comparison Features</h2>
        <ul>
          <li>Chain, tennis, charm, and kada-inspired bracelet styles</li>
          <li>Men, women, and unisex bracelet options with clear filters</li>
          <li>Brand-wise pricing and design comparison on one screen</li>
          <li>Occasion-focused recommendations for birthdays and anniversaries</li>
        </ul>

        <h2>Recommended Starting Points</h2>
        <p>
          Start with <Link href="/ring">Ring Catalog</Link>, explore
          <Link href="/brands/candere"> Candere</Link> and <Link href="/brands/orra">ORRA</Link>, then check
          <Link href="/articles/engagement-ring-budget"> engagement ring budget insights</Link> for price planning.
        </p>
      </section>
    </MainLayout>
  );
}
