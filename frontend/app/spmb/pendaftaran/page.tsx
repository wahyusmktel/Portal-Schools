import { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Sparkles, ShieldCheck } from "lucide-react";
import { getMajors, getSchoolProfile } from "@/lib/api";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SpmbRegistrationForm } from "@/components/SpmbRegistrationForm";

export const metadata: Metadata = {
  title: "Pendaftaran Murid Baru (SPMB)",
  description: "Formulir pendaftaran resmi calon murid baru SMK Telkom Lampung.",
};

export default async function SpmbRegistrationPage() {
  const [profile, majors] = await Promise.all([
    getSchoolProfile().catch(() => null),
    getMajors().catch(() => [])
  ]);
  const academicYear = profile?.spmbAcademicYear || "2026/2027";

  return (
    <>
      <Header logoUrl={profile?.headerLogo} />
      <main className="min-h-screen bg-zinc-50 pt-28 pb-24">
        <div className="container-page max-w-5xl">
          {/* Breadcrumbs */}
          <div className="mb-6 flex items-center gap-2 text-xs sm:text-sm font-semibold text-zinc-500">
            <Link href="/" className="hover:text-rosebrand-600 transition-colors">Beranda</Link>
            <ChevronRight size={14} aria-hidden />
            <Link href="/spmb" className="hover:text-rosebrand-600 transition-colors">SPMB</Link>
            <ChevronRight size={14} aria-hidden />
            <span className="text-zinc-900 font-bold">Formulir Pendaftaran</span>
          </div>

          {/* Hero Welcome Banner */}
          <section className="mb-8 overflow-hidden rounded-[16px] bg-gradient-to-br from-zinc-950 via-zinc-900 to-rosebrand-950 p-6 sm:p-8 text-white shadow-xl">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black text-rosebrand-300 backdrop-blur-sm">
                  <Sparkles size={14} />
                  <span>Sistem SPMB Online Terpadu</span>
                </div>
                <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-4xl">
                  Satu Formulir, Selangkah Lebih Dekat Menuju Masa Depanmu.
                </h1>
                <p className="mt-2 text-xs sm:text-sm font-medium leading-relaxed text-zinc-300">
                  Isi data calon siswa secara bertahap. Sistem kami otomatis menyimpan data di perangkat Anda, sehingga Anda tidak perlu khawatir jika halaman ter-refresh saat pengisian.
                </p>
              </div>

              <div className="shrink-0 rounded-[12px] border border-white/10 bg-white/10 p-4 sm:p-5 backdrop-blur-md text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-wider text-rosebrand-300">
                  <ShieldCheck size={16} />
                  Tahun Ajaran
                </div>
                <p className="mt-1 text-2xl sm:text-3xl font-black text-white">{academicYear}</p>
                <span className="mt-1 inline-block rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-black text-emerald-300">
                  Pendaftaran Terbuka
                </span>
              </div>
            </div>
          </section>

          {/* Main Registration & Services Component */}
          <SpmbRegistrationForm majors={majors} academicYear={academicYear} />
        </div>
      </main>
      <Footer profile={profile} />
    </>
  );
}
