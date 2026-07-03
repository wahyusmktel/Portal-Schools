"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Loader2, Megaphone, Newspaper, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { API_URL } from "@/lib/api-config";
import type { Agenda, Announcement, Article } from "@/types/content";

type SearchResult = {
  id: string;
  title: string;
  description: string;
  type: "Artikel" | "Pengumuman" | "Agenda";
  href: string;
};

export function HeaderLiveSearch({ onNavigate }: { onNavigate?: () => void }) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadSearchData() {
      if (!focused || articles.length || announcements.length || agendas.length) {
        return;
      }

      setLoading(true);
      try {
        const [articleRes, announcementRes, agendaRes] = await Promise.all([
          fetch(`${API_URL}/articles`, { headers: { Accept: "application/json" } }),
          fetch(`${API_URL}/announcements`, { headers: { Accept: "application/json" } }),
          fetch(`${API_URL}/agendas`, { headers: { Accept: "application/json" } })
        ]);

        if (cancelled) return;

        setArticles(articleRes.ok ? await articleRes.json() : []);
        setAnnouncements(announcementRes.ok ? await announcementRes.json() : []);
        setAgendas(agendaRes.ok ? await agendaRes.json() : []);
      } catch {
        if (!cancelled) {
          setArticles([]);
          setAnnouncements([]);
          setAgendas([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSearchData();
    return () => {
      cancelled = true;
    };
  }, [agendas.length, announcements.length, articles.length, focused]);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (term.length < 2) return [];

    const articleResults: SearchResult[] = articles
      .filter((item) => `${item.title} ${item.excerpt} ${item.category}`.toLowerCase().includes(term))
      .slice(0, 4)
      .map((item) => ({
        id: `article-${item.id}`,
        title: item.title,
        description: item.excerpt,
        type: "Artikel",
        href: `/artikel/${item.slug}`
      }));

    const announcementResults: SearchResult[] = announcements
      .filter((item) => `${item.title} ${item.body}`.toLowerCase().includes(term))
      .slice(0, 3)
      .map((item) => ({
        id: `announcement-${item.id}`,
        title: item.title,
        description: item.body,
        type: "Pengumuman",
        href: "/#agenda"
      }));

    const agendaResults: SearchResult[] = agendas
      .filter((item) => `${item.title} ${item.location}`.toLowerCase().includes(term))
      .slice(0, 3)
      .map((item) => ({
        id: `agenda-${item.id}`,
        title: item.title,
        description: item.location,
        type: "Agenda",
        href: "/#agenda"
      }));

    return [...articleResults, ...announcementResults, ...agendaResults].slice(0, 7);
  }, [agendas, announcements, articles, query]);

  const isOpen = focused && (query.trim().length > 0 || loading);

  function iconFor(type: SearchResult["type"]) {
    if (type === "Artikel") return <Newspaper size={16} aria-hidden />;
    if (type === "Agenda") return <Calendar size={16} aria-hidden />;
    return <Megaphone size={16} aria-hidden />;
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" aria-hidden />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Cari informasi..."
          className="h-10 w-full rounded-full border border-zinc-200 bg-zinc-50 pl-10 pr-10 text-sm font-bold text-zinc-700 outline-none transition focus:border-rosebrand-300 focus:bg-white focus:ring-4 focus:ring-rosebrand-100"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Bersihkan pencarian"
          >
            <X size={15} aria-hidden />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute right-0 top-full z-50 mt-3 w-[min(92vw,420px)] overflow-hidden rounded-[8px] border border-zinc-100 bg-white shadow-2xl"
          >
            <div className="border-b border-zinc-100 px-4 py-3">
              <p className="text-xs font-black uppercase text-zinc-400">Live Search</p>
            </div>
            <div className="max-h-[360px] overflow-y-auto p-2">
              {loading && (
                <div className="flex items-center gap-2 px-3 py-4 text-sm font-bold text-zinc-500">
                  <Loader2 size={16} className="animate-spin" aria-hidden />
                  Memuat data pencarian...
                </div>
              )}

              {!loading && query.trim().length < 2 && (
                <p className="px-3 py-4 text-sm font-semibold text-zinc-500">Ketik minimal 2 huruf untuk mencari artikel, pengumuman, atau agenda.</p>
              )}

              {!loading && query.trim().length >= 2 && results.length === 0 && (
                <p className="px-3 py-4 text-sm font-semibold text-zinc-500">Tidak ada hasil yang cocok.</p>
              )}

              {!loading && results.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => {
                    setFocused(false);
                    onNavigate?.();
                  }}
                  className="group grid grid-cols-[38px_1fr] gap-3 rounded-[8px] p-3 transition hover:bg-rosebrand-50"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-zinc-100 text-rosebrand-600 transition group-hover:bg-white">
                    {iconFor(item.type)}
                  </span>
                  <span>
                    <span className="flex items-center gap-2">
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-black uppercase text-zinc-500 group-hover:bg-white">{item.type}</span>
                    </span>
                    <span className="mt-1 line-clamp-1 text-sm font-black text-zinc-900">{item.title}</span>
                    <span className="mt-0.5 line-clamp-2 text-xs font-semibold leading-5 text-zinc-500">{item.description}</span>
                  </span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
