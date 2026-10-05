"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "framer-motion";
import { ArrowRight, BadgeCheck, BriefcaseBusiness, ChevronLeft, ChevronRight, Cpu, Layers3, Route, ShieldCheck, Sparkles, Target } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import type { SchoolUVPItem } from "@/types/content";

const iconMap = {
  Route,
  BadgeCheck,
  Layers3,
  ShieldCheck,
  Cpu,
  Target,
  Sparkles,
  BriefcaseBusiness
};

const pathwayLabels = ["B", "M", "W"];

const itemTags: Record<number, string[]> = {
  1: ["Magang Industri", "Fast Track PTN", "Wirausaha"],
  2: ["Digital Product Dev", "Real Projects", "Informatika"],
  3: ["1 Siswa 5 Portofolio", "Talent Mapping", "Karier"],
  4: ["Karakter Unggul", "Zero Trash", "Pembinaan Asrama"],
  5: ["Smart Home", "Cloud Infra", "AI & Animasi"],
  6: ["SPMB Terarah", "Karakter Siap", "Ekosistem Telkom"]
};

const chipShortNames = ["BMW Pathway", "COE Dev", "Portofolio", "Karakter", "Kompetensi", "Target 2026"];

export function SchoolUvpSection({ items }: { items: SchoolUVPItem[] }) {
  const ref = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState(0);
  const sortedItems = [...items]
    .filter((item) => item.isActive !== false)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
    .slice(0, 6);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"]
  });

  const shapeX = useTransform(scrollYProgress, [0, 0.35, 0.7, 1], ["-7%", "4%", "-2%", "8%"]);
  const shapeY = useTransform(scrollYProgress, [0, 0.35, 0.7, 1], ["4%", "-5%", "3%", "-4%"]);
  const shapeScale = useTransform(scrollYProgress, [0, 0.4, 0.75, 1], [1, 1.08, 0.96, 1.14]);
  const shapeRotate = useTransform(scrollYProgress, [0, 0.5, 1], ["-2deg", "2deg", "-1deg"]);
  const lineProgress = useTransform(scrollYProgress, [0.04, 0.96], [0, 1]);
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["-4%", "4%"]);
  const backgroundScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.05, 1.12, 1.04]);
  const backgroundRotate = useTransform(scrollYProgress, [0, 0.5, 1], ["0deg", "-1.2deg", "0.8deg"]);
  const backgroundOpacity = useTransform(scrollYProgress, [0, 0.55, 1], [0.88, 0.72, 0.9]);

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

  function scrollToItem(index: number) {
    const target = ref.current;
    if (!target) return;
    const sectionTop = target.getBoundingClientRect().top + window.scrollY;
    const scrollableDistance = target.offsetHeight - window.innerHeight;
    window.scrollTo({
      top: sectionTop + scrollableDistance * (index / sortedItems.length) + 8,
      behavior: "smooth"
    });
  }

  function handlePrev() {
    if (active > 0) {
      scrollToItem(active - 1);
    }
  }

  function handleNext() {
    if (active < sortedItems.length - 1) {
      scrollToItem(active + 1);
    }
  }

  return (
    <section ref={ref} id="uvp-sekolah" className="relative h-[280vh] lg:h-[360vh] scroll-mt-20 bg-[#170907] text-white">
      {/* ============================================================== */}
      {/* 📱 KHUSUS MOBILE: FUTURISTIC STRATEGY DOSSIER & BMW TERMINAL */}
      {/* ============================================================== */}
      <div className="block lg:hidden sticky top-[68px] sm:top-[74px] h-[calc(100dvh-68px)] sm:h-[calc(100dvh-74px)] overflow-hidden text-white">
        {/* Background visual & circuit */}
        <div className="absolute inset-0 opacity-40">
          <Image
            src="/images/Portal TG Magz Q1 - 2026_1.jpg"
            alt="UVP SMK Telkom Lampung"
            fill
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#170907]/95 via-[#1a0a09]/90 to-[#170907]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_24%,rgba(220,38,38,0.28),transparent_42%)]" />
        <UvpSignalField progress={lineProgress} />

        {/* Kontainer Flex Setinggi Viewport Mobile */}
        <div className="relative z-10 flex h-full flex-col justify-between p-3 sm:p-4">
          
          {/* 1. BAGIAN ATAS: TECH HUD BAR & JUDUL */}
          <div className="shrink-0 space-y-1.5">
            {/* HUD Status Bar */}
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-rosebrand-500/30 bg-rosebrand-950/70 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-rosebrand-300 backdrop-blur">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rosebrand-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rosebrand-500" />
                </span>
                UVP STRATEGY BLUEPRINT
              </div>

              <div className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-black backdrop-blur">
                <span className="text-white">{String(active + 1).padStart(2, "0")}</span>
                <span className="text-white/40">/</span>
                <span className="text-white/60">{String(sortedItems.length).padStart(2, "0")}</span>
              </div>
            </div>

            {/* Judul & Pengantar Singkat */}
            <div className="px-1">
              <h2 className="text-sm sm:text-base font-black leading-snug tracking-tight text-white line-clamp-1">
                Strategi sekolah yang terasa seperti peta masa depan.
              </h2>
            </div>

            {/* BMW Pathway Trio Terminal (Interactive Pathway Switcher) */}
            <div className="grid grid-cols-3 gap-1.5 pt-0.5">
              {[
                { key: "B", label: "Bekerja", hint: "Industri & Magang" },
                { key: "M", label: "Melanjutkan", hint: "Kuliah & PTN" },
                { key: "W", label: "Wirausaha", hint: "Bisnis Digital" },
              ].map((bmw) => (
                <button
                  key={bmw.key}
                  type="button"
                  onClick={() => scrollToItem(0)}
                  className={`group relative flex flex-col items-start rounded-xl p-2 text-left transition-all border ${
                    active === 0
                      ? "bg-rosebrand-950/90 border-rosebrand-500/80 text-white shadow-md shadow-rosebrand-600/30 ring-1 ring-rosebrand-500/40"
                      : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-[11px] font-black px-1.5 py-0.5 rounded leading-none ${active === 0 ? "bg-rosebrand-600 text-white" : "bg-white/10 text-rosebrand-300"}`}>
                      {bmw.key}
                    </span>
                    <span className="text-[8px] font-black uppercase text-white/40 tracking-wider">PATH</span>
                  </div>
                  <p className="text-[11px] font-black text-white mt-1 leading-tight">{bmw.label}</p>
                  <p className="text-[8.5px] font-semibold text-white/50 leading-tight truncate w-full mt-0.5">{bmw.hint}</p>
                </button>
              ))}
            </div>

            {/* Horizontal Cyber-Chip Navigation Strip */}
            <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-0.5 px-0.5">
              {sortedItems.map((item, index) => {
                const Icon = iconMap[item.icon as keyof typeof iconMap] || Sparkles;
                const isActive = active === index;
                const chipLabel = chipShortNames[index] || item.title;

                return (
                  <button
                    key={`uvp-chip-${item.id}`}
                    type="button"
                    onClick={() => scrollToItem(index)}
                    className={`flex items-center gap-1.5 shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black transition-all ${
                      isActive
                        ? "bg-rosebrand-600 text-white shadow-md shadow-rosebrand-600/40 ring-1 ring-white/30 scale-[1.02]"
                        : "bg-white/10 text-white/65 hover:bg-white/15 hover:text-white border border-white/5"
                    }`}
                  >
                    <Icon size={12} className={isActive ? "text-white" : "text-white/60"} aria-hidden />
                    <span>{chipLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. BODY: FULL-WIDTH FUTURISTIC DOSSIER CARD */}
          <div className="flex-1 min-h-0 flex flex-col my-1.5">
            <AnimatePresence mode="wait">
              <motion.article
                key={`uvp-mobile-card-${activeItem.id}`}
                initial={{ opacity: 0, scale: 0.97, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: -10 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="relative flex-1 min-h-0 rounded-2xl border border-white/20 bg-gradient-to-b from-zinc-900/90 via-[#1e0a0a]/90 to-[#120404]/95 backdrop-blur-xl p-3.5 sm:p-4 shadow-2xl flex flex-col justify-between overflow-hidden"
              >
                {/* Decorative Watermark & Ambient Glow */}
                <div className="pointer-events-none absolute -right-6 -bottom-6 w-36 h-36 rounded-full bg-rosebrand-600/20 blur-3xl" />
                <div className="pointer-events-none absolute right-3 top-1 text-[72px] sm:text-[88px] font-black text-white/[0.04] select-none leading-none">
                  {String(active + 1).padStart(2, "0")}
                </div>

                {/* Card Top Row */}
                <div className="relative z-10 shrink-0">
                  <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-tr from-rosebrand-600 to-rosebrand-500 text-white shadow-lg shadow-rosebrand-600/40 ring-1 ring-white/20">
                        <ActiveIcon size={20} aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <span className="inline-block rounded-full border border-rosebrand-500/40 bg-rosebrand-950/80 px-2.5 py-0.5 text-[9.5px] font-black uppercase text-rose-300">
                          {activeItem.category || "UVP Unggulan"}
                        </span>
                        <p className="text-[10px] font-bold text-white/50 truncate mt-0.5">
                          {activeItem.highlight || "Strategi Terintegrasi"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Judul & Subtitle */}
                  <div className="mt-2">
                    <h3 className="text-base sm:text-lg font-black leading-snug text-white">
                      {activeItem.title}
                    </h3>
                    {activeItem.subtitle && (
                      <p className="text-xs font-black text-rosebrand-400 mt-0.5">
                        {activeItem.subtitle}
                      </p>
                    )}
                  </div>

                  {/* Feature Tags / Key Insights */}
                  {itemTags[activeItem.id] && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {itemTags[activeItem.id].map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[9.5px] font-bold text-white/80"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Deskripsi Lengkap (Scrollable jika teks panjang) */}
                <div className="relative z-10 flex-1 min-h-0 my-2 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/20">
                  <p className="text-xs sm:text-sm font-medium leading-relaxed text-white/75">
                    {activeItem.description}
                  </p>
                </div>

                {/* Card Footer Controls */}
                <div className="relative z-10 shrink-0 pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                  <Link
                    href="/spmb"
                    className="inline-flex h-9 items-center gap-1.5 rounded-full bg-rosebrand-600 px-3.5 text-xs font-black text-white transition hover:bg-rosebrand-500 shadow-md shadow-rosebrand-600/30 active:scale-95"
                  >
                    <span>Pilih Jalur SPMB</span>
                    <ArrowRight size={13} aria-hidden />
                  </Link>

                  {/* Tombol Navigasi Cepat Kiri/Kanan */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handlePrev}
                      disabled={active === 0}
                      aria-label="Strategi sebelumnya"
                      className="grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-white/10 text-white transition disabled:opacity-25 disabled:pointer-events-none hover:bg-white/20 active:scale-95"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={active === sortedItems.length - 1}
                      aria-label="Strategi berikutnya"
                      className="grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-white/10 text-white transition disabled:opacity-25 disabled:pointer-events-none hover:bg-white/20 active:scale-95"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </motion.article>
            </AnimatePresence>
          </div>

          {/* 3. SEGMENTED PROGRESS TRACKER BAWAH */}
          <div className="flex items-center gap-1 py-0.5 shrink-0 px-1">
            {sortedItems.map((item, index) => (
              <button
                key={`uvp-seg-${item.id}`}
                type="button"
                onClick={() => scrollToItem(index)}
                aria-label={`Ke strategi ${index + 1}`}
                className="relative flex-1 h-1.5 rounded-full overflow-hidden bg-white/15 transition-all"
              >
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    active === index
                      ? "w-full bg-rosebrand-500 shadow-sm shadow-rosebrand-500"
                      : active > index
                      ? "w-full bg-white/50"
                      : "w-0"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 💻 KHUSUS DESKTOP (TIDAK BERUBAH SAMA SEKALI) */}
      {/* ============================================================== */}
      <div className="hidden lg:block sticky top-0 h-screen overflow-hidden">
        <motion.div
          className="absolute inset-[-6%] bg-cover bg-center"
          style={{
            y: backgroundY,
            scale: backgroundScale,
            rotate: backgroundRotate,
            opacity: backgroundOpacity,
            backgroundImage: "url('/images/Portal%20TG%20Magz%20Q1%20-%202026_1.jpg')"
          }}
        />
        <motion.div
          className="absolute -right-[20%] top-[7%] h-[76vh] w-[56vw] rounded-[8px] border border-white/10 bg-white/5"
          style={{ x: shapeX, y: shapeY, scale: shapeScale, rotate: shapeRotate }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_24%,rgba(255,255,255,0.20),transparent_23%),linear-gradient(90deg,rgba(12,8,8,0.92),rgba(105,15,18,0.72)_48%,rgba(220,38,38,0.42))]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.30),transparent_30%,rgba(0,0,0,0.55))]" />
        <UvpSignalField progress={lineProgress} />

        <div className="container-page relative z-10 grid h-full items-center py-8 md:py-12">
          <div className="grid min-h-0 gap-6 lg:grid-cols-[0.22fr_0.78fr] lg:items-center">
            <div className="hidden h-[74vh] min-h-[500px] lg:flex lg:flex-col lg:justify-between">
              <div className="inline-flex w-max items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-extrabold uppercase text-white/80 backdrop-blur">
                <Target size={15} aria-hidden />
                UVP Sekolah
              </div>

              <div className="grid gap-3">
                {sortedItems.map((item, index) => {
                  const isActive = active === index;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => scrollToItem(index)}
                      className="group grid grid-cols-[34px_1fr] items-center gap-3 text-left"
                    >
                      <span className={`grid h-8 w-8 place-items-center rounded-full border text-[11px] font-black transition ${
                        isActive ? "border-white bg-white text-rosebrand-700" : "border-white/20 bg-white/10 text-white/60 group-hover:text-white"
                      }`}>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className={`line-clamp-1 text-sm font-black transition ${isActive ? "text-white" : "text-white/45 group-hover:text-white/80"}`}>
                        {item.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
              <div className="self-center">
                <div className="grid gap-6">
                  <p className="relative z-20 inline-flex w-max items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black uppercase text-rosebrand-700 shadow-soft">
                    <Target size={16} aria-hidden />
                    Unique Value Proposition
                  </p>
                  <div className="relative isolate pt-5">
                    <motion.p
                      key={`index-${activeItem.id}`}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="pointer-events-none absolute -left-2 top-0 z-0 text-[112px] font-black leading-none text-white/10 sm:text-[150px] lg:-left-4 lg:-top-4 lg:text-[188px]"
                    >
                      {String(active + 1).padStart(2, "0")}
                    </motion.p>
                    <h2 className="relative z-10 max-w-3xl text-4xl font-black leading-tight md:text-6xl">
                      Strategi sekolah yang terasa seperti peta masa depan.
                    </h2>
                  </div>
                </div>
                <p className="mt-7 max-w-2xl text-base font-semibold leading-8 text-white/75">
                  UVP SMK Telkom Lampung dipresentasikan sebagai sistem: branding, kompetensi, karakter, portofolio, dan jalur karier yang saling terhubung.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  {pathwayLabels.map((label, index) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => scrollToItem(Math.min(index, sortedItems.length - 1))}
                      className={`min-w-28 rounded-full border px-4 py-3 text-left transition ${
                        active === index ? "border-white bg-white text-rosebrand-700" : "border-white/20 bg-white/10 text-white hover:bg-white/15"
                      }`}
                    >
                      <span className="mr-2 text-lg font-black">{label}</span>
                      <span className="text-xs font-extrabold uppercase">
                        {label === "B" ? "Bekerja" : label === "M" ? "Melanjutkan" : "Wirausaha"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4">
                <AnimatePresence mode="wait">
                  <motion.article
                    key={activeItem.id}
                    initial={{ opacity: 0, x: 48, filter: "blur(10px)" }}
                    animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, x: -34, filter: "blur(8px)" }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                    className="relative min-h-[390px] overflow-hidden rounded-[8px] border border-white/20 bg-[#1a0f0e]/60 p-6 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl md:p-8"
                  >
                    <div className="absolute inset-x-0 top-0 h-1 bg-white" />
                    <div className="absolute bottom-0 right-0 h-44 w-44 translate-x-16 translate-y-16 rounded-full border border-white/15" />
                    <div className="relative grid h-full content-between gap-8">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <span className="grid h-16 w-16 place-items-center rounded-[8px] bg-white text-rosebrand-700 shadow-soft">
                          <ActiveIcon size={30} aria-hidden />
                        </span>
                        <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-black uppercase text-white/80">
                          {activeItem.category}
                        </span>
                      </div>

                      <div>
                        <p className="text-sm font-extrabold uppercase text-white/50">
                          {activeItem.highlight || "Strategi unggulan"}
                        </p>
                        <h3 className="mt-3 text-3xl font-black leading-tight md:text-5xl">{activeItem.title}</h3>
                        <p className="mt-3 text-xl font-black text-white/90">{activeItem.subtitle}</p>
                        <p className="mt-6 text-base font-semibold leading-8 text-white/75">{activeItem.description}</p>
                      </div>
                    </div>
                  </motion.article>
                </AnimatePresence>

                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {sortedItems.map((item, index) => {
                    const Icon = iconMap[item.icon as keyof typeof iconMap] || Sparkles;
                    const isActive = active === index;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => scrollToItem(index)}
                        className={`grid aspect-square place-items-center rounded-[8px] border transition ${
                          isActive ? "border-white bg-white text-rosebrand-700" : "border-white/15 bg-white/10 text-white/60 hover:bg-white/15 hover:text-white"
                        }`}
                        aria-label={item.title}
                      >
                        <Icon size={22} aria-hidden />
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

function UvpSignalField({ progress }: { progress: MotionValue<number> }) {
  return (
    <svg className="pointer-events-none absolute inset-0 z-[1] h-full w-full opacity-80" viewBox="0 0 1440 900" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <filter id="uvp-signal-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path d="M118 704 C292 610 388 744 545 620 S765 346 930 442 1120 646 1306 512" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="10 16" />
      <path d="M218 238 C360 120 486 178 610 302 S838 590 1038 356 1210 218 1336 286" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 18" />
      <motion.path
        d="M118 704 C292 610 388 744 545 620 S765 346 930 442 1120 646 1306 512"
        fill="none"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#uvp-signal-glow)"
        pathLength={progress}
      />
      <circle r="6" fill="white" filter="url(#uvp-signal-glow)">
        <animateMotion dur="7.4s" repeatCount="indefinite" path="M118 704 C292 610 388 744 545 620 S765 346 930 442 1120 646 1306 512" />
      </circle>
    </svg>
  );
}
