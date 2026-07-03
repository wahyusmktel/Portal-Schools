import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  FileText,
  GraduationCap,
  HelpCircle,
  Images,
  Megaphone,
  School,
  ShieldCheck,
  Sparkles,
  Trophy,
  UsersRound
} from "lucide-react";
import {
  getAchievements,
  getAgendas,
  getAlumni,
  getAnnouncements,
  getArticles,
  getFaqs,
  getHeroSlides,
  getIndustryPartners,
  getMajors,
  getSchoolProfile
} from "@/lib/api";
import { formatDate } from "@/lib/article-utils";

export default async function DashboardPage() {
  const [profile, heroSlides, majors, articles, announcements, agendas, achievements, partners, alumni, faqs] = await Promise.all([
    getSchoolProfile(),
    getHeroSlides(),
    getMajors(),
    getArticles(),
    getAnnouncements(),
    getAgendas(),
    getAchievements(),
    getIndustryPartners(),
    getAlumni(),
    getFaqs()
  ]);

  const spmbBrochureCount = (profile.spmbBrochureUrl || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean).length;

  const stats = [
    { label: "Artikel", value: articles.length, icon: FileText, href: "/dashboard/articles", tone: "bg-rosebrand-50 text-rosebrand-700" },
    { label: "Agenda", value: agendas.length, icon: CalendarDays, href: "/dashboard/agendas", tone: "bg-sky-50 text-sky-700" },
    { label: "Pengumuman", value: announcements.length, icon: Megaphone, href: "/dashboard/announcements", tone: "bg-amber-50 text-amber-700" },
    { label: "Slide Hero Aktif", value: heroSlides.length, icon: Images, href: "/dashboard/hero-slides", tone: "bg-emerald-50 text-emerald-700" }
  ];

  const readiness = [
    { label: "Profil sekolah", done: Boolean(profile.name && profile.description), href: "/dashboard/school-profile" },
    { label: "Slider hero", done: heroSlides.length > 0, href: "/dashboard/hero-slides" },
    { label: "Jurusan", done: majors.length > 0, href: "/dashboard/majors" },
    { label: "Brosur SPMB", done: spmbBrochureCount > 0, href: "/dashboard/school-profile" },
    { label: "FAQ publik", done: faqs.length > 0, href: "/dashboard/faqs" },
    { label: "Mitra industri", done: partners.length > 0, href: "/dashboard/industry-partners" }
  ];

  const quickActions = [
    { label: "Profil Sekolah", href: "/dashboard/school-profile", icon: School },
    { label: "Slider Hero", href: "/dashboard/hero-slides", icon: Images },
    { label: "Jurusan", href: "/dashboard/majors", icon: BookOpen },
    { label: "Report SPMB", href: "/dashboard/spmb", icon: GraduationCap },
    { label: "Prestasi", href: "/dashboard/achievements", icon: Trophy },
    { label: "Pusat Bantuan", href: "/dashboard/faqs", icon: HelpCircle }
  ];

  const contentMix = [
    { label: "Program keahlian", value: majors.length },
    { label: "Prestasi", value: achievements.length },
    { label: "Mitra industri", value: partners.length },
    { label: "Alumni", value: alumni.length }
  ];

  return (
    <div className="grid gap-7">
      <section className="overflow-hidden rounded-[8px] bg-zinc-950 text-white shadow-soft">
        <div className="grid gap-8 p-6 lg:grid-cols-[1fr_auto] lg:items-center lg:p-8">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-extrabold text-rosebrand-200 ring-1 ring-white/10">
              <ShieldCheck size={17} aria-hidden />
              Portal Admin SMK Telkom Lampung
            </p>
            <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight md:text-5xl">
              Pusat kontrol konten website sekolah.
            </h1>
            <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-white/65">
              Pantau kesiapan halaman publik, kelola konten utama, dan lompat cepat ke modul yang paling sering dipakai.
            </p>
          </div>
          <Link href="/" className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] bg-white px-5 text-sm font-extrabold text-zinc-950 transition hover:bg-rosebrand-50">
            Lihat Website
            <ArrowRight size={17} aria-hidden />
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="group rounded-[8px] border border-zinc-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <span className={`grid h-11 w-11 place-items-center rounded-[8px] ${stat.tone}`}>
              <stat.icon size={22} aria-hidden />
            </span>
            <span className="mt-5 block text-3xl font-black text-zinc-950">{stat.value}</span>
            <span className="mt-1 flex items-center justify-between text-sm font-bold text-zinc-500">
              {stat.label}
              <ArrowRight size={15} className="opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100" aria-hidden />
            </span>
          </Link>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.62fr_0.38fr]">
        <div className="rounded-[8px] border border-zinc-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-extrabold uppercase text-rosebrand-600">Kesiapan Website</p>
              <h2 className="mt-2 text-2xl font-black text-zinc-950">Checklist publikasi</h2>
            </div>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-black text-zinc-600">
              {readiness.filter((item) => item.done).length}/{readiness.length}
            </span>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {readiness.map((item) => (
              <Link key={item.label} href={item.href} className="flex items-center justify-between rounded-[8px] border border-zinc-100 px-4 py-3 transition hover:border-rosebrand-200 hover:bg-rosebrand-50">
                <span className="text-sm font-bold text-zinc-700">{item.label}</span>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black ${item.done ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                  <CheckCircle2 size={14} aria-hidden />
                  {item.done ? "Siap" : "Perlu isi"}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-[8px] border border-zinc-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-extrabold uppercase text-rosebrand-600">Aksi Cepat</p>
          <h2 className="mt-2 text-2xl font-black text-zinc-950">Modul utama</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {quickActions.map((item) => (
              <Link key={item.href} href={item.href} className="group flex items-center gap-3 rounded-[8px] border border-zinc-100 p-3 transition hover:border-rosebrand-200 hover:bg-rosebrand-50">
                <span className="grid h-9 w-9 place-items-center rounded-[8px] bg-zinc-100 text-zinc-700 transition group-hover:bg-white group-hover:text-rosebrand-600">
                  <item.icon size={18} aria-hidden />
                </span>
                <span className="text-sm font-black text-zinc-800">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.42fr_0.58fr]">
        <div className="rounded-[8px] border border-zinc-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-extrabold uppercase text-rosebrand-600">Komposisi Konten</p>
          <h2 className="mt-2 text-2xl font-black text-zinc-950">Aset website</h2>
          <div className="mt-5 grid gap-3">
            {contentMix.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-[8px] bg-zinc-50 px-4 py-3">
                <span className="text-sm font-bold text-zinc-600">{item.label}</span>
                <span className="text-xl font-black text-zinc-950">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[8px] border border-zinc-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-extrabold uppercase text-rosebrand-600">Konten Terbaru</p>
              <h2 className="mt-2 text-2xl font-black text-zinc-950">Artikel dan informasi</h2>
            </div>
            <Sparkles className="text-rosebrand-500" size={24} aria-hidden />
          </div>
          <div className="mt-5 grid gap-3">
            {articles.slice(0, 3).map((article) => (
              <Link key={article.id} href={`/artikel/${article.slug}`} className="rounded-[8px] border border-zinc-100 p-4 transition hover:border-rosebrand-200 hover:bg-rosebrand-50">
                <p className="text-xs font-black uppercase text-rosebrand-600">{article.category} · {formatDate(article.publishedAt)}</p>
                <h3 className="mt-2 line-clamp-1 text-base font-black text-zinc-950">{article.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm font-semibold leading-6 text-zinc-500">{article.excerpt}</p>
              </Link>
            ))}
            {announcements.slice(0, 2).map((item) => (
              <Link key={item.id} href="/#pengumuman" className="rounded-[8px] border border-zinc-100 p-4 transition hover:border-rosebrand-200 hover:bg-rosebrand-50">
                <p className="text-xs font-black uppercase text-amber-600">Pengumuman · {formatDate(item.publishedAt)}</p>
                <h3 className="mt-2 line-clamp-1 text-base font-black text-zinc-950">{item.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm font-semibold leading-6 text-zinc-500">{item.body}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 rounded-[8px] border border-zinc-100 bg-white p-6 shadow-sm md:grid-cols-3">
        <div className="flex items-center gap-3">
          <UsersRound className="text-rosebrand-600" size={22} aria-hidden />
          <div>
            <p className="text-sm font-black text-zinc-950">Role admin aktif</p>
            <p className="text-xs font-semibold text-zinc-500">Superadmin, admin, contributor, admin-spmb</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <GraduationCap className="text-rosebrand-600" size={22} aria-hidden />
          <div>
            <p className="text-sm font-black text-zinc-950">SPMB {profile.spmbAcademicYear || "2026/2027"}</p>
            <p className="text-xs font-semibold text-zinc-500">{spmbBrochureCount} halaman brosur tersambung</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <CalendarDays className="text-rosebrand-600" size={22} aria-hidden />
          <div>
            <p className="text-sm font-black text-zinc-950">Agenda terdekat</p>
            <p className="text-xs font-semibold text-zinc-500">{agendas[0] ? agendas[0].title : "Belum ada agenda"}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
