"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "framer-motion";
import { BadgeCheck, BriefcaseBusiness, Cpu, Layers3, Route, ShieldCheck, Sparkles, Target } from "lucide-react";
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

  return (
    <section ref={ref} id="uvp-sekolah" className="relative h-[330vh] bg-rosebrand-600 text-white">
      <div className="sticky top-0 h-screen overflow-hidden">
        <motion.div
          className="absolute -right-[14%] top-[8%] h-[70vh] w-[70vw] rounded-[8px] border border-white/20 bg-white/10"
          style={{ x: shapeX, y: shapeY, scale: shapeScale, rotate: shapeRotate }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.18),transparent_34%),linear-gradient(0deg,rgba(159,18,57,0.55),transparent_55%)]" />
        <UvpRouteLines progress={lineProgress} />

        <div className="container-page relative z-10 grid h-full items-center">
          <div className="grid gap-8 lg:grid-cols-[0.84fr_1.16fr] lg:items-center">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-extrabold uppercase text-white ring-1 ring-white/20 backdrop-blur">
                <Target size={17} aria-hidden />
                Unique Value Proposition
              </p>
              <h2 className="mt-5 max-w-3xl text-4xl font-black leading-tight md:text-6xl">
                Strategi sekolah yang membuat siswa punya arah sejak hari pertama.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/78 md:text-lg md:leading-8">
                UVP SMK Telkom Lampung dirancang untuk memadukan branding, kompetensi industri, karakter, dan jalur masa depan siswa dalam satu pengalaman belajar yang terukur.
              </p>

              <div className="mt-8 grid max-w-md grid-cols-3 gap-3">
                {pathwayLabels.map((label, index) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => scrollToItem(Math.min(index, sortedItems.length - 1))}
                    className={`rounded-[8px] border p-4 text-left transition ${
                      active === index ? "border-white bg-white text-rosebrand-700" : "border-white/20 bg-white/10 text-white hover:bg-white/16"
                    }`}
                  >
                    <span className="block text-3xl font-black">{label}</span>
                    <span className="mt-1 block text-xs font-extrabold uppercase opacity-75">
                      {label === "B" ? "Bekerja" : label === "M" ? "Melanjutkan" : "Wirausaha"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-5">
              <AnimatePresence mode="wait">
                <motion.article
                  key={activeItem.id}
                  initial={{ opacity: 0, y: 34, rotateX: 8 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  exit={{ opacity: 0, y: -26, rotateX: -6 }}
                  transition={{ duration: 0.38, ease: "easeOut" }}
                  className="relative overflow-hidden rounded-[8px] border border-white/24 bg-white/12 p-6 text-white shadow-soft ring-1 ring-white/10 backdrop-blur-xl md:p-8"
                >
                  <div className="absolute right-0 top-0 h-28 w-28 translate-x-8 -translate-y-8 rounded-full bg-white/15" />
                  <div className="relative">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <span className="grid h-14 w-14 place-items-center rounded-full bg-white text-rosebrand-700">
                        <ActiveIcon size={26} aria-hidden />
                      </span>
                      <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black uppercase text-white ring-1 ring-white/15">
                        {activeItem.highlight || activeItem.category}
                      </span>
                    </div>
                    <p className="mt-7 text-sm font-extrabold uppercase text-white/55">
                      {activeItem.category} / {String(active + 1).padStart(2, "0")} dari {String(sortedItems.length).padStart(2, "0")}
                    </p>
                    <h3 className="mt-3 text-3xl font-black leading-tight md:text-5xl">{activeItem.title}</h3>
                    <p className="mt-3 text-xl font-black text-white">{activeItem.subtitle}</p>
                    <p className="mt-5 text-base font-semibold leading-8 text-white/76">{activeItem.description}</p>
                  </div>
                </motion.article>
              </AnimatePresence>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {sortedItems.map((item, index) => {
                  const Icon = iconMap[item.icon as keyof typeof iconMap] || Sparkles;
                  const isActive = active === index;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => scrollToItem(index)}
                      className={`group rounded-[8px] border p-4 text-left backdrop-blur transition ${
                        isActive ? "border-white bg-white text-rosebrand-700" : "border-white/20 bg-white/10 text-white hover:bg-white/16"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <Icon size={20} aria-hidden />
                        <span className="text-xs font-black">{String(index + 1).padStart(2, "0")}</span>
                      </div>
                      <p className="mt-3 line-clamp-2 text-sm font-black leading-tight">{item.title}</p>
                    </button>
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

function UvpRouteLines({ progress }: { progress: MotionValue<number> }) {
  return (
    <svg className="pointer-events-none absolute inset-0 z-[1] h-full w-full opacity-70" viewBox="0 0 1440 900" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <filter id="uvp-white-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path d="M90 704 H305 V610 H500 V516 H720 V410 H930 V320 H1260" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <motion.path
        d="M90 704 H305 V610 H500 V516 H720 V410 H930 V320 H1260"
        fill="none"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#uvp-white-glow)"
        pathLength={progress}
      />
      <circle r="7" fill="white" filter="url(#uvp-white-glow)">
        <animateMotion dur="6.8s" repeatCount="indefinite" path="M90 704 H305 V610 H500 V516 H720 V410 H930 V320 H1260" />
      </circle>
    </svg>
  );
}
