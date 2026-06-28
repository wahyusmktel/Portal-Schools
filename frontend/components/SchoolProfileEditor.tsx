"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { ImagePlus, Save } from "lucide-react";
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
  const [principalImageFile, setPrincipalImageFile] = useState<File | null>(null);
  const [principalImagePreview, setPrincipalImagePreview] = useState(profile.principalImage);

  useEffect(() => {
    return () => {
      if (principalImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(principalImagePreview);
      }
    };
  }, [principalImagePreview]);

  function onPrincipalImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setNotice({ type: "error", message: "File harus berupa gambar." });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setNotice({ type: "error", message: "Ukuran gambar maksimal 5MB." });
      return;
    }

    if (principalImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(principalImagePreview);
    }

    const previewURL = URL.createObjectURL(file);
    setPrincipalImageFile(file);
    setPrincipalImagePreview(previewURL);
    setNotice(null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!window.confirm("Yakin ingin menyimpan perubahan profil sekolah dan sambutan kepala sekolah?")) {
      return;
    }

    setLoading(true);
    setNotice(null);

    let principalImageURL = form.principalImage;
    if (principalImageFile) {
      const uploadResult = await uploadPrincipalImage(principalImageFile);
      if (!uploadResult.ok) {
        setLoading(false);
        setNotice({ type: "error", message: uploadResult.message });
        return;
      }
      principalImageURL = uploadResult.url;
    }

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
      principalImage: principalImageURL,
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

    setForm((value) => ({ ...value, principalImage: principalImageURL }));
    setPrincipalImageFile(null);
    setPrincipalImagePreview(principalImageURL);
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
        <div className="grid gap-4 lg:grid-cols-[0.7fr_0.3fr]">
          <div className="grid gap-4">
            <Field label="URL Foto Kepala Sekolah" value={form.principalImage} onChange={(value) => {
              setForm({ ...form, principalImage: value });
              setPrincipalImagePreview(value);
              setPrincipalImageFile(null);
            }} />
            <label className="grid gap-2 text-sm font-bold text-zinc-700">
              Unggah Foto dari Disk
              <span className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-[8px] border border-dashed border-zinc-300 bg-softgray px-4 py-5 text-center transition hover:border-rosebrand-300 hover:bg-rosebrand-50">
                <ImagePlus size={26} className="text-rosebrand-600" aria-hidden />
                <span className="text-sm font-extrabold text-zinc-700">
                  {principalImageFile ? principalImageFile.name : "Pilih gambar JPG, PNG, atau WEBP"}
                </span>
                <span className="text-xs font-semibold text-zinc-500">Maksimal 5MB. Preview muncul setelah file dipilih.</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onPrincipalImageChange} className="sr-only" />
              </span>
            </label>
          </div>
          <div className="rounded-[8px] border border-zinc-200 bg-softgray p-3">
            <p className="mb-3 text-sm font-extrabold text-zinc-700">Preview Foto</p>
            <div className="relative aspect-[4/5] overflow-hidden rounded-[8px] bg-zinc-200">
              {principalImagePreview ? (
                principalImagePreview.startsWith("blob:") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={principalImagePreview} alt="Preview foto kepala sekolah" className="h-full w-full object-cover" />
                ) : (
                  <Image src={principalImagePreview} alt="Preview foto kepala sekolah" fill sizes="240px" className="object-cover" />
                )
              ) : (
                <div className="grid h-full place-items-center px-4 text-center text-sm font-bold text-zinc-500">
                  Belum ada gambar
                </div>
              )}
            </div>
          </div>
        </div>
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

async function uploadPrincipalImage(file: File): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
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
    return { ok: false, message: data?.message || "Upload gambar gagal." };
  }

  const data = (await response.json()) as { url?: string };
  if (!data.url) {
    return { ok: false, message: "Upload berhasil tetapi URL gambar tidak diterima." };
  }

  return { ok: true, url: data.url };
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
