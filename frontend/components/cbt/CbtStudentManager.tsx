"use client";

import React, { useState, useEffect, FormEvent } from "react";
import {
  Users,
  Plus,
  Trash2,
  Search,
  Printer,
  Sparkles,
  KeyRound,
  ShieldCheck,
  X,
  CreditCard,
  UserPlus,
  QrCode,
  GraduationCap,
} from "lucide-react";
import { CbtStudent } from "@/types/cbt";
import { API_URL } from "@/lib/api-config";
import { getCookie } from "@/lib/auth-client";

export function CbtStudentManager() {
  const [students, setStudents] = useState<CbtStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modals
  const [modalMode, setModalMode] = useState<"create" | "batch" | "print" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Single form
  const [form, setForm] = useState({
    exam_number: "",
    nisn: "",
    name: "",
    class_name: "X PPLG 1",
    major: "PPLG",
    session_room: "Ruang 1",
    password: "",
  });

  // Batch generator form
  const [batchForm, setBatchForm] = useState({
    class_name: "X PPLG 1",
    major: "PPLG",
    session_room: "Ruang 1",
    count: 36,
    prefix: "UJN-X-PPLG1",
  });

  useEffect(() => {
    fetchStudents();
  }, [selectedClass, selectedRoom]);

  async function fetchStudents() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedClass) params.set("class_name", selectedClass);
      if (selectedRoom) params.set("session_room", selectedRoom);

      const res = await fetch(`${API_URL}/cbt/students?${params.toString()}`, {
        credentials: "include",
      });
      if (res.ok) {
        setStudents((await res.json()) || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Unique classes and rooms for filtering
  const classList = Array.from(new Set(students.map((s) => s.class_name).filter(Boolean)));
  const roomList = Array.from(new Set(students.map((s) => s.session_room).filter(Boolean)));

  async function handleSingleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setNotice(null);

    try {
      const res = await fetch(`${API_URL}/cbt/students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCookie("csrf_token") || "",
        },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => null);
      if (res.ok) {
        setNotice({ type: "success", message: `Siswa berhasil ditambahkan dengan kata sandi: ${data?.password}` });
        setModalMode(null);
        fetchStudents();
      } else {
        setNotice({ type: "error", message: data?.message || "Gagal mendaftarkan siswa." });
      }
    } catch (e: any) {
      setNotice({ type: "error", message: e.message || "Terjadi kesalahan." });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBatchSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setNotice(null);

    try {
      const res = await fetch(`${API_URL}/cbt/students/batch-generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCookie("csrf_token") || "",
        },
        credentials: "include",
        body: JSON.stringify(batchForm),
      });

      const data = await res.json().catch(() => null);
      if (res.ok) {
        setNotice({ type: "success", message: data?.message || "Akun siswa berhasil digenerate." });
        setModalMode(null);
        fetchStudents();
      } else {
        setNotice({ type: "error", message: data?.message || "Gagal generate akun siswa." });
      }
    } catch (e: any) {
      setNotice({ type: "error", message: e.message || "Terjadi kesalahan." });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteStudent(s: CbtStudent) {
    if (!confirm(`Hapus akun peserta ujian ${s.name} (${s.exam_number})?`)) return;

    try {
      const res = await fetch(`${API_URL}/cbt/students/${s.id}`, {
        method: "DELETE",
        headers: { "X-CSRF-Token": getCookie("csrf_token") || "" },
        credentials: "include",
      });

      if (res.ok) {
        setNotice({ type: "success", message: "Siswa berhasil dihapus." });
        fetchStudents();
      } else {
        setNotice({ type: "error", message: "Gagal menghapus siswa." });
      }
    } catch (e) {
      setNotice({ type: "error", message: "Terjadi kesalahan saat menghapus." });
    }
  }

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.exam_number.toLowerCase().includes(search.toLowerCase()) ||
      s.nisn.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            Peserta Ujian & Akun CBT
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola data peserta, generate akun massal per kelas, dan cetak kartu ujian resmi siswa.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setModalMode("print")}
            disabled={filtered.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-xs transition disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            Cetak Kartu Ujian ({filtered.length})
          </button>
          <button
            onClick={() => setModalMode("batch")}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-medium text-xs transition"
          >
            <Sparkles className="w-4 h-4" />
            Generate Massal
          </button>
          <button
            onClick={() => {
              setForm({
                exam_number: `UJN-${Math.floor(1000 + Math.random() * 9000)}`,
                nisn: "",
                name: "",
                class_name: "X PPLG 1",
                major: "PPLG",
                session_room: "Ruang 1",
                password: "",
              });
              setModalMode("create");
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-xs shadow-md shadow-indigo-100 transition"
          >
            <Plus className="w-4 h-4" />
            Tambah Siswa
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

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, nomor peserta, atau NISN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="">Semua Kelas</option>
          {classList.map((c) => (
            <option key={c} value={c}>
              Kelas {c}
            </option>
          ))}
        </select>

        <select
          value={selectedRoom}
          onChange={(e) => setSelectedRoom(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="">Semua Ruangan</option>
          {roomList.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {/* Table of Students */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-slate-400">Memuat data peserta...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            {search ? "Tidak ada siswa yang sesuai pencarian." : "Belum ada peserta. Gunakan tombol Generate Massal."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-10">#</th>
                  <th className="py-3 px-4">No. Peserta</th>
                  <th className="py-3 px-4">Nama Siswa</th>
                  <th className="py-3 px-4">NISN</th>
                  <th className="py-3 px-4">Kelas / Ruang</th>
                  <th className="py-3 px-4">Kata Sandi</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 text-xs font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                      <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-xs">
                        {s.exam_number}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{s.name}</td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">{s.nisn || "-"}</td>
                    <td className="py-3 px-4 text-xs">
                      <span className="font-semibold text-slate-700">{s.class_name}</span>
                      <span className="text-slate-400 mx-1">•</span>
                      <span className="text-slate-500">{s.session_room}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-700">
                      <code className="bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-800 border border-slate-200">
                        {s.password_plain}
                      </code>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteStudent(s)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Hapus Peserta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- MODAL GENERATE MASSAL --- */}
      {modalMode === "batch" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                Generate Akun Siswa Massal
              </h3>
              <button
                onClick={() => setModalMode(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBatchSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Nama Kelas <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: X PPLG 1, XI TKJ 2"
                  value={batchForm.class_name}
                  onChange={(e) => {
                    const cl = e.target.value;
                    setBatchForm({
                      ...batchForm,
                      class_name: cl,
                      prefix: "UJN-" + cl.toUpperCase().replace(/\s+/g, "-"),
                    });
                  }}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Jurusan / Program
                  </label>
                  <input
                    type="text"
                    placeholder="PPLG / TKJ"
                    value={batchForm.major}
                    onChange={(e) => setBatchForm({ ...batchForm, major: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Ruang Sesi
                  </label>
                  <input
                    type="text"
                    placeholder="Ruang 1"
                    value={batchForm.session_room}
                    onChange={(e) => setBatchForm({ ...batchForm, session_room: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Jumlah Siswa (1 - 200) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    required
                    value={batchForm.count}
                    onChange={(e) => setBatchForm({ ...batchForm, count: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Prefix Nomor Ujian
                  </label>
                  <input
                    type="text"
                    value={batchForm.prefix}
                    onChange={(e) => setBatchForm({ ...batchForm, prefix: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1 font-mono">
                <p>Contoh nomor: {batchForm.prefix}-001 s/d {batchForm.prefix}-{String(batchForm.count).padStart(3, "0")}</p>
                <p className="text-emerald-700">Password unik otomatis dibuat untuk tiap siswa.</p>
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
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium shadow-md shadow-indigo-100 disabled:opacity-50"
                >
                  {submitting ? "Memproses..." : "Generate Akun"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL TAMBAH TUNGGAL --- */}
      {modalMode === "create" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg">Tambah Peserta Ujian</h3>
              <button
                onClick={() => setModalMode(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSingleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Nomor Peserta Ujian <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.exam_number}
                  onChange={(e) => setForm({ ...form, exam_number: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Nama Lengkap Siswa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    NISN (Opsional)
                  </label>
                  <input
                    type="text"
                    value={form.nisn}
                    onChange={(e) => setForm({ ...form, nisn: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Kelas <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.class_name}
                    onChange={(e) => setForm({ ...form, class_name: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Ruang Sesi
                  </label>
                  <input
                    type="text"
                    value={form.session_room}
                    onChange={(e) => setForm({ ...form, session_room: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Password (Kosongkan utk Acak)
                  </label>
                  <input
                    type="text"
                    placeholder="Auto 6 Karakter"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500/20"
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
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium shadow-md shadow-indigo-100 disabled:opacity-50"
                >
                  {submitting ? "Menyimpan..." : "Simpan Siswa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- PRINT CARDS VIEW MODAL --- */}
      {modalMode === "print" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 print:hidden bg-slate-50">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800">
                  Pratinjau Cetak Kartu Peserta Ujian ({filtered.length} Siswa)
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-100"
                >
                  <Printer className="w-4 h-4" />
                  Cetak Sekarang (Ctrl + P)
                </button>
                <button
                  onClick={() => setModalMode(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Cards Grid */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[75vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0 print:grid-cols-2">
              {filtered.map((s) => (
                <div
                  key={s.id}
                  className="border-2 border-dashed border-slate-300 rounded-xl p-4 bg-white relative text-slate-800 break-inside-avoid print:border-solid print:border-slate-800"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b pb-2 mb-2">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-rose-600" />
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700 leading-tight">
                          SMK TELKOM LAMPUNG
                        </p>
                        <p className="text-[9px] text-slate-500 font-semibold leading-tight">
                          KARTU PESERTA UJIAN CBT
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-bold">
                      {s.session_room}
                    </span>
                  </div>

                  {/* Card Content */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="col-span-2 space-y-1 font-sans">
                      <div className="flex text-[11px]">
                        <span className="w-20 text-slate-500">Nama</span>
                        <span className="font-bold text-slate-800 truncate">: {s.name}</span>
                      </div>
                      <div className="flex text-[11px]">
                        <span className="w-20 text-slate-500">No. Peserta</span>
                        <span className="font-mono font-bold text-indigo-700">: {s.exam_number}</span>
                      </div>
                      <div className="flex text-[11px]">
                        <span className="w-20 text-slate-500">NISN</span>
                        <span className="font-mono">: {s.nisn || "-"}</span>
                      </div>
                      <div className="flex text-[11px]">
                        <span className="w-20 text-slate-500">Kelas</span>
                        <span className="font-semibold">: {s.class_name}</span>
                      </div>
                      <div className="flex text-[11px] pt-1 border-t border-slate-100">
                        <span className="w-20 text-slate-500 font-bold">KATA SANDI</span>
                        <span className="font-mono font-bold bg-slate-100 px-1.5 py-0.2 rounded text-rose-600 border border-slate-200">
                          : {s.password_plain}
                        </span>
                      </div>
                    </div>

                    {/* QR Code Placeholder */}
                    <div className="flex flex-col items-center justify-center p-1 bg-slate-50 border border-slate-200 rounded-lg">
                      <QrCode className="w-12 h-12 text-slate-700 stroke-1" />
                      <span className="text-[8px] font-mono text-slate-400 mt-1">Scan Login</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-1 border-t border-slate-100 text-[9px] text-slate-400 text-center font-mono">
                    Simpan kartu ini dengan baik dan jangan bagikan kata sandi kepada orang lain.
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
