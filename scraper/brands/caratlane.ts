import { chromium } from "playwright";
import { saveProducts } from "../saveProducts";
import type { Product } from "../types";

const BASE = "https://www.caratlane.com";
const LISTING = `${BASE}/jewellery/rings.html`;

export async function scrapeCaratLane(): Promise<Product[]> {
    const browser = await chromium.launch({
        headless: true
    });

    const page = await browser.newPage({
        viewport: {
            width: 1440,
            height: 900
        }
    });

    console.log("Opening listing...");

    await page.goto(LISTING, {
        waitUntil: "domcontentloaded",
        timeout: 60000
    });

    //
    // Infinite scroll
    //

    while (true) {

        const before = await page.locator("a[href*='/jewellery/']").count();

        await page.evaluate(() =>
            window.scrollBy(0, window.innerHeight * 3)
        );

        await page.waitForTimeout(1500);

        const after = await page.locator("a[href*='/jewellery/']").count();

        if (after === before)
            break;
    }

    //
    // Product URLs
    //

    const urls = await page.$$eval(
        "a[href*='/jewellery/']",
        els => {

            const links = els
                .map(e => (e as HTMLAnchorElement).href)
                .filter(x => /-(jr|sr)\w+/i.test(x));

            return [...new Set(links)];

        }
    );

    console.log(`Found ${urls.length} products`);

    const products: Product[] = [];

    for (const url of urls) {

        const p = await browser.newPage();

        try {

            await p.goto(url, {
                waitUntil: "domcontentloaded",
                timeout: 60000
            });

            //
            // JSON-LD
            //

            const json = await p.locator(
                "script[type='application/ld+json']"
            ).first().textContent();

            if (!json)
                continue;

            const data = JSON.parse(json);

            const offer = Array.isArray(data.offers)
                ? data.offers[0]
                : data.offers;

            const body = await p.textContent("body") ?? "";

            let metal = "";

            if (/rose gold/i.test(body))
                metal = "Rose Gold";
            else if (/yellow gold/i.test(body))
                metal = "Yellow Gold";
            else if (/white gold/i.test(body))
                metal = "White Gold";
            else if (/platinum/i.test(body))
                metal = "Platinum";

            const gemstones: string[] = [];

            [
                "Diamond",
                "Ruby",
                "Emerald",
                "Sapphire",
                "Pearl",
                "Solitaire"
            ].forEach(g => {
                if (body.toLowerCase().includes(g.toLowerCase()))
                    gemstones.push(g);
            });

            products.push({

                id:
                    data.sku ??
                    url.split("/").pop()!,

                brand: "CaratLane",

                name: data.name,

                price: Number(offer?.price),

                currency: offer?.priceCurrency ?? "INR",

                category: "Ring",

                metal,

                gemstone: gemstones,

                occasion: [],

                style: [],

                gender: /men/i.test(data.name)
                    ? "Men"
                    : "Women",

                image:
                    Array.isArray(data.image)
                        ? data.image[0]
                        : data.image,

                productUrl: url,

                availability:
                    offer?.availability?.includes("InStock") ?? true,

                updatedAt: new Date().toISOString()

            });

            console.log(
                products.length,
                data.name
            );

        }
        catch (e) {

            console.log("Failed:", url);

        }

        await p.close();
    }

    await browser.close();

    return products;
}

scrapeCaratLane()
    .then(products => saveProducts("caratlane", products));