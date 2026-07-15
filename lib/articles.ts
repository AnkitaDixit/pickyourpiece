import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

export type ArticleTopic =
  | "Buying Guides"
  | "Diamond Education"
  | "Gold & Metals"
  | "Gemstones"
  | "Jewellery Care"
  | "Engagement"
  | "Wedding"
  | "Trending"
  | "Brand Comparisons";

export type ArticleEntry = {
  slug: string;
  title: string;
  description: string;
  category: string;
  topic: ArticleTopic;
  readTime: string;
  image: string;
  featured: boolean;
  content: string;
  lastModified: string;
};

type ArticleFrontmatter = {
  title?: string;
  description?: string;
  category?: string;
  topic?: ArticleTopic;
  readTime?: string;
  image?: string;
  featured?: boolean;
};

const ARTICLES_DIR = path.join(process.cwd(), "content", "articles");

export const ARTICLE_TOPICS: ArticleTopic[] = [
  "Buying Guides",
  "Diamond Education",
  "Gold & Metals",
  "Gemstones",
  "Jewellery Care",
  "Engagement",
  "Wedding",
  "Trending",
  "Brand Comparisons",
];

function ensureTopic(value: string): ArticleTopic {
  if (ARTICLE_TOPICS.includes(value as ArticleTopic)) {
    return value as ArticleTopic;
  }

  return "Buying Guides";
}

export async function getAllArticles(): Promise<ArticleEntry[]> {
  const fileNames = await readdir(ARTICLES_DIR);
  const articleFiles = fileNames.filter((name) => name.toLowerCase().endsWith(".md"));

  const parsed = await Promise.all(
    articleFiles.map(async (fileName) => {
      const filePath = path.join(ARTICLES_DIR, fileName);
      const [source, fileStats] = await Promise.all([readFile(filePath, "utf8"), stat(filePath)]);
      const { data, content } = matter(source);
      const frontmatter = data as ArticleFrontmatter;

      const slug = fileName.replace(/\.md$/i, "");

      if (
        !frontmatter.title ||
        !frontmatter.description ||
        !frontmatter.category ||
        !frontmatter.topic ||
        !frontmatter.readTime ||
        !frontmatter.image
      ) {
        return null;
      }

      return {
        slug,
        title: frontmatter.title,
        description: frontmatter.description,
        category: frontmatter.category,
        topic: ensureTopic(frontmatter.topic),
        readTime: frontmatter.readTime,
        image: frontmatter.image,
        featured: Boolean(frontmatter.featured),
        content: content.trim(),
        lastModified: fileStats.mtime.toISOString(),
      } satisfies ArticleEntry;
    })
  );

  return parsed
    .filter((article): article is ArticleEntry => Boolean(article))
    .sort((a, b) => {
      if (a.featured !== b.featured) {
        return a.featured ? -1 : 1;
      }

      return a.title.localeCompare(b.title);
    });
}

export async function getArticleBySlug(slug: string): Promise<ArticleEntry | undefined> {
  const articles = await getAllArticles();
  return articles.find((article) => article.slug === slug);
}
