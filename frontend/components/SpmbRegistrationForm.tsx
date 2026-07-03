"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Download, Loader2, Printer, Send, X } from "lucide-react";
import { API_URL } from "@/lib/api-config";
import { downloadSpmbCardPdf, printSpmbCardPdf } from "@/lib/spmb-card";
import type { Major, SpmbRegistration } from "@/types/content";

type Props = {
  majors: Major[];
  academicYear: string;
};

const infoSources = [
  "Instagram",
  "TikTok",
  "Facebook",
  "Website sekolah",
  "Teman atau keluarga",
  "Guru SMP/MTs",
  "Kunjungan sekolah",
  "Spanduk/baliho",
  "Lainnya"
];

export function SpmbRegistrationForm({ majors, academicYear }: Props) {
  const [form, setForm] = useState({
    fullName: "",
    whatsappNumber: "",
    currentAddress: "",
    previousSchool: "",
    infoSource: "",
    fatherName: "",
    motherName: "",
    selectedMajorId: majors[0]?.id?.toString() || ""
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [registered, setRegistered] = useState<SpmbRegistration | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const response = await fetch(`${API_URL}/spmb/registrations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        ...form,
        selectedMajorId: Number(form.selectedMajorId)
      })
    }).catch(() => null);

    setLoading(false);

    if (!response?.ok) {
      const data = await response?.json().catch(() => null);
      setMessage(data?.message || "Pendaftaran belum berhasil. Periksa kembali data yang diisi.");
      return;
    }

    const data = (await response.json()) as SpmbRegistration;
    setRegistered(data);
  }

  return (
    <>
      <form onSubmit={onSubmit} className="grid gap-5 rounded-[8px] border border-zinc-200 bg-white p-5 shadow-sm md:p-7">
        <div>
          <p className="text-sm font-extrabold uppercase text-rosebrand-600">Formulir SPMB {academicYear}</p>
          <h1 className="mt-2 text-3xl font-black text-zinc-950">Daftar dalam beberapa menit</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-zinc-500">
            Isi data utama calon siswa. Tim SPMB akan menggunakan data ini untuk validasi saat daftar ulang di sekolah.
          </p>
        </div>

        {message ? <div className="rounded-[8px] bg-rosebrand-50 px-4 py-3 text-sm font-bold text-rosebrand-700">{message}</div> : null}

        <Field label="Nama lengkap" value={form.fullName} onChange={(value) => setForm({ ...form, fullName: value })} />
        <Field label="Nomor WhatsApp" value={form.whatsappNumber} onChange={(value) => setForm({ ...form, whatsappNumber: value })} inputMode="tel" />
        <Textarea label="Alamat rumah tinggal sekarang" value={form.currentAddress} onChange={(value) => setForm({ ...form, currentAddress: value })} />
        <Field label="Asal sekolah SMP/MTs/Sederajat" value={form.previousSchool} onChange={(value) => setForm({ ...form, previousSchool: value })} />

        <label className="grid gap-2 text-sm font-bold text-zinc-800">
          Mengetahui SMK Telkom Lampung dari mana?
          <select
            value={form.infoSource}
            onChange={(event) => setForm({ ...form, infoSource: event.target.value })}
            className="h-12 rounded-[8px] border border-zinc-200 bg-white px-4 text-sm font-semibold outline-none focus:border-rosebrand-500 focus:ring-4 focus:ring-rosebrand-500/10"
            required
          >
            <option value="">Pilih sumber informasi</option>
            {infoSources.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Nama ayah" value={form.fatherName} onChange={(value) => setForm({ ...form, fatherName: value })} />
          <Field label="Nama ibu" value={form.motherName} onChange={(value) => setForm({ ...form, motherName: value })} />
        </div>

        <label className="grid gap-2 text-sm font-bold text-zinc-800">
          Jurusan pilihan
          <select
            value={form.selectedMajorId}
            onChange={(event) => setForm({ ...form, selectedMajorId: event.target.value })}
            className="h-12 rounded-[8px] border border-zinc-200 bg-white px-4 text-sm font-semibold outline-none focus:border-rosebrand-500 focus:ring-4 focus:ring-rosebrand-500/10"
            required
          >
            <option value="">Pilih jurusan</option>
            {majors.map((major) => (
              <option key={major.id} value={major.id}>
                {major.name}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          disabled={loading || majors.length === 0}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] bg-zinc-950 px-5 text-sm font-extrabold text-white transition hover:bg-rosebrand-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <Loader2 size={18} className="animate-spin" aria-hidden /> : <Send size={18} aria-hidden />}
          {loading ? "Mengirim..." : "Daftar Sekarang"}
        </button>
      </form>

      {registered ? (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-zinc-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[8px] bg-white p-6 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={28} aria-hidden />
              </div>
              <button type="button" onClick={() => setRegistered(null)} className="grid h-9 w-9 place-items-center rounded-[8px] bg-zinc-100 text-zinc-500 hover:bg-zinc-200">
                <X size={18} aria-hidden />
              </button>
            </div>
            <h2 className="mt-5 text-2xl font-black text-zinc-950">Selamat, anda telah terdaftar.</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-zinc-600">
              Nomor pendaftaran anda adalah <span className="font-black text-rosebrand-600">{registered.registrationNumber}</span>. Berikutnya screenshot halaman ini dan datang ke sekolah untuk melakukan daftar ulang dengan menunjukkan screenshot atau kartu pendaftaran.
            </p>
            <div className="mt-5 rounded-[8px] border border-zinc-200 bg-zinc-50 p-4 text-sm">
              <p className="font-black text-zinc-900">{registered.fullName}</p>
              <p className="mt-1 font-semibold text-zinc-600">{registered.selectedMajorName}</p>
              <p className="mt-1 font-semibold text-zinc-500">SPMB {registered.academicYear}</p>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => downloadSpmbCardPdf(registered)} className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-rosebrand-500 px-4 text-sm font-extrabold text-white hover:bg-rosebrand-600">
                <Download size={17} aria-hidden />
                Download PDF
              </button>
              <button type="button" onClick={() => printSpmbCardPdf(registered)} className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] border border-zinc-200 px-4 text-sm font-extrabold text-zinc-700 hover:bg-zinc-50">
                <Printer size={17} aria-hidden />
                Print Kartu
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  inputMode
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputMode?: "tel" | "text";
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-zinc-800">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputMode={inputMode}
        className="h-12 rounded-[8px] border border-zinc-200 px-4 text-sm font-semibold outline-none focus:border-rosebrand-500 focus:ring-4 focus:ring-rosebrand-500/10"
        required
      />
    </label>
  );
}

function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-zinc-800">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="resize-y rounded-[8px] border border-zinc-200 px-4 py-3 text-sm font-semibold leading-6 outline-none focus:border-rosebrand-500 focus:ring-4 focus:ring-rosebrand-500/10"
        required
      />
    </label>
  );
}
