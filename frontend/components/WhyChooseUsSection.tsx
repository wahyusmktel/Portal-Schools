"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "framer-motion";
import { ArrowRight, Code2, Cpu, GraduationCap, Network, ShieldCheck, Sparkles } from "lucide-react";
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

  return (
    <section ref={ref} className="relative h-[320vh] scroll-mt-20 bg-zinc-950" id="why-smk-telkom">
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
                    onClick={() => {
                      const target = ref.current;
                      if (!target) return;
                      const sectionTop = target.getBoundingClientRect().top + window.scrollY;
                      const scrollableDistance = target.offsetHeight - window.innerHeight;
                      window.scrollTo({
                        top: sectionTop + scrollableDistance * (index / sortedItems.length) + 8,
                        behavior: "smooth"
                      });
                    }}
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
                {sortedItems.slice(0, 3).map((item, index) => {
                  const Icon = iconMap[item.icon as keyof typeof iconMap] || Sparkles;
                  const isActive = active === index;

                  return (
                    <article
                      key={item.id}
                      className={`rounded-[8px] border p-4 backdrop-blur transition ${
                        isActive ? "border-rosebrand-400 bg-rosebrand-500/18" : "border-white/10 bg-white/8"
                      }`}
                    >
                      <Icon size={20} className={isActive ? "text-rosebrand-300" : "text-white/70"} aria-hidden />
                      <p className="mt-3 line-clamp-2 text-sm font-black leading-tight">{item.title}</p>
                    </article>
                  );
                })}
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
