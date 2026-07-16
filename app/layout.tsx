import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.pickyourpiece.com";
const GOOGLE_ANALYTICS_ID = "G-MLJZZSJ6WB";

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
    default: "PickYourPiece | Compare Jewellery Across Top Brands",
    template: "%s | PickYourPiece",
  },
  description:
    "PickYourPiece (PyP) helps you compare jewellery across brands in one place. Explore rings, earrings, pendants, and bracelets with smart filters, price range, and live catalog updates.",
  keywords: [
    "pyp",
    "pick your piece",
    "pickyourpiece",
    "pick your piece pyp",
    "pyp jewellery",
    "pyp rings",
    "jewellery",
    "compare jewellery across brands",
    "jewellery comparison site",
    "compare jewellery prices",
    "compare jewellery brands India",
    "online jewellery comparison",
    "jewellery designs",
    "latest jewellery designs",
    "jewellery design comparison",
    "jewellery price",
    "jewellery prices",
    "latest jewellery price",
    "jewellery gifts",
    "gift jewellery for her",
    "gift jewellery for him",
    "his and her jewellery",
    "couple jewellery gifts",
    "valentine jewellery gifts",
    "birthday jewellery gifts",
    "anniversary jewellery gifts",
    "anniversery jewellery gifts",
    "rings designs",
    "earrings designs",
    "pendants designs",
    "bracelets designs",
    "diamond rings designs",
    "gold rings designs",
    "modern rings",
    "sleek rings",
    "traditional rings",
    "modern ring designs",
    "sleek ring designs",
    "traditional ring designs",
    "jewellery comparison",
    "ring prices",
  ],
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [{ url: "/favicon-96.png" }],
  },
  openGraph: {
    type: "website",
    url: "/",
    title: "PickYourPiece (PYP) | Compare Jewellery Across Top Brands",
    description:
      "Compare jewellery across brands with filters for price, metal, style, purity, and category in one place.",
    siteName: "PickYourPiece (PYP)",
    images: [
      {
        url: "/heroImage.png",
        width: 1200,
        height: 630,
        alt: "PickYourPiece jewellery comparison catalog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PickYourPiece (PYP) | Compare Jewellery Across Top Brands",
    description:
      "Compare jewellery across brands with filters for price, metal, style, purity, and category.",
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
    alternateName: ["PYP", "Pick Your Piece"],
    url: siteUrl,
    description: "Compare jewellery across brands in one place with smart filtering and price discovery.",
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
    alternateName: ["PYP", "Pick Your Piece"],
    url: siteUrl,
    logo: `${siteUrl}/favicon.ico`,
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "founder@pickyourpiece.com",
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
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GOOGLE_ANALYTICS_ID}');
          `}
        </Script>
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
