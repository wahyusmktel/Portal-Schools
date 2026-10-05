"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Code2, Cpu, GraduationCap, Network, ShieldCheck, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import type { WhyChooseUsItem } from "@/types/content";

const iconMap = {
  Network,
  Code2,
  Cpu,
  ShieldCheck,
  GraduationCap,
  Sparkles
};

export function WhyChooseUsSection({ items }: { items: WhyChooseUsItem[] }) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState(0);

  const sortedItems = [...items]
    .filter((item) => item.isActive !== false)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
    .slice(0, 6);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"]
  });

  const bgScale = useTransform(scrollYProgress, [0, 0.32, 0.68, 1], [1.1, 1.22, 1.14, 1.28]);
  const bgX = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], ["0%", "-5%", "4%", "-3%"]);
  const bgY = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], ["-2%", "3%", "-4%", "2%"]);
  const bgRotate = useTransform(scrollYProgress, [0, 0.5, 1], ["0deg", "1.6deg", "-1deg"]);
  const bgOpacity = useTransform(scrollYProgress, [0, 0.12, 0.88, 1], [0.38, 0.72, 0.72, 0.48]);
  const circuitProgress = useTransform(scrollYProgress, [0.02, 0.98], [0, 1]);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (sortedItems.length === 0) {
      return;
    }
    setActive(Math.min(sortedItems.length - 1, Math.floor(latest * sortedItems.length)));
  });

  if (sortedItems.length === 0) {
    return null;
  }

  const activeItem = sortedItems[active];
  const ActiveIcon = iconMap[activeItem.icon as keyof typeof iconMap] || Sparkles;
  const navStart = Math.min(Math.max(active - 1, 0), Math.max(sortedItems.length - 3, 0));
  const visibleNavItems = sortedItems.slice(navStart, navStart + 3);

  function scrollToItem(index: number) {
    const target = sectionRef.current;
    if (!target) return;
    const sectionTop = target.getBoundingClientRect().top + window.scrollY;
    const scrollableDistance = target.offsetHeight - window.innerHeight;
    window.scrollTo({
      top: sectionTop + scrollableDistance * (index / sortedItems.length) + 8,
      behavior: "smooth"
    });
  }

  return (
    <section ref={sectionRef} className="relative h-[280vh] lg:h-[320vh] scroll-mt-20 bg-zinc-950 text-white" id="why-smk-telkom">
      {/* ============================================================== */}
      {/* 📱 KHUSUS MOBILE: STICKY BERHENTI DI BAWAH NAVBAR, SCROLL BERGANTI, LAYOUT SESUAI SKETSA */}
      {/* ============================================================== */}
      <div className="block lg:hidden sticky top-[68px] sm:top-[74px] h-[calc(100dvh-68px)] sm:h-[calc(100dvh-74px)] overflow-hidden text-white">
        {/* Background visual & circuit */}
        <div className="absolute inset-0 opacity-40">
          <Image
            src="/images/background.png"
            alt="Latar visual teknologi SMK Telkom Lampung"
            fill
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/95 via-zinc-950/90 to-zinc-950" />
        <CircuitOverlay progress={circuitProgress} />

        {/* Kontainer Flex Setinggi Viewport Mobile */}
        <div className="relative z-10 flex h-full flex-col justify-between p-3.5 sm:p-4">
          
          {/* 1. BAGIAN ATAS: NAVIGASI AKTIF DENGAN KOTAK TRANSPARAN & LOGO TS PUTIH */}
          <div className="shrink-0 mb-1">
            {/* Kotak Transparan sesuai gambar user */}
            <div className="rounded-2xl border border-white/10 bg-zinc-900/85 backdrop-blur-md p-2 sm:p-2.5 flex items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3 min-w-0">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rosebrand-600 shadow-md p-1.5">
                  <Image
                    src="/images/telkom-schools-emblem.png"
                    alt="Telkom Schools"
                    width={28}
                    height={28}
                    className="h-6 w-auto object-contain brightness-0 invert"
                  />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-wider text-white/90 leading-tight">
                    WHY SMK TELKOM LAMPUNG
                  </p>
                  <p className="text-xs sm:text-sm font-black text-white/80 truncate capitalize">
                    {activeItem.highlight || activeItem.title}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 rounded-full bg-white/10 px-3 py-1 text-xs font-black">
                <span className="text-white">{String(active + 1).padStart(2, "0")}</span>
                <span className="text-white/40">/</span>
                <span className="text-white/60">{String(sortedItems.length).padStart(2, "0")}</span>
              </div>
            </div>

            {/* Teks Judul & Deskripsi Pengantar */}
            <div className="mt-2 px-1">
              <h2 className="text-sm sm:text-base font-black leading-snug tracking-tight text-white line-clamp-2">
                Sekolah teknologi yang membuat pilihan masa depan terasa lebih jelas.
              </h2>
              <p className="mt-0.5 text-[11px] leading-relaxed text-white/70 line-clamp-2">
                Untuk siswa yang ingin belajar dengan arah, praktik, karakter, dan peluang. Untuk orang tua yang ingin melihat anaknya tumbuh di lingkungan produktif dan relevan dengan zaman.
              </p>
            </div>
          </div>

          {/* 2. BODY GRID: 2 KOLOM (MELUAS MEMENUHI AREA SISA SETINGGI SCREEN) */}
          <div className="grid grid-cols-[54px_1fr] sm:grid-cols-[64px_1fr] gap-2.5 sm:gap-3 flex-1 min-h-0 my-2 items-stretch">
            
            {/* KOLOM KIRI: 5 IKON VERTIKAL (Menyebar proporsional mengisi tinggi) */}
            <div className="flex flex-col justify-between h-full gap-1.5 py-0.5">
              {sortedItems.map((item, index) => {
                const Icon = iconMap[item.icon as keyof typeof iconMap] || Sparkles;
                const isActive = active === index;

                return (
                  <button
                    key={`vert-icon-${item.id}`}
                    type="button"
                    onClick={() => scrollToItem(index)}
                    aria-label={`Buka ${item.title}`}
                    className={`relative flex flex-1 flex-col items-center justify-center rounded-xl sm:rounded-2xl transition-all duration-300 ${
                      isActive
                        ? "bg-rosebrand-600 text-white shadow-lg shadow-rosebrand-600/40 ring-2 ring-white/30 scale-[1.03]"
                        : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white ring-1 ring-white/10"
                    }`}
                  >
                    <Icon size={18} className={isActive ? "text-white scale-110" : "text-white/60"} aria-hidden />
                    <span className={`text-[9px] font-black mt-0.5 ${isActive ? "text-white" : "text-white/40"}`}>
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    {isActive && (
                      <motion.div
                        layoutId="vert-active-indicator"
                        className="absolute -right-1 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-white rounded-full shadow-sm"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* KOLOM KANAN: KONTEN KARTU (Meluas setinggi kolom, teks lengkap) */}
            <div className="min-w-0 h-full flex flex-col">
              <AnimatePresence mode="wait">
                <motion.article
                  key={`mobile-content-${activeItem.id}`}
                  initial={{ opacity: 0, y: 14, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -14, scale: 0.98 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="h-full rounded-2xl border border-white/15 bg-white p-4 sm:p-5 text-zinc-950 shadow-2xl flex flex-col justify-between overflow-hidden"
                >
                  <div className="flex-1 min-h-0 flex flex-col justify-start">
                    {/* Header Kartu */}
                    <div className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-2.5 shrink-0">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-tr from-rosebrand-600 to-rosebrand-500 text-white shadow-sm">
                          <ActiveIcon size={19} aria-hidden />
                        </span>
                        <div>
                          <span className="rounded-full bg-rosebrand-50 px-2.5 py-0.5 text-[10px] font-black uppercase text-rosebrand-700">
                            {activeItem.highlight || "Keunggulan"}
                          </span>
                          <p className="text-[10px] font-bold text-zinc-400 mt-0.5">
                            Keunggulan {active + 1} dari {sortedItems.length}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Judul Keunggulan */}
                    <h3 className="mt-3 text-base sm:text-lg font-black leading-snug text-zinc-900 shrink-0">
                      {activeItem.title}
                    </h3>

                    {/* Deskripsi Lengkap (Bisa scroll jika teks sangat panjang) */}
                    <p className="mt-2 text-xs sm:text-sm font-semibold leading-relaxed text-zinc-600 overflow-y-auto pr-1 scrollbar-thin">
                      {activeItem.description}
                    </p>
                  </div>

                  {/* Footer Kartu */}
                  <div className="pt-3 border-t border-zinc-100 mt-3 flex items-center justify-between shrink-0">
                    <Link
                      href="/spmb"
                      className="inline-flex h-9 sm:h-10 items-center gap-1.5 rounded-full bg-zinc-950 px-4 text-xs font-extrabold text-white transition hover:bg-rosebrand-600 shadow-sm active:scale-95"
                    >
                      Mulai dari SPMB
                      <ArrowRight size={13} aria-hidden />
                    </Link>
                    <span className="text-[10px] font-extrabold text-zinc-400 flex items-center gap-1">
                      Scroll ke bawah ↓
                    </span>
                  </div>
                </motion.article>
              </AnimatePresence>
            </div>
          </div>

          {/* 3. PROGRESS BAR STRIP BAWAH */}
          <div className="flex items-center justify-center gap-1.5 py-0.5 shrink-0">
            {sortedItems.map((item, index) => (
              <button
                key={`scroll-dot-${item.id}`}
                type="button"
                onClick={() => scrollToItem(index)}
                aria-label={`Keunggulan ${index + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  active === index ? "w-6 bg-rosebrand-500" : "w-1.5 bg-white/30"
                }`}
              />
            ))}
          </div>

        </div>
      </div>

      {/* ============================================================== */}
      {/* 💻 KHUSUS DESKTOP: STICKY PINNED 320VH DENGAN DUA KOLOM LEBAR */}
      {/* ============================================================== */}
      <div className="hidden lg:block relative h-[320vh]">
        <div className="sticky top-0 h-screen overflow-hidden text-white">
          <motion.div
            className="absolute -inset-[8%]"
            style={{ scale: bgScale, x: bgX, y: bgY, rotate: bgRotate, opacity: bgOpacity }}
          >
            <Image
              src="/images/background.png"
              alt="Latar visual teknologi SMK Telkom Lampung"
              fill
              sizes="100vw"
              className="object-cover"
            />
          </motion.div>

          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,9,11,0.95),rgba(9,9,11,0.78)_45%,rgba(9,9,11,0.42)),linear-gradient(0deg,rgba(9,9,11,0.86),rgba(9,9,11,0.16)_52%,rgba(9,9,11,0.84))]" />
          <CircuitOverlay progress={circuitProgress} />

          <div className="container-page relative z-10 grid h-full items-center">
            <div className="grid gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-extrabold uppercase text-rosebrand-200 ring-1 ring-white/10 backdrop-blur">
                  <Sparkles size={17} aria-hidden />
                  Why SMK Telkom Lampung
                </p>
                <h2 className="mt-5 max-w-3xl text-4xl font-black leading-tight md:text-6xl">
                  Sekolah teknologi yang membuat pilihan masa depan terasa lebih jelas.
                </h2>
                <p className="mt-5 max-w-2xl text-base leading-7 text-white/68 md:text-lg md:leading-8">
                  Untuk siswa yang ingin belajar dengan arah, praktik, karakter, dan peluang. Untuk orang tua yang ingin melihat anaknya tumbuh di lingkungan produktif dan relevan dengan zaman.
                </p>

                <div className="mt-8 flex items-center gap-3">
                  {sortedItems.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      aria-label={`Buka ${item.title}`}
                      onClick={() => scrollToItem(index)}
                      className={`h-2.5 rounded-full transition-all duration-300 ${
                        active === index ? "w-9 bg-rosebrand-500" : "w-2.5 bg-white/40 hover:bg-white/80"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="grid gap-4">
                <AnimatePresence mode="wait">
                  <motion.article
                    key={activeItem.id}
                    initial={{ opacity: 0, x: 48, scale: 0.98 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -28, scale: 0.98 }}
                    transition={{ duration: 0.36, ease: "easeOut" }}
                    className="rounded-[8px] border border-white/10 bg-white p-6 text-zinc-950 shadow-soft md:p-8"
                  >
                    <div className="flex items-start justify-between gap-5">
                      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-rosebrand-500 text-white">
                        <ActiveIcon size={26} aria-hidden />
                      </span>
                      <span className="rounded-full bg-rosebrand-50 px-3 py-1 text-xs font-black uppercase text-rosebrand-700">
                        {activeItem.highlight || "Pilihan utama"}
                      </span>
                    </div>
                    <p className="mt-7 text-sm font-extrabold uppercase text-zinc-400">
                      {String(active + 1).padStart(2, "0")} / {String(sortedItems.length).padStart(2, "0")}
                    </p>
                    <h3 className="mt-3 text-3xl font-black leading-tight md:text-4xl">{activeItem.title}</h3>
                    <p className="mt-4 text-base font-semibold leading-8 text-zinc-600">{activeItem.description}</p>
                    <Link
                      href="/spmb"
                      className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-zinc-950 px-5 text-sm font-extrabold text-white transition hover:bg-rosebrand-600"
                    >
                      Mulai dari SPMB
                      <ArrowRight size={17} aria-hidden />
                    </Link>
                  </motion.article>
                </AnimatePresence>

                <div className="hidden gap-3 lg:grid lg:grid-cols-3">
                  {visibleNavItems.map((item, index) => {
                    const itemIndex = navStart + index;
                    const Icon = iconMap[item.icon as keyof typeof iconMap] || Sparkles;
                    const isActive = active === itemIndex;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => scrollToItem(itemIndex)}
                        className={`rounded-[8px] border p-4 backdrop-blur transition ${
                          isActive ? "border-rosebrand-400 bg-rosebrand-500/18" : "border-white/10 bg-white/8"
                        }`}
                      >
                        <Icon size={20} className={isActive ? "text-rosebrand-300" : "text-white/70"} aria-hidden />
                        <p className="mt-3 line-clamp-2 text-left text-sm font-black leading-tight">{item.title}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CircuitOverlay({ progress }: { progress: MotionValue<number> }) {
  return (
    <svg className="pointer-events-none absolute inset-0 z-[1] h-full w-full opacity-80" viewBox="0 0 1440 900" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <filter id="why-red-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {circuitPaths.map((path, index) => (
          <CircuitPath key={path} path={path} index={index} progress={progress} />
        ))}
      </g>
    </svg>
  );
}

function CircuitPath({ path, index, progress }: { path: string; index: number; progress: MotionValue<number> }) {
  return (
    <g>
      <path d={path} stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
      <motion.path
        d={path}
        stroke="#f43f5e"
        strokeWidth={index === 1 ? 4 : 3}
        filter="url(#why-red-glow)"
        pathLength={progress}
      />
      <circle r="5" fill="#fb2f4f" filter="url(#why-red-glow)">
        <animateMotion dur={`${5.5 + index * 0.8}s`} repeatCount="indefinite" path={path} />
      </circle>
    </g>
  );
}

const circuitPaths = [
  "M70 710 H250 V610 H430 V515 H620 V430 H805",
  "M168 210 H338 V302 H528 V242 H738 V322 H930",
  "M910 780 V642 H1042 V526 H1198 V388 H1360",
  "M520 840 V716 H650 V640 H760 V520 H910 V440 H1080",
  "M92 430 H240 V360 H390 V302 H510"
];
