"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarCheck2, CalendarClock, CalendarDays, Check, Clock3, MapPin } from "lucide-react";
import type { Agenda } from "@/types/content";
import { formatDateRange } from "@/lib/article-utils";

type Filter = "all" | "upcoming" | "completed";

const SITE_TIME_ZONE = "Asia/Jakarta";

function dayKey(value: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SITE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date(value));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || "00";
  return Number(`${get("year")}${get("month")}${get("day")}`);
}

function monthLabel(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: SITE_TIME_ZONE
  }).format(new Date(value));
}

export function AgendaArchive({ items, nowIso }: { items: Agenda[]; nowIso: string }) {
  const [filter, setFilter] = useState<Filter>("all");
  const today = dayKey(nowIso);
  const { upcoming, completed } = useMemo(() => {
    const future = items
      .filter((item) => dayKey(item.endsAt || item.startsAt) >= today)
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
    const past = items
      .filter((item) => dayKey(item.endsAt || item.startsAt) < today)
      .sort((a, b) => new Date(b.endsAt || b.startsAt).getTime() - new Date(a.endsAt || a.startsAt).getTime());
    return { upcoming: future, completed: past };
  }, [items, today]);

  const sections = filter === "upcoming"
    ? [{ key: "upcoming", title: "Akan Datang", description: "Jadwal kegiatan yang perlu Anda nantikan.", items: upcoming, upcoming: true }]
    : filter === "completed"
      ? [{ key: "completed", title: "Sudah Terlaksana", description: "Dokumentasi waktu kegiatan yang telah selesai.", items: completed, upcoming: false }]
      : [
          { key: "upcoming", title: "Akan Datang", description: "Jadwal kegiatan yang perlu Anda nantikan.", items: upcoming, upcoming: true },
          { key: "completed", title: "Sudah Terlaksana", description: "Dokumentasi waktu kegiatan yang telah selesai.", items: completed, upcoming: false }
        ];

  return (
    <>
      <section className="relative overflow-hidden bg-rosebrand-600 text-white">
        <div className="container-page relative grid min-h-[390px] items-end gap-10 py-16 md:grid-cols-[1fr_auto] md:py-20">
          <div className="max-w-4xl">
            <p className="inline-flex items-center gap-2 text-sm font-extrabold uppercase text-white/75">
              <CalendarDays size={18} aria-hidden /> Kalender Sekolah
            </p>
            <h1 className="mt-5 text-5xl font-black leading-none md:text-7xl">Agenda Sekolah</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/80">
              Ikuti perjalanan kegiatan SMK Telkom Lampung, dari agenda akademik, perayaan, hingga program pengembangan siswa sepanjang tahun.
            </p>
          </div>
          <div className="hidden h-44 w-44 place-items-center border border-white/25 md:grid" aria-hidden>
            <CalendarDays size={82} strokeWidth={1.2} className="text-white/80" />
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-200 bg-zinc-50">
        <div className="container-page grid gap-5 py-7 md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex flex-wrap gap-x-7 gap-y-3 text-sm font-bold text-zinc-600">
            <span className="inline-flex items-center gap-2"><CalendarDays size={17} className="text-rosebrand-600" /> {items.length} total agenda</span>
            <span className="inline-flex items-center gap-2"><CalendarClock size={17} className="text-rosebrand-600" /> {upcoming.length} akan datang</span>
            <span className="inline-flex items-center gap-2"><CalendarCheck2 size={17} className="text-zinc-500" /> {completed.length} terlaksana</span>
          </div>
          <div className="inline-flex w-fit rounded-[8px] border border-zinc-200 bg-white p-1 shadow-sm" aria-label="Filter agenda">
            {([
              ["all", "Semua"],
              ["upcoming", "Akan Datang"],
              ["completed", "Terlaksana"]
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`h-9 rounded-[6px] px-4 text-xs font-extrabold transition ${filter === value ? "bg-rosebrand-600 text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-14 md:py-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={filter}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28 }}
            className="space-y-16"
          >
            {sections.map((section) => (
              <AgendaSection
                key={section.key}
                title={section.title}
                description={section.description}
                items={section.items}
                upcoming={section.upcoming}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </section>
    </>
  );
}

function AgendaSection({ title, description, items, upcoming }: { title: string; description: string; items: Agenda[]; upcoming: boolean }) {
  return (
    <section>
      <div className="flex items-start gap-4 border-b border-zinc-200 pb-6">
        <div className={`grid size-11 shrink-0 place-items-center rounded-[8px] ${upcoming ? "bg-rosebrand-600 text-white" : "bg-zinc-200 text-zinc-600"}`}>
          {upcoming ? <Clock3 size={21} /> : <Check size={21} />}
        </div>
        <div>
          <h2 className="text-3xl font-black text-zinc-950">{title}</h2>
          <p className="mt-1 text-zinc-500">{description}</p>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="relative mt-3 before:absolute before:bottom-0 before:left-[19px] before:top-0 before:w-px before:bg-zinc-200 md:before:left-[127px]">
          {items.map((item, index) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.35, delay: Math.min(index * 0.035, 0.2) }}
              className="relative grid gap-3 border-b border-zinc-100 py-7 pl-12 last:border-b-0 md:grid-cols-[104px_1fr_auto] md:items-center md:gap-7 md:pl-0"
            >
              <p className="hidden text-right text-sm font-black uppercase text-zinc-400 md:block">{monthLabel(item.startsAt)}</p>
              <span className={`absolute left-[13px] top-9 size-[13px] rounded-full border-[3px] border-white md:left-[121px] ${upcoming ? "bg-rosebrand-600 ring-4 ring-rosebrand-100" : "bg-zinc-400 ring-4 ring-zinc-100"}`} aria-hidden />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase ${upcoming ? "bg-rosebrand-50 text-rosebrand-700" : "bg-zinc-100 text-zinc-500"}`}>
                    {upcoming ? "Akan Datang" : "Terlaksana"}
                  </span>
                  <span className="text-sm font-bold text-zinc-500 md:hidden">{monthLabel(item.startsAt)}</span>
                </div>
                <h3 className={`mt-3 text-xl font-black leading-snug ${upcoming ? "text-zinc-950" : "text-zinc-600"}`}>{item.title}</h3>
                <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-zinc-500">
                  <MapPin size={15} className={upcoming ? "text-rosebrand-600" : "text-zinc-400"} aria-hidden />
                  {item.location}
                </p>
              </div>
              <time className={`w-fit rounded-[8px] px-4 py-3 text-sm font-extrabold md:min-w-52 md:text-center ${upcoming ? "bg-rosebrand-600 text-white" : "border border-zinc-200 bg-white text-zinc-500"}`}>
                {formatDateRange(item.startsAt, item.endsAt)}
              </time>
            </motion.article>
          ))}
        </div>
      ) : (
        <div className="py-14 text-center text-zinc-500">
          <CalendarDays size={36} className="mx-auto text-zinc-300" />
          <p className="mt-4 font-bold">Belum ada agenda pada kategori ini.</p>
        </div>
      )}
    </section>
  );
}
