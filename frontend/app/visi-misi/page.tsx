import { Metadata } from "next";
import { getSchoolProfile } from "@/lib/api";
import { GraduationCap, Target, ChevronRight } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Visi & Misi - SMK Telkom Lampung",
  description: "Visi dan Misi SMK Telkom Lampung",
};

export default async function VisiMisiPage() {
  const profile = await getSchoolProfile().catch(() => null);
  const missionItems = parseMissionItems(profile?.mission || "");

  return (
    <>
      <Header logoUrl={profile?.headerLogo} />
      <main className="min-h-screen bg-zinc-50 pt-28 pb-20">
        <div className="mx-auto max-w-5xl px-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-500 mb-10">
            <a href="/" className="hover:text-rosebrand-600 transition-colors">Beranda</a>
            <ChevronRight size={14} />
            <span className="text-zinc-900">Visi & Misi</span>
          </div>
          <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-zinc-900 mb-4 tracking-tight">
            Visi & Misi
          </h1>
          <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
            Menjadi lembaga pendidikan terdepan yang mencetak generasi unggul, berkarakter, dan siap bersaing di era digital.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          {/* Visi */}
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl shadow-rosebrand-500/5 relative overflow-hidden group border border-zinc-100 h-full">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition duration-500">
              <Target size={120} />
            </div>
            <div className="relative z-10 flex h-full flex-col">
              <div className="h-16 w-16 bg-rosebrand-100 text-rosebrand-600 rounded-2xl grid place-items-center mb-8">
                <Target size={32} />
              </div>
              <h2 className="text-3xl font-black text-zinc-900 mb-6">Visi Kami</h2>
              {profile?.vision ? (
                <div 
                  className="prose prose-lg prose-zinc max-w-none max-h-80 overflow-y-auto pr-3 text-zinc-600 leading-relaxed font-medium"
                  dangerouslySetInnerHTML={{ __html: profile.vision }}
                />
              ) : (
                <p className="text-lg text-zinc-600 leading-relaxed font-medium italic">
                  Belum ada data visi sekolah.
                </p>
              )}
            </div>
          </div>

          {/* Misi */}
          <div className="bg-gradient-to-br from-rosebrand-600 to-rosebrand-800 rounded-3xl p-8 md:p-12 shadow-xl shadow-rosebrand-900/10 relative overflow-hidden group h-full">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition duration-500 text-white">
              <GraduationCap size={120} />
            </div>
            <div className="relative z-10 flex h-full flex-col">
              <div className="h-16 w-16 bg-white/10 text-white rounded-2xl grid place-items-center mb-8 backdrop-blur-sm">
                <GraduationCap size={32} />
              </div>
              <h2 className="text-3xl font-black text-white mb-6">Misi Kami</h2>
              {missionItems.length > 0 ? (
                <ol className="grid max-h-80 gap-4 overflow-y-auto pr-3">
                  {missionItems.map((item, index) => (
                    <li key={`${item}-${index}`} className="grid grid-cols-[38px_1fr] gap-4">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-sm font-black text-white ring-1 ring-white/15">
                        {index + 1}
                      </span>
                      <span className="pt-1 text-base font-semibold leading-7 text-white/90">{item}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-lg text-white/90 leading-relaxed font-medium italic">
                  Belum ada data misi sekolah.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
    <Footer profile={profile} />
    </>
  );
}

function parseMissionItems(value: string): string[] {
  const source = value || "";
  const listMatches = Array.from(source.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi))
    .map((match) => stripHtml(match[1]))
    .filter(Boolean);

  if (listMatches.length > 0) {
    return listMatches;
  }

  return stripHtml(source)
    .split(/\n+|(?:^|\s)\d+[.)]\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function stripHtml(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
}
