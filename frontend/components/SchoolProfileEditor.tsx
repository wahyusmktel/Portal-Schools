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
    statsText: (profile.stats || []).map((item) => `${item.label}=${item.value}`).join("\n"),
    socialMediaText: (profile.socialMedia || []).map((item) => `${item.label}=${item.value}`).join("\n"),
    partnerLinksText: (profile.partnerLinks || []).map((item) => `${item.label}=${item.value}`).join("\n"),
  });
  
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [principalImageFile, setPrincipalImageFile] = useState<File | null>(null);
  const [principalImagePreview, setPrincipalImagePreview] = useState(profile.principalImage || "");

  const [footerLogoFile, setFooterLogoFile] = useState<File | null>(null);
  const [footerLogoPreview, setFooterLogoPreview] = useState(profile.footerLogo || "");

  const [headerLogo, setHeaderLogo] = useState(profile.headerLogo || "");
  const [footerLogo, setFooterLogo] = useState(profile.footerLogo || "");

  useEffect(() => {
    return () => {
      if (principalImagePreview.startsWith("blob:")) URL.revokeObjectURL(principalImagePreview);
      if (footerLogoPreview.startsWith("blob:")) URL.revokeObjectURL(footerLogoPreview);
    };
  }, [principalImagePreview, footerLogoPreview]);

  function onImageChange(event: ChangeEvent<HTMLInputElement>, setFile: any, setPreview: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setNotice({ type: "error", message: "File harus berupa gambar." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setNotice({ type: "error", message: "Ukuran gambar maksimal 5MB." });
      return;
    }

    setFile(file);
    setPreview(URL.createObjectURL(file));
    setNotice(null);
  }

  async function uploadImage(file: File): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch(`${API_URL}/uploads/images`, {
      method: "POST",
      credentials: "include",
      headers: { "X-CSRF-Token": getCookie("csrf_token") },
      body: formData
    }).catch(() => null);

    if (!response?.ok) {
      const data = await response?.json().catch(() => null);
      return { ok: false, message: data?.message || "Upload gambar gagal." };
    }

    const data = (await response.json()) as { url?: string };
    if (!data.url) return { ok: false, message: "Upload berhasil tetapi URL gambar tidak diterima." };

    return { ok: true, url: data.url };
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!window.confirm("Yakin ingin menyimpan perubahan profil sekolah?")) {
      return;
    }

    setLoading(true);
    setNotice(null);

    let principalImageURL = form.principalImage;
    if (principalImageFile) {
      const uploadResult = await uploadImage(principalImageFile);
      if (!uploadResult.ok) {
        setLoading(false);
        setNotice({ type: "error", message: uploadResult.message });
        return;
      }
      principalImageURL = uploadResult.url;
    }

    let footerLogoURL = footerLogo;
    if (footerLogoFile) {
      const uploadResult = await uploadImage(footerLogoFile);
      if (!uploadResult.ok) {
        setLoading(false);
        setNotice({ type: "error", message: uploadResult.message });
        return;
      }
      footerLogoURL = uploadResult.url;
    }

    const payload: SchoolProfile = {
      name: form.name,
      tagline: form.tagline,
      description: form.description,
      address: form.address,
      phone: form.phone,
      email: form.email,
      mapEmbedUrl: form.mapEmbedUrl,
      youtubeEmbedUrl: form.youtubeEmbedUrl,
      principalName: form.principalName,
      principalTitle: form.principalTitle,
      principalMessage: form.principalMessage,
      principalImage: principalImageURL,
      stats: parseStats(form.statsText),
      socialMedia: parseStats(form.socialMediaText),
      partnerLinks: parseStats(form.partnerLinksText),
      headerLogo: headerLogo,
      footerLogo: footerLogoURL,
      footerText: form.footerText,
      vision: form.vision,
      mission: form.mission,
      spmbBrochureUrl: form.spmbBrochureUrl,
      spmbAcademicYear: form.spmbAcademicYear || "2026/2027"
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

    setForm((value) => ({ ...value, principalImage: principalImageURL, footerLogo: footerLogoURL }));
    setPrincipalImageFile(null);
    setFooterLogoFile(null);
    setNotice({ type: "success", message: "Profil sekolah berhasil diperbarui." });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6">
      {notice && (
        <div className={`rounded-[8px] px-4 py-3 text-sm font-bold ${notice.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rosebrand-50 text-rosebrand-700"}`}>
          {notice.message}
        </div>
      )}

      <section className="grid gap-4 rounded-[8px] bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm font-extrabold uppercase text-rosebrand-600">Profil Singkat</p>
          <h2 className="mt-2 text-2xl font-black">Informasi Sekolah</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nama Sekolah" value={form.name} onChange={(value: string) => setForm({ ...form, name: value })} />
          <Field label="Tagline" value={form.tagline} onChange={(value: string) => setForm({ ...form, tagline: value })} />
        </div>
        <Textarea label="Deskripsi Singkat" value={form.description} onChange={(value: string) => setForm({ ...form, description: value })} rows={5} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Telepon" value={form.phone} onChange={(value: string) => setForm({ ...form, phone: value })} />
          <Field label="Email" value={form.email} onChange={(value: string) => setForm({ ...form, email: value })} />
        </div>
        <Textarea label="Alamat" value={form.address} onChange={(value: string) => setForm({ ...form, address: value })} rows={3} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Google Maps Embed URL" value={form.mapEmbedUrl} onChange={(value: string) => setForm({ ...form, mapEmbedUrl: value })} />
          <Field label="YouTube Embed URL (Video Profil)" value={form.youtubeEmbedUrl || ""} onChange={(value: string) => setForm({ ...form, youtubeEmbedUrl: value })} placeholder="https://www.youtube.com/embed/..." />
        </div>
        
        <div className="grid gap-4 md:grid-cols-3">
          <Textarea label="Statistik Profil" value={form.statsText} onChange={(value: string) => setForm({ ...form, statsText: value })} rows={5} placeholder="Siswa Aktif=1200&#10;Guru=80" />
          <Textarea label="Sosial Media" value={form.socialMediaText} onChange={(value: string) => setForm({ ...form, socialMediaText: value })} rows={5} placeholder="Instagram=https://...&#10;Facebook=https://..." />
          <Textarea label="Link Partner" value={form.partnerLinksText} onChange={(value: string) => setForm({ ...form, partnerLinksText: value })} rows={5} placeholder="Kemendikbud=https://...&#10;Telkom=https://..." />
        </div>
        
        <div className="mt-4 border-t border-zinc-100 pt-4">
          <h3 className="mb-4 text-lg font-bold text-zinc-900">Visi, Misi & SPMB</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Textarea label="Visi" value={form.vision || ""} onChange={(value: string) => setForm({ ...form, vision: value })} rows={4} required={false} />
            <Textarea label="Misi" value={form.mission || ""} onChange={(value: string) => setForm({ ...form, mission: value })} rows={4} required={false} />
          </div>
          <div className="mt-4">
            <Field label="Tahun Ajaran SPMB" value={form.spmbAcademicYear || "2026/2027"} onChange={(value: string) => setForm({ ...form, spmbAcademicYear: value })} required={false} />
          </div>
          <div className="mt-4">
            <Textarea label="URL Brosur SPMB (Pisahkan dengan koma untuk banyak gambar)" value={form.spmbBrochureUrl || ""} onChange={(value: string) => setForm({ ...form, spmbBrochureUrl: value })} rows={3} required={false} placeholder="https://example.com/brosur1.jpg, https://example.com/brosur2.jpg" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 rounded-[8px] bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm font-extrabold uppercase text-rosebrand-600">Footer Bawah</p>
          <h2 className="border-b border-zinc-100 pb-2 font-black text-zinc-800">Branding & Footer</h2>
        </div>
        <div className="grid gap-8 pt-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-zinc-700">Logo Header (Navigasi Publik)</label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50">
              <div className="shrink-0 relative w-40 h-16 rounded-lg bg-white border border-zinc-100 shadow-sm overflow-hidden flex items-center justify-center p-2">
                {headerLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={headerLogo} alt="Header Logo" className="max-w-full max-h-full object-contain" />
                ) : (
                  <ImagePlus className="w-6 h-6 text-zinc-300" />
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    if (e.target.files && e.target.files[0]) {
                      setLoading(true);
                      const result = await uploadImage(e.target.files[0]);
                      if (result?.ok) {
                        setHeaderLogo(result.url);
                        setNotice({ type: "success", message: "Logo header berhasil diunggah." });
                      } else {
                        setNotice({ type: "error", message: result?.message || "Gagal mengunggah logo header." });
                      }
                      setLoading(false);
                    }
                  }}
                  className="block w-full text-sm text-zinc-500 file:mr-4 file:rounded-full file:border-0 file:bg-rosebrand-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-rosebrand-700 hover:file:bg-rosebrand-100 cursor-pointer"
                />
                <p className="text-xs text-zinc-500 mt-2">Disarankan ukuran tinggi maks 80px, format PNG transparan.</p>
              </div>
            </div>
          </div>
          <div className="grid gap-4">
            <Field label="URL Logo Footer" value={footerLogo || ""} onChange={(value: string) => {
              setFooterLogo(value);
              setFooterLogoPreview(value);
              setFooterLogoFile(null);
            }} required={false} />
            <label className="grid gap-2 text-sm font-bold text-zinc-700">
              Unggah Logo Footer dari Disk
              <span className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-[8px] border border-dashed border-zinc-300 bg-softgray px-4 py-5 text-center transition hover:border-rosebrand-300 hover:bg-rosebrand-50">
                <ImagePlus size={26} className="text-rosebrand-600" aria-hidden />
                <span className="text-sm font-extrabold text-zinc-700">
                  {footerLogoFile ? footerLogoFile.name : "Pilih gambar JPG, PNG, atau WEBP"}
                </span>
                <span className="text-xs font-semibold text-zinc-500">Maksimal 5MB.</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => onImageChange(e, setFooterLogoFile, setFooterLogoPreview)} className="sr-only" />
              </span>
            </label>
            <Textarea label="Teks Deskripsi Footer Kanan" value={form.footerText || ""} onChange={(value: string) => setForm({ ...form, footerText: value })} rows={4} required={false} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 rounded-[8px] bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm font-extrabold uppercase text-rosebrand-600">Sambutan</p>
          <h2 className="mt-2 text-2xl font-black">Kepala Sekolah</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nama Kepala Sekolah" value={form.principalName} onChange={(value: string) => setForm({ ...form, principalName: value })} />
          <Field label="Jabatan" value={form.principalTitle} onChange={(value: string) => setForm({ ...form, principalTitle: value })} />
        </div>
        <div className="grid gap-4 lg:grid-cols-[0.7fr_0.3fr]">
          <div className="grid gap-4">
            <Field label="URL Foto Kepala Sekolah" value={form.principalImage} onChange={(value: string) => {
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
                <span className="text-xs font-semibold text-zinc-500">Maksimal 5MB.</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => onImageChange(e, setPrincipalImageFile, setPrincipalImagePreview)} className="sr-only" />
              </span>
            </label>
          </div>
          <div className="rounded-[8px] border border-zinc-200 bg-softgray p-3">
            <p className="mb-3 text-sm font-extrabold text-zinc-700">Preview Foto</p>
            <div className="relative aspect-[4/5] overflow-hidden rounded-[8px] bg-zinc-200">
              {principalImagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={principalImagePreview} alt="Preview foto" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center px-4 text-center text-sm font-bold text-zinc-500">Belum ada gambar</div>
              )}
            </div>
          </div>
        </div>
        <Textarea label="Isi Sambutan" value={form.principalMessage} onChange={(value: string) => setForm({ ...form, principalMessage: value })} rows={6} />
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

function Field({ label, value, onChange, placeholder, required = true }: any) {
  return (
    <label className="grid gap-2 text-sm font-bold text-zinc-700">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="rounded-[8px] border border-zinc-200 px-4 py-3 outline-none focus:border-rosebrand-500"
        required={required}
      />
    </label>
  );
}

function Textarea({ label, value, onChange, rows, placeholder, required = true }: any) {
  return (
    <label className="grid gap-2 text-sm font-bold text-zinc-700">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="rounded-[8px] border border-zinc-200 px-4 py-3 outline-none focus:border-rosebrand-500"
        required={required}
      />
    </label>
  );
}

function parseStats(value: string): Array<{ label: string; value: string }> {
  return (value || "")
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
