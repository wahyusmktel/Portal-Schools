"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { Edit2, ImagePlus, Plus, Save, Trash2, X } from "lucide-react";
import { adminFetch, responseMessage } from "@/lib/auth-client";
import { normalizeImageUrl } from "@/lib/image-url";
import type { HeroSlide } from "@/types/content";

type HeroSlideManagerProps = {
  initialItems: HeroSlide[];
};

const blankSlide: Omit<HeroSlide, "id"> = {
  title: "",
  subtitle: "",
  imageUrl: "",
  eyebrow: "Portal Resmi Sekolah",
  primaryText: "Lihat Berita",
  primaryUrl: "#artikel",
  secondText: "Profil Jurusan",
  secondUrl: "#jurusan",
  sortOrder: 1,
  isActive: true
};

export function HeroSlideManager({ initialItems }: HeroSlideManagerProps) {
  const [items, setItems] = useState<HeroSlide[]>(initialItems || []);
  const [form, setForm] = useState<Omit<HeroSlide, "id">>(blankSlide);
  const [editingItem, setEditingItem] = useState<HeroSlide | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id),
    [items]
  );

  function resetForm() {
    setForm({ ...blankSlide, sortOrder: items.length + 1 });
    setEditingItem(null);
    setNotice(null);
  }

  function openCreateModal() {
    resetForm();
    setIsModalOpen(true);
  }

  function openEditModal(item: HeroSlide) {
    setEditingItem(item);
    setForm({
      title: item.title || "",
      subtitle: item.subtitle || "",
      imageUrl: item.imageUrl || "",
      eyebrow: item.eyebrow || "Portal Resmi Sekolah",
      primaryText: item.primaryText || "Lihat Berita",
      primaryUrl: item.primaryUrl || "#artikel",
      secondText: item.secondText || "Profil Jurusan",
      secondUrl: item.secondUrl || "#jurusan",
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

  async function uploadImage(file: File) {
    const formData = new FormData();
    formData.append("image", file);
    const response = await adminFetch("/uploads/images", {
      method: "POST",
      body: formData
    });
    if (!response.ok) {
      throw new Error(await responseMessage(response, "Gagal mengunggah gambar slide"));
    }
    const data = (await response.json()) as { url?: string };
    if (!data.url) {
      throw new Error("Upload berhasil tetapi URL gambar tidak diterima.");
    }
    return data.url;
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setNotice({ type: "error", message: "File slide harus berupa gambar." });
      input.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setNotice({ type: "error", message: "Ukuran gambar maksimal 5MB." });
      input.value = "";
      return;
    }

    setUploading(true);
    setNotice(null);
    try {
      const url = await uploadImage(file);
      setForm((current) => ({ ...current, imageUrl: url }));
      setNotice({ type: "success", message: "Gambar slide berhasil diunggah." });
    } catch (error: any) {
      setNotice({ type: "error", message: error.message || "Gagal mengunggah gambar slide." });
    } finally {
      setUploading(false);
      input.value = "";
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setNotice(null);

    const payload = {
      ...form,
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      imageUrl: form.imageUrl.trim(),
      eyebrow: form.eyebrow.trim() || "Portal Resmi Sekolah",
      primaryText: form.primaryText.trim() || "Lihat Berita",
      primaryUrl: form.primaryUrl.trim() || "#artikel",
      secondText: form.secondText.trim() || "Profil Jurusan",
      secondUrl: form.secondUrl.trim() || "#jurusan",
      sortOrder: Number(form.sortOrder) || 0,
      isActive: Boolean(form.isActive)
    };

    try {
      const url = editingItem ? `/hero-slides/${editingItem.id}` : "/hero-slides";
      const method = editingItem ? "PUT" : "POST";
      const response = await adminFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error(await responseMessage(response, "Gagal menyimpan slide hero"));
      }

      if (editingItem) {
        setItems((current) => current.map((item) => (item.id === editingItem.id ? { ...item, ...payload } : item)));
      } else {
        const data = (await response.json()) as { id: number };
        setItems((current) => [...current, { ...payload, id: data.id }]);
      }
      closeModal();
    } catch (error: any) {
      setNotice({ type: "error", message: error.message || "Gagal menyimpan slide hero." });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(item: HeroSlide) {
    if (!window.confirm(`Hapus slide "${item.title}"?`)) return;
    setNotice(null);
    try {
      const response = await adminFetch(`/hero-slides/${item.id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error(await responseMessage(response, "Gagal menghapus slide hero"));
      }
      setItems((current) => current.filter((slide) => slide.id !== item.id));
    } catch (error: any) {
      setNotice({ type: "error", message: error.message || "Gagal menghapus slide hero." });
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
          <p className="text-sm font-bold text-zinc-500">{items.length} slide tersimpan</p>
          <p className="mt-1 text-sm font-semibold text-zinc-500">Slide aktif tampil di hero halaman utama sesuai urutan.</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-rosebrand-600 px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-rosebrand-700"
        >
          <Plus size={18} aria-hidden />
          Tambah Slide
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {sortedItems.map((item) => (
          <article key={item.id} className="group overflow-hidden rounded-[8px] border border-zinc-100 bg-white shadow-sm transition hover:border-rosebrand-200 hover:shadow-md">
            <div className="relative aspect-[16/10] bg-zinc-100">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={normalizeImageUrl(item.imageUrl)} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              ) : (
                <div className="grid h-full place-items-center text-zinc-300">
                  <ImagePlus size={42} aria-hidden />
                </div>
              )}
              <div className="absolute left-3 top-3 rounded-full bg-zinc-950/70 px-3 py-1 text-xs font-black text-white backdrop-blur">
                Urutan {item.sortOrder}
              </div>
              <div className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-black backdrop-blur ${item.isActive ? "bg-emerald-500/90 text-white" : "bg-zinc-950/70 text-white"}`}>
                {item.isActive ? "Aktif" : "Nonaktif"}
              </div>
            </div>
            <div className="grid gap-4 p-5">
              <div>
                <p className="text-xs font-extrabold uppercase text-rosebrand-600">{item.eyebrow || "Portal Resmi Sekolah"}</p>
                <h2 className="mt-2 line-clamp-2 text-xl font-black text-zinc-950">{item.title}</h2>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-600">{item.subtitle}</p>
              </div>
              <div className="flex gap-2">
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
            </div>
          </article>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[8px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
              <div>
                <p className="text-xs font-extrabold uppercase text-rosebrand-600">Slider Hero</p>
                <h2 className="text-xl font-black text-zinc-950">{editingItem ? "Edit Slide" : "Tambah Slide"}</h2>
              </div>
              <button type="button" onClick={closeModal} className="grid h-10 w-10 place-items-center rounded-full bg-zinc-100 text-zinc-600 transition hover:bg-zinc-200">
                <X size={18} aria-hidden />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto p-6">
              {notice && (
                <div className={`mb-4 rounded-[8px] px-4 py-3 text-sm font-bold ${notice.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rosebrand-50 text-rosebrand-700"}`}>
                  {notice.message}
                </div>
              )}

              <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="grid gap-4">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-[8px] bg-zinc-100">
                    {form.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={normalizeImageUrl(form.imageUrl)} alt="Preview slide hero" className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full place-items-center text-center text-sm font-bold text-zinc-400">
                        Belum ada gambar
                      </div>
                    )}
                  </div>

                  <label className="grid gap-2 text-sm font-bold text-zinc-700">
                    URL Gambar
                    <input
                      value={form.imageUrl}
                      onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
                      className="rounded-[8px] border border-zinc-200 px-4 py-3 outline-none focus:border-rosebrand-500"
                      placeholder="https://..."
                      required
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-bold text-zinc-700">
                    Unggah Gambar dari Komputer
                    <span className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-[8px] border border-dashed px-4 py-4 text-center transition ${uploading ? "cursor-wait border-zinc-200 bg-zinc-50" : "cursor-pointer border-zinc-300 bg-softgray hover:border-rosebrand-300 hover:bg-rosebrand-50"}`}>
                      <ImagePlus size={24} className={uploading ? "text-zinc-400" : "text-rosebrand-600"} aria-hidden />
                      <span className="text-sm font-extrabold text-zinc-700">{uploading ? "Mengunggah..." : "Pilih gambar JPG, PNG, atau WEBP"}</span>
                      <span className="text-xs font-semibold text-zinc-500">Maksimal 5MB.</span>
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} disabled={uploading} className="sr-only" />
                    </span>
                  </label>
                </div>

                <div className="grid gap-4">
                  <TextField label="Label Kecil" value={form.eyebrow} onChange={(value) => setForm({ ...form, eyebrow: value })} />
                  <TextField label="Judul Utama" value={form.title} onChange={(value) => setForm({ ...form, title: value })} required />
                  <label className="grid gap-2 text-sm font-bold text-zinc-700">
                    Deskripsi
                    <textarea
                      value={form.subtitle}
                      onChange={(event) => setForm({ ...form, subtitle: event.target.value })}
                      rows={4}
                      className="rounded-[8px] border border-zinc-200 px-4 py-3 outline-none focus:border-rosebrand-500"
                      required
                    />
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <TextField label="Teks CTA Utama" value={form.primaryText} onChange={(value) => setForm({ ...form, primaryText: value })} />
                    <TextField label="Link CTA Utama" value={form.primaryUrl} onChange={(value) => setForm({ ...form, primaryUrl: value })} />
                    <TextField label="Teks CTA Kedua" value={form.secondText} onChange={(value) => setForm({ ...form, secondText: value })} />
                    <TextField label="Link CTA Kedua" value={form.secondUrl} onChange={(value) => setForm({ ...form, secondUrl: value })} />
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
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-zinc-100 pt-5">
                <button type="button" onClick={closeModal} className="rounded-[8px] border border-zinc-200 px-5 py-3 text-sm font-extrabold text-zinc-700 transition hover:bg-zinc-50">
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading || uploading}
                  className="inline-flex items-center justify-center gap-2 rounded-[8px] bg-rosebrand-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-rosebrand-700 disabled:opacity-60"
                >
                  <Save size={17} aria-hidden />
                  {loading ? "Menyimpan..." : "Simpan Slide"}
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
