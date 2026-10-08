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
  Sparkles,
  Loader2,
  Wand2,
  Globe,
  ExternalLink,
  Download,
  CheckCircle2,
  AlertCircle,
  Link2,
  Code2
} from "lucide-react";
import { RichTextEditor } from "./RichTextEditor";
import { API_URL } from "@/lib/api";
import { getCookie } from "@/lib/auth-client";
import { formatDate, readingTime, readCount } from "@/lib/article-utils";
import type { Article } from "@/types/content";
import { normalizeImageUrl } from "@/lib/image-url";

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

  // AI Generator Modal State
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiReady, setAiReady] = useState(true);
  const [aiMode, setAiMode] = useState<"social" | "manual">("social");
  const [aiSocialUrl, setAiSocialUrl] = useState("");
  const [aiExtracting, setAiExtracting] = useState(false);
  const [aiExtractError, setAiExtractError] = useState<string | null>(null);
  const [aiExtractedData, setAiExtractedData] = useState<{
    platform: string;
    source_url: string;
    title: string;
    caption: string;
    image_url: string;
    author: string;
  } | null>(null);
  const [aiExtractedCaption, setAiExtractedCaption] = useState("");
  const [aiExtraInstructions, setAiExtraInstructions] = useState("");
  const [aiSelectedCoverImageUrl, setAiSelectedCoverImageUrl] = useState("");
  const [aiUseExtractedImage, setAiUseExtractedImage] = useState(true);
  const [aiRecommended, setAiRecommended] = useState(true);
  const [aiParagraphCount, setAiParagraphCount] = useState<number>(5);
  const [aiSentencesPerParagraph, setAiSentencesPerParagraph] = useState<number>(3);
  const [aiIncludeCodeSnippets, setAiIncludeCodeSnippets] = useState(false);
  const [aiManualInstructions, setAiManualInstructions] = useState("");
  const [aiCategory, setAiCategory] = useState("Sekolah");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  async function checkAIStatus() {
    try {
      const res = await fetch(`${API_URL}/ai/status`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setAiReady(Boolean(data.ready));
      }
    } catch {
      // ignore
    }
  }

  async function handleExtractUrl() {
    const url = aiSocialUrl.trim();
    if (!url) {
      setAiExtractError("Tempel tautan postingan Instagram, YouTube, TikTok, Facebook, atau web berita terlebih dahulu.");
      return;
    }

    setAiExtracting(true);
    setAiExtractError(null);

    try {
      const res = await fetch(`${API_URL}/ai/extract-url`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCookie("csrf_token")
        },
        body: JSON.stringify({ url })
      });

      const resData = await res.json().catch(() => null);

      if (!res.ok || !resData?.success) {
        throw new Error(resData?.message || "Gagal mengekstrak konten dari tautan tersebut.");
      }

      const d = resData.data;
      setAiExtractedData(d);
      setAiExtractedCaption(d.caption || d.title || "");
      if (d.image_url) {
        setAiSelectedCoverImageUrl(d.image_url);
        setAiUseExtractedImage(true);
      }

      // Auto detect category
      const textToScan = `${d.caption || ""} ${d.title || ""}`.toLowerCase();
      if (textToScan.includes("juara") || textToScan.includes("prestasi") || textToScan.includes("kejuaraan") || textToScan.includes("medali") || textToScan.includes("lomba") || textToScan.includes("tanding")) {
        setAiCategory("Prestasi");
      } else if (textToScan.includes("workshop") || textToScan.includes("kegiatan") || textToScan.includes("pelatihan") || textToScan.includes("kunjungan") || textToScan.includes("upacara") || textToScan.includes("study tour")) {
        setAiCategory("Kegiatan");
      } else if (textToScan.includes("pengumuman") || textToScan.includes("jadwal") || textToScan.includes("pemberitahuan") || textToScan.includes("edaran")) {
        setAiCategory("Pengumuman");
      } else if (textToScan.includes("akademik") || textToScan.includes("ujian") || textToScan.includes("kurikulum") || textToScan.includes("kelulusan") || textToScan.includes("rapor")) {
        setAiCategory("Akademik");
      } else if (textToScan.includes("coding") || textToScan.includes("software") || textToScan.includes("cloud") || textToScan.includes("cyber") || textToScan.includes("jaringan") || textToScan.includes("komputer") || textToScan.includes("teknologi") || textToScan.includes("ai")) {
        setAiCategory("Teknologi");
      }
    } catch (err: any) {
      setAiExtractError(err?.message || "Gagal mengambil konten dari URL.");
    } finally {
      setAiExtracting(false);
    }
  }

  async function handleGenerateAIArticle(e?: FormEvent) {
    if (e) e.preventDefault();
    if (aiLoading) return;

    if (aiMode === "social") {
      if (!aiExtractedCaption.trim()) {
        if (aiSocialUrl.trim()) {
          await handleExtractUrl();
          if (!aiExtractedCaption.trim()) {
            setAiError("Masukkan tautan media sosial dan klik 'Ambil Konten' atau tempel caption terlebih dahulu.");
            return;
          }
        } else {
          setAiError("Masukkan tautan media sosial dan klik 'Ambil Konten' atau tempel caption terlebih dahulu.");
          return;
        }
      }
    } else {
      if (!aiManualInstructions.trim()) {
        setAiError("Instruksi atau topik artikel manual wajib diisi.");
        return;
      }
    }

    if (!aiRecommended && (
      aiParagraphCount < 2 || aiParagraphCount > 12 ||
      aiSentencesPerParagraph < 2 || aiSentencesPerParagraph > 8
    )) {
      setAiError("Pengaturan panjang belum valid. Periksa jumlah paragraf (2-12) dan kalimat (2-8).");
      return;
    }

    setAiLoading(true);
    setAiError(null);

    try {
      const payload = {
        topic: aiMode === "manual" ? aiManualInstructions.trim() : (aiExtractedCaption.trim() || aiSocialUrl.trim()),
        category: aiCategory.trim() || "Sekolah",
        use_ai_recommendation: aiRecommended,
        paragraphs: aiRecommended ? 5 : Number(aiParagraphCount) || 5,
        sentencesPerParagraph: aiRecommended ? 3 : Number(aiSentencesPerParagraph) || 3,
        include_code_snippets: aiIncludeCodeSnippets,
        source_url: aiMode === "social" && aiSocialUrl.trim() ? aiSocialUrl.trim() : "",
        source_caption: aiMode === "social" && aiExtractedCaption.trim() ? aiExtractedCaption.trim() : "",
        extra_instructions: (aiMode === "social" ? aiExtraInstructions : "").trim()
      };

      const res = await fetch(`${API_URL}/ai/generate-article`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCookie("csrf_token")
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || "Stella AI gagal menghasilkan artikel.");
      }

      // Download cover permanently to school server if user selected extracted image
      let permanentCover = "";
      if (aiUseExtractedImage && aiSelectedCoverImageUrl) {
        permanentCover = aiSelectedCoverImageUrl;
        try {
          const dlRes = await fetch(`${API_URL}/ai/download-cover`, {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-Token": getCookie("csrf_token")
            },
            body: JSON.stringify({ url: aiSelectedCoverImageUrl })
          });
          if (dlRes.ok) {
            const dlData = await dlRes.json();
            if (dlData?.url) permanentCover = dlData.url;
          }
        } catch {
          // fallback to original image url
        }
      }

      setForm({
        title: data.title || "",
        excerpt: data.excerpt || "",
        content: data.content || "",
        coverImage: permanentCover,
        category: data.category || aiCategory || "Sekolah",
        status: "published"
      });

      if (permanentCover) {
        resetCoverPreview(permanentCover);
      }

      setModalMode("create");
      setAiModalOpen(false);
      setNotice({
        type: "success",
        message: `✨ Artikel berhasil disusun oleh Stella AI (${data.paragraph_count || 5} paragraf)! Silakan tinjau dan simpan.`
      });
    } catch (err: any) {
      setAiError(err?.message || "Gagal menghasilkan artikel dengan Stella AI.");
    } finally {
      setAiLoading(false);
    }
  }

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
    void checkAIStatus();
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
    setPage((value) => Math.min(value, Math.max(1, Math.ceil((data || []).length / pageSize))));
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

    const contentText = form.content.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
    if (!contentText) {
      setNotice({ type: "error", message: "Isi artikel wajib diisi melalui editor WYSIWYG." });
      return;
    }

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
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setAiError(null);
              setAiModalOpen(true);
            }}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-gradient-to-r from-amber-500 via-rose-500 to-rosebrand-600 px-5 text-sm font-extrabold text-white shadow-sm transition hover:brightness-110"
          >
            <Sparkles size={18} aria-hidden />
            Hasilkan dengan AI
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] border border-zinc-200 bg-white px-5 text-sm font-extrabold text-zinc-700 transition hover:bg-zinc-50"
          >
            <Plus size={18} aria-hidden />
            Tambah Manual
          </button>
        </div>
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
                            <Image src={normalizeImageUrl(article.coverImage)} alt="" fill sizes="112px" className="object-cover" />
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

            {/* Quick Stella AI Trigger Banner */}
            <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-red-200 bg-gradient-to-r from-red-50/90 via-rose-50/50 to-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-rose-600 text-white shadow-md shadow-red-500/20">
                  <Sparkles size={18} />
                </div>
                <div>
                  <p className="text-xs font-black text-zinc-900">Hasilkan Artikel Otomatis dengan Stella AI</p>
                  <p className="text-[11px] font-semibold text-zinc-600">
                    Ekstrak postingan dari <strong>Instagram, YouTube, TikTok, Web</strong> atau gunakan <strong>topik manual</strong> dengan standar SEO Google Page 1.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAiError(null);
                  setAiModalOpen(true);
                }}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-md shadow-red-600/20 transition hover:brightness-110"
              >
                <Sparkles size={14} />
                Buka Stella AI
              </button>
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
                        <Image src={normalizeImageUrl(coverPreview)} alt="Preview cover artikel" fill sizes="340px" className="object-cover" />
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

      {/* Stella AI Generator Modal */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-zinc-950/60 p-3 sm:p-4 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white p-5 sm:p-7 shadow-2xl border border-red-100 grid gap-5 max-h-[92vh] overflow-y-auto">
            {/* Header matching Sisfo */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-zinc-100 pb-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-red-600 to-rose-600 text-white flex items-center justify-center shadow-md shadow-red-500/20">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-zinc-900 flex items-center gap-2">
                    <span>Hasilkan Artikel dengan Stella AI</span>
                  </h3>
                  <p className="text-xs leading-5 text-zinc-600 mt-0.5">
                    Generate artikel otomatis dari <strong>URL Instagram/Medsos/Web</strong> atau susun dari <strong>topik manual</strong>.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                    aiReady ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${aiReady ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                  <span>{aiReady ? "Siap digunakan" : "Belum dikonfigurasi"}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setAiModalOpen(false)}
                  className="grid h-8 w-8 place-items-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 transition"
                  title="Tutup"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {aiError && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-bold text-rose-800 flex items-start gap-2">
                <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                <div>{aiError}</div>
              </div>
            )}

            {/* Mode Selector Tabs */}
            <div>
              <div className="inline-flex p-1 bg-zinc-100 rounded-xl border border-zinc-200 shadow-sm gap-1">
                <button
                  type="button"
                  onClick={() => setAiMode("social")}
                  className={`px-3.5 py-2 rounded-lg text-xs transition-all flex items-center gap-2 ${
                    aiMode === "social"
                      ? "bg-red-600 text-white font-bold shadow-sm"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 font-medium"
                  }`}
                >
                  <Link2 size={14} />
                  <span>Dari URL Medsos / Web</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-black tracking-wider ${
                      aiMode === "social" ? "bg-red-700 text-white" : "bg-red-100 text-red-700"
                    }`}
                  >
                    AJAIB ✨
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setAiMode("manual")}
                  className={`px-3.5 py-2 rounded-lg text-xs transition-all flex items-center gap-2 ${
                    aiMode === "manual"
                      ? "bg-red-600 text-white font-bold shadow-sm"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 font-medium"
                  }`}
                >
                  <Pencil size={14} />
                  <span>Instruksi Topik Manual</span>
                </button>
              </div>
            </div>

            {/* TAB 1: Dari URL Medsos / Web */}
            {aiMode === "social" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                    Masukkan Tautan Media Sosial / Berita Web
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                        <Globe size={16} />
                      </div>
                      <input
                        type="url"
                        value={aiSocialUrl}
                        onChange={(e) => setAiSocialUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            void handleExtractUrl();
                          }
                        }}
                        className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 placeholder-zinc-400"
                        placeholder="Contoh: https://www.instagram.com/p/DeMXQrTgdS5/ atau link berita web"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleExtractUrl()}
                      disabled={aiExtracting || !aiSocialUrl.trim()}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-zinc-900 text-white font-bold text-xs rounded-xl hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0"
                    >
                      {aiExtracting ? (
                        <>
                          <Loader2 size={15} className="animate-spin" />
                          <span>Mengambil Data...</span>
                        </>
                      ) : (
                        <>
                          <Download size={15} />
                          <span>Ambil Konten</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-[11px] text-zinc-500 flex-wrap">
                    <span className="font-medium">Mendukung:</span>
                    <span className="px-2 py-0.5 bg-pink-100 text-pink-700 rounded-md font-semibold">Instagram</span>
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-md font-semibold">YouTube</span>
                    <span className="px-2 py-0.5 bg-zinc-100 text-zinc-700 rounded-md font-semibold border border-zinc-200">TikTok</span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md font-semibold">Facebook</span>
                    <span className="px-2 py-0.5 bg-zinc-200 text-zinc-800 rounded-md font-semibold">Web Berita / Blog</span>
                  </div>
                </div>

                {/* Scrape Error Notice */}
                {aiExtractError && (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                    <div className="flex items-start gap-2">
                      <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                      <div className="space-y-1">
                        <p className="font-bold">{aiExtractError}</p>
                        <p className="text-[11px] text-amber-700">
                          Tips: Anda tetap dapat menempelkan caption atau ringkasan berita secara langsung di kotak teks di bawah ini, lalu Stella AI akan langsung menyusun artikelnya!
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Preview Box Hasil Ekstraksi */}
                {(aiExtractedData || aiExtractedCaption) && (
                  <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                            aiExtractedData?.platform === "Instagram"
                              ? "bg-pink-100 text-pink-700"
                              : aiExtractedData?.platform === "YouTube"
                              ? "bg-red-100 text-red-700"
                              : aiExtractedData?.platform === "TikTok"
                              ? "bg-zinc-100 text-zinc-800"
                              : aiExtractedData?.platform === "Facebook"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {aiExtractedData?.platform || "Konten Sumber"}
                        </span>
                        {aiExtractedData?.author && (
                          <span className="text-xs font-semibold text-zinc-600">
                            oleh <strong>{aiExtractedData.author}</strong>
                          </span>
                        )}
                      </div>
                      {aiSocialUrl && (
                        <a
                          href={aiSocialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-medium text-red-600 hover:underline flex items-center gap-1"
                        >
                          <span>Buka tautan</span>
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>

                    {/* Gambar Preview & Pilihan Cover */}
                    {aiSelectedCoverImageUrl && (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-white rounded-xl border border-zinc-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={aiSelectedCoverImageUrl}
                          alt="Cover preview"
                          className="w-16 h-16 object-cover rounded-lg border border-zinc-200 shrink-0"
                        />
                        <div className="flex-1 space-y-1">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={aiUseExtractedImage}
                              onChange={(e) => setAiUseExtractedImage(e.target.checked)}
                              className="rounded border-zinc-300 text-red-600 focus:ring-red-500"
                            />
                            <span className="text-xs font-bold text-zinc-800">
                              Gunakan foto ini otomatis sebagai Cover Berita
                            </span>
                          </label>
                          <p className="text-[11px] text-zinc-500">
                            Foto akan diunduh dan disimpan secara permanen di server sekolah.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Editable Caption Textarea */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-zinc-700">
                          Teks / Caption Sumber (Dapat Disunting)
                        </label>
                        <span className="text-[11px] text-zinc-400">
                          {aiExtractedCaption.length} karakter
                        </span>
                      </div>
                      <textarea
                        value={aiExtractedCaption}
                        onChange={(e) => setAiExtractedCaption(e.target.value)}
                        rows={5}
                        className="w-full px-3.5 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-mono text-zinc-800 focus:ring-2 focus:ring-red-500 focus:border-red-500 leading-relaxed"
                        placeholder="Teks atau caption hasil ekstraksi akan muncul di sini..."
                      />
                      <p className="text-[11px] text-zinc-500 mt-1">
                        Anda dapat menambahkan atau membetulkan informasi (misal: nama guru, lokasi, atau tanggal) sebelum artikel digenerate.
                      </p>
                    </div>

                    {/* Extra Instructions */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                        Instruksi Tambahan dari Redaksi (Opsional)
                      </label>
                      <input
                        type="text"
                        value={aiExtraInstructions}
                        onChange={(e) => setAiExtraInstructions(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Contoh: Berikan apresiasi khusus dari Kepala Sekolah dan harapan prestasi ke tingkat nasional."
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Instruksi Topik Manual */}
            {aiMode === "manual" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-2">
                    Instruksi Topik / Arahan Artikel
                  </label>
                  <textarea
                    value={aiManualInstructions}
                    onChange={(e) => setAiManualInstructions(e.target.value)}
                    rows={4}
                    maxLength={3000}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 leading-relaxed"
                    placeholder="Contoh: Buat artikel tentang prestasi siswa SMK Telkom Lampung di ajang LKS tingkat provinsi. Jelaskan persiapan, cabang lomba, dan motivasi bagi siswa lain."
                  />
                  <div className="flex justify-between gap-4 mt-1">
                    <p className="text-[11px] text-zinc-500">
                      Sertakan tujuan pembaca, topik, sudut pembahasan, atau fakta yang wajib digunakan.
                    </p>
                    <span className="text-[11px] text-zinc-400">
                      {aiManualInstructions.length}/3000
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-3">
                    <span className="text-[11px] font-bold text-zinc-400">Rekomendasi Topik:</span>
                    {[
                      "Pembelajaran Jurusan RPL & Project-Based Learning",
                      "Kegiatan Praktikum Jurusan TKJ & Cloud Infra",
                      "Teknologi 5G & Fiber Optic Jurusan TJAT",
                      "Prestasi Lomba Animasi & Konten Digital Siswa",
                      "Pendapat Kepala Sekolah tentang Beasiswa SPMB 2026"
                    ].map((promptText) => (
                      <button
                        key={promptText}
                        type="button"
                        onClick={() => setAiManualInstructions(promptText)}
                        className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-bold text-zinc-600 hover:bg-red-50 hover:text-red-700 transition"
                      >
                        + {promptText}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Category Selector */}
            <div className="grid gap-2">
              <label className="text-xs font-bold text-zinc-700">Kategori Berita / Artikel</label>
              <input
                list="ai-category-options"
                value={aiCategory}
                onChange={(e) => setAiCategory(e.target.value)}
                placeholder="Prestasi, Kegiatan, Akademik, Kesiswaan, Pengumuman, Teknologi..."
                className="h-10 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 text-xs font-bold text-zinc-800 outline-none focus:bg-white focus:ring-2 focus:ring-red-500"
              />
              <datalist id="ai-category-options">
                {["Akademik", "Kesiswaan", "Kegiatan", "Prestasi", "Pengumuman", "Teknologi", "Sekolah", "Lainnya"].map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>

            {/* Shared AI Options */}
            <div className="pt-4 border-t border-zinc-200/80 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiRecommended}
                  onChange={(e) => setAiRecommended(e.target.checked)}
                  className="mt-0.5 rounded border-zinc-300 text-red-600 focus:ring-red-500"
                />
                <span>
                  <span className="block text-xs font-bold text-zinc-800">
                    Rekomendasi panjang terbaik berdasarkan Stella AI
                  </span>
                  <span className="block text-[11px] text-zinc-500">
                    Stella otomatis menyesuaikan struktur paragraf dan kedalaman narasi sesuai kategori berita.
                  </span>
                </span>
              </label>

              {!aiRecommended && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-6 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-zinc-600 mb-1">Jumlah Paragraf</label>
                    <input
                      type="number"
                      min={2}
                      max={12}
                      value={aiParagraphCount}
                      onChange={(e) => setAiParagraphCount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs font-bold text-zinc-800 focus:ring-2 focus:ring-red-500"
                    />
                    <p className="text-[10px] text-zinc-400 mt-0.5">Antara 2 sampai 12 paragraf.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-600 mb-1">Kalimat per Paragraf</label>
                    <input
                      type="number"
                      min={2}
                      max={8}
                      value={aiSentencesPerParagraph}
                      onChange={(e) => setAiSentencesPerParagraph(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs font-bold text-zinc-800 focus:ring-2 focus:ring-red-500"
                    />
                    <p className="text-[10px] text-zinc-400 mt-0.5">Antara 2 sampai 8 kalimat.</p>
                  </div>
                </div>
              )}

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiIncludeCodeSnippets}
                  onChange={(e) => setAiIncludeCodeSnippets(e.target.checked)}
                  className="mt-0.5 rounded border-zinc-300 text-red-600 focus:ring-red-500"
                />
                <span>
                  <span className="block text-xs font-bold text-zinc-800">
                    Sertakan snippet kode teknologi (jika artikel tutorial)
                  </span>
                  <span className="block text-[11px] text-zinc-500">
                    Stella menambahkan blok kode dengan syntax highlight yang dapat disalin langsung.
                  </span>
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setAiModalOpen(false)}
                className="h-11 rounded-xl border border-zinc-200 px-5 text-xs font-extrabold text-zinc-700 hover:bg-zinc-50 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => void handleGenerateAIArticle()}
                disabled={
                  aiLoading ||
                  !aiReady ||
                  (aiMode === "social" && !aiExtractedCaption.trim() && !aiSocialUrl.trim()) ||
                  (aiMode === "manual" && !aiManualInstructions.trim())
                }
                className="inline-flex min-h-11 items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold text-xs sm:text-sm rounded-xl hover:from-red-700 hover:to-rose-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-red-600/20 transition-all"
              >
                {aiLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Stella sedang menyusun artikel...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>{aiMode === "social" ? "✨ Hasilkan Artikel dari URL" : "✨ Hasilkan Artikel"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
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
