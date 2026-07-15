import type { Metadata } from "next";
import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.pickyourpiece.com";

export const metadata: Metadata = {
  title: "Pendant Comparison | PickYourPiece",
  description:
    "Compare pendant designs and prices across jewellery brands. Discover curated styles and check live comparison updates.",
  alternates: {
    canonical: "/pendant",
  },
  openGraph: {
    type: "website",
    url: `${siteUrl}/pendant`,
    title: "Pendant Comparison | PickYourPiece",
    description:
      "Compare pendant designs and prices across jewellery brands with curated updates from multiple brands.",
    images: [
      {
        url: "/heroImage.png",
        width: 1200,
        height: 630,
        alt: "PickYourPiece pendant comparison",
      },
    ],
  },
};

export default function PendantPage() {
  return (
    <MainLayout showNavbarBrand>
      <section className="coming-soon-page">
        <p className="coming-soon-kicker">Category</p>
        <h1>Pendant</h1>
        <p>Coming soon. We are curating pendant styles and prices across brands.</p>
        <p>
          Start comparing live products in our <Link href="/ring">Ring Catalog</Link> or read buying guides in
          <Link href="/articles"> Articles</Link>.
        </p>

        <h2>What This Pendant Comparison Page Will Cover</h2>
        <ul>
          <li>Solitaire, heart, floral, and minimal pendant design collections</li>
          <li>Gold vs diamond pendant pricing across major jewellery brands</li>
          <li>Festival, birthday, and anniversary gifting options by budget</li>
          <li>Easy filters for style, metal, and occasion intent</li>
        </ul>

        <h2>Explore Related Pages Right Now</h2>
        <p>
          Compare currently live products under <Link href="/ring">Rings</Link>, browse
          <Link href="/brands/giva"> GIVA</Link> and <Link href="/brands/tanishq">Tanishq</Link>, and read
          <Link href="/articles/gold-vs-platinum"> Gold vs Platinum</Link> before buying.
        </p>
      </section>
    </MainLayout>
  );
}
