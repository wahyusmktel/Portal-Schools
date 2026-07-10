import type { Article } from "@/types/content";

const SITE_TIME_ZONE = "Asia/Jakarta";

export function formatDate(value: string, includeTime?: boolean) {
  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: SITE_TIME_ZONE
  };
  if (includeTime) {
    options.hour = "2-digit";
    options.minute = "2-digit";
  }
  return new Intl.DateTimeFormat("id-ID", options).format(new Date(value));
}

export function formatDateRange(startsAt: string, endsAt?: string, includeTime?: boolean) {
  if (!endsAt) {
    return formatDate(startsAt, includeTime);
  }

  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start.getTime() === end.getTime()) {
    return formatDate(startsAt, includeTime);
  }
  if (!includeTime && formatDate(startsAt) === formatDate(endsAt)) {
    return formatDate(startsAt);
  }

  return `${formatDate(startsAt, includeTime)} - ${formatDate(endsAt, includeTime)}`;
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
