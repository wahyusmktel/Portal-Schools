"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const slides = [
  {
    title: "Talenta Digital Berkarakter",
    subtitle:
      "Portal utama SMK Telkom Lampung untuk informasi sekolah, inovasi siswa, dan perkembangan pendidikan teknologi.",
    image:
      "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1800&q=82"
  },
  {
    title: "Belajar Dekat dengan Industri",
    subtitle:
      "Program vokasi diarahkan pada praktik nyata, kolaborasi industri, dan budaya kerja profesional.",
    image:
      "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1800&q=82"
  },
  {
    title: "Ekosistem Sekolah Teknologi",
    subtitle:
      "Artikel, agenda, pengumuman, dan profil jurusan tersaji rapi untuk siswa, orang tua, alumni, dan masyarakat.",
    image:
      "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1800&q=82"
  }
];

export function HeroSlider() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const current = slides[active];

  const controls = useMemo(
    () => ({
      previous: () => setActive((value) => (value === 0 ? slides.length - 1 : value - 1)),
      next: () => setActive((value) => (value + 1) % slides.length)
    }),
    []
  );

  useEffect(() => {
    if (paused) {
      return;
    }

    const timer = window.setInterval(controls.next, 5200);
    return () => window.clearInterval(timer);
  }, [controls.next, paused]);

  return (
    <section className="relative min-h-screen overflow-hidden bg-zinc-950 text-white">
      <AnimatePresence mode="wait">
        <motion.div
          key={current.image}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${current.image})` }}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.03 }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/70 to-zinc-950/12" />
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-softgray to-transparent" />

      <div className="container-page relative z-10 flex min-h-screen items-center pt-24">
        <div className="max-w-3xl pb-16">
          <motion.p
            key={`eyebrow-${active}`}
            className="mb-5 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white/90 ring-1 ring-white/20 backdrop-blur"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Portal Resmi Sekolah
          </motion.p>
          <motion.h1
            key={`title-${active}`}
            className="text-5xl font-black leading-none md:text-7xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            {current.title}
          </motion.h1>
          <motion.p
            key={`subtitle-${active}`}
            className="mt-6 max-w-2xl text-lg leading-8 text-white/80 md:text-xl"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
          >
            {current.subtitle}
          </motion.p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href="#artikel"
              className="focus-ring rounded-full bg-rosebrand-500 px-6 py-3 text-sm font-extrabold text-white transition hover:bg-rosebrand-600"
            >
              Lihat Berita
            </a>
            <a
              href="#jurusan"
              className="focus-ring rounded-full bg-white/10 px-6 py-3 text-sm font-extrabold text-white ring-1 ring-white/25 backdrop-blur transition hover:bg-white/20"
            >
              Profil Jurusan
            </a>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full bg-zinc-950/60 px-4 py-3 text-white shadow-soft ring-1 ring-white/20 backdrop-blur">
        <button
          type="button"
          aria-label="Slide sebelumnya"
          className="focus-ring grid h-10 w-10 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"
          onClick={controls.previous}
        >
          <ArrowLeft size={18} aria-hidden />
        </button>
        <div className="flex items-center gap-2" aria-label="Indikator slide">
          {slides.map((slide, index) => (
            <button
              key={slide.title}
              type="button"
              aria-label={`Buka slide ${index + 1}`}
              className={`h-2.5 rounded-full transition ${
                index === active ? "w-9 bg-rosebrand-500" : "w-2.5 bg-white/50"
              }`}
              onClick={() => setActive(index)}
            />
          ))}
        </div>
        <button
          type="button"
          aria-label={paused ? "Lanjutkan slide otomatis" : "Jeda slide otomatis"}
          className="focus-ring grid h-10 w-10 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"
          onClick={() => setPaused((value) => !value)}
        >
          {paused ? <Play size={18} aria-hidden /> : <Pause size={18} aria-hidden />}
        </button>
        <button
          type="button"
          aria-label="Slide berikutnya"
          className="focus-ring grid h-10 w-10 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"
          onClick={controls.next}
        >
          <ArrowRight size={18} aria-hidden />
        </button>
      </div>
    </section>
  );
}
