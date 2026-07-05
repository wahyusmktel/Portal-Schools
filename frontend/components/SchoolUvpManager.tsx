"use client";

import { FormEvent, useMemo, useState } from "react";
import { BadgeCheck, BriefcaseBusiness, Cpu, Edit2, Layers3, Plus, Route, Save, ShieldCheck, Sparkles, Target, Trash2, X } from "lucide-react";
import { adminFetch, responseMessage } from "@/lib/auth-client";
import type { SchoolUVPItem } from "@/types/content";

const iconOptions = [
  { value: "Route", label: "Pathway", icon: Route },
  { value: "BadgeCheck", label: "Branding", icon: BadgeCheck },
  { value: "Layers3", label: "Portofolio", icon: Layers3 },
  { value: "ShieldCheck", label: "Karakter", icon: ShieldCheck },
  { value: "Cpu", label: "Kompetensi", icon: Cpu },
  { value: "Target", label: "Target", icon: Target },
  { value: "Sparkles", label: "Unggulan", icon: Sparkles },
  { value: "BriefcaseBusiness", label: "Karier", icon: BriefcaseBusiness }
];

const blankItem: Omit<SchoolUVPItem, "id"> = {
  title: "",
  subtitle: "",
  description: "",
  category: "",
  icon: "Route",
  highlight: "",
  sortOrder: 1,
  isActive: true
};

export function SchoolUvpManager({ initialItems }: { initialItems: SchoolUVPItem[] }) {
  const [items, setItems] = useState<SchoolUVPItem[]>(initialItems || []);
  const [form, setForm] = useState<Omit<SchoolUVPItem, "id">>(blankItem);
  const [editingItem, setEditingItem] = useState<SchoolUVPItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id),
    [items]
  );

  function resetForm() {
    setForm({ ...blankItem, sortOrder: items.length + 1 });
    setEditingItem(null);
    setNotice(null);
  }

  function openCreateModal() {
    resetForm();
    setIsModalOpen(true);
  }

  function openEditModal(item: SchoolUVPItem) {
    setEditingItem(item);
    setForm({
      title: item.title || "",
      subtitle: item.subtitle || "",
      description: item.description || "",
      category: item.category || "",
      icon: item.icon || "Route",
      highlight: item.highlight || "",
      sortOrder: item.sortOrder || 1,
      isActive: item.isActive !== false,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    });
    setNotice(null);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    resetForm();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setNotice(null);

    const payload = {
      ...form,
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      icon: form.icon || "Route",
      highlight: form.highlight.trim(),
      sortOrder: Number(form.sortOrder) || 0,
      isActive: Boolean(form.isActive)
    };

    try {
      const response = await adminFetch(editingItem ? `/school-uvp/${editingItem.id}` : "/school-uvp", {
        method: editingItem ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error(await responseMessage(response, "Gagal menyimpan UVP sekolah"));
      }

      if (editingItem) {
        setItems((current) => current.map((item) => (item.id === editingItem.id ? { ...item, ...payload } : item)));
      } else {
        const data = (await response.json()) as { id: number };
        setItems((current) => [...current, { ...payload, id: data.id }]);
      }
      closeModal();
    } catch (error: any) {
      setNotice({ type: "error", message: error.message || "Gagal menyimpan UVP sekolah." });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(item: SchoolUVPItem) {
    if (!window.confirm(`Hapus UVP "${item.title}"?`)) return;
    setNotice(null);

    try {
      const response = await adminFetch(`/school-uvp/${item.id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error(await responseMessage(response, "Gagal menghapus UVP sekolah"));
      }
      setItems((current) => current.filter((currentItem) => currentItem.id !== item.id));
    } catch (error: any) {
      setNotice({ type: "error", message: error.message || "Gagal menghapus UVP sekolah." });
    }
  }

  return (
    <div className="grid gap-6">
      {notice && !isModalOpen && (
        <div className={`rounded-[8px] px-4 py-3 text-sm font-bold ${notice.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rosebrand-50 text-rosebrand-700"}`}>
          {notice.message}
        </div>
      )}

      <div className="flex flex-col gap-4 rounded-[8px] border border-zinc-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-zinc-500">{items.length} konten UVP tersimpan</p>
          <p className="mt-1 text-sm font-semibold text-zinc-500">Konten aktif tampil sebagai section merah di bawah Why SMK Telkom Lampung.</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-rosebrand-600 px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-rosebrand-700"
        >
          <Plus size={18} aria-hidden />
          Tambah UVP
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {sortedItems.map((item) => {
          const option = iconOptions.find((icon) => icon.value === item.icon) || iconOptions[0];
          const Icon = option.icon;

          return (
            <article key={item.id} className="rounded-[8px] border border-zinc-100 bg-white p-5 shadow-sm transition hover:border-rosebrand-200 hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[8px] bg-rosebrand-50 text-rosebrand-700">
                    <Icon size={23} aria-hidden />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-black uppercase text-zinc-500">Urutan {item.sortOrder}</span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-black uppercase ${item.isActive ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>
                        {item.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </div>
                    <h2 className="mt-3 text-xl font-black text-zinc-950">{item.title}</h2>
                    <p className="mt-2 text-sm font-bold text-rosebrand-600">{item.subtitle || item.highlight || "UVP sekolah"}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-rosebrand-50 px-3 py-1 text-xs font-black uppercase text-rosebrand-700">{item.category || "Kategori"}</span>
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-black uppercase text-zinc-500">{item.highlight || "Highlight"}</span>
              </div>
              <p className="mt-4 line-clamp-3 text-sm font-semibold leading-7 text-zinc-600">{item.description}</p>
              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(item)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-[8px] bg-zinc-900 px-3 py-2 text-sm font-extrabold text-white transition hover:bg-rosebrand-600"
                >
                  <Edit2 size={16} aria-hidden />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-[8px] border border-zinc-200 text-zinc-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  aria-label={`Hapus ${item.title}`}
                >
                  <Trash2 size={16} aria-hidden />
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[8px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
              <div>
                <p className="text-xs font-extrabold uppercase text-rosebrand-600">Unique Value Proposition</p>
                <h2 className="text-xl font-black text-zinc-950">{editingItem ? "Edit UVP Sekolah" : "Tambah UVP Sekolah"}</h2>
              </div>
              <button type="button" onClick={closeModal} className="grid h-10 w-10 place-items-center rounded-full bg-zinc-100 text-zinc-600 transition hover:bg-zinc-200">
                <X size={18} aria-hidden />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-5 overflow-y-auto p-6">
              {notice && (
                <div className={`rounded-[8px] px-4 py-3 text-sm font-bold ${notice.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rosebrand-50 text-rosebrand-700"}`}>
                  {notice.message}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <TextField label="Judul UVP" value={form.title} onChange={(value) => setForm({ ...form, title: value })} required />
                <TextField label="Subjudul" value={form.subtitle} onChange={(value) => setForm({ ...form, subtitle: value })} required />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <TextField label="Kategori" value={form.category} onChange={(value) => setForm({ ...form, category: value })} required />
                <TextField label="Highlight Singkat" value={form.highlight} onChange={(value) => setForm({ ...form, highlight: value })} />
              </div>

              <label className="grid gap-2 text-sm font-bold text-zinc-700">
                Deskripsi
                <textarea
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  rows={5}
                  className="rounded-[8px] border border-zinc-200 px-4 py-3 outline-none focus:border-rosebrand-500"
                  required
                />
              </label>

              <div className="grid gap-3">
                <p className="text-sm font-bold text-zinc-700">Ikon</p>
                <div className="grid gap-2 sm:grid-cols-4">
                  {iconOptions.map((option) => {
                    const Icon = option.icon;
                    const active = form.icon === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setForm({ ...form, icon: option.value })}
                        className={`flex items-center gap-3 rounded-[8px] border px-4 py-3 text-left text-sm font-extrabold transition ${
                          active ? "border-rosebrand-500 bg-rosebrand-50 text-rosebrand-700" : "border-zinc-200 text-zinc-600 hover:border-rosebrand-200 hover:bg-rosebrand-50"
                        }`}
                      >
                        <Icon size={18} aria-hidden />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold text-zinc-700">
                  Urutan
                  <input
                    type="number"
                    min={0}
                    value={form.sortOrder}
                    onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })}
                    className="rounded-[8px] border border-zinc-200 px-4 py-3 outline-none focus:border-rosebrand-500"
                  />
                </label>
                <label className="flex items-center gap-3 rounded-[8px] border border-zinc-200 px-4 py-3 text-sm font-bold text-zinc-700">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
                    className="h-5 w-5 rounded border-zinc-300 text-rosebrand-600 focus:ring-rosebrand-500"
                  />
                  Tampilkan di halaman utama
                </label>
              </div>

              <div className="flex justify-end gap-3 border-t border-zinc-100 pt-5">
                <button type="button" onClick={closeModal} className="rounded-[8px] border border-zinc-200 px-5 py-3 text-sm font-extrabold text-zinc-700 transition hover:bg-zinc-50">
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-[8px] bg-rosebrand-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-rosebrand-700 disabled:opacity-60"
                >
                  <Save size={17} aria-hidden />
                  {loading ? "Menyimpan..." : "Simpan UVP"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TextField({ label, value, onChange, required = false }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-zinc-700">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-[8px] border border-zinc-200 px-4 py-3 outline-none focus:border-rosebrand-500"
        required={required}
      />
    </label>
  );
}
