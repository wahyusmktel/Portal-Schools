"use client";

import { useState, FormEvent, useEffect } from "react";
import { Plus, Edit2, Trash2, X } from "lucide-react";
import { Achievement } from "@/types/content";
import { API_URL } from "@/lib/api";
import { getCookie } from "@/lib/auth-client";
import { formatDate } from "@/lib/article-utils";

export function AchievementManager() {
  const [items, setItems] = useState<Achievement[]>([]);
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [form, setForm] = useState({
    id: 0,
    title: "",
    description: "",
    imageUrl: "",
    studentName: "",
    achievementLevel: "",
    achievedAt: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    const res = await fetch(`${API_URL}/achievements`).catch(() => null);
    if (res?.ok) {
      const data = await res.json();
      setItems(data);
    }
  }

  function openCreate() {
    setForm({
      id: 0,
      title: "",
      description: "",
      imageUrl: "",
      studentName: "",
      achievementLevel: "",
      achievedAt: new Date().toISOString().split('T')[0]
    });
    setNotice(null);
    setModalMode("create");
  }

  function openEdit(item: Achievement) {
    setForm({
      id: item.id,
      title: item.title,
      description: item.description,
      imageUrl: item.imageUrl || "",
      studentName: item.studentName,
      achievementLevel: item.achievementLevel,
      achievedAt: item.achievedAt ? item.achievedAt.split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setNotice(null);
    setModalMode("edit");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setNotice(null);

    const endpoint = modalMode === "edit" ? `${API_URL}/achievements/${form.id}` : `${API_URL}/achievements`;
    const { id, ...payload } = form;

    // Convert achievedAt back to ISO string for backend if needed
    const payloadToSend = {
      ...payload,
      achievedAt: new Date(payload.achievedAt).toISOString()
    };

    const res = await fetch(endpoint, {
      method: modalMode === "edit" ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": getCookie("csrf_token")
      },
      credentials: "include",
      body: JSON.stringify(payloadToSend)
    }).catch(() => null);

    setLoading(false);
    if (res?.ok) {
      setNotice({ type: "success", message: "Prestasi berhasil disimpan." });
      setModalMode(null);
      fetchItems();
    } else {
      setNotice({ type: "error", message: "Gagal menyimpan prestasi." });
    }
  }

  async function deleteItem(item: Achievement) {
    if (!window.confirm(`Hapus prestasi "${item.title}"?`)) return;
    
    const res = await fetch(`${API_URL}/achievements/${item.id}`, {
      method: "DELETE",
      headers: { "X-CSRF-Token": getCookie("csrf_token") },
      credentials: "include"
    }).catch(() => null);

    if (res?.ok) {
      fetchItems();
    } else {
      alert("Gagal menghapus.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900">Manajemen Prestasi</h1>
          <p className="text-zinc-600 mt-1">Kelola data prestasi siswa dan sekolah.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex h-11 items-center gap-2 rounded-[8px] bg-rosebrand-500 px-5 text-sm font-extrabold text-white transition hover:bg-rosebrand-600"
        >
          <Plus size={18} /> Tambah Prestasi
        </button>
      </div>

      <div className="rounded-[8px] border border-zinc-200 bg-white overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[800px]">
          <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600">
            <tr>
              <th className="px-6 py-4 font-extrabold">Judul</th>
              <th className="px-6 py-4 font-extrabold">Siswa</th>
              <th className="px-6 py-4 font-extrabold">Tingkat</th>
              <th className="px-6 py-4 font-extrabold">Tanggal</th>
              <th className="px-6 py-4 font-extrabold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-zinc-50/50 transition">
                <td className="px-6 py-4">
                  <div className="font-bold text-zinc-900">{item.title}</div>
                  <div className="text-zinc-500 text-xs mt-1 line-clamp-1 max-w-xs">{item.description}</div>
                </td>
                <td className="px-6 py-4">{item.studentName}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 px-2.5 py-1 text-xs font-bold">
                    {item.achievementLevel}
                  </span>
                </td>
                <td className="px-6 py-4 text-zinc-600">{formatDate(item.achievedAt)}</td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => openEdit(item)} className="p-2 text-zinc-500 hover:text-rosebrand-600 hover:bg-rosebrand-50 rounded-[6px] transition">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => deleteItem(item)} className="p-2 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-[6px] transition">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-zinc-500">
                  Belum ada data prestasi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-zinc-950/40 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-[12px] shadow-soft overflow-hidden my-8">
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
              <h3 className="text-lg font-black text-zinc-900">
                {modalMode === "create" ? "Tambah Prestasi" : "Edit Prestasi"}
              </h3>
              <button onClick={() => setModalMode(null)} className="text-zinc-400 hover:text-zinc-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={onSubmit} className="p-6 grid gap-4">
              {notice && (
                <div className={`p-4 rounded-[8px] text-sm font-bold ${notice.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                  {notice.message}
                </div>
              )}
              
              <label className="grid gap-1.5 text-sm font-bold text-zinc-700">
                Judul Prestasi
                <input required type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="rounded-[8px] border border-zinc-200 px-3 py-2.5 outline-none focus:border-rosebrand-500 font-normal" />
              </label>

              <label className="grid gap-1.5 text-sm font-bold text-zinc-700">
                Nama Siswa / Tim
                <input required type="text" value={form.studentName} onChange={e => setForm({ ...form, studentName: e.target.value })} className="rounded-[8px] border border-zinc-200 px-3 py-2.5 outline-none focus:border-rosebrand-500 font-normal" />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="grid gap-1.5 text-sm font-bold text-zinc-700">
                  Tingkat
                  <input required type="text" placeholder="Misal: Nasional" value={form.achievementLevel} onChange={e => setForm({ ...form, achievementLevel: e.target.value })} className="rounded-[8px] border border-zinc-200 px-3 py-2.5 outline-none focus:border-rosebrand-500 font-normal" />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-zinc-700">
                  Tanggal Pencapaian
                  <input required type="date" value={form.achievedAt} onChange={e => setForm({ ...form, achievedAt: e.target.value })} className="rounded-[8px] border border-zinc-200 px-3 py-2.5 outline-none focus:border-rosebrand-500 font-normal" />
                </label>
              </div>

              <label className="grid gap-1.5 text-sm font-bold text-zinc-700">
                URL Gambar (Opsional)
                <input type="text" value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} className="rounded-[8px] border border-zinc-200 px-3 py-2.5 outline-none focus:border-rosebrand-500 font-normal" />
              </label>

              <label className="grid gap-1.5 text-sm font-bold text-zinc-700">
                Deskripsi Singkat
                <textarea required rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="rounded-[8px] border border-zinc-200 px-3 py-2.5 outline-none focus:border-rosebrand-500 font-normal" />
              </label>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 mt-2">
                <button type="button" onClick={() => setModalMode(null)} className="h-10 px-4 rounded-[8px] font-bold text-zinc-600 hover:bg-zinc-100 transition">
                  Batal
                </button>
                <button type="submit" disabled={loading} className="h-10 px-5 rounded-[8px] font-extrabold text-white bg-rosebrand-500 hover:bg-rosebrand-600 transition disabled:opacity-50">
                  {loading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
