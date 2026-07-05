"use client";

import { ArrowLeft, Home, MessageCircle, Search, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const quickLinks = [
  { href: "/profil", label: "Profil Sekolah" },
  { href: "/jurusan", label: "Jurusan" },
  { href: "/spmb", label: "SPMB" },
  { href: "/artikel", label: "Artikel" }
];

export default function NotFoundPage() {
  const router = useRouter();

  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(225,29,79,0.55),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(255,255,255,0.14),transparent_20%),linear-gradient(135deg,#13080b,#3f0b17_48%,#080808)]" />
      <div className="absolute -left-24 top-24 h-72 w-72 rounded-full border border-white/10" />
      <div className="absolute bottom-10 right-[-70px] h-80 w-80 rounded-full border border-rosebrand-500/30" />
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/70 to-transparent" />

      <section className="container-page relative z-10 grid min-h-screen items-center py-12">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <Link href="/" className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-extrabold text-white/80 backdrop-blur transition hover:bg-white hover:text-rosebrand-700">
              <ShieldCheck size={17} aria-hidden />
              SMK Telkom Lampung
            </Link>

            <p className="mt-10 text-sm font-black uppercase tracking-[0.28em] text-rosebrand-100">404 / Halaman tidak ditemukan</p>
            <h1 className="mt-4 max-w-3xl text-5xl font-black leading-none md:text-7xl">
              Jalurnya belum tersedia.
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-white/70">
              Link yang kamu buka mungkin sudah berubah, dipindahkan, atau belum dibuat. Kembali ke halaman utama untuk melanjutkan eksplorasi informasi sekolah.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/" className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-5 text-sm font-black text-rosebrand-700 shadow-soft transition hover:-translate-y-1 hover:bg-rosebrand-50">
                <Home size={18} aria-hidden />
                Kembali ke Beranda
              </Link>
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex h-12 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 text-sm font-black text-white backdrop-blur transition hover:-translate-y-1 hover:bg-white/20"
              >
                <ArrowLeft size={18} aria-hidden />
                Kembali
              </button>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {quickLinks.map((item) => (
                <Link key={item.href} href={item.href} className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-white/70 transition hover:border-white/30 hover:bg-white/15 hover:text-white">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute inset-0 translate-x-5 translate-y-5 rounded-[8px] border border-white/10 bg-white/5" />
            <div className="relative overflow-hidden rounded-[8px] border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-[8px] bg-rosebrand-600 text-white">
                    <Search size={22} aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-black">Pusat Navigasi</p>
                    <p className="text-xs font-semibold text-white/50">Temukan halaman yang benar</p>
                  </div>
                </div>
                <span className="text-5xl font-black text-white/10">404</span>
              </div>

              <div className="mt-6 grid gap-3">
                {quickLinks.map((item, index) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex items-center justify-between rounded-[8px] border border-white/10 bg-white/10 px-4 py-4 transition hover:-translate-y-1 hover:border-white/30 hover:bg-white"
                  >
                    <span>
                      <span className="block text-xs font-black text-rosebrand-200 transition group-hover:text-rosebrand-600">
                        0{index + 1}
                      </span>
                      <span className="mt-1 block font-black text-white transition group-hover:text-zinc-950">{item.label}</span>
                    </span>
                    <Home size={18} className="text-white/45 transition group-hover:text-rosebrand-600" aria-hidden />
                  </Link>
                ))}
              </div>

              <div className="mt-6 rounded-[8px] bg-zinc-950/60 p-4">
                <p className="flex items-center gap-2 text-sm font-black">
                  <MessageCircle size={17} className="text-rosebrand-200" aria-hidden />
                  Butuh bantuan cepat?
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-white/60">
                  Gunakan Sobat Stella di pojok kanan bawah untuk bertanya seputar sekolah.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
