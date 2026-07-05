"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Download, Eye, FileText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { API_URL } from "@/lib/api-config";
import { normalizeImageUrl } from "@/lib/image-url";
import type { TeachingModule } from "@/types/content";

type TeachingModuleReaderProps = {
  module: TeachingModule;
};

export function TeachingModuleReader({ module }: TeachingModuleReaderProps) {
  const [page, setPage] = useState(1);
  const fileUrl = normalizeImageUrl(module.fileUrl);
  const pageCount = Math.max(0, Number(module.pageCount || 0));
  const iframeUrl = useMemo(() => `${fileUrl}#page=${page}&view=FitH`, [fileUrl, page]);

  useEffect(() => {
    fetch(`${API_URL}/teaching-modules/${module.slug}/view`, {
      method: "POST",
      headers: { Accept: "application/json" }
    }).catch(() => undefined);
  }, [module.slug]);

  async function handleDownload() {
    await fetch(`${API_URL}/teaching-modules/${module.slug}/download`, {
      method: "POST",
      headers: { Accept: "application/json" }
    }).catch(() => undefined);

    const anchor = document.createElement("a");
    anchor.href = fileUrl;
    anchor.download = `${module.slug}.pdf`;
    anchor.target = "_blank";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  return (
    <section className="grid gap-6">
      <div className="flex flex-col justify-between gap-4 rounded-[8px] border border-zinc-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
        <div className="flex flex-wrap gap-3 text-sm font-black text-zinc-600">
          <span className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1.5">
            <Eye size={16} className="text-rosebrand-600" aria-hidden />
            {(module.viewCount || 0).toLocaleString("id-ID")} dibaca
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1.5">
            <Download size={16} className="text-rosebrand-600" aria-hidden />
            {(module.downloadCount || 0).toLocaleString("id-ID")} unduhan
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1.5">
            <FileText size={16} className="text-rosebrand-600" aria-hidden />
            {pageCount > 0 ? `${pageCount} halaman` : "PDF"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => void handleDownload()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-rosebrand-500 px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-rosebrand-600"
        >
          <Download size={17} aria-hidden />
          Unduh Modul
        </button>
      </div>

      <div className="rounded-[8px] bg-zinc-950 p-4 shadow-2xl md:p-6">
        <div className="mx-auto max-w-6xl">
          <div className="relative [perspective:2200px]">
            <div className="absolute -inset-3 rounded-[8px] bg-rosebrand-500/15 blur-3xl" />
            <div className="relative rounded-[8px] border border-white/10 bg-[linear-gradient(90deg,#18181b_0%,#27272a_49%,#0f0f12_50%,#27272a_51%,#18181b_100%)] p-3 shadow-2xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={page}
                  initial={{ opacity: 0, rotateY: -12, x: -18 }}
                  animate={{ opacity: 1, rotateY: 0, x: 0 }}
                  exit={{ opacity: 0, rotateY: 12, x: 18 }}
                  transition={{ duration: 0.34, ease: "easeOut" }}
                  className="overflow-hidden rounded-[6px] bg-white shadow-[0_26px_70px_rgba(0,0,0,0.45)]"
                >
                  <iframe
                    key={iframeUrl}
                    title={`Baca ${module.title}`}
                    src={iframeUrl}
                    className="h-[72vh] min-h-[520px] w-full border-0 bg-white"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div className="mt-5 flex flex-col items-center justify-between gap-4 text-white md:flex-row">
            <button
              type="button"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={page <= 1}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-white/10 px-5 text-sm font-extrabold transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={18} aria-hidden />
              Sebelumnya
            </button>
            <div className="text-center">
              <p className="text-sm font-black">
                {pageCount > 0 ? `Halaman ${page} dari ${pageCount}` : `Halaman ${page}`}
              </p>
              <p className="text-xs font-semibold text-white/50">Tampilan PDF dibuat seperti buku digital.</p>
            </div>
            <button
              type="button"
              onClick={() => setPage((value) => (pageCount > 0 ? Math.min(pageCount, value + 1) : value + 1))}
              disabled={pageCount > 0 && page >= pageCount}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-white/10 px-5 text-sm font-extrabold transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Berikutnya
              <ChevronRight size={18} aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
