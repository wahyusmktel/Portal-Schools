import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Download, Eye, LibraryBig, Search } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getSchoolProfile, getTeachingModules } from "@/lib/api";
import { normalizeImageUrl } from "@/lib/image-url";

export const metadata: Metadata = {
  title: "Modul Ajar Digital",
  description: "Perpustakaan digital modul ajar SMK Telkom Lampung yang dapat dibaca online dan diunduh."
};

export default async function TeachingModulesPage() {
  const [profile, modules] = await Promise.all([getSchoolProfile(), getTeachingModules()]);
  const subjects = Array.from(new Set((modules || []).map((item) => item.subject).filter(Boolean)));
  const totalReads = modules.reduce((sum, item) => sum + (item.viewCount || 0), 0);
  const totalDownloads = modules.reduce((sum, item) => sum + (item.downloadCount || 0), 0);

  return (
    <>
      <Header logoUrl={profile.headerLogo} />
      <main className="bg-softgray pt-28">
        <section className="container-page py-14">
          <div className="grid gap-10 lg:grid-cols-[0.62fr_0.38fr] lg:items-end">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-rosebrand-50 px-4 py-2 text-sm font-extrabold uppercase text-rosebrand-700">
                <LibraryBig size={18} aria-hidden />
                Perpustakaan Digital
              </p>
              <h1 className="mt-5 max-w-4xl text-5xl font-black leading-none text-zinc-950 md:text-7xl">
                Modul ajar digital untuk belajar lebih fokus.
              </h1>
              <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-zinc-600">
                Baca modul langsung di website dengan tampilan buku digital, simpan referensi penting, dan unduh PDF untuk belajar mandiri.
              </p>
            </div>
            <div className="grid gap-3 rounded-[8px] bg-white p-5 shadow-sm">
              <div className="grid grid-cols-3 gap-3">
                <Stat label="Modul" value={modules.length.toLocaleString("id-ID")} />
                <Stat label="Dibaca" value={totalReads.toLocaleString("id-ID")} />
                <Stat label="Unduh" value={totalDownloads.toLocaleString("id-ID")} />
              </div>
              <div className="flex items-center gap-2 rounded-[8px] bg-zinc-50 px-4 py-3 text-sm font-bold text-zinc-500">
                <Search size={17} aria-hidden />
                Pilih modul berdasarkan mata pelajaran dan tingkat.
              </div>
            </div>
          </div>
        </section>

        <section className="container-page pb-20">
          {subjects.length > 0 && (
            <div className="mb-8 flex flex-wrap gap-2">
              {subjects.map((subject) => (
                <span key={subject} className="rounded-full bg-white px-4 py-2 text-sm font-black text-zinc-600 shadow-sm">
                  {subject}
                </span>
              ))}
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {modules.map((module) => (
              <article key={module.id} className="group overflow-hidden rounded-[8px] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
                <Link href={`/modul-ajar/${module.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-zinc-100">
                  {module.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={normalizeImageUrl(module.coverImage)} alt={module.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="grid h-full place-items-center bg-zinc-900 text-white">
                      <BookOpen size={52} aria-hidden />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                    <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-black text-zinc-800 backdrop-blur">{module.subject}</span>
                    <span className="rounded-full bg-rosebrand-500 px-3 py-1 text-xs font-black text-white">{module.gradeLevel}</span>
                  </div>
                </Link>
                <div className="grid gap-4 p-6">
                  <div>
                    <h2 className="line-clamp-2 text-2xl font-black leading-tight text-zinc-950">
                      <Link href={`/modul-ajar/${module.slug}`}>{module.title}</Link>
                    </h2>
                    <p className="mt-3 line-clamp-3 text-sm font-semibold leading-6 text-zinc-500">{module.description}</p>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-zinc-100 pt-4">
                    <div className="flex gap-3 text-xs font-black text-zinc-500">
                      <span className="inline-flex items-center gap-1.5"><Eye size={15} aria-hidden /> {module.viewCount}</span>
                      <span className="inline-flex items-center gap-1.5"><Download size={15} aria-hidden /> {module.downloadCount}</span>
                    </div>
                    <Link href={`/modul-ajar/${module.slug}`} className="inline-flex items-center gap-2 text-sm font-black text-rosebrand-600">
                      Baca <ArrowRight size={16} aria-hidden />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {modules.length === 0 && (
            <div className="rounded-[8px] bg-white p-8 text-center shadow-sm">
              <BookOpen className="mx-auto text-rosebrand-600" size={42} aria-hidden />
              <h2 className="mt-4 text-2xl font-black text-zinc-950">Modul ajar belum tersedia</h2>
              <p className="mt-2 text-sm font-semibold text-zinc-500">Admin dapat menambahkan modul ajar melalui dashboard.</p>
            </div>
          )}
        </section>
      </main>
      <Footer profile={profile} />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] bg-zinc-50 p-4 text-center">
      <p className="text-2xl font-black text-zinc-950">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase text-zinc-500">{label}</p>
    </div>
  );
}
