import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, CheckCircle2, ChevronRight, GraduationCap, Sparkles, WalletCards } from "lucide-react";
import { getMajors, getSchoolProfile } from "@/lib/api";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SpmbBrochureFlipbook } from "@/components/SpmbBrochureFlipbook";

export const metadata: Metadata = {
  title: "SPMB SMK Telkom Lampung",
  description: "Sistem Penerimaan Murid Baru SMK Telkom Lampung tahun ajaran 2026/2027.",
};

export default async function SPMBPage() {
  const [profile, majors] = await Promise.all([
    getSchoolProfile().catch(() => null),
    getMajors().catch(() => [])
  ]);
  const academicYear = profile?.spmbAcademicYear || "2026/2027";
  const brochureImages = (profile?.spmbBrochureUrl || "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);

  return (
    <>
      <Header logoUrl={profile?.headerLogo} />
      <main className="bg-white">
        <section className="relative min-h-[92vh] overflow-hidden pt-28 text-white">
          <Image
            src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1800&q=82"
            alt="Siswa belajar teknologi"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-zinc-950/70" />
          <div className="container-page relative z-10 grid min-h-[calc(92vh-7rem)] content-center pb-16">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-extrabold backdrop-blur">
                <Sparkles size={17} aria-hidden />
                SPMB SMK Telkom Lampung {academicYear}
              </div>
              <h1 className="mt-7 max-w-4xl text-5xl font-black leading-tight tracking-normal md:text-7xl">
                Masuk sekolah yang membuat bakat digitalmu terlihat, terarah, dan bernilai.
              </h1>
              <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-white/75">
                SPMB {academicYear} dibuka untuk calon talenta muda yang ingin belajar teknologi, desain, jaringan, software, dan budaya kerja industri sejak hari pertama sekolah.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/spmb/pendaftaran" className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] bg-rosebrand-500 px-6 text-sm font-extrabold text-white shadow-soft transition hover:bg-rosebrand-600">
                  Daftar Sekarang
                  <ArrowRight size={18} aria-hidden />
                </Link>
                <a href="#biaya" className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] border border-white/20 bg-white/10 px-6 text-sm font-extrabold text-white backdrop-blur transition hover:bg-white/20">
                  Lihat Promo Hari Ini
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="biaya" className="border-y border-zinc-100 bg-zinc-950 py-8 text-white">
          <div className="container-page grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-sm font-extrabold uppercase text-rosebrand-300">Khusus hari ini</p>
              <h2 className="mt-2 text-3xl font-black">Ambil kursi lebih cepat, mulai tanpa biaya pendaftaran.</h2>
            </div>
            <div className="grid gap-3 rounded-[8px] border border-white/10 bg-white/10 p-5">
              <div className="flex items-center gap-3">
                <WalletCards size={22} className="text-rosebrand-300" aria-hidden />
                <p className="text-lg font-black">
                  <span className="mr-2 text-white/45 line-through">Rp. 150.000</span>
                  Gratis biaya pendaftaran
                </p>
              </div>
              <p className="text-sm font-semibold text-white/70">Biaya daftar ulang hanya Rp. 500.000. Sisa biaya dapat dicicil.</p>
            </div>
          </div>
        </section>

        {brochureImages.length > 0 && (
          <SpmbBrochureFlipbook images={brochureImages} academicYear={academicYear} />
        )}

        <section className="bg-zinc-50 py-20">
          <div className="container-page">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-rosebrand-50 px-4 py-2 text-sm font-extrabold uppercase text-rosebrand-700">
                  <BadgeCheck size={17} aria-hidden />
                  Kenapa SMK Telkom Lampung
                </p>
                <h2 className="mt-5 text-4xl font-black tracking-normal text-zinc-950 md:text-5xl">
                  Bukan sekadar sekolah. Ini jalur masuk ke ekosistem digital.
                </h2>
                <p className="mt-5 text-lg font-semibold leading-8 text-zinc-600">
                  Kami merancang pengalaman belajar yang langsung dekat dengan kebutuhan industri: proyek nyata, portofolio, karakter kerja, dan lingkungan yang mendorong siswa berani tampil.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  "Belajar teknologi dengan arah karier yang jelas.",
                  "Jurusan relevan untuk dunia kerja dan bisnis digital.",
                  "Lingkungan sekolah yang disiplin, kreatif, dan suportif.",
                  "Pendaftaran awal memberi peluang lebih cepat mengamankan pilihan jurusan."
                ].map((item) => (
                  <div key={item} className="rounded-[8px] border border-zinc-200 bg-white p-5 shadow-sm">
                    <CheckCircle2 className="text-rosebrand-600" size={22} aria-hidden />
                    <p className="mt-4 text-sm font-bold leading-6 text-zinc-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container-page">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-extrabold uppercase text-rosebrand-600">Pilihan jurusan</p>
                <h2 className="mt-2 text-4xl font-black tracking-normal text-zinc-950">Pilih bidang yang akan kamu menangkan.</h2>
              </div>
              <Link href="/spmb/pendaftaran" className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-zinc-950 px-5 text-sm font-extrabold text-white hover:bg-rosebrand-600">
                Mulai Daftar
                <ChevronRight size={17} aria-hidden />
              </Link>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {majors.map((major) => (
                <div key={major.id} className="rounded-[8px] border border-zinc-200 bg-white p-6 shadow-sm">
                  <div className="grid h-12 w-12 place-items-center rounded-[8px] bg-rosebrand-50 text-rosebrand-600">
                    <GraduationCap size={24} aria-hidden />
                  </div>
                  <h3 className="mt-5 text-xl font-black text-zinc-950">{major.name}</h3>
                  <p className="mt-3 line-clamp-3 text-sm font-semibold leading-6 text-zinc-500">{major.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer profile={profile} />
    </>
  );
}
