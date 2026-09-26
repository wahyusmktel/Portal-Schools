"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileSpreadsheet,
  Printer,
  RotateCw,
  Award,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Edit3,
  Search,
  Sparkles,
  BookOpen,
  Users,
  CheckSquare,
  HelpCircle,
} from "lucide-react";
import {
  CbtExam,
  CbtStudentExamResult,
  CbtItemAnalysis,
  CbtEssaySubmission,
} from "@/types/cbt";
import { API_URL } from "@/lib/api-config";
import { CbtMathArabicViewer } from "./CbtMathArabicViewer";
import { exportCbtExamReportExcel } from "@/lib/cbt-export";

interface Props {
  examId: number;
}

export function CbtExamAnalysis({ examId }: Props) {
  const [exam, setExam] = useState<CbtExam | null>(null);
  const [results, setResults] = useState<CbtStudentExamResult[]>([]);
  const [itemAnalysis, setItemAnalysis] = useState<CbtItemAnalysis[]>([]);
  const [essays, setEssays] = useState<CbtEssaySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"results" | "analysis" | "essays">("results");
  const [exportingExcel, setExportingExcel] = useState(false);

  // Search and filter for results
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("all");

  // Essay grading state
  const [gradingScores, setGradingScores] = useState<Record<string, number>>({});
  const [savingEssayKey, setSavingEssayKey] = useState<string | null>(null);
  const [gradingSuccessMsg, setGradingSuccessMsg] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resExam, resResults, resAnalysis, resEssays] = await Promise.all([
        fetch(`${API_URL}/cbt/exams/${examId}`, { credentials: "include" }),
        fetch(`${API_URL}/cbt/exams/${examId}/results`, { credentials: "include" }),
        fetch(`${API_URL}/cbt/exams/${examId}/item-analysis`, { credentials: "include" }),
        fetch(`${API_URL}/cbt/exams/${examId}/essays`, { credentials: "include" }),
      ]);

      if (resExam.ok) setExam(await resExam.json());
      if (resResults.ok) setResults((await resResults.json()) || []);
      if (resAnalysis.ok) setItemAnalysis((await resAnalysis.json()) || []);
      if (resEssays.ok) {
        const essayList: CbtEssaySubmission[] = (await resEssays.json()) || [];
        setEssays(essayList);
        // Pre-fill score state
        const initialScores: Record<string, number> = {};
        essayList.forEach((e) => {
          initialScores[`${e.student_id}_${e.question_id}`] = e.score;
        });
        setGradingScores(initialScores);
      }
    } catch (e) {
      console.error("Error loading CBT analysis data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [examId]);

  // Excel Export Handler
  const handleExportExcel = async () => {
    if (!exam) return;
    try {
      setExportingExcel(true);
      await exportCbtExamReportExcel({
        exam,
        results,
        itemAnalysis,
      });
    } catch (err: any) {
      alert("Gagal mengekspor file Excel: " + err.message);
    } finally {
      setExportingExcel(false);
    }
  };

  // Grade Essay Handler
  const handleSaveEssayGrade = async (studentId: number, questionId: number) => {
    const key = `${studentId}_${questionId}`;
    const scoreVal = gradingScores[key] ?? 0;
    setSavingEssayKey(key);
    setGradingSuccessMsg(null);

    try {
      const res = await fetch(`${API_URL}/cbt/exams/${examId}/grade-essay`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          question_id: questionId,
          score: scoreVal,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Gagal menyimpan nilai esai");
      }

      // Update local essay state
      setEssays((prev) =>
        prev.map((e) =>
          e.student_id === studentId && e.question_id === questionId
            ? { ...e, score: scoreVal, is_graded: true }
            : e
        )
      );

      setGradingSuccessMsg("Nilai esai berhasil disimpan!");
      setTimeout(() => setGradingSuccessMsg(null), 3000);

      // Refresh student results in background to reflect recalculated total score
      const resResults = await fetch(`${API_URL}/cbt/exams/${examId}/results`, {
        credentials: "include",
      });
      if (resResults.ok) setResults((await resResults.json()) || []);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingEssayKey(null);
    }
  };

  // Unique classes for filter
  const uniqueClasses = Array.from(new Set(results.map((r) => r.class_name).filter(Boolean)));

  // Filtered results
  const filteredResults = results.filter((r) => {
    const matchClass = classFilter === "all" || r.class_name === classFilter;
    const matchSearch =
      searchQuery === "" ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.exam_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.nisn && r.nisn.includes(searchQuery));
    return matchClass && matchSearch;
  });

  // Calculate Statistics
  const completedStudents = results.filter((r) => r.status === "selesai");
  const scoresArray = completedStudents.map((r) => r.score);
  const avgScore =
    scoresArray.length > 0
      ? scoresArray.reduce((acc, curr) => acc + curr, 0) / scoresArray.length
      : 0;
  const maxScore = scoresArray.length > 0 ? Math.max(...scoresArray) : 0;
  const minScore = scoresArray.length > 0 ? Math.min(...scoresArray) : 0;
  const passedStudents = completedStudents.filter((r) => r.score >= 75.0);
  const passRate =
    completedStudents.length > 0
      ? Math.round((passedStudents.length / completedStudents.length) * 100)
      : 0;

  // Item Analysis Stats
  const easyCount = itemAnalysis.filter((i) => i.difficulty_label === "Mudah").length;
  const mediumCount = itemAnalysis.filter((i) => i.difficulty_label === "Sedang").length;
  const hardCount = itemAnalysis.filter((i) => i.difficulty_label === "Sukar").length;

  const excDiscCount = itemAnalysis.filter((i) => i.discrimination_label === "Sangat Baik").length;
  const goodDiscCount = itemAnalysis.filter((i) => i.discrimination_label === "Baik").length;
  const fairDiscCount = itemAnalysis.filter((i) => i.discrimination_label === "Cukup").length;
  const poorDiscCount = itemAnalysis.filter((i) => i.discrimination_label.includes("Kurang")).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px]">
        <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-600 font-medium animate-pulse">
          Memuat data statistik, item analysis & hasil ujian...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Top Bar Navigation & Actions (Hidden on Print) */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/cbt/exams"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Kembali ke Jadwal Ujian"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                MODUL 4
              </span>
              <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">
                Analisis Butir Soal & Rekap Nilai
              </h1>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              {exam?.title} • Mapel: <span className="font-semibold text-slate-700">{exam?.subject_name || "-"}</span> • Durasi: {exam?.duration_minutes} Menit
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchData}
            className="p-2.5 text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all shadow-sm flex items-center gap-1.5 text-xs font-medium"
            title="Muat Ulang Data"
          >
            <RotateCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2 text-xs font-medium"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak PDF / Print</span>
          </button>

          <button
            onClick={handleExportExcel}
            disabled={exportingExcel}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-all shadow-sm flex items-center gap-2 text-xs disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{exportingExcel ? "Mengekspor..." : "Ekspor Excel (.xlsx)"}</span>
          </button>
        </div>
      </div>

      {/* Printable Header (Visible ONLY on Print) */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900 uppercase tracking-wide">
            SMK TELKOM LAMPUNG
          </h2>
          <h3 className="text-lg font-bold text-slate-800">
            LAPORAN HASIL EVALUASI & ANALISIS BUTIR SOAL CBT
          </h3>
          <p className="text-xs text-slate-600 mt-1">
            Ujian: {exam?.title} | Mapel: {exam?.subject_name} | Tanggal Cetak: {new Date().toLocaleDateString("id-ID")}
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total Peserta</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-800">{results.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {completedStudents.length} Selesai Mengerjakan
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Rata-rata Nilai</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600">{avgScore.toFixed(1)}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Skala Standar 0 - 100</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Nilai Tertinggi</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{maxScore.toFixed(1)}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Terendah: {minScore.toFixed(1)}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Ketuntasan (KKM 75)</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-indigo-600">{passRate}%</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {passedStudents.length} dari {completedStudents.length} Siswa Tuntas
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Butir Soal & Esai</span>
            <BookOpen className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-800">
            {itemAnalysis.length}{" "}
            <span className="text-xs font-normal text-slate-400">Butir</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {essays.length > 0 ? `${essays.length} Jawaban Esai Masuk` : "Tanpa Soal Esai"}
          </div>
        </div>
      </div>

      {/* Tabs Navigation (Hidden on Print) */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-t-2xl shadow-xs print:hidden">
        <button
          onClick={() => setActiveTab("results")}
          className={`py-3.5 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "results"
              ? "border-red-600 text-red-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Rekap Nilai Siswa ({results.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("analysis")}
          className={`py-3.5 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "analysis"
              ? "border-red-600 text-red-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analisis Butir Soal ({itemAnalysis.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("essays")}
          className={`py-3.5 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "essays"
              ? "border-red-600 text-red-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Edit3 className="w-4 h-4" />
          <span>Koreksi Esai ({essays.length})</span>
        </button>
      </div>

      {/* TAB 1: REKAPITULASI HASIL & NILAI SISWA */}
      {(activeTab === "results" || typeof window !== "undefined") && (
        <div className={`space-y-4 ${activeTab !== "results" ? "print:block hidden" : ""}`}>
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs print:hidden">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama siswa, nomor ujian, atau NISN..."
                className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Kelas:</span>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-red-500"
              >
                <option value="all">Semua Kelas</option>
                {uniqueClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-3.5 text-center w-12">No</th>
                    <th className="py-3 px-3.5">No. Ujian</th>
                    <th className="py-3 px-3.5">Nama Siswa</th>
                    <th className="py-3 px-3.5">Kelas</th>
                    <th className="py-3 px-3.5 text-center">Status</th>
                    <th className="py-3 px-3.5 text-center">Benar / Total</th>
                    <th className="py-3 px-3.5 text-right font-bold">Skor Akhir</th>
                    <th className="py-3 px-3.5 text-center">Ketuntasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredResults.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        Tidak ada data hasil ujian yang sesuai kriteria pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredResults.map((r, idx) => {
                      const isPass = r.score >= 75.0;
                      const isCompleted = r.status === "selesai";

                      return (
                        <tr key={r.student_id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3.5 text-center text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-3.5 font-mono text-slate-600">{r.exam_number}</td>
                          <td className="py-3 px-3.5">
                            <div className="font-semibold text-slate-800">{r.name}</div>
                            {r.nisn && <div className="text-[10px] text-slate-400">NISN: {r.nisn}</div>}
                          </td>
                          <td className="py-3 px-3.5">{r.class_name || "-"}</td>
                          <td className="py-3 px-3.5 text-center">
                            {isCompleted ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                                Selesai
                              </span>
                            ) : r.status === "sedang_mengerjakan" ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">
                                Mengerjakan
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                                Belum Mulai
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3.5 text-center font-medium">
                            <span className="text-emerald-600 font-bold">{r.correct_count}</span>
                            <span className="text-slate-400"> / {r.total_questions || exam?.total_questions || "-"}</span>
                          </td>
                          <td className="py-3 px-3.5 text-right font-mono font-bold text-sm">
                            <span className={isPass ? "text-emerald-600" : "text-red-600"}>
                              {r.score.toFixed(2)}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-center">
                            {isPass ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> TUNTAS
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
                                <XCircle className="w-3 h-3 text-red-500" /> REMEDIAL
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ANALISIS BUTIR SOAL (ITEM ANALYSIS & DISTRACTORS) */}
      {activeTab === "analysis" && (
        <div className="space-y-6">
          {/* Methodology Explainer Banner */}
          <div className="bg-linear-to-r from-slate-900 to-indigo-950 text-white p-5 rounded-2xl shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5 max-w-3xl">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h3 className="font-semibold text-sm">Metodologi Analisis Psikometrik Klasik</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Evaluasi butir soal menggunakan metode standar 27% kelompok atas (<span className="italic">Upper Group</span>) dan 27% kelompok bawah (<span className="italic">Lower Group</span>).
                  Indeks Kesukaran (<span className="font-mono">P = B / N</span>) mengukur proporsi siswa yang menjawab benar. 
                  Indeks Daya Pembeda (<span className="font-mono">D = (B_A - B_B) / n</span>) mengukur kemampuan butir membedakan siswa berkemampuan tinggi dan rendah.
                </p>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-700/60">
              <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl">
                <div className="text-[11px] text-slate-300">Tingkat Kesukaran</div>
                <div className="text-xs font-semibold text-white mt-1">
                  <span className="text-emerald-400">{easyCount} Mudah</span> •{" "}
                  <span className="text-amber-300">{mediumCount} Sedang</span> •{" "}
                  <span className="text-red-400">{hardCount} Sukar</span>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl">
                <div className="text-[11px] text-slate-300">Daya Pembeda Sangat Baik (D &ge; 0.40)</div>
                <div className="text-sm font-bold text-emerald-400 mt-1">{excDiscCount} Butir</div>
              </div>

              <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl">
                <div className="text-[11px] text-slate-300">Daya Pembeda Baik / Cukup</div>
                <div className="text-sm font-bold text-blue-300 mt-1">{goodDiscCount + fairDiscCount} Butir</div>
              </div>

              <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl">
                <div className="text-[11px] text-slate-300">Perlu Direvisi / Dibuang (D &lt; 0.20)</div>
                <div className="text-sm font-bold text-red-400 mt-1">{poorDiscCount} Butir</div>
              </div>
            </div>
          </div>

          {/* Item Analysis List */}
          <div className="space-y-4">
            {itemAnalysis.length === 0 ? (
              <div className="bg-white p-12 text-center text-slate-400 rounded-2xl border border-slate-200">
                Belum ada data analisis butir soal. Pastikan siswa telah mulai mengerjakan ujian.
              </div>
            ) : (
              itemAnalysis.map((item, idx) => {
                const dist = item.option_distribution || {};
                const totalResp = item.total_respondents || 1;

                return (
                  <div
                    key={item.question_id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4"
                  >
                    {/* Header: Number, Badges, Metrics */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                          {item.sort_order || idx + 1}
                        </span>
                        <span className="text-xs uppercase font-semibold text-slate-500 px-2 py-0.5 bg-slate-100 rounded-md">
                          {item.question_type}
                        </span>
                        {item.correct_answer && (
                          <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                            Kunci: {item.correct_answer}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Tingkat Kesukaran Badge */}
                        <div
                          className={`text-xs px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 ${
                            item.difficulty_label === "Mudah"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : item.difficulty_label === "Sedang"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          <span>P = {item.difficulty_index.toFixed(2)}</span>
                          <span className="text-[10px] font-normal uppercase">({item.difficulty_label})</span>
                        </div>

                        {/* Daya Pembeda Badge */}
                        <div
                          className={`text-xs px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 ${
                            item.discrimination_label === "Sangat Baik" || item.discrimination_label === "Baik"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : item.discrimination_label === "Cukup"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          <span>D = {item.discrimination_index.toFixed(2)}</span>
                          <span className="text-[10px] font-normal uppercase">({item.discrimination_label})</span>
                        </div>
                      </div>
                    </div>

                    {/* Question Content Preview */}
                    <div className="text-slate-800 text-sm leading-relaxed bg-slate-50/60 p-3.5 rounded-xl border border-slate-100">
                      <CbtMathArabicViewer text={item.question_text} />
                    </div>

                    {/* Distractor Distribution (Efektivitas Pengecoh) */}
                    {item.question_type !== "essay" && (
                      <div className="space-y-1.5 pt-1">
                        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                          <span>Distribusi Pilihan Siswa (Pengecoh & Kunci)</span>
                          <span className="font-normal text-slate-400">
                            Responden: {item.total_respondents} ({item.correct_count} Benar)
                          </span>
                        </div>

                        <div className="grid grid-cols-5 gap-2">
                          {["A", "B", "C", "D", "E"].map((opt) => {
                            const count = dist[opt] || 0;
                            const pct = totalResp > 0 ? Math.round((count / totalResp) * 100) : 0;
                            const isKey = item.correct_answer.toUpperCase().includes(opt);

                            return (
                              <div
                                key={opt}
                                className={`p-2.5 rounded-xl border text-center relative overflow-hidden transition-all ${
                                  isKey
                                    ? "border-emerald-300 bg-emerald-50/50"
                                    : "border-slate-200 bg-white"
                                }`}
                              >
                                <div
                                  className={`absolute bottom-0 left-0 right-0 h-1 ${
                                    isKey ? "bg-emerald-500" : "bg-slate-300"
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className={`font-bold ${isKey ? "text-emerald-700" : "text-slate-700"}`}>
                                    {opt} {isKey && "✓"}
                                  </span>
                                  <span className="text-[10px] font-medium text-slate-400">{pct}%</span>
                                </div>
                                <div className="text-sm font-semibold text-slate-800">{count}</div>
                                <div className="text-[10px] text-slate-400">Siswa</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 3: KOREKSI SOAL ESAI (MANUAL ESSAY GRADING) */}
      {activeTab === "essays" && (
        <div className="space-y-4">
          {gradingSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{gradingSuccessMsg}</span>
            </div>
          )}

          {essays.length === 0 ? (
            <div className="bg-white p-12 text-center text-slate-400 rounded-2xl border border-slate-200">
              Tidak ada jawaban esai pada ujian ini atau soal ujian sepenuhnya pilihan ganda.
            </div>
          ) : (
            <div className="space-y-4">
              {essays.map((sub, idx) => {
                const key = `${sub.student_id}_${sub.question_id}`;
                const currentScore = gradingScores[key] ?? sub.score;
                const isSaving = savingEssayKey === key;

                return (
                  <div
                    key={key}
                    className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4"
                  >
                    {/* Header with Student Info & Grading Status */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-800">{sub.student_name}</span>
                          <span className="text-xs font-mono text-slate-500">({sub.exam_number})</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Bobot Maksimal: <span className="font-semibold text-slate-700">{sub.max_points} Poin</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {sub.is_graded ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            <CheckSquare className="w-3.5 h-3.5" /> Sudah Dinilai ({sub.score} Poin)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                            <AlertCircle className="w-3.5 h-3.5" /> Perlu Penilaian
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Question Prompt */}
                    <div>
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                        Pertanyaan Soal:
                      </div>
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs text-slate-800 leading-relaxed">
                        <CbtMathArabicViewer text={sub.question_text} />
                      </div>
                    </div>

                    {/* Student Answer */}
                    <div>
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                        Jawaban Siswa:
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs text-slate-900 leading-relaxed whitespace-pre-wrap font-sans">
                        {sub.answer_text ? sub.answer_text : <span className="text-slate-400 italic">Tidak dijawab oleh siswa</span>}
                      </div>
                    </div>

                    {/* Grading Input Controls */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-600">Beri Nilai:</span>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max={sub.max_points}
                          value={currentScore}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setGradingScores((prev) => ({ ...prev, [key]: val }));
                          }}
                          className="w-20 px-2.5 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-red-500"
                        />
                        <span className="text-xs text-slate-400">/ {sub.max_points}</span>

                        {/* Quick Score Preset Buttons */}
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            type="button"
                            onClick={() => setGradingScores((prev) => ({ ...prev, [key]: 0 }))}
                            className="px-2 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium"
                          >
                            0
                          </button>
                          <button
                            type="button"
                            onClick={() => setGradingScores((prev) => ({ ...prev, [key]: sub.max_points / 2 }))}
                            className="px-2 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium"
                          >
                            50%
                          </button>
                          <button
                            type="button"
                            onClick={() => setGradingScores((prev) => ({ ...prev, [key]: sub.max_points }))}
                            className="px-2 py-1 text-[10px] bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-md font-medium"
                          >
                            Maks
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSaveEssayGrade(sub.student_id, sub.question_id)}
                        disabled={isSaving}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
                      >
                        {isSaving ? "Menyimpan..." : "Simpan Nilai Esai"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
