"use client";

import { useState, useEffect, FormEvent } from "react";
import { Plus, Edit2, Trash2, X, Search, BookOpen, Layers } from "lucide-react";
import { CbtSubject } from "@/types/cbt";
import { API_URL } from "@/lib/api-config";
import { getCookie } from "@/lib/auth-client";

export function CbtSubjectManager() {
  const [subjects, setSubjects] = useState<CbtSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    id: 0,
    code: "",
    name: "",
    description: "",
  });

  useEffect(() => {
    fetchSubjects();
  }, []);

  async function fetchSubjects() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/cbt/subjects`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setSubjects(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setForm({ id: 0, code: "", name: "", description: "" });
    setNotice(null);
    setModalMode("create");
  }

  function openEdit(s: CbtSubject) {
    setForm({
      id: s.id,
      code: s.code,
      name: s.name,
      description: s.description || "",
    });
    setNotice(null);
    setModalMode("edit");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setNotice(null);

    const isEdit = modalMode === "edit";
    const endpoint = isEdit ? `${API_URL}/cbt/subjects/${form.id}` : `${API_URL}/cbt/subjects`;

    try {
      const res = await fetch(endpoint, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCookie("csrf_token") || "",
        },
        credentials: "include",
        body: JSON.stringify({
          code: form.code,
          name: form.name,
          description: form.description,
        }),
      });

      if (res.ok) {
        setNotice({
          type: "success",
          message: isEdit ? "Mata pelajaran berhasil diperbarui." : "Mata pelajaran baru berhasil ditambahkan.",
        });
        setModalMode(null);
        fetchSubjects();
      } else {
        const err = await res.json().catch(() => null);
        setNotice({
          type: "error",
          message: err?.message || "Gagal menyimpan mata pelajaran.",
        });
      }
    } catch (e: any) {
      setNotice({ type: "error", message: e.message || "Terjadi kesalahan koneksi." });
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteSubject(s: CbtSubject) {
    if (!confirm(`Hapus mata pelajaran "${s.name}"? Bank soal yang terhubung akan ikut terhapus.`)) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/cbt/subjects/${s.id}`, {
        method: "DELETE",
        headers: {
          "X-CSRF-Token": getCookie("csrf_token") || "",
        },
        credentials: "include",
      });

      if (res.ok) {
        setNotice({ type: "success", message: "Mata pelajaran berhasil dihapus." });
        fetchSubjects();
      } else {
        setNotice({ type: "error", message: "Gagal menghapus mata pelajaran." });
      }
    } catch (e) {
      setNotice({ type: "error", message: "Terjadi kesalahan saat menghapus." });
    }
  }

  const filtered = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            Master Mata Pelajaran CBT
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola daftar mata pelajaran yang digunakan untuk Bank Soal dan Ujian CBT.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-md shadow-indigo-100 transition"
        >
          <Plus className="w-4 h-4" />
          Tambah Mapel
        </button>
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

      {/* Search & Stats */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama atau kode mapel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
        <div className="text-sm text-slate-500">
          Total: <span className="font-semibold text-slate-700">{subjects.length}</span> Mapel
        </div>
      </div>

      {/* Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-slate-400">Memuat data mata pelajaran...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            {search ? "Tidak ada mata pelajaran yang cocok." : "Belum ada mata pelajaran. Silakan tambahkan baru."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 w-12">#</th>
                  <th className="py-3.5 px-4">Kode</th>
                  <th className="py-3.5 px-4">Nama Mata Pelajaran</th>
                  <th className="py-3.5 px-4">Keterangan</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-xs">{idx + 1}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-indigo-600">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100">
                        {s.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">{s.name}</td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                      {s.description || "-"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(s)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteSubject(s)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg">
                {modalMode === "edit" ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran Baru"}
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
                  Kode Mapel <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: MTK-X, BIN-XI, ARB-XII"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Nama Mata Pelajaran <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Matematika, Bahasa Arab, dll."
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Keterangan / Deskripsi
                </label>
                <textarea
                  rows={3}
                  placeholder="Deskripsi singkat kurikulum atau materi mapel..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
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
                  {submitting ? "Menyimpan..." : "Simpan Mapel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
