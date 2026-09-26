"use client";

import React, { useState, useEffect, FormEvent, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  FileUp,
  Download,
  Trash2,
  Edit2,
  Image as ImageIcon,
  Headphones,
  CheckCircle,
  HelpCircle,
  CheckSquare,
  FileText,
  AlertCircle,
  X,
  Upload,
} from "lucide-react";
import { CbtQuestionBank, CbtQuestion, CbtQuestionType, CbtQuestionOption } from "@/types/cbt";
import { CbtMathArabicViewer } from "@/components/cbt/CbtMathArabicViewer";
import { CbtAudioPlayer } from "@/components/cbt/CbtAudioPlayer";
import { API_URL } from "@/lib/api-config";
import { getCookie } from "@/lib/auth-client";

interface Props {
  bankId: number;
}

export function CbtQuestionEditor({ bankId }: Props) {
  const [bank, setBank] = useState<CbtQuestionBank | null>(null);
  const [questions, setQuestions] = useState<CbtQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modals
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const [questionModalMode, setQuestionModalMode] = useState<"create" | "edit" | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<number>(0);
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);

  // Question Form State
  const [qType, setQType] = useState<CbtQuestionType>("multiple_choice");
  const [qText, setQText] = useState("");
  const [qImage, setQImage] = useState("");
  const [qAudio, setQAudio] = useState("");
  const [qPoints, setQPoints] = useState<number>(1);
  const [qExplanation, setQExplanation] = useState("");
  const [options, setOptions] = useState<CbtQuestionOption[]>([
    { id: "A", label: "A", text: "" },
    { id: "B", label: "B", text: "" },
    { id: "C", label: "C", text: "" },
    { id: "D", label: "D", text: "" },
    { id: "E", label: "E", text: "" },
  ]);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>(["A"]);

  useEffect(() => {
    fetchBankData();
  }, [bankId]);

  async function fetchBankData() {
    setLoading(true);
    try {
      const [resBank, resQ] = await Promise.all([
        fetch(`${API_URL}/cbt/question-banks/${bankId}`, { credentials: "include" }),
        fetch(`${API_URL}/cbt/question-banks/${bankId}/questions`, { credentials: "include" }),
      ]);
      if (resBank.ok) {
        setBank(await resBank.json());
      }
      if (resQ.ok) {
        const rawQuestions = await resQ.json();
        // Parse options & answers safely if strings
        const formatted = (rawQuestions || []).map((q: any) => ({
          ...q,
          options: typeof q.options === "string" ? JSON.parse(q.options || "[]") : q.options || [],
          correct_answer:
            typeof q.correct_answer === "string"
              ? JSON.parse(q.correct_answer || "[]")
              : q.correct_answer || [],
        }));
        setQuestions(formatted);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function downloadTemplate() {
    window.location.href = `${API_URL}/cbt/template-docx`;
  }

  async function handleImportSubmit(e: FormEvent) {
    e.preventDefault();
    if (!importFile) return;

    setIsImporting(true);
    setNotice(null);

    const formData = new FormData();
    formData.append("file", importFile);

    try {
      const res = await fetch(`${API_URL}/cbt/question-banks/${bankId}/import-docx`, {
        method: "POST",
        headers: {
          "X-CSRF-Token": getCookie("csrf_token") || "",
        },
        credentials: "include",
        body: formData,
      });

      const data = await res.json().catch(() => null);
      if (res.ok) {
        setNotice({
          type: "success",
          message: data?.message || "Berhasil mengimpor soal dari file Word.",
        });
        setIsImportModalOpen(false);
        setImportFile(null);
        fetchBankData();
      } else {
        setNotice({
          type: "error",
          message: data?.message || "Gagal mengimpor file Word. Pastikan format penomoran sesuai.",
        });
      }
    } catch (e: any) {
      setNotice({ type: "error", message: e.message || "Terjadi kesalahan upload." });
    } finally {
      setIsImporting(false);
    }
  }

  function openCreateQuestion() {
    setQType("multiple_choice");
    setQText("");
    setQImage("");
    setQAudio("");
    setQPoints(1);
    setQExplanation("");
    setOptions([
      { id: "A", label: "A", text: "" },
      { id: "B", label: "B", text: "" },
      { id: "C", label: "C", text: "" },
      { id: "D", label: "D", text: "" },
      { id: "E", label: "E", text: "" },
    ]);
    setSelectedAnswers(["A"]);
    setQuestionModalMode("create");
    setEditingQuestionId(0);
  }

  function openEditQuestion(q: CbtQuestion) {
    setQType(q.question_type);
    setQText(q.question_text);
    setQImage(q.image_url || "");
    setQAudio(q.audio_url || "");
    setQPoints(q.points || 1);
    setQExplanation(q.explanation || "");

    const opts =
      q.options && q.options.length > 0
        ? q.options
        : [
            { id: "A", label: "A", text: "" },
            { id: "B", label: "B", text: "" },
            { id: "C", label: "C", text: "" },
            { id: "D", label: "D", text: "" },
            { id: "E", label: "E", text: "" },
          ];
    setOptions(opts);

    let answers: string[] = [];
    if (Array.isArray(q.correct_answer)) {
      answers = q.correct_answer.map(String);
    } else if (typeof q.correct_answer === "string") {
      answers = [q.correct_answer];
    }
    setSelectedAnswers(answers.length > 0 ? answers : ["A"]);

    setEditingQuestionId(q.id);
    setQuestionModalMode("edit");
  }

  async function handleSaveQuestion(e: FormEvent) {
    e.preventDefault();
    if (!qText.trim()) {
      alert("Teks pertanyaan tidak boleh kosong.");
      return;
    }

    setIsSubmittingQuestion(true);
    setNotice(null);

    const isEdit = questionModalMode === "edit";
    const endpoint = isEdit
      ? `${API_URL}/cbt/questions/${editingQuestionId}`
      : `${API_URL}/cbt/question-banks/${bankId}/questions`;

    const payload = {
      question_bank_id: Number(bankId),
      question_type: qType,
      question_text: qText,
      image_url: qImage,
      audio_url: qAudio,
      points: Number(qPoints),
      options: qType === "essay" ? [] : options,
      correct_answer: qType === "essay" ? [] : selectedAnswers,
      explanation: qExplanation,
      sort_order: questions.length + 1,
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

      if (res.ok) {
        setNotice({
          type: "success",
          message: isEdit ? "Butir soal berhasil diperbarui." : "Butir soal baru berhasil ditambahkan.",
        });
        setQuestionModalMode(null);
        fetchBankData();
      } else {
        const err = await res.json().catch(() => null);
        setNotice({
          type: "error",
          message: err?.message || "Gagal menyimpan butir soal.",
        });
      }
    } catch (e: any) {
      setNotice({ type: "error", message: e.message || "Terjadi kesalahan sistem." });
    } finally {
      setIsSubmittingQuestion(false);
    }
  }

  async function deleteQuestion(q: CbtQuestion) {
    if (!confirm("Hapus butir soal ini?")) return;

    try {
      const res = await fetch(`${API_URL}/cbt/questions/${q.id}`, {
        method: "DELETE",
        headers: {
          "X-CSRF-Token": getCookie("csrf_token") || "",
        },
        credentials: "include",
      });

      if (res.ok) {
        setNotice({ type: "success", message: "Soal berhasil dihapus." });
        fetchBankData();
      } else {
        setNotice({ type: "error", message: "Gagal menghapus soal." });
      }
    } catch (e) {
      setNotice({ type: "error", message: "Terjadi kesalahan saat menghapus." });
    }
  }

  async function handleUploadAudio(file: File) {
    const fd = new FormData();
    fd.append("audio", file);
    try {
      const res = await fetch(`${API_URL}/cbt/uploads/audio`, {
        method: "POST",
        headers: { "X-CSRF-Token": getCookie("csrf_token") || "" },
        credentials: "include",
        body: fd,
      });
      if (res.ok) {
        const data = await res.json();
        setQAudio(data.url);
      } else {
        alert("Gagal upload file audio.");
      }
    } catch (e) {
      alert("Error upload audio.");
    }
  }

  async function handleUploadImage(file: File) {
    const fd = new FormData();
    fd.append("image", file);
    try {
      const res = await fetch(`${API_URL}/cbt/uploads/images`, {
        method: "POST",
        headers: { "X-CSRF-Token": getCookie("csrf_token") || "" },
        credentials: "include",
        body: fd,
      });
      if (res.ok) {
        const data = await res.json();
        setQImage(data.url);
      } else {
        alert("Gagal upload file gambar.");
      }
    } catch (e) {
      alert("Error upload gambar.");
    }
  }

  const toggleOptionAnswer = (label: string) => {
    if (qType === "multiple_choice" || qType === "true_false") {
      setSelectedAnswers([label]);
    } else {
      if (selectedAnswers.includes(label)) {
        setSelectedAnswers(selectedAnswers.filter((a) => a !== label));
      } else {
        setSelectedAnswers([...selectedAnswers, label]);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Bank Info Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/cbt/banks"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
              title="Kembali ke Daftar Bank Soal"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {bank?.subject_name || "Mata Pelajaran"}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {bank?.grade_level !== "Semua" ? `Kelas ${bank?.grade_level}` : "Semua Kelas"} • {bank?.major}
                </span>
              </div>
              <h1 className="text-xl font-bold text-slate-800 mt-1">{bank?.title || "Memuat..."}</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={downloadTemplate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
              title="Unduh contoh template Word (.docx)"
            >
              <Download className="w-4 h-4 text-slate-500" />
              Template Word
            </button>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold transition"
            >
              <FileUp className="w-4 h-4" />
              Import Word (.docx)
            </button>
            <button
              onClick={openCreateQuestion}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-100 transition"
            >
              <Plus className="w-4 h-4" />
              Tambah Soal Manual
            </button>
          </div>
        </div>

        {/* Total Questions Banner */}
        <div className="flex items-center gap-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
          <div>
            Total Soal: <span className="font-bold text-slate-800">{questions.length}</span> Butir
          </div>
          <div>•</div>
          <div>
            Total Poin:{" "}
            <span className="font-bold text-indigo-600">
              {questions.reduce((sum, q) => sum + (q.points || 0), 0)}
            </span>
          </div>
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

      {/* Questions List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            Memuat daftar butir soal...
          </div>
        ) : questions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-3">
            <FileText className="w-12 h-12 mx-auto text-slate-300 stroke-1" />
            <p className="font-medium text-slate-700">Bank Soal ini masih kosong.</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Anda dapat mengimpor soal dari file Microsoft Word (.docx) atau menambahkannya secara manual dengan tombol di atas.
            </p>
          </div>
        ) : (
          questions.map((q, idx) => {
            const isSingle = q.question_type === "multiple_choice";
            const isComplex = q.question_type === "complex_multiple_choice";
            const isEssay = q.question_type === "essay";

            return (
              <div
                key={q.id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 shadow-sm p-5 space-y-4 transition"
              >
                {/* Header item */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs font-mono">
                      #{idx + 1}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold uppercase bg-slate-100 text-slate-600">
                      {isEssay
                        ? "Esai"
                        : isComplex
                        ? "PG Kompleks"
                        : isSingle
                        ? "Pilihan Ganda"
                        : q.question_type}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-600">
                      {q.points} Poin
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditQuestion(q)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      title="Edit Soal"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteQuestion(q)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Hapus Soal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Audio Listening if any */}
                {q.audio_url && <CbtAudioPlayer src={q.audio_url} label="Audio Listening" />}

                {/* Question Image if any */}
                {q.image_url && (
                  <div className="my-2 max-w-md rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                    <img
                      src={
                        q.image_url.startsWith("http")
                          ? q.image_url
                          : `${API_URL.replace("/api/v1", "")}${q.image_url}`
                      }
                      alt={`Gambar Soal ${idx + 1}`}
                      className="w-full h-auto max-h-64 object-contain"
                    />
                  </div>
                )}

                {/* Question Body with KaTeX & Arabic rendering */}
                <div className="text-slate-800 text-sm font-medium leading-relaxed">
                  <CbtMathArabicViewer text={q.question_text} />
                </div>

                {/* Options if Multiple Choice */}
                {!isEssay && q.options && q.options.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
                    {q.options.map((opt) => {
                      const isCorrect = Array.isArray(q.correct_answer)
                        ? q.correct_answer.includes(opt.label) || q.correct_answer.includes(opt.id)
                        : q.correct_answer === opt.label || q.correct_answer === opt.id;

                      return (
                        <div
                          key={opt.id || opt.label}
                          className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs leading-normal transition ${
                            isCorrect
                              ? "bg-emerald-50/70 border-emerald-300 text-emerald-900 font-medium"
                              : "bg-slate-50/50 border-slate-200 text-slate-700"
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                              isCorrect
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {opt.label}
                          </span>
                          <div className="flex-1">
                            <CbtMathArabicViewer text={opt.text} />
                            {opt.image_url && (
                              <img
                                src={
                                  opt.image_url.startsWith("http")
                                    ? opt.image_url
                                    : `${API_URL.replace("/api/v1", "")}${opt.image_url}`
                                }
                                alt={`Opsi ${opt.label}`}
                                className="mt-1.5 max-h-32 rounded-lg border border-slate-200"
                              />
                            )}
                          </div>
                          {isCorrect && (
                            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Explanation */}
                {q.explanation && (
                  <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900">
                    <span className="font-bold">Pembahasan: </span>
                    <CbtMathArabicViewer text={q.explanation} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* --- MODAL IMPORT WORD (.DOCX) --- */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <FileUp className="w-5 h-5 text-emerald-600" />
                Import Soal dari Microsoft Word (.docx)
              </h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="p-5 space-y-4">
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs text-slate-600 space-y-2">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-indigo-600" />
                  Aturan Format Penulisan di Word:
                </p>
                <ul className="list-disc list-inside space-y-1 font-mono text-[11px] text-slate-700">
                  <li>Nomor soal: <span className="text-indigo-600 font-bold">1. Pertanyaan...</span></li>
                  <li>Opsi jawaban: <span className="text-indigo-600 font-bold">A. Pilihan A</span>, <span className="text-indigo-600 font-bold">B. Pilihan B</span></li>
                  <li>Kunci jawaban: <span className="text-emerald-600 font-bold">ANS: A</span> (atau ANS: A, C)</li>
                  <li>Gambar & rumus KaTeX ($..$) langsung disisipkan di Word.</li>
                </ul>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={downloadTemplate}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Unduh file template contoh (.docx) di sini
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                  Pilih File Word (.docx) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="file"
                  required
                  accept=".docx"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 text-sm font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!importFile || isImporting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium shadow-md shadow-emerald-100 disabled:opacity-50"
                >
                  {isImporting ? "Mengekstrak Soal..." : "Proses & Import"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL TAMBAH / EDIT SOAL MANUAL --- */}
      {questionModalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg">
                {questionModalMode === "edit" ? "Edit Butir Soal" : "Tambah Butir Soal"}
              </h3>
              <button
                onClick={() => setQuestionModalMode(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Question Type & Points */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Tipe Soal
                  </label>
                  <select
                    value={qType}
                    onChange={(e) => setQType(e.target.value as CbtQuestionType)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="multiple_choice">Pilihan Ganda (1 Jawaban Benar)</option>
                    <option value="complex_multiple_choice">Pilihan Ganda Kompleks (Multi Jawaban)</option>
                    <option value="true_false">Benar / Salah</option>
                    <option value="essay">Esai / Uraian</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Poin Soal
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={qPoints}
                    onChange={(e) => setQPoints(parseFloat(e.target.value) || 1)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* Question Text */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Teks Pertanyaan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Ketik soal di sini. Untuk rumus matematika gunakan $E=mc^2$. Bahasa Arab juga didukung..."
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Uploads (Image & Audio) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1 flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5" /> Gambar Soal (Opsional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleUploadImage(e.target.files[0])}
                    className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:bg-slate-200 file:text-slate-700"
                  />
                  {qImage && (
                    <div className="mt-2 relative inline-block">
                      <img
                        src={qImage.startsWith("http") ? qImage : `${API_URL.replace("/api/v1", "")}${qImage}`}
                        alt="Preview"
                        className="h-16 rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => setQImage("")}
                        className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1 flex items-center gap-1">
                    <Headphones className="w-3.5 h-3.5" /> Audio Listening (Opsional)
                  </label>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => e.target.files?.[0] && handleUploadAudio(e.target.files[0])}
                    className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:bg-slate-200 file:text-slate-700"
                  />
                  {qAudio && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs font-mono text-emerald-600">Audio terpasang</span>
                      <button
                        type="button"
                        onClick={() => setQAudio("")}
                        className="text-rose-500 hover:underline text-xs"
                      >
                        Hapus
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Options Section if not Essay */}
              {qType !== "essay" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-600 uppercase">
                      Pilihan Jawaban & Kunci Jawaban
                    </label>
                    <span className="text-xs text-slate-400">
                      Klik huruf/tombol centang untuk menandai kunci benar
                    </span>
                  </div>

                  {options.map((opt, idx) => {
                    const isSelected = selectedAnswers.includes(opt.label);
                    return (
                      <div key={opt.id} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleOptionAnswer(opt.label)}
                          className={`w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 transition ${
                            isSelected
                              ? "bg-emerald-600 text-white shadow-sm"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                          }`}
                          title={`Jadikan ${opt.label} sebagai kunci`}
                        >
                          {isSelected ? <CheckCircle className="w-4 h-4" /> : opt.label}
                        </button>
                        <input
                          type="text"
                          placeholder={`Jawaban opsi ${opt.label}...`}
                          value={opt.text}
                          onChange={(e) => {
                            const newOpts = [...options];
                            newOpts[idx].text = e.target.value;
                            setOptions(newOpts);
                          }}
                          className={`flex-1 px-3 py-2 border rounded-xl text-sm ${
                            isSelected ? "border-emerald-300 bg-emerald-50/30" : "border-slate-200"
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Explanation */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Pembahasan / Kunci Referensi (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Penjelasan jawaban untuk ulasan setelah ujian selesai..."
                  value={qExplanation}
                  onChange={(e) => setQExplanation(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setQuestionModalMode(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 text-sm font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingQuestion}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium shadow-md shadow-indigo-100 disabled:opacity-50"
                >
                  {isSubmittingQuestion ? "Menyimpan..." : "Simpan Soal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
