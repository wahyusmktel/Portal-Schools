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

  return (
    <section ref={ref} id="uvp-sekolah" className="relative h-[360vh] bg-[#170907] text-white">
      <div className="sticky top-0 h-screen overflow-hidden">
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
                <p className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black uppercase text-rosebrand-700 shadow-soft">
                  <Target size={16} aria-hidden />
                  Unique Value Proposition
                </p>
                <div className="relative mt-8">
                  <motion.p
                    key={`index-${activeItem.id}`}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="text-[116px] font-black leading-none text-white/10 sm:text-[150px] lg:text-[190px]"
                  >
                    {String(active + 1).padStart(2, "0")}
                  </motion.p>
                  <div className="absolute inset-x-0 bottom-3">
                    <h2 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">
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
