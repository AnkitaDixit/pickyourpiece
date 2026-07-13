import type { MetadataRoute } from "next";
import products from "@/data/products.json";
import type { Product } from "@/types/product";
import { buildProductDetailPath, getBrandSegment } from "@/lib/product-seo";
import { getAllArticles } from "@/lib/articles";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.pickyourpiece.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const articles = await getAllArticles();

  const routeLastModified = new Map<string, Date>();
  for (const product of products as Product[]) {
    const route = buildProductDetailPath(product);
    if (!route) continue;

    const candidateDate = product.updatedAt ? new Date(product.updatedAt) : now;
    const nextDate = Number.isNaN(candidateDate.getTime()) ? now : candidateDate;
    const previousDate = routeLastModified.get(route);

    if (!previousDate || previousDate < nextDate) {
      routeLastModified.set(route, nextDate);
    }
  }

  const productRoutes = Array.from(routeLastModified.entries()).map(([url, lastModified]) => ({
    url: `${siteUrl}${url}`,
    lastModified,
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

  const articleRoutes = articles.map((article) => ({
    url: `${siteUrl}/articles/${article.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.72,
  }));

  return [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/articles`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    ...articleRoutes,
    ...brandRoutes,
    ...productRoutes,
  ];
}