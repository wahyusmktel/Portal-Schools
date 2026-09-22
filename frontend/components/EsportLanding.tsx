"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Users,
  Swords,
  MapPin,
  Calendar,
  ShieldAlert,
  ChevronDown,
  Sparkles,
  Gamepad2,
  Flame,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  HelpCircle,
  Crown,
  Medal,
  Cpu,
  Zap,
  ArrowRight,
  MonitorSmartphone,
  Share2
} from "lucide-react";

export function EsportLanding({ schoolName = "SMK Telkom Lampung" }: { schoolName?: string }) {
  const [activeTab, setActiveTab] = useState<"overview" | "rules" | "prizes" | "schedule">("overview");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Form State
  const [teamName, setTeamName] = useState("");
  const [schoolOrigin, setSchoolOrigin] = useState("");
  const [captainName, setCaptainName] = useState("");
  const [captainWa, setCaptainWa] = useState("");
  const [captainId, setCaptainId] = useState("");
  const [rosterMembers, setRosterMembers] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName || !captainName || !captainWa) {
      alert("Mohon lengkapi Nama Tim, Nama Kapten, dan No WhatsApp.");
      return;
    }

    const message = `*PENDAFTARAN STELLA ESPORT CHAMPIONSHIP SEASON 2 (2027)*
-----------------------------------------
🎮 *Nama Tim:* ${teamName}
🏫 *Asal Sekolah:* ${schoolOrigin || "-"}
👑 *Nama Kapten:* ${captainName}
📱 *WhatsApp Kapten:* ${captainWa}
🆔 *ID & Server MLBB Kapten:* ${captainId || "-"}
👥 *Roster Anggota:*
${rosterMembers || "-"}

Halo Panitia E-Sport SMK Telkom Lampung, saya ingin mendaftarkan tim kami untuk Turnamen Mobile Legends Season 2 2027. Mohon informasi verifikasi dan langkah berikutnya!`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/6281179701215?text=${encoded}`, "_blank");
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "STELLA E-Sport Championship Season 2 (2027)",
        text: "Ikuti Turnamen Mobile Legends: Bang Bang Pelajar Terbesar Lampung oleh SMK Telkom Lampung!",
        url: window.location.href,
      }).catch(() => null);
    } else {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const faqs = [
    {
      q: "Siapa saja yang boleh mengikuti turnamen ini?",
      a: "Turnamen ini terbuka untuk seluruh pelajar aktif jenjang SMP/MTs dan SMA/SMK sederajat se-Provinsi Lampung dan Nasional. Satu tim beranggotakan 5 pemain inti dan maksimal 1 pemain cadangan."
    },
    {
      q: "Apakah diperbolehkan anggota tim berasal dari sekolah yang berbeda?",
      a: "Boleh! Kami membuka slot untuk tim representasi sekolah (almamater yang sama) maupun tim campuran antarsekolah asalkan seluruh anggotanya berstatus pelajar aktif."
    },
    {
      q: "Device apa saja yang diperbolehkan selama turnamen?",
      a: "Hanya smartphone (Android / iOS) yang diperbolehkan. Demi menjunjung tinggi keadilan kompetisi, penggunaan iPad/Tablet serta Emulator PC dilarang keras."
    },
    {
      q: "Apakah hero baru atau skin diperbolehkan?",
      a: "Format turnamen menggunakan 5v5 Custom Draft Pick. Seluruh skin diperbolehkan (Skin ON). Hero baru yang baru dirilis kurang dari 2 minggu sebelum turnamen berlangsung dilarang digunakan (Global Ban)."
    },
    {
      q: "Bagaimana alur babak kualifikasi hingga Grand Final?",
      a: "Babak kualifikasi hingga perempat final diadakan secara ONLINE melalui sistem koordinasi grup WhatsApp/Discord. Sementara babak Semifinal dan Grand Final akan dilangsungkan secara OFFLINE di panggung megah Hall SMK Telkom Lampung."
    }
  ];

  return (
    <div className="min-h-screen bg-[#070b14] text-zinc-100 selection:bg-rose-600 selection:text-white relative overflow-hidden font-sans">
      {/* Background Cyber Glow & Grid Effects */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d0d_1px,transparent_1px),linear-gradient(to_bottom,#1f293d0d_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-rose-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[450px] h-[450px] bg-cyan-600/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-10 w-[550px] h-[550px] bg-red-600/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Floating Esports Quick Bar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#070b14]/85 border-b border-white/10 px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center shadow-lg shadow-rose-600/30 group-hover:scale-105 transition">
                <Gamepad2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-black tracking-wider text-base sm:text-lg bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-100 to-zinc-400">
                  STELLA <span className="text-rose-500">E-SPORT</span>
                </span>
                <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-extrabold uppercase rounded bg-rose-950/60 text-rose-400 border border-rose-800/40">
                  Season 2 • 2027
                </span>
              </div>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-zinc-300">
            <a href="#mascot" className="hover:text-rose-400 transition">Maskot Robot</a>
            <a href="#prizepool" className="hover:text-rose-400 transition">Hadiah</a>
            <a href="#timeline" className="hover:text-rose-400 transition">Jadwal</a>
            <a href="#rules" className="hover:text-rose-400 transition">Regulasi</a>
            <a href="#heroes" className="hover:text-rose-400 transition">Battle Area</a>
            <a href="#faq" className="hover:text-rose-400 transition">FAQ</a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="px-3 py-1.5 text-xs font-semibold text-zinc-400 hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition"
            >
              Portal Utama
            </Link>
            <a
              href="#registration"
              className="px-4 py-2 text-xs sm:text-sm font-bold uppercase tracking-wider rounded-lg bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-lg shadow-rose-600/25 hover:shadow-rose-600/40 transition-all flex items-center gap-1.5"
            >
              <Flame className="w-4 h-4" />
              Daftar Sekarang
            </a>
          </div>
        </div>
      </nav>

      {/* ===================== HERO SECTION ===================== */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-7 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-rose-950/80 to-zinc-900 border border-rose-600/40 text-rose-300 text-xs sm:text-sm font-bold tracking-wide mb-6 shadow-md shadow-rose-950/30">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <span>OFFICIAL TOURNAMENT • SEASON 2 TAHUN 2027</span>
              </div>

              <h1 className="text-4xl sm:text-6xl xl:text-7xl font-black tracking-tight leading-[1.08] text-white">
                STELLA <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-500 via-red-400 to-amber-300 drop-shadow-[0_0_25px_rgba(244,63,94,0.35)]">E-SPORT</span>
                <br />
                <span className="text-2xl sm:text-4xl xl:text-5xl font-extrabold text-zinc-200 tracking-normal block mt-2">
                  MOBILE LEGENDS: BANG BANG
                </span>
              </h1>

              <p className="mt-6 text-base sm:text-lg text-zinc-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Ajang adu mekanik, strategi draft pick, dan pembuktian mental juara antarpelajar se-Provinsi Lampung! Rebut supremasi tahta tertinggi Land of Dawn di panggung megah {schoolName}.
              </p>

              {/* Tournament Key Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 my-8 text-left">
                <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/10 backdrop-blur-md">
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase mb-1">
                    <Trophy className="w-4 h-4" /> Hadiah
                  </div>
                  <div className="text-lg font-black text-white">Rp 5 Juta+</div>
                  <div className="text-[11px] text-zinc-400">Piala + Sertifikat</div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/10 backdrop-blur-md">
                  <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase mb-1">
                    <Users className="w-4 h-4" /> Kuota
                  </div>
                  <div className="text-lg font-black text-white">64 Tim</div>
                  <div className="text-[11px] text-zinc-400">Slot Terbatas</div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/10 backdrop-blur-md">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase mb-1">
                    <Swords className="w-4 h-4" /> Mode
                  </div>
                  <div className="text-lg font-black text-white">Custom 5v5</div>
                  <div className="text-[11px] text-zinc-400">Draft Pick Mode</div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/10 backdrop-blur-md">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase mb-1">
                    <MapPin className="w-4 h-4" /> Venue
                  </div>
                  <div className="text-lg font-black text-white">Hybrid</div>
                  <div className="text-[11px] text-zinc-400">Online & Grand Final Offline</div>
                </div>
              </div>

              {/* CTA Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                <a
                  href="#registration"
                  className="px-8 py-4 rounded-xl text-sm sm:text-base font-black tracking-wider uppercase bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 text-white shadow-xl shadow-rose-600/30 hover:shadow-rose-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3"
                >
                  <Flame className="w-5 h-5 text-amber-300" />
                  Daftarkan Tim Kamu
                </a>

                <a
                  href="#rules"
                  className="px-6 py-4 rounded-xl text-sm sm:text-base font-bold bg-white/5 hover:bg-white/10 border border-white/15 text-zinc-200 hover:text-white transition flex items-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5 text-rose-400" />
                  Buku Regulasi
                </a>

                <button
                  onClick={handleShare}
                  className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-zinc-300 hover:text-white transition"
                  title="Bagikan Info Turnamen"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              {isCopied && (
                <div className="mt-3 text-xs font-semibold text-emerald-400 flex items-center gap-1.5 justify-center lg:justify-start">
                  <CheckCircle2 className="w-4 h-4" /> Link turnamen berhasil disalin ke clipboard!
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Hero Image Card (Arena + Mascot Spotlight) */}
          <div className="lg:col-span-5 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative mx-auto max-w-md lg:max-w-none"
            >
              {/* Outer Neon Frame */}
              <div className="relative rounded-3xl p-1 bg-gradient-to-b from-rose-500/50 via-zinc-800/80 to-cyan-500/30 shadow-2xl shadow-rose-950/50 group">
                <div className="relative rounded-[22px] overflow-hidden bg-zinc-950 aspect-[4/5] border border-white/10">
                  <Image
                    src="/images/esport/robot-mascot.jpg"
                    alt="STELLA E-Sport Robot Mascot"
                    fill
                    priority
                    sizes="(min-width: 1024px) 40vw, 90vw"
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  />

                  {/* Gradient Overlay & Badge */}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />

                  {/* Floating Holographic Badge */}
                  <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-lg bg-zinc-900/85 backdrop-blur-md border border-white/15 text-xs font-black uppercase text-rose-400 flex items-center gap-2 shadow-lg">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    MASKOT ROBOT RESMI
                  </div>

                  <div className="absolute bottom-6 left-6 right-6 z-10">
                    <div className="text-xs font-extrabold uppercase tracking-widest text-rose-400 mb-1">
                      Cyber Guardian of Land of Dawn
                    </div>
                    <div className="text-2xl font-black text-white drop-shadow-md">
                      ROBO-STELLA V2
                    </div>
                    <p className="text-xs text-zinc-300 mt-1 leading-snug">
                      Simbol kecepatan komputasi taktik, integritas sportivitas, dan dominasi digital SMK Telkom Lampung.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </section>

      {/* ===================== MASCOT SPOTLIGHT SECTION ===================== */}
      <section id="mascot" className="py-20 border-t border-white/10 bg-zinc-950/60 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-5 order-2 lg:order-1">
              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-zinc-900 shadow-2xl aspect-square">
                <Image
                  src="/images/esport/robot-mascot.jpg"
                  alt="Maskot Robot E-Sport Stella"
                  fill
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-rose-950/40 via-transparent to-cyan-950/20 pointer-events-none" />
              </div>
            </div>

            <div className="lg:col-span-7 order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider mb-4">
                <Cpu className="w-4 h-4" /> AI Robot Mascot Identity
              </div>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                Mengenal <span className="text-rose-500">“ROBO-STELLA”</span>
              </h2>
              <p className="mt-4 text-zinc-300 leading-relaxed text-base sm:text-lg">
                Dilahirkan dari kolaborasi teknologi informatika modern dan jiwa kompetisi esport sekolah, <strong>ROBO-STELLA</strong> hadir sebagai penjaga kehormatan turnamen Mobile Legends SMK Telkom Lampung Season 2. Berzirah merah-putih Telkom dengan pelindung holografik, maskot ini merepresentasikan 4 pilar kekuatan tim:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                <div className="p-4 rounded-xl bg-zinc-900/70 border border-white/10">
                  <div className="w-8 h-8 rounded-lg bg-rose-600/20 text-rose-400 flex items-center justify-center font-black mb-2">
                    01
                  </div>
                  <h4 className="font-bold text-white text-base">Shield of Fair Play</h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    Menjunjung integritas tanpa cheat, map hack, maupun toxic communication di setiap arena.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/70 border border-white/10">
                  <div className="w-8 h-8 rounded-lg bg-cyan-600/20 text-cyan-400 flex items-center justify-center font-black mb-2">
                    02
                  </div>
                  <h4 className="font-bold text-white text-base">Overclocked Strategy</h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    Analisis draft pick presisi, adaptasi ban-pick cepat, dan eksekusi combo teamfight mematikan.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/70 border border-white/10">
                  <div className="w-8 h-8 rounded-lg bg-amber-600/20 text-amber-400 flex items-center justify-center font-black mb-2">
                    03
                  </div>
                  <h4 className="font-bold text-white text-base">Macro & Objective Vision</h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    Penguasaan map vision, kalkulasi rotasi Lord & Turtle, serta kedisiplinan pembagian lane.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/70 border border-white/10">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-black mb-2">
                    04
                  </div>
                  <h4 className="font-bold text-white text-base">Champion Resiliency</h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    Mental baja yang tak pernah menyerah meski dalam posisi tertekan hingga base lawan tumbang.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ===================== PRIZE POOL BREAKDOWN ===================== */}
      <section id="prizepool" className="py-20 border-t border-white/10 bg-[#090e1a] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-4">
              <Trophy className="w-4 h-4" /> Prize Pool & Rewards
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Total Hadiah <span className="text-amber-400">Rp 5.000.000+</span>
            </h2>
            <p className="mt-3 text-zinc-400 text-sm sm:text-base">
              Raih piala bergilir Stella Esports, medali kehormatan, uang pembinaan, sertifikat resmi, serta ribuan Diamond MLBB!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            
            {/* 1st Place - Champion */}
            <div className="relative rounded-2xl p-6 bg-gradient-to-b from-amber-500/20 via-zinc-900 to-zinc-950 border-2 border-amber-400/60 shadow-xl shadow-amber-500/10 flex flex-col justify-between order-1 md:order-1 lg:scale-105 z-10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-zinc-950 text-xs font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5" /> GRAND CHAMPION
              </div>
              <div className="text-center pt-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                  <Trophy className="w-8 h-8" />
                </div>
                <div className="text-xs font-bold text-amber-400 uppercase tracking-widest">JUARA 1</div>
                <div className="text-3xl font-black text-white mt-1">Rp 2.500.000</div>
                <div className="text-xs text-zinc-400 mt-1">Uang Pembinaan + Reward</div>
              </div>
              <ul className="mt-6 space-y-2.5 text-xs text-zinc-300 border-t border-white/10 pt-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Piala Bergilir Stella Esports Championship</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>5 Medali Emas Kehormatan</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>E-Certificate Resmi Juara Nasional/Daerah</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>5.000 Diamond Mobile Legends</span>
                </li>
              </ul>
            </div>

            {/* 2nd Place - Runner Up */}
            <div className="rounded-2xl p-6 bg-zinc-900/80 border border-zinc-700/60 flex flex-col justify-between order-2">
              <div className="text-center pt-2">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-400/20 border border-slate-400/40 flex items-center justify-center text-slate-200">
                  <Medal className="w-7 h-7" />
                </div>
                <div className="text-xs font-bold text-slate-300 uppercase tracking-widest">JUARA 2 (RUNNER UP)</div>
                <div className="text-2xl font-black text-white mt-1">Rp 1.500.000</div>
                <div className="text-xs text-zinc-400 mt-1">Uang Pembinaan + Reward</div>
              </div>
              <ul className="mt-6 space-y-2.5 text-xs text-zinc-300 border-t border-white/10 pt-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-slate-300 shrink-0" />
                  <span>Trophy Runner Up Stella Esports</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-slate-300 shrink-0" />
                  <span>5 Medali Perak</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-slate-300 shrink-0" />
                  <span>E-Certificate Runner Up</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-slate-300 shrink-0" />
                  <span>3.000 Diamond Mobile Legends</span>
                </li>
              </ul>
            </div>

            {/* 3rd Place */}
            <div className="rounded-2xl p-6 bg-zinc-900/80 border border-zinc-700/60 flex flex-col justify-between order-3">
              <div className="text-center pt-2">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-700/20 border border-amber-700/40 flex items-center justify-center text-amber-500">
                  <Medal className="w-7 h-7" />
                </div>
                <div className="text-xs font-bold text-amber-600 uppercase tracking-widest">JUARA 3</div>
                <div className="text-2xl font-black text-white mt-1">Rp 750.000</div>
                <div className="text-xs text-zinc-400 mt-1">Uang Pembinaan + Reward</div>
              </div>
              <ul className="mt-6 space-y-2.5 text-xs text-zinc-300 border-t border-white/10 pt-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Trophy 3rd Place Stella Esports</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>5 Medali Perunggu</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>E-Certificate Juara 3</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>1.500 Diamond Mobile Legends</span>
                </li>
              </ul>
            </div>

            {/* MVP Tournament */}
            <div className="rounded-2xl p-6 bg-zinc-900/80 border border-rose-600/40 flex flex-col justify-between order-4">
              <div className="text-center pt-2">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                  <Flame className="w-7 h-7" />
                </div>
                <div className="text-xs font-bold text-rose-400 uppercase tracking-widest">MVP GRAND FINAL</div>
                <div className="text-2xl font-black text-white mt-1">Rp 250.000</div>
                <div className="text-xs text-zinc-400 mt-1">Special Player Award</div>
              </div>
              <ul className="mt-6 space-y-2.5 text-xs text-zinc-300 border-t border-white/10 pt-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Plakat Spesial MVP of The Tournament</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Sertifikat Eksklusif Best Player</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>1.000 Diamond Mobile Legends</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Fitur Khusus di Media Sosial Sekolah</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Trophy Visual Card */}
          <div className="mt-14 rounded-2xl p-8 bg-zinc-900/60 border border-white/10 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="relative w-48 h-48 lg:w-56 lg:h-56 shrink-0 rounded-2xl overflow-hidden border border-amber-500/30 shadow-2xl">
              <Image
                src="/images/esport/trophy.jpg"
                alt="Championship Grand Trophy"
                fill
                sizes="250px"
                className="object-cover"
              />
            </div>
            <div className="flex-1 text-center lg:text-left">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Official Championship Cup</span>
              <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">Piala Bergilir E-Sport Telkom Schools</h3>
              <p className="text-zinc-300 text-sm mt-3 leading-relaxed">
                Setiap nama pemenang turnamen Season 2 tahun 2027 akan diabadikan pada plakat logam dasar piala bergilir ini dan dipajang di galeri prestasi Hall Utama SMK Telkom Lampung.
              </p>
            </div>
            <div className="shrink-0">
              <a
                href="#registration"
                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-sm uppercase tracking-wider transition shadow-lg shadow-amber-500/20 flex items-center gap-2"
              >
                Klaim Gelar Juara <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== TIMELINE & SCHEDULE ===================== */}
      <section id="timeline" className="py-20 border-t border-white/10 bg-[#070b14] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-4">
              <Calendar className="w-4 h-4" /> Roadmap & Jadwal
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Tahapan <span className="text-cyan-400">Kompetisi 2027</span>
            </h2>
            <p className="mt-3 text-zinc-400 text-sm sm:text-base">
              Catat tanggal pentingnya dan pastikan tim kamu tidak ketinggalan jadwal krusial!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            
            {/* Stage 1 */}
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-white/10 hover:border-cyan-500/50 transition flex flex-col justify-between relative group">
              <div>
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black text-sm mb-4">
                  01
                </div>
                <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider">TAHAP PENDAFTARAN</div>
                <h4 className="text-lg font-bold text-white mt-1">Registrasi Tim</h4>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Pendaftaran dibuka secara online melalui website ini. Kuota maksimal 64 slot tim pelajar.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 text-xs font-bold text-zinc-300">
                📅 01 Jan - 15 Feb 2027
              </div>
            </div>

            {/* Stage 2 */}
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-white/10 hover:border-rose-500/50 transition flex flex-col justify-between relative group">
              <div>
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-black text-sm mb-4">
                  02
                </div>
                <div className="text-xs font-bold text-rose-400 uppercase tracking-wider">BRIEFING & BRACKET</div>
                <h4 className="text-lg font-bold text-white mt-1">Technical Meeting</h4>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Penjelasan aturan main, drawing bagan bracket pertandingan, serta verifikasi identitas pelajar secara live via Discord.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 text-xs font-bold text-zinc-300">
                📅 18 Februari 2027
              </div>
            </div>

            {/* Stage 3 */}
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-white/10 hover:border-amber-500/50 transition flex flex-col justify-between relative group">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-sm mb-4">
                  03
                </div>
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">BABAK PENYISIHAN</div>
                <h4 className="text-lg font-bold text-white mt-1">Online Qualifiers</h4>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Babak 64 besar hingga Perempat Final (BO3). Pertandingan dipandu wasit dan disiarkan live di YouTube Stella.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 text-xs font-bold text-zinc-300">
                📅 20 - 22 Februari 2027
              </div>
            </div>

            {/* Stage 4 */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-rose-950/40 via-zinc-900 to-zinc-950 border-2 border-rose-500/60 hover:border-rose-400 transition flex flex-col justify-between relative group shadow-lg shadow-rose-950/40">
              <div>
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black text-sm mb-4">
                  04
                </div>
                <div className="text-xs font-bold text-rose-400 uppercase tracking-wider">PUNCAK ACARA</div>
                <h4 className="text-lg font-bold text-white mt-1">Grand Finals Offline</h4>
                <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
                  Semifinal & Grand Final (BO5) langsung di panggung arena Hall SMK Telkom Lampung disaksikan ratusan suporter!
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 text-xs font-black text-rose-400">
                📍 25 Februari 2027 (Live Stage)
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ===================== HEROES & ROLES IN LAND OF DAWN ===================== */}
      <section id="heroes" className="py-20 border-t border-white/10 bg-[#090e1a] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            <div className="lg:col-span-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider mb-4">
                <Swords className="w-4 h-4" /> 5v5 Team Synergy
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                Kuasai 5 Role Krusial <span className="text-rose-500">Land of Dawn</span>
              </h2>
              <p className="mt-4 text-zinc-300 text-base leading-relaxed">
                Kunci kemenangan di Mobile Legends: Bang Bang bukan sekadar adu mekanik individu, tetapi koordinasi komunikasi makro dan eksekusi combo 5 role utama:
              </p>

              <div className="mt-8 space-y-3">
                <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/10 flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-600/20 text-rose-400 flex items-center justify-center shrink-0 font-bold">
                    ⚔️
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Jungler (Hyper Core)</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">Pengambil objektif utama Turtle/Lord, farming efisien, dan eksekutor eliminasi musuh.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/10 flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-600/20 text-cyan-400 flex items-center justify-center shrink-0 font-bold">
                    🛡️
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Roamer (Tank / Support)</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">Penyedia map vision, pengawal core, dan inisiator teamfight dengan crowd control mematikan.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/10 flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-600/20 text-amber-400 flex items-center justify-center shrink-0 font-bold">
                    🧙
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Mid Laner (Mage / Burst)</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">Pembersih wave kilat, rotasi cepat membantu sidelane, dan sumber magical damage area.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/10 flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-yellow-600/20 text-yellow-400 flex items-center justify-center shrink-0 font-bold">
                    🏹
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Gold Laner (Marksman)</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">Asuransi daya hancur late-game, penembus turet pertahanan, dan DPS tertinggi tim.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/10 flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold">
                    🛡️
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Exp Laner (Fighter)</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">Punggawa duel solo lane, pembuka jalan teamfight, dan pengacau formasi backline lawan.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-zinc-950 shadow-2xl aspect-[16/9] lg:aspect-auto lg:h-[540px]">
                <Image
                  src="/images/esport/heroes-battle.jpg"
                  alt="Mobile Legends Heroes Battle Arena"
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="text-xs font-black uppercase tracking-widest text-cyan-400">Battle of Champions</div>
                  <div className="text-xl font-black text-white">5v5 Custom Draft Pick Mode</div>
                  <p className="text-xs text-zinc-300 mt-1">Seluruh skin diperbolehkan. Tunjukkan mekanik tertinggimu bersama rekan satu tim!</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ===================== TOURNAMENT RULES ===================== */}
      <section id="rules" className="py-20 border-t border-white/10 bg-[#070b14] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider mb-4">
              <ShieldAlert className="w-4 h-4" /> Official Rulebook
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Regulasi & <span className="text-rose-500">Ketentuan Pertandingan</span>
            </h2>
            <p className="mt-3 text-zinc-400 text-sm sm:text-base">
              Harap dibaca dan dipahami dengan seksama oleh kapten dan seluruh anggota tim sebelum bertanding.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-zinc-900/70 border border-white/10">
              <div className="text-rose-400 font-black text-xl mb-2 flex items-center gap-2">
                <MonitorSmartphone className="w-5 h-5" /> Ketentuan Device
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Seluruh peserta wajib menggunakan smartphone (Android/iOS). Penggunaan tablet, iPad, emulator, joystick tambahan, serta perangkat converter eksternal dilarang keras demi keadilan kompetisi.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/70 border border-white/10">
              <div className="text-cyan-400 font-black text-xl mb-2 flex items-center gap-2">
                <Swords className="w-5 h-5" /> Format Turnamen
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Sistem pertandingan adalah Single Elimination. Babak kualifikasi menggunakan format Best of 3 (BO3). Babak Semifinal dan Grand Final menggunakan format Best of 5 (BO5) Draft Pick.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/70 border border-white/10">
              <div className="text-amber-400 font-black text-xl mb-2 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" /> Kode Etik & Fair Play
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Dilarang keras melakukan toxic chat/radio spamming, taunting berlebihan, map hack, script modding, maupun penggunaan bug game. Pelanggaran berakibat diskualifikasi permanen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== REGISTRATION FORM ===================== */}
      <section id="registration" className="py-20 border-t border-white/10 bg-[#090e1a] relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
              <Flame className="w-4 h-4" /> Formulir Registrasi Tim
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Daftarkan <span className="text-emerald-400">Tim Kamu Sekarang!</span>
            </h2>
            <p className="mt-3 text-zinc-400 text-sm sm:text-base">
              Isi formulir di bawah ini. Data pendaftaran akan otomatis disiapkan untuk konfirmasi ke WhatsApp Official Panitia E-Sport Stella.
            </p>
          </div>

          <div className="rounded-3xl p-6 sm:p-10 bg-zinc-900/90 border border-white/15 backdrop-blur-xl shadow-2xl">
            <form onSubmit={handleRegisterSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-300 mb-2">
                    Nama Tim (Squad Name) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: STELLA ESPORT ROOKIE"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/15 text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-sm transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-300 mb-2">
                    Asal Sekolah / Daerah *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: SMPN 1 Pringsewu / Gabungan"
                    value={schoolOrigin}
                    onChange={(e) => setSchoolOrigin(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/15 text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-sm transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-300 mb-2">
                    Nama Lengkap Kapten Tim *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Wahyu Rahmat"
                    value={captainName}
                    onChange={(e) => setCaptainName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/15 text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-sm transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-300 mb-2">
                    Nomor WhatsApp Kapten (Aktif) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Contoh: 081234567890"
                    value={captainWa}
                    onChange={(e) => setCaptainWa(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/15 text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-sm transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-300 mb-2">
                  ID & Server Mobile Legends Kapten
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 12345678 (2024)"
                  value={captainId}
                  onChange={(e) => setCaptainId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/15 text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-sm transition"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-300 mb-2">
                  Daftar Nama & Nickname Roster (Player 1 - 5 + Cadangan)
                </label>
                <textarea
                  rows={4}
                  placeholder={`1. Nama (Nickname & ID)\n2. Nama (Nickname & ID)\n3. Nama (Nickname & ID)\n4. Nama (Nickname & ID)\n5. Nama (Nickname & ID)\n6. Cadangan (Opsional)`}
                  value={rosterMembers}
                  onChange={(e) => setRosterMembers(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/15 text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-sm transition font-mono"
                />
              </div>

              <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-600/30 text-xs text-rose-300 leading-relaxed flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-rose-400" />
                <span>Setelah menekan tombol di bawah, formulir ini akan otomatis mengarahkan ke nomor WhatsApp Panitia Turnamen SMK Telkom Lampung untuk verifikasi slot pendaftaran.</span>
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-xl text-base font-black uppercase tracking-wider bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xl shadow-emerald-600/30 hover:shadow-emerald-600/50 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Kirim Pendaftaran via WhatsApp Panitia
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ===================== FAQ SECTION ===================== */}
      <section id="faq" className="py-20 border-t border-white/10 bg-[#070b14] relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-zinc-800 text-zinc-300 text-xs font-bold uppercase tracking-wider mb-4">
              <HelpCircle className="w-4 h-4 text-rose-500" /> Tanya Jawab Turnamen
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Pertanyaan yang Sering Diajukan
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-zinc-900/60 border border-white/10 overflow-hidden transition"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-4.5 text-left flex items-center justify-between font-bold text-white text-base sm:text-lg hover:text-rose-400 transition"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 shrink-0 text-zinc-400 transition-transform duration-300 ${
                      openFaq === idx ? "rotate-180 text-rose-400" : ""
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {openFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="px-6 pb-5 text-sm text-zinc-300 leading-relaxed border-t border-white/5 pt-3"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Location & Contact Callout */}
          <div className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-rose-950/40 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-rose-400">Lokasi Grand Final Offline</div>
              <h4 className="text-xl font-bold text-white mt-1">Hall Utama SMK Telkom Lampung</h4>
              <p className="text-xs text-zinc-400 mt-1">Jl. Raya Gadingrejo, Gading Rejo, Kabupaten Pringsewu, Lampung</p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="https://www.google.com/maps?q=SMK+Telkom+Lampung"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-white transition flex items-center gap-1.5"
              >
                <MapPin className="w-4 h-4 text-rose-400" /> Buka Google Maps
              </a>
              <a
                href="https://wa.me/6281179701215?text=Halo%20Admin%20Stella%20Esport,%20saya%20ingin%20tanya%20seputar%20turnamen%20MLBB"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition flex items-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4" /> Tanya Panitia
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== ESPORTS FOOTER ===================== */}
      <footer className="border-t border-white/10 bg-zinc-950 py-10 px-4 sm:px-6 lg:px-8 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-black text-zinc-200 tracking-wider text-sm">
              STELLA <span className="text-rose-500">E-SPORT</span>
            </span>
            <span>•</span>
            <span>SMK Telkom Lampung Season 2 (2027)</span>
          </div>
          <div>
            Mobile Legends: Bang Bang is a registered trademark of Moonton / ByteDance. Turnamen ini diselenggarakan secara resmi oleh Divisi E-Sport {schoolName}.
          </div>
        </div>
      </footer>
    </div>
  );
}
