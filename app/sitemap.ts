import type { MetadataRoute } from "next";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import products from "@/data/products.json";
import type { Product } from "@/types/product";
import { buildProductDetailPath, getBrandSegment, getPrimaryProductId, toNameSlug } from "@/lib/product-seo";
import { getAllArticles } from "@/lib/articles";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.pickyourpiece.com";

type SourceProduct = Record<string, unknown>;

type ResolvableLookup = {
  idsByBrand: Map<string, Set<string>>;
  namesByBrand: Map<string, Set<string>>;
};

async function buildResolvableLookup(): Promise<ResolvableLookup> {
  const dataDir = path.join(process.cwd(), "scraper", "data");
  let files: string[] = [];
  try {
    files = await readdir(dataDir);
  } catch {
    return {
      idsByBrand: new Map<string, Set<string>>(),
      namesByBrand: new Map<string, Set<string>>(),
    };
  }
  const jsonFiles = files.filter((fileName) => fileName.toLowerCase().endsWith(".json"));

  const idsByBrand = new Map<string, Set<string>>();
  const namesByBrand = new Map<string, Set<string>>();

  await Promise.all(
    jsonFiles.map(async (fileName) => {
      const brandSegment = path.basename(fileName, ".json").toLowerCase();
      let parsed: unknown = [];
      try {
        const raw = await readFile(path.join(dataDir, fileName), "utf8");
        parsed = JSON.parse(raw) as unknown;
      } catch {
        return;
      }

      if (!Array.isArray(parsed)) return;

      const ids = new Set<string>();
      const names = new Set<string>();

      for (const entry of parsed) {
        if (!entry || typeof entry !== "object") continue;
        const sourceProduct = entry as SourceProduct;

        const primaryId = getPrimaryProductId(sourceProduct);
        if (primaryId) {
          ids.add(primaryId.toLowerCase());
        }

        const sourceName = typeof sourceProduct.name === "string" ? sourceProduct.name.trim() : "";
        if (sourceName) {
          names.add(toNameSlug(sourceName));
        }
      }

      idsByBrand.set(brandSegment, ids);
      namesByBrand.set(brandSegment, names);
    })
  );

  return { idsByBrand, namesByBrand };
}

function isResolvableProductRoute(product: Product, lookup: ResolvableLookup): boolean {
  const brandSegment = getBrandSegment(product.brand);
  if (!brandSegment) return false;

  const ids = lookup.idsByBrand.get(brandSegment);
  const names = lookup.namesByBrand.get(brandSegment);
  if (!ids || !names) return false;

  const productId = String(product.id).trim().toLowerCase();
  const nameSlug = toNameSlug(product.name);

  return ids.has(productId) || names.has(nameSlug);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const articles = await getAllArticles();
  const resolvableLookup = await buildResolvableLookup();
  const staticCategoryRoutes = ["/ring", "/earrings", "/pendant", "/bracelet"] as const;

  const routeLastModified = new Map<string, Date>();
  for (const product of products as Product[]) {
    if (!isResolvableProductRoute(product, resolvableLookup)) continue;

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
    lastModified: new Date(article.lastModified),
    changeFrequency: "weekly" as const,
    priority: 0.72,
  }));

  const categoryRoutes = staticCategoryRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.88,
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
    ...categoryRoutes,
    ...articleRoutes,
    ...brandRoutes,
    ...productRoutes,
  ];
}