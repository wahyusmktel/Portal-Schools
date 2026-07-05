import { ArrowRight, CalendarDays, Clock3, Eye, Megaphone, Newspaper, Phone, Quote } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { HeroSlider } from "@/components/HeroSlider";
import { MajorShowcase } from "@/components/MajorShowcase";
import { MotionSection } from "@/components/MotionSection";
import { getAgendas, getAnnouncements, getArticles, getHeroSlides, getMajors, getSchoolProfile } from "@/lib/api";
import { formatDate, readCount, readingTime } from "@/lib/article-utils";

export default async function HomePage() {
  const [profile, heroSlides, majors, articles, announcements, agendas] = await Promise.all([
    getSchoolProfile(),
    getHeroSlides(),
    getMajors(),
    getArticles(),
    getAnnouncements(),
    getAgendas()
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: profile.name,
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    address: profile.address,
    email: profile.email,
    telephone: profile.phone
  };

  return (
    <>
      <Header logoUrl={profile.headerLogo} />
      <main>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <HeroSlider slides={heroSlides} />

        <MotionSection className="py-20" id="profil">
          <div className="container-page grid items-center gap-10 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="overflow-hidden rounded-[8px] bg-zinc-900 text-white shadow-soft">
              <div className="relative aspect-[4/3]">
                <Image
                  src={profile.principalImage || "/default-avatar.png"}
                  alt={profile.principalName || "Kepala Sekolah"}
                  fill
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
              </div>
              <div className="p-8">
                <Quote className="text-rosebrand-500" size={34} aria-hidden />
                <h2 className="mt-5 text-3xl font-black leading-tight">Sambutan Kepala Sekolah</h2>
                <div className="mt-5 max-h-52 overflow-y-auto pr-3 leading-8 text-white/75 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                  <p>{profile.principalMessage}</p>
                </div>
                <div className="mt-7 border-t border-white/10 pt-5">
                  <p className="font-extrabold">{profile.principalName}</p>
                  <p className="text-sm text-white/60">{profile.principalTitle}</p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-extrabold uppercase text-rosebrand-600">Profil Sekolah</p>
              <h1 className="section-title mt-3">{profile.name}</h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-600">{profile.description}</p>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {(profile.stats || []).map((stat) => (
                  <div key={stat.label} className="rounded-[8px] bg-white p-5 shadow-sm">
                    <p className="text-3xl font-black text-rosebrand-600">{stat.value}</p>
                    <p className="mt-2 text-sm font-semibold text-zinc-500">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </MotionSection>

        <MajorShowcase majors={majors} />

        <MotionSection className="py-20" id="artikel">
          <div className="container-page">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-extrabold uppercase text-rosebrand-600">Berita dan Artikel</p>
                <h2 className="section-title mt-3">Kabar terbaru sekolah</h2>
              </div>
              <Link
                href="/artikel"
                className="group inline-flex h-12 items-center gap-3 rounded-full bg-zinc-900 px-5 text-sm font-extrabold text-white shadow-soft transition duration-300 hover:-translate-y-1 hover:bg-rosebrand-600"
              >
                <Newspaper size={18} aria-hidden />
                Lihat semua artikel
                <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10 transition duration-300 group-hover:translate-x-1 group-hover:bg-white/20">
                  <ArrowRight size={17} aria-hidden />
                </span>
              </Link>
            </div>
            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {(articles || []).slice(0, 3).map((article) => (
                <article key={article.id} className="group overflow-hidden rounded-[8px] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-soft">
                  <div className="relative aspect-[16/10]">
                    <Image
                      src={article.coverImage}
                      alt={article.title}
                      fill
                      sizes="(min-width: 1024px) 33vw, 100vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6">
                    <p className="text-sm font-bold text-rosebrand-600">{article.category} · {formatDate(article.publishedAt)}</p>
                    <h3 className="mt-3 text-xl font-black leading-tight">
                      <Link href={`/artikel/${article.slug}`}>{article.title}</Link>
                    </h3>
                    <p className="mt-4 line-clamp-3 leading-7 text-zinc-600">{article.excerpt}</p>
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
                  </div>
                </article>
              ))}
            </div>
          </div>
        </MotionSection>

        <MotionSection className="bg-white py-20" id="agenda">
          <div className="container-page grid gap-8 lg:grid-cols-2">
            <div id="pengumuman">
              <p className="text-sm font-extrabold uppercase text-rosebrand-600">Pengumuman</p>
              <h2 className="mt-3 text-4xl font-black">Informasi penting</h2>
              <div className="mt-8 grid gap-4">
                {(announcements || []).map((item) => (
                  <article key={item.id} className="rounded-[8px] border border-zinc-200 p-5">
                    <p className="flex items-center gap-2 text-sm font-bold text-rosebrand-600">
                      <Megaphone size={17} aria-hidden /> {formatDate(item.publishedAt)}
                    </p>
                    <h3 className="mt-3 text-xl font-black">{item.title}</h3>
                    <p className="mt-2 leading-7 text-zinc-600">{item.body}</p>
                  </article>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-extrabold uppercase text-rosebrand-600">Agenda Terdekat</p>
              <h2 className="mt-3 text-4xl font-black">Kegiatan sekolah</h2>
              <div className="mt-8 grid gap-4">
                {(agendas || []).map((item) => (
                  <article key={item.id} className="rounded-[8px] bg-zinc-900 p-5 text-white">
                    <p className="flex items-center gap-2 text-sm font-bold text-rosebrand-300">
                      <CalendarDays size={17} aria-hidden /> {formatDate(item.startsAt)}
                    </p>
                    <h3 className="mt-3 text-xl font-black">{item.title}</h3>
                    <p className="mt-2 text-white/60">{item.location}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </MotionSection>

        <MotionSection className="py-20" id="lokasi">
          <div className="container-page grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-extrabold uppercase text-rosebrand-600">Alamat Sekolah</p>
              <h2 className="mt-3 text-4xl font-black">Datang dan terhubung</h2>
              <p className="mt-5 leading-8 text-zinc-600">{profile.address}</p>
              <p className="mt-4 flex items-center gap-2 font-bold text-zinc-700">
                <Phone size={18} className="text-rosebrand-600" aria-hidden />
                {profile.phone}
              </p>
            </div>
            <div className="overflow-hidden rounded-[8px] bg-white p-2 shadow-soft">
              <iframe
                title="Lokasi SMK Telkom Lampung"
                src={profile.mapEmbedUrl}
                className="h-[420px] w-full rounded-[6px] border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </MotionSection>
      </main>
      <Footer profile={profile} />
    </>
  );
}
