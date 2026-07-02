import { Metadata } from "next";
import { getIndustryPartners, getSchoolProfile } from "@/lib/api";
import { Building2, Globe, ChevronRight } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import Image from "next/image";
import { normalizeImageUrl } from "@/lib/image-url";

export const metadata: Metadata = {
  title: "Hubungan Industri - SMK Telkom Lampung",
  description: "Mitra industri dan dunia kerja SMK Telkom Lampung",
};

export default async function HubunganIndustriPage() {
  const profile = await getSchoolProfile().catch(() => null);
  const partners = (await getIndustryPartners().catch(() => null)) || [];

  return (
    <>
      <Header logoUrl={profile?.headerLogo} />
      <main className="min-h-screen bg-zinc-50 pt-28 pb-20">
        <div className="mx-auto max-w-7xl px-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-500 mb-10">
            <a href="/" className="hover:text-rosebrand-600 transition-colors">Beranda</a>
            <ChevronRight size={14} />
            <span className="text-zinc-900">Hubungan Industri</span>
          </div>
          <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-rosebrand-100 text-rosebrand-600 mb-6">
            <Building2 size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-zinc-900 mb-4 tracking-tight">
            Mitra Industri & Dunia Kerja
          </h1>
          <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
            SMK Telkom Lampung bekerja sama dengan berbagai perusahaan terkemuka untuk memastikan kurikulum kami selalu selaras dengan kebutuhan industri dan memberikan peluang emas bagi lulusan.
          </p>
        </div>

        {partners.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-zinc-100">
            <Globe className="mx-auto h-12 w-12 text-zinc-300 mb-4" />
            <h3 className="text-xl font-bold text-zinc-900 mb-2">Belum ada data mitra industri</h3>
            <p className="text-zinc-500">Data kerjasama sedang diperbarui.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {partners.map((partner) => (
              <a 
                key={partner.id} 
                href={partner.websiteUrl || "#"} 
                target={partner.websiteUrl ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="group bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center"
              >
                <div className="w-32 h-32 mb-6 rounded-2xl bg-zinc-50 p-4 flex items-center justify-center border border-zinc-100 group-hover:border-rosebrand-200 transition-colors">
                  {partner.logoUrl ? (
                    <Image
                      src={normalizeImageUrl(partner.logoUrl)}
                      alt={partner.name}
                      width={128}
                      height={128}
                      className="max-h-full max-w-full object-contain grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
                    />
                  ) : (
                    <Building2 className="w-12 h-12 text-zinc-300 group-hover:text-rosebrand-300 transition-colors" />
                  )}
                </div>
                <h3 className="font-bold text-lg text-zinc-900 mb-1 group-hover:text-rosebrand-600 transition-colors">
                  {partner.name}
                </h3>
                <p className="text-xs font-bold text-rosebrand-500 uppercase tracking-wide mb-3">
                  {partner.fieldOfIndustry || "Industri"}
                </p>
                <p className="text-sm text-zinc-500 line-clamp-3">
                  {partner.description}
                </p>
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
    <Footer profile={profile} />
    </>
  );
}
