"use client";

import { useState, useMemo, FormEvent } from "react";
import { Plus, Edit2, Trash2, X, Megaphone } from "lucide-react";
import { Announcement } from "@/types/content";
import { API_URL } from "@/lib/api";
import { getCookie } from "@/lib/auth-client";
import { formatDate } from "@/lib/article-utils";

export function AnnouncementManager({ initialItems }: { initialItems: Announcement[] }) {
  const [items, setItems] = useState<Announcement[]>(initialItems);
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [form, setForm] = useState({
    id: 0,
    title: "",
    body: "",
    status: "published" as "published" | "draft"
  });

  function openCreate() {
    setForm({ id: 0, title: "", body: "", status: "published" });
    setNotice(null);
    setModalMode("create");
  }

  function openEdit(item: Announcement) {
    setForm({
      id: item.id,
      title: item.title,
      body: item.body,
      status: item.status === "draft" ? "draft" : "published"
    });
    setNotice(null);
    setModalMode("edit");
  }

  async function fetchItems() {
    const res = await fetch(`${API_URL}/announcements?include_draft=true`).catch(() => null);
    if (res?.ok) {
      const data = await res.json();
      setItems(data);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setNotice(null);

    const endpoint = modalMode === "edit" ? `${API_URL}/announcements/${form.id}` : `${API_URL}/announcements`;
    const { id, ...payload } = form;

    const res = await fetch(endpoint, {
      method: modalMode === "edit" ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": getCookie("csrf_token")
      },
      credentials: "include",
      body: JSON.stringify(payload)
    }).catch(() => null);

    setLoading(false);
    if (res?.ok) {
      setNotice({ type: "success", message: "Pengumuman berhasil disimpan." });
      setModalMode(null);
      fetchItems();
    } else {
      setNotice({ type: "error", message: "Gagal menyimpan pengumuman." });
    }
  }

  async function deleteItem(item: Announcement) {
    if (!window.confirm(`Hapus pengumuman "${item.title}"?`)) return;
    
    const res = await fetch(`${API_URL}/announcements/${item.id}`, {
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
          <h1 className="text-2xl font-black text-zinc-900">Manajemen Pengumuman</h1>
          <p className="text-zinc-600 mt-1">Kelola daftar pengumuman penting portal sekolah.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex h-11 items-center gap-2 rounded-[8px] bg-rosebrand-500 px-5 text-sm font-extrabold text-white transition hover:bg-rosebrand-600"
        >
          <Plus size={18} /> Tambah Pengumuman
        </button>
      </div>

      <div className="rounded-[8px] border border-zinc-200 bg-white overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600">
            <tr>
              <th className="px-6 py-4 font-extrabold">Judul</th>
              <th className="px-6 py-4 font-extrabold">Status</th>
              <th className="px-6 py-4 font-extrabold">Dibuat</th>
              <th className="px-6 py-4 font-extrabold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-zinc-50/50 transition">
                <td className="px-6 py-4">
                  <div className="font-bold text-zinc-900">{item.title}</div>
                  <div className="text-zinc-500 text-xs mt-1 line-clamp-1 max-w-md">{item.body}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
                    item.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-700"
                  }`}>
                    {item.status === "published" ? "Aktif" : "Draft"}
                  </span>
                </td>
                <td className="px-6 py-4 text-zinc-600">{formatDate(item.publishedAt)}</td>
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
                <td colSpan={4} className="px-6 py-10 text-center text-zinc-500">
                  Belum ada data pengumuman.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-zinc-950/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-[12px] shadow-soft overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
              <h3 className="text-lg font-black text-zinc-900">
                {modalMode === "create" ? "Tambah Pengumuman" : "Edit Pengumuman"}
              </h3>
              <button onClick={() => setModalMode(null)} className="text-zinc-400 hover:text-zinc-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={onSubmit} className="p-6 grid gap-5">
              {notice && (
                <div className={`p-4 rounded-[8px] text-sm font-bold ${notice.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                  {notice.message}
                </div>
              )}
              <label className="grid gap-2 text-sm font-bold text-zinc-700">
                Judul Pengumuman
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="rounded-[8px] border border-zinc-200 px-4 py-3 outline-none focus:border-rosebrand-500"
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-zinc-700">
                Isi Pengumuman
                <textarea
                  required
                  rows={4}
                  value={form.body}
                  onChange={e => setForm({ ...form, body: e.target.value })}
                  className="rounded-[8px] border border-zinc-200 px-4 py-3 outline-none focus:border-rosebrand-500"
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-zinc-700">
                Status
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value as any })}
                  className="rounded-[8px] border border-zinc-200 px-4 py-3 outline-none focus:border-rosebrand-500"
                >
                  <option value="published">Aktif (Tampil di Beranda)</option>
                  <option value="draft">Draft (Disembunyikan)</option>
                </select>
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalMode(null)} className="h-11 px-5 rounded-[8px] font-bold text-zinc-600 hover:bg-zinc-100 transition">
                  Batal
                </button>
                <button type="submit" disabled={loading} className="h-11 px-5 rounded-[8px] font-extrabold text-white bg-rosebrand-500 hover:bg-rosebrand-600 transition disabled:opacity-50">
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
