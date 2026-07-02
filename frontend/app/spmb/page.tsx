import { Metadata } from "next";
import { getSchoolProfile } from "@/lib/api";
import Flipbook from "@/components/Flipbook";
import { BookOpen, ChevronRight } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Brosur SPMB - SMK Telkom Lampung",
  description: "Informasi Pendaftaran Siswa Baru (SPMB)",
};

export default async function SPMBPage() {
  const profile = await getSchoolProfile().catch(() => null);
  
  // Jika spmbBrochureUrl ada dan berisi koma, pisahkan menjadi array
  // Jika tidak ada, gunakan array default (bisa diisi URL gambar placeholder nanti)
  const brochurePages = profile?.spmbBrochureUrl 
    ? profile.spmbBrochureUrl.split(",").map(url => url.trim())
    : [
        "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1000&q=80"
      ];

  return (
    <>
      <Header logoUrl={profile?.headerLogo} />
      <main className="min-h-screen bg-zinc-50 pt-28 pb-20 overflow-hidden">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-500 mb-10">
            <a href="/" className="hover:text-rosebrand-600 transition-colors">Beranda</a>
            <ChevronRight size={14} />
            <span className="text-zinc-900">Brosur SPMB</span>
          </div>
          <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-rosebrand-100 text-rosebrand-600 mb-6">
            <BookOpen size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-zinc-900 mb-4 tracking-tight">
            Brosur Penerimaan Siswa Baru
          </h1>
          <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
            Mari bergabung bersama SMK Telkom Lampung. Buka brosur interaktif di bawah ini untuk melihat detail informasi pendaftaran, fasilitas, dan program keahlian.
          </p>
        </div>

        <div className="bg-white p-6 md:p-12 rounded-[2rem] shadow-xl shadow-zinc-200/50 border border-zinc-100">
          <Flipbook pages={brochurePages} />
        </div>
      </div>
    </main>
    <Footer profile={profile} />
    </>
  );
}
