"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  Minimize2,
  Menu,
  X,
  Volume2,
  ShieldAlert,
  Save,
  Check,
  Flag,
  FileCheck,
  Send,
  KeyRound,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  CbtStudentExamWorksheet,
  CbtStudentQuestionView,
  CbtStudentAnswer,
  CbtQuestionOption,
} from "@/types/cbt";
import { CbtMathArabicViewer } from "@/components/cbt/CbtMathArabicViewer";
import { CbtAudioPlayer } from "@/components/cbt/CbtAudioPlayer";
import { API_URL } from "@/lib/api-config";

interface Props {
  examId: number;
}

export function CbtExamPlayer({ examId }: Props) {
  const router = useRouter();

  // Core Data
  const [worksheet, setWorksheet] = useState<CbtStudentExamWorksheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Token Modal if not started
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [isVerifyingToken, setIsVerifyingToken] = useState(false);

  // Exam Player State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [remainingSec, setRemainingSec] = useState<number>(0);
  const [syncStatus, setSyncStatus] = useState<"saved" | "saving" | "error">("saved");

  // UI State
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg">("base");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmittingFinal, setIsSubmittingFinal] = useState(false);

  // Anti-Cheat Warning State
  const [cheatWarnings, setCheatWarnings] = useState(0);
  const [showCheatModal, setShowCheatModal] = useState(false);

  // Ref for debounced autosave timer
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch Worksheet
  const fetchWorksheet = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("cbt_student_token");
      if (!token) {
        router.replace("/cbt/login");
        return;
      }

      const res = await fetch(`${API_URL}/cbt/student/exams/${examId}/worksheet`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });

      if (res.status === 401) {
        router.replace("/cbt/login");
        return;
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        setError(errData?.message || "Gagal memuat lembar ujian.");
        return;
      }

      const ws: CbtStudentExamWorksheet = await res.json();
      setWorksheet(ws);

      // Check if student hasn't started yet and token is required
      const examObj = ws.exam || ws.Exam;
      if (ws.status === "belum_mulai" && examObj?.token_enabled) {
        setIsTokenModalOpen(true);
      } else {
        setRemainingSec(ws.remaining_seconds);
      }

      // Initialize answers from existing answers or local storage
      const initialAnswers: Record<number, string[]> = {};
      const initialFlagged: Record<number, boolean> = {};

      // First check local storage backup
      const localBackupStr = localStorage.getItem(`cbt_exam_${examId}_answers`);
      const localBackup = localBackupStr ? JSON.parse(localBackupStr) : {};

      if (ws.existing_answers) {
        Object.entries(ws.existing_answers).forEach(([qIdStr, ansObj]: [string, any]) => {
          const qId = Number(qIdStr);
          initialFlagged[qId] = ansObj.is_flagged || false;
          let parsedAns: string[] = [];
          if (typeof ansObj.answer === "string") {
            try {
              parsedAns = JSON.parse(ansObj.answer);
            } catch {
              parsedAns = [ansObj.answer];
            }
          } else if (Array.isArray(ansObj.answer)) {
            parsedAns = ansObj.answer;
          }
          initialAnswers[qId] = parsedAns;
        });
      }

      // Merge local storage if newer
      Object.keys(localBackup).forEach((qIdStr) => {
        const qId = Number(qIdStr);
        if (localBackup[qId] && (!initialAnswers[qId] || initialAnswers[qId].length === 0)) {
          initialAnswers[qId] = localBackup[qId];
        }
      });

      setAnswers(initialAnswers);
      setFlagged(initialFlagged);
    } catch (e: any) {
      setError(e.message || "Gagal menghubungi server.");
    } finally {
      setLoading(false);
    }
  }, [examId, router]);

  useEffect(() => {
    fetchWorksheet();
  }, [fetchWorksheet]);

  // 2. Countdown Timer
  useEffect(() => {
    if (isTokenModalOpen || loading || !worksheet) return;

    const timer = setInterval(() => {
      setRemainingSec((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmitTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTokenModalOpen, loading, worksheet]);

  // 3. Anti-Cheat: Visibility Change & Tab switch detection
  useEffect(() => {
    if (isTokenModalOpen || loading || !worksheet) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setCheatWarnings((prev) => {
          const updated = prev + 1;
          setShowCheatModal(true);
          return updated;
        });
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isTokenModalOpen, loading, worksheet]);

  // 4. Token Verification Handler
  async function handleStartWithToken(e: React.FormEvent) {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    setIsVerifyingToken(true);
    setTokenError(null);

    try {
      const token = localStorage.getItem("cbt_student_token");
      const res = await fetch(`${API_URL}/cbt/student/exams/${examId}/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ token: tokenInput.trim() }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        setIsTokenModalOpen(false);
        // Refresh worksheet to get start time & remaining seconds
        fetchWorksheet();
      } else {
        setTokenError(data?.message || "Token salah atau telah kedaluwarsa. Silakan tanyakan token ke pengawas.");
      }
    } catch (e: any) {
      setTokenError(e.message || "Gagal verifikasi token.");
    } finally {
      setIsVerifyingToken(false);
    }
  }

  // 5. Autosave Engine
  const triggerAutosave = (
    qId: number,
    newAnswer: string[],
    isFlag: boolean,
    curIdx: number
  ) => {
    setSyncStatus("saving");

    // 1. Instantly save to local storage (offline guarantee)
    try {
      const localBackupStr = localStorage.getItem(`cbt_exam_${examId}_answers`);
      const localBackup = localBackupStr ? JSON.parse(localBackupStr) : {};
      localBackup[qId] = newAnswer;
      localStorage.setItem(`cbt_exam_${examId}_answers`, JSON.stringify(localBackup));
    } catch (err) {
      // storage quota or error
    }

    // 2. Debounced API save to Go backend
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem("cbt_student_token");
        const res = await fetch(`${API_URL}/cbt/student/exams/${examId}/answers`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({
            question_id: qId,
            answer: newAnswer,
            is_flagged: isFlag,
            current_index: curIdx + 1,
          }),
        });

        if (res.ok) {
          setSyncStatus("saved");
        } else {
          setSyncStatus("error");
        }
      } catch (e) {
        setSyncStatus("error");
      }
    }, 600);
  };

  // 6. Option Selection Toggle
  const handleSelectOption = (optLabel: string) => {
    if (!worksheet) return;
    const curQ = worksheet.questions[currentIndex];
    if (!curQ) return;

    let newAns: string[] = [];

    if (curQ.question_type === "complex_multiple_choice") {
      // Multiple selection toggle
      const existing = answers[curQ.id] || [];
      if (existing.includes(optLabel)) {
        newAns = existing.filter((item) => item !== optLabel);
      } else {
        newAns = [...existing, optLabel];
      }
    } else {
      // Single selection
      newAns = [optLabel];
    }

    const updatedAnswers = { ...answers, [curQ.id]: newAns };
    setAnswers(updatedAnswers);
    triggerAutosave(curQ.id, newAns, Boolean(flagged[curQ.id]), currentIndex);
  };

  // 7. Flag / Ragu-ragu Toggle
  const toggleFlag = () => {
    if (!worksheet) return;
    const curQ = worksheet.questions[currentIndex];
    if (!curQ) return;

    const newFlag = !flagged[curQ.id];
    const updatedFlags = { ...flagged, [curQ.id]: newFlag };
    setFlagged(updatedFlags);
    triggerAutosave(curQ.id, answers[curQ.id] || [], newFlag, currentIndex);
  };

  // 8. Final Submit Handler
  async function handleFinalSubmit() {
    setIsSubmittingFinal(true);
    try {
      const token = localStorage.getItem("cbt_student_token");
      const res = await fetch(`${API_URL}/cbt/student/exams/${examId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (res.ok) {
        // Clear local storage backup
        localStorage.removeItem(`cbt_exam_${examId}_answers`);
        alert("Ujian Anda telah berhasil dikirim dan tersimpan di server. Terima kasih!");
        router.replace("/cbt");
      } else {
        alert("Gagal mengirim lembar ujian. Silakan coba lagi.");
      }
    } catch (e) {
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setIsSubmittingFinal(false);
    }
  }

  function handleAutoSubmitTimeOut() {
    alert("Waktu ujian telah habis! Sistem secara otomatis mengirimkan seluruh jawaban Anda.");
    handleFinalSubmit();
  }

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Time formatter
  const formatTimer = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? `${h < 10 ? "0" : ""}${h}:` : ""}${m < 10 ? "0" : ""}${m}:${
      s < 10 ? "0" : ""
    }${s}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-3">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
        <p className="text-sm font-medium text-slate-300">Menyiapkan lembar soal ujian...</p>
      </div>
    );
  }

  if (error || !worksheet) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-xl border border-slate-200">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-800">Tidak Dapat Membuka Ujian</h2>
          <p className="text-xs text-slate-500">{error || "Terjadi kesalahan sistem."}</p>
          <button
            onClick={() => router.replace("/cbt")}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition"
          >
            Kembali ke Portal
          </button>
        </div>
      </div>
    );
  }

  const currentQ: CbtStudentQuestionView | undefined = worksheet.questions[currentIndex];
  const totalQuestions = worksheet.questions.length;
  const currentAnswers = currentQ ? answers[currentQ.id] || [] : [];
  const isCurrentFlagged = currentQ ? Boolean(flagged[currentQ.id]) : false;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  // Counts for completion dialog
  const answeredTotal = Object.values(answers).filter((a) => a.length > 0).length;
  const flaggedTotal = Object.values(flagged).filter(Boolean).length;
  const unansweredTotal = totalQuestions - answeredTotal;

  // Font size mapping
  const textSizeClass =
    fontSize === "sm" ? "text-sm" : fontSize === "lg" ? "text-lg" : "text-base";

  return (
    <div
      className="min-h-screen bg-slate-100 flex flex-col justify-between text-slate-800 select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* --- TOP EXAM APP BAR --- */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-2">
          {/* Left: Exam title & Student */}
          <div className="flex items-center gap-2 truncate">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block leading-tight truncate">
                {(worksheet.exam || worksheet.Exam)?.title}
              </span>
              <span className="text-xs font-semibold text-slate-700 font-mono hidden sm:inline">
                {worksheet.student.name} ({worksheet.student.exam_number})
              </span>
            </div>
          </div>

          {/* Right: Controls & Timer */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Autosave Indicator */}
            <div className="hidden md:flex items-center gap-1.5 text-[11px] font-mono">
              {syncStatus === "saving" ? (
                <span className="text-amber-600 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Menyimpan...
                </span>
              ) : syncStatus === "error" ? (
                <span className="text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Offline (Disimpan di HP)
                </span>
              ) : (
                <span className="text-emerald-600 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Tersimpan
                </span>
              )}
            </div>

            {/* Font Zoom Controls */}
            <div className="flex items-center bg-slate-100 rounded-xl p-0.5 text-xs font-bold font-mono">
              <button
                type="button"
                onClick={() => setFontSize("sm")}
                className={`px-2 py-1 rounded-lg ${fontSize === "sm" ? "bg-white shadow-xs text-indigo-600" : "text-slate-500"}`}
                title="Ukuran Font Kecil"
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => setFontSize("base")}
                className={`px-2 py-1 rounded-lg ${fontSize === "base" ? "bg-white shadow-xs text-indigo-600" : "text-slate-500"}`}
                title="Ukuran Font Standar"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setFontSize("lg")}
                className={`px-2 py-1 rounded-lg ${fontSize === "lg" ? "bg-white shadow-xs text-indigo-600" : "text-slate-500"}`}
                title="Ukuran Font Besar"
              >
                A+
              </button>
            </div>

            {/* Timer Badge */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold border transition ${
                remainingSec <= 300
                  ? "bg-rose-50 text-rose-600 border-rose-300 animate-pulse"
                  : "bg-slate-50 text-slate-800 border-slate-200"
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>{formatTimer(remainingSec)}</span>
            </div>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition hidden sm:block"
              title="Layar Penuh"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Mobile Numbers Drawer Toggle */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-xs font-bold flex items-center gap-1 lg:hidden"
            >
              <Menu className="w-4 h-4" />
              <span>Daftar Soal</span>
            </button>
          </div>
        </div>
      </header>

      {/* --- MAIN EXAM WORKSPACE --- */}
      <main className="max-w-7xl mx-auto px-4 py-4 sm:py-6 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Center: Question Panel (8 cols on desktop) */}
        <section className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-7 flex flex-col justify-between min-h-[560px]">
          {currentQ ? (
            <div>
              {/* Question Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs font-mono shadow-sm shadow-indigo-200">
                    {currentIndex + 1}
                  </span>
                  <span className="text-xs font-bold uppercase text-slate-500">
                    Soal Nomor {currentIndex + 1} dari {totalQuestions}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">
                    {currentQ.question_type === "complex_multiple_choice"
                      ? "Pilihan Ganda Kompleks"
                      : currentQ.question_type === "essay"
                      ? "Esai"
                      : "Pilihan Ganda"}
                  </span>
                </div>
              </div>

              {/* Audio Listening Player if present */}
              {currentQ.audio_url && (
                <div className="mb-4">
                  <CbtAudioPlayer src={currentQ.audio_url} label="Audio Listening" />
                </div>
              )}

              {/* Question Image if present */}
              {currentQ.image_url && (
                <div className="my-3 max-w-md rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                  <img
                    src={
                      currentQ.image_url.startsWith("http")
                        ? currentQ.image_url
                        : `${API_URL.replace("/api/v1", "")}${currentQ.image_url}`
                    }
                    alt={`Gambar Soal Nomor ${currentIndex + 1}`}
                    className="w-full h-auto max-h-72 object-contain"
                  />
                </div>
              )}

              {/* Question Text (Supports KaTeX & Arabic) */}
              <div className={`leading-relaxed text-slate-800 font-medium my-4 ${textSizeClass}`}>
                <CbtMathArabicViewer text={currentQ.question_text} />
              </div>

              {/* Options Section */}
              {currentQ.question_type === "essay" ? (
                <div className="mt-6">
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                    Tuliskan Jawaban Esai Anda:
                  </label>
                  <textarea
                    rows={6}
                    placeholder="Ketik uraian jawaban secara jelas dan lengkap di sini..."
                    value={currentAnswers[0] || ""}
                    onChange={(e) => {
                      const text = e.target.value;
                      const newAns = [text];
                      setAnswers({ ...answers, [currentQ.id]: newAns });
                      triggerAutosave(currentQ.id, newAns, isCurrentFlagged, currentIndex);
                    }}
                    className={`w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${textSizeClass}`}
                  />
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  {currentQ.options.map((opt: CbtQuestionOption) => {
                    const isSelected = currentAnswers.includes(opt.label);

                    return (
                      <button
                        key={opt.id || opt.label}
                        type="button"
                        onClick={() => handleSelectOption(opt.label)}
                        className={`w-full text-left p-4 rounded-2xl border-2 flex items-start gap-3.5 transition-all active:scale-[0.99] ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-50/60 shadow-sm shadow-indigo-100"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 bg-white"
                        }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition ${
                            isSelected
                              ? "bg-indigo-600 text-white shadow-sm"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {opt.label}
                        </span>

                        <div className={`flex-1 pt-0.5 leading-relaxed text-slate-800 ${textSizeClass}`}>
                          <CbtMathArabicViewer text={opt.text} />
                          {opt.image_url && (
                            <img
                              src={
                                opt.image_url.startsWith("http")
                                  ? opt.image_url
                                  : `${API_URL.replace("/api/v1", "")}${opt.image_url}`
                              }
                              alt={`Gambar Opsi ${opt.label}`}
                              className="mt-2 max-h-40 rounded-xl border border-slate-200"
                            />
                          )}
                        </div>

                        {isSelected && (
                          <CheckCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400">Tidak ada soal pada nomor ini.</div>
          )}

          {/* Navigation Action Buttons (Sebelumnya, Ragu-ragu, Selanjutnya) */}
          <div className="pt-6 mt-8 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition disabled:opacity-40"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>

            <button
              type="button"
              onClick={toggleFlag}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border transition ${
                isCurrentFlagged
                  ? "bg-amber-400 border-amber-500 text-slate-900 shadow-sm"
                  : "bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800"
              }`}
            >
              <Flag className={`w-4 h-4 ${isCurrentFlagged ? "fill-slate-900" : ""}`} />
              <span>{isCurrentFlagged ? "Ditandai (Ragu-ragu)" : "Ragu-Ragu"}</span>
            </button>

            {isLastQuestion ? (
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(true)}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-200 transition"
              >
                <FileCheck className="w-4 h-4" />
                <span>Selesai Ujian</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 transition"
              >
                <span>Selanjutnya</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </section>

        {/* Right: Question Numbers Grid (Desktop Sidebar - 4 cols) */}
        <aside className="hidden lg:block lg:col-span-4 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sticky top-20">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Navigasi Nomor Soal
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              {answeredTotal}/{totalQuestions} Terjawab
            </span>
          </div>

          {/* Numbers Grid */}
          <div className="grid grid-cols-5 gap-2 max-h-[420px] overflow-y-auto pr-1">
            {worksheet.questions.map((q: CbtStudentQuestionView, idx: number) => {
              const ans = answers[q.id];
              const isAns = ans && ans.length > 0;
              const isFlag = Boolean(flagged[q.id]);
              const isCurrent = idx === currentIndex;

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-11 rounded-xl text-xs font-mono font-bold flex flex-col items-center justify-center relative transition-all active:scale-95 border ${
                    isCurrent
                      ? "ring-2 ring-indigo-600 ring-offset-2 font-black"
                      : ""
                  } ${
                    isFlag
                      ? "bg-amber-400 text-slate-900 border-amber-500 shadow-sm"
                      : isAns
                      ? "bg-emerald-600 text-white border-emerald-700 shadow-sm"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                  }`}
                >
                  <span>{idx + 1}</span>
                  {isAns && !isFlag && (
                    <span className="text-[9px] font-sans opacity-90 truncate max-w-[28px]">
                      {ans.join(",")}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-5 pt-4 border-t border-slate-100 space-y-2 text-[11px] text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-emerald-600" />
              <span>Sudah Dijawab ({answeredTotal})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-amber-400" />
              <span>Ragu-Ragu ({flaggedTotal})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-slate-200" />
              <span>Belum Dijawab ({unansweredTotal})</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsSubmitModalOpen(true)}
            className="w-full mt-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-200 flex items-center justify-center gap-1.5 transition"
          >
            <FileCheck className="w-4 h-4" />
            <span>Kumpulkan Lembar Ujian</span>
          </button>
        </aside>
      </main>

      {/* --- MOBILE QUESTION NUMBERS DRAWER (BOTTOM SHEET) --- */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm lg:hidden flex flex-col justify-end animate-fade-in">
          <div className="bg-white rounded-t-3xl max-h-[80vh] flex flex-col p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="font-bold text-slate-800 text-sm">Daftar Nomor Soal Ujian</h3>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2.5 overflow-y-auto p-1 flex-1">
              {worksheet.questions.map((q: CbtStudentQuestionView, idx: number) => {
                const ans = answers[q.id];
                const isAns = ans && ans.length > 0;
                const isFlag = Boolean(flagged[q.id]);
                const isCurrent = idx === currentIndex;

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => {
                      setCurrentIndex(idx);
                      setIsDrawerOpen(false);
                    }}
                    className={`h-12 rounded-xl text-xs font-mono font-bold flex flex-col items-center justify-center border ${
                      isCurrent ? "ring-2 ring-indigo-600 ring-offset-2" : ""
                    } ${
                      isFlag
                        ? "bg-amber-400 text-slate-900 border-amber-500"
                        : isAns
                        ? "bg-emerald-600 text-white border-emerald-700"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    <span>{idx + 1}</span>
                    {isAns && !isFlag && (
                      <span className="text-[9px] font-sans opacity-90 truncate max-w-[32px]">
                        {ans.join(",")}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                setIsDrawerOpen(false);
                setIsSubmitModalOpen(true);
              }}
              className="mt-4 w-full py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold"
            >
              Kumpulkan Ujian
            </button>
          </div>
        </div>
      )}

      {/* --- PRE-EXAM TOKEN MODAL (Poin 6) --- */}
      {isTokenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-white/20 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100 shadow-sm">
              <KeyRound className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-800">Masukkan Token Ujian</h3>
              <p className="text-xs text-slate-500 mt-1">
                Silakan lihat kombinasi 6 karakter token yang ditampilkan pada layar pengawas di ruangan Anda.
              </p>
            </div>

            {tokenError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl text-left flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{tokenError}</span>
              </div>
            )}

            <form onSubmit={handleStartWithToken} className="space-y-4">
              <input
                type="text"
                required
                maxLength={6}
                placeholder="CONTOH: 9XK8P2"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                className="w-full text-center tracking-[0.3em] font-mono text-2xl font-black py-3 bg-slate-50 border-2 border-indigo-200 rounded-2xl focus:border-indigo-600 focus:outline-none uppercase"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => router.replace("/cbt")}
                  className="w-1/3 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingToken || tokenInput.length < 4}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 disabled:opacity-50"
                >
                  {isVerifyingToken ? "Memeriksa Token..." : "Mulai Ujian Sekarang"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ANTI-CHEAT WARNING MODAL (Poin 4) --- */}
      {showCheatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-rose-200">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-800">
                Peringatan Pelanggaran Layar!
              </h3>
              <p className="text-xs text-rose-700 font-semibold mt-1">
                Anda terdeteksi keluar dari layar ujian sebanyak {cheatWarnings} kali.
              </p>
              <p className="text-[11px] text-slate-500 mt-2">
                Aktivitas keluar tab browser atau membuka aplikasi lain dicatat di log pengawas ujian.
              </p>
            </div>

            <button
              onClick={() => setShowCheatModal(false)}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-200"
            >
              Saya Mengerti &amp; Kembali Ujian
            </button>
          </div>
        </div>
      )}

      {/* --- CONFIRMATION MODAL KUMPULKAN UJIAN --- */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 border-b pb-3">
              <FileCheck className="w-6 h-6 text-emerald-600" />
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Konfirmasi Kumpulkan Ujian</h3>
                <p className="text-[11px] text-slate-500">Periksa ringkasan lembar jawaban Anda</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 py-2 text-center text-xs font-mono">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
                <span className="block text-lg font-bold text-emerald-700">{answeredTotal}</span>
                <span className="text-[10px] text-emerald-600">Terjawab</span>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5">
                <span className="block text-lg font-bold text-amber-700">{flaggedTotal}</span>
                <span className="text-[10px] text-amber-600">Ragu-ragu</span>
              </div>
              <div className="bg-slate-100 border border-slate-200 rounded-xl p-2.5">
                <span className="block text-lg font-bold text-slate-700">{unansweredTotal}</span>
                <span className="text-[10px] text-slate-500">Kosong</span>
              </div>
            </div>

            {(flaggedTotal > 0 || unansweredTotal > 0) && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  Masih terdapat soal yang <strong>ragu-ragu ({flaggedTotal})</strong> atau{" "}
                  <strong>belum dijawab ({unansweredTotal})</strong>. Yakin ingin mengakhiri ujian?
                </span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Lanjutkan Mengerjakan
              </button>
              <button
                type="button"
                disabled={isSubmittingFinal}
                onClick={handleFinalSubmit}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-200 disabled:opacity-50"
              >
                {isSubmittingFinal ? "Mengirim..." : "Ya, Kumpulkan Sekarang"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
