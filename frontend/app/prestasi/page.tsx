import { Metadata } from "next";
import { getAchievements, getSchoolProfile } from "@/lib/api";
import { Award, Trophy, Star, ChevronRight } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Prestasi - SMK Telkom Lampung",
  description: "Daftar prestasi dan penghargaan siswa-siswi SMK Telkom Lampung",
};

export default async function PrestasiPage() {
  const profile = await getSchoolProfile().catch(() => null);
  const achievements = (await getAchievements().catch(() => null)) || [];

  return (
    <>
      <Header logoUrl={profile?.headerLogo} />
      <main className="min-h-screen bg-zinc-50 pt-28 pb-20">
        <div className="mx-auto max-w-7xl px-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-500 mb-10">
            <a href="/" className="hover:text-rosebrand-600 transition-colors">Beranda</a>
            <ChevronRight size={14} />
            <span className="text-zinc-900">Prestasi</span>
          </div>
          <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-rosebrand-100 text-rosebrand-600 mb-6">
            <Trophy size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-zinc-900 mb-4 tracking-tight">
            Prestasi Siswa
          </h1>
          <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
            Kebanggaan kami atas dedikasi dan kerja keras siswa-siswi SMK Telkom Lampung dalam mengharumkan nama sekolah di berbagai tingkat kompetisi.
          </p>
        </div>

        {achievements.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-zinc-100">
            <Star className="mx-auto h-12 w-12 text-zinc-300 mb-4" />
            <h3 className="text-xl font-bold text-zinc-900 mb-2">Belum ada data prestasi</h3>
            <p className="text-zinc-500">Data prestasi sedang dalam proses pembaruan.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {achievements.map((item) => (
              <div key={item.id} className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-zinc-100 flex flex-col">
                <div className="relative h-64 overflow-hidden bg-zinc-100">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-400">
                      <Trophy size={48} />
                    </div>
                  )}
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-rosebrand-700 flex items-center gap-1.5 shadow-sm">
                    <Award size={14} />
                    {item.achievementLevel}
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="text-xs font-semibold text-zinc-500 mb-3 flex items-center gap-2">
                    <span>{new Date(item.achievedAt).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}</span>
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 mb-2 line-clamp-2 group-hover:text-rosebrand-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-zinc-600 mb-4 flex-1 line-clamp-3">
                    {item.description}
                  </p>
                  <div className="pt-4 border-t border-zinc-100">
                    <p className="text-sm font-semibold text-zinc-900">
                      Peraih: <span className="text-rosebrand-600">{item.studentName}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
    <Footer profile={profile} />
    </>
  );
}
