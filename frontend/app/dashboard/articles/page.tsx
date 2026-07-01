import { ArticleManager } from "@/components/ArticleManager";
import { getArticles } from "@/lib/api";

export default async function DashboardArticlesPage() {
  const articles = await getArticles();
  return <ArticleManager initialArticles={articles} />;
}
