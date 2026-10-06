"use client";

import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Network,
  Palette,
  TerminalSquare
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import type { Major } from "@/types/content";

const majorIcons = {
  Network,
  Code: TerminalSquare,
  Palette
};

const fallbackCover =
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=82";

function getMajorAbbr(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("jaringan akses") || lower.includes("tjat")) return "TJAT";
  if (lower.includes("komputer") || lower.includes("tkj")) return "TKJ";
  if (lower.includes("perangkat lunak") || lower.includes("rpl")) return "RPL";
  if (lower.includes("animasi")) return "Animasi";
  const words = name.split(" ");
  if (words.length > 1) {
    return words.map((w) => w[0]).join("").toUpperCase();
  }
  return name.slice(0, 10);
}

export function MajorShowcase({ majors }: { majors: Major[] }) {
  const [active, setActive] = useState(0);
  const sectionIds = useMemo(() => majors.map((major) => `jurusan-${major.slug}`), [majors]);

  function goTo(index: number) {
    const safeIndex = Math.max(0, Math.min(index, majors.length - 1));
    document.getElementById(sectionIds[safeIndex])?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
    setActive(safeIndex);
  }

  return (
    <section id="jurusan" className="relative bg-white scroll-mt-16">
      {/* ============================================================== */}
      {/* 📱 KHUSUS MOBILE: MENU JURUSAN & OPTIMALISASI KONTEN LENGKAP */}
      {/* ============================================================== */}
      <div className="block lg:hidden">
        <MobileMajorShowcase majors={majors} />
      </div>

      {/* ============================================================== */}
      {/* 💻 KHUSUS DESKTOP (TIDAK BERUBAH) */}
      {/* ============================================================== */}
      <div className="hidden lg:block">
        <div className="pointer-events-none absolute inset-y-0 right-4 z-40">
          <div className="pointer-events-auto sticky top-[calc(50vh-92px)] grid gap-3 rounded-full bg-zinc-950/90 p-2 text-white shadow-soft backdrop-blur">
            <button
              type="button"
              aria-label="Jurusan sebelumnya"
              onClick={() => goTo(active - 1)}
              className="grid h-11 w-11 place-items-center rounded-full bg-white/10 transition hover:bg-rosebrand-500"
            >
              <ArrowUp size={19} aria-hidden />
            </button>
            <div className="grid gap-2 px-1 py-1">
              {majors.map((major, index) => (
                <button
                  key={major.slug}
                  type="button"
                  aria-label={`Buka ${major.name}`}
                  onClick={() => goTo(index)}
                  className={`mx-auto h-3 rounded-full transition ${
                    active === index ? "w-3 bg-rosebrand-500" : "w-2 bg-white/50 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              aria-label="Jurusan berikutnya"
              onClick={() => goTo(active + 1)}
              className="grid h-11 w-11 place-items-center rounded-full bg-white/10 transition hover:bg-rosebrand-500"
            >
              <ArrowDown size={19} aria-hidden />
            </button>
          </div>
        </div>

        {majors.map((major, index) => (
          <MajorScrollScene
            key={major.slug}
            id={sectionIds[index]}
            major={major}
            index={index}
            total={majors.length}
            onEnter={() => setActive(index)}
          />
        ))}
      </div>
    </section>
  );
}

function MajorScrollScene({
  id,
  major,
  index,
  total,
  onEnter
}: {
  id: string;
  major: Major;
  index: number;
  total: number;
  onEnter: () => void;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"]
  });

  const Icon = majorIcons[major.icon as keyof typeof majorIcons] || Network;
  const curriculum = Array.isArray(major.curriculum) ? major.curriculum : [];
  const careerProspects = Array.isArray(major.careerProspects) ? major.careerProspects : [];
  const coverImage = major.coverImage || fallbackCover;

  const imageX = useTransform(scrollYProgress, [0, 0.28, 0.88], ["0vw", "6vw", "6vw"]);
  const imageScaleX = useTransform(scrollYProgress, [0, 0.28, 0.88], [1, 0.42, 0.42]);
  const imageScaleY = useTransform(scrollYProgress, [0, 0.28, 0.88], [1, 0.82, 0.82]);
  const imageRadius = useTransform(scrollYProgress, [0, 0.28], [0, 34]);
  const imageShadow = useTransform(
    scrollYProgress,
    [0, 0.28],
    ["0 0 0 rgba(39,39,42,0)", "0 26px 90px rgba(39,39,42,0.18)"]
  );
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.28], [0.58, 0.12]);
  const heroTextOpacity = useTransform(scrollYProgress, [0, 0.16], [1, 0]);
  const heroTextY = useTransform(scrollYProgress, [0, 0.16], [0, -34]);
  const contentOpacity = useTransform(scrollYProgress, [0.12, 0.24, 0.9, 1], [0, 1, 1, 1]);
  const contentX = useTransform(scrollYProgress, [0.12, 0.24, 0.9], [50, 0, 0]);
  const contentScale = useTransform(scrollYProgress, [0.12, 0.24, 0.9], [0.98, 1, 1]);

  return (
    <section ref={ref} id={id} className="relative h-[155vh] scroll-mt-20 bg-white" aria-label={major.name}>
      <div className="sticky top-0 h-screen overflow-hidden bg-white">
        <motion.div
          className="absolute inset-0 origin-left overflow-hidden bg-zinc-950"
          style={{
            x: imageX,
            scaleX: imageScaleX,
            scaleY: imageScaleY,
            borderRadius: imageRadius,
            boxShadow: imageShadow
          }}
          onViewportEnter={onEnter}
          viewport={{ amount: 0.55 }}
        >
          <Image
            src={coverImage}
            alt={`Cover jurusan ${major.name}`}
            fill
            sizes="100vw"
            className="object-cover"
            priority={index === 0}
          />
          <motion.div className="absolute inset-0 bg-zinc-950" style={{ opacity: overlayOpacity }} />
          <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-white/90 via-white/20 to-transparent" />
        </motion.div>

        <motion.div
          className="absolute left-[max(2rem,calc((100vw-1180px)/2))] top-1/2 max-w-5xl -translate-y-1/2 text-white"
          style={{ opacity: heroTextOpacity, y: heroTextY }}
        >
          <p className="text-lg font-extrabold uppercase tracking-[0.18em] text-rosebrand-300">
            Kompetensi Keahlian {String(index + 1).padStart(2, "0")}
          </p>
          <h2 className="mt-5 max-w-5xl text-6xl font-black leading-[0.95] md:text-8xl">{major.name}</h2>
          <p className="mt-6 max-w-2xl text-xl leading-8 text-white/80">{major.summary}</p>
        </motion.div>

        <motion.div
          className="container-page relative z-10 grid h-full items-center lg:grid-cols-[0.44fr_0.56fr]"
          style={{ opacity: contentOpacity, x: contentX, scale: contentScale }}
        >
          <div className="hidden lg:block" />
          <div className="max-h-[calc(100vh-7rem)] overflow-y-auto rounded-[8px] border border-zinc-200/80 bg-white/95 p-6 shadow-soft backdrop-blur md:p-8 xl:p-10">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-extrabold uppercase text-rosebrand-600">
                {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
              </p>
              <div className="grid h-12 w-12 place-items-center rounded-full bg-rosebrand-500 text-white">
                <Icon size={24} aria-hidden />
              </div>
            </div>
            <h2 className="mt-5 text-3xl font-black leading-tight text-zinc-900 md:text-4xl xl:text-5xl">{major.name}</h2>
            <p className="mt-5 text-base leading-8 text-zinc-600 xl:text-lg">{major.summary}</p>

            <div className="mt-7 border-l-2 border-zinc-200 pl-5 xl:pl-6">
              <h3 className="flex items-center gap-2 text-lg font-black text-zinc-300 xl:text-xl">
                <CheckCircle2 size={21} aria-hidden />
                Fokus Kurikulum
              </h3>
              <div className="my-4 border-l-4 border-rosebrand-500 pl-5">
                <p className="text-xl font-black text-rosebrand-600 xl:text-2xl">{curriculum[0] || "Pembelajaran berbasis industri"}</p>
                <div className="mt-3 grid gap-2">
                  {curriculum.slice(1).map((item) => (
                    <p key={item} className="text-sm font-bold leading-6 text-zinc-500 xl:text-base">
                      {item}
                    </p>
                  ))}
                </div>
              </div>
              <h3 className="flex items-center gap-2 text-lg font-black text-zinc-300 xl:text-xl">
                <BriefcaseBusiness size={21} aria-hidden />
                Prospek Pekerjaan
              </h3>
              <div className="mt-4 flex flex-wrap gap-2 pb-1">
                {careerProspects.map((item) => (
                  <span key={item} className="rounded-full bg-rosebrand-50 px-3 py-2 text-xs font-extrabold text-rosebrand-700 xl:text-sm">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full bg-white/85 px-4 py-2 text-sm font-extrabold text-zinc-700 shadow-soft backdrop-blur lg:hidden">
          <span>{String(index + 1).padStart(2, "0")}</span>
          <span className="h-px w-10 bg-zinc-300" />
          <span>{String(total).padStart(2, "0")}</span>
        </div>
      </div>
    </section>
  );
}

function MobileMajorShowcase({ majors }: { majors: Major[] }) {
  const [mobileActive, setMobileActive] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  if (majors.length === 0) return null;

  const currentMajor = majors[mobileActive] || majors[0];
  const Icon = majorIcons[currentMajor.icon as keyof typeof majorIcons] || Network;
  const curriculum = Array.isArray(currentMajor.curriculum) ? currentMajor.curriculum : [];
  const careerProspects = Array.isArray(currentMajor.careerProspects) ? currentMajor.careerProspects : [];
  const coverImage = currentMajor.coverImage || fallbackCover;
  const currentAbbr = getMajorAbbr(currentMajor.name);

  function handleSelect(index: number) {
    setMobileActive(index);
    if (containerRef.current) {
      const topOffset = containerRef.current.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top: topOffset, behavior: "smooth" });
    }
  }

  function handleNext() {
    if (mobileActive < majors.length - 1) {
      handleSelect(mobileActive + 1);
    } else {
      handleSelect(0);
    }
  }

  function handlePrev() {
    if (mobileActive > 0) {
      handleSelect(mobileActive - 1);
    } else {
      handleSelect(majors.length - 1);
    }
  }

  return (
    <div ref={containerRef} className="py-7 px-4 sm:px-6 bg-slate-50/70 border-b border-zinc-200/80">
      {/* 1. Header Pengantar */}
      <div className="mb-4">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-rosebrand-200 bg-rosebrand-50 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-rosebrand-700">
          <GraduationCap size={14} className="text-rosebrand-600" />
          <span>Kompetensi Keahlian</span>
        </div>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-900 leading-tight">
          Pilihan Jurusan Masa Depan
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-zinc-600">
          Pendidikan vokasi teknologi terakreditasi dengan kurikulum industri dan peluang kerja nyata.
        </p>
      </div>

      {/* 2. Menu Tab Jurusan Mobile (Sticky) */}
      <div className="sticky top-[64px] sm:top-[68px] z-30 -mx-4 px-4 py-2.5 bg-white/95 backdrop-blur-md border-y border-zinc-200/80 shadow-xs mb-5">
        <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {majors.map((major, index) => {
            const TabIcon = majorIcons[major.icon as keyof typeof majorIcons] || Network;
            const isTabActive = mobileActive === index;
            const abbr = getMajorAbbr(major.name);

            return (
              <button
                key={`mobile-tab-${major.slug}`}
                type="button"
                onClick={() => handleSelect(index)}
                className={`relative flex items-center gap-1.5 shrink-0 rounded-xl px-3 py-2 text-xs font-black transition-all duration-200 ${
                  isTabActive
                    ? "bg-rosebrand-600 text-white shadow-md shadow-rosebrand-600/30 scale-[1.02]"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80 hover:text-zinc-900"
                }`}
              >
                <TabIcon size={14} className={isTabActive ? "text-white" : "text-zinc-500"} />
                <span>{abbr}</span>
                <span className={`text-[10px] ml-0.5 px-1 py-0.2 rounded font-extrabold ${isTabActive ? "bg-white/20 text-white" : "bg-zinc-200/70 text-zinc-500"}`}>
                  0{index + 1}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Konten Lengkap Jurusan Aktif (Tampil Penuh, Semua Terbaca) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentMajor.slug}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="rounded-3xl border border-zinc-200/90 bg-white p-4 sm:p-5 shadow-sm space-y-5"
        >
          {/* Cover Visual Card */}
          <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-zinc-950 shadow-md">
            <Image
              src={coverImage}
              alt={`Cover jurusan ${currentMajor.name}`}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/30 to-transparent" />
            
            {/* Top Badges */}
            <div className="absolute top-3 inset-x-3 flex items-center justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-rosebrand-600 text-white shadow-md">
                <Icon size={20} aria-hidden />
              </span>
              <span className="rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-[11px] font-black text-white/90 border border-white/20">
                0{mobileActive + 1} / 0{majors.length}
              </span>
            </div>

            {/* Bottom Overlay Label */}
            <div className="absolute bottom-3 inset-x-3 text-white">
              <div className="inline-block rounded-md bg-rosebrand-600/90 backdrop-blur px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                {currentAbbr}
              </div>
              <p className="mt-1 text-sm font-black text-white drop-shadow-sm line-clamp-1">
                {currentMajor.name}
              </p>
            </div>
          </div>

          {/* Judul & Ringkasan Lengkap */}
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-rosebrand-50 border border-rosebrand-200 px-2.5 py-0.5 text-[10px] font-black uppercase text-rosebrand-700">
                Program Keahlian Terakreditasi
              </span>
            </div>
            <h3 className="mt-2 text-xl font-black text-zinc-900 leading-snug">
              {currentMajor.name}
            </h3>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-zinc-600 font-medium">
              {currentMajor.summary}
            </p>
          </div>

          {/* Fokus Kurikulum (Semua Terbaca Jelas) */}
          <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-zinc-800">
              <CheckCircle2 size={16} className="text-rosebrand-600" />
              <span>Fokus Kurikulum Industri</span>
            </div>

            {curriculum.length > 0 && (
              <div className="mt-3 space-y-2">
                {/* Highlight Kompetensi Utama */}
                <div className="rounded-xl border border-rosebrand-200/80 bg-rosebrand-50/70 p-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-rosebrand-600">
                    Materi Utama Unggulan
                  </p>
                  <p className="mt-0.5 text-xs sm:text-sm font-black text-zinc-900">
                    {curriculum[0]}
                  </p>
                </div>

                {/* Daftar Topik Kurikulum Lainnya */}
                {curriculum.slice(1).map((item, idx) => (
                  <div
                    key={item}
                    className="flex items-start gap-2.5 rounded-xl border border-zinc-200/60 bg-white p-2.5 text-xs font-bold text-zinc-700 shadow-2xs"
                  >
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-zinc-100 text-[10px] font-black text-zinc-600 mt-0.5">
                      {idx + 2}
                    </span>
                    <span className="leading-snug">{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Prospek Pekerjaan (Semua Terbaca Jelas) */}
          <div className="rounded-2xl border border-rosebrand-200/60 bg-rosebrand-50/40 p-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-rosebrand-800">
              <BriefcaseBusiness size={16} className="text-rosebrand-600" />
              <span>Prospek Karier & Peluang Kerja</span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {careerProspects.map((prospect) => (
                <span
                  key={prospect}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rosebrand-200/80 bg-white px-3 py-2 text-xs font-bold text-zinc-800 shadow-2xs"
                >
                  <span className="h-2 w-2 rounded-full bg-rosebrand-500 shrink-0" />
                  <span>{prospect}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Action Button & Next/Prev Navigation */}
          <div className="pt-2 space-y-2.5">
            <Link
              href="/spmb"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 py-3.5 px-4 text-xs font-black text-white hover:bg-rosebrand-600 transition shadow-md active:scale-95"
            >
              <span>Konsultasi / Daftar Jurusan {currentAbbr} di SPMB</span>
              <ArrowRight size={14} />
            </Link>

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={handlePrev}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white py-2.5 px-3 text-xs font-bold text-zinc-700 hover:bg-zinc-100 active:scale-95 shadow-2xs"
              >
                <ChevronLeft size={15} />
                <span>Sebelumnya</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white py-2.5 px-3 text-xs font-bold text-zinc-700 hover:bg-zinc-100 active:scale-95 shadow-2xs"
              >
                <span>Berikutnya</span>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
