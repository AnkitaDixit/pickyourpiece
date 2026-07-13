import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.pickyourpiece.com";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "PickYourPiece",
  manifest: "/manifest.webmanifest",
  category: "shopping",
  classification: "Jewellery comparison and discovery",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  title: {
    default: "PickYourPiece | Compare Rings Across Top Jewellery Brands",
    template: "%s | PickYourPiece",
  },
  description:
    "Browse and compare ring collections across top jewellery brands with smart filters, price range, and live catalog updates.",
  keywords: [
    "jewellery",
    "rings",
    "diamond rings",
    "gold rings",
    "jewellery comparison",
    "ring prices",
  ],
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [{ url: "/favicon.ico" }],
    shortcut: ["/favicon.ico"],
    apple: [{ url: "/favicon.ico" }],
  },
  openGraph: {
    type: "website",
    url: "/",
    title: "PickYourPiece | Compare Rings Across Top Jewellery Brands",
    description:
      "Find your perfect ring by comparing styles, metals, purity, and prices from multiple brands in one place.",
    siteName: "PickYourPiece",
    images: [
      {
        url: "/heroImage.png",
        width: 1200,
        height: 630,
        alt: "PickYourPiece ring comparison catalog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PickYourPiece | Compare Rings Across Top Jewellery Brands",
    description:
      "Compare ring collections across brands with filters for price, metal, style, and more.",
    images: ["/heroImage.png"],
    site: "@pickyourpiece",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "PickYourPiece",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "PickYourPiece",
    url: siteUrl,
    logo: `${siteUrl}/favicon.ico`,
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "abc@pickyourpiece.com",
      },
    ],
  };

  const schemaGraph = {
    "@context": "https://schema.org",
    "@graph": [websiteSchema, organizationSchema],
  };

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaGraph) }}
        />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
