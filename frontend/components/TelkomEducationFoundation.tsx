import { ArrowUpRight, GraduationCap, MapPin, Network, School2, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const educationStats = [
  {
    value: "32",
    label: "PAUD",
    description: "Fondasi karakter dan rasa ingin tahu sejak usia dini.",
    tone: "bg-rosebrand-50 text-rosebrand-700"
  },
  {
    value: "3",
    label: "SD",
    description: "Pembelajaran dasar yang membangun literasi, numerasi, dan disiplin.",
    tone: "bg-sky-50 text-sky-700"
  },
  {
    value: "4",
    label: "SMP",
    description: "Transisi akademik yang menyiapkan siswa masuk dunia teknologi.",
    tone: "bg-emerald-50 text-emerald-700"
  },
  {
    value: "12",
    label: "SMK",
    description: "Pendidikan vokasi digital, industri, dan karier masa depan.",
    tone: "bg-amber-50 text-amber-700"
  }
];

const ecosystemCards = [
  {
    title: "Jaringan Pendidikan Nasional",
    body: "YPT menaungi puluhan satuan pendidikan yang bergerak dalam standar mutu, budaya digital, dan koneksi industri yang sama."
  },
  {
    title: "Lampung Ikut Bergerak",
    body: "SMK Telkom Lampung menjadi bagian dari ekosistem tersebut untuk menghadirkan pendidikan vokasi teknologi di Sumatera."
  },
  {
    title: "Standar Telkom Schools",
    body: "Pembelajaran diarahkan untuk membentuk lulusan yang adaptif, percaya diri, dan siap bersaing di dunia kerja digital."
  },
  {
    title: "Kolaborasi Industri",
    body: "Lingkungan belajar diperkuat oleh praktik, proyek, dan kultur profesional yang dekat dengan kebutuhan industri."
  }
];

export function TelkomEducationFoundation() {
  const marqueeCards = [...ecosystemCards, ...ecosystemCards];

  return (
    <section className="relative overflow-hidden bg-zinc-950 py-20 text-white" id="yayasan-pendidikan-telkom">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(244,63,107,0.16),transparent_34%),linear-gradient(0deg,rgba(255,255,255,0.08),transparent_42%)]" />
      <div className="container-page relative z-10">
        <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-extrabold uppercase text-rosebrand-300">
              <Network size={17} aria-hidden />
              Ekosistem Telkom Schools
            </p>
            <h2 className="mt-4 max-w-3xl text-4xl font-black leading-tight md:text-5xl">
              Bagian Dari Yayasan Pendidikan Telkom
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/70">
              SMK Telkom Lampung hadir sebagai bagian dari jaringan pendidikan Telkom yang tersebar di seluruh Indonesia.
              Di bawah Yayasan Pendidikan Telkom, sekolah ini membawa semangat vokasi digital, karakter profesional,
              dan peluang masa depan yang lebih dekat untuk generasi Lampung.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {educationStats.map((stat) => (
                <div key={stat.label} className="rounded-[8px] border border-white/10 bg-white p-5 text-zinc-900 shadow-soft">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-4xl font-black">{stat.value}</p>
                      <p className="mt-1 text-sm font-extrabold uppercase text-zinc-500">{stat.label}</p>
                    </div>
                    <span className={`grid h-11 w-11 place-items-center rounded-full ${stat.tone}`}>
                      <School2 size={20} aria-hidden />
                    </span>
                  </div>
                  <p className="mt-4 text-sm font-semibold leading-6 text-zinc-600">{stat.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/profil"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-rosebrand-500 px-5 text-sm font-extrabold text-white shadow-soft transition duration-300 hover:-translate-y-1 hover:bg-rosebrand-600"
              >
                Kenali Sekolah
                <ArrowUpRight size={17} aria-hidden />
              </Link>
              <Link
                href="/jurusan"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 text-sm font-extrabold text-white transition duration-300 hover:-translate-y-1 hover:bg-white/15"
              >
                Lihat Jurusan
                <GraduationCap size={17} aria-hidden />
              </Link>
            </div>
          </div>

          <div className="relative min-h-[460px] overflow-hidden rounded-[8px] border border-white/10 bg-white/[0.04] shadow-soft">
            <Image
              src="/images/telkom-foundation-map.webp"
              alt="Visual peta jaringan Telkom di Indonesia"
              fill
              sizes="(min-width: 1024px) 52vw, 100vw"
              className="object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />
            <div className="absolute left-6 top-6 inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-extrabold text-zinc-900 shadow-soft">
              <MapPin size={17} className="text-rosebrand-600" aria-hidden />
              Lampung dalam jaringan YPT
            </div>
            <div className="absolute bottom-6 left-6 right-6 rounded-[8px] border border-white/10 bg-zinc-950/78 p-5 backdrop-blur">
              <p className="flex items-center gap-2 text-sm font-extrabold uppercase text-rosebrand-300">
                <Sparkles size={17} aria-hidden />
                Dari Indonesia untuk masa depan digital
              </p>
              <p className="mt-3 text-2xl font-black leading-tight">
                51 satuan pendidikan, satu visi: mencetak talenta unggul yang siap tumbuh bersama industri.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 overflow-hidden">
          <div className="foundation-marquee-track flex w-max gap-4">
            {marqueeCards.map((item, index) => (
              <article
                key={`${item.title}-${index}`}
                className="flex h-52 w-[300px] shrink-0 flex-col justify-between rounded-[8px] border border-white/10 bg-white p-5 text-zinc-900 shadow-soft sm:w-[360px]"
              >
                <div>
                  <p className="text-xs font-extrabold uppercase text-rosebrand-600">Telkom Education Network</p>
                  <h3 className="mt-3 text-2xl font-black leading-tight">{item.title}</h3>
                </div>
                <p className="text-sm font-semibold leading-6 text-zinc-600">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
