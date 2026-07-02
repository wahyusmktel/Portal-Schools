"use client";

import { useState, FormEvent, useEffect } from "react";
import { Plus, Edit2, Trash2, X } from "lucide-react";
import { Alumni } from "@/types/content";
import { API_URL } from "@/lib/api";
import { getCookie } from "@/lib/auth-client";

export function AlumniManager() {
  const [items, setItems] = useState<Alumni[]>([]);
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [form, setForm] = useState({
    id: 0,
    name: "",
    graduationYear: new Date().getFullYear(),
    currentStatus: "Bekerja",
    companyOrUniversity: "",
    testimonial: "",
    imageUrl: ""
  });

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    const res = await fetch(`${API_URL}/alumni`).catch(() => null);
    if (res?.ok) {
      const data = await res.json();
      setItems(data || []);
    }
  }

  function openCreate() {
    setForm({
      id: 0,
      name: "",
      graduationYear: new Date().getFullYear(),
      currentStatus: "Bekerja",
      companyOrUniversity: "",
      testimonial: "",
      imageUrl: ""
    });
    setNotice(null);
    setModalMode("create");
  }

  function openEdit(item: Alumni) {
    setForm({
      id: item.id,
      name: item.name,
      graduationYear: item.graduationYear,
      currentStatus: item.currentStatus || "Bekerja",
      companyOrUniversity: item.companyOrUniversity || "",
      testimonial: item.testimonial || "",
      imageUrl: item.imageUrl || ""
    });
    setNotice(null);
    setModalMode("edit");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setNotice(null);

    const endpoint = modalMode === "edit" ? `${API_URL}/alumni/${form.id}` : `${API_URL}/alumni`;
    const { id, ...payload } = form;

    const res = await fetch(endpoint, {
      method: modalMode === "edit" ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": getCookie("csrf_token")
      },
      credentials: "include",
      body: JSON.stringify({
        ...payload,
        graduationYear: parseInt(payload.graduationYear.toString(), 10)
      })
    }).catch(() => null);

    setLoading(false);
    if (res?.ok) {
      setNotice({ type: "success", message: "Alumni berhasil disimpan." });
      setModalMode(null);
      fetchItems();
    } else {
      setNotice({ type: "error", message: "Gagal menyimpan alumni." });
    }
  }

  async function deleteItem(item: Alumni) {
    if (!window.confirm(`Hapus alumni "${item.name}"?`)) return;
    
    const res = await fetch(`${API_URL}/alumni/${item.id}`, {
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
          <h1 className="text-2xl font-black text-zinc-900">Direktori Alumni</h1>
          <p className="text-zinc-600 mt-1">Kelola data alumni dan testimoni.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex h-11 items-center gap-2 rounded-[8px] bg-rosebrand-500 px-5 text-sm font-extrabold text-white transition hover:bg-rosebrand-600"
        >
          <Plus size={18} /> Tambah Alumni
        </button>
      </div>

      <div className="rounded-[8px] border border-zinc-200 bg-white overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[800px]">
          <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600">
            <tr>
              <th className="px-6 py-4 font-extrabold">Nama</th>
              <th className="px-6 py-4 font-extrabold">Tahun Lulus</th>
              <th className="px-6 py-4 font-extrabold">Status / Instansi</th>
              <th className="px-6 py-4 font-extrabold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-zinc-50/50 transition">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-10 h-10 object-cover bg-zinc-50 rounded-full" />
                    ) : (
                      <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400 font-bold text-xs">
                        Foto
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-zinc-900">{item.name}</div>
                      <div className="text-zinc-500 text-xs mt-1 line-clamp-1 max-w-[250px]">{item.testimonial}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 font-bold text-zinc-700">{item.graduationYear}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1 text-xs">
                    <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 px-2.5 py-0.5 font-bold w-max">
                      {item.currentStatus}
                    </span>
                    <span className="text-zinc-600">{item.companyOrUniversity}</span>
                  </div>
                </td>
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
                  Belum ada data alumni.
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
                {modalMode === "create" ? "Tambah Alumni" : "Edit Alumni"}
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
              
              <div className="grid grid-cols-3 gap-4">
                <label className="col-span-2 grid gap-1.5 text-sm font-bold text-zinc-700">
                  Nama Alumni
                  <input required type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="rounded-[8px] border border-zinc-200 px-3 py-2.5 outline-none focus:border-rosebrand-500 font-normal" />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-zinc-700">
                  Tahun Lulus
                  <input required type="number" min="1950" max="2100" value={form.graduationYear} onChange={e => setForm({ ...form, graduationYear: parseInt(e.target.value) || new Date().getFullYear() })} className="rounded-[8px] border border-zinc-200 px-3 py-2.5 outline-none focus:border-rosebrand-500 font-normal" />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="grid gap-1.5 text-sm font-bold text-zinc-700">
                  Status Saat Ini
                  <select required value={form.currentStatus} onChange={e => setForm({ ...form, currentStatus: e.target.value })} className="rounded-[8px] border border-zinc-200 px-3 py-2.5 outline-none focus:border-rosebrand-500 font-normal">
                    <option value="Bekerja">Bekerja</option>
                    <option value="Kuliah">Kuliah</option>
                    <option value="Wirausaha">Wirausaha</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-zinc-700">
                  Instansi / Kampus
                  <input type="text" value={form.companyOrUniversity} onChange={e => setForm({ ...form, companyOrUniversity: e.target.value })} className="rounded-[8px] border border-zinc-200 px-3 py-2.5 outline-none focus:border-rosebrand-500 font-normal" />
                </label>
              </div>

              <label className="grid gap-1.5 text-sm font-bold text-zinc-700">
                URL Foto (Opsional)
                <input type="text" placeholder="https://..." value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} className="rounded-[8px] border border-zinc-200 px-3 py-2.5 outline-none focus:border-rosebrand-500 font-normal" />
              </label>

              <label className="grid gap-1.5 text-sm font-bold text-zinc-700">
                Testimoni
                <textarea rows={3} value={form.testimonial} onChange={e => setForm({ ...form, testimonial: e.target.value })} className="rounded-[8px] border border-zinc-200 px-3 py-2.5 outline-none focus:border-rosebrand-500 font-normal" />
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
