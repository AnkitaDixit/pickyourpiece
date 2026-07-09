import type { MetadataRoute } from "next";
import products from "@/data/products.json";
import type { Product } from "@/types/product";
import { buildProductDetailPath, getBrandSegment } from "@/lib/product-seo";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.pickyourpiece.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const productRoutes = Array.from(
    new Set(
      (products as Product[])
        .map((product) => buildProductDetailPath(product))
        .filter((url): url is string => Boolean(url))
    )
  ).map((url) => ({
    url: `${siteUrl}${url}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  const brandRoutes = Array.from(
    new Set(
      (products as Product[])
        .map((product) => getBrandSegment(product.brand))
        .filter((segment): segment is string => Boolean(segment))
    )
  ).map((segment) => ({
    url: `${siteUrl}/brands/${segment}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  return [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    ...brandRoutes,
    ...productRoutes,
  ];
}