import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getArticles, getSchoolProfile } from "@/lib/api";

export const metadata: Metadata = {
  title: "Artikel dan Berita",
  description: "Daftar artikel, berita sekolah, pendidikan, dan teknologi dari SMK Telkom Lampung."
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(value));
}

export default async function ArticlesPage() {
  const [profile, articles] = await Promise.all([getSchoolProfile(), getArticles()]);

  return (
    <>
      <Header />
      <main className="pt-28">
        <section className="container-page py-16">
          <p className="text-sm font-extrabold uppercase text-rosebrand-600">Artikel</p>
          <h1 className="section-title mt-3">Berita pendidikan dan teknologi</h1>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <article key={article.id} className="overflow-hidden rounded-[8px] bg-white shadow-sm">
                <div className="relative aspect-[16/10]">
                  <Image src={article.coverImage} alt={article.title} fill className="object-cover" />
                </div>
                <div className="p-6">
                  <p className="text-sm font-bold text-rosebrand-600">{article.category} · {formatDate(article.publishedAt)}</p>
                  <h2 className="mt-3 text-xl font-black leading-tight">
                    <Link href={`/artikel/${article.slug}`}>{article.title}</Link>
                  </h2>
                  <p className="mt-4 leading-7 text-zinc-600">{article.excerpt}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer profile={profile} />
    </>
  );
}
