"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Download, Images } from "lucide-react";
import { useMemo, useState } from "react";
import { normalizeImageUrl } from "@/lib/image-url";

type SpmbBrochureFlipbookProps = {
  images: string[];
  academicYear: string;
};

export function SpmbBrochureFlipbook({ images, academicYear }: SpmbBrochureFlipbookProps) {
  const pages = useMemo(
    () => images.map((image) => image.trim()).filter(Boolean),
    [images]
  );
  const [active, setActive] = useState(0);
  const current = pages[active];

  if (!current) {
    return null;
  }

  const previous = () => setActive((value) => (value === 0 ? pages.length - 1 : value - 1));
  const next = () => setActive((value) => (value + 1) % pages.length);

  return (
    <section id="brosur" className="bg-zinc-950 py-20 text-white">
      <div className="container-page">
        <div className="grid gap-10 lg:grid-cols-[0.42fr_0.58fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-extrabold uppercase text-rosebrand-200">
              <Images size={17} aria-hidden />
              Brosur SPMB {academicYear}
            </p>
            <h2 className="mt-5 text-4xl font-black tracking-normal md:text-5xl">
              Buka brosur digital, lihat programnya, lalu amankan kursimu.
            </h2>
            <p className="mt-5 text-lg font-semibold leading-8 text-white/65">
              Geser halaman brosur untuk melihat informasi penerimaan murid baru, pilihan jurusan, dan penawaran pendaftaran yang sedang berjalan.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href={normalizeImageUrl(current)}
                download
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-rosebrand-500 px-5 text-sm font-extrabold text-white transition hover:bg-rosebrand-600"
              >
                <Download size={17} aria-hidden />
                Unduh Halaman Ini
              </a>
              <a
                href="/spmb/pendaftaran"
                className="inline-flex h-11 items-center justify-center rounded-[8px] border border-white/15 bg-white/10 px-5 text-sm font-extrabold text-white transition hover:bg-white/20"
              >
                Daftar Sekarang
              </a>
            </div>
          </div>

          <div className="grid gap-5">
            <div className="relative mx-auto w-full max-w-3xl [perspective:1800px]">
              <div className="absolute -inset-3 rounded-[8px] bg-rosebrand-500/20 blur-2xl" />
              <div className="relative overflow-hidden rounded-[8px] border border-white/10 bg-white/8 p-3 shadow-2xl backdrop-blur">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[6px] bg-zinc-900">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={current}
                      initial={{ opacity: 0, rotateY: active === 0 ? -18 : 18, x: active === 0 ? -24 : 24 }}
                      animate={{ opacity: 1, rotateY: 0, x: 0 }}
                      exit={{ opacity: 0, rotateY: -14, x: -20 }}
                      transition={{ duration: 0.42, ease: "easeOut" }}
                      className="absolute inset-0 origin-left"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={normalizeImageUrl(current)} alt={`Brosur SPMB halaman ${active + 1}`} className="h-full w-full object-contain" />
                      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-black/25 to-transparent" />
                      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black/20 to-transparent" />
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={previous}
                    className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                    aria-label="Halaman brosur sebelumnya"
                  >
                    <ChevronLeft size={20} aria-hidden />
                  </button>
                  <div className="text-center">
                    <p className="text-sm font-black">Halaman {active + 1} dari {pages.length}</p>
                    <p className="text-xs font-semibold text-white/50">Klik thumbnail untuk pindah halaman</p>
                  </div>
                  <button
                    type="button"
                    onClick={next}
                    className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                    aria-label="Halaman brosur berikutnya"
                  >
                    <ChevronRight size={20} aria-hidden />
                  </button>
                </div>
              </div>
            </div>

            {pages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {pages.map((page, index) => (
                  <button
                    key={`${page}-${index}`}
                    type="button"
                    onClick={() => setActive(index)}
                    className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-[8px] border transition ${index === active ? "border-rosebrand-400 ring-2 ring-rosebrand-400/30" : "border-white/10 opacity-65 hover:opacity-100"}`}
                    aria-label={`Buka halaman brosur ${index + 1}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={normalizeImageUrl(page)} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
