"use client";

import { ChangeEvent, FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  ImagePlus,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  X,
  Maximize2,
  Minimize2,
  Sparkles
} from "lucide-react";
import { RichTextEditor } from "./RichTextEditor";
import { API_URL } from "@/lib/api";
import { getCookie } from "@/lib/auth-client";
import { formatDate, readingTime, readCount } from "@/lib/article-utils";
import type { Article } from "@/types/content";

type ArticleManagerProps = {
  initialArticles: Article[];
};

type Notice = {
  type: "success" | "error";
  message: string;
};

type ArticleFormState = {
  id?: number;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  status: "published" | "draft";
};

const emptyForm: ArticleFormState = {
  title: "",
  excerpt: "",
  content: "",
  coverImage: "",
  category: "Sekolah",
  status: "draft"
};

const pageSize = 10;

export function ArticleManager({ initialArticles }: ArticleManagerProps) {
  const [items, setItems] = useState<Article[]>(initialArticles || []);
  const [currentRole, setCurrentRole] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState<ArticleFormState>(emptyForm);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [loading, setLoading] = useState(false);

  const [isMaximized, setIsMaximized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isMaximized) return;
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || isMaximized) return;
    setPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const generateSEO = () => {
    const plainText = form.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    let summary = plainText.slice(0, 155);
    if (plainText.length > 155) {
      summary = summary.replace(/\s+\S*$/, '') + '...';
    }
    setForm((prev) => ({ ...prev, excerpt: summary }));
  };

  useEffect(() => {
    void refreshArticles(false);
    void loadCurrentRole();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [query, status, category]);

  useEffect(() => {
    return () => {
      if (coverPreview.startsWith("blob:")) {
        URL.revokeObjectURL(coverPreview);
      }
    };
  }, [coverPreview]);

  const categories = useMemo(() => {
    const values = new Set(items.map((item) => item.category).filter(Boolean));
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesQuery =
        !normalized ||
        item.title.toLowerCase().includes(normalized) ||
        item.excerpt.toLowerCase().includes(normalized) ||
        item.category.toLowerCase().includes(normalized);
      const matchesStatus = status === "all" || (item.status || "published") === status;
      const matchesCategory = category === "all" || item.category === category;
      return matchesQuery && matchesStatus && matchesCategory;
    });
  }, [items, query, status, category]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const currentItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page]);

  const publishedCount = items.filter((item) => (item.status || "published") === "published").length;
  const draftCount = items.filter((item) => item.status === "draft").length;
  const canEditExisting = currentRole !== "contributor";

  function openCreateModal() {
    resetCoverPreview("");
    setForm(emptyForm);
    setNotice(null);
    setModalMode("create");
  }

  function openEditModal(article: Article) {
    resetCoverPreview(article.coverImage || "");
    setForm({
      id: article.id,
      title: article.title,
      excerpt: article.excerpt,
      content: article.content || "",
      coverImage: article.coverImage || "",
      category: article.category || "Sekolah",
      status: article.status === "draft" ? "draft" : "published"
    });
    setNotice(null);
    setModalMode("edit");
  }

  function closeModal() {
    if (loading) {
      return;
    }
    resetCoverPreview("");
    setForm(emptyForm);
    setModalMode(null);
    setIsMaximized(false);
    setPosition({ x: 0, y: 0 });
  }

  function resetCoverPreview(nextPreview: string) {
    if (coverPreview.startsWith("blob:")) {
      URL.revokeObjectURL(coverPreview);
    }
    setCoverFile(null);
    setCoverPreview(nextPreview);
  }

  function onCoverChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setNotice({ type: "error", message: "File cover harus berupa gambar." });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setNotice({ type: "error", message: "Ukuran cover maksimal 5MB." });
      return;
    }

    resetCoverPreview(URL.createObjectURL(file));
    setCoverFile(file);
    setNotice(null);
  }

  async function refreshArticles(showError = true) {
    const response = await fetch(`${API_URL}/admin/articles`, {
      credentials: "include",
      cache: "no-store",
      headers: { Accept: "application/json" }
    }).catch(() => null);

    if (!response?.ok) {
      if (showError) {
        setNotice({ type: "error", message: "Artikel belum bisa dimuat. Pastikan sesi login masih aktif." });
      }
      return;
    }

    const data = (await response.json()) as Article[];
    setItems(data || []);
    setPage((value) => Math.min(value, Math.max(1, Math.ceil(data.length / pageSize))));
  }

  async function loadCurrentRole() {
    const response = await fetch(`${API_URL}/auth/me`, {
      credentials: "include",
      cache: "no-store",
      headers: { Accept: "application/json" }
    }).catch(() => null);

    if (!response?.ok) {
      return;
    }

    const data = (await response.json()) as { role?: string };
    setCurrentRole(data.role || "");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const actionLabel = modalMode === "edit" ? "menyimpan perubahan artikel" : "menerbitkan artikel baru";
    if (!window.confirm(`Yakin ingin ${actionLabel}?`)) {
      return;
    }

    setLoading(true);
    setNotice(null);

    let coverImage = form.coverImage;
    if (coverFile) {
      const uploadResult = await uploadArticleImage(coverFile);
      if (!uploadResult.ok) {
        setLoading(false);
        setNotice({ type: "error", message: uploadResult.message });
        return;
      }
      coverImage = uploadResult.url;
    }

    const endpoint = modalMode === "edit" && form.id ? `${API_URL}/articles/${form.id}` : `${API_URL}/articles`;
    const { id, ...payloadData } = form;
    const response = await fetch(endpoint, {
      method: modalMode === "edit" ? "PUT" : "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": getCookie("csrf_token")
      },
      body: JSON.stringify({ ...payloadData, coverImage })
    }).catch(() => null);

    setLoading(false);

    if (!response?.ok) {
      const data = await response?.json().catch(() => null);
      setNotice({
        type: "error",
        message: data?.message || "Artikel belum tersimpan. Periksa data artikel dan sesi login."
      });
      return;
    }

    await refreshArticles(false);
    setModalMode(null);
    setForm(emptyForm);
    resetCoverPreview("");
    setNotice({
      type: "success",
      message: modalMode === "edit" ? "Artikel berhasil diperbarui." : "Artikel baru berhasil disimpan."
    });
  }

  async function deleteArticle(article: Article) {
    if (!window.confirm(`Yakin ingin menghapus artikel "${article.title}"?`)) {
      return;
    }

    setNotice(null);
    const response = await fetch(`${API_URL}/articles/${article.id}`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "X-CSRF-Token": getCookie("csrf_token")
      }
    }).catch(() => null);

    if (!response?.ok) {
      const data = await response?.json().catch(() => null);
      setNotice({
        type: "error",
        message: data?.message || "Artikel belum bisa dihapus. Hanya superadmin dan admin yang dapat menghapus."
      });
      return;
    }

    await refreshArticles(false);
    setNotice({ type: "success", message: "Artikel berhasil dihapus." });
  }

  return (
    <div className="grid gap-5">
      <section className="grid gap-4 rounded-[8px] bg-white p-5 shadow-sm lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-sm font-extrabold uppercase text-rosebrand-600">Konten Website</p>
          <h1 className="mt-2 text-3xl font-black tracking-normal text-zinc-950">Manajemen Berita dan Artikel</h1>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-zinc-500">
            Kelola artikel SEO, status publikasi, kategori, cover, dan isi berita portal sekolah.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-rosebrand-500 px-5 text-sm font-extrabold text-white transition hover:bg-rosebrand-600"
        >
          <Plus size={18} aria-hidden />
          Tambah Artikel
        </button>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <StatCard label="Total Artikel" value={items.length} icon={<FileText size={19} aria-hidden />} />
        <StatCard label="Published" value={publishedCount} icon={<Clock3 size={19} aria-hidden />} />
        <StatCard label="Draft" value={draftCount} icon={<Pencil size={19} aria-hidden />} />
      </section>

      {notice ? (
        <div
          className={`rounded-[8px] px-4 py-3 text-sm font-bold ${
            notice.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rosebrand-50 text-rosebrand-700"
          }`}
        >
          {notice.message}
        </div>
      ) : null}

      <section className="grid gap-4 rounded-[8px] bg-white p-5 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_220px]">
          <label className="relative block">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" aria-hidden />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari judul, ringkasan, atau kategori"
              className="h-11 w-full rounded-[8px] border border-zinc-200 pl-11 pr-4 text-sm font-semibold outline-none focus:border-rosebrand-500"
            />
          </label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-11 rounded-[8px] border border-zinc-200 px-4 text-sm font-bold outline-none focus:border-rosebrand-500"
          >
            <option value="all">Semua status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="h-11 rounded-[8px] border border-zinc-200 px-4 text-sm font-bold outline-none focus:border-rosebrand-500"
          >
            <option value="all">Semua kategori</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-hidden rounded-[8px] border border-zinc-100">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left">
              <thead className="bg-softgray text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-5 py-4 font-extrabold">Artikel</th>
                  <th className="px-5 py-4 font-extrabold">Kategori</th>
                  <th className="px-5 py-4 font-extrabold">Status</th>
                  <th className="px-5 py-4 font-extrabold">Statistik</th>
                  <th className="px-5 py-4 text-right font-extrabold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {currentItems.length > 0 ? (
                  currentItems.map((article) => (
                    <tr key={article.id} className="align-top">
                      <td className="px-5 py-4">
                        <div className="flex gap-4">
                          <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-[8px] bg-zinc-100">
                            <Image src={article.coverImage} alt="" fill sizes="112px" className="object-cover" />
                          </div>
                          <div className="min-w-0">
                            <p className="line-clamp-1 font-black text-zinc-950">{article.title}</p>
                            <p className="mt-1 line-clamp-2 max-w-xl text-sm leading-6 text-zinc-500">{article.excerpt}</p>
                            <p className="mt-2 text-xs font-bold text-zinc-400">{article.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-extrabold text-zinc-700">{article.category}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                            (article.status || "published") === "published"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {(article.status || "published") === "published" ? "Published" : "Draft"}
                        </span>
                        <p className="mt-2 text-xs font-semibold text-zinc-400">{formatDate(article.publishedAt)}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-bold text-zinc-700">{readCount(article).toLocaleString("id-ID")} dibaca</p>
                        <p className="mt-1 text-xs font-semibold text-zinc-400">{readingTime(article)} menit baca</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          {canEditExisting ? (
                            <>
                              <button
                                type="button"
                                onClick={() => openEditModal(article)}
                                className="grid h-10 w-10 place-items-center rounded-[8px] border border-zinc-200 text-zinc-600 transition hover:border-rosebrand-200 hover:bg-rosebrand-50 hover:text-rosebrand-700"
                                title="Edit artikel"
                              >
                                <Pencil size={16} aria-hidden />
                              </button>
                              <button
                                type="button"
                                onClick={() => void deleteArticle(article)}
                                className="grid h-10 w-10 place-items-center rounded-[8px] border border-zinc-200 text-zinc-600 transition hover:border-rosebrand-200 hover:bg-rosebrand-50 hover:text-rosebrand-700"
                                title="Hapus artikel"
                              >
                                <Trash2 size={16} aria-hidden />
                              </button>
                            </>
                          ) : (
                            <span className="rounded-full bg-zinc-100 px-3 py-2 text-xs font-bold text-zinc-500">Tambah saja</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-sm font-bold text-zinc-500">
                      Tidak ada artikel yang cocok dengan filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <p className="text-sm font-semibold text-zinc-500">
            Menampilkan {currentItems.length} dari {filteredItems.length} artikel. Halaman {page} dari {totalPages}.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-zinc-200 px-4 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft size={17} aria-hidden />
              Sebelumnya
            </button>
            <button
              type="button"
              disabled={page === totalPages}
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-zinc-200 px-4 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
            >
              Berikutnya
              <ChevronRight size={17} aria-hidden />
            </button>
          </div>
        </div>
      </section>

      {modalMode ? (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-zinc-950/55 p-4 backdrop-blur-sm">
          <form 
            onSubmit={onSubmit} 
            style={{
              transform: isMaximized ? 'none' : `translate(${position.x}px, ${position.y}px)`,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out'
            }}
            className={`${
              isMaximized 
                ? "fixed inset-0 w-full h-full bg-zinc-50 z-[100] overflow-y-auto p-6" 
                : "relative max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[8px] bg-white p-6 shadow-soft"
            }`}
          >
            <div 
              className={`flex items-start justify-between gap-4 select-none ${isMaximized ? '' : 'cursor-grab active:cursor-grabbing'}`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              <div>
                <p className="text-sm font-extrabold uppercase text-rosebrand-600">
                  {modalMode === "edit" ? "Edit Artikel" : "Tambah Artikel"}
                </p>
                <h2 className="mt-2 text-2xl font-black text-zinc-950">
                  {modalMode === "edit" ? form.title || "Perubahan artikel" : "Artikel baru"}
                </h2>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsMaximized(!isMaximized);
                    setPosition({ x: 0, y: 0 });
                  }}
                  className="grid h-10 w-10 place-items-center rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  title={isMaximized ? "Perkecil ukuran" : "Perbesar layar"}
                >
                  {isMaximized ? <Minimize2 size={18} aria-hidden /> : <Maximize2 size={18} aria-hidden />}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="grid h-10 w-10 place-items-center rounded-full bg-zinc-100 text-zinc-600 hover:bg-rose-100 hover:text-rose-700"
                  title="Tutup modal"
                >
                  <X size={18} aria-hidden />
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_340px]">
              <div className="grid gap-4">
                <Field label="Judul Artikel" value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
                
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-zinc-700">Ringkasan SEO</label>
                    <button 
                      type="button" 
                      onClick={generateSEO}
                      className="inline-flex items-center gap-1.5 rounded-full bg-rosebrand-50 px-3 py-1 text-xs font-bold text-rosebrand-700 hover:bg-rosebrand-100 transition"
                    >
                      <Sparkles size={14} />
                      Generate Pintar
                    </button>
                  </div>
                  <textarea
                    value={form.excerpt}
                    onChange={(event) => setForm({ ...form, excerpt: event.target.value })}
                    rows={3}
                    placeholder="Ringkasan pendek yang tampil di halaman daftar dan mesin pencari"
                    className="resize-y rounded-[8px] border border-zinc-200 bg-white px-4 py-3 leading-7 outline-none focus:border-rosebrand-500"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-bold text-zinc-700">Isi Artikel</label>
                  <RichTextEditor 
                    value={form.content} 
                    onChange={(value) => setForm({ ...form, content: value })} 
                  />
                </div>
              </div>

              <aside className="grid content-start gap-4">
                <div className="grid gap-4 rounded-[8px] border border-zinc-100 bg-softgray p-4">
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1">
                    <label className="grid gap-2 text-sm font-bold text-zinc-700">
                      Kategori
                      <input
                        list="category-options"
                        value={form.category}
                        onChange={(event) => setForm({ ...form, category: event.target.value })}
                        placeholder="Pilih atau ketik kategori baru..."
                        className="rounded-[8px] border border-zinc-200 bg-white px-4 py-3 outline-none focus:border-rosebrand-500"
                        required
                      />
                      <datalist id="category-options">
                        {categories.map((cat) => (
                          <option key={cat} value={cat} />
                        ))}
                      </datalist>
                    </label>
                    <label className="grid gap-2 text-sm font-bold text-zinc-700">
                      Status
                      <select
                        value={form.status}
                        onChange={(event) => setForm({ ...form, status: event.target.value as ArticleFormState["status"] })}
                        className="rounded-[8px] border border-zinc-200 bg-white px-4 py-3 outline-none focus:border-rosebrand-500"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </select>
                    </label>
                  </div>

                  <Field
                    label="URL Cover"
                    value={form.coverImage}
                    onChange={(value) => {
                      setForm({ ...form, coverImage: value });
                      resetCoverPreview(value);
                    }}
                    placeholder="https://..."
                    required={false}
                  />

                  <label className="grid gap-2 text-sm font-bold text-zinc-700">
                    Unggah Cover dari Disk
                    <span className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-[8px] border border-dashed border-zinc-300 bg-white px-4 py-5 text-center transition hover:border-rosebrand-300 hover:bg-rosebrand-50">
                      <ImagePlus size={26} className="text-rosebrand-600" aria-hidden />
                      <span className="text-sm font-extrabold text-zinc-700">
                        {coverFile ? coverFile.name : "Pilih gambar JPG, PNG, atau WEBP"}
                      </span>
                      <span className="text-xs font-semibold text-zinc-500">Maksimal 5MB. Preview muncul setelah file dipilih.</span>
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onCoverChange} className="sr-only" />
                    </span>
                  </label>
                </div>

                <div className="rounded-[8px] border border-zinc-200 bg-white p-3">
                  <p className="mb-3 text-sm font-extrabold text-zinc-700">Preview Cover</p>
                  <div className="relative aspect-[16/10] overflow-hidden rounded-[8px] bg-zinc-200">
                    {coverPreview ? (
                      coverPreview.startsWith("blob:") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={coverPreview} alt="Preview cover artikel" className="h-full w-full object-cover" />
                      ) : (
                        <Image src={coverPreview} alt="Preview cover artikel" fill sizes="340px" className="object-cover" />
                      )
                    ) : (
                      <div className="grid h-full place-items-center px-4 text-center text-sm font-bold text-zinc-500">
                        Belum ada cover
                      </div>
                    )}
                  </div>
                </div>
              </aside>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-zinc-100 pt-5 sm:flex-row sm:justify-end">
              <button type="button" onClick={closeModal} className="h-11 rounded-[8px] border border-zinc-200 px-5 text-sm font-extrabold text-zinc-700">
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-rosebrand-500 px-5 text-sm font-extrabold text-white disabled:opacity-70"
              >
                <Save size={18} aria-hidden />
                {loading ? "Menyimpan..." : "Simpan Artikel"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

async function uploadArticleImage(file: File): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`${API_URL}/uploads/images`, {
    method: "POST",
    credentials: "include",
    headers: {
      "X-CSRF-Token": getCookie("csrf_token")
    },
    body: formData
  }).catch(() => null);

  if (!response?.ok) {
    const data = await response?.json().catch(() => null);
    return { ok: false, message: data?.message || "Upload cover gagal." };
  }

  const data = (await response.json()) as { url?: string };
  if (!data.url) {
    return { ok: false, message: "Upload berhasil tetapi URL gambar tidak diterima." };
  }

  return { ok: true, url: data.url };
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-[8px] bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm font-bold text-zinc-500">{label}</p>
        <p className="mt-2 text-3xl font-black text-zinc-950">{value}</p>
      </div>
      <span className="grid h-11 w-11 place-items-center rounded-[8px] bg-rosebrand-50 text-rosebrand-600">{icon}</span>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required = true
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-zinc-700">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="rounded-[8px] border border-zinc-200 bg-white px-4 py-3 outline-none focus:border-rosebrand-500"
        required={required}
      />
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
  rows,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows: number;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-zinc-700">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="resize-y rounded-[8px] border border-zinc-200 bg-white px-4 py-3 leading-7 outline-none focus:border-rosebrand-500"
        required
      />
    </label>
  );
}
