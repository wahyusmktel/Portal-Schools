import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock3, Eye, Newspaper } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getArticles, getSchoolProfile } from "@/lib/api";
import { formatDate, readCount, readingTime } from "@/lib/article-utils";

export const metadata: Metadata = {
  title: "Artikel dan Berita",
  description: "Daftar artikel, berita sekolah, pendidikan, dan teknologi dari SMK Telkom Lampung."
};

export default async function ArticlesPage(props: { searchParams: Promise<{ kategori?: string }> }) {
  const searchParams = await props.searchParams;
  const [profile, articles] = await Promise.all([getSchoolProfile(), getArticles()]);
  
  const selectedCategory = searchParams?.kategori;
  let filteredArticles = articles;
  if (selectedCategory) {
    filteredArticles = articles.filter(a => a.category === selectedCategory);
  }
  
  const [featured, ...rest] = filteredArticles;
  const editorPicks = rest.slice(0, 3);
  const categories = Array.from(new Set(articles.map((article) => article.category)));

  return (
    <>
      <Header logoUrl={profile.headerLogo} />
      <main className="pt-28">
        <section className="container-page py-14">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-extrabold uppercase text-rosebrand-600">
                <Newspaper size={18} aria-hidden />
                Magazine Sekolah
              </p>
              <h1 className="mt-4 max-w-4xl text-5xl font-black leading-none md:text-7xl">
                {selectedCategory ? `Artikel Kategori: ${selectedCategory}` : "Berita pendidikan, teknologi, dan aktivitas sekolah"}
              </h1>
            </div>
            <div className="flex flex-wrap gap-2 lg:max-w-md lg:justify-end">
              {categories.map((category) => (
                <Link
                  key={category}
                  href={selectedCategory === category ? "/artikel" : `/artikel?kategori=${encodeURIComponent(category)}`}
                  className={`rounded-full px-4 py-2 text-sm font-extrabold shadow-sm transition ${
                    selectedCategory === category 
                      ? "bg-rosebrand-600 text-white" 
                      : "bg-white text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  {category}
                </Link>
              ))}
            </div>
          </div>

          {featured ? (
            <article className="mt-12 grid overflow-hidden rounded-[8px] bg-white shadow-soft lg:grid-cols-[1.2fr_0.8fr]">
              <Link href={`/artikel/${featured.slug}`} className="group relative min-h-[360px] overflow-hidden">
                <Image
                  src={featured.coverImage}
                  alt={featured.title}
                  fill
                  priority
                  sizes="(min-width: 1024px) 58vw, 100vw"
                  className="object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-transparent to-transparent" />
              </Link>
              <div className="flex flex-col justify-center p-7 md:p-10">
                <p className="text-sm font-extrabold uppercase text-rosebrand-600">
                  {featured.category} · {formatDate(featured.publishedAt)}
                </p>
                <h2 className="mt-4 text-4xl font-black leading-tight">
                  <Link href={`/artikel/${featured.slug}`}>{featured.title}</Link>
                </h2>
                <p className="mt-5 text-lg leading-8 text-zinc-600">{featured.excerpt}</p>
                <ArticleStats article={featured} />
                <Link
                  href={`/artikel/${featured.slug}`}
                  className="mt-8 inline-flex h-11 w-fit items-center gap-2 rounded-full bg-rosebrand-500 px-5 text-sm font-extrabold text-white transition hover:bg-rosebrand-600"
                >
                  Baca liputan utama <ArrowRight size={17} aria-hidden />
                </Link>
              </div>
            </article>
          ) : null}

          <div className="mt-10 grid gap-8 lg:grid-cols-[0.72fr_0.28fr]">
            <section className="grid gap-6 md:grid-cols-2">
              {rest.map((article) => (
                <article key={article.id} className="group overflow-hidden rounded-[8px] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-soft">
                  <Link href={`/artikel/${article.slug}`} className="relative block aspect-[16/10] overflow-hidden">
                    <Image
                      src={article.coverImage}
                      alt={article.title}
                      fill
                      sizes="(min-width: 1024px) 36vw, 100vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  </Link>
                  <div className="p-6">
                    <p className="text-sm font-bold text-rosebrand-600">
                      {article.category} · {formatDate(article.publishedAt)}
                    </p>
                    <h2 className="mt-3 text-2xl font-black leading-tight">
                      <Link href={`/artikel/${article.slug}`}>{article.title}</Link>
                    </h2>
                    <p className="mt-4 leading-7 text-zinc-600">{article.excerpt}</p>
                    <ArticleStats article={article} />
                  </div>
                </article>
              ))}
            </section>

            <aside className="h-fit rounded-[8px] bg-zinc-900 p-6 text-white shadow-soft lg:sticky lg:top-28">
              <p className="text-sm font-extrabold uppercase text-rosebrand-300">Editor Picks</p>
              <div className="mt-5 grid gap-5">
                {editorPicks.map((article, index) => (
                  <Link key={article.id} href={`/artikel/${article.slug}`} className="grid grid-cols-[42px_1fr] gap-4 border-b border-white/10 pb-5 last:border-b-0 last:pb-0">
                    <span className="text-3xl font-black text-white/25">{String(index + 1).padStart(2, "0")}</span>
                    <span>
                      <span className="block text-sm font-bold text-rosebrand-200">{article.category}</span>
                      <span className="mt-1 block font-black leading-snug">{article.title}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </aside>
          </div>
        </section>
      </main>
      <Footer profile={profile} />
    </>
  );
}

function ArticleStats({ article }: { article: Parameters<typeof readingTime>[0] }) {
  return (
    <div className="mt-5 flex flex-wrap gap-3 text-xs font-bold text-zinc-500">
      <span className="inline-flex items-center gap-1.5">
        <Clock3 size={15} aria-hidden />
        {readingTime(article)} menit baca
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Eye size={15} aria-hidden />
        {readCount(article).toLocaleString("id-ID")} dibaca
      </span>
    </div>
  );
}
