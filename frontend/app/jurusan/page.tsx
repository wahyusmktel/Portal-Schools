import { getMajors, getSchoolProfile } from "@/lib/api";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BookOpen, Briefcase, GraduationCap, Code2, Server, Radio, Film } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { normalizeImageUrl } from "@/lib/image-url";

export const metadata: Metadata = {
  title: "Program Keahlian (Jurusan)",
  description: "Daftar program keahlian unggulan di SMK Telkom Lampung.",
};

const iconMap: Record<string, React.ReactNode> = {
  Radio: <Radio className="w-8 h-8" />,
  Server: <Server className="w-8 h-8" />,
  Code2: <Code2 className="w-8 h-8" />,
  Film: <Film className="w-8 h-8" />,
};

export default async function MajorsPage() {
  const [profile, majors] = await Promise.all([
    getSchoolProfile().catch(() => null),
    getMajors().catch(() => [])
  ]);

  return (
    <>
      <Header logoUrl={profile?.headerLogo} />
      
      <main className="pt-28 pb-20 overflow-hidden bg-zinc-50 min-h-screen">
        <div className="container-page relative z-10">
          <div className="text-center mb-16">
            <p className="inline-flex items-center gap-2 text-sm font-extrabold uppercase text-rosebrand-600 mb-4 bg-rosebrand-100 px-5 py-2.5 rounded-full shadow-sm">
              <GraduationCap size={18} />
              Program Keahlian Unggulan
            </p>
            <h1 className="text-5xl md:text-7xl font-black text-zinc-900 mb-6 tracking-tight">
              Pilih Masa Depanmu!
            </h1>
            <p className="text-xl text-zinc-600 max-w-2xl mx-auto font-medium">
              Kami menawarkan 4 jurusan berstandar industri dengan kurikulum modern, fasilitas lab berteknologi tinggi, dan prospek karir menjanjikan.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 max-w-7xl mx-auto">
            {majors.map((major, idx) => (
              <div key={major.id} className={`group relative bg-white rounded-[2rem] border border-zinc-100 shadow-xl shadow-zinc-200/40 overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-rosebrand-500/20 ${idx % 2 !== 0 ? 'md:mt-12' : ''}`}>
                
                {/* Cover Image */}
                <div className="h-64 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/90 to-transparent z-10" />
                  <Image src={normalizeImageUrl(major.coverImage)} alt={major.name} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-110" />
                  
                  <div className="absolute bottom-0 left-0 p-8 z-20 w-full">
                    <div className="w-16 h-16 rounded-2xl bg-rosebrand-500 text-white flex items-center justify-center mb-4 shadow-lg transform -rotate-6 group-hover:rotate-0 transition-transform duration-300">
                      {iconMap[major.icon] || <BookOpen className="w-8 h-8" />}
                    </div>
                    <h2 className="text-3xl font-black text-white">{major.name}</h2>
                  </div>
                </div>

                {/* Content Bento Grid */}
                <div className="p-8 grid gap-6 bg-white relative z-20">
                  <p className="text-zinc-600 text-lg font-medium leading-relaxed">
                    {major.summary}
                  </p>

                  <div className="grid sm:grid-cols-2 gap-4 mt-2">
                    <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100 group-hover:border-rosebrand-100 transition-colors">
                      <div className="flex items-center gap-2 mb-3 text-zinc-800 font-bold">
                        <BookOpen className="w-5 h-5 text-rosebrand-500" />
                        Fokus Pembelajaran
                      </div>
                      <ul className="space-y-2 text-sm text-zinc-600">
                        {major.curriculum?.map((c, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-rosebrand-400 mt-1.5 shrink-0" />
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-rosebrand-50/50 rounded-2xl p-5 border border-rosebrand-100 group-hover:bg-rosebrand-50 transition-colors">
                      <div className="flex items-center gap-2 mb-3 text-zinc-800 font-bold">
                        <Briefcase className="w-5 h-5 text-rosebrand-500" />
                        Prospek Karir
                      </div>
                      <ul className="space-y-2 text-sm text-zinc-600">
                        {major.careerProspects?.map((c, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-rosebrand-400 mt-1.5 shrink-0" />
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer profile={profile} />
    </>
  );
}
