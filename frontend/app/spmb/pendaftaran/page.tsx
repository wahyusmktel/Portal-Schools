import { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { getMajors, getSchoolProfile } from "@/lib/api";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SpmbRegistrationForm } from "@/components/SpmbRegistrationForm";

export const metadata: Metadata = {
  title: "Formulir Pendaftaran SPMB",
  description: "Formulir pendaftaran calon murid baru SMK Telkom Lampung.",
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
      <main className="min-h-screen bg-zinc-50 pt-28 pb-20">
        <div className="container-page">
          <div className="mb-10 flex items-center gap-2 text-sm font-semibold text-zinc-500">
            <Link href="/" className="hover:text-rosebrand-600">Beranda</Link>
            <ChevronRight size={14} aria-hidden />
            <Link href="/spmb" className="hover:text-rosebrand-600">SPMB</Link>
            <ChevronRight size={14} aria-hidden />
            <span className="text-zinc-900">Pendaftaran</span>
          </div>

          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <aside className="rounded-[8px] bg-zinc-950 p-7 text-white">
              <div className="grid h-12 w-12 place-items-center rounded-[8px] bg-white/10 text-rosebrand-300">
                <ShieldCheck size={25} aria-hidden />
              </div>
              <h1 className="mt-6 text-4xl font-black tracking-normal">Satu formulir. Satu langkah lebih dekat.</h1>
              <p className="mt-4 text-sm font-semibold leading-6 text-white/65">
                Setelah submit, simpan kartu pendaftaran dan datang ke sekolah untuk daftar ulang. Biaya pendaftaran hari ini gratis.
              </p>
              <div className="mt-6 rounded-[8px] border border-white/10 bg-white/10 p-4">
                <p className="text-xs font-extrabold uppercase text-white/50">Tahun ajaran</p>
                <p className="mt-1 text-2xl font-black">{academicYear}</p>
              </div>
            </aside>

            <SpmbRegistrationForm majors={majors} academicYear={academicYear} />
          </div>
        </div>
      </main>
      <Footer profile={profile} />
    </>
  );
}
