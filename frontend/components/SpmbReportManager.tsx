"use client";

import { useMemo, useState } from "react";
import {
  Download,
  Printer,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  CreditCard,
  Users,
  ExternalLink,
  X,
  AlertCircle,
  FileDown
} from "lucide-react";
import { printSpmbCardPdf } from "@/lib/spmb-card";
import { normalizeImageUrl } from "@/lib/image-url";
import { API_URL } from "@/lib/api";
import { getCookie } from "@/lib/auth-client";
import type { SpmbPaymentConfirmation, SpmbRegistration, SpmbSupplementaryDocument } from "@/types/content";

type Props = {
  items: SpmbRegistration[];
  paymentConfirmations?: SpmbPaymentConfirmation[];
  supplementaryDocuments?: SpmbSupplementaryDocument[];
};

export function SpmbReportManager({
  items: initialItems,
  paymentConfirmations: initialPayments = [],
  supplementaryDocuments: initialDocs = []
}: Props) {
  const [activeTab, setActiveTab] = useState<"registrations" | "payments" | "documents">("registrations");
  const [items] = useState<SpmbRegistration[]>(initialItems);
  const [payments, setPayments] = useState<SpmbPaymentConfirmation[]>(initialPayments);
  const [docs] = useState<SpmbSupplementaryDocument[]>(initialDocs);

  const [query, setQuery] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<"all" | "pending" | "verified" | "rejected">("all");
  const [selectedStudent, setSelectedStudent] = useState<SpmbRegistration | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Filter Registrations
  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) =>
      [
        item.registrationNumber,
        item.fullName,
        item.nik,
        item.nisn,
        item.whatsappNumber,
        item.previousSchool,
        item.selectedMajorName,
        item.academicYear,
        item.fatherName,
        item.motherName,
        item.affiliatorName
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    );
  }, [items, query]);

  // Filter Payments
  const filteredPayments = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return payments.filter((pay) => {
      const matchQuery =
        !normalized ||
        [pay.registrationNumber, pay.studentName, pay.batch]
          .join(" ")
          .toLowerCase()
          .includes(normalized);
      const matchStatus = paymentStatusFilter === "all" || pay.status === paymentStatusFilter;
      return matchQuery && matchStatus;
    });
  }, [payments, query, paymentStatusFilter]);

  // Filter Supplementary Docs
  const filteredDocs = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return docs;
    return docs.filter((doc) =>
      [doc.registrationNumber, doc.studentName, doc.documentType]
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    );
  }, [docs, query]);

  const pendingPaymentsCount = useMemo(() => {
    return payments.filter((p) => p.status === "pending").length;
  }, [payments]);

  // Update payment status
  async function updatePaymentStatus(id: number, status: "verified" | "rejected") {
    let notes = "";
    if (status === "rejected") {
      const input = window.prompt("Masukkan alasan penolakan bukti pembayaran (opsional):");
      if (input === null) return; // cancelled
      notes = input;
    }

    setUpdatingId(id);
    setNotice(null);

    try {
      const res = await fetch(`${API_URL}/admin/spmb/payment-confirmations/${id}/status`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCookie("csrf_token")
        },
        body: JSON.stringify({ status, notes })
      });

      if (!res.ok) {
        throw new Error("Gagal memperbarui status pembayaran.");
      }

      setPayments((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status, notes: notes || p.notes } : p))
      );
      setNotice({
        type: "success",
        message: `Pembayaran berhasil ditandai sebagai "${status === "verified" ? "Terverifikasi" : "Ditolak"}".`
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      setNotice({ type: "error", message: errorMsg });
    } finally {
      setUpdatingId(null);
    }
  }

  // Export CSV with all 38+ Google Form fields
  function downloadCsv() {
    const header = [
      "No Pendaftaran",
      "Tahun Ajaran",
      "Kelas / Jenjang",
      "Jalur Pendaftaran",
      "Nama Lengkap",
      "NIK",
      "NISN",
      "Jenis Kelamin",
      "Agama",
      "Tanggal Lahir",
      "No WhatsApp",
      "Email",
      "Provinsi",
      "Kabupaten / Kota",
      "Kecamatan",
      "Alamat Lengkap",
      "Asal Sekolah",
      "Naungan Sekolah",
      "Tipe Sekolah",
      "Alamat Sekolah",
      "Pilihan Jurusan",
      "Nama Ayah",
      "Pendidikan Ayah",
      "Pekerjaan Ayah",
      "Tgl Lahir Ayah",
      "No HP Ayah",
      "Nama Ibu",
      "Pendidikan Ibu",
      "Pekerjaan Ibu",
      "Tgl Lahir Ibu",
      "No HP Ibu",
      "Sumber Informasi",
      "Nama Afiliator",
      "Alasan Memilih",
      "Prioritas Pilihan",
      "Catatan Prestasi",
      "File Kartu Pelajar",
      "File Kartu Keluarga",
      "File Akta Kelahiran",
      "File Sertifikat Prestasi",
      "Waktu Mendaftar"
    ];

    const rows = filteredItems.map((item) => [
      item.registrationNumber,
      item.academicYear,
      item.classGrade,
      item.registrationTrack,
      item.fullName,
      item.nik,
      item.nisn,
      item.gender,
      item.religion,
      item.birthDate,
      item.whatsappNumber,
      item.email,
      item.province,
      item.city,
      item.district,
      item.currentAddress,
      item.previousSchool,
      item.ministry,
      item.schoolType,
      item.previousSchoolAddress,
      item.selectedMajorName,
      item.fatherName,
      item.fatherEducation,
      item.fatherOccupation,
      item.fatherBirthDate,
      item.fatherPhone,
      item.motherName,
      item.motherEducation,
      item.motherOccupation,
      item.motherBirthDate,
      item.motherPhone,
      item.infoSource,
      item.affiliatorName,
      item.reason,
      item.choicePriority,
      item.achievementsNote,
      item.studentCardFile ? normalizeImageUrl(item.studentCardFile) : "",
      item.familyCardFile ? normalizeImageUrl(item.familyCardFile) : "",
      item.birthCertificateFile ? normalizeImageUrl(item.birthCertificateFile) : "",
      item.achievementCertificateFile ? normalizeImageUrl(item.achievementCertificateFile) : "",
      item.createdAt
    ]);

    const csvContent =
      "\uFEFF" +
      [header, ...rows]
        .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
        .join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `report-spmb-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  return (
    <div className="grid gap-6">
      {/* Header Banner */}
      <section className="grid gap-4 rounded-[8px] bg-white p-6 shadow-sm lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-rosebrand-600">Sistem SPMB Terpadu</p>
          <h1 className="mt-1 text-2xl font-black text-zinc-950 sm:text-3xl">Penerimaan Murid Baru</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-zinc-500">
            Kelola data registrasi calon siswa, verifikasi bukti konfirmasi pembayaran, dan periksa berkas susulan yang diunggah.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {activeTab === "registrations" && (
            <button
              type="button"
              onClick={downloadCsv}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-zinc-950 px-5 text-sm font-extrabold text-white shadow-sm transition-colors hover:bg-rosebrand-600"
            >
              <Download size={17} aria-hidden />
              Download CSV Lengkap
            </button>
          )}
        </div>
      </section>

      {notice && (
        <div
          className={`flex items-center justify-between rounded-[8px] p-4 text-sm font-bold ${
            notice.type === "success" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertCircle size={18} />
            <span>{notice.message}</span>
          </div>
          <button type="button" onClick={() => setNotice(null)} className="text-zinc-500 hover:text-zinc-800">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200">
        <button
          type="button"
          onClick={() => {
            setActiveTab("registrations");
            setQuery("");
          }}
          className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-black transition-colors ${
            activeTab === "registrations"
              ? "border-rosebrand-600 text-rosebrand-600"
              : "border-transparent text-zinc-500 hover:text-zinc-900"
          }`}
        >
          <Users size={17} />
          Pendaftar Baru
          <span className="ml-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-black text-zinc-700">
            {items.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("payments");
            setQuery("");
          }}
          className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-black transition-colors ${
            activeTab === "payments"
              ? "border-rosebrand-600 text-rosebrand-600"
              : "border-transparent text-zinc-500 hover:text-zinc-900"
          }`}
        >
          <CreditCard size={17} />
          Konfirmasi Pembayaran
          {pendingPaymentsCount > 0 ? (
            <span className="ml-1 rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-black text-white">
              {pendingPaymentsCount} pending
            </span>
          ) : (
            <span className="ml-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-black text-zinc-700">
              {payments.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("documents");
            setQuery("");
          }}
          className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-black transition-colors ${
            activeTab === "documents"
              ? "border-rosebrand-600 text-rosebrand-600"
              : "border-transparent text-zinc-500 hover:text-zinc-900"
          }`}
        >
          <FileText size={17} />
          Berkas Susulan
          <span className="ml-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-black text-zinc-700">
            {docs.length}
          </span>
        </button>
      </div>

      {/* Main Section */}
      <section className="rounded-[8px] bg-white p-5 shadow-sm">
        {/* Search & Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" aria-hidden />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={
                activeTab === "registrations"
                  ? "Cari nama, No. Reg, NISN, NIK, asal sekolah, orang tua, afiliator..."
                  : activeTab === "payments"
                  ? "Cari nomor pendaftaran, nama siswa, gelombang..."
                  : "Cari nomor pendaftaran, nama siswa, jenis berkas..."
              }
              className="h-11 w-full rounded-[8px] border border-zinc-200 pl-11 pr-4 text-sm font-semibold outline-none focus:border-rosebrand-500"
            />
          </label>

          {activeTab === "payments" && (
            <div className="flex items-center gap-2">
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value as any)}
                className="h-11 rounded-[8px] border border-zinc-200 px-4 text-sm font-bold text-zinc-700 outline-none focus:border-rosebrand-500"
              >
                <option value="all">Semua Status</option>
                <option value="pending">Menunggu Verifikasi (Pending)</option>
                <option value="verified">Terverifikasi</option>
                <option value="rejected">Ditolak</option>
              </select>
            </div>
          )}
        </div>

        {/* TAB 1: REGISTRATIONS */}
        {activeTab === "registrations" && (
          <div className="mt-5 overflow-hidden rounded-[8px] border border-zinc-100">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="px-4 py-3.5 font-extrabold">Calon Siswa</th>
                    <th className="px-4 py-3.5 font-extrabold">Jurusan & Jalur</th>
                    <th className="px-4 py-3.5 font-extrabold">Asal Sekolah</th>
                    <th className="px-4 py-3.5 font-extrabold">Kontak & Domisili</th>
                    <th className="px-4 py-3.5 font-extrabold">Orang Tua</th>
                    <th className="px-4 py-3.5 font-extrabold">Afiliator / Info</th>
                    <th className="px-4 py-3.5 text-right font-extrabold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="align-top transition-colors hover:bg-zinc-50/70">
                      <td className="px-4 py-4">
                        <p className="font-black text-zinc-950">{item.fullName}</p>
                        <p className="mt-1 text-xs font-black text-rosebrand-600">{item.registrationNumber}</p>
                        <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500">
                          <span>NISN: {item.nisn || "-"}</span>
                          <span>•</span>
                          <span>NIK: {item.nik || "-"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-block rounded-full bg-rosebrand-50 px-2.5 py-0.5 text-xs font-black text-rosebrand-700">
                          {item.selectedMajorName}
                        </span>
                        <p className="mt-1.5 text-xs font-semibold text-zinc-600">Jalur: {item.registrationTrack || "Umum"}</p>
                        <p className="text-[11px] text-zinc-400">Kelas: {item.classGrade || "X"}</p>
                      </td>
                      <td className="px-4 py-4 font-semibold text-zinc-800">
                        <p className="font-bold">{item.previousSchool}</p>
                        <p className="mt-0.5 text-xs text-zinc-500">{item.schoolType} ({item.ministry})</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-bold text-zinc-900">{item.whatsappNumber}</p>
                        <p className="mt-1 line-clamp-2 max-w-xs text-xs font-medium text-zinc-500">
                          {item.currentAddress}, {item.city}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-xs font-semibold leading-5 text-zinc-600">
                        <p><span className="text-zinc-400">Ayah:</span> {item.fatherName || "-"}</p>
                        <p><span className="text-zinc-400">Ibu:</span> {item.motherName || "-"}</p>
                      </td>
                      <td className="px-4 py-4 text-xs">
                        <p className="font-bold text-zinc-800">{item.infoSource || "-"}</p>
                        {item.affiliatorName && (
                          <p className="mt-0.5 text-rosebrand-600">Afiliator: {item.affiliatorName}</p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedStudent(item)}
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[8px] bg-zinc-100 px-3 text-xs font-bold text-zinc-800 transition-colors hover:bg-zinc-200"
                            title="Lihat Detail Lengkap"
                          >
                            <Eye size={15} />
                            Detail
                          </button>
                          <button
                            type="button"
                            onClick={() => printSpmbCardPdf(item)}
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[8px] border border-zinc-200 px-3 text-xs font-bold text-zinc-700 transition-colors hover:bg-zinc-50"
                            title="Print Kartu Pendaftaran"
                          >
                            <Printer size={15} />
                            Kartu
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-sm font-bold text-zinc-500">
                        Belum ada data calon siswa yang cocok dengan filter pencarian.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: PAYMENT CONFIRMATIONS */}
        {activeTab === "payments" && (
          <div className="mt-5 overflow-hidden rounded-[8px] border border-zinc-100">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="px-4 py-3.5 font-extrabold">Siswa & No. Reg</th>
                    <th className="px-4 py-3.5 font-extrabold">Gelombang</th>
                    <th className="px-4 py-3.5 font-extrabold">Nominal Transfer</th>
                    <th className="px-4 py-3.5 font-extrabold">Bukti Pembayaran</th>
                    <th className="px-4 py-3.5 font-extrabold">Status & Catatan</th>
                    <th className="px-4 py-3.5 font-extrabold">Waktu Konfirmasi</th>
                    <th className="px-4 py-3.5 text-right font-extrabold">Aksi Verifikasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredPayments.map((pay) => {
                    const proofUrl = normalizeImageUrl(pay.proofFile);
                    return (
                      <tr key={pay.id} className="align-top transition-colors hover:bg-zinc-50/70">
                        <td className="px-4 py-4">
                          <p className="font-black text-zinc-950">{pay.studentName}</p>
                          <p className="mt-1 text-xs font-black text-rosebrand-600">{pay.registrationNumber}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-block rounded-full bg-zinc-100 px-3 py-1 text-xs font-extrabold text-zinc-800">
                            {pay.batch}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-black text-zinc-900">
                          {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
                            pay.amount || 0
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {proofUrl ? (
                            <button
                              type="button"
                              onClick={() => setPreviewImage(proofUrl)}
                              className="group inline-flex items-center gap-1.5 text-xs font-bold text-rosebrand-600 hover:underline"
                            >
                              <FileText size={15} />
                              Lihat Bukti
                              <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          ) : (
                            <span className="text-xs text-zinc-400">Tidak ada file</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {pay.status === "verified" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-extrabold text-emerald-700">
                              <CheckCircle2 size={13} />
                              Terverifikasi
                            </span>
                          ) : pay.status === "rejected" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-extrabold text-rose-700">
                              <XCircle size={13} />
                              Ditolak
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-extrabold text-amber-700">
                              <Clock size={13} />
                              Menunggu Verifikasi
                            </span>
                          )}
                          {pay.notes && <p className="mt-1 text-xs text-zinc-500 italic">Catatan: {pay.notes}</p>}
                        </td>
                        <td className="px-4 py-4 text-xs font-medium text-zinc-500">
                          {pay.createdAt ? new Date(pay.createdAt).toLocaleString("id-ID") : "-"}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {pay.status !== "verified" && (
                              <button
                                type="button"
                                disabled={updatingId === pay.id}
                                onClick={() => updatePaymentStatus(pay.id, "verified")}
                                className="inline-flex h-8 items-center justify-center gap-1 rounded-[6px] bg-emerald-600 px-2.5 text-xs font-extrabold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                              >
                                <CheckCircle2 size={14} />
                                Terima
                              </button>
                            )}
                            {pay.status !== "rejected" && (
                              <button
                                type="button"
                                disabled={updatingId === pay.id}
                                onClick={() => updatePaymentStatus(pay.id, "rejected")}
                                className="inline-flex h-8 items-center justify-center gap-1 rounded-[6px] border border-rose-200 bg-rose-50 px-2.5 text-xs font-extrabold text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-50"
                              >
                                <XCircle size={14} />
                                Tolak
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredPayments.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-sm font-bold text-zinc-500">
                        Belum ada data konfirmasi pembayaran.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: SUPPLEMENTARY DOCUMENTS */}
        {activeTab === "documents" && (
          <div className="mt-5 overflow-hidden rounded-[8px] border border-zinc-100">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="px-4 py-3.5 font-extrabold">Siswa & No. Reg</th>
                    <th className="px-4 py-3.5 font-extrabold">Jenis Dokumen</th>
                    <th className="px-4 py-3.5 font-extrabold">Berkas Dokumen</th>
                    <th className="px-4 py-3.5 font-extrabold">Waktu Upload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredDocs.map((doc) => {
                    const docUrl = normalizeImageUrl(doc.fileUrl);
                    return (
                      <tr key={doc.id} className="align-top transition-colors hover:bg-zinc-50/70">
                        <td className="px-4 py-4">
                          <p className="font-black text-zinc-950">{doc.studentName}</p>
                          <p className="mt-1 text-xs font-black text-rosebrand-600">{doc.registrationNumber}</p>
                        </td>
                        <td className="px-4 py-4 font-extrabold text-zinc-800">
                          <span className="inline-block rounded-full bg-zinc-100 px-3 py-1 text-xs font-extrabold text-zinc-800">
                            {doc.documentType}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          {docUrl ? (
                            <a
                              href={docUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-rosebrand-600 hover:underline"
                            >
                              <FileDown size={15} />
                              Unduh / Buka Berkas
                              <ExternalLink size={12} />
                            </a>
                          ) : (
                            <span className="text-xs text-zinc-400">Berkas tidak tersedia</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-xs font-medium text-zinc-500">
                          {doc.createdAt ? new Date(doc.createdAt).toLocaleString("id-ID") : "-"}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredDocs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-sm font-bold text-zinc-500">
                        Belum ada data berkas susulan yang diunggah.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* STUDENT DETAIL MODAL */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[12px] bg-white p-6 shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 -mx-6 -mt-6 flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
              <div>
                <span className="rounded-full bg-rosebrand-50 px-2.5 py-1 text-xs font-black text-rosebrand-700">
                  {selectedStudent.registrationNumber}
                </span>
                <h2 className="mt-1 text-xl font-black text-zinc-950">{selectedStudent.fullName}</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => printSpmbCardPdf(selectedStudent)}
                  className="inline-flex items-center gap-1.5 rounded-[8px] bg-zinc-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-rosebrand-600 transition-colors"
                >
                  <Printer size={15} />
                  Print Kartu
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="rounded-[8px] p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body: Grouped Sections */}
            <div className="mt-6 space-y-6">
              {/* Section 1: Data Diri */}
              <div className="rounded-[8px] border border-zinc-100 bg-zinc-50/50 p-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-rosebrand-600">Data Calon Siswa</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-[11px] font-bold text-zinc-400">Kelas / Jenjang</p>
                    <p className="text-sm font-black text-zinc-900">{selectedStudent.classGrade || "Kelas X"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-zinc-400">NIK Siswa</p>
                    <p className="text-sm font-bold text-zinc-800">{selectedStudent.nik || "-"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-zinc-400">NISN Siswa</p>
                    <p className="text-sm font-bold text-zinc-800">{selectedStudent.nisn || "-"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-zinc-400">Jenis Kelamin</p>
                    <p className="text-sm font-bold text-zinc-800">{selectedStudent.gender || "-"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-zinc-400">Agama</p>
                    <p className="text-sm font-bold text-zinc-800">{selectedStudent.religion || "-"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-zinc-400">Tanggal Lahir</p>
                    <p className="text-sm font-bold text-zinc-800">{selectedStudent.birthDate || "-"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-zinc-400">Nomor WhatsApp</p>
                    <p className="text-sm font-black text-rosebrand-600">{selectedStudent.whatsappNumber || "-"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-zinc-400">Email Siswa</p>
                    <p className="text-sm font-bold text-zinc-800">{selectedStudent.email || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Section 2: Alamat Domisili */}
              <div className="rounded-[8px] border border-zinc-100 bg-zinc-50/50 p-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-rosebrand-600">Alamat Lengkap Siswa</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-[11px] font-bold text-zinc-400">Provinsi</p>
                    <p className="text-sm font-bold text-zinc-800">{selectedStudent.province || "-"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-zinc-400">Kabupaten / Kota</p>
                    <p className="text-sm font-bold text-zinc-800">{selectedStudent.city || "-"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-zinc-400">Kecamatan</p>
                    <p className="text-sm font-bold text-zinc-800">{selectedStudent.district || "-"}</p>
                  </div>
                  <div className="sm:col-span-3">
                    <p className="text-[11px] font-bold text-zinc-400">Alamat Tempat Tinggal / RT / RW</p>
                    <p className="text-sm font-semibold text-zinc-800">{selectedStudent.currentAddress || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Section 3: Asal Sekolah & Jurusan */}
              <div className="rounded-[8px] border border-zinc-100 bg-zinc-50/50 p-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-rosebrand-600">Pendidikan Sebelumnya & Minat Jurusan</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="text-[11px] font-bold text-zinc-400">Nama Asal Sekolah</p>
                    <p className="text-sm font-black text-zinc-900">{selectedStudent.previousSchool || "-"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-zinc-400">Kementerian / Naungan</p>
                    <p className="text-sm font-bold text-zinc-800">{selectedStudent.ministry || "-"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-zinc-400">Tipe Sekolah</p>
                    <p className="text-sm font-bold text-zinc-800">{selectedStudent.schoolType || "-"}</p>
                  </div>
                  <div className="sm:col-span-3">
                    <p className="text-[11px] font-bold text-zinc-400">Alamat Asal Sekolah</p>
                    <p className="text-sm font-semibold text-zinc-800">{selectedStudent.previousSchoolAddress || "-"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-zinc-400">Jurusan Pilihan</p>
                    <p className="text-sm font-black text-rosebrand-700">{selectedStudent.selectedMajorName || "-"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-zinc-400">Jalur Pendaftaran</p>
                    <p className="text-sm font-bold text-zinc-800">{selectedStudent.registrationTrack || "Jalur Reguler"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-zinc-400">Prioritas Jurusan</p>
                    <p className="text-sm font-bold text-zinc-800">{selectedStudent.choicePriority || "Pilihan 1"}</p>
                  </div>
                </div>
              </div>

              {/* Section 4: Data Orang Tua */}
              <div className="rounded-[8px] border border-zinc-100 bg-zinc-50/50 p-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-rosebrand-600">Data Orang Tua / Wali</h3>
                <div className="mt-3 grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2 rounded-[6px] border border-zinc-200/70 bg-white p-3.5">
                    <p className="text-xs font-black text-zinc-900 border-b pb-1.5">Data Ayah Kandung</p>
                    <p className="text-xs"><span className="text-zinc-400 font-bold">Nama:</span> <strong className="text-zinc-800">{selectedStudent.fatherName || "-"}</strong></p>
                    <p className="text-xs"><span className="text-zinc-400 font-bold">Pendidikan:</span> <span className="text-zinc-700">{selectedStudent.fatherEducation || "-"}</span></p>
                    <p className="text-xs"><span className="text-zinc-400 font-bold">Pekerjaan:</span> <span className="text-zinc-700">{selectedStudent.fatherOccupation || "-"}</span></p>
                    <p className="text-xs"><span className="text-zinc-400 font-bold">Tgl Lahir:</span> <span className="text-zinc-700">{selectedStudent.fatherBirthDate || "-"}</span></p>
                    <p className="text-xs"><span className="text-zinc-400 font-bold">No WhatsApp / HP:</span> <span className="text-zinc-700">{selectedStudent.fatherPhone || "-"}</span></p>
                  </div>

                  <div className="space-y-2 rounded-[6px] border border-zinc-200/70 bg-white p-3.5">
                    <p className="text-xs font-black text-zinc-900 border-b pb-1.5">Data Ibu Kandung</p>
                    <p className="text-xs"><span className="text-zinc-400 font-bold">Nama:</span> <strong className="text-zinc-800">{selectedStudent.motherName || "-"}</strong></p>
                    <p className="text-xs"><span className="text-zinc-400 font-bold">Pendidikan:</span> <span className="text-zinc-700">{selectedStudent.motherEducation || "-"}</span></p>
                    <p className="text-xs"><span className="text-zinc-400 font-bold">Pekerjaan:</span> <span className="text-zinc-700">{selectedStudent.motherOccupation || "-"}</span></p>
                    <p className="text-xs"><span className="text-zinc-400 font-bold">Tgl Lahir:</span> <span className="text-zinc-700">{selectedStudent.motherBirthDate || "-"}</span></p>
                    <p className="text-xs"><span className="text-zinc-400 font-bold">No WhatsApp / HP:</span> <span className="text-zinc-700">{selectedStudent.motherPhone || "-"}</span></p>
                  </div>
                </div>
              </div>

              {/* Section 5: Dokumen Berkas */}
              <div className="rounded-[8px] border border-zinc-100 bg-zinc-50/50 p-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-rosebrand-600">Berkas Dokumen Lampiran</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-[6px] border border-zinc-200 bg-white p-3">
                    <p className="text-xs font-bold text-zinc-500">Kartu Pelajar / NISN</p>
                    {selectedStudent.studentCardFile ? (
                      <a
                        href={normalizeImageUrl(selectedStudent.studentCardFile)}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-black text-rosebrand-600 hover:underline"
                      >
                        <FileDown size={14} />
                        Buka Dokumen
                      </a>
                    ) : (
                      <p className="mt-2 text-xs text-zinc-400">Belum diunggah</p>
                    )}
                  </div>

                  <div className="rounded-[6px] border border-zinc-200 bg-white p-3">
                    <p className="text-xs font-bold text-zinc-500">Kartu Keluarga (KK)</p>
                    {selectedStudent.familyCardFile ? (
                      <a
                        href={normalizeImageUrl(selectedStudent.familyCardFile)}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-black text-rosebrand-600 hover:underline"
                      >
                        <FileDown size={14} />
                        Buka Dokumen
                      </a>
                    ) : (
                      <p className="mt-2 text-xs text-zinc-400">Belum diunggah</p>
                    )}
                  </div>

                  <div className="rounded-[6px] border border-zinc-200 bg-white p-3">
                    <p className="text-xs font-bold text-zinc-500">Akta Kelahiran</p>
                    {selectedStudent.birthCertificateFile ? (
                      <a
                        href={normalizeImageUrl(selectedStudent.birthCertificateFile)}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-black text-rosebrand-600 hover:underline"
                      >
                        <FileDown size={14} />
                        Buka Dokumen
                      </a>
                    ) : (
                      <p className="mt-2 text-xs text-zinc-400">Belum diunggah</p>
                    )}
                  </div>

                  <div className="rounded-[6px] border border-zinc-200 bg-white p-3">
                    <p className="text-xs font-bold text-zinc-500">Sertifikat Prestasi</p>
                    {selectedStudent.achievementCertificateFile ? (
                      <a
                        href={normalizeImageUrl(selectedStudent.achievementCertificateFile)}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-black text-rosebrand-600 hover:underline"
                      >
                        <FileDown size={14} />
                        Buka Dokumen
                      </a>
                    ) : (
                      <p className="mt-2 text-xs text-zinc-400">Belum diunggah</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 6: Info Tambahan & Kuesioner */}
              <div className="rounded-[8px] border border-zinc-100 bg-zinc-50/50 p-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-rosebrand-600">Kuesioner & Sumber Informasi</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-bold text-zinc-400">Sumber Informasi Sekolah</p>
                    <p className="text-sm font-bold text-zinc-800">{selectedStudent.infoSource || "-"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-zinc-400">Nama Afiliator / Perekomendasi</p>
                    <p className="text-sm font-bold text-zinc-800">{selectedStudent.affiliatorName || "-"}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-[11px] font-bold text-zinc-400">Alasan Memilih SMK Telkom Lampung</p>
                    <p className="text-sm font-medium text-zinc-700">{selectedStudent.reason || "-"}</p>
                  </div>
                  {selectedStudent.achievementsNote && (
                    <div className="sm:col-span-2">
                      <p className="text-[11px] font-bold text-zinc-400">Catatan Prestasi yang Pernah Diraih</p>
                      <p className="text-sm font-medium text-zinc-700">{selectedStudent.achievementsNote}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PROOF IMAGE PREVIEW MODAL */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] max-w-2xl overflow-hidden rounded-[12px] bg-white p-3 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-2 mb-3">
              <p className="text-sm font-black text-zinc-900">Bukti Pembayaran</p>
              <div className="flex items-center gap-2">
                <a
                  href={previewImage}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-[6px] bg-zinc-100 px-2.5 py-1 text-xs font-bold text-zinc-700 hover:bg-zinc-200"
                >
                  <ExternalLink size={13} />
                  Tab Baru
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="rounded-[6px] p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="max-h-[75vh] overflow-auto rounded-[8px] bg-zinc-100 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewImage} alt="Bukti Transfer" className="max-h-[70vh] w-auto object-contain rounded-[6px]" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
