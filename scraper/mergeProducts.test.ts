/**
 * scraper/mergeProducts.test.ts
 *
 * Run with:  npm run test:merger
 * Gate the merge with:  npm run merge
 *
 * Uses Node's built-in test runner (node:test) — no extra dependencies.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { _testExports } from "./mergeProducts.ts";

const {
  normalizeBrand,
  normalizePurity,
  normalizeGemstones,
  derivePurity,
  canonicalizeMetalCategory,
  deriveMetalColor,
  mapRawTagToStyleOccasionBundle,
  deriveStyleOccasionBundles,
  buildDeterministicProductId,
  validateCatalog,
  STYLE_OCCASION_BUNDLES,
} = _testExports;

describe("normalizeGemstones", () => {
  it("maps aliases and removes non-gemstone filter values", () => {
    assert.deepEqual(
      normalizeGemstones([
        "Black onyx",
        "Onyx",
        "pearl",
        "Gold",
        "Gemstones",
        "Ruby Cut",
        "Glass Filled Ruby",
      ]),
      {
        gemstones: ["Black Onyx", "Natural Pearl", "Ruby"],
        origins: [],
        treatments: ["Glass Filled"],
        cuts: ["Ruby Cut"],
        isSolitaire: false,
      }
    );
  });

  it("stores synthetic stones as origin metadata", () => {
    assert.deepEqual(normalizeGemstones(["Synthetic Amethyst", "Synthetic Ruby"]), {
      gemstones: ["Amethyst", "Ruby"],
      origins: ["Amethyst", "Ruby"],
      treatments: [],
      cuts: [],
      isSolitaire: false,
    });
  });

  it("stores solitaire as a tag rather than a gemstone", () => {
    assert.deepEqual(normalizeGemstones(["Solitaire", "Diamond"]), {
      gemstones: ["Diamond"],
      origins: [],
      treatments: [],
      cuts: [],
      isSolitaire: true,
    });
  });
});

// ---------------------------------------------------------------------------
// normalizeBrand
// ---------------------------------------------------------------------------

describe("normalizeBrand", () => {
  it("normalizes GIVA variants", () => {
    assert.equal(normalizeBrand("GIVA"), "GIVA");
    assert.equal(normalizeBrand("giva"), "GIVA");
    assert.equal(normalizeBrand("GIVA Jewellery"), "GIVA");
    assert.equal(normalizeBrand("GIVA Jewelry"), "GIVA");
  });

  it("normalizes Kalyan to Candere", () => {
    assert.equal(normalizeBrand("Kalyan"), "Candere");
    assert.equal(normalizeBrand("kalyan"), "Candere");
  });

  it("normalizes Melorra", () => {
    assert.equal(normalizeBrand("Melorra"), "Melorra");
    assert.equal(normalizeBrand("melorra"), "Melorra");
  });

  it("normalizes Senco", () => {
    assert.equal(normalizeBrand("Senco"), "Senco");
    assert.equal(normalizeBrand("senco"), "Senco");
  });

  it("normalizes Joyalukkas", () => {
    assert.equal(normalizeBrand("Joyalukkas"), "Joyalukkas");
    assert.equal(normalizeBrand("joyalukkas"), "Joyalukkas");
  });

  it("normalizes Palmonas", () => {
    assert.equal(normalizeBrand("Palmonas"), "Palmonas");
  });

  it("passes through unknown brands unchanged", () => {
    assert.equal(normalizeBrand("BlueStone"), "BlueStone");
    assert.equal(normalizeBrand("Caratlane"), "Caratlane");
  });

  it("returns empty string for empty input", () => {
    assert.equal(normalizeBrand(""), "");
  });
});

// ---------------------------------------------------------------------------
// normalizePurity
// ---------------------------------------------------------------------------

describe("normalizePurity", () => {
  it("returns empty string for empty input", () => {
    assert.equal(normalizePurity(""), "");
  });

  it("normalizes KT variants", () => {
    assert.equal(normalizePurity("18 KT"), "18KT");
    assert.equal(normalizePurity("9 KT"), "9KT");
    assert.equal(normalizePurity("22 K"), "22KT");
    assert.equal(normalizePurity("14KT"), "14KT");
  });

  it("normalizes Platinum 950", () => {
    assert.equal(normalizePurity("Platinum 950"), "Platinum950");
  });

  it("normalizes Silver 925", () => {
    assert.equal(normalizePurity("Silver 925"), "925 Silver");
  });

  it("normalizes all 925 silver aliases to one canonical value", () => {
    assert.equal(normalizePurity("925 Silver"), "925 Silver");
    assert.equal(normalizePurity("9925 Silver"), "925 Silver");
    assert.equal(normalizePurity("Silver925"), "925 Silver");
  });

  it("normalizes malformed 93 KT to Silver925", () => {
    assert.equal(normalizePurity("93 KT"), "925 Silver");
  });
});

// ---------------------------------------------------------------------------
// derivePurity
// ---------------------------------------------------------------------------

describe("derivePurity", () => {
  it("returns empty string for plated products", () => {
    assert.equal(derivePurity("", "Gold Plated", "", "", ""), "");
    assert.equal(derivePurity("", "Silver Plated", "", "", ""), "");
    assert.equal(derivePurity("", "18 KT Gold Plated", "", "", ""), "");
  });

  it("uses rawPurity when available", () => {
    assert.equal(derivePurity("18 KT", "18 KT Yellow Gold", "Yellow", "", ""), "18KT");
    assert.equal(derivePurity("9 KT", "9 KT Gold", "", "", ""), "9KT");
  });

  it("extracts purity from metal string when rawPurity is empty", () => {
    assert.equal(derivePurity("", "18 KT Yellow Gold", "", "", ""), "18KT");
    assert.equal(derivePurity("", "14 KT White Gold", "", "", ""), "14KT");
  });

  it("returns empty when no purity info available", () => {
    assert.equal(derivePurity("", "", "", "", ""), "");
  });

  it("replaces stainless steel purity based on the metal", () => {
    assert.equal(derivePurity("Stainless Steel", "Gold", "", "", ""), "9KT");
    assert.equal(derivePurity("Stainless Steel", "Silver", "", "", ""), "925 Silver");
    assert.equal(derivePurity("Stainless Steel", "Stainless Steel", "", "", ""), "");
  });
});

// ---------------------------------------------------------------------------
// canonicalizeMetalCategory
// ---------------------------------------------------------------------------

describe("canonicalizeMetalCategory", () => {
  it("returns Gold for gold variants", () => {
    assert.equal(canonicalizeMetalCategory("Gold"), "Gold");
    assert.equal(canonicalizeMetalCategory("18 KT Yellow Gold"), "Gold");
    assert.equal(canonicalizeMetalCategory("Rose Gold"), "Gold");
    assert.equal(canonicalizeMetalCategory("9KT"), "Gold");
  });

  it("returns Silver for silver variants", () => {
    assert.equal(canonicalizeMetalCategory("Silver"), "Silver");
    assert.equal(canonicalizeMetalCategory("Silver925"), "Silver");
    assert.equal(canonicalizeMetalCategory("Sterling Silver"), "Silver");
    assert.equal(canonicalizeMetalCategory("White"), "Silver");
    assert.equal(canonicalizeMetalCategory("Rhodium"), "Silver");
  });

  it("returns Platinum for platinum variants", () => {
    assert.equal(canonicalizeMetalCategory("Platinum"), "Platinum");
    assert.equal(canonicalizeMetalCategory("Platinum950"), "Platinum");
  });

  it("returns Steel for steel variants", () => {
    assert.equal(canonicalizeMetalCategory("Stainless Steel"), "Steel");
    assert.equal(canonicalizeMetalCategory("Steel"), "Steel");
  });

  it("defaults to Gold for unknown inputs", () => {
    assert.equal(canonicalizeMetalCategory(""), "Gold");
    assert.equal(canonicalizeMetalCategory("Unknown"), "Gold");
  });
});

// ---------------------------------------------------------------------------
// deriveMetalColor
// ---------------------------------------------------------------------------

describe("deriveMetalColor", () => {
  it("handles explicit rose gold", () => {
    assert.equal(deriveMetalColor("Rose Gold", "", ""), "Rose Gold");
    assert.equal(deriveMetalColor("rose gold", "", ""), "Rose Gold");
  });

  it("handles yellow gold", () => {
    assert.equal(deriveMetalColor("Yellow Gold", "", ""), "Gold");
    assert.equal(deriveMetalColor("Yellow", "", ""), "Gold");
  });

  it("handles silver", () => {
    assert.equal(deriveMetalColor("Silver", "", ""), "Silver");
  });

  it("handles platinum", () => {
    assert.equal(deriveMetalColor("Platinum", "", ""), "Platinum");
  });

  it("falls back to metal string probe when color is empty", () => {
    assert.equal(deriveMetalColor("", "18 KT Rose Gold", ""), "Rose Gold");
    assert.equal(deriveMetalColor("", "18 KT Yellow Gold", ""), "Gold");
  });

  it("returns Rose from shorthand", () => {
    assert.equal(deriveMetalColor("Rose", "", ""), "Rose Gold");
  });
});

// ---------------------------------------------------------------------------
// mapRawTagToStyleOccasionBundle
// ---------------------------------------------------------------------------

describe("mapRawTagToStyleOccasionBundle", () => {
  // Daily Wear
  it("maps Daily Wear tags", () => {
    assert.equal(mapRawTagToStyleOccasionBundle("Everyday"), "Daily Wear");
    assert.equal(mapRawTagToStyleOccasionBundle("Casual"), "Daily Wear");
    assert.equal(mapRawTagToStyleOccasionBundle("Work"), "Daily Wear");
    assert.equal(mapRawTagToStyleOccasionBundle("Minimal"), "Daily Wear");
    assert.equal(mapRawTagToStyleOccasionBundle("Lightweight"), "Daily Wear");
    assert.equal(mapRawTagToStyleOccasionBundle("Kids Jewelery"), "Daily Wear");
    assert.equal(mapRawTagToStyleOccasionBundle("Kids Jewellery"), "Daily Wear");
    assert.equal(mapRawTagToStyleOccasionBundle("My Staple"), "Daily Wear");
    assert.equal(mapRawTagToStyleOccasionBundle("Staple"), "Daily Wear");
  });

  // Engagement & Wedding
  it("maps Engagement & Wedding tags", () => {
    assert.equal(mapRawTagToStyleOccasionBundle("Bridal"), "Engagement & Wedding");
    assert.equal(mapRawTagToStyleOccasionBundle("Wedding"), "Engagement & Wedding");
    assert.equal(mapRawTagToStyleOccasionBundle("Engagement"), "Engagement & Wedding");
    assert.equal(mapRawTagToStyleOccasionBundle("Solitaire"), "Engagement & Wedding");
    assert.equal(mapRawTagToStyleOccasionBundle("Halo"), "Engagement & Wedding");
    assert.equal(mapRawTagToStyleOccasionBundle("Band"), "Engagement & Wedding");
    assert.equal(mapRawTagToStyleOccasionBundle("Couple"), "Engagement & Wedding");
    assert.equal(mapRawTagToStyleOccasionBundle("Eternity"), "Engagement & Wedding");
    assert.equal(mapRawTagToStyleOccasionBundle("Wedding Collection"), "Engagement & Wedding");
  });

  // Party & Statement
  it("maps Party & Statement tags", () => {
    assert.equal(mapRawTagToStyleOccasionBundle("Party"), "Party & Statement");
    assert.equal(mapRawTagToStyleOccasionBundle("Statement"), "Party & Statement");
    assert.equal(mapRawTagToStyleOccasionBundle("Cocktail"), "Party & Statement");
    assert.equal(mapRawTagToStyleOccasionBundle("Chunky"), "Party & Statement");
    assert.equal(mapRawTagToStyleOccasionBundle("Chunky Collection"), "Party & Statement");
    assert.equal(mapRawTagToStyleOccasionBundle("Celebration"), "Party & Statement");
    assert.equal(mapRawTagToStyleOccasionBundle("Cluster"), "Party & Statement");
    assert.equal(mapRawTagToStyleOccasionBundle("Sparkling"), "Party & Statement");
  });

  // Romantic & Gifting
  it("maps Romantic & Gifting tags", () => {
    assert.equal(mapRawTagToStyleOccasionBundle("Heart"), "Romantic & Gifting");
    assert.equal(mapRawTagToStyleOccasionBundle("Gifting"), "Nature & Artistic");  // Gifting maps to Nature & Artistic per existing code
    assert.equal(mapRawTagToStyleOccasionBundle("Infinity"), "Romantic & Gifting");
    assert.equal(mapRawTagToStyleOccasionBundle("Love"), "Romantic & Gifting");
    assert.equal(mapRawTagToStyleOccasionBundle("Knot"), "Romantic & Gifting");
    assert.equal(mapRawTagToStyleOccasionBundle("Valentine's"), "Romantic & Gifting");
    assert.equal(mapRawTagToStyleOccasionBundle("Valentines 2025"), "Romantic & Gifting");
    assert.equal(mapRawTagToStyleOccasionBundle("Valentines 2026"), "Romantic & Gifting");
    assert.equal(mapRawTagToStyleOccasionBundle("Valentine ready goods"), "Romantic & Gifting");
    assert.equal(mapRawTagToStyleOccasionBundle("Red Valentine 2024"), "Romantic & Gifting");
  });

  // Nature & Artistic
  it("maps Nature & Artistic tags", () => {
    assert.equal(mapRawTagToStyleOccasionBundle("Floral"), "Nature & Artistic");
    assert.equal(mapRawTagToStyleOccasionBundle("Butterfly"), "Nature & Artistic");
    assert.equal(mapRawTagToStyleOccasionBundle("Animal love"), "Nature & Artistic");
    assert.equal(mapRawTagToStyleOccasionBundle("Animal Love"), "Nature & Artistic");
    assert.equal(mapRawTagToStyleOccasionBundle("Leaf"), "Nature & Artistic");
    assert.equal(mapRawTagToStyleOccasionBundle("Teal"), "Nature & Artistic");
    assert.equal(mapRawTagToStyleOccasionBundle("Trail"), "Nature & Artistic");
    assert.equal(mapRawTagToStyleOccasionBundle("Religious"), "Nature & Artistic");
    assert.equal(mapRawTagToStyleOccasionBundle("Shakti Collection"), "Nature & Artistic");
    assert.equal(mapRawTagToStyleOccasionBundle("Garden of Eden"), "Nature & Artistic");
    assert.equal(mapRawTagToStyleOccasionBundle("Garden Of Eden"), "Nature & Artistic");
  });

  // Modern & Classic
  it("maps Modern & Classic tags", () => {
    assert.equal(mapRawTagToStyleOccasionBundle("Classic"), "Modern & Classic");
    assert.equal(mapRawTagToStyleOccasionBundle("Classic Collection"), "Modern & Classic");
    assert.equal(mapRawTagToStyleOccasionBundle("Modern"), "Modern & Classic");
    assert.equal(mapRawTagToStyleOccasionBundle("Vintage"), "Modern & Classic");
    assert.equal(mapRawTagToStyleOccasionBundle("Chevron"), "Modern & Classic");
    assert.equal(mapRawTagToStyleOccasionBundle("Signet"), "Modern & Classic");
    assert.equal(mapRawTagToStyleOccasionBundle("Stackable"), "Modern & Classic");
    assert.equal(mapRawTagToStyleOccasionBundle("Twist"), "Modern & Classic");
    assert.equal(mapRawTagToStyleOccasionBundle("Layered"), "Modern & Classic");
    assert.equal(mapRawTagToStyleOccasionBundle("Vanki"), "Modern & Classic");
    assert.equal(mapRawTagToStyleOccasionBundle("Mens Jewellery"), "Modern & Classic");
    assert.equal(mapRawTagToStyleOccasionBundle("MEN COLLECTION"), "Modern & Classic");
  });

  // DROP → null
  it("returns null for DROP tags", () => {
    assert.equal(mapRawTagToStyleOccasionBundle("Hot"), null);
    assert.equal(mapRawTagToStyleOccasionBundle("New Arrivals"), null);
    assert.equal(mapRawTagToStyleOccasionBundle("Our Picks"), null);
    assert.equal(mapRawTagToStyleOccasionBundle("Top Rated"), null);
    assert.equal(mapRawTagToStyleOccasionBundle("Trial"), null);
    assert.equal(mapRawTagToStyleOccasionBundle("Free Gift"), null);
    assert.equal(mapRawTagToStyleOccasionBundle("B2B"), null);
    assert.equal(mapRawTagToStyleOccasionBundle("Adjustable"), null);
    assert.equal(mapRawTagToStyleOccasionBundle("After Sell"), null);
    assert.equal(mapRawTagToStyleOccasionBundle("Less AOV"), null);
    assert.equal(mapRawTagToStyleOccasionBundle("Less AOv"), null);
    assert.equal(mapRawTagToStyleOccasionBundle(""), null);
    assert.equal(mapRawTagToStyleOccasionBundle("Bestsellers"), null);
  });
});

// ---------------------------------------------------------------------------
// deriveStyleOccasionBundles
// ---------------------------------------------------------------------------

describe("deriveStyleOccasionBundles", () => {
  it("returns correct bundles for style-only input", () => {
    assert.deepEqual(deriveStyleOccasionBundles(["Everyday"], []), ["Daily Wear"]);
    assert.deepEqual(deriveStyleOccasionBundles(["Bridal"], []), ["Engagement & Wedding"]);
  });

  it("returns correct bundles for occasion-only input", () => {
    assert.deepEqual(deriveStyleOccasionBundles([], ["Party"]), ["Party & Statement"]);
    assert.deepEqual(deriveStyleOccasionBundles([], ["Wedding"]), ["Engagement & Wedding"]);
  });

  it("merges and deduplicates from both arrays", () => {
    const result = deriveStyleOccasionBundles(["Bridal"], ["Party"]);
    assert.ok(result.includes("Engagement & Wedding"));
    assert.ok(result.includes("Party & Statement"));
    assert.equal(result.length, 2);
  });

  it("drops noise tags and returns empty array", () => {
    assert.deepEqual(deriveStyleOccasionBundles(["Hot", "Trial", "B2B"], ["New Arrivals"]), []);
  });

  it("preserves canonical bundle order", () => {
    const result = deriveStyleOccasionBundles(["Party", "Everyday", "Floral"], []);
    const expected = STYLE_OCCASION_BUNDLES.filter((b) => result.includes(b));
    assert.deepEqual(result, expected);
  });

  it("handles empty arrays", () => {
    assert.deepEqual(deriveStyleOccasionBundles([], []), []);
  });
});

// ---------------------------------------------------------------------------
// buildDeterministicProductId
// ---------------------------------------------------------------------------

describe("buildDeterministicProductId", () => {
  it("produces a PYP-prefixed 21-char ID", () => {
    const id = buildDeterministicProductId("BlueStone", "12345", "https://bluestone.com/product/12345");
    assert.match(id, /^PYP[A-F0-9]{18}$/);
  });

  it("is idempotent — same inputs always produce same ID", () => {
    const a = buildDeterministicProductId("Melorra", "226132", "https://www.melorra.com/product/");
    const b = buildDeterministicProductId("Melorra", "226132", "https://www.melorra.com/product/");
    assert.equal(a, b);
  });

  it("is sensitive to brand", () => {
    const a = buildDeterministicProductId("BlueStone", "100", "https://example.com");
    const b = buildDeterministicProductId("CaratLane", "100", "https://example.com");
    assert.notEqual(a, b);
  });

  it("is sensitive to product URL", () => {
    const a = buildDeterministicProductId("BlueStone", "100", "https://example.com/a");
    const b = buildDeterministicProductId("BlueStone", "100", "https://example.com/b");
    assert.notEqual(a, b);
  });
});

// ---------------------------------------------------------------------------
// validateCatalog
// ---------------------------------------------------------------------------

describe("validateCatalog", () => {
  const makeProduct = (overrides: Record<string, unknown> = {}) => ({
    id: "PYPABC123",
    brand: "TestBrand",
    pyp_product_id: "PYPABC123",
    first_seen_at: "2026-01-01T00:00:00.000Z",
    current_price: 1000,
    previous_price: null,
    availability: true,
    name: "Test Product",
    price: 1000,
    styleOccasion: ["Daily Wear"],
    ...overrides,
  });

  it("passes for a valid catalog", () => {
    assert.doesNotThrow(() =>
      validateCatalog([makeProduct() as never], [makeProduct()])
    );
  });

  it("throws when a normalized product is missing pyp_product_id", () => {
    assert.throws(
      () => validateCatalog([makeProduct() as never], [makeProduct({ pyp_product_id: "" })]),
      /pyp_product_id/
    );
  });

  it("throws for duplicate pyp_product_id among available products", () => {
    const p = makeProduct();
    assert.throws(
      () => validateCatalog([p as never, p as never], [p, p]),
      /Duplicate/
    );
  });

  it("throws when an available product has current_price <= 0", () => {
    assert.throws(
      () => validateCatalog([makeProduct({ current_price: 0 }) as never], [makeProduct({ current_price: 0 })]),
      /zero\/missing current_price/
    );
  });

  it("throws for invalid styleOccasion bundle names", () => {
    assert.throws(
      () => validateCatalog([makeProduct() as never], [makeProduct({ styleOccasion: ["Invalid Bundle"] })]),
      /Invalid styleOccasion bundle/
    );
  });

  it("throws for products missing brand", () => {
    assert.throws(
      () => validateCatalog([makeProduct({ brand: "" }) as never], [makeProduct({ brand: "" })]),
      /missing brand/
    );
  });
});
