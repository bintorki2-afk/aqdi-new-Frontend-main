import { promises as fs } from "node:fs";
import path from "node:path";

import type { Article } from "@/features/blog/types/article";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

function sortByDateDesc(articles: Article[]): Article[] {
  return [...articles].sort((a, b) => b.date.localeCompare(a.date));
}

export async function getAllArticles(): Promise<Article[]> {
  try {
    const entries = await fs.readdir(BLOG_DIR);
    const jsonFiles = entries.filter((entry) => entry.endsWith(".json"));

    const articles = await Promise.all(
      jsonFiles.map(async (fileName) => {
        const raw = await fs.readFile(path.join(BLOG_DIR, fileName), "utf8");
        return JSON.parse(raw) as Article;
      }),
    );

    return sortByDateDesc(articles);
  } catch {
    return [];
  }
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const articles = await getAllArticles();
  return articles.find((article) => article.slug === slug) ?? null;
}

export async function getArticleSlugs(): Promise<string[]> {
  const articles = await getAllArticles();
  return articles.map((article) => article.slug);
}
