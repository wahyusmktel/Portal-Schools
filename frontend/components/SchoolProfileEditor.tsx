"use client";

import { FormEvent, useState } from "react";
import { Save } from "lucide-react";
import { API_URL } from "@/lib/api";
import { getCookie } from "@/lib/auth-client";
import type { SchoolProfile } from "@/types/content";

type SchoolProfileEditorProps = {
  profile: SchoolProfile;
};

type Notice = {
  type: "success" | "error";
  message: string;
};

export function SchoolProfileEditor({ profile }: SchoolProfileEditorProps) {
  const [form, setForm] = useState({
    ...profile,
    statsText: profile.stats.map((item) => `${item.label}=${item.value}`).join("\n")
  });
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!window.confirm("Yakin ingin menyimpan perubahan profil sekolah dan sambutan kepala sekolah?")) {
      return;
    }

    setLoading(true);
    setNotice(null);

    const payload: SchoolProfile = {
      name: form.name,
      tagline: form.tagline,
      description: form.description,
      address: form.address,
      phone: form.phone,
      email: form.email,
      mapEmbedUrl: form.mapEmbedUrl,
      principalName: form.principalName,
      principalTitle: form.principalTitle,
      principalMessage: form.principalMessage,
      principalImage: form.principalImage,
      stats: parseStats(form.statsText)
    };

    const response = await fetch(`${API_URL}/school-profile`, {
      method: "PUT",
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
        message: data?.message || "Profil sekolah belum tersimpan. Pastikan sesi login masih valid."
      });
      return;
    }

    setNotice({ type: "success", message: "Profil sekolah dan sambutan berhasil diperbarui." });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6">
      {notice ? (
        <div
          className={`rounded-[8px] px-4 py-3 text-sm font-bold ${
            notice.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rosebrand-50 text-rosebrand-700"
          }`}
        >
          {notice.message}
        </div>
      ) : null}

      <section className="grid gap-4 rounded-[8px] bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm font-extrabold uppercase text-rosebrand-600">Profil Singkat</p>
          <h2 className="mt-2 text-2xl font-black">Informasi sekolah</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nama Sekolah" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
          <Field label="Tagline" value={form.tagline} onChange={(value) => setForm({ ...form, tagline: value })} />
        </div>
        <Textarea label="Deskripsi Singkat" value={form.description} onChange={(value) => setForm({ ...form, description: value })} rows={5} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Telepon" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
          <Field label="Email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
        </div>
        <Textarea label="Alamat" value={form.address} onChange={(value) => setForm({ ...form, address: value })} rows={3} />
        <Field label="Google Maps Embed URL" value={form.mapEmbedUrl} onChange={(value) => setForm({ ...form, mapEmbedUrl: value })} />
        <Textarea
          label="Statistik Profil"
          value={form.statsText}
          onChange={(value) => setForm({ ...form, statsText: value })}
          rows={4}
          placeholder="Format: Label=Nilai, satu item per baris"
        />
      </section>

      <section className="grid gap-4 rounded-[8px] bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm font-extrabold uppercase text-rosebrand-600">Sambutan</p>
          <h2 className="mt-2 text-2xl font-black">Kepala sekolah</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nama Kepala Sekolah" value={form.principalName} onChange={(value) => setForm({ ...form, principalName: value })} />
          <Field label="Jabatan" value={form.principalTitle} onChange={(value) => setForm({ ...form, principalTitle: value })} />
        </div>
        <Field label="URL Foto Kepala Sekolah" value={form.principalImage} onChange={(value) => setForm({ ...form, principalImage: value })} />
        <Textarea label="Isi Sambutan" value={form.principalMessage} onChange={(value) => setForm({ ...form, principalMessage: value })} rows={6} />
      </section>

      <div className="sticky bottom-4 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] bg-rosebrand-500 px-6 text-sm font-extrabold text-white shadow-soft transition hover:bg-rosebrand-600 disabled:opacity-70"
        >
          <Save size={18} aria-hidden />
          {loading ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-zinc-700">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="rounded-[8px] border border-zinc-200 px-4 py-3 outline-none focus:border-rosebrand-500"
        required
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
        className="rounded-[8px] border border-zinc-200 px-4 py-3 outline-none focus:border-rosebrand-500"
        required
      />
    </label>
  );
}

function parseStats(value: string): Array<{ label: string; value: string }> {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, ...rest] = line.split("=");
      return {
        label: label.trim(),
        value: rest.join("=").trim()
      };
    })
    .filter((item) => item.label && item.value);
}
