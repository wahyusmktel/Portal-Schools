"use client";

import { useRef, useState, FormEvent, ChangeEvent } from "react";
import { Plus, Edit2, Trash2, X, Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { Agenda } from "@/types/content";
import { API_URL } from "@/lib/api";
import { getCookie } from "@/lib/auth-client";
import { formatDateRange } from "@/lib/article-utils";
import { AgendaImportResult, parseAgendaWorkbook } from "@/lib/agenda-import";

function toDatetimeLocal(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function AgendaManager({ initialItems }: { initialItems: Agenda[] }) {
  const [items, setItems] = useState<Agenda[]>(initialItems || []);
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [loading, setLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importPreview, setImportPreview] = useState<AgendaImportResult | null>(null);
  const [importFileName, setImportFileName] = useState("");
  const [importError, setImportError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [form, setForm] = useState({
    id: 0,
    title: "",
    location: "",
    startsAt: "",
    endsAt: ""
  });

  function openCreate() {
    // Format required for input type="datetime-local": YYYY-MM-DDThh:mm
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    setForm({ id: 0, title: "", location: "", startsAt: toDatetimeLocal(now), endsAt: toDatetimeLocal(oneHourLater) });
    setNotice(null);
    setModalMode("create");
  }

  function openEdit(item: Agenda) {
    setForm({
      id: item.id,
      title: item.title,
      location: item.location,
      startsAt: toDatetimeLocal(item.startsAt),
      endsAt: toDatetimeLocal(item.endsAt || item.startsAt)
    });
    setNotice(null);
    setModalMode("edit");
  }

  async function fetchItems() {
    const res = await fetch(`${API_URL}/admin/agendas`, { credentials: "include" }).catch(() => null);
    if (res?.ok) {
      const data = await res.json();
      setItems(data || []);
    }
  }

  async function selectImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      setNotice({ type: "error", message: "Gunakan file Excel berformat .xlsx atau .xls." });
      return;
    }

    setImportLoading(true);
    setNotice(null);
    setImportError("");
    try {
      const preview = await parseAgendaWorkbook(file);
      setImportFileName(file.name);
      setImportPreview(preview);
    } catch (error) {
      setNotice({ type: "error", message: error instanceof Error ? error.message : "File Excel gagal dibaca." });
    } finally {
      setImportLoading(false);
    }
  }

  async function importItems() {
    if (!importPreview || importPreview.errors.length > 0) return;
    setImportLoading(true);
    setNotice(null);
    setImportError("");
    const response = await fetch(`${API_URL}/agendas/import`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": getCookie("csrf_token")
      },
      credentials: "include",
      body: JSON.stringify({
        items: importPreview.items.map(({ title, location, startsAt, endsAt }) => ({ title, location, startsAt, endsAt }))
      })
    }).catch(() => null);

    const result = response ? await response.json().catch(() => null) : null;
    setImportLoading(false);
    if (!response?.ok) {
      setImportError(result?.message || "Agenda gagal diimpor.");
      return;
    }

    setImportPreview(null);
    setImportError("");
    setNotice({
      type: "success",
      message: `${result.inserted} agenda berhasil diimpor${result.skipped ? `, ${result.skipped} duplikat dilewati` : ""}.`
    });
    await fetchItems();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setNotice(null);

    const startsAt = new Date(form.startsAt);
    const endsAt = new Date(form.endsAt);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      setLoading(false);
      setNotice({ type: "error", message: "Tanggal mulai dan selesai wajib diisi." });
      return;
    }
    if (endsAt < startsAt) {
      setLoading(false);
      setNotice({ type: "error", message: "Tanggal selesai tidak boleh lebih awal dari tanggal mulai." });
      return;
    }

    const endpoint = modalMode === "edit" ? `${API_URL}/agendas/${form.id}` : `${API_URL}/agendas`;
    const payload = {
      title: form.title,
      location: form.location
    };

    const res = await fetch(endpoint, {
      method: modalMode === "edit" ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": getCookie("csrf_token")
      },
      credentials: "include",
      body: JSON.stringify({ ...payload, startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() })
    }).catch(() => null);

    setLoading(false);
    if (res?.ok) {
      setNotice({ type: "success", message: "Agenda berhasil disimpan." });
      setModalMode(null);
      fetchItems();
    } else {
      setNotice({ type: "error", message: "Gagal menyimpan agenda." });
    }
  }

  async function deleteItem(item: Agenda) {
    if (!window.confirm(`Hapus agenda "${item.title}"?`)) return;
    
    const res = await fetch(`${API_URL}/agendas/${item.id}`, {
      method: "DELETE",
      headers: { "X-CSRF-Token": getCookie("csrf_token") },
      credentials: "include"
    }).catch(() => null);

    if (res?.ok) {
      fetchItems();
    } else {
      alert("Gagal menghapus agenda.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900">Manajemen Agenda</h1>
          <p className="text-zinc-600 mt-1">Kelola jadwal kegiatan dan acara sekolah.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={selectImportFile} className="sr-only" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={importLoading}
            className="inline-flex h-11 items-center gap-2 rounded-[8px] border border-zinc-300 bg-white px-5 text-sm font-extrabold text-zinc-800 transition hover:border-emerald-500 hover:text-emerald-700 disabled:opacity-50"
          >
            <Upload size={18} /> {importLoading ? "Membaca Excel..." : "Import Excel"}
          </button>
          <button
            onClick={openCreate}
            className="inline-flex h-11 items-center gap-2 rounded-[8px] bg-rosebrand-500 px-5 text-sm font-extrabold text-white transition hover:bg-rosebrand-600"
          >
            <Plus size={18} /> Tambah Agenda
          </button>
        </div>
      </div>

      {notice && !modalMode && (
        <div className={`flex items-start gap-3 rounded-[8px] px-4 py-3 text-sm font-bold ${notice.type === "success" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
          {notice.type === "success" ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> : <AlertCircle size={18} className="mt-0.5 shrink-0" />}
          <span>{notice.message}</span>
        </div>
      )}

      <div className="overflow-x-auto rounded-[8px] border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600">
            <tr>
              <th className="px-6 py-4 font-extrabold">Nama Kegiatan</th>
              <th className="px-6 py-4 font-extrabold">Rentang Pelaksanaan</th>
              <th className="px-6 py-4 font-extrabold">Lokasi</th>
              <th className="px-6 py-4 font-extrabold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-zinc-50/50 transition">
                <td className="px-6 py-4 font-bold text-zinc-900">{item.title}</td>
                <td className="px-6 py-4 text-zinc-600">{formatDateRange(item.startsAt, item.endsAt, true)}</td>
                <td className="px-6 py-4 text-zinc-600">{item.location}</td>
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
                  Belum ada data agenda kegiatan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {importPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4 backdrop-blur-sm sm:p-6">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[12px] bg-white shadow-soft">
            <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-6 py-5">
              <div className="flex min-w-0 items-start gap-3">
                <div className="grid size-11 shrink-0 place-items-center rounded-[8px] bg-emerald-50 text-emerald-700">
                  <FileSpreadsheet size={22} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-black text-zinc-950">Pratinjau Import Agenda</h2>
                  <p className="truncate text-sm font-semibold text-zinc-500">{importFileName} · Sheet {importPreview.sheetName}</p>
                </div>
              </div>
              <button type="button" onClick={() => setImportPreview(null)} className="rounded-[6px] p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900" aria-label="Tutup pratinjau">
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto p-6">
              <div className="mb-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[8px] bg-zinc-950 p-4 text-white">
                  <p className="text-xs font-bold uppercase text-zinc-400">Agenda terbaca</p>
                  <p className="mt-1 text-2xl font-black">{importPreview.items.length}</p>
                </div>
                <div className="rounded-[8px] bg-zinc-100 p-4 text-zinc-900">
                  <p className="text-xs font-bold uppercase text-zinc-500">Lokasi default</p>
                  <p className="mt-1 font-black">SMK Telkom Lampung</p>
                </div>
                <div className={`rounded-[8px] p-4 ${importPreview.errors.length ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-800"}`}>
                  <p className="text-xs font-bold uppercase opacity-70">Validasi</p>
                  <p className="mt-1 font-black">{importPreview.errors.length ? `${importPreview.errors.length} baris bermasalah` : "Semua baris valid"}</p>
                </div>
              </div>

              {importPreview.errors.length > 0 && (
                <div className="mb-5 rounded-[8px] border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  <p className="font-black">Import belum dapat dilanjutkan</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 font-semibold">
                    {importPreview.errors.map((error) => <li key={error}>{error}</li>)}
                  </ul>
                </div>
              )}

              {importError && (
                <div className="mb-5 flex items-start gap-3 rounded-[8px] border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              <div className="overflow-x-auto rounded-[8px] border border-zinc-200">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-zinc-50 text-zinc-600">
                    <tr>
                      <th className="px-4 py-3 font-extrabold">Baris</th>
                      <th className="px-4 py-3 font-extrabold">Tanggal / Periode</th>
                      <th className="px-4 py-3 font-extrabold">Kegiatan / Agenda</th>
                      <th className="px-4 py-3 font-extrabold">Hasil Tanggal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {importPreview.items.map((item) => (
                      <tr key={`${item.sourceRow}-${item.title}`}>
                        <td className="px-4 py-3 font-bold text-zinc-500">{item.sourceRow}</td>
                        <td className="px-4 py-3 font-semibold text-zinc-700">{item.sourcePeriod}</td>
                        <td className="px-4 py-3 font-bold text-zinc-950">{item.title}</td>
                        <td className="px-4 py-3 text-zinc-600">{formatDateRange(item.startsAt, item.endsAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-zinc-200 bg-zinc-50 px-6 py-4 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setImportPreview(null)} className="h-11 rounded-[8px] px-5 text-sm font-bold text-zinc-700 transition hover:bg-zinc-200">
                Batal
              </button>
              <button type="button" onClick={importItems} disabled={importLoading || importPreview.errors.length > 0} className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-emerald-600 px-5 text-sm font-extrabold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
                <Upload size={17} /> {importLoading ? "Mengimpor..." : `Import ${importPreview.items.length} Agenda`}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-zinc-950/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-[12px] shadow-soft overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
              <h3 className="text-lg font-black text-zinc-900">
                {modalMode === "create" ? "Tambah Agenda" : "Edit Agenda"}
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
                Nama Kegiatan
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="rounded-[8px] border border-zinc-200 px-4 py-3 outline-none focus:border-rosebrand-500"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold text-zinc-700">
                  Mulai Pelaksanaan
                  <input
                    type="datetime-local"
                    required
                    value={form.startsAt}
                    onChange={e => setForm({ ...form, startsAt: e.target.value })}
                    className="rounded-[8px] border border-zinc-200 px-4 py-3 outline-none focus:border-rosebrand-500"
                  />
                </label>
                <label className="grid gap-2 text-sm font-bold text-zinc-700">
                  Selesai Pelaksanaan
                  <input
                    type="datetime-local"
                    required
                    min={form.startsAt}
                    value={form.endsAt}
                    onChange={e => setForm({ ...form, endsAt: e.target.value })}
                    className="rounded-[8px] border border-zinc-200 px-4 py-3 outline-none focus:border-rosebrand-500"
                  />
                </label>
              </div>
              <label className="grid gap-2 text-sm font-bold text-zinc-700">
                Lokasi Pelaksanaan
                <input
                  type="text"
                  required
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                  className="rounded-[8px] border border-zinc-200 px-4 py-3 outline-none focus:border-rosebrand-500"
                />
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
