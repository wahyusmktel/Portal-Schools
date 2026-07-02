"use client";

import { useState } from "react";
import { FAQ } from "@/types/content";
import { HelpCircle, Search, ChevronDown, MessageCircle, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ClientBantuanPage({ initialFaqs }: { initialFaqs: FAQ[] }) {
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);

  const filteredFaqs = initialFaqs.filter(faq => 
    faq.question.toLowerCase().includes(search.toLowerCase()) || 
    faq.answer.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => a.sortOrder - b.sortOrder);

  // Group by category
  const categories = Array.from(new Set(filteredFaqs.map(f => f.category || "Umum")));
  
  return (
    <main className="min-h-screen bg-zinc-50 pt-28 pb-20">
      <div className="mx-auto max-w-4xl px-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-500 mb-10">
          <a href="/" className="hover:text-rosebrand-600 transition-colors">Beranda</a>
          <ChevronRight size={14} />
          <span className="text-zinc-900">Pusat Bantuan</span>
        </div>
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-rosebrand-100 text-rosebrand-600 mb-6">
            <HelpCircle size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-zinc-900 mb-4 tracking-tight">
            Pusat Bantuan & FAQ
          </h1>
          <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
            Temukan jawaban untuk pertanyaan yang sering diajukan seputar pendaftaran, fasilitas, dan kegiatan akademik.
          </p>
        </div>

        <div className="relative mb-12 shadow-xl shadow-zinc-200/50 rounded-2xl overflow-hidden">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400" size={24} />
          <input 
            type="text" 
            placeholder="Ketik kata kunci pertanyaan Anda..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-16 pr-6 py-5 text-lg rounded-2xl border-2 border-transparent bg-white focus:outline-none focus:border-rosebrand-500 transition-all font-semibold text-zinc-800 placeholder:font-medium placeholder:text-zinc-400"
          />
        </div>

        {filteredFaqs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-zinc-100">
            <h3 className="text-xl font-bold text-zinc-900 mb-2">Tidak ditemukan jawaban</h3>
            <p className="text-zinc-500">Coba gunakan kata kunci lain.</p>
          </div>
        ) : (
          <div className="grid gap-12">
            {categories.map(category => {
              const categoryFaqs = filteredFaqs.filter(f => (f.category || "Umum") === category);
              if (categoryFaqs.length === 0) return null;
              
              return (
                <div key={category}>
                  <h2 className="text-2xl font-black text-zinc-900 mb-6 flex items-center gap-3">
                    <span className="h-8 w-2 bg-rosebrand-500 rounded-full" />
                    {category}
                  </h2>
                  <div className="grid gap-4">
                    {categoryFaqs.map(faq => (
                      <div 
                        key={faq.id} 
                        className="bg-white rounded-2xl border border-zinc-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                      >
                        <button
                          onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                          className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                        >
                          <h3 className="text-lg font-bold text-zinc-900 pr-8">{faq.question}</h3>
                          <ChevronDown 
                            size={20} 
                            className={`text-zinc-400 transition-transform duration-300 shrink-0 ${openId === faq.id ? "rotate-180 text-rosebrand-600" : ""}`} 
                          />
                        </button>
                        <AnimatePresence>
                          {openId === faq.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-6 pt-0 text-zinc-600 leading-relaxed border-t border-zinc-50 mt-2">
                                {faq.answer}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-16 bg-rosebrand-600 rounded-3xl p-8 md:p-12 text-center shadow-xl shadow-rosebrand-900/10 relative overflow-hidden">
          <div className="relative z-10">
            <MessageCircle className="mx-auto h-12 w-12 text-white/80 mb-6" />
            <h2 className="text-2xl font-black text-white mb-4">Masih Butuh Bantuan?</h2>
            <p className="text-rosebrand-100 max-w-lg mx-auto mb-8 font-medium">
              Jika Anda tidak dapat menemukan jawaban atas pertanyaan Anda, silakan hubungi tim dukungan kami.
            </p>
            <a href="/#kontak" className="inline-flex items-center justify-center px-8 py-4 text-sm font-bold text-rosebrand-600 bg-white rounded-full hover:bg-zinc-50 transition-colors shadow-lg hover:shadow-xl">
              Hubungi Kami
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
