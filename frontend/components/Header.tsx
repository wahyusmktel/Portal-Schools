"use client";

import Link from "next/link";
import { GraduationCap, LayoutDashboard, ChevronDown, Newspaper, Calendar, Megaphone, Search } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type HeaderProps = {
  logoUrl?: string;
};

const mainNavItems = [
  { href: "/", label: "Beranda" },
  { href: "/#profil", label: "Profil Sekolah" },
  { href: "/#jurusan", label: "Program Keahlian" },
  { href: "/employee", label: "Guru & Pegawai" }
];

export function Header({ logoUrl }: HeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 px-4 md:px-8 ${isScrolled ? 'pt-4' : 'pt-6'}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-full bg-white/95 backdrop-blur-xl px-6 py-3 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-zinc-100">
        
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-3 shrink-0">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Logo" className="h-10 w-auto object-contain" />
          ) : (
            <>
              <span className="grid h-10 w-10 place-items-center rounded-full bg-rosebrand-500 text-white">
                <GraduationCap size={22} aria-hidden />
              </span>
              <span className="leading-tight text-zinc-900 hidden sm:block">
                <span className="block text-sm font-extrabold">SMK Telkom</span>
                <span className="block text-xs font-semibold text-zinc-500">Lampung</span>
              </span>
            </>
          )}
        </Link>

        {/* NAVIGATION */}
        <nav className="hidden lg:flex items-center gap-1 text-sm font-bold text-zinc-600">
          {mainNavItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href} 
              className="px-4 py-2.5 rounded-full transition-colors hover:bg-zinc-50 hover:text-rosebrand-600"
            >
              {item.label}
            </Link>
          ))}

          {/* DROPDOWN PUBLIKASI */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full transition-all ${
                isDropdownOpen ? 'bg-rosebrand-50 text-rosebrand-600' : 'hover:bg-zinc-50 hover:text-rosebrand-600'
              }`}
            >
              Publikasi
              <ChevronDown 
                size={16} 
                className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-rosebrand-600' : 'text-zinc-400'}`} 
              />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full right-0 mt-3 w-[340px] rounded-3xl bg-white p-3 shadow-[0_20px_40px_rgb(0,0,0,0.1)] border border-zinc-100"
                >
                  <div className="grid gap-1">
                    <Link href="/artikel" onClick={() => setIsDropdownOpen(false)} className="group flex items-start gap-4 rounded-2xl p-3 transition-colors hover:bg-rosebrand-50">
                      <div className="mt-0.5 rounded-full bg-white p-2 shadow-sm group-hover:text-rosebrand-600 text-rosebrand-500">
                        <Newspaper size={20} />
                      </div>
                      <div>
                        <span className="block text-sm font-black text-zinc-900 group-hover:text-rosebrand-700">Artikel Utama</span>
                        <span className="mt-0.5 block text-xs font-semibold text-zinc-500">Artikel edukasi, prestasi, dan inovasi pendidikan</span>
                      </div>
                    </Link>

                    <Link href="/#agenda" onClick={() => setIsDropdownOpen(false)} className="group flex items-start gap-4 rounded-2xl p-3 transition-colors hover:bg-rosebrand-50">
                      <div className="mt-0.5 rounded-full bg-white p-2 shadow-sm group-hover:text-rosebrand-600 text-rosebrand-500">
                        <Calendar size={20} />
                      </div>
                      <div>
                        <span className="block text-sm font-black text-zinc-900 group-hover:text-rosebrand-700">Agenda Sekolah</span>
                        <span className="mt-0.5 block text-xs font-semibold text-zinc-500">Jadwal kegiatan akademik dan non-akademik</span>
                      </div>
                    </Link>

                    <Link href="/#pengumuman" onClick={() => setIsDropdownOpen(false)} className="group flex items-start gap-4 rounded-2xl p-3 transition-colors hover:bg-rosebrand-50">
                      <div className="mt-0.5 rounded-full bg-white p-2 shadow-sm group-hover:text-rosebrand-600 text-rosebrand-500">
                        <Megaphone size={20} />
                      </div>
                      <div>
                        <span className="block text-sm font-black text-zinc-900 group-hover:text-rosebrand-700">Pengumuman</span>
                        <span className="mt-0.5 block text-xs font-semibold text-zinc-500">Informasi resmi terbaru dari pihak sekolah</span>
                      </div>
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* RIGHT SIDE ACTIONS */}
        <div className="flex items-center gap-3">
          <button className="hidden sm:grid h-10 w-10 place-items-center rounded-full bg-zinc-50 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900">
            <Search size={18} />
          </button>
          <Link
            href="/dashboard/login"
            className="flex h-10 items-center gap-2 rounded-full bg-rosebrand-500 px-5 text-sm font-bold text-white transition hover:bg-rosebrand-600 shadow-md hover:shadow-lg"
          >
            <LayoutDashboard size={16} aria-hidden />
            <span className="hidden sm:block">Dashboard</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
