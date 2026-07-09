import { scrapeCaratLane } from "./brands/caratlane";
import { scrapebluestone } from "./brands/bluestone";
import { scrapeGiva } from "./brands/giva";
import { scrapePalmonas } from "./brands/palmonas";
import { scrapeMia } from "./brands/mia";
import { saveProducts } from "./saveProducts";
import { mergeProducts } from "./mergeProducts";

async function run() {
  const scrapers: [string, () => Promise<unknown[]>][] = [
    ["caratlane", scrapeCaratLane],
    ["bluestone", scrapebluestone],
    ["giva", scrapeGiva],
    ["palmonas", scrapePalmonas],
    ["mia", scrapeMia],
  ];

  for (const [brand, scrape] of scrapers) {
    console.log(`Scraping ${brand}...`);
    try {
      const products = await scrape();
      saveProducts(brand, products as never);
    } catch (err) {
      console.error(`Failed: ${brand}`, err);
    }
  }

  mergeProducts();
}

run();
