"use client";

import Link from "next/link";
import Image from "next/image";
import { 
  Facebook, Instagram, Mail, MapPin, Youtube, Globe, Twitter, Linkedin, Phone, 
  ArrowUp, ChevronRight, GraduationCap, ExternalLink, Sparkles
} from "lucide-react";
import type { SchoolProfile } from "@/types/content";
import { normalizeImageUrl } from "@/lib/image-url";

function getSocialBrandStyle(label: string) {
  const normalized = label.toLowerCase();
  if (normalized.includes("instagram") || normalized.includes("ig")) {
    return "hover:bg-gradient-to-tr hover:from-amber-500 hover:via-rose-500 hover:to-purple-600 hover:text-white hover:shadow-rose-500/20";
  }
  if (normalized.includes("facebook") || normalized.includes("fb")) {
    return "hover:bg-blue-600 hover:text-white hover:shadow-blue-600/20";
  }
  if (normalized.includes("youtube") || normalized.includes("yt")) {
    return "hover:bg-red-600 hover:text-white hover:shadow-red-600/20";
  }
  if (normalized.includes("twitter") || normalized.includes("x")) {
    return "hover:bg-sky-500 hover:text-white hover:shadow-sky-500/20";
  }
  if (normalized.includes("linkedin")) {
    return "hover:bg-blue-700 hover:text-white hover:shadow-blue-700/20";
  }
  return "hover:bg-rosebrand-500 hover:text-white hover:shadow-rosebrand-500/20";
}

function getIconForLabel(label: string) {
  const normalized = label.toLowerCase();
  if (normalized.includes("instagram") || normalized.includes("ig")) return Instagram;
  if (normalized.includes("facebook") || normalized.includes("fb")) return Facebook;
  if (normalized.includes("youtube") || normalized.includes("yt")) return Youtube;
  if (normalized.includes("twitter") || normalized.includes("x")) return Twitter;
  if (normalized.includes("linkedin")) return Linkedin;
  if (normalized.includes("email") || normalized.includes("mail")) return Mail;
  return Globe;
}

export function Footer({ profile }: { profile?: SchoolProfile | null }) {
  const p = profile || ({} as SchoolProfile);
  const socialMedia = p.socialMedia || [];
  const partnerLinks = p.partnerLinks || [];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navLinks = [
    { label: "Beranda", href: "/" },
    { label: "Profil Sekolah", href: "/profil" },
    { label: "Visi & Misi", href: "/visi-misi" },
    { label: "Program Keahlian", href: "/jurusan" },
    { label: "Direktori Pegawai", href: "/employee" },
    { label: "Berita & Artikel", href: "/artikel" },
    { label: "Modul Ajar", href: "/modul-ajar" },
  ];

  const programLinks = [
    { label: "Pendaftaran SPMB", href: "/spmb" },
    { label: "Prestasi Siswa", href: "/prestasi" },
    { label: "Hubungan Industri", href: "/hubungan-industri" },
    { label: "Tracer Alumni", href: "/alumni" },
    { label: "Struktur Organisasi", href: "/struktur-organisasi" },
    { label: "Pusat Bantuan", href: "/bantuan" },
  ];

  return (
    <footer className="relative bg-zinc-950 text-zinc-300 overflow-hidden font-sans border-t border-zinc-800/80">
      {/* Top Accent Gradient Ribbon */}
      <div className="relative h-1.5 w-full overflow-hidden">
        <div className="absolute inset-0 animate-running-light shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
      </div>

      {/* Ambient Radial Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-rosebrand-600/5 blur-[120px] pointer-events-none rounded-full" />

      <div className="container-page relative pt-16 pb-12 z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12 border-b border-zinc-800/80">
          
          {/* Column 1: School Identity & Contacts (Cols 1-4) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center gap-4">
              {p.footerLogo ? (
                <div className="relative h-14 w-14 shrink-0 rounded-xl bg-white/5 p-1.5 border border-white/10 shadow-inner">
                  <Image 
                    src={normalizeImageUrl(p.footerLogo)} 
                    alt="Logo Sekolah" 
                    fill 
                    sizes="56px" 
                    className="object-contain" 
                  />
                </div>
              ) : (
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-rosebrand-500 to-rosebrand-700 flex items-center justify-center text-white shadow-lg shadow-rosebrand-500/20">
                  <GraduationCap size={24} />
                </div>
              )}
              <div>
                <h2 className="text-xl font-black tracking-tight text-white">
                  {p.name || "SMK Telkom Lampung"}
                </h2>
                {p.tagline && (
                  <p className="text-xs font-semibold text-rosebrand-400 mt-0.5 tracking-wide">
                    {p.tagline}
                  </p>
                )}
              </div>
            </div>

            {p.footerText && (
              <p className="text-sm leading-relaxed text-zinc-400/90 whitespace-pre-wrap max-w-sm">
                {p.footerText}
              </p>
            )}

            {/* Contact Badges */}
            <div className="space-y-3 pt-2 text-sm">
              {p.address && (
                <div className="flex items-start gap-3 text-zinc-400 group">
                  <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-rosebrand-400 group-hover:border-rosebrand-500/40 transition-colors shrink-0 mt-0.5">
                    <MapPin size={16} />
                  </div>
                  <span className="leading-snug text-xs sm:text-sm text-zinc-300">{p.address}</span>
                </div>
              )}
              {p.phone && (
                <div className="flex items-center gap-3 text-zinc-400 group">
                  <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-rosebrand-400 group-hover:border-rosebrand-500/40 transition-colors shrink-0">
                    <Phone size={16} />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-zinc-300">{p.phone}</span>
                </div>
              )}
              {p.email && (
                <div className="flex items-center gap-3 text-zinc-400 group">
                  <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-rosebrand-400 group-hover:border-rosebrand-500/40 transition-colors shrink-0">
                    <Mail size={16} />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-zinc-300">{p.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Quick Links (Cols 5-7) */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-rosebrand-400 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rosebrand-500 inline-block" />
              Navigasi Sekolah
            </h3>
            <ul className="space-y-2.5 text-sm">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="group inline-flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors duration-200"
                  >
                    <ChevronRight size={14} className="text-zinc-600 group-hover:text-rosebrand-400 group-hover:translate-x-0.5 transition-transform" />
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Programs & Partners (Cols 8-9) */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-rosebrand-400 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rosebrand-500 inline-block" />
              Program & Portal
            </h3>
            <ul className="space-y-2.5 text-sm">
              {programLinks.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="group inline-flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors duration-200"
                  >
                    <ChevronRight size={14} className="text-zinc-600 group-hover:text-rosebrand-400 group-hover:translate-x-0.5 transition-transform" />
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Dynamic Partner Links */}
            {partnerLinks.length > 0 && (
              <div className="pt-4 border-t border-zinc-900 space-y-2">
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500">Link Partner</h4>
                <div className="space-y-1.5">
                  {partnerLinks.map((item) => (
                    <Link
                      key={item.label}
                      href={item.value}
                      target="_blank"
                      className="group flex items-center justify-between text-xs text-zinc-400 hover:text-rosebrand-400 transition-colors"
                    >
                      <span className="truncate">{item.label}</span>
                      <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Column 4: Social Media & SPMB Highlight (Cols 10-12) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Social Media Section */}
            {socialMedia.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-rosebrand-400 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-rosebrand-500 inline-block" />
                  Media Sosial
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {socialMedia.map((item) => {
                    const IconComponent = getIconForLabel(item.label);
                    const brandStyle = getSocialBrandStyle(item.label);
                    return (
                      <Link
                        key={item.label}
                        href={item.value}
                        aria-label={item.label}
                        target={item.value.startsWith("http") ? "_blank" : undefined}
                        title={item.label}
                        className={`h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800/90 text-zinc-400 flex items-center justify-center transition-all duration-300 hover:-translate-y-1 shadow-md ${brandStyle}`}
                      >
                        <IconComponent size={18} aria-hidden />
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SPMB Admissions Banner Card */}
            <div className="relative rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-900/90 p-5 border border-zinc-800 shadow-xl overflow-hidden group hover:border-rosebrand-500/50 transition-all duration-300">
              <div className="absolute top-0 right-0 -mt-2 -mr-2 w-20 h-20 bg-rosebrand-500/10 rounded-full blur-xl group-hover:bg-rosebrand-500/20 transition-all" />
              
              <div className="flex items-center gap-2 text-rosebrand-400 font-extrabold text-xs uppercase tracking-wider mb-2">
                <Sparkles size={14} className="animate-pulse" />
                <span>Penerimaan Siswa Baru</span>
              </div>
              
              <h4 className="text-base font-black text-white leading-snug">
                Bergabung dengan SMK Telkom
              </h4>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Siapkan masa depan digital Anda bersama sekolah kejuruan berstandar nasional.
              </p>
              
              <Link
                href="/spmb"
                className="mt-4 inline-flex items-center justify-center w-full gap-2 rounded-xl bg-gradient-to-r from-rosebrand-600 to-rosebrand-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-rosebrand-600/25 transition-all hover:shadow-rosebrand-600/40 hover:-translate-y-0.5 active:translate-y-0"
              >
                <GraduationCap size={16} />
                Daftar SPMB Sekarang
              </Link>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Back to Top */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} <span className="font-bold text-zinc-400">{p.name || "SMK Telkom Lampung"}</span>. Seluruh hak cipta dilindungi.</p>
          
          <button
            onClick={scrollToTop}
            className="group inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-bold text-zinc-400 border border-zinc-800 transition-all hover:bg-zinc-800 hover:text-white hover:border-zinc-700 active:scale-95 shadow-sm"
          >
            <span>Kembali ke Atas</span>
            <ArrowUp size={14} className="group-hover:-translate-y-0.5 transition-transform text-rosebrand-400" />
          </button>
        </div>
      </div>
    </footer>
  );
}
