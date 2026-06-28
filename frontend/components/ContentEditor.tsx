"use client";

import { FormEvent, useState } from "react";
import { Save } from "lucide-react";
import { API_URL } from "@/lib/api";
import { getCookie } from "@/lib/auth-client";

type ContentEditorProps = {
  type: "articles" | "announcements" | "agendas";
};

const labels = {
  articles: "Artikel",
  announcements: "Pengumuman",
  agendas: "Agenda"
};

export function ContentEditor({ type }: ContentEditorProps) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const payload =
      type === "agendas"
        ? { title, location: summary, startsAt: new Date().toISOString() }
        : type === "articles"
          ? { title, excerpt: summary, content: summary, category: "Sekolah", status: "draft" }
          : { title, body: summary, status: "published" };

    const response = await fetch(`${API_URL}/${type}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": getCookie("csrf_token")
      },
      body: JSON.stringify(payload)
    }).catch(() => null);

    setLoading(false);

    if (!response?.ok) {
      setMessage("Belum tersimpan. Pastikan backend aktif dan sesi login valid.");
      return;
    }

    setTitle("");
    setSummary("");
    setMessage(`${labels[type]} berhasil disimpan.`);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-[8px] bg-white p-6 shadow-sm">
      <h2 className="text-xl font-black">Tambah {labels[type]}</h2>
      <label className="grid gap-2 text-sm font-bold text-zinc-700">
        Judul
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="rounded-[8px] border border-zinc-200 px-4 py-3 outline-none focus:border-rosebrand-500"
          required
        />
      </label>
      <label className="grid gap-2 text-sm font-bold text-zinc-700">
        {type === "agendas" ? "Lokasi" : "Ringkasan"}
        <textarea
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          rows={5}
          className="rounded-[8px] border border-zinc-200 px-4 py-3 outline-none focus:border-rosebrand-500"
          required
        />
      </label>
      {message ? <p className="rounded-[8px] bg-softgray px-4 py-3 text-sm font-bold text-zinc-600">{message}</p> : null}
      <button type="submit" disabled={loading} className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-rosebrand-500 px-5 text-sm font-extrabold text-white disabled:opacity-70">
        <Save size={18} aria-hidden />
        {loading ? "Menyimpan..." : "Simpan"}
      </button>
    </form>
  );
}
