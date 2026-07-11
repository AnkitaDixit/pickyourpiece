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
  openGraph: {
    type: "website",
    url: "/",
    title: "PickYourPiece | Compare Rings Across Top Jewellery Brands",
    description:
      "Find your perfect ring by comparing styles, metals, purity, and prices from multiple brands in one place.",
    siteName: "PickYourPiece",
  },
  twitter: {
    card: "summary_large_image",
    title: "PickYourPiece | Compare Rings Across Top Jewellery Brands",
    description:
      "Compare ring collections across brands with filters for price, metal, style, and more.",
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
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
