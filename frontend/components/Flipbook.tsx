"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

type FlipbookProps = {
  pages: string[]; // array of image URLs
};

export default function Flipbook({ pages }: FlipbookProps) {
  const [currentPage, setCurrentPage] = useState(0);

  const next = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const prev = () => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  if (!pages || pages.length === 0) {
    return <div className="text-center p-10 text-zinc-500">Belum ada halaman brosur.</div>;
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center">
      {/* 3D Container */}
      <div 
        className="relative w-full aspect-[1/1.4] sm:aspect-[4/3] md:aspect-[16/9] perspective-[2000px] bg-zinc-100 rounded-lg shadow-inner overflow-hidden flex items-center justify-center"
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={currentPage}
            src={pages[currentPage]}
            alt={`Page ${currentPage + 1}`}
            initial={{ opacity: 0, rotateY: 90, scale: 0.9 }}
            animate={{ opacity: 1, rotateY: 0, scale: 1 }}
            exit={{ opacity: 0, rotateY: -90, scale: 0.9 }}
            transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
            className="w-full h-full object-contain origin-left shadow-2xl drop-shadow-2xl"
          />
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6 mt-8">
        <button
          onClick={prev}
          disabled={currentPage === 0}
          className="h-12 w-12 rounded-full bg-white shadow flex items-center justify-center text-zinc-700 hover:bg-rosebrand-50 hover:text-rosebrand-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="text-sm font-bold text-zinc-500 bg-white px-4 py-2 rounded-full shadow-sm">
          Halaman {currentPage + 1} dari {pages.length}
        </div>
        <button
          onClick={next}
          disabled={currentPage === pages.length - 1}
          className="h-12 w-12 rounded-full bg-white shadow flex items-center justify-center text-zinc-700 hover:bg-rosebrand-50 hover:text-rosebrand-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
}
