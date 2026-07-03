"use client";

import { FormEvent, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, GraduationCap, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { API_URL } from "@/lib/api";
import { getCookie } from "@/lib/auth-client";
import type { Major } from "@/types/content";

type MajorEditorProps = {
  majors: Major[];
};

type Notice = {
  type: "success" | "error";
  message: string;
};

type MajorFormState = {
  id?: number;
  name: string;
  summary: string;
  coverImage: string;
  icon: string;
  curriculum: string;
  careerProspects: string;
};

const emptyForm: MajorFormState = {
  name: "",
  summary: "",
  coverImage: "",
  icon: "Network",
  curriculum: "",
  careerProspects: ""
};

const pageSize = 10;

export function MajorEditor({ majors }: MajorEditorProps) {
  const [items, setItems] = useState<Major[]>(majors);
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState<MajorFormState>(emptyForm);
  const [loading, setLoading] = useState(false);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page]);

  function openCreateModal() {
    setForm(emptyForm);
    setNotice(null);
    setModalMode("create");
  }

  function openEditModal(major: Major) {
    setForm({
      id: major.id,
      name: major.name,
      summary: major.summary,
      coverImage: major.coverImage || "",
      icon: major.icon || "Network",
      curriculum: (major.curriculum || []).join("\n"),
      careerProspects: (major.careerProspects || []).join("\n")
    });
    setNotice(null);
    setModalMode("edit");
  }

  function closeModal() {
    if (loading) {
      return;
    }
    setModalMode(null);
    setForm(emptyForm);
  }

  async function refreshMajors() {
    const response = await fetch(`${API_URL}/majors`, {
      cache: "no-store",
      headers: { Accept: "application/json" }
    });
    if (!response.ok) {
      return;
    }
    const data = (await response.json()) as Major[];
    setItems(data || []);
    setPage((value) => Math.min(value, Math.max(1, Math.ceil((data || []).length / pageSize))));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const actionLabel = modalMode === "edit" ? "menyimpan perubahan jurusan" : "menambahkan jurusan baru";
    if (!window.confirm(`Yakin ingin ${actionLabel}?`)) {
      return;
    }

    setLoading(true);
    setNotice(null);

    const payload = {
      name: form.name,
      summary: form.summary,
      icon: form.icon,
      coverImage: form.coverImage,
      curriculum: splitLines(form.curriculum),
      careerProspects: splitLines(form.careerProspects)
    };

    const endpoint = modalMode === "edit" && form.id ? `${API_URL}/majors/${form.id}` : `${API_URL}/majors`;
    const method = modalMode === "edit" ? "PUT" : "POST";

    const response = await fetch(endpoint, {
      method,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": getCookie("csrf_token")
      },
      body: JSON.stringify(payload)
    }).catch(() => null);

    setLoading(false);

    if (!response?.ok) {
      const data = await response?.json().catch(() => null);
      setNotice({
        type: "error",
        message: data?.message || "Data jurusan belum tersimpan. Pastikan sesi login masih valid."
      });
      return;
    }

    await refreshMajors();
    setModalMode(null);
    setForm(emptyForm);
    setNotice({
      type: "success",
      message: modalMode === "edit" ? "Data jurusan berhasil diperbarui." : "Jurusan baru berhasil ditambahkan."
    });
  }

  async function deleteMajor(major: Major) {
    if (!window.confirm(`Yakin ingin menghapus jurusan "${major.name}"? Jurusan yang dihapus tidak akan tampil di website dan formulir SPMB.`)) {
      return;
    }

    setNotice(null);
    const response = await fetch(`${API_URL}/majors/${major.id}`, {
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
        message: data?.message || "Jurusan belum bisa dihapus. Pastikan sesi login masih valid."
      });
      return;
    }

    await refreshMajors();
    setNotice({ type: "success", message: "Jurusan berhasil dihapus." });
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-col justify-between gap-4 rounded-[8px] bg-white p-5 shadow-sm md:flex-row md:items-center">
        <div>
          <h2 className="text-xl font-black">Data Jurusan Aktif</h2>
          <p className="mt-1 text-sm font-semibold text-zinc-500">
            Menampilkan {currentItems.length} dari {items.length} jurusan.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-rosebrand-500 px-5 text-sm font-extrabold text-white transition hover:bg-rosebrand-600"
        >
          <Plus size={18} aria-hidden />
          Tambah Jurusan
        </button>
      </div>

      {notice ? (
        <div
          className={`rounded-[8px] px-4 py-3 text-sm font-bold ${
            notice.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rosebrand-50 text-rosebrand-700"
          }`}
        >
          {notice.message}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-[8px] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-left">
            <thead className="bg-softgray text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-5 py-4 font-extrabold">Jurusan</th>
                <th className="px-5 py-4 font-extrabold">Kurikulum</th>
                <th className="px-5 py-4 font-extrabold">Prospek</th>
                <th className="px-5 py-4 text-right font-extrabold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {currentItems.map((major) => (
                <tr key={major.id} className="align-top">
                  <td className="px-5 py-4">
                    <p className="font-black text-zinc-900">{major.name}</p>
                    <p className="mt-1 line-clamp-2 max-w-md text-sm leading-6 text-zinc-500">{major.summary}</p>
                    <p className="mt-2 text-xs font-bold uppercase text-rosebrand-600">{major.slug}</p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex max-w-sm flex-wrap gap-2">
                      {(major.curriculum || []).slice(0, 3).map((item) => (
                        <span key={item} className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-600">
                          {item}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex max-w-sm flex-wrap gap-2">
                      {(major.careerProspects || []).slice(0, 3).map((item) => (
                        <span key={item} className="rounded-full bg-rosebrand-50 px-3 py-1 text-xs font-bold text-rosebrand-700">
                          {item}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(major)}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border border-zinc-200 px-4 text-sm font-extrabold text-zinc-700 transition hover:border-rosebrand-200 hover:bg-rosebrand-50 hover:text-rosebrand-700"
                      >
                        <Pencil size={16} aria-hidden />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteMajor(major)}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border border-zinc-200 px-4 text-sm font-extrabold text-zinc-700 transition hover:border-rosebrand-200 hover:bg-rosebrand-50 hover:text-rosebrand-700"
                      >
                        <Trash2 size={16} aria-hidden />
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-zinc-100 px-5 py-4 md:flex-row md:items-center">
          <p className="text-sm font-semibold text-zinc-500">
            Halaman {page} dari {totalPages}
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
        <div className="fixed inset-0 z-[80] grid place-items-center bg-zinc-950/55 p-4 backdrop-blur-sm">
          <form onSubmit={onSubmit} className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[8px] bg-white p-6 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-extrabold uppercase text-rosebrand-600">
                  {modalMode === "edit" ? "Edit Jurusan" : "Tambah Jurusan"}
                </p>
                <h2 className="mt-2 flex items-center gap-2 text-2xl font-black">
                  <GraduationCap size={24} className="text-rosebrand-600" aria-hidden />
                  {modalMode === "edit" ? form.name : "Data jurusan baru"}
                </h2>
              </div>
              <button type="button" onClick={closeModal} className="grid h-10 w-10 place-items-center rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200">
                <X size={18} aria-hidden />
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm font-bold text-zinc-700">
                Nama Jurusan
                <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="rounded-[8px] border border-zinc-200 px-4 py-3 outline-none focus:border-rosebrand-500" required />
              </label>
              <label className="grid gap-2 text-sm font-bold text-zinc-700">
                Deskripsi
                <textarea value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} rows={4} className="rounded-[8px] border border-zinc-200 px-4 py-3 outline-none focus:border-rosebrand-500" required />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold text-zinc-700">
                  Cover Image URL
                  <input value={form.coverImage} onChange={(event) => setForm({ ...form, coverImage: event.target.value })} className="rounded-[8px] border border-zinc-200 px-4 py-3 outline-none focus:border-rosebrand-500" placeholder="https://..." />
                </label>
                <label className="grid gap-2 text-sm font-bold text-zinc-700">
                  Icon
                  <select value={form.icon} onChange={(event) => setForm({ ...form, icon: event.target.value })} className="rounded-[8px] border border-zinc-200 px-4 py-3 outline-none focus:border-rosebrand-500">
                    <option value="Network">Network</option>
                    <option value="Code">Code</option>
                    <option value="Palette">Palette</option>
                  </select>
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold text-zinc-700">
                  Kurikulum
                  <textarea value={form.curriculum} onChange={(event) => setForm({ ...form, curriculum: event.target.value })} rows={6} className="rounded-[8px] border border-zinc-200 px-4 py-3 outline-none focus:border-rosebrand-500" placeholder="Satu item per baris" required />
                </label>
                <label className="grid gap-2 text-sm font-bold text-zinc-700">
                  Prospek Pekerjaan
                  <textarea value={form.careerProspects} onChange={(event) => setForm({ ...form, careerProspects: event.target.value })} rows={6} className="rounded-[8px] border border-zinc-200 px-4 py-3 outline-none focus:border-rosebrand-500" placeholder="Satu item per baris" required />
                </label>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={closeModal} className="h-11 rounded-[8px] border border-zinc-200 px-5 text-sm font-extrabold text-zinc-700">
                Batal
              </button>
              <button type="submit" disabled={loading} className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-rosebrand-500 px-5 text-sm font-extrabold text-white disabled:opacity-70">
                <Save size={18} aria-hidden />
                {loading ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}
