import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getArticle, getSchoolProfile } from "@/lib/api";

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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(value));
}

export default async function ArticleDetailPage({ params }: ArticleDetailProps) {
  const { slug } = await params;
  const [profile, article] = await Promise.all([getSchoolProfile(), getArticle(slug)]);

  if (!article) {
    notFound();
  }

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
      <Header />
      <main className="pt-28">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        />
        <article className="container-page py-16">
          <p className="text-sm font-extrabold uppercase text-rosebrand-600">{article.category}</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight md:text-6xl">{article.title}</h1>
          <p className="mt-5 text-zinc-500">
            {formatDate(article.publishedAt)} · {article.authorName}
          </p>
          <div className="relative mt-10 aspect-[16/8] overflow-hidden rounded-[8px] bg-white shadow-soft">
            <Image src={article.coverImage} alt={article.title} fill className="object-cover" priority />
          </div>
          <div className="mx-auto mt-10 max-w-3xl text-lg leading-9 text-zinc-700">
            <p>{article.excerpt}</p>
            <p className="mt-6">
              Konten lengkap artikel akan diambil dari dashboard admin. Struktur halaman ini sudah
              disiapkan untuk kebutuhan SEO dengan metadata, Open Graph, dan schema Article.
            </p>
          </div>
        </article>
      </main>
      <Footer profile={profile} />
    </>
  );
}
