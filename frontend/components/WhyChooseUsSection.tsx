import { ArrowRight, Code2, Cpu, GraduationCap, Network, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import type { WhyChooseUsItem } from "@/types/content";

const iconMap = {
  Network,
  Code2,
  Cpu,
  ShieldCheck,
  GraduationCap,
  Sparkles
};

export function WhyChooseUsSection({ items }: { items: WhyChooseUsItem[] }) {
  const sortedItems = [...items]
    .filter((item) => item.isActive !== false)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
    .slice(0, 6);

  if (sortedItems.length === 0) {
    return null;
  }

  const featured = sortedItems[0];
  const FeaturedIcon = iconMap[featured.icon as keyof typeof iconMap] || Network;

  return (
    <section className="relative overflow-hidden bg-zinc-950 py-20 text-white" id="why-smk-telkom">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(244,63,107,0.22),transparent_35%),linear-gradient(0deg,rgba(255,255,255,0.08),transparent_46%)]" />
      <div className="container-page relative z-10">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-extrabold uppercase text-rosebrand-200 ring-1 ring-white/10">
              <Sparkles size={17} aria-hidden />
              Why SMK Telkom Lampung
            </p>
            <h2 className="mt-5 max-w-3xl text-4xl font-black leading-tight md:text-6xl">
              Sekolah teknologi yang membuat pilihan masa depan terasa lebih jelas.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/68">
              Untuk siswa yang ingin belajar dengan arah, praktik, karakter, dan peluang. Untuk orang tua yang ingin melihat anaknya tumbuh di lingkungan produktif dan relevan dengan zaman.
            </p>
          </div>

          <article className="rounded-[8px] border border-white/10 bg-white p-6 text-zinc-950 shadow-soft md:p-8">
            <div className="flex items-start justify-between gap-5">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-rosebrand-500 text-white">
                <FeaturedIcon size={26} aria-hidden />
              </span>
              <span className="rounded-full bg-rosebrand-50 px-3 py-1 text-xs font-black uppercase text-rosebrand-700">
                {featured.highlight || "Pilihan utama"}
              </span>
            </div>
            <h3 className="mt-6 text-3xl font-black leading-tight">{featured.title}</h3>
            <p className="mt-4 text-base font-semibold leading-8 text-zinc-600">{featured.description}</p>
            <Link
              href="/spmb"
              className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-zinc-950 px-5 text-sm font-extrabold text-white transition hover:bg-rosebrand-600"
            >
              Mulai dari SPMB
              <ArrowRight size={17} aria-hidden />
            </Link>
          </article>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {sortedItems.slice(1).map((item) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap] || Sparkles;

            return (
              <article key={item.id} className="group rounded-[8px] border border-white/10 bg-white/[0.06] p-5 backdrop-blur transition hover:-translate-y-1 hover:bg-white">
                <div className="flex items-center justify-between gap-4">
                  <span className="grid h-11 w-11 place-items-center rounded-[8px] bg-white text-rosebrand-600 transition group-hover:bg-rosebrand-500 group-hover:text-white">
                    <Icon size={22} aria-hidden />
                  </span>
                  <span className="text-xs font-black uppercase text-white/45 transition group-hover:text-rosebrand-600">
                    {item.highlight || "Keunggulan"}
                  </span>
                </div>
                <h3 className="mt-5 text-xl font-black leading-tight text-white transition group-hover:text-zinc-950">{item.title}</h3>
                <p className="mt-3 text-sm font-semibold leading-7 text-white/62 transition group-hover:text-zinc-600">{item.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
