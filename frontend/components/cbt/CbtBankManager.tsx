"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import { Plus, Edit2, Trash2, X, Search, Database, ArrowRight, HelpCircle, FileText, Layers, School } from "lucide-react";
import { CbtQuestionBank, CbtSubject } from "@/types/cbt";
import { API_URL } from "@/lib/api-config";
import { getCookie } from "@/lib/auth-client";

export function CbtBankManager() {
  const [banks, setBanks] = useState<CbtQuestionBank[]>([]);
  const [subjects, setSubjects] = useState<CbtSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    id: 0,
    subject_id: 0,
    title: "",
    grade_level: "Semua",
    major: "Semua",
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    setLoading(true);
    try {
      const [resSubj, resBanks] = await Promise.all([
        fetch(`${API_URL}/cbt/subjects`, { credentials: "include" }),
        fetch(`${API_URL}/cbt/question-banks`, { credentials: "include" }),
      ]);
      if (resSubj.ok) {
        setSubjects((await resSubj.json()) || []);
      }
      if (resBanks.ok) {
        setBanks((await resBanks.json()) || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchBanks(subjId?: string) {
    try {
      const url = subjId ? `${API_URL}/cbt/question-banks?subject_id=${subjId}` : `${API_URL}/cbt/question-banks`;
      const res = await fetch(url, { credentials: "include" });
      if (res.ok) {
        setBanks((await res.json()) || []);
      }
    } catch (e) {
      console.error(e);
    }
  }

  function handleFilterSubject(subjId: string) {
    setSelectedSubjectId(subjId);
    fetchBanks(subjId);
  }

  function openCreate() {
    setForm({
      id: 0,
      subject_id: subjects.length > 0 ? subjects[0].id : 0,
      title: "",
      grade_level: "Semua",
      major: "Semua",
    });
    setNotice(null);
    setModalMode("create");
  }

  function openEdit(b: CbtQuestionBank) {
    setForm({
      id: b.id,
      subject_id: b.subject_id,
      title: b.title,
      grade_level: b.grade_level || "Semua",
      major: b.major || "Semua",
    });
    setNotice(null);
    setModalMode("edit");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (form.subject_id <= 0) {
      setNotice({ type: "error", message: "Pilih mata pelajaran terlebih dahulu." });
      return;
    }
    setSubmitting(true);
    setNotice(null);

    const isEdit = modalMode === "edit";
    const endpoint = isEdit ? `${API_URL}/cbt/question-banks/${form.id}` : `${API_URL}/cbt/question-banks`;

    try {
      const res = await fetch(endpoint, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCookie("csrf_token") || "",
        },
        credentials: "include",
        body: JSON.stringify({
          subject_id: Number(form.subject_id),
          title: form.title,
          grade_level: form.grade_level,
          major: form.major,
        }),
      });

      if (res.ok) {
        setNotice({
          type: "success",
          message: isEdit ? "Bank soal berhasil diperbarui." : "Bank soal baru berhasil dibuat.",
        });
        setModalMode(null);
        fetchBanks(selectedSubjectId);
      } else {
        const err = await res.json().catch(() => null);
        setNotice({
          type: "error",
          message: err?.message || "Gagal menyimpan bank soal.",
        });
      }
    } catch (e: any) {
      setNotice({ type: "error", message: e.message || "Terjadi kesalahan sistem." });
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteBank(b: CbtQuestionBank) {
    if (!confirm(`Hapus bank soal "${b.title}" beserta seluruh ${b.total_questions} butir soal di dalamnya?`)) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/cbt/question-banks/${b.id}`, {
        method: "DELETE",
        headers: {
          "X-CSRF-Token": getCookie("csrf_token") || "",
        },
        credentials: "include",
      });

      if (res.ok) {
        setNotice({ type: "success", message: "Bank soal berhasil dihapus." });
        fetchBanks(selectedSubjectId);
      } else {
        setNotice({ type: "error", message: "Gagal menghapus bank soal." });
      }
    } catch (e) {
      setNotice({ type: "error", message: "Terjadi kesalahan saat menghapus." });
    }
  }

  const filtered = banks.filter((b) => {
    const matchSearch =
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      (b.subject_name && b.subject_name.toLowerCase().includes(search.toLowerCase()));
    return matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Database className="w-6 h-6 text-indigo-600" />
            Pengelolaan Bank Soal CBT
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Buat wadah bank soal untuk masing-masing mata pelajaran, kelola butir soal, atau import dari Microsoft Word.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/cbt/subjects"
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-sm transition"
          >
            <Layers className="w-4 h-4" />
            Master Mapel
          </Link>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-md shadow-indigo-100 transition"
          >
            <Plus className="w-4 h-4" />
            Buat Bank Soal
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

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari judul bank soal atau mapel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <select
          value={selectedSubjectId}
          onChange={(e) => handleFilterSubject(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="">Semua Mata Pelajaran</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id.toString()}>
              {s.name} ({s.code})
            </option>
          ))}
        </select>
      </div>

      {/* Bank Cards Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">Memuat bank soal...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-3">
          <Database className="w-12 h-12 mx-auto text-slate-300 stroke-1" />
          <p className="font-medium text-slate-600">Belum ada Bank Soal yang ditemukan.</p>
          <p className="text-sm">Klik tombol &quot;Buat Bank Soal&quot; di atas untuk memulai membuat kumpulan soal.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((bank) => (
            <div
              key={bank.id}
              className="bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-200 hover:shadow-md transition-all p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {bank.subject_name || "Mapel Umum"}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(bank)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      title="Edit Info Bank"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteBank(bank)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Hapus Bank Soal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-slate-800 text-base leading-snug line-clamp-2 mb-2">
                  {bank.title}
                </h3>

                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-4">
                  <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                    Kelas: {bank.grade_level}
                  </span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                    Jurusan: {bank.major}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>{bank.total_questions} Butir Soal</span>
                </div>

                <Link
                  href={`/dashboard/cbt/banks/${bank.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-lg transition group"
                >
                  <span>Kelola Soal</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Create/Edit */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg">
                {modalMode === "edit" ? "Edit Bank Soal" : "Buat Bank Soal Baru"}
              </h3>
              <button
                onClick={() => setModalMode(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Mata Pelajaran <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={form.subject_id}
                  onChange={(e) => setForm({ ...form, subject_id: parseInt(e.target.value, 10) })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value={0} disabled>
                    Pilih Mata Pelajaran...
                  </option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
                {subjects.length === 0 && (
                  <p className="text-xs text-rose-500 mt-1">
                    Belum ada mata pelajaran. Silakan buat di menu Master Mapel terlebih dahulu.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Judul Bank Soal <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bank Soal PAS Ganjil - Matematika X RPL"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Tingkat Kelas
                  </label>
                  <select
                    value={form.grade_level}
                    onChange={(e) => setForm({ ...form, grade_level: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="Semua">Semua Tingkat</option>
                    <option value="X">Kelas X</option>
                    <option value="XI">Kelas XI</option>
                    <option value="XII">Kelas XII</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Keahlian / Jurusan
                  </label>
                  <input
                    type="text"
                    placeholder="Semua / RPL / TKJ"
                    value={form.major}
                    onChange={(e) => setForm({ ...form, major: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 text-sm font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting || subjects.length === 0}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium shadow-md shadow-indigo-100 disabled:opacity-50"
                >
                  {submitting ? "Menyimpan..." : "Simpan Bank Soal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
