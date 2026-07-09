import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Clock3, Eye, Facebook, MessageCircle, Share2, Twitter } from "lucide-react";
import { CommentBox } from "@/components/CommentBox";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ViewTracker } from "@/components/ViewTracker";
import { getArticle, getArticles, getSchoolProfile } from "@/lib/api";
import { formatDate, readCount, readingTime, relatedArticles } from "@/lib/article-utils";

type ArticleDetailProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ArticleDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    return { title: "Artikel tidak ditemukan" };
  }

  return {
    title: article.title,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      images: [article.coverImage],
      type: "article",
      publishedTime: article.publishedAt,
      authors: [article.authorName]
    }
  };
}

export default async function ArticleDetailPage({ params }: ArticleDetailProps) {
  const { slug } = await params;
  const [profile, article, articles] = await Promise.all([
    getSchoolProfile(),
    getArticle(slug),
    getArticles()
  ]);

  if (!article) {
    notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const articleUrl = `${siteUrl}/artikel/${article.slug}`;
  const related = relatedArticles(article, articles);
  const articleBody = formatArticleBody(
    article.content ||
      `${article.excerpt}\n\nKonten lengkap artikel akan diambil dari dashboard admin. Struktur halaman ini sudah disiapkan untuk kebutuhan SEO dengan metadata, Open Graph, dan schema Article.`
  );

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    image: article.coverImage,
    datePublished: article.publishedAt,
    author: {
      "@type": "Person",
      name: article.authorName
    },
    publisher: {
      "@type": "Organization",
      name: profile.name
    }
  };

  return (
    <>
      <Header logoUrl={profile.headerLogo} />
      <main className="pt-28">
        <ViewTracker slug={article.slug} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        />
        <article className="container-page py-6">
          <nav className="mb-6 flex items-center gap-2 text-sm font-bold text-zinc-500">
            <Link href="/" className="hover:text-rosebrand-600">Home</Link>
            <ChevronRight size={14} />
            <Link href="/artikel" className="hover:text-rosebrand-600">Artikel</Link>
            <ChevronRight size={14} />
            <Link href={`/artikel?kategori=${encodeURIComponent(article.category)}`} className="hover:text-rosebrand-600">{article.category}</Link>
            <ChevronRight size={14} />
            <span className="truncate text-zinc-800 max-w-[200px] sm:max-w-md">{article.title}</span>
          </nav>
          <div className="grid gap-10 lg:grid-cols-[0.72fr_0.28fr]">
            <div>
              <Link href={`/artikel?kategori=${encodeURIComponent(article.category)}`} className="text-sm font-extrabold uppercase text-rosebrand-600 hover:underline">
                {article.category}
              </Link>
              <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight md:text-6xl">{article.title}</h1>
              <div className="mt-5 flex flex-wrap gap-4 text-sm font-bold text-zinc-500">
                <span>{formatDate(article.publishedAt)}</span>
                <span>{article.authorName}</span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 size={16} aria-hidden />
                  {readingTime(article)} menit baca
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Eye size={16} aria-hidden />
                  {readCount(article).toLocaleString("id-ID")} dibaca
                </span>
              </div>

              <div className="relative mt-10 aspect-[16/8] overflow-hidden rounded-[8px] bg-white shadow-soft">
                <Image src={article.coverImage} alt={article.title} fill sizes="(max-width: 768px) 100vw, 900px" className="object-cover" priority />
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <p className="inline-flex items-center gap-2 text-sm font-extrabold text-zinc-600">
                  <Share2 size={17} aria-hidden />
                  Bagikan
                </p>
                <ShareLink href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`} label="Facebook" icon={<Facebook size={18} aria-hidden />} />
                <ShareLink href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(article.title)}`} label="X" icon={<Twitter size={18} aria-hidden />} />
                <ShareLink href={`https://wa.me/?text=${encodeURIComponent(`${article.title} ${articleUrl}`)}`} label="WhatsApp" icon={<MessageCircle size={18} aria-hidden />} />
                <CopyLinkButton url={articleUrl} />
              </div>

              <div
                className="article-rich-content mt-10 max-w-3xl"
                dangerouslySetInnerHTML={{ __html: articleBody }}
              />

              <div className="mt-12">
                <CommentBox articleSlug={article.slug} />
              </div>
            </div>

            <aside className="grid h-fit gap-6 lg:sticky lg:top-28">
              <section className="rounded-[8px] bg-white p-6 shadow-sm">
                <h2 className="text-xl font-black">Statistik Artikel</h2>
                <div className="mt-5 grid gap-3">
                  <Stat label="Dibaca" value={readCount(article).toLocaleString("id-ID")} />
                  <Stat label="Waktu Baca" value={`${readingTime(article)} menit`} />
                  <Stat label="Kategori" value={article.category} />
                </div>
              </section>

              <section className="rounded-[8px] bg-zinc-900 p-6 text-white shadow-soft">
                <h2 className="text-xl font-black">Artikel Terkait</h2>
                <div className="mt-5 grid gap-5">
                  {related.map((item) => (
                    <Link key={item.id} href={`/artikel/${item.slug}`} className="group grid gap-3 border-b border-white/10 pb-5 last:border-b-0 last:pb-0">
                      <span className="relative aspect-[16/9] overflow-hidden rounded-[8px] bg-white/10">
                        <Image src={item.coverImage} alt={item.title} fill sizes="320px" className="object-cover transition duration-500 group-hover:scale-105" />
                      </span>
                      <span className="text-sm font-bold text-rosebrand-200">{item.category}</span>
                      <span className="font-black leading-snug">{item.title}</span>
                    </Link>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        </article>
      </main>
      <Footer profile={profile} />
    </>
  );
}

function formatArticleBody(value: string): string {
  const source = value.trim();
  if (!source) {
    return "";
  }

  if (/<[a-z][\s\S]*>/i.test(source)) {
    return source;
  }

  return source
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function ShareLink({ href, label, icon }: { href: string; label: string; icon: ReactNode }) {
  return (
    <Link
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-extrabold text-zinc-700 shadow-sm transition hover:-translate-y-0.5 hover:text-rosebrand-700"
    >
      {icon}
      {label}
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] bg-softgray p-4">
      <p className="text-xs font-extrabold uppercase text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-black text-zinc-900">{value}</p>
    </div>
  );
}
