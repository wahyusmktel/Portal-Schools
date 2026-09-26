"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  Clock,
  Calendar,
  LogOut,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  FileText,
  User,
  CheckCircle,
} from "lucide-react";
import { CbtExam, CbtStudent } from "@/types/cbt";
import { API_URL } from "@/lib/api-config";

export function CbtStudentPortal() {
  const router = useRouter();
  const [student, setStudent] = useState<CbtStudent | null>(null);
  const [exams, setExams] = useState<(CbtExam & { student_status?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentData();
  }, []);

  async function fetchStudentData() {
    setLoading(true);
    try {
      const token = localStorage.getItem("cbt_student_token");
      if (!token) {
        router.replace("/cbt/login");
        return;
      }

      const [resMe, resExams] = await Promise.all([
        fetch(`${API_URL}/cbt/student/me`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        }),
        fetch(`${API_URL}/cbt/student/exams`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        }),
      ]);

      if (resMe.ok) {
        setStudent(await resMe.json());
      } else {
        router.replace("/cbt/login");
        return;
      }

      if (resExams.ok) {
        setExams((await resExams.json()) || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("cbt_student_token");
    localStorage.removeItem("cbt_student_info");
    fetch(`${API_URL}/cbt/student/logout`, { method: "POST", credentials: "include" });
    router.replace("/cbt/login");
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 pb-16">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide leading-tight">
                CBT SMK TELKOM LAMPUNG
              </h1>
              <p className="text-[10px] text-slate-500 font-mono leading-tight">Portal Ujian Siswa</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {student && (
              <div className="hidden sm:block text-right">
                <p className="text-xs font-bold text-slate-800 leading-tight">{student.name}</p>
                <p className="text-[10px] font-mono text-indigo-600 leading-tight">
                  {student.exam_number} • {student.class_name}
                </p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition"
              title="Keluar dari sesi"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 pt-6 space-y-6">
        {/* Student Profile Card */}
        {student && (
          <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-indigo-300">
                <User className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[11px] font-mono text-indigo-300 uppercase tracking-wider">
                  Selamat Datang Peserta Ujian
                </span>
                <h2 className="text-xl font-bold text-white mt-0.5">{student.name}</h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-indigo-200 mt-1 font-mono">
                  <span>No. Peserta: <strong>{student.exam_number}</strong></span>
                  <span>•</span>
                  <span>Kelas: <strong>{student.class_name}</strong></span>
                  <span>•</span>
                  <span>Ruang: <strong>{student.session_room}</strong></span>
                </div>
              </div>
            </div>

            <div className="bg-white/10 border border-white/10 rounded-2xl px-4 py-3 text-center sm:text-right">
              <p className="text-[11px] text-indigo-200">Status Kehadiran</p>
              <p className="text-xs font-bold text-emerald-400 flex items-center justify-center sm:justify-end gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Terverifikasi Online
              </p>
            </div>
          </div>
        )}

        {/* Exams List Header */}
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Daftar Ujian yang Tersedia
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Pilih mata pelajaran ujian di bawah ini untuk memulai atau melanjutkan pengerjaan.
          </p>
        </div>

        {/* Exams Cards */}
        {loading ? (
          <div className="py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
            Memuat daftar ujian...
          </div>
        ) : exams.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 space-y-3">
            <Calendar className="w-12 h-12 mx-auto text-slate-300 stroke-1" />
            <p className="font-semibold text-slate-700">Tidak ada jadwal ujian aktif untuk kelas Anda saat ini.</p>
            <p className="text-xs text-slate-500">
              Silakan konfirmasi ke pengawas ruangan jika ujian Anda belum muncul.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {exams.map((ex) => {
              const status = ex.student_status || "belum_mulai";
              const isDone = status === "selesai";
              const isWorking = status === "sedang_mengerjakan";

              return (
                <div
                  key={ex.id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 flex flex-col justify-between hover:border-indigo-200 transition"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 uppercase">
                        {ex.subject_name || "Mata Pelajaran"}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isDone
                            ? "bg-slate-100 text-slate-700"
                            : isWorking
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse"
                            : "bg-indigo-50 text-indigo-700"
                        }`}
                      >
                        {isDone ? "Selesai" : isWorking ? "Sedang Dikerjakan" : "Tersedia"}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-800 text-base leading-snug mb-1">
                      {ex.title}
                    </h4>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100 my-3 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Durasi: {ex.duration_minutes} Menit</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{ex.total_questions} Butir Soal</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {ex.token_enabled ? "Wajib Token Pengawas" : "Tanpa Token"}
                    </span>

                    {isDone ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 px-3 py-1.5 bg-slate-100 rounded-xl">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Ujian Telah Selesai
                      </span>
                    ) : (
                      <Link
                        href={`/cbt/exam/${ex.id}`}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition ${
                          isWorking
                            ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                            : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
                        }`}
                      >
                        <span>{isWorking ? "Lanjutkan Ujian" : "Mulai Kerjakan"}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Exam rules note */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-900 space-y-1.5">
          <p className="font-bold flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-700" />
            Tata Tertib &amp; Petunjuk Ujian:
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800">
            <li>Pastikan baterai perangkat Anda mencukupi selama durasi ujian berlangsung.</li>
            <li>Dilarang berpindah tab browser, membuka aplikasi lain, atau mematikan layar (tercatat di log pengawas).</li>
            <li>Jawaban Anda otomatis tersimpan setiap kali memilih opsi atau berpindah nomor soal.</li>
            <li>Jika koneksi terputus, tetap lanjutkan pengerjaan; jawaban akan disinkronkan saat koneksi kembali.</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
