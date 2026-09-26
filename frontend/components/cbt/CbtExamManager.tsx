"use client";

import React, { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Plus,
  Edit2,
  Trash2,
  Users,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Shuffle,
  Award,
  KeyRound,
  ArrowRight,
  BookOpen,
  X,
  UserCheck,
  BarChart3,
} from "lucide-react";
import { CbtExam, CbtQuestionBank, RandomizeMode, ScoringMode } from "@/types/cbt";
import { API_URL } from "@/lib/api-config";
import { getCookie } from "@/lib/auth-client";

export function CbtExamManager() {
  const [exams, setExams] = useState<CbtExam[]>([]);
  const [banks, setBanks] = useState<CbtQuestionBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modals
  const [modalMode, setModalMode] = useState<"create" | "edit" | "assign" | null>(null);
  const [selectedExamId, setSelectedExamId] = useState<number>(0);
  const [assignClassName, setAssignClassName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    id: 0,
    question_bank_id: 0,
    title: "",
    description: "",
    start_time: "",
    end_time: "",
    duration_minutes: 90,
    randomize_mode: "both" as RandomizeMode,
    scoring_mode: "auto_even_100" as ScoringMode,
    token_enabled: true,
    is_active: true,
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    setLoading(true);
    try {
      const [resExams, resBanks] = await Promise.all([
        fetch(`${API_URL}/cbt/exams`, { credentials: "include" }),
        fetch(`${API_URL}/cbt/question-banks`, { credentials: "include" }),
      ]);
      if (resExams.ok) setExams(await resExams.json());
      if (resBanks.ok) setBanks(await resBanks.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    const now = new Date();
    const startStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    const endStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000 + 3600000 * 3).toISOString().slice(0, 16);

    setForm({
      id: 0,
      question_bank_id: banks.length > 0 ? banks[0].id : 0,
      title: "",
      description: "",
      start_time: startStr,
      end_time: endStr,
      duration_minutes: 90,
      randomize_mode: "both",
      scoring_mode: "auto_even_100",
      token_enabled: true,
      is_active: true,
    });
    setNotice(null);
    setModalMode("create");
  }

  function openEdit(e: CbtExam) {
    const formatDt = (s: string) => {
      if (!s) return "";
      return s.replace(" ", "T").slice(0, 16);
    };

    setForm({
      id: e.id,
      question_bank_id: e.question_bank_id,
      title: e.title,
      description: e.description || "",
      start_time: formatDt(e.start_time),
      end_time: formatDt(e.end_time),
      duration_minutes: e.duration_minutes || 90,
      randomize_mode: e.randomize_mode || "both",
      scoring_mode: e.scoring_mode || "auto_even_100",
      token_enabled: e.token_enabled,
      is_active: e.is_active,
    });
    setNotice(null);
    setModalMode("edit");
  }

  async function handleSaveExam(e: FormEvent) {
    e.preventDefault();
    if (form.question_bank_id <= 0) {
      alert("Pilih Bank Soal terlebih dahulu.");
      return;
    }
    setSubmitting(true);
    setNotice(null);

    const isEdit = modalMode === "edit";
    const endpoint = isEdit ? `${API_URL}/cbt/exams/${form.id}` : `${API_URL}/cbt/exams`;

    const payload = {
      ...form,
      question_bank_id: Number(form.question_bank_id),
      duration_minutes: Number(form.duration_minutes),
      start_time: form.start_time.replace("T", " ") + ":00",
      end_time: form.end_time.replace("T", " ") + ":00",
    };

    try {
      const res = await fetch(endpoint, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCookie("csrf_token") || "",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (res.ok) {
        setNotice({
          type: "success",
          message: isEdit ? "Jadwal ujian berhasil diperbarui." : "Jadwal ujian baru berhasil dibuat.",
        });
        setModalMode(null);
        fetchInitialData();
      } else {
        setNotice({ type: "error", message: data?.message || "Gagal menyimpan jadwal ujian." });
      }
    } catch (e: any) {
      setNotice({ type: "error", message: e.message || "Terjadi kesalahan." });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteExam(e: CbtExam) {
    if (!confirm(`Hapus jadwal ujian "${e.title}" beserta seluruh data absensinya?`)) return;

    try {
      const res = await fetch(`${API_URL}/cbt/exams/${e.id}`, {
        method: "DELETE",
        headers: { "X-CSRF-Token": getCookie("csrf_token") || "" },
        credentials: "include",
      });

      if (res.ok) {
        setNotice({ type: "success", message: "Jadwal ujian berhasil dihapus." });
        fetchInitialData();
      } else {
        setNotice({ type: "error", message: "Gagal menghapus jadwal ujian." });
      }
    } catch (e) {
      setNotice({ type: "error", message: "Terjadi kesalahan." });
    }
  }

  async function handleAssignClass(e: FormEvent) {
    e.preventDefault();
    if (!assignClassName.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/cbt/exams/${selectedExamId}/assign-class`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCookie("csrf_token") || "",
        },
        credentials: "include",
        body: JSON.stringify({ class_name: assignClassName.trim() }),
      });

      const data = await res.json().catch(() => null);
      if (res.ok) {
        setNotice({
          type: "success",
          message: data?.message || `Siswa kelas ${assignClassName} berhasil didaftarkan ke ujian.`,
        });
        setModalMode(null);
        fetchInitialData();
      } else {
        setNotice({ type: "error", message: data?.message || "Gagal mendaftarkan siswa." });
      }
    } catch (e: any) {
      setNotice({ type: "error", message: e.message || "Terjadi kesalahan." });
    } finally {
      setSubmitting(false);
    }
  }

  const formatSchedule = (dtStr: string) => {
    if (!dtStr) return "-";
    const d = new Date(dtStr.replace(" ", "T"));
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatus = (startStr: string, endStr: string, active: boolean) => {
    if (!active) return { label: "Nonaktif", color: "bg-slate-100 text-slate-600" };
    const now = new Date().getTime();
    const start = new Date(startStr.replace(" ", "T")).getTime();
    const end = new Date(endStr.replace(" ", "T")).getTime();

    if (now < start) return { label: "Akan Datang", color: "bg-amber-50 text-amber-700 border-amber-200" };
    if (now > end) return { label: "Selesai", color: "bg-slate-100 text-slate-700 border-slate-200" };
    return { label: "Sedang Berlangsung", color: "bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse" };
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-600" />
            Jadwal Ujian CBT & Sesi
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Atur ketersediaan waktu ujian, alokasi durasi, mode acak soal & jawaban, bobot nilai, serta proteksi token.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/cbt/students"
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-xs transition"
          >
            <Users className="w-4 h-4" />
            Kelola Siswa & Kartu
          </Link>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-xs shadow-md shadow-indigo-100 transition"
          >
            <Plus className="w-4 h-4" />
            Buat Jadwal Ujian
          </button>
        </div>
      </div>

      {notice && (
        <div
          className={`p-4 rounded-xl text-sm font-medium ${
            notice.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {notice.message}
        </div>
      )}

      {/* Exam Cards Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">Memuat jadwal ujian...</div>
      ) : exams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-3">
          <Calendar className="w-12 h-12 mx-auto text-slate-300 stroke-1" />
          <p className="font-medium text-slate-700">Belum ada Jadwal Ujian CBT.</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Klik tombol &quot;Buat Jadwal Ujian&quot; untuk menghubungkan Bank Soal yang telah disiapkan ke sesi pengerjaan ujian siswa.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {exams.map((exam) => {
            const status = getStatus(exam.start_time, exam.end_time, exam.is_active);

            return (
              <div
                key={exam.id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-200 shadow-sm p-5 flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${status.color}`}>
                      {status.label}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(exam)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        title="Edit Jadwal"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteExam(exam)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Hapus Jadwal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-800 text-base leading-snug mb-1">
                    {exam.title}
                  </h3>
                  <p className="text-xs text-indigo-600 font-semibold mb-3">
                    {exam.subject_name} • {exam.bank_title}
                  </p>

                  {/* Badges Info */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{exam.duration_minutes} Menit</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{exam.total_participants} Peserta</span>
                    </div>
                    <div className="col-span-2 text-[11px] text-slate-500 flex flex-col gap-0.5 pt-1 border-t border-slate-200/60">
                      <span>Buka : {formatSchedule(exam.start_time)}</span>
                      <span>Tutup: {formatSchedule(exam.end_time)}</span>
                    </div>
                  </div>

                  {/* Mode Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] mb-4">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium flex items-center gap-1">
                      <Shuffle className="w-3 h-3 text-slate-400" />
                      {exam.randomize_mode === "both"
                        ? "Acak Soal & Opsi"
                        : exam.randomize_mode === "questions_only"
                        ? "Acak Soal"
                        : exam.randomize_mode === "options_only"
                        ? "Acak Opsi"
                        : "Urut"}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium flex items-center gap-1">
                      <Award className="w-3 h-3 text-slate-400" />
                      {exam.scoring_mode === "auto_even_100" ? "Max 100 Rata" : "Bobot Asli"}
                    </span>
                    {exam.token_enabled && (
                      <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold flex items-center gap-1 border border-indigo-100">
                        <KeyRound className="w-3 h-3 text-indigo-500" />
                        Token 1 Menit
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setSelectedExamId(exam.id);
                      setAssignClassName("");
                      setModalMode("assign");
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    + Siswa Kelas
                  </button>

                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/dashboard/cbt/exams/${exam.id}/analysis`}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                      title="Lihat Rekap Nilai, Koreksi Esai & Analisis Butir Soal"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Nilai & Analisis</span>
                    </Link>

                    <Link
                      href={`/dashboard/cbt/exams/${exam.id}/proctor`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm shadow-indigo-100 transition group"
                    >
                      <span>Pengawas</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- MODAL BUAT / EDIT UJIAN --- */}
      {modalMode && (modalMode === "create" || modalMode === "edit") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg">
                {modalMode === "edit" ? "Edit Jadwal Ujian" : "Buat Jadwal Ujian Baru"}
              </h3>
              <button
                onClick={() => setModalMode(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Nama / Judul Ujian <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Penilaian Akhir Semester Ganjil - Matematika X RPL"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Pilih Bank Soal <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={form.question_bank_id}
                  onChange={(e) => setForm({ ...form, question_bank_id: parseInt(e.target.value, 10) })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value={0} disabled>
                    Pilih Bank Soal...
                  </option>
                  {banks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title} ({b.subject_name} • {b.total_questions} Soal)
                    </option>
                  ))}
                </select>
                {banks.length === 0 && (
                  <p className="text-xs text-rose-500 mt-1">
                    Belum ada bank soal. Silakan buat bank soal di menu Bank Soal CBT terlebih dahulu.
                  </p>
                )}
              </div>

              {/* Start & End Window */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Waktu Mulai Tersedia <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Waktu Selesai (Batas Akhir) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Durasi (Menit) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={360}
                    required
                    value={form.duration_minutes}
                    onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value, 10) || 60 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Mode Pengacakan
                  </label>
                  <select
                    value={form.randomize_mode}
                    onChange={(e) => setForm({ ...form, randomize_mode: e.target.value as RandomizeMode })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="both">Acak Soal & Jawaban</option>
                    <option value="questions_only">Acak Soal Saja</option>
                    <option value="options_only">Acak Opsi Saja</option>
                    <option value="none">Urut (Tanpa Acak)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Mode Penilaian
                  </label>
                  <select
                    value={form.scoring_mode}
                    onChange={(e) => setForm({ ...form, scoring_mode: e.target.value as ScoringMode })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="auto_even_100">Otomatis Rata 100</option>
                    <option value="custom_points">Bobot Poin Asli</option>
                  </select>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.token_enabled}
                    onChange={(e) => setForm({ ...form, token_enabled: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span>Proteksi Token Ujian Dinamis (Berganti 1 Menit Sekali)</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 text-sm font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting || banks.length === 0}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium shadow-md shadow-indigo-100 disabled:opacity-50"
                >
                  {submitting ? "Menyimpan..." : "Simpan Jadwal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL DAFTARKAN KELAS SISWA --- */}
      {modalMode === "assign" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Daftarkan Kelas ke Ujian</h3>
              <button
                onClick={() => setModalMode(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignClass} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Nama Kelas <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: X PPLG 1"
                  value={assignClassName}
                  onChange={(e) => setAssignClassName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Seluruh siswa aktif di kelas ini akan otomatis didaftarkan dan mendapatkan lembar absensi ujian.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-100 disabled:opacity-50"
                >
                  {submitting ? "Mendaftarkan..." : "Daftarkan Sekarang"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
