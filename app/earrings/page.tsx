import type { Metadata } from "next";
import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.pickyourpiece.com";

export const metadata: Metadata = {
  title: "Earrings Comparison | PickYourPiece",
  description:
    "Compare earrings designs and prices across jewellery brands. Explore curated picks and track updates as new collections go live.",
  alternates: {
    canonical: "/earrings",
  },
  openGraph: {
    type: "website",
    url: `${siteUrl}/earrings`,
    title: "Earrings Comparison | PickYourPiece",
    description:
      "Compare earrings designs and prices across jewellery brands with curated updates from multiple brands.",
    images: [
      {
        url: "/heroImage.png",
        width: 1200,
        height: 630,
        alt: "PickYourPiece earrings comparison",
      },
    ],
  },
};

export default function EarringsPage() {
  return (
    <MainLayout showNavbarBrand>
      <section className="coming-soon-page">
        <p className="coming-soon-kicker">Category</p>
        <h1>Earrings</h1>
        <p>Coming soon. We are curating earrings from multiple brands for side-by-side comparison.</p>
        <p>
          Start comparing live products in our <Link href="/ring">Ring Catalog</Link> or read buying guides in
          <Link href="/articles"> Articles</Link>.
        </p>

        <h2>What You Will Be Able to Compare</h2>
        <ul>
          <li>Stud, hoop, drop, and daily-wear earring designs</li>
          <li>Gold, silver, and diamond earring price differences by brand</li>
          <li>Metal purity, gemstone details, and style tags in one view</li>
          <li>Budget filters for gift-ready and premium collections</li>
        </ul>

        <h2>While We Build This Category</h2>
        <p>
          Browse brand catalogs like <Link href="/brands/bluestone">BlueStone</Link> and
          <Link href="/brands/caratlane"> Caratlane</Link>, and use our guides such as
          <Link href="/articles/diamond-shapes-guide"> Diamond Shapes Guide</Link> to shortlist styles faster.
        </p>
      </section>
    </MainLayout>
  );
}
