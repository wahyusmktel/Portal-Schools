"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  BriefcaseBusiness,
  CheckCircle2,
  Network,
  Palette,
  TerminalSquare
} from "lucide-react";
import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import type { Major } from "@/types/content";

const majorIcons = {
  Network,
  Code: TerminalSquare,
  Palette
};

const fallbackCover =
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=82";

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
    <section id="jurusan" className="relative bg-white">
      <div className="pointer-events-none absolute inset-y-0 right-4 z-40 hidden lg:block">
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
