"use client";

import React, { useState, useEffect, useRef, FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  KeyRound,
  Users,
  Clock,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  RotateCw,
  FileCheck,
  Printer,
  Maximize,
  UserPlus,
  Trash2,
  X,
  FileText,
  School,
  GraduationCap,
} from "lucide-react";
import {
  CbtExam,
  CbtExamAttendance,
  CbtExamProctor,
  CbtLiveToken,
  CbtOfficialReport,
} from "@/types/cbt";
import { API_URL } from "@/lib/api-config";
import { getCookie } from "@/lib/auth-client";

interface Props {
  examId: number;
}

export function CbtProctorDashboard({ examId }: Props) {
  const [exam, setExam] = useState<CbtExam | null>(null);
  const [attendances, setAttendances] = useState<CbtExamAttendance[]>([]);
  const [proctors, setProctors] = useState<CbtExamProctor[]>([]);
  const [tokenData, setTokenData] = useState<CbtLiveToken>({
    exam_id: examId,
    token: "------",
    seconds_remaining: 60,
  });
  const [selectedRoom, setSelectedRoom] = useState<string>("Ruang 1");
  const [loading, setLoading] = useState(true);

  // Countdown timer state
  const [secRemaining, setSecRemaining] = useState(60);

  // Modals
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportData, setReportData] = useState<CbtOfficialReport | null>(null);
  const [isSavingReport, setIsSavingReport] = useState(false);

  const [isProctorModalOpen, setIsProctorModalOpen] = useState(false);
  const [newProctorUserId, setNewProctorUserId] = useState<number>(0);
  const [newProctorRoom, setNewProctorRoom] = useState<string>("Ruang 1");
  const [usersList, setUsersList] = useState<{ id: number; name: string; email: string }[]>([]);

  // 1. Initial Data Fetch
  useEffect(() => {
    fetchInitialData();
  }, [examId, selectedRoom]);

  async function fetchInitialData() {
    setLoading(true);
    try {
      const [resExam, resAtt, resProc, resUsers] = await Promise.all([
        fetch(`${API_URL}/cbt/exams/${examId}`, { credentials: "include" }),
        fetch(`${API_URL}/cbt/exams/${examId}/attendances?room=${encodeURIComponent(selectedRoom)}`, {
          credentials: "include",
        }),
        fetch(`${API_URL}/cbt/exams/${examId}/proctors`, { credentials: "include" }),
        fetch(`${API_URL}/users`, { credentials: "include" }),
      ]);

      if (resExam.ok) setExam(await resExam.json());
      if (resAtt.ok) setAttendances((await resAtt.json()) || []);
      if (resProc.ok) setProctors((await resProc.json()) || []);
      if (resUsers.ok) setUsersList((await resUsers.json()) || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // 2. Fetch Live Token & Handle 1-minute countdown
  const fetchToken = async () => {
    try {
      const res = await fetch(`${API_URL}/cbt/exams/${examId}/live-token`, {
        credentials: "include",
      });
      if (res.ok) {
        const data: CbtLiveToken = await res.json();
        setTokenData(data);
        setSecRemaining(data.seconds_remaining);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchToken();
  }, [examId]);

  // Second countdown tick
  useEffect(() => {
    const timer = setInterval(() => {
      setSecRemaining((prev) => {
        if (prev <= 1) {
          fetchToken();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examId]);

  // 3. Polling attendance every 5 seconds for live student progress
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const resAtt = await fetch(
          `${API_URL}/cbt/exams/${examId}/attendances?room=${encodeURIComponent(selectedRoom)}`,
          { credentials: "include" }
        );
        if (resAtt.ok) {
          setAttendances((await resAtt.json()) || []);
        }
      } catch (e) {
        // silent
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [examId, selectedRoom]);

  // 4. Official Report Handler
  async function openOfficialReport() {
    try {
      const res = await fetch(
        `${API_URL}/cbt/exams/${examId}/report?room=${encodeURIComponent(selectedRoom)}`,
        { credentials: "include" }
      );
      if (res.ok) {
        setReportData(await res.json());
        setIsReportModalOpen(true);
      }
    } catch (e) {
      alert("Gagal memuat berita acara.");
    }
  }

  async function handleSaveReport(e: FormEvent) {
    e.preventDefault();
    if (!reportData) return;
    setIsSavingReport(true);

    try {
      const res = await fetch(`${API_URL}/cbt/exams/${examId}/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCookie("csrf_token") || "",
        },
        credentials: "include",
        body: JSON.stringify(reportData),
      });

      if (res.ok) {
        alert("Berita acara berhasil disimpan.");
        setIsReportModalOpen(false);
      } else {
        alert("Gagal menyimpan berita acara.");
      }
    } catch (e) {
      alert("Terjadi kesalahan.");
    } finally {
      setIsSavingReport(false);
    }
  }

  // 5. Proctor Assign Handler
  async function handleAssignProctor(e: FormEvent) {
    e.preventDefault();
    if (newProctorUserId <= 0) return;

    try {
      const res = await fetch(`${API_URL}/cbt/exams/${examId}/proctors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCookie("csrf_token") || "",
        },
        credentials: "include",
        body: JSON.stringify({ user_id: newProctorUserId, room_name: newProctorRoom }),
      });

      if (res.ok) {
        setIsProctorModalOpen(false);
        const resProc = await fetch(`${API_URL}/cbt/exams/${examId}/proctors`, {
          credentials: "include",
        });
        if (resProc.ok) setProctors(await resProc.json());
      }
    } catch (e) {
      alert("Gagal menugaskan pengawas.");
    }
  }

  async function handleRemoveProctor(procId: number) {
    if (!confirm("Copot pengawas ini?")) return;
    try {
      const res = await fetch(`${API_URL}/cbt/exams/proctors/${procId}`, {
        method: "DELETE",
        headers: { "X-CSRF-Token": getCookie("csrf_token") || "" },
        credentials: "include",
      });
      if (res.ok) {
        const resProc = await fetch(`${API_URL}/cbt/exams/${examId}/proctors`, {
          credentials: "include",
        });
        if (resProc.ok) setProctors(await resProc.json());
      }
    } catch (e) {
      alert("Error.");
    }
  }

  // Stats calculation
  const total = attendances.length;
  const inProgress = attendances.filter((a) => a.status === "sedang_mengerjakan").length;
  const finished = attendances.filter((a) => a.status === "selesai").length;
  const notStarted = attendances.filter((a) => a.status === "belum_mulai").length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/cbt/exams"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
            title="Kembali ke Jadwal Ujian"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 uppercase">
                {exam?.subject_name || "Mata Pelajaran"}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Durasi: {exam?.duration_minutes} Menit
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-800 mt-1">{exam?.title || "Memuat..."}</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsProctorModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Kelola Pengawas ({proctors.length})
          </button>
          <button
            onClick={openOfficialReport}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-100 transition"
          >
            <FileText className="w-3.5 h-3.5" />
            Berita Acara Ujian
          </button>
        </div>
      </div>

      {/* --- LIVE TOKEN PROJECTION & SUMMARY SECTION --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Token Rotating Box (Poin 6) */}
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between z-10">
            <span className="text-xs uppercase font-bold tracking-wider text-indigo-300 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-amber-400" />
              Token Ujian Dinamis
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-indigo-200 border border-white/10">
              Berganti tiap 60 detik
            </span>
          </div>

          <div className="my-6 text-center z-10">
            <div className="font-mono text-5xl font-black tracking-widest text-amber-300 drop-shadow-md select-all py-1">
              {tokenData.token}
            </div>
            <p className="text-xs text-indigo-200 mt-2">
              Siswa wajib memasukkan token ini di HP/laptop untuk mulai mengerjakan soal.
            </p>
          </div>

          {/* Progress Bar Countdown */}
          <div className="space-y-1.5 z-10">
            <div className="flex items-center justify-between text-xs font-mono text-indigo-200">
              <span>Sisa Waktu Token</span>
              <span className="font-bold text-amber-400">{secRemaining} detik</span>
            </div>
            <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-400 h-full rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${(secRemaining / 60) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Realtime Attendance Cards (Poin 8) */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Terdaftar
            </span>
            <div className="text-3xl font-extrabold text-slate-800 my-2">{total}</div>
            <span className="text-[11px] text-slate-400">Siswa di ruangan ini</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Sedang Mengerjakan
            </span>
            <div className="text-3xl font-extrabold text-emerald-600 my-2">{inProgress}</div>
            <span className="text-[11px] text-emerald-700 font-medium">Hadir & Aktif</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
              Selesai Ujian
            </span>
            <div className="text-3xl font-extrabold text-indigo-600 my-2">{finished}</div>
            <span className="text-[11px] text-slate-400">Sudah submit</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
              Belum Mulai
            </span>
            <div className="text-3xl font-extrabold text-amber-600 my-2">{notStarted}</div>
            <span className="text-[11px] text-slate-400">Menunggu input token</span>
          </div>
        </div>
      </div>

      {/* --- LIVE STUDENT MONITORING GRID (Poin 3) --- */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-slate-800 text-sm">
              Live Monitoring Matriks Peserta ({selectedRoom})
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 font-medium">Pilih Ruangan:</label>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="Semua">Semua Ruangan</option>
              <option value="Ruang 1">Ruang 1</option>
              <option value="Ruang 2">Ruang 2</option>
              <option value="Ruang 3">Ruang 3</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400">Memuat data absensi...</div>
        ) : attendances.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            Belum ada siswa yang didaftarkan ke jadwal ujian ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-10">#</th>
                  <th className="py-3 px-4">No. Peserta</th>
                  <th className="py-3 px-4">Nama Siswa</th>
                  <th className="py-3 px-4">Kelas</th>
                  <th className="py-3 px-4">Status Ujian</th>
                  <th className="py-3 px-4">Posisi Soal</th>
                  <th className="py-3 px-4">Waktu Mulai</th>
                  <th className="py-3 px-4">Waktu Selesai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendances.map((att, idx) => {
                  const isWorking = att.status === "sedang_mengerjakan";
                  const isDone = att.status === "selesai";

                  const formatTime = (ts?: string) => {
                    if (!ts) return "-";
                    const d = new Date(ts);
                    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
                  };

                  return (
                    <tr key={att.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                        {att.exam_number}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{att.student_name}</td>
                      <td className="py-3 px-4 text-slate-600">{att.class_name}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isWorking
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : isDone
                              ? "bg-slate-100 text-slate-700"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {isWorking && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>}
                          {isWorking ? "Sedang Mengerjakan" : isDone ? "Selesai" : "Belum Mulai"}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {isWorking ? (
                          <span className="font-semibold text-slate-800">
                            Soal #{att.current_question_index}{" "}
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({att.answered_count} dijawab)
                            </span>
                          </span>
                        ) : isDone ? (
                          <span className="text-slate-500 font-semibold">Semua terjawab</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">{formatTime(att.started_at)}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{formatTime(att.finished_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- MODAL BERITA ACARA UJIAN RESMI (Poin 7) --- */}
      {isReportModalOpen && reportData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 print:hidden bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-600" />
                Berita Acara Pelaksanaan Ujian CBT
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Cetak Dokumen Resmi
                </button>
                <button
                  onClick={() => setIsReportModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Report Document Body */}
            <form onSubmit={handleSaveReport} className="p-8 space-y-6 text-slate-800 print:p-0">
              {/* Kop Surat Sekolah */}
              <div className="text-center border-b-2 border-slate-800 pb-4">
                <div className="flex items-center justify-center gap-3">
                  <GraduationCap className="w-10 h-10 text-rose-600" />
                  <div>
                    <h2 className="text-lg font-black uppercase tracking-wider">
                      SMK TELKOM LAMPUNG
                    </h2>
                    <p className="text-xs text-slate-600">
                      Jl. Raya Gisting, Kab. Tanggamus, Lampung • Telp: (0722) 123456
                    </p>
                    <p className="text-xs font-semibold text-slate-700">
                      PANITIA PELAKSANA PENILAIAN & UJIAN BERBASIS KOMPUTER (CBT)
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center my-3">
                <h3 className="text-base font-bold uppercase underline tracking-wide">
                  BERITA ACARA PELAKSANAAN UJIAN
                </h3>
                <p className="text-xs text-slate-500 font-mono">Tahun Ajaran 2026/2027</p>
              </div>

              <p className="text-xs leading-relaxed text-justify">
                Pada hari ini, tanggal <strong>{reportData.report_date}</strong>, telah diselenggarakan
                Ujian Berbasis Komputer (CBT) untuk mata pelajaran{" "}
                <strong>{reportData.subject_name || exam?.subject_name}</strong> dengan rincian pelaksanaan
                sebagai berikut:
              </p>

              {/* Data Ujian Table */}
              <div className="border border-slate-300 rounded-lg p-3 text-xs space-y-1.5 font-mono">
                <div className="grid grid-cols-3">
                  <span className="text-slate-500">Nama Ujian</span>
                  <span className="col-span-2 font-bold font-sans">: {reportData.exam_title || exam?.title}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-slate-500">Ruangan / Sesi</span>
                  <span className="col-span-2 font-bold">: {reportData.room_name}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-slate-500">Jumlah Peserta Terdaftar</span>
                  <span className="col-span-2 font-bold">: {reportData.total_candidates} Orang</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-slate-500">Jumlah Peserta Hadir</span>
                  <span className="col-span-2 font-bold text-emerald-700">: {reportData.present_count} Orang</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-slate-500">Jumlah Peserta Tidak Hadir</span>
                  <span className="col-span-2 font-bold text-rose-700">: {reportData.absent_count} Orang</span>
                </div>
                {reportData.absent_students_text && (
                  <div className="grid grid-cols-3">
                    <span className="text-slate-500">Nama Siswa Tidak Hadir</span>
                    <span className="col-span-2 text-rose-600">: {reportData.absent_students_text}</span>
                  </div>
                )}
              </div>

              {/* Notes Input for Proctor */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Catatan Selama Pelaksanaan Ujian (Kejadian Khusus / Kendala Teknis):
                </label>
                <textarea
                  rows={3}
                  value={reportData.notes}
                  onChange={(e) => setReportData({ ...reportData, notes: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs leading-relaxed print:border-none print:p-0"
                />
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 text-xs pt-6 text-center">
                <div>
                  <p className="text-slate-500">Mengetahui,</p>
                  <p className="font-semibold text-slate-700">Ketua Pelaksana CBT</p>
                  <div className="h-16"></div>
                  <p className="font-bold underline text-slate-800">( ..................................... )</p>
                  <p className="text-[10px] text-slate-500">NIP. ....................................</p>
                </div>

                <div>
                  <p className="text-slate-500">Lampung, {reportData.report_date}</p>
                  <p className="font-semibold text-slate-700">Pengawas Ruangan</p>
                  <div className="h-16"></div>
                  <p className="font-bold underline text-slate-800">
                    ( {reportData.proctor_name || "Pengawas Ruang"} )
                  </p>
                  <p className="text-[10px] text-slate-500">Tanda Tangan Pengawas</p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 print:hidden">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-medium"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={isSavingReport}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-100"
                >
                  {isSavingReport ? "Menyimpan..." : "Simpan Berita Acara"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL ASSIGN PENGAWAS --- */}
      {isProctorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Penugasan Pengawas Ruang</h3>
              <button
                onClick={() => setIsProctorModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Existing proctors */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase">
                  Pengawas Terdaftar:
                </label>
                {proctors.length === 0 ? (
                  <p className="text-xs text-slate-400">Belum ada pengawas ditugaskan.</p>
                ) : (
                  proctors.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-800">{p.user_name}</span>
                        <span className="text-slate-400 ml-2">({p.room_name})</span>
                      </div>
                      <button
                        onClick={() => handleRemoveProctor(p.id)}
                        className="text-rose-500 hover:text-rose-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add proctor form */}
              <form onSubmit={handleAssignProctor} className="pt-2 border-t border-slate-100 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Pilih Guru / Pengawas <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={newProctorUserId}
                    onChange={(e) => setNewProctorUserId(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value={0} disabled>
                      Pilih Guru / Pegawai...
                    </option>
                    {usersList.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Ruang Ditugaskan
                  </label>
                  <input
                    type="text"
                    value={newProctorRoom}
                    onChange={(e) => setNewProctorRoom(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={newProctorUserId <= 0}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm disabled:opacity-50"
                  >
                    Tugaskan Pengawas
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
