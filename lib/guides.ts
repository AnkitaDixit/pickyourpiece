import type { ArticleEntry, ArticleTopic } from "@/lib/articles";

export type GuideHubSlug =
  | "engagement-rings"
  | "diamonds"
  | "gold"
  | "silver"
  | "gemstones"
  | "ring-size"
  | "jewellery-care"
  | "gift-guides"
  | "brand-comparison";

export type GuideHub = {
  slug: GuideHubSlug;
  title: string;
  kicker: string;
  description: string;
  intro: string;
  primaryKeyword: string;
  seoKeywords: string[];
  topicMatches: ArticleTopic[];
  slugTerms: string[];
  searchTerms: string[];
};

export const GUIDE_HUBS: GuideHub[] = [
  {
    slug: "engagement-rings",
    title: "Engagement Ring Guides",
    kicker: "Topic Hub",
    description:
      "Learn how to choose engagement rings, compare solitaire vs halo styles, and plan a realistic budget.",
    intro:
      "This hub is built for buyers researching engagement ring styles, price ranges, and practical buying steps.",
    primaryKeyword: "engagement ring guide",
    seoKeywords: [
      "engagement ring guide",
      "how to choose engagement ring",
      "engagement ring styles",
      "solitaire vs halo",
      "engagement ring budget",
    ],
    topicMatches: ["Buying Guides", "Engagement"],
    slugTerms: ["engagement", "solitaire-vs-halo"],
    searchTerms: ["engagement ring", "proposal", "solitaire", "halo", "wedding"],
  },
  {
    slug: "diamonds",
    title: "Diamond Guides",
    kicker: "Topic Hub",
    description:
      "Understand diamond shapes, lab vs natural choices, sparkle factors, and diamond buying basics.",
    intro:
      "This hub covers foundational diamond education for first-time buyers and comparison-focused shoppers.",
    primaryKeyword: "diamond buying guide",
    seoKeywords: [
      "diamond buying guide",
      "diamond shapes guide",
      "lab diamond guide",
      "diamond education",
      "best diamond shape",
    ],
    topicMatches: ["Diamond Education"],
    slugTerms: ["diamond", "lab"],
    searchTerms: ["diamond", "carat", "clarity", "cut", "shape"],
  },
  {
    slug: "gold",
    title: "Gold Jewellery Guides",
    kicker: "Topic Hub",
    description:
      "Compare gold types, tones, durability, and maintenance tips for rings and everyday jewellery.",
    intro:
      "This hub focuses on gold jewellery buying decisions including yellow gold, rose gold, and metal comparisons.",
    primaryKeyword: "gold jewellery guide",
    seoKeywords: [
      "gold jewellery guide",
      "gold vs platinum",
      "rose gold guide",
      "best metal for rings",
      "gold ring buying guide",
    ],
    topicMatches: ["Gold & Metals"],
    slugTerms: ["gold", "platinum", "rose-gold"],
    searchTerms: ["gold", "rose gold", "yellow gold", "metal", "platinum"],
  },
  {
    slug: "silver",
    title: "Silver Jewellery Guides",
    kicker: "Topic Hub",
    description:
      "Explore silver jewellery basics, styling, upkeep, and value-focused comparisons with other metals.",
    intro:
      "This hub is for shoppers researching silver jewellery choices, practical wear, and maintenance expectations.",
    primaryKeyword: "silver jewellery guide",
    seoKeywords: [
      "silver jewellery guide",
      "silver ring guide",
      "sterling silver jewellery",
      "silver vs gold jewellery",
      "silver jewellery care",
    ],
    topicMatches: ["Gold & Metals"],
    slugTerms: ["silver"],
    searchTerms: ["silver", "sterling", "925"],
  },
  {
    slug: "gemstones",
    title: "Gemstone Guides",
    kicker: "Topic Hub",
    description:
      "Compare gemstone colours, durability, and styles to choose stones that match your taste and lifestyle.",
    intro:
      "This hub gathers educational content for gemstone-focused jewellery buyers and style explorers.",
    primaryKeyword: "gemstone guide",
    seoKeywords: [
      "gemstone guide",
      "gemstone ring guide",
      "best gemstones for rings",
      "gemstone jewellery buying guide",
      "precious gemstone comparison",
    ],
    topicMatches: ["Gemstones"],
    slugTerms: ["gemstone", "sapphire", "ruby", "emerald"],
    searchTerms: ["gemstone", "ruby", "sapphire", "emerald", "color stone"],
  },
  {
    slug: "ring-size",
    title: "Ring Size Guides",
    kicker: "Topic Hub",
    description:
      "Get ring size right with at-home measuring methods, fit tips, and practical sizing advice.",
    intro:
      "This hub helps you avoid expensive resize mistakes with simple and accurate ring size guidance.",
    primaryKeyword: "ring size guide",
    seoKeywords: [
      "ring size guide",
      "how to measure ring size",
      "ring size at home",
      "ring fit guide",
      "engagement ring size tips",
    ],
    topicMatches: ["Buying Guides"],
    slugTerms: ["ring-size", "measure-ring-size"],
    searchTerms: ["ring size", "size chart", "fit", "measure"],
  },
  {
    slug: "jewellery-care",
    title: "Jewellery Care Guides",
    kicker: "Topic Hub",
    description:
      "Learn cleaning, storage, and maintenance best practices for long-lasting jewellery shine and durability.",
    intro:
      "This hub is designed for after-purchase care, maintenance routines, and safe everyday wear advice.",
    primaryKeyword: "jewellery care guide",
    seoKeywords: [
      "jewellery care guide",
      "how to clean jewellery",
      "ring maintenance tips",
      "gold jewellery care",
      "diamond jewellery care",
    ],
    topicMatches: ["Jewellery Care"],
    slugTerms: ["care", "maintain", "clean"],
    searchTerms: ["care", "clean", "maintenance", "storage", "polish"],
  },
  {
    slug: "gift-guides",
    title: "Gift Guide Hub",
    kicker: "Topic Hub",
    description:
      "Find gift-ready jewellery ideas by budget, style, and occasion with practical buying frameworks.",
    intro:
      "This hub is for gifting intent: budget-first discovery, style matching, and low-risk buying decisions.",
    primaryKeyword: "jewellery gift guide",
    seoKeywords: [
      "jewellery gift guide",
      "ring gift ideas",
      "jewellery by budget",
      "gift jewellery for her",
      "engagement ring budget guide",
    ],
    topicMatches: ["Buying Guides", "Trending", "Wedding"],
    slugTerms: ["budget", "guide"],
    searchTerms: ["gift", "budget", "occasion", "style", "buying"],
  },
  {
    slug: "brand-comparison",
    title: "Brand Comparison Guides",
    kicker: "Topic Hub",
    description:
      "Compare jewellery brands side by side for price, style range, quality signals, and buyer value.",
    intro:
      "This hub is built for shoppers evaluating one brand versus another before purchase decisions.",
    primaryKeyword: "jewellery brand comparison",
    seoKeywords: [
      "jewellery brand comparison",
      "caratlane vs bluestone",
      "best jewellery brand india",
      "ring brand comparison",
      "jewellery brand value comparison",
    ],
    topicMatches: ["Brand Comparison", "Brand Comparisons"],
    slugTerms: ["vs", "comparison", "caratlane", "bluestone"],
    searchTerms: ["brand", "comparison", "vs", "caratlane", "bluestone", "price", "quality"],
  },
];

export const GUIDE_HUB_BY_SLUG = new Map<GuideHubSlug, GuideHub>(
  GUIDE_HUBS.map((hub) => [hub.slug, hub])
);

const HUB_ARTICLE_SLUGS: Record<GuideHubSlug, string[]> = {
  "engagement-rings": [
    "how-to-choose-engagement-ring",
    "engagement-ring-budget",
    "solitaire-vs-halo",
  ],
  diamonds: [
    "diamond-shapes-guide",
    "lab-diamond-guide",
  ],
  gold: [
    "gold-vs-platinum",
    "rose-gold-guide",
  ],
  silver: [
    "gold-vs-platinum",
    "rose-gold-guide",
  ],
  gemstones: [
    "diamond-shapes-guide",
    "lab-diamond-guide",
    "solitaire-vs-halo",
  ],
  "ring-size": [
    "ring-size-guide",
    "how-to-measure-ring-size-at-home",
  ],
  "jewellery-care": [
    "rose-gold-guide",
    "gold-vs-platinum",
  ],
  "gift-guides": [
    "engagement-ring-budget",
    "how-to-choose-engagement-ring",
    "solitaire-vs-halo",
    "ring-size-guide",
  ],
  "brand-comparison": [
    "caratlane-vs-bluestone",
    "caratlane-vs-candere",
    "bluestone-vs-tanishq",
    "giva-vs-palmonas",
    "mia-vs-caratlane",
  ],
};

function normalize(value: string): string {
  return value.toLowerCase();
}

export function getGuideHubBySlug(slug: string): GuideHub | undefined {
  return GUIDE_HUB_BY_SLUG.get(slug as GuideHubSlug);
}

export function getGuideHubArticles(hub: GuideHub, articles: ArticleEntry[], limit?: number): ArticleEntry[] {
  const bySlug = new Map(articles.map((article) => [article.slug, article]));

  const mapped = (HUB_ARTICLE_SLUGS[hub.slug] ?? [])
    .map((slug) => bySlug.get(slug))
    .filter((article): article is ArticleEntry => Boolean(article));

  const scored = articles
    .filter((article) => !mapped.some((mappedArticle) => mappedArticle.slug === article.slug))
    .map((article) => {
      const text = normalize(
        [article.slug, article.title, article.description, article.topic, article.category, article.content]
          .join(" ")
      );

      let score = 0;

      if (hub.topicMatches.includes(article.topic)) score += 4;
      if (article.featured) score += 1;

      for (const term of hub.slugTerms) {
        if (article.slug.includes(term.toLowerCase())) score += 6;
      }

      for (const term of hub.searchTerms) {
        if (text.includes(term.toLowerCase())) score += 2;
      }

      return { article, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || Number(b.article.featured) - Number(a.article.featured) || a.article.title.localeCompare(b.article.title))
    .map((entry) => entry.article);

  const unique = Array.from(new Map([...mapped, ...scored].map((article) => [article.slug, article])).values());
  return typeof limit === "number" ? unique.slice(0, limit) : unique;
}
