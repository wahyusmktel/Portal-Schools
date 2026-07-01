import type { Article } from "@/types/content";

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(value));
}

export function readingTime(article: Article): number {
  const text = `${article.title} ${article.excerpt} ${article.content || ""}`;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 180));
}

export function readCount(article: Article): number {
  return article.viewCount || 0;
}

export function relatedArticles(article: Article, articles: Article[], limit = 3): Article[] {
  const sameCategory = articles.filter((item) => item.slug !== article.slug && item.category === article.category);
  const others = articles.filter((item) => item.slug !== article.slug && item.category !== article.category);
  return [...sameCategory, ...others].slice(0, limit);
}
