import fs from "fs";
import path from "path";
import type { Product } from "./types";

const DATA_DIR = path.join(process.cwd(), "scraper", "data");

/** Fields updated on every run. Everything else is preserved from the previous scrape. */
const MUTABLE_FIELDS: (keyof Product)[] = ["price", "availability", "image", "updatedAt"];

export function saveProducts(brand: string, fresh: Product[]): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  const file = path.join(DATA_DIR, `${brand}.json`);

  // Load existing products (if any)
  let existing: Product[] = [];
  if (fs.existsSync(file)) {
    try {
      existing = JSON.parse(fs.readFileSync(file, "utf-8"));
    } catch {
      existing = [];
    }
  }

  const existingMap = new Map<string, Product>(existing.map((p) => [p.id, p]));

  let added = 0;
  let updated = 0;

  for (const product of fresh) {
    const prev = existingMap.get(product.id);

    if (!prev) {
      // New product — store everything (image is just a URL, no download)
      existingMap.set(product.id, product);
      added++;
    } else {
      // Existing product — only update mutable fields
      for (const field of MUTABLE_FIELDS) {
        (prev as unknown as Record<string, unknown>)[field] = product[field];
      }
      updated++;
    }
  }

  const result = Array.from(existingMap.values());
  fs.writeFileSync(file, JSON.stringify(result, null, 2), "utf-8");

  console.log(`[${brand}] +${added} new, ~${updated} updated → ${result.length} total`);
}
