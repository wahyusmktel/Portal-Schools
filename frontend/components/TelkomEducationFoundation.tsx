"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { Building2, GraduationCap, MapPin, Network, School2, Sparkles } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

const ecosystemSteps = [
  {
    eyebrow: "01 / Jaringan Pendidikan",
    metric: "51 Satuan Pendidikan",
    title: "Dari Indonesia untuk masa depan digital.",
    body: "Satu visi besar: mencetak talenta unggul yang siap tumbuh bersama industri dan membawa dampak untuk Indonesia.",
    icon: Network,
    marker: "left-[50%] top-[42%]"
  },
  {
    eyebrow: "02 / Fondasi Usia Dini",
    metric: "32 PAUD",
    title: "Awal terbaik untuk karakter dan rasa ingin tahu.",
    body: "Yayasan Pendidikan Telkom membangun fondasi belajar sejak usia dini melalui PAUD yang tersebar di berbagai wilayah Indonesia.",
    icon: Sparkles,
    marker: "left-[56%] top-[44%]"
  },
  {
    eyebrow: "03 / Pendidikan Dasar",
    metric: "3 SD",
    title: "Literasi, numerasi, dan kebiasaan belajar yang kuat.",
    body: "Sekolah dasar dalam ekosistem YPT menumbuhkan disiplin, keberanian bertanya, dan dasar akademik untuk perjalanan pendidikan berikutnya.",
    icon: School2,
    marker: "left-[62%] top-[53%]"
  },
  {
    eyebrow: "04 / Masa Transisi",
    metric: "4 SMP",
    title: "Menguatkan arah minat sebelum masuk dunia vokasi.",
    body: "Jenjang SMP menjadi ruang transisi yang membantu siswa mengenali potensi, teknologi, dan cara belajar yang lebih mandiri.",
    icon: Building2,
    marker: "left-[72%] top-[56%]"
  },
  {
    eyebrow: "05 / Vokasi Digital",
    metric: "12 SMK",
    title: "Salah satunya hadir di Lampung.",
    body: "SMK Telkom Lampung adalah bagian dari jaringan SMK Telkom Schools yang menyiapkan talenta vokasi digital, siap kerja, dan siap bersaing.",
    icon: GraduationCap,
    marker: "left-[82%] top-[58%]"
  }
];

export function TelkomEducationFoundation() {
  const ref = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState(0);
  const activeStep = ecosystemSteps[active];
  const ActiveIcon = activeStep.icon;
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"]
  });

  const mapScale = useTransform(scrollYProgress, [0, 0.25, 0.5, 0.75, 1], [1.18, 1.06, 1.16, 1.08, 1.22]);
  const mapX = useTransform(scrollYProgress, [0, 0.25, 0.5, 0.75, 1], ["10%", "2%", "-7%", "-14%", "-2%"]);
  const mapY = useTransform(scrollYProgress, [0, 0.25, 0.5, 0.75, 1], ["-8%", "-4%", "0%", "4%", "-5%"]);
  const mapRotate = useTransform(scrollYProgress, [0, 0.5, 1], ["0deg", "-1.8deg", "1deg"]);
  const mapOpacity = useTransform(scrollYProgress, [0, 0.08, 0.92, 1], [0.72, 1, 1, 0.82]);
  const titleY = useTransform(scrollYProgress, [0, 0.16, 0.9, 1], [0, -18, -18, -34]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.9, 1], [1, 1, 0.72]);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const nextActive = Math.min(ecosystemSteps.length - 1, Math.floor(latest * ecosystemSteps.length));
    setActive(nextActive);
  });

  function goTo(index: number) {
    const safeIndex = Math.max(0, Math.min(index, ecosystemSteps.length - 1));
    const target = ref.current;

    if (!target) {
      return;
    }

    const sectionTop = target.getBoundingClientRect().top + window.scrollY;
    const scrollableDistance = target.offsetHeight - window.innerHeight;
    window.scrollTo({
      top: sectionTop + scrollableDistance * (safeIndex / ecosystemSteps.length) + 8,
      behavior: "smooth"
    });
  }

  return (
    <section
      ref={ref}
      id="yayasan-pendidikan-telkom"
      className="relative h-[360vh] scroll-mt-20 bg-white"
      aria-label="Ekosistem Telkom Schools"
    >
      <div className="sticky top-0 h-screen overflow-hidden bg-white">
        <motion.div
          className="absolute -inset-[8%]"
          style={{ scale: mapScale, x: mapX, y: mapY, rotate: mapRotate, opacity: mapOpacity }}
        >
          <Image
            src="/images/telkom-foundation-map.webp"
            alt="Peta jaringan pendidikan Telkom di Indonesia"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        </motion.div>

        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/8" />
        <div className="absolute inset-y-0 left-0 w-[58vw] bg-white/88 backdrop-blur-[1px]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent" />

        {ecosystemSteps.map((step, index) => (
          <motion.span
            key={step.metric}
            className={`absolute hidden h-3.5 w-3.5 rounded-full bg-red-500 shadow-[0_0_0_10px_rgba(239,68,68,0.13)] lg:block ${step.marker}`}
            animate={{
              scale: active === index ? [1, 1.8, 1] : 0.92,
              opacity: active === index ? 1 : 0.36
            }}
            transition={{
              duration: active === index ? 1.4 : 0.25,
              repeat: active === index ? Infinity : 0,
              ease: "easeInOut"
            }}
          />
        ))}

        <div className="container-page relative z-10 grid h-full items-start pt-28 md:items-center md:pt-0">
          <div className="max-w-3xl pb-24 md:py-24">
            <motion.div style={{ y: titleY, opacity: titleOpacity }}>
              <p className="inline-flex items-center gap-2 text-sm font-extrabold uppercase text-rosebrand-600">
                <Network size={17} aria-hidden />
                Ekosistem Telkom Schools
              </p>
              <h2 className="mt-4 text-4xl font-black leading-none text-zinc-900 sm:text-5xl md:text-7xl">
                Bagian Dari Yayasan Pendidikan Telkom
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-600 md:mt-6 md:text-xl md:leading-8">
                Jaringan pendidikan Telkom menaungi 32 PAUD, 3 SD, 4 SMP, dan 12 SMK yang tersebar di Indonesia.
                SMK Telkom Lampung menjadi bagian dari ekosistem ini untuk menghadirkan pendidikan vokasi digital di Sumatera.
              </p>
            </motion.div>

            <div className="relative mt-7 min-h-[230px] border-l-2 border-zinc-200 pl-6 md:mt-10 md:min-h-[300px] md:pl-8">
              <AnimatePresence mode="wait">
                <motion.article
                  key={activeStep.metric}
                  className="max-w-2xl"
                  initial={{ opacity: 0, y: 28, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -22, scale: 0.98 }}
                  transition={{ duration: 0.32, ease: "easeOut" }}
                >
                  <p className="text-xs font-extrabold uppercase text-zinc-400 md:text-sm">{activeStep.eyebrow}</p>
                  <div className="mt-4 flex items-center gap-3 md:mt-5 md:gap-4">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-rosebrand-500 text-white shadow-soft md:h-14 md:w-14">
                      <ActiveIcon size={23} aria-hidden />
                    </span>
                    <h3 className="text-3xl font-black leading-tight text-rosebrand-600 md:text-5xl">{activeStep.metric}</h3>
                  </div>
                  <h4 className="mt-4 text-2xl font-black leading-tight text-zinc-900 md:mt-5 md:text-4xl">{activeStep.title}</h4>
                  <p className="mt-3 text-base font-semibold leading-7 text-zinc-700 md:mt-4 md:text-lg md:leading-8">{activeStep.body}</p>
                </motion.article>
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="absolute bottom-7 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-zinc-950/88 p-2 text-white shadow-soft backdrop-blur">
          {ecosystemSteps.map((step, index) => (
            <button
              key={step.metric}
              type="button"
              aria-label={`Buka ${step.metric}`}
              onClick={() => goTo(index)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                active === index ? "w-9 bg-rosebrand-500" : "w-2.5 bg-white/45 hover:bg-white/80"
              }`}
            />
          ))}
        </div>

        <div className="absolute right-6 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-soft backdrop-blur lg:grid lg:gap-2">
          {ecosystemSteps.map((step, index) => {
            const Icon = step.icon;

            return (
              <button
                key={step.metric}
                type="button"
                aria-label={`Menuju ${step.metric}`}
                onClick={() => goTo(index)}
                className={`grid h-11 w-11 place-items-center rounded-full transition ${
                  active === index ? "bg-rosebrand-500 text-white" : "bg-white text-zinc-500 hover:text-rosebrand-600"
                }`}
              >
                <Icon size={18} aria-hidden />
              </button>
            );
          })}
        </div>

        <div className="absolute right-6 top-6 z-20 hidden items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-extrabold text-zinc-800 shadow-soft backdrop-blur md:inline-flex">
          <MapPin size={17} className="text-rosebrand-600" aria-hidden />
          Lampung dalam jaringan YPT
        </div>
      </div>
    </section>
  );
}
