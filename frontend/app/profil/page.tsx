import { getSchoolProfile } from "@/lib/api";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { School, MapPin, Phone, Mail, GraduationCap } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profil Sekolah",
  description: "Profil lengkap, visi misi, dan informasi pimpinan sekolah",
};

export default async function ProfilePage() {
  const profile = await getSchoolProfile();

  return (
    <>
      <Header logoUrl={profile.headerLogo} />
      
      <main className="pt-28 pb-20">
        <div className="container-page">
          <div className="text-center mb-12">
            <p className="inline-flex items-center gap-2 text-sm font-extrabold uppercase text-rosebrand-600 mb-4 bg-rosebrand-50 px-4 py-2 rounded-full">
              <School size={16} />
              Tentang Kami
            </p>
            <h1 className="text-4xl md:text-6xl font-black text-zinc-900 mb-6">
              Profil {profile.name}
            </h1>
            <p className="text-lg text-zinc-600 max-w-3xl mx-auto">
              {profile.tagline}
            </p>
          </div>

          {/* YOUTUBE EMBED */}
          {profile.youtubeEmbedUrl && (
            <div className="w-full max-w-5xl mx-auto mb-20 rounded-3xl overflow-hidden shadow-2xl border border-zinc-100 bg-zinc-900 aspect-video relative group">
              <iframe 
                src={profile.youtubeEmbedUrl}
                title="Video Profil Sekolah"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-12 max-w-6xl mx-auto">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-3xl p-8 border border-zinc-100 shadow-sm">
                <h2 className="text-2xl font-black mb-4">Sejarah & Deskripsi</h2>
                <div className="prose prose-lg prose-zinc max-w-none text-zinc-600">
                  {profile.description.split('\n').map((paragraph, idx) => (
                    <p key={idx} className="mb-4">{paragraph}</p>
                  ))}
                </div>
              </div>

              {profile.principalName && (
                <div className="bg-rosebrand-50 rounded-3xl p-8 border border-rosebrand-100 flex flex-col sm:flex-row gap-8 items-center sm:items-start">
                  <div className="w-32 h-32 shrink-0 rounded-full overflow-hidden border-4 border-white shadow-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={profile.principalImage || "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400&auto=format&fit=crop"} alt={profile.principalName} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-zinc-900">{profile.principalName}</h2>
                    <p className="text-sm font-bold text-rosebrand-600 mb-4">{profile.principalTitle || "Kepala Sekolah"}</p>
                    <p className="text-zinc-700 italic">"{profile.principalMessage}"</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm">
                <h3 className="font-black text-lg mb-4 flex items-center gap-2">
                  <GraduationCap className="text-rosebrand-600" /> Statistik
                </h3>
                <div className="grid gap-4">
                  {(profile.stats || []).map((stat, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                      <span className="font-semibold text-zinc-600">{stat.label}</span>
                      <span className="font-black text-xl text-zinc-900">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm">
                <h3 className="font-black text-lg mb-4">Kontak & Lokasi</h3>
                <div className="space-y-4 text-sm text-zinc-600">
                  <div className="flex items-start gap-3">
                    <MapPin className="shrink-0 text-rosebrand-600 w-5 h-5" />
                    <span>{profile.address}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="shrink-0 text-rosebrand-600 w-5 h-5" />
                    <span>{profile.phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="shrink-0 text-rosebrand-600 w-5 h-5" />
                    <span>{profile.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer profile={profile} />
    </>
  );
}
