"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Download, Edit2, Eye, FileText, ImagePlus, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { adminFetch, responseMessage } from "@/lib/auth-client";
import { normalizeImageUrl } from "@/lib/image-url";
import type { TeachingModule } from "@/types/content";

type TeachingModuleManagerProps = {
  initialItems: TeachingModule[];
};

type FormState = {
  id?: number;
  title: string;
  description: string;
  subject: string;
  gradeLevel: string;
  authorName: string;
  coverImage: string;
  fileUrl: string;
  fileSize: number;
  pageCount: number;
  sortOrder: number;
  isPublished: boolean;
};

const emptyForm: FormState = {
  title: "",
  description: "",
  subject: "Umum",
  gradeLevel: "X",
  authorName: "SMK Telkom Lampung",
  coverImage: "",
  fileUrl: "",
  fileSize: 0,
  pageCount: 0,
  sortOrder: 0,
  isPublished: true
};

export function TeachingModuleManager({ initialItems }: TeachingModuleManagerProps) {
  const [items, setItems] = useState<TeachingModule[]>(initialItems || []);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [documentUploading, setDocumentUploading] = useState(false);

  const sortedItems = useMemo(() => [...items].sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title)), [items]);

  function openCreateModal() {
    setForm({ ...emptyForm, sortOrder: items.length + 1 });
    setNotice(null);
    setModalMode("create");
  }

  function openEditModal(item: TeachingModule) {
    setForm({
      id: item.id,
      title: item.title,
      description: item.description,
      subject: item.subject || "Umum",
      gradeLevel: item.gradeLevel || "X",
      authorName: item.authorName || "SMK Telkom Lampung",
      coverImage: item.coverImage || "",
      fileUrl: item.fileUrl || "",
      fileSize: item.fileSize || 0,
      pageCount: item.pageCount || 0,
      sortOrder: item.sortOrder || 0,
      isPublished: item.isPublished !== false
    });
    setNotice(null);
    setModalMode("edit");
  }

  function closeModal() {
    if (loading || coverUploading || documentUploading) return;
    setModalMode(null);
    setForm(emptyForm);
  }

  async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      setNotice({ type: "error", message: "Cover harus berupa gambar JPG, PNG, atau WEBP maksimal 5MB." });
      input.value = "";
      return;
    }

    setCoverUploading(true);
    setNotice(null);
    const formData = new FormData();
    formData.append("image", file);
    try {
      const response = await adminFetch("/uploads/images", { method: "POST", body: formData });
      if (!response.ok) throw new Error(await responseMessage(response, "Gagal mengunggah cover"));
      const data = (await response.json()) as { url?: string };
      if (!data.url) throw new Error("Upload berhasil tetapi URL cover tidak diterima.");
      setForm((current) => ({ ...current, coverImage: data.url || "" }));
      setNotice({ type: "success", message: "Cover berhasil diunggah." });
    } catch (error: any) {
      setNotice({ type: "error", message: error.message || "Gagal mengunggah cover." });
    } finally {
      setCoverUploading(false);
      input.value = "";
    }
  }

  async function uploadDocument(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) {
      setNotice({ type: "error", message: "File modul harus berupa PDF." });
      input.value = "";
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setNotice({ type: "error", message: "Ukuran PDF maksimal 100MB." });
      input.value = "";
      return;
    }

    setDocumentUploading(true);
    setNotice(null);
    const formData = new FormData();
    formData.append("document", file);
    try {
      const response = await adminFetch("/uploads/documents", { method: "POST", body: formData });
      if (!response.ok) throw new Error(await responseMessage(response, "Gagal mengunggah PDF"));
      const data = (await response.json()) as { url?: string; fileSize?: number };
      if (!data.url) throw new Error("Upload berhasil tetapi URL PDF tidak diterima.");
      setForm((current) => ({ ...current, fileUrl: data.url || "", fileSize: data.fileSize || file.size }));
      setNotice({ type: "success", message: "PDF modul berhasil diunggah." });
    } catch (error: any) {
      setNotice({ type: "error", message: error.message || "Gagal mengunggah PDF." });
    } finally {
      setDocumentUploading(false);
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
      description: form.description.trim(),
      subject: form.subject.trim() || "Umum",
      gradeLevel: form.gradeLevel.trim() || "Semua Tingkat",
      authorName: form.authorName.trim() || "SMK Telkom Lampung",
      coverImage: form.coverImage.trim(),
      fileUrl: form.fileUrl.trim(),
      fileSize: Number(form.fileSize) || 0,
      pageCount: Number(form.pageCount) || 0,
      sortOrder: Number(form.sortOrder) || 0,
      isPublished: Boolean(form.isPublished)
    };

    try {
      const url = modalMode === "edit" && form.id ? `/teaching-modules/${form.id}` : "/teaching-modules";
      const method = modalMode === "edit" ? "PUT" : "POST";
      const response = await adminFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(await responseMessage(response, "Gagal menyimpan modul ajar"));

      if (modalMode === "edit" && form.id) {
        setItems((current) => current.map((item) => (item.id === form.id ? { ...item, ...payload } as TeachingModule : item)));
      } else {
        const data = (await response.json()) as { id: number };
        setItems((current) => [...current, { ...payload, id: data.id, slug: slugPreview(payload.title), viewCount: 0, downloadCount: 0 } as TeachingModule]);
      }
      setNotice({ type: "success", message: "Modul ajar berhasil disimpan." });
      setModalMode(null);
      setForm(emptyForm);
    } catch (error: any) {
      setNotice({ type: "error", message: error.message || "Gagal menyimpan modul ajar." });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(item: TeachingModule) {
    if (!window.confirm(`Hapus modul "${item.title}"?`)) return;
    setNotice(null);
    try {
      const response = await adminFetch(`/teaching-modules/${item.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await responseMessage(response, "Gagal menghapus modul ajar"));
      setItems((current) => current.filter((module) => module.id !== item.id));
      setNotice({ type: "success", message: "Modul ajar berhasil dihapus." });
    } catch (error: any) {
      setNotice({ type: "error", message: error.message || "Gagal menghapus modul ajar." });
    }
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-col justify-between gap-4 rounded-[8px] bg-white p-5 shadow-sm md:flex-row md:items-center">
        <div>
          <h2 className="text-xl font-black text-zinc-950">Data Modul Ajar</h2>
          <p className="mt-1 text-sm font-semibold text-zinc-500">{items.length} modul tersimpan.</p>
        </div>
        <button type="button" onClick={openCreateModal} className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-rosebrand-500 px-5 text-sm font-extrabold text-white transition hover:bg-rosebrand-600">
          <Plus size={18} aria-hidden />
          Tambah Modul
        </button>
      </div>

      {notice && (
        <div className={`rounded-[8px] px-4 py-3 text-sm font-bold ${notice.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rosebrand-50 text-rosebrand-700"}`}>
          {notice.message}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sortedItems.map((item) => (
          <article key={item.id} className="overflow-hidden rounded-[8px] bg-white shadow-sm">
            <div className="relative aspect-[16/10] bg-zinc-100">
              {item.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={normalizeImageUrl(item.coverImage)} alt={item.title} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-zinc-300"><FileText size={44} aria-hidden /></div>
              )}
              <span className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-black ${item.isPublished ? "bg-emerald-500 text-white" : "bg-zinc-900 text-white"}`}>
                {item.isPublished ? "Publish" : "Draft"}
              </span>
            </div>
            <div className="grid gap-4 p-5">
              <div>
                <p className="text-xs font-black uppercase text-rosebrand-600">{item.subject} · {item.gradeLevel}</p>
                <h3 className="mt-2 line-clamp-2 text-xl font-black text-zinc-950">{item.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-zinc-500">{item.description}</p>
              </div>
              <div className="flex items-center justify-between text-xs font-black text-zinc-500">
                <span className="inline-flex items-center gap-1"><Eye size={14} aria-hidden /> {item.viewCount}</span>
                <span className="inline-flex items-center gap-1"><Download size={14} aria-hidden /> {item.downloadCount}</span>
                <span>{formatFileSize(item.fileSize)}</span>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => openEditModal(item)} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-[8px] bg-zinc-900 px-4 text-sm font-extrabold text-white transition hover:bg-rosebrand-600">
                  <Edit2 size={16} aria-hidden /> Edit
                </button>
                <button type="button" onClick={() => void handleDelete(item)} className="grid h-10 w-10 place-items-center rounded-[8px] border border-zinc-200 text-zinc-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600" aria-label={`Hapus ${item.title}`}>
                  <Trash2 size={16} aria-hidden />
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      {modalMode && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-zinc-950/60 p-4 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[8px] bg-white p-6 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-extrabold uppercase text-rosebrand-600">{modalMode === "edit" ? "Edit Modul" : "Tambah Modul"}</p>
                <h2 className="mt-2 text-2xl font-black text-zinc-950">{modalMode === "edit" ? form.title : "Modul ajar baru"}</h2>
              </div>
              <button type="button" onClick={closeModal} className="grid h-10 w-10 place-items-center rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200">
                <X size={18} aria-hidden />
              </button>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[0.42fr_0.58fr]">
              <div className="grid gap-4">
                <div className="overflow-hidden rounded-[8px] border border-zinc-200 bg-zinc-100">
                  {form.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={normalizeImageUrl(form.coverImage)} alt="Preview cover modul" className="h-72 w-full object-cover" />
                  ) : (
                    <div className="grid h-72 place-items-center text-center text-sm font-bold text-zinc-400">Preview cover</div>
                  )}
                </div>

                <label className="grid gap-2 text-sm font-bold text-zinc-700">
                  Cover Image URL
                  <input value={form.coverImage} onChange={(event) => setForm({ ...form, coverImage: event.target.value })} className="rounded-[8px] border border-zinc-200 px-4 py-3 outline-none focus:border-rosebrand-500" placeholder="https://..." />
                </label>
                <UploadBox label="Unggah Cover dari Lokal" loading={coverUploading} icon="image">
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadImage} disabled={coverUploading} className="sr-only" />
                </UploadBox>

                <label className="grid gap-2 text-sm font-bold text-zinc-700">
                  File PDF Modul
                  <input value={form.fileUrl} onChange={(event) => setForm({ ...form, fileUrl: event.target.value })} className="rounded-[8px] border border-zinc-200 px-4 py-3 outline-none focus:border-rosebrand-500" placeholder="https://.../modul.pdf" required />
                </label>
                <UploadBox label="Unggah PDF Maks. 100MB" loading={documentUploading} icon="pdf">
                  <input type="file" accept="application/pdf,.pdf" onChange={uploadDocument} disabled={documentUploading} className="sr-only" />
                </UploadBox>
                {form.fileUrl && <p className="rounded-[8px] bg-zinc-50 px-4 py-3 text-xs font-bold text-zinc-500">{formatFileSize(form.fileSize)} · PDF siap disimpan</p>}
              </div>

              <div className="grid gap-4">
                <Field label="Judul Modul" value={form.title} onChange={(value) => setForm({ ...form, title: value })} required />
                <label className="grid gap-2 text-sm font-bold text-zinc-700">
                  Deskripsi
                  <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={5} className="rounded-[8px] border border-zinc-200 px-4 py-3 outline-none focus:border-rosebrand-500" required />
                </label>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Mata Pelajaran" value={form.subject} onChange={(value) => setForm({ ...form, subject: value })} required />
                  <Field label="Tingkat/Kelas" value={form.gradeLevel} onChange={(value) => setForm({ ...form, gradeLevel: value })} required />
                  <Field label="Penulis" value={form.authorName} onChange={(value) => setForm({ ...form, authorName: value })} required />
                  <label className="grid gap-2 text-sm font-bold text-zinc-700">
                    Jumlah Halaman PDF
                    <input type="number" min={0} value={form.pageCount} onChange={(event) => setForm({ ...form, pageCount: Number(event.target.value) })} className="rounded-[8px] border border-zinc-200 px-4 py-3 outline-none focus:border-rosebrand-500" />
                  </label>
                  <label className="grid gap-2 text-sm font-bold text-zinc-700">
                    Urutan
                    <input type="number" min={0} value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })} className="rounded-[8px] border border-zinc-200 px-4 py-3 outline-none focus:border-rosebrand-500" />
                  </label>
                  <label className="flex items-center gap-3 rounded-[8px] border border-zinc-200 px-4 py-3 text-sm font-bold text-zinc-700">
                    <input type="checkbox" checked={form.isPublished} onChange={(event) => setForm({ ...form, isPublished: event.target.checked })} className="h-5 w-5 rounded border-zinc-300 text-rosebrand-600 focus:ring-rosebrand-500" />
                    Publish
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-zinc-100 pt-5">
              <button type="button" onClick={closeModal} className="rounded-[8px] border border-zinc-200 px-5 py-3 text-sm font-extrabold text-zinc-700">Batal</button>
              <button type="submit" disabled={loading || coverUploading || documentUploading} className="inline-flex items-center gap-2 rounded-[8px] bg-rosebrand-500 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-rosebrand-600 disabled:opacity-60">
                <Save size={17} aria-hidden />
                {loading ? "Menyimpan..." : "Simpan Modul"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function UploadBox({ label, loading, icon, children }: { label: string; loading: boolean; icon: "image" | "pdf"; children: ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-zinc-700">
      {label}
      <span className={`flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-[8px] border border-dashed px-4 py-4 text-center transition ${loading ? "border-zinc-200 bg-zinc-50 text-zinc-400" : "border-zinc-300 bg-softgray text-zinc-700 hover:border-rosebrand-300 hover:bg-rosebrand-50 hover:text-rosebrand-700"}`}>
        {loading ? <Loader2 size={22} className="animate-spin" aria-hidden /> : icon === "image" ? <ImagePlus size={22} aria-hidden /> : <FileText size={22} aria-hidden />}
        <span className="text-sm font-extrabold">{loading ? "Mengunggah..." : label}</span>
        {children}
      </span>
    </label>
  );
}

function Field({ label, value, onChange, required = false }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-zinc-700">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} className="rounded-[8px] border border-zinc-200 px-4 py-3 outline-none focus:border-rosebrand-500" required={required} />
    </label>
  );
}

function formatFileSize(value: number) {
  if (!value) return "Belum ada ukuran";
  const mb = value / (1024 * 1024);
  return `${mb.toLocaleString("id-ID", { maximumFractionDigits: 1 })} MB`;
}

function slugPreview(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
