"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import {
  CheckCircle2,
  Download,
  Loader2,
  Printer,
  Send,
  Upload,
  UserCheck,
  CreditCard,
  FileText,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  School,
  MapPin,
  Users,
  ShieldCheck,
  Check,
  Search,
  FileCheck
} from "lucide-react";
import { API_URL } from "@/lib/api-config";
import { downloadSpmbCardPdf, printSpmbCardPdf } from "@/lib/spmb-card";
import type { Major, SpmbRegistration } from "@/types/content";

type Props = {
  majors: Major[];
  academicYear: string;
};

const PROVINCES = [
  "Aceh", "Sumatera Utara", "Sumatera Barat", "Riau", "Kepulauan Riau", "Jambi",
  "Sumatera Selatan", "Kepulauan Bangka Belitung", "Bengkulu", "Lampung",
  "DKI Jakarta", "Jawa Barat", "Banten", "Jawa Tengah", "DI Yogyakarta", "Jawa Timur",
  "Bali", "Nusa Tenggara Barat", "Nusa Tenggara Timur",
  "Kalimantan Barat", "Kalimantan Tengah", "Kalimantan Selatan", "Kalimantan Timur", "Kalimantan Utara",
  "Sulawesi Utara", "Gorontalo", "Sulawesi Tengah", "Sulawesi Barat", "Sulawesi Selatan", "Sulawesi Tenggara",
  "Maluku", "Maluku Utara",
  "Papua Barat Daya", "Papua Barat", "Papua", "Papua Tengah", "Papua Pegunungan", "Papua Selatan"
];

const RELIGIONS = ["Islam", "Kristen", "Katholik", "Hindu", "Budha", "Konghucu"];

const PARENT_EDUCATIONS = [
  "SD / Sederajat",
  "SMP / Sederajat",
  "SMA / SMK / Sederajat",
  "D1 / D2 / D3",
  "D4 / S1",
  "S2",
  "S3"
];

const FATHER_OCCUPATIONS = [
  "Petani", "Pedagang", "Buruh", "PNS", "Polri", "TNI", "BUMN", "Wirawasta", "Karyawan Swasta", "Lainnya"
];

const MOTHER_OCCUPATIONS = [
  "Ibu Rumah Tangga", "Petani", "Pedagang", "Buruh", "PNS", "Polri", "TNI", "BUMN", "Wirawasta", "Karyawan Swasta", "Tidak Bekerja", "Lainnya"
];

const REGISTRATION_TRACKS = ["Reguler", "Tahfidz", "Organisasi", "Prestasi", "Influencer"];

const INFO_SOURCES = [
  "Instagram", "TikTok", "Facebook", "YouTube", "Website Sekolah",
  "Event Sekolah", "Guru SMP/MTs", "Teman atau Keluarga", "Spanduk / Baliho", "Brosur", "Lainnya"
];

const BATCH_OPTIONS = ["INDEN", "BATCH 1", "BATCH 2", "BATCH 3"];

const SUPPLEMENTARY_DOC_TYPES = [
  "SURAT KETERANGAN SEHAT",
  "SURAT PERNYATAAN PEMBAYARAN",
  "KARTU PELAJAR / SURAT KETERANGAN SISWA AKTIF",
  "SERTIFIKAT PENDUKUNG"
];

type MenuTab = "pendaftaran" | "konfirmasi" | "upload-berkas" | "rincian";

export function SpmbRegistrationForm({ majors, academicYear }: Props) {
  const [activeMenu, setActiveMenu] = useState<MenuTab>("pendaftaran");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [registered, setRegistered] = useState<SpmbRegistration | null>(null);

  // Form Pendaftaran State
  const [form, setForm] = useState({
    // Step 1: Pilihan Kelas & Biodata Siswa
    classGrade: "Kelas 9 SMP/Sederajat (Tahun Pelajaran 2027/2028)",
    fullName: "",
    nik: "",
    nisn: "",
    gender: "Laki-laki",
    religion: "Islam",
    birthDate: "",
    whatsappNumber: "",
    email: "",

    // Step 2: Alamat Tempat Tinggal
    province: "Lampung",
    city: "",
    district: "",
    currentAddress: "",

    // Step 3: Informasi Akademik
    previousSchool: "",
    previousSchoolAddress: "",
    schoolType: "Sekolah Menengah Pertama (SMP)",
    ministry: "Kementerian Pendidikan",
    selectedMajorId: majors[0]?.id?.toString() || "1",
    registrationTrack: "Reguler",

    // Step 4: Data Orang Tua
    fatherName: "",
    fatherEducation: "SMA / SMK / Sederajat",
    fatherOccupation: "Wiraswasta",
    fatherBirthDate: "",
    fatherPhone: "",
    motherName: "",
    motherEducation: "SMA / SMK / Sederajat",
    motherOccupation: "Ibu Rumah Tangga",
    motherBirthDate: "",
    motherPhone: "",

    // Step 5: Dokumen & Kuesioner
    studentCardFile: "",
    familyCardFile: "",
    birthCertificateFile: "",
    achievementCertificateFile: "",
    infoSource: "Instagram",
    affiliatorName: "",
    reason: "",
    choicePriority: "Pilihan Utama",
    achievementsNote: ""
  });

  // Form Konfirmasi Pembayaran State
  const [paymentForm, setPaymentForm] = useState({
    registrationNumber: "",
    studentName: "",
    batch: "INDEN",
    amount: "",
    proofFile: "",
    notes: ""
  });
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Form Upload Berkas Susulan State
  const [docForm, setDocForm] = useState({
    registrationNumber: "",
    studentName: "",
    documentType: SUPPLEMENTARY_DOC_TYPES[0],
    fileUrl: ""
  });
  const [docSuccess, setDocSuccess] = useState(false);

  // File Upload Helper
  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>, targetField: string) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Ukuran file maksimal 10MB!");
      return;
    }

    setUploadingField(targetField);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/spmb/uploads`, {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        throw new Error("Gagal mengunggah file");
      }

      const data = await res.json();
      if (targetField === "proofFile") {
        setPaymentForm((prev) => ({ ...prev, proofFile: data.url }));
      } else if (targetField === "suppDoc") {
        setDocForm((prev) => ({ ...prev, fileUrl: data.url }));
      } else {
        setForm((prev) => ({ ...prev, [targetField]: data.url }));
      }
    } catch (err: any) {
      alert(err.message || "Gagal mengunggah berkas");
    } finally {
      setUploadingField(null);
    }
  }

  // Submit Pendaftaran
  async function onSubmitRegistration(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`${API_URL}/spmb/registrations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          ...form,
          selectedMajorId: Number(form.selectedMajorId),
          academicYear
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Gagal menyimpan formulir pendaftaran.");
      }

      setRegistered(data as SpmbRegistration);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Terjadi kesalahan saat pendaftaran." });
    } finally {
      setLoading(false);
    }
  }

  // Submit Konfirmasi Pembayaran
  async function onSubmitPayment(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`${API_URL}/spmb/payment-confirmations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...paymentForm,
          amount: Number(paymentForm.amount.replace(/\D/g, ""))
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Gagal mengirim konfirmasi pembayaran.");
      }

      setPaymentSuccess(true);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Gagal mengirim konfirmasi." });
    } finally {
      setLoading(false);
    }
  }

  // Submit Berkas Susulan
  async function onSubmitSupplementaryDoc(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`${API_URL}/spmb/supplementary-documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(docForm)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Gagal mengunggah berkas pendukung.");
      }

      setDocSuccess(true);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Gagal mengunggah berkas." });
    } finally {
      setLoading(false);
    }
  }

  // Sukses Screen Pendaftaran
  if (registered) {
    return (
      <div className="grid gap-6 rounded-[12px] border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col items-center text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="mt-4 text-2xl font-black text-zinc-900">Pendaftaran Berhasil Dikirim!</h2>
          <p className="mt-2 max-w-lg text-sm text-zinc-600">
            Data calon siswa telah tersimpan resmi di sistem SPMB SMK Telkom Lampung. Simpan nomor pendaftaran dan unduh kartu bukti pendaftaran Anda.
          </p>

          <div className="mt-6 w-full max-w-md rounded-[8px] border border-rosebrand-200 bg-rosebrand-50/50 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-rosebrand-700">Nomor Pendaftaran Resmi</p>
            <p className="mt-1 text-2xl font-black text-zinc-900">{registered.registrationNumber}</p>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => downloadSpmbCardPdf(registered)}
              className="inline-flex h-11 items-center gap-2 rounded-[8px] bg-rosebrand-500 px-5 text-sm font-bold text-white transition hover:bg-rosebrand-600 shadow-sm"
            >
              <Download size={16} /> Unduh Kartu PDF
            </button>
            <button
              type="button"
              onClick={() => printSpmbCardPdf(registered)}
              className="inline-flex h-11 items-center gap-2 rounded-[8px] border border-zinc-200 bg-white px-5 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50"
            >
              <Printer size={16} /> Cetak Bukti
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {/* Tab Menu SPMB (Persis 4 Cabang Google Form) */}
      <div className="grid grid-cols-2 gap-2 rounded-[10px] border border-zinc-200 bg-zinc-100 p-1.5 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => { setActiveMenu("pendaftaran"); setMessage(null); }}
          className={`flex items-center justify-center gap-2 rounded-[8px] px-3 py-2.5 text-xs font-black transition ${
            activeMenu === "pendaftaran"
              ? "bg-white text-rosebrand-600 shadow-sm"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          <UserCheck size={15} /> Pendaftaran Baru
        </button>
        <button
          type="button"
          onClick={() => { setActiveMenu("konfirmasi"); setMessage(null); }}
          className={`flex items-center justify-center gap-2 rounded-[8px] px-3 py-2.5 text-xs font-black transition ${
            activeMenu === "konfirmasi"
              ? "bg-white text-rosebrand-600 shadow-sm"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          <CreditCard size={15} /> Konfirmasi Pembayaran
        </button>
        <button
          type="button"
          onClick={() => { setActiveMenu("upload-berkas"); setMessage(null); }}
          className={`flex items-center justify-center gap-2 rounded-[8px] px-3 py-2.5 text-xs font-black transition ${
            activeMenu === "upload-berkas"
              ? "bg-white text-rosebrand-600 shadow-sm"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          <FileText size={15} /> Upload Berkas
        </button>
        <button
          type="button"
          onClick={() => { setActiveMenu("rincian"); setMessage(null); }}
          className={`flex items-center justify-center gap-2 rounded-[8px] px-3 py-2.5 text-xs font-black transition ${
            activeMenu === "rincian"
              ? "bg-white text-rosebrand-600 shadow-sm"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          <HelpCircle size={15} /> Rincian Pembayaran
        </button>
      </div>

      {message && (
        <div
          className={`rounded-[8px] p-4 text-sm font-bold ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* CABANG 1: PENDAFTARAN BARU (Multi-Step 5 Tahap) */}
      {activeMenu === "pendaftaran" && (
        <form onSubmit={onSubmitRegistration} className="grid gap-6 rounded-[12px] border border-zinc-200 bg-white p-5 shadow-sm md:p-8">
          {/* Step Indicator */}
          <div className="border-b border-zinc-100 pb-5">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-400 mb-3">
              <span>LANGKAH {step} DARI 5</span>
              <span className="text-rosebrand-600">
                {step === 1 && "Kelas & Biodata Siswa"}
                {step === 2 && "Alamat Tempat Tinggal"}
                {step === 3 && "Informasi Akademik & Jurusan"}
                {step === 4 && "Data Orang Tua"}
                {step === 5 && "Dokumen & Info Tambahan"}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
              <div className={`h-full ${step >= 1 ? "bg-rosebrand-500" : "bg-transparent"}`} />
              <div className={`h-full ${step >= 2 ? "bg-rosebrand-500" : "bg-transparent"}`} />
              <div className={`h-full ${step >= 3 ? "bg-rosebrand-500" : "bg-transparent"}`} />
              <div className={`h-full ${step >= 4 ? "bg-rosebrand-500" : "bg-transparent"}`} />
              <div className={`h-full ${step >= 5 ? "bg-rosebrand-500" : "bg-transparent"}`} />
            </div>
          </div>

          {/* STEP 1: KELAS & BIODATA SISWA */}
          {step === 1 && (
            <div className="grid gap-5">
              <h3 className="text-lg font-black text-zinc-900 flex items-center gap-2">
                <School size={20} className="text-rosebrand-600" />
                Pilihan Kelas & Biodata Calon Siswa
              </h3>

              <div className="grid gap-2">
                <label className="text-xs font-extrabold text-zinc-700">Saat ini Siswa berada di kelas berapa? *</label>
                <div className="grid gap-2 sm:grid-cols-3">
                  {[
                    "Kelas 9 SMP/Sederajat (Tahun Pelajaran 2027/2028)",
                    "Kelas 8 SMP/Sederajat (Tahun Pelajaran 2028/2029)",
                    "Kelas 7 SMP/Sederajat (Tahun Pelajaran 2029/2030)"
                  ].map((item) => (
                    <label
                      key={item}
                      className={`flex cursor-pointer items-center gap-3 rounded-[8px] border p-3 text-xs font-bold transition ${
                        form.classGrade === item
                          ? "border-rosebrand-500 bg-rosebrand-50/50 text-rosebrand-700"
                          : "border-zinc-200 hover:bg-zinc-50 text-zinc-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="classGrade"
                        value={item}
                        checked={form.classGrade === item}
                        onChange={(e) => setForm({ ...form, classGrade: e.target.value })}
                        className="text-rosebrand-600 focus:ring-rosebrand-500"
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <label className="text-xs font-extrabold text-zinc-700">Nama Lengkap Siswa *</label>
                  <input
                    type="text"
                    required
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    placeholder="Sesuai akta kelahiran"
                    className="h-11 rounded-[8px] border border-zinc-200 bg-zinc-50/50 px-3.5 text-sm font-semibold outline-none focus:border-rosebrand-500 focus:bg-white"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs font-extrabold text-zinc-700">NIK Calon Siswa (16 Digit) *</label>
                  <input
                    type="text"
                    required
                    maxLength={16}
                    value={form.nik}
                    onChange={(e) => setForm({ ...form, nik: e.target.value.replace(/\D/g, "") })}
                    placeholder="Contoh: 180102..."
                    className="h-11 rounded-[8px] border border-zinc-200 bg-zinc-50/50 px-3.5 text-sm font-semibold outline-none focus:border-rosebrand-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="grid gap-1.5">
                  <label className="text-xs font-extrabold text-zinc-700">NISN (10 Digit) *</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={form.nisn}
                    onChange={(e) => setForm({ ...form, nisn: e.target.value.replace(/\D/g, "") })}
                    placeholder="Contoh: 0081234567"
                    className="h-11 rounded-[8px] border border-zinc-200 bg-zinc-50/50 px-3.5 text-sm font-semibold outline-none focus:border-rosebrand-500 focus:bg-white"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs font-extrabold text-zinc-700">Jenis Kelamin *</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className="h-11 rounded-[8px] border border-zinc-200 bg-zinc-50/50 px-3.5 text-sm font-semibold outline-none focus:border-rosebrand-500 focus:bg-white"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs font-extrabold text-zinc-700">Agama *</label>
                  <select
                    value={form.religion}
                    onChange={(e) => setForm({ ...form, religion: e.target.value })}
                    className="h-11 rounded-[8px] border border-zinc-200 bg-zinc-50/50 px-3.5 text-sm font-semibold outline-none focus:border-rosebrand-500 focus:bg-white"
                  >
                    {RELIGIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="grid gap-1.5">
                  <label className="text-xs font-extrabold text-zinc-700">Tanggal Lahir Siswa *</label>
                  <input
                    type="date"
                    required
                    value={form.birthDate}
                    onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                    className="h-11 rounded-[8px] border border-zinc-200 bg-zinc-50/50 px-3.5 text-sm font-semibold outline-none focus:border-rosebrand-500 focus:bg-white"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs font-extrabold text-zinc-700">Nomor WhatsApp Siswa *</label>
                  <input
                    type="tel"
                    required
                    value={form.whatsappNumber}
                    onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
                    placeholder="08xxxxxxxxxx"
                    className="h-11 rounded-[8px] border border-zinc-200 bg-zinc-50/50 px-3.5 text-sm font-semibold outline-none focus:border-rosebrand-500 focus:bg-white"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs font-extrabold text-zinc-700">Alamat Email Aktif *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="nama@email.com"
                    className="h-11 rounded-[8px] border border-zinc-200 bg-zinc-50/50 px-3.5 text-sm font-semibold outline-none focus:border-rosebrand-500 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: ALAMAT TEMPAT TINGGAL */}
          {step === 2 && (
            <div className="grid gap-5">
              <h3 className="text-lg font-black text-zinc-900 flex items-center gap-2">
                <MapPin size={20} className="text-rosebrand-600" />
                Alamat Tempat Tinggal
              </h3>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="grid gap-1.5">
                  <label className="text-xs font-extrabold text-zinc-700">Provinsi *</label>
                  <select
                    value={form.province}
                    onChange={(e) => setForm({ ...form, province: e.target.value })}
                    className="h-11 rounded-[8px] border border-zinc-200 bg-zinc-50/50 px-3.5 text-sm font-semibold outline-none focus:border-rosebrand-500 focus:bg-white"
                  >
                    {PROVINCES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs font-extrabold text-zinc-700">Kabupaten / Kota *</label>
                  <input
                    type="text"
                    required
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="Contoh: Pringsewu / Bandar Lampung"
                    className="h-11 rounded-[8px] border border-zinc-200 bg-zinc-50/50 px-3.5 text-sm font-semibold outline-none focus:border-rosebrand-500 focus:bg-white"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs font-extrabold text-zinc-700">Kecamatan *</label>
                  <input
                    type="text"
                    required
                    value={form.district}
                    onChange={(e) => setForm({ ...form, district: e.target.value })}
                    placeholder="Contoh: Gadingrejo"
                    className="h-11 rounded-[8px] border border-zinc-200 bg-zinc-50/50 px-3.5 text-sm font-semibold outline-none focus:border-rosebrand-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <label className="text-xs font-extrabold text-zinc-700">Alamat Lengkap Tempat Tinggal Sekarang *</label>
                <textarea
                  required
                  rows={3}
                  value={form.currentAddress}
                  onChange={(e) => setForm({ ...form, currentAddress: e.target.value })}
                  placeholder="Nama jalan, RT/RW, Dusun/Kelurahan, Kode Pos..."
                  className="rounded-[8px] border border-zinc-200 bg-zinc-50/50 p-3.5 text-sm font-semibold outline-none focus:border-rosebrand-500 focus:bg-white"
                />
              </div>
            </div>
          )}

          {/* STEP 3: INFORMASI AKADEMIK & PILIHAN JURUSAN */}
          {step === 3 && (
            <div className="grid gap-5">
              <h3 className="text-lg font-black text-zinc-900 flex items-center gap-2">
                <School size={20} className="text-rosebrand-600" />
                Asal Sekolah & Pilihan Jurusan
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <label className="text-xs font-extrabold text-zinc-700">Asal Sekolah (SMP / MTs / Sederajat) *</label>
                  <input
                    type="text"
                    required
                    value={form.previousSchool}
                    onChange={(e) => setForm({ ...form, previousSchool: e.target.value })}
                    placeholder="Contoh: SMP Negeri 1 Pringsewu"
                    className="h-11 rounded-[8px] border border-zinc-200 bg-zinc-50/50 px-3.5 text-sm font-semibold outline-none focus:border-rosebrand-500 focus:bg-white"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs font-extrabold text-zinc-700">Alamat Lengkap Sekolah Asal *</label>
                  <input
                    type="text"
                    required
                    value={form.previousSchoolAddress}
                    onChange={(e) => setForm({ ...form, previousSchoolAddress: e.target.value })}
                    placeholder="Kota / Kabupaten sekolah asal"
                    className="h-11 rounded-[8px] border border-zinc-200 bg-zinc-50/50 px-3.5 text-sm font-semibold outline-none focus:border-rosebrand-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <label className="text-xs font-extrabold text-zinc-700">Jenis Sekolah Asal *</label>
                  <select
                    value={form.schoolType}
                    onChange={(e) => setForm({ ...form, schoolType: e.target.value })}
                    className="h-11 rounded-[8px] border border-zinc-200 bg-zinc-50/50 px-3.5 text-sm font-semibold outline-none focus:border-rosebrand-500 focus:bg-white"
                  >
                    <option value="Sekolah Negeri">Sekolah Negeri</option>
                    <option value="Sekolah Swasta">Sekolah Swasta</option>
                  </select>
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs font-extrabold text-zinc-700">Naungan Kementerian *</label>
                  <select
                    value={form.ministry}
                    onChange={(e) => setForm({ ...form, ministry: e.target.value })}
                    className="h-11 rounded-[8px] border border-zinc-200 bg-zinc-50/50 px-3.5 text-sm font-semibold outline-none focus:border-rosebrand-500 focus:bg-white"
                  >
                    <option value="Kementerian Pendidikan (SMP)">Kementerian Pendidikan - SMP</option>
                    <option value="Kementerian Agama (MTs)">Kementerian Agama - MTs</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-xs font-extrabold text-zinc-700">Jurusan yang Dipilih di SMK Telkom Lampung *</label>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {majors.map((major) => (
                    <label
                      key={major.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-[8px] border p-3.5 transition ${
                        form.selectedMajorId === major.id.toString()
                          ? "border-rosebrand-500 bg-rosebrand-50/50"
                          : "border-zinc-200 hover:bg-zinc-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="selectedMajorId"
                        value={major.id}
                        checked={form.selectedMajorId === major.id.toString()}
                        onChange={(e) => setForm({ ...form, selectedMajorId: e.target.value })}
                        className="mt-0.5 text-rosebrand-600 focus:ring-rosebrand-500"
                      />
                      <div>
                        <p className="text-sm font-black text-zinc-900">{major.name}</p>
                        <p className="text-xs font-medium text-zinc-500 line-clamp-2">{major.summary}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid gap-1.5">
                <label className="text-xs font-extrabold text-zinc-700">Jalur Pendaftaran *</label>
                <select
                  value={form.registrationTrack}
                  onChange={(e) => setForm({ ...form, registrationTrack: e.target.value })}
                  className="h-11 rounded-[8px] border border-zinc-200 bg-zinc-50/50 px-3.5 text-sm font-semibold outline-none focus:border-rosebrand-500 focus:bg-white"
                >
                  {REGISTRATION_TRACKS.map((track) => (
                    <option key={track} value={track}>{track}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* STEP 4: DATA ORANG TUA (AYAH & IBU) */}
          {step === 4 && (
            <div className="grid gap-6">
              <h3 className="text-lg font-black text-zinc-900 flex items-center gap-2">
                <Users size={20} className="text-rosebrand-600" />
                Data Orang Tua / Wali
              </h3>

              {/* Data Ayah */}
              <div className="rounded-[8px] border border-zinc-200 bg-zinc-50/30 p-4 grid gap-4">
                <h4 className="text-sm font-black text-rosebrand-700 uppercase">Data Ayah / Wali</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <label className="text-xs font-extrabold text-zinc-700">Nama Lengkap Ayah/Wali *</label>
                    <input
                      type="text"
                      required
                      value={form.fatherName}
                      onChange={(e) => setForm({ ...form, fatherName: e.target.value })}
                      placeholder="Nama ayah kandung / wali"
                      className="h-11 rounded-[8px] border border-zinc-200 bg-white px-3.5 text-sm font-semibold outline-none focus:border-rosebrand-500"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <label className="text-xs font-extrabold text-zinc-700">Nomor Telepon / WhatsApp Ayah *</label>
                    <input
                      type="tel"
                      required
                      value={form.fatherPhone}
                      onChange={(e) => setForm({ ...form, fatherPhone: e.target.value })}
                      placeholder="08xxxxxxxxxx"
                      className="h-11 rounded-[8px] border border-zinc-200 bg-white px-3.5 text-sm font-semibold outline-none focus:border-rosebrand-500"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="grid gap-1.5">
                    <label className="text-xs font-extrabold text-zinc-700">Pendidikan Terakhir *</label>
                    <select
                      value={form.fatherEducation}
                      onChange={(e) => setForm({ ...form, fatherEducation: e.target.value })}
                      className="h-11 rounded-[8px] border border-zinc-200 bg-white px-3.5 text-sm font-semibold outline-none focus:border-rosebrand-500"
                    >
                      {PARENT_EDUCATIONS.map((edu) => (
                        <option key={edu} value={edu}>{edu}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-1.5">
                    <label className="text-xs font-extrabold text-zinc-700">Pekerjaan Ayah *</label>
                    <select
                      value={form.fatherOccupation}
                      onChange={(e) => setForm({ ...form, fatherOccupation: e.target.value })}
                      className="h-11 rounded-[8px] border border-zinc-200 bg-white px-3.5 text-sm font-semibold outline-none focus:border-rosebrand-500"
                    >
                      {FATHER_OCCUPATIONS.map((occ) => (
                        <option key={occ} value={occ}>{occ}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-1.5">
                    <label className="text-xs font-extrabold text-zinc-700">Tanggal Lahir Ayah *</label>
                    <input
                      type="date"
                      required
                      value={form.fatherBirthDate}
                      onChange={(e) => setForm({ ...form, fatherBirthDate: e.target.value })}
                      className="h-11 rounded-[8px] border border-zinc-200 bg-white px-3.5 text-sm font-semibold outline-none focus:border-rosebrand-500"
                    />
                  </div>
                </div>
              </div>

              {/* Data Ibu */}
              <div className="rounded-[8px] border border-zinc-200 bg-zinc-50/30 p-4 grid gap-4">
                <h4 className="text-sm font-black text-rosebrand-700 uppercase">Data Ibu / Wali</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <label className="text-xs font-extrabold text-zinc-700">Nama Lengkap Ibu/Wali *</label>
                    <input
                      type="text"
                      required
                      value={form.motherName}
                      onChange={(e) => setForm({ ...form, motherName: e.target.value })}
                      placeholder="Nama ibu kandung / wali"
                      className="h-11 rounded-[8px] border border-zinc-200 bg-white px-3.5 text-sm font-semibold outline-none focus:border-rosebrand-500"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <label className="text-xs font-extrabold text-zinc-700">Nomor Telepon / WhatsApp Ibu *</label>
                    <input
                      type="tel"
                      required
                      value={form.motherPhone}
                      onChange={(e) => setForm({ ...form, motherPhone: e.target.value })}
                      placeholder="08xxxxxxxxxx"
                      className="h-11 rounded-[8px] border border-zinc-200 bg-white px-3.5 text-sm font-semibold outline-none focus:border-rosebrand-500"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="grid gap-1.5">
                    <label className="text-xs font-extrabold text-zinc-700">Pendidikan Terakhir *</label>
                    <select
                      value={form.motherEducation}
                      onChange={(e) => setForm({ ...form, motherEducation: e.target.value })}
                      className="h-11 rounded-[8px] border border-zinc-200 bg-white px-3.5 text-sm font-semibold outline-none focus:border-rosebrand-500"
                    >
                      {PARENT_EDUCATIONS.map((edu) => (
                        <option key={edu} value={edu}>{edu}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-1.5">
                    <label className="text-xs font-extrabold text-zinc-700">Pekerjaan Ibu *</label>
                    <select
                      value={form.motherOccupation}
                      onChange={(e) => setForm({ ...form, motherOccupation: e.target.value })}
                      className="h-11 rounded-[8px] border border-zinc-200 bg-white px-3.5 text-sm font-semibold outline-none focus:border-rosebrand-500"
                    >
                      {MOTHER_OCCUPATIONS.map((occ) => (
                        <option key={occ} value={occ}>{occ}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-1.5">
                    <label className="text-xs font-extrabold text-zinc-700">Tanggal Lahir Ibu *</label>
                    <input
                      type="date"
                      required
                      value={form.motherBirthDate}
                      onChange={(e) => setForm({ ...form, motherBirthDate: e.target.value })}
                      className="h-11 rounded-[8px] border border-zinc-200 bg-white px-3.5 text-sm font-semibold outline-none focus:border-rosebrand-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: DOKUMEN & INFORMASI TAMBAHAN */}
          {step === 5 && (
            <div className="grid gap-5">
              <h3 className="text-lg font-black text-zinc-900 flex items-center gap-2">
                <FileCheck size={20} className="text-rosebrand-600" />
                Dokumen Pendukung & Informasi Tambahan
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <label className="text-xs font-extrabold text-zinc-700">Mengetahui Telkom Schools dari mana? *</label>
                  <select
                    value={form.infoSource}
                    onChange={(e) => setForm({ ...form, infoSource: e.target.value })}
                    className="h-11 rounded-[8px] border border-zinc-200 bg-zinc-50/50 px-3.5 text-sm font-semibold outline-none focus:border-rosebrand-500 focus:bg-white"
                  >
                    {INFO_SOURCES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs font-extrabold text-zinc-700">Nama Afiliator / Referensi (Guru BK / Keluarga / Teman)</label>
                  <input
                    type="text"
                    value={form.affiliatorName}
                    onChange={(e) => setForm({ ...form, affiliatorName: e.target.value })}
                    placeholder="Nama orang yang mereferensikan"
                    className="h-11 rounded-[8px] border border-zinc-200 bg-zinc-50/50 px-3.5 text-sm font-semibold outline-none focus:border-rosebrand-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <label className="text-xs font-extrabold text-zinc-700">Alasan Memilih SMK Telkom Lampung *</label>
                <textarea
                  required
                  rows={2}
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Ceritakan motivasi atau alasan Anda memilih bersekolah di SMK Telkom Lampung..."
                  className="rounded-[8px] border border-zinc-200 bg-zinc-50/50 p-3.5 text-sm font-semibold outline-none focus:border-rosebrand-500 focus:bg-white"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-xs font-extrabold text-zinc-700">
                  Apakah Calon Siswa Memilih SMK TELKOM Lampung sebagai Pilihan Utama / Pilihan Kedua? *
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    "Pilihan Utama",
                    "Pilihan Kedua - (Hanya Sebagai Batu Lompatan Menunggu Pengumuman Sekolah Lain)"
                  ].map((priority) => (
                    <label
                      key={priority}
                      className={`flex cursor-pointer items-center gap-3 rounded-[8px] border p-3 text-xs font-bold transition ${
                        form.choicePriority === priority
                          ? "border-rosebrand-500 bg-rosebrand-50/50 text-rosebrand-700"
                          : "border-zinc-200 hover:bg-zinc-50 text-zinc-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="choicePriority"
                        value={priority}
                        checked={form.choicePriority === priority}
                        onChange={(e) => setForm({ ...form, choicePriority: e.target.value })}
                        className="text-rosebrand-600 focus:ring-rosebrand-500"
                      />
                      <span>{priority}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid gap-1.5">
                <label className="text-xs font-extrabold text-zinc-700">Prestasi Akademik / Non-Akademik (Jika Ada)</label>
                <textarea
                  rows={2}
                  value={form.achievementsNote}
                  onChange={(e) => setForm({ ...form, achievementsNote: e.target.value })}
                  placeholder="Contoh: Juara 1 Olimpiade Matematika, Juara 2 Futsal tingkat Kabupaten..."
                  className="rounded-[8px] border border-zinc-200 bg-zinc-50/50 p-3.5 text-sm font-semibold outline-none focus:border-rosebrand-500 focus:bg-white"
                />
              </div>

              {/* Upload Berkas Section */}
              <div className="rounded-[8px] border border-zinc-200 bg-zinc-50/50 p-4 grid gap-4">
                <h4 className="text-xs font-black uppercase text-zinc-700">Upload Dokumen Berkas (Gambar / PDF maks 10MB)</h4>
                
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <label className="text-xs font-bold text-zinc-700">Kartu Keluarga (KK)</label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={(e) => handleFileUpload(e, "familyCardFile")}
                      className="text-xs text-zinc-600 file:mr-3 file:rounded-[6px] file:border-0 file:bg-zinc-800 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-zinc-900"
                    />
                    {form.familyCardFile && <p className="text-[11px] font-bold text-emerald-600">✓ KK terunggah</p>}
                  </div>

                  <div className="grid gap-1.5">
                    <label className="text-xs font-bold text-zinc-700">Akta Kelahiran</label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={(e) => handleFileUpload(e, "birthCertificateFile")}
                      className="text-xs text-zinc-600 file:mr-3 file:rounded-[6px] file:border-0 file:bg-zinc-800 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-zinc-900"
                    />
                    {form.birthCertificateFile && <p className="text-[11px] font-bold text-emerald-600">✓ Akta Kelahiran terunggah</p>}
                  </div>

                  <div className="grid gap-1.5">
                    <label className="text-xs font-bold text-zinc-700">Kartu Pelajar / Surat Ket. Siswa Aktif (Opsional)</label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={(e) => handleFileUpload(e, "studentCardFile")}
                      className="text-xs text-zinc-600 file:mr-3 file:rounded-[6px] file:border-0 file:bg-zinc-800 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-zinc-900"
                    />
                    {form.studentCardFile && <p className="text-[11px] font-bold text-emerald-600">✓ Kartu Pelajar terunggah</p>}
                  </div>

                  <div className="grid gap-1.5">
                    <label className="text-xs font-bold text-zinc-700">Sertifikat Prestasi (Opsional, PDF)</label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={(e) => handleFileUpload(e, "achievementCertificateFile")}
                      className="text-xs text-zinc-600 file:mr-3 file:rounded-[6px] file:border-0 file:bg-zinc-800 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-zinc-900"
                    />
                    {form.achievementCertificateFile && <p className="text-[11px] font-bold text-emerald-600">✓ Sertifikat terunggah</p>}
                  </div>
                </div>

                {uploadingField && (
                  <p className="text-xs font-bold text-rosebrand-600 flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" /> Mengunggah dokumen...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between border-t border-zinc-100 pt-5">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="inline-flex h-11 items-center gap-2 rounded-[8px] border border-zinc-200 px-5 text-xs font-bold text-zinc-700 hover:bg-zinc-50"
              >
                <ArrowLeft size={16} /> Sebelumnya
              </button>
            ) : (
              <div />
            )}

            {step < 5 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="inline-flex h-11 items-center gap-2 rounded-[8px] bg-zinc-900 px-6 text-xs font-bold text-white transition hover:bg-zinc-800"
              >
                Lanjutkan <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-11 items-center gap-2 rounded-[8px] bg-rosebrand-500 px-7 text-xs font-black text-white shadow-sm transition hover:bg-rosebrand-600 disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Kirim Formulir Pendaftaran
              </button>
            )}
          </div>
        </form>
      )}

      {/* CABANG 2: KONFIRMASI PEMBAYARAN */}
      {activeMenu === "konfirmasi" && (
        <form onSubmit={onSubmitPayment} className="grid gap-5 rounded-[12px] border border-zinc-200 bg-white p-5 shadow-sm md:p-8">
          <div>
            <h3 className="text-lg font-black text-zinc-900 flex items-center gap-2">
              <CreditCard size={20} className="text-rosebrand-600" />
              Konfirmasi Pembayaran Biaya SPMB
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              Kirimkan bukti transfer pembayaran daftar ulang atau cicilan biaya pendidikan Anda di sini.
            </p>
          </div>

          {paymentSuccess ? (
            <div className="rounded-[8px] border border-emerald-200 bg-emerald-50 p-6 text-center">
              <CheckCircle2 size={36} className="mx-auto text-emerald-600" />
              <h4 className="mt-3 text-base font-black text-emerald-900">Konfirmasi Pembayaran Terkirim!</h4>
              <p className="mt-1 text-xs text-emerald-700">
                Panitia SPMB akan segera memvalidasi bukti pembayaran Anda dalam waktu 1x24 jam kerja.
              </p>
              <button
                type="button"
                onClick={() => {
                  setPaymentSuccess(false);
                  setPaymentForm({ registrationNumber: "", studentName: "", batch: "INDEN", amount: "", proofFile: "", notes: "" });
                }}
                className="mt-4 rounded-[6px] bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
              >
                Kirim Konfirmasi Lainnya
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="grid gap-1.5">
                <label className="text-xs font-extrabold text-zinc-700">Pilihan BATCH Pembayaran *</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {BATCH_OPTIONS.map((b) => (
                    <label
                      key={b}
                      className={`flex cursor-pointer items-center justify-center gap-2 rounded-[8px] border p-3 text-xs font-bold transition ${
                        paymentForm.batch === b
                          ? "border-rosebrand-500 bg-rosebrand-50 text-rosebrand-700"
                          : "border-zinc-200 hover:bg-zinc-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="batch"
                        value={b}
                        checked={paymentForm.batch === b}
                        onChange={(e) => setPaymentForm({ ...paymentForm, batch: e.target.value })}
                        className="text-rosebrand-600"
                      />
                      {b}
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <label className="text-xs font-extrabold text-zinc-700">Nomor Pendaftaran / VA Siswa *</label>
                  <input
                    type="text"
                    required
                    value={paymentForm.registrationNumber}
                    onChange={(e) => setPaymentForm({ ...paymentForm, registrationNumber: e.target.value })}
                    placeholder="Contoh: SPMB-2026..."
                    className="h-11 rounded-[8px] border border-zinc-200 bg-zinc-50/50 px-3.5 text-sm font-semibold outline-none focus:border-rosebrand-500 focus:bg-white"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs font-extrabold text-zinc-700">Nama Lengkap Siswa *</label>
                  <input
                    type="text"
                    required
                    value={paymentForm.studentName}
                    onChange={(e) => setPaymentForm({ ...paymentForm, studentName: e.target.value })}
                    placeholder="Nama calon murid"
                    className="h-11 rounded-[8px] border border-zinc-200 bg-zinc-50/50 px-3.5 text-sm font-semibold outline-none focus:border-rosebrand-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <label className="text-xs font-extrabold text-zinc-700">Nominal Transfer (Rp) *</label>
                  <input
                    type="text"
                    required
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value.replace(/\D/g, "") })}
                    placeholder="Contoh: 5000000"
                    className="h-11 rounded-[8px] border border-zinc-200 bg-zinc-50/50 px-3.5 text-sm font-semibold outline-none focus:border-rosebrand-500 focus:bg-white"
                  />
                  <p className="text-[11px] text-zinc-400">Contoh: jika 5 juta ketik 5000000</p>
                </div>

                <div className="grid gap-1.5">
                  <label className="text-xs font-extrabold text-zinc-700">Upload Bukti Transfer (Gambar / PDF) *</label>
                  <input
                    type="file"
                    required
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={(e) => handleFileUpload(e, "proofFile")}
                    className="text-xs text-zinc-600 file:mr-3 file:rounded-[6px] file:border-0 file:bg-zinc-800 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-zinc-900"
                  />
                  {paymentForm.proofFile && <p className="text-[11px] font-bold text-emerald-600">✓ Bukti transfer siap dikirim</p>}
                </div>
              </div>

              <div className="grid gap-1.5">
                <label className="text-xs font-extrabold text-zinc-700">Catatan Tambahan (Opsional)</label>
                <textarea
                  rows={2}
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  placeholder="Misal: Pembayaran cicilan tahap 1 atas nama..."
                  className="rounded-[8px] border border-zinc-200 bg-zinc-50/50 p-3.5 text-sm font-semibold outline-none focus:border-rosebrand-500 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !paymentForm.proofFile}
                className="mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-rosebrand-500 px-6 text-xs font-black text-white transition hover:bg-rosebrand-600 disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Kirim Konfirmasi Pembayaran
              </button>
            </div>
          )}
        </form>
      )}

      {/* CABANG 3: UPLOAD BERKAS PENDUKUNG SUSULAN */}
      {activeMenu === "upload-berkas" && (
        <form onSubmit={onSubmitSupplementaryDoc} className="grid gap-5 rounded-[12px] border border-zinc-200 bg-white p-5 shadow-sm md:p-8">
          <div>
            <h3 className="text-lg font-black text-zinc-900 flex items-center gap-2">
              <FileText size={20} className="text-rosebrand-600" />
              Upload Berkas Pendukung Susulan
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              Khusus bagi siswa yang sudah terdaftar dan ingin melengkapi berkas susulan.
            </p>
          </div>

          {docSuccess ? (
            <div className="rounded-[8px] border border-emerald-200 bg-emerald-50 p-6 text-center">
              <CheckCircle2 size={36} className="mx-auto text-emerald-600" />
              <h4 className="mt-3 text-base font-black text-emerald-900">Berkas Berhasil Terunggah!</h4>
              <p className="mt-1 text-xs text-emerald-700">
                Berkas susulan Anda telah tersimpan di sistem SPMB SMK Telkom Lampung.
              </p>
              <button
                type="button"
                onClick={() => {
                  setDocSuccess(false);
                  setDocForm({ registrationNumber: "", studentName: "", documentType: SUPPLEMENTARY_DOC_TYPES[0], fileUrl: "" });
                }}
                className="mt-4 rounded-[6px] bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
              >
                Upload Berkas Lain
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <label className="text-xs font-extrabold text-zinc-700">Nomor Pendaftaran / Virtual Account (VA) *</label>
                  <input
                    type="text"
                    required
                    value={docForm.registrationNumber}
                    onChange={(e) => setDocForm({ ...docForm, registrationNumber: e.target.value })}
                    placeholder="Contoh: SPMB-2026..."
                    className="h-11 rounded-[8px] border border-zinc-200 bg-zinc-50/50 px-3.5 text-sm font-semibold outline-none focus:border-rosebrand-500 focus:bg-white"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs font-extrabold text-zinc-700">Nama Lengkap Siswa *</label>
                  <input
                    type="text"
                    required
                    value={docForm.studentName}
                    onChange={(e) => setDocForm({ ...docForm, studentName: e.target.value })}
                    placeholder="Nama lengkap pendaftar"
                    className="h-11 rounded-[8px] border border-zinc-200 bg-zinc-50/50 px-3.5 text-sm font-semibold outline-none focus:border-rosebrand-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <label className="text-xs font-extrabold text-zinc-700">Jenis Berkas yang Diunggah *</label>
                <select
                  value={docForm.documentType}
                  onChange={(e) => setDocForm({ ...docForm, documentType: e.target.value })}
                  className="h-11 rounded-[8px] border border-zinc-200 bg-zinc-50/50 px-3.5 text-sm font-semibold outline-none focus:border-rosebrand-500 focus:bg-white"
                >
                  {SUPPLEMENTARY_DOC_TYPES.map((dt) => (
                    <option key={dt} value={dt}>{dt}</option>
                  ))}
                </select>
              </div>

              <div className="grid gap-1.5">
                <label className="text-xs font-extrabold text-zinc-700">File Berkas (PDF / Gambar maks 10MB) *</label>
                <input
                  type="file"
                  required
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={(e) => handleFileUpload(e, "suppDoc")}
                  className="text-xs text-zinc-600 file:mr-3 file:rounded-[6px] file:border-0 file:bg-zinc-800 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-zinc-900"
                />
                {docForm.fileUrl && <p className="text-[11px] font-bold text-emerald-600">✓ Berkas siap dikirim</p>}
              </div>

              <button
                type="submit"
                disabled={loading || !docForm.fileUrl}
                className="mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-rosebrand-500 px-6 text-xs font-black text-white transition hover:bg-rosebrand-600 disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                Unggah Berkas Pendukung
              </button>
            </div>
          )}
        </form>
      )}

      {/* CABANG 4: RINCIAN TOTAL PEMBAYARAN */}
      {activeMenu === "rincian" && (
        <div className="grid gap-5 rounded-[12px] border border-zinc-200 bg-white p-5 shadow-sm md:p-8">
          <div>
            <h3 className="text-lg font-black text-zinc-900 flex items-center gap-2">
              <HelpCircle size={20} className="text-rosebrand-600" />
              Rincian Total Pembayaran & Status Pendaftaran
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              Informasi rincian biaya pendidikan dan biaya daftar ulang siswa baru SMK Telkom Lampung.
            </p>
          </div>

          <div className="rounded-[8px] border border-amber-200 bg-amber-50/70 p-4 text-xs font-semibold text-amber-900 leading-relaxed">
            <strong>Catatan Penting:</strong> Rincian final total biaya pendidikan dapat diakses secara lengkap setelah calon siswa menyelesaikan tahapan ujian / tes seleksi masuk.
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[8px] border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-xs font-bold text-zinc-500 uppercase">Biaya Formulir</p>
              <p className="mt-1 text-xl font-black text-emerald-600">GRATIS</p>
              <p className="text-[11px] text-zinc-400 mt-1">Promo pendaftaran online hari ini</p>
            </div>
            <div className="rounded-[8px] border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-xs font-bold text-zinc-500 uppercase">Daftar Ulang Awal</p>
              <p className="mt-1 text-xl font-black text-zinc-900">Rp. 500.000</p>
              <p className="text-[11px] text-zinc-400 mt-1">Untuk booking kuota & seragam</p>
            </div>
            <div className="rounded-[8px] border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-xs font-bold text-zinc-500 uppercase">Skema Pelunasan</p>
              <p className="mt-1 text-xl font-black text-rosebrand-600">Bisa Dicicil</p>
              <p className="text-[11px] text-zinc-400 mt-1">Fleksibel hingga tahun ajaran aktif</p>
            </div>
          </div>

          <div className="rounded-[8px] border border-zinc-100 bg-zinc-50 p-4 text-xs text-zinc-600 leading-6">
            <p className="font-bold text-zinc-800">Langkah Konfirmasi Pembayaran:</p>
            <ol className="list-decimal pl-5 mt-1 space-y-1">
              <li>Lakukan transfer sesuai nomor rekening/VA resmi sekolah.</li>
              <li>Pilih menu <strong>"Konfirmasi Pembayaran"</strong> di atas.</li>
              <li>Pilih BATCH (Inden / Batch 1 / Batch 2 / Batch 3), masukkan nominal, dan unggah foto struk/bukti transfer.</li>
              <li>Panitia SPMB akan memverifikasi dan memperbarui status pendaftaran Anda.</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
