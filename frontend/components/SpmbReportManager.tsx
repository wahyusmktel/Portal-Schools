"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Download,
  Printer,
  Search,
  Eye,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  CreditCard,
  Users,
  ExternalLink,
  X,
  AlertCircle,
  FileDown,
  BarChart3,
  TrendingUp,
  School,
  MapPin,
  Award,
  Maximize2,
  Minimize2,
  Share2,
  Sparkles,
  PieChart as PieChartIcon
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { printSpmbCardPdf, downloadSpmbCardPdf } from "@/lib/spmb-card";
import { normalizeImageUrl } from "@/lib/image-url";
import { API_URL } from "@/lib/api";
import { getCookie } from "@/lib/auth-client";
import type { SpmbPaymentConfirmation, SpmbRegistration, SpmbSupplementaryDocument } from "@/types/content";

type Props = {
  items: SpmbRegistration[];
  paymentConfirmations?: SpmbPaymentConfirmation[];
  supplementaryDocuments?: SpmbSupplementaryDocument[];
  academicYear?: string;
};

const CHART_COLORS = [
  "#e11d48", // Telkom Rose Red
  "#0284c7", // Sky Blue
  "#10b981", // Emerald Green
  "#f59e0b", // Amber Yellow
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#64748b", // Slate Grey
  "#14b8a6"  // Teal
];

export function SpmbReportManager({
  items: initialItems,
  paymentConfirmations: initialPayments = [],
  supplementaryDocuments: initialDocs = [],
  academicYear
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"analytics" | "registrations" | "payments" | "documents">("analytics");
  const [items, setItems] = useState<SpmbRegistration[]>(initialItems);
  const [payments, setPayments] = useState<SpmbPaymentConfirmation[]>(initialPayments);
  const [docs] = useState<SpmbSupplementaryDocument[]>(initialDocs);

  const [query, setQuery] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<"all" | "pending" | "verified" | "rejected">("all");
  const [selectedStudent, setSelectedStudent] = useState<SpmbRegistration | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isPresentationMode, setIsPresentationMode] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // -------------------------------------------------------------------
  // ANALYTICS & STATS CALCULATION (FOR KETUA SPMB)
  // -------------------------------------------------------------------
  const analytics = useMemo(() => {
    const total = items.length;

    // 1. Choice Priority (Pilihan Utama vs Pilihan Kedua)
    const primaryChoiceCount = items.filter((i) =>
      (i.choicePriority || "").toLowerCase().includes("utama")
    ).length;
    const secondaryChoiceCount = total - primaryChoiceCount;
    const primaryRate = total > 0 ? Math.round((primaryChoiceCount / total) * 100) : 0;

    // 2. Verified Payments Total
    const verifiedPayments = payments.filter((p) => p.status === "verified");
    const totalVerifiedAmount = verifiedPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const pendingPaymentsCount = payments.filter((p) => p.status === "pending").length;

    // 3. Majors Distribution
    const majorCounts: Record<string, number> = {};
    items.forEach((item) => {
      const m = item.selectedMajorName || "Lainnya";
      majorCounts[m] = (majorCounts[m] || 0) + 1;
    });
    const majorData = Object.entries(majorCounts).map(([name, value]) => ({
      name: name.replace("Teknik ", "T. ").replace("Rekayasa ", "R. "),
      fullName: name,
      count: value,
      percent: total > 0 ? Math.round((value / total) * 100) : 0
    }));

    // 4. Ministry & School Type (Kemdikbud vs Kemenag)
    let kemdikbudCount = 0;
    let kemenagCount = 0;
    let negeriCount = 0;
    let swastaCount = 0;

    items.forEach((item) => {
      const min = (item.ministry || "").toLowerCase();
      if (min.includes("agama") || min.includes("mts")) {
        kemenagCount += 1;
      } else {
        kemdikbudCount += 1;
      }

      const st = (item.schoolType || "").toLowerCase();
      if (st.includes("swasta")) {
        swastaCount += 1;
      } else {
        negeriCount += 1;
      }
    });

    const ministryData = [
      { name: "SMP (Kemdikbud)", value: kemdikbudCount },
      { name: "MTs (Kemenag)", value: kemenagCount }
    ];

    const schoolTypeData = [
      { name: "Sekolah Negeri", value: negeriCount },
      { name: "Sekolah Swasta", value: swastaCount }
    ];

    // 5. Top 10 Asal Sekolah (Feeder Schools)
    const schoolCounts: Record<string, number> = {};
    items.forEach((item) => {
      const s = (item.previousSchool || "").trim() || "Tidak Tercatat";
      schoolCounts[s] = (schoolCounts[s] || 0) + 1;
    });
    const topSchools = Object.entries(schoolCounts)
      .map(([school, count]) => ({ school, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // 6. Regional Distribution (Kabupaten/Kota)
    const regionCounts: Record<string, number> = {};
    items.forEach((item) => {
      const r = (item.city || "Lainnya").replace("Kabupaten ", "Kab. ").replace("Kota ", "Kota ");
      regionCounts[r] = (regionCounts[r] || 0) + 1;
    });
    const topRegions = Object.entries(regionCounts)
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // 7. Registration Tracks (Jalur Pendaftaran)
    const trackCounts: Record<string, number> = {};
    items.forEach((item) => {
      const t = item.registrationTrack || "Reguler";
      trackCounts[t] = (trackCounts[t] || 0) + 1;
    });
    const trackData = Object.entries(trackCounts).map(([name, value]) => ({ name, value }));

    // 8. Info Sources (Sumber Informasi)
    const infoCounts: Record<string, number> = {};
    items.forEach((item) => {
      const s = item.infoSource || "Lainnya";
      infoCounts[s] = (infoCounts[s] || 0) + 1;
    });
    const infoData = Object.entries(infoCounts)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // 9. Top Affiliators / Guru BK Leaderboard
    const affiliatorCounts: Record<string, number> = {};
    items.forEach((item) => {
      const af = (item.affiliatorName || "").trim();
      if (af && af !== "-" && af.toLowerCase() !== "tidak ada" && af.toLowerCase() !== "none") {
        affiliatorCounts[af] = (affiliatorCounts[af] || 0) + 1;
      }
    });
    const topAffiliators = Object.entries(affiliatorCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return {
      total,
      primaryChoiceCount,
      secondaryChoiceCount,
      primaryRate,
      totalVerifiedAmount,
      pendingPaymentsCount,
      majorData,
      ministryData,
      schoolTypeData,
      topSchools,
      topRegions,
      trackData,
      infoData,
      topAffiliators
    };
  }, [items, payments]);

  // -------------------------------------------------------------------
  // FILTERING REGISTRATIONS, PAYMENTS, DOCS
  // -------------------------------------------------------------------
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
        item.affiliatorName,
        item.city
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    );
  }, [items, query]);

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

  // Update payment status
  async function updatePaymentStatus(id: number, status: "verified" | "rejected") {
    let notes = "";
    if (status === "rejected") {
      const input = window.prompt("Masukkan alasan penolakan bukti pembayaran (opsional):");
      if (input === null) return;
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

  // Soft delete registration
  async function handleDeleteRegistration(item: SpmbRegistration) {
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus data calon siswa "${item.fullName}" (${item.registrationNumber})?\n\nData akan dihapus dari daftar aktif (soft delete) namun riwayat data tetap tersimpan aman di database.`
    );
    if (!confirmed) return;

    setDeletingId(item.id);
    setNotice(null);

    try {
      let res = await fetch(`${API_URL}/admin/spmb/registrations/${item.id}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCookie("csrf_token")
        }
      });

      if (res.status === 404 || res.status === 405) {
        // Fallback jika web server / proxy memblokir method HTTP DELETE
        res = await fetch(`${API_URL}/admin/spmb/registrations/${item.id}/delete`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": getCookie("csrf_token")
          }
        });
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 404) {
          throw new Error("Layanan backend belum diperbarui ke versi terbaru. Silakan git pull & restart service backend di server VPS.");
        }
        throw new Error(data.error || "Gagal menghapus data calon siswa.");
      }

      setItems((prev) => prev.filter((s) => s.id !== item.id));
      if (selectedStudent?.id === item.id) {
        setSelectedStudent(null);
      }
      setNotice({
        type: "success",
        message: `Data pendaftar "${item.fullName}" (${item.registrationNumber}) berhasil dihapus (soft delete).`
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus data.";
      setNotice({ type: "error", message: errorMsg });
    } finally {
      setDeletingId(null);
    }
  }

  // Export CSV
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
    <div className={`grid gap-6 ${isPresentationMode ? "p-4 bg-zinc-950 text-white min-h-screen" : ""}`}>
      {/* HEADER SECTION */}
      <section
        className={`grid gap-4 rounded-[12px] p-6 shadow-sm lg:grid-cols-[1fr_auto] lg:items-center ${
          isPresentationMode ? "bg-zinc-900 border border-zinc-800" : "bg-white border border-zinc-200"
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-rosebrand-500/10 px-2.5 py-0.5 text-xs font-black text-rosebrand-600">
              Manajemen PPDB & SPMB {academicYear ? `T.A. ${academicYear}` : ""}
            </span>
            {isPresentationMode && (
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-black text-emerald-400">
                Mode Presentasi Aktif
              </span>
            )}
          </div>
          <h1 className={`mt-2 text-2xl font-black sm:text-3xl ${isPresentationMode ? "text-white" : "text-zinc-950"}`}>
            Dashboard Analitik & Manajemen Pendaftaran Murid Baru
          </h1>
          <p className={`mt-1 text-sm font-semibold ${isPresentationMode ? "text-zinc-400" : "text-zinc-500"}`}>
            Alat analisis statistik komprehensif untuk Ketua SPMB, verifikasi pembayaran tiket masuk, dan pengelolaan dokumen pendaftar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setIsPresentationMode(!isPresentationMode)}
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-[8px] px-4 text-xs font-black transition-colors ${
              isPresentationMode
                ? "bg-rosebrand-600 text-white hover:bg-rosebrand-700"
                : "bg-zinc-100 text-zinc-800 hover:bg-zinc-200"
            }`}
          >
            {isPresentationMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            {isPresentationMode ? "Tutup Presentasi" : "Mode Presentasi"}
          </button>

          <button
            type="button"
            onClick={downloadCsv}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-zinc-950 px-4 text-xs font-black text-white hover:bg-rosebrand-600 transition-colors"
          >
            <Download size={16} />
            Download CSV Lengkap
          </button>
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

      {/* 4 TABS NAVIGATION */}
      <div className={`flex flex-wrap items-center gap-2 border-b ${isPresentationMode ? "border-zinc-800" : "border-zinc-200"}`}>
        <button
          type="button"
          onClick={() => setActiveTab("analytics")}
          className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-black transition-colors ${
            activeTab === "analytics"
              ? "border-rosebrand-600 text-rosebrand-600"
              : isPresentationMode
              ? "border-transparent text-zinc-400 hover:text-white"
              : "border-transparent text-zinc-500 hover:text-zinc-900"
          }`}
        >
          <BarChart3 size={18} />
          Analisis & Presentasi Ketua SPMB
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("registrations")}
          className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-black transition-colors ${
            activeTab === "registrations"
              ? "border-rosebrand-600 text-rosebrand-600"
              : isPresentationMode
              ? "border-transparent text-zinc-400 hover:text-white"
              : "border-transparent text-zinc-500 hover:text-zinc-900"
          }`}
        >
          <Users size={18} />
          Data Pendaftar PPDB
          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-black text-zinc-800">
            {items.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("payments")}
          className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-black transition-colors ${
            activeTab === "payments"
              ? "border-rosebrand-600 text-rosebrand-600"
              : isPresentationMode
              ? "border-transparent text-zinc-400 hover:text-white"
              : "border-transparent text-zinc-500 hover:text-zinc-900"
          }`}
        >
          <CreditCard size={18} />
          Konfirmasi Pembayaran
          {analytics.pendingPaymentsCount > 0 ? (
            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-black text-white">
              {analytics.pendingPaymentsCount} pending
            </span>
          ) : (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-black text-zinc-800">
              {payments.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("documents")}
          className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-black transition-colors ${
            activeTab === "documents"
              ? "border-rosebrand-600 text-rosebrand-600"
              : isPresentationMode
              ? "border-transparent text-zinc-400 hover:text-white"
              : "border-transparent text-zinc-500 hover:text-zinc-900"
          }`}
        >
          <FileText size={18} />
          Berkas Dokumen Susulan
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-black text-zinc-800">
            {docs.length}
          </span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: ANALISIS & PRESENTASI KETUA SPMB */}
      {/* ============================================================== */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* KPI 1 */}
            <div
              className={`rounded-[12px] p-5 shadow-sm border ${
                isPresentationMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-rosebrand-600">Total Pendaftar</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-rosebrand-50 text-rosebrand-600">
                  <Users size={18} />
                </div>
              </div>
              <p className={`mt-3 text-3xl font-black ${isPresentationMode ? "text-white" : "text-zinc-950"}`}>
                {analytics.total}
              </p>
              <p className="mt-1 text-xs font-semibold text-zinc-500">Calon siswa mengisi formulir lengkap</p>
            </div>

            {/* KPI 2 */}
            <div
              className={`rounded-[12px] p-5 shadow-sm border ${
                isPresentationMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-600">Komitmen Pilihan Utama</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-emerald-50 text-emerald-600">
                  <Award size={18} />
                </div>
              </div>
              <p className={`mt-3 text-3xl font-black ${isPresentationMode ? "text-white" : "text-zinc-950"}`}>
                {analytics.primaryRate}%
              </p>
              <p className="mt-1 text-xs font-semibold text-zinc-500">
                {analytics.primaryChoiceCount} dari {analytics.total} memilih prioritas utama
              </p>
            </div>

            {/* KPI 3 */}
            <div
              className={`rounded-[12px] p-5 shadow-sm border ${
                isPresentationMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-sky-600">Pembayaran Terverifikasi</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-sky-50 text-sky-600">
                  <CreditCard size={18} />
                </div>
              </div>
              <p className={`mt-3 text-2xl font-black ${isPresentationMode ? "text-white" : "text-zinc-950"}`}>
                {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
                  analytics.totalVerifiedAmount
                )}
              </p>
              <p className="mt-1 text-xs font-semibold text-amber-500">
                {analytics.pendingPaymentsCount} bukti menunggu verifikasi
              </p>
            </div>

            {/* KPI 4 */}
            <div
              className={`rounded-[12px] p-5 shadow-sm border ${
                isPresentationMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-purple-600">Mitra Sekolah & Afiliasi</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-purple-50 text-purple-600">
                  <School size={18} />
                </div>
              </div>
              <p className={`mt-3 text-3xl font-black ${isPresentationMode ? "text-white" : "text-zinc-950"}`}>
                {analytics.topSchools.length} Sekolah
              </p>
              <p className="mt-1 text-xs font-semibold text-zinc-500">
                {analytics.topAffiliators.length} Afiliator / Guru BK aktif
              </p>
            </div>
          </div>

          {/* Charts Row 1: Jurusan & Naungan */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Chart: Peminatan Jurusan */}
            <div
              className={`rounded-[12px] p-6 shadow-sm border ${
                isPresentationMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-base font-black ${isPresentationMode ? "text-white" : "text-zinc-950"}`}>
                    Distribusi Peminatan Jurusan
                  </h3>
                  <p className="text-xs text-zinc-500">Kompetensi keahlian yang paling banyak diminati calon siswa</p>
                </div>
                <BarChart3 size={20} className="text-rosebrand-600" />
              </div>

              <div className="mt-6 h-64 w-full">
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.majorData} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <XAxis type="number" stroke={isPresentationMode ? "#71717a" : "#a1a1aa"} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={110}
                        tick={{ fontSize: 11, fill: isPresentationMode ? "#e4e4e7" : "#3f3f46" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#18181b",
                          border: "none",
                          borderRadius: "8px",
                          color: "#fff",
                          fontSize: "12px"
                        }}
                      />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                        {analytics.majorData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-zinc-400">Memuat Grafik...</div>
                )}
              </div>
            </div>

            {/* Chart: Naungan Sekolah & Tipe Sekolah */}
            <div
              className={`rounded-[12px] p-6 shadow-sm border ${
                isPresentationMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-base font-black ${isPresentationMode ? "text-white" : "text-zinc-950"}`}>
                    Karakteristik Asal Sekolah
                  </h3>
                  <p className="text-xs text-zinc-500">Rasio Kementerian Naungan (SMP vs MTs) dan Status Sekolah</p>
                </div>
                <PieChartIcon size={20} className="text-sky-600" />
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 h-64">
                {/* Pie 1: Naungan */}
                <div className="flex flex-col items-center">
                  <p className="text-[11px] font-black uppercase tracking-wider text-zinc-500 mb-2">SMP vs MTs</p>
                  {mounted ? (
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie
                          data={analytics.ministryData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={65}
                          paddingAngle={3}
                        >
                          <Cell fill="#0284c7" />
                          <Cell fill="#10b981" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : null}
                  <div className="mt-2 text-center text-[11px] font-bold">
                    <span className="text-sky-600">SMP ({analytics.ministryData[0]?.value || 0})</span> •{" "}
                    <span className="text-emerald-600">MTs ({analytics.ministryData[1]?.value || 0})</span>
                  </div>
                </div>

                {/* Pie 2: Negeri vs Swasta */}
                <div className="flex flex-col items-center">
                  <p className="text-[11px] font-black uppercase tracking-wider text-zinc-500 mb-2">Negeri vs Swasta</p>
                  {mounted ? (
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie
                          data={analytics.schoolTypeData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={65}
                          paddingAngle={3}
                        >
                          <Cell fill="#e11d48" />
                          <Cell fill="#f59e0b" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : null}
                  <div className="mt-2 text-center text-[11px] font-bold">
                    <span className="text-rosebrand-600">Negeri ({analytics.schoolTypeData[0]?.value || 0})</span> •{" "}
                    <span className="text-amber-600">Swasta ({analytics.schoolTypeData[1]?.value || 0})</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row 2: Top Feeder Schools & Regional Distribution */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Top 8 Feeder Schools */}
            <div
              className={`rounded-[12px] p-6 shadow-sm border ${
                isPresentationMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-base font-black ${isPresentationMode ? "text-white" : "text-zinc-950"}`}>
                    Top 8 Sekolah Asal (Feeder Schools)
                  </h3>
                  <p className="text-xs text-zinc-500">Sekolah dengan jumlah pendaftar terbanyak ke SMK Telkom Lampung</p>
                </div>
                <School size={20} className="text-purple-600" />
              </div>

              <div className="mt-5 space-y-3">
                {analytics.topSchools.map((item, index) => {
                  const percent = analytics.total > 0 ? Math.round((item.count / analytics.total) * 100) : 0;
                  return (
                    <div key={item.school} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="flex items-center gap-2">
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ${
                              index === 0
                                ? "bg-amber-400 text-zinc-950"
                                : index === 1
                                ? "bg-zinc-300 text-zinc-900"
                                : index === 2
                                ? "bg-amber-600 text-white"
                                : "bg-zinc-100 text-zinc-600"
                            }`}
                          >
                            {index + 1}
                          </span>
                          <span className={isPresentationMode ? "text-zinc-200" : "text-zinc-800"}>{item.school}</span>
                        </span>
                        <span className="text-rosebrand-600 font-black">
                          {item.count} siswa ({percent}%)
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div
                          className="h-full bg-gradient-to-r from-rosebrand-600 to-amber-500 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {analytics.topSchools.length === 0 && (
                  <p className="text-center text-xs text-zinc-500 py-8">Belum ada data sekolah pendaftar.</p>
                )}
              </div>
            </div>

            {/* Asal Daerah / Wilayah Pendaftar */}
            <div
              className={`rounded-[12px] p-6 shadow-sm border ${
                isPresentationMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-base font-black ${isPresentationMode ? "text-white" : "text-zinc-950"}`}>
                    Sebaran Wilayah Domisili (Kabupaten / Kota)
                  </h3>
                  <p className="text-xs text-zinc-500">Daerah asal domisili calon siswa</p>
                </div>
                <MapPin size={20} className="text-emerald-600" />
              </div>

              <div className="mt-5 space-y-3">
                {analytics.topRegions.map((r, index) => {
                  const percent = analytics.total > 0 ? Math.round((r.count / analytics.total) * 100) : 0;
                  return (
                    <div key={r.region} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className={isPresentationMode ? "text-zinc-200" : "text-zinc-800"}>{r.region}</span>
                        <span className="text-emerald-600 font-black">
                          {r.count} calon siswa ({percent}%)
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
                {analytics.topRegions.length === 0 && (
                  <p className="text-center text-xs text-zinc-500 py-8">Belum ada data wilayah domisili.</p>
                )}
              </div>
            </div>
          </div>

          {/* Charts Row 3: Sumber Informasi & Top Afiliator (Guru BK) */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Sumber Informasi */}
            <div
              className={`rounded-[12px] p-6 shadow-sm border ${
                isPresentationMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
              }`}
            >
              <h3 className={`text-base font-black ${isPresentationMode ? "text-white" : "text-zinc-950"}`}>
                Efektivitas Saluran Promosi (Sumber Info)
              </h3>
              <p className="text-xs text-zinc-500">Dari mana calon siswa mengetahui pendaftaran SMK Telkom</p>

              <div className="mt-5 space-y-3">
                {analytics.infoData.map((info) => {
                  const pct = analytics.total > 0 ? Math.round((info.count / analytics.total) * 100) : 0;
                  return (
                    <div key={info.source} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className={isPresentationMode ? "text-zinc-300" : "text-zinc-700"}>{info.source}</span>
                        <span className="text-sky-600 font-black">{info.count} ({pct}%)</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div className="h-full bg-sky-600 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Leaderboard Afiliator / Perekomendasi */}
            <div
              className={`rounded-[12px] p-6 shadow-sm border ${
                isPresentationMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-base font-black ${isPresentationMode ? "text-white" : "text-zinc-950"}`}>
                    Leaderboard Afiliator (Guru BK & Perekomendasi)
                  </h3>
                  <p className="text-xs text-zinc-500">Nama pemberi referensi terbanyak untuk reward SPMB</p>
                </div>
                <Award size={20} className="text-amber-500" />
              </div>

              <div className="mt-4 overflow-hidden rounded-[8px] border border-zinc-100 dark:border-zinc-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/60 uppercase text-[10px] text-zinc-400 font-black">
                    <tr>
                      <th className="px-3 py-2">Rank</th>
                      <th className="px-3 py-2">Nama Afiliator / Guru BK</th>
                      <th className="px-3 py-2 text-right">Referal Siswa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-semibold">
                    {analytics.topAffiliators.map((af, i) => (
                      <tr key={af.name}>
                        <td className="px-3 py-2.5 font-black text-zinc-400">#{i + 1}</td>
                        <td className="px-3 py-2.5 font-bold text-zinc-800 dark:text-zinc-200">{af.name}</td>
                        <td className="px-3 py-2.5 text-right font-black text-rosebrand-600">{af.count} Siswa</td>
                      </tr>
                    ))}
                    {analytics.topAffiliators.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-3 py-8 text-center text-zinc-400">
                          Belum ada nama afiliator tercatat.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: DATA PENDAFTAR PPDB (TABEL LENGKAP & SEARCH) */}
      {/* ============================================================== */}
      {activeTab === "registrations" && (
        <section className="rounded-[12px] bg-white p-5 shadow-sm border border-zinc-200">
          <label className="relative block">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" aria-hidden />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama siswa, No. Reg, NISN, NIK, asal sekolah, orang tua, afiliator, kota..."
              className="h-11 w-full rounded-[8px] border border-zinc-200 pl-11 pr-4 text-sm font-semibold outline-none focus:border-rosebrand-500"
            />
          </label>

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
                          <p className="mt-0.5 text-rosebrand-600 font-bold">Afiliator: {item.affiliatorName}</p>
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
                            title="Print Kartu Pendaftaran Resmi"
                          >
                            <Printer size={15} />
                            Kartu
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRegistration(item)}
                            disabled={deletingId === item.id}
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[8px] border border-rose-200 bg-rose-50 px-3 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-100 hover:border-rose-300 disabled:opacity-50"
                            title="Hapus Data Calon Siswa (Soft Delete)"
                          >
                            <Trash2 size={15} />
                            {deletingId === item.id ? "..." : "Hapus"}
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
        </section>
      )}

      {/* ============================================================== */}
      {/* TAB 3: VERIFIKASI PEMBAYARAN */}
      {/* ============================================================== */}
      {activeTab === "payments" && (
        <section className="rounded-[12px] bg-white p-5 shadow-sm border border-zinc-200">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
            <label className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" aria-hidden />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari nomor pendaftaran, nama siswa, gelombang..."
                className="h-11 w-full rounded-[8px] border border-zinc-200 pl-11 pr-4 text-sm font-semibold outline-none focus:border-emerald-500"
              />
            </label>

            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value as any)}
              className="h-11 rounded-[8px] border border-zinc-200 px-4 text-sm font-bold text-zinc-700 outline-none focus:border-emerald-500"
            >
              <option value="all">Semua Status Pembayaran</option>
              <option value="pending">Menunggu Verifikasi (Pending)</option>
              <option value="verified">Terverifikasi (Diterima)</option>
              <option value="rejected">Ditolak</option>
            </select>
          </div>

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
        </section>
      )}

      {/* ============================================================== */}
      {/* TAB 4: BERKAS DOKUMEN SUSULAN */}
      {/* ============================================================== */}
      {activeTab === "documents" && (
        <section className="rounded-[12px] bg-white p-5 shadow-sm border border-zinc-200">
          <label className="relative block">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" aria-hidden />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nomor pendaftaran, nama siswa, jenis berkas..."
              className="h-11 w-full rounded-[8px] border border-zinc-200 pl-11 pr-4 text-sm font-semibold outline-none focus:border-amber-500"
            />
          </label>

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
        </section>
      )}

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
                  onClick={() => downloadSpmbCardPdf(selectedStudent)}
                  className="inline-flex items-center gap-1.5 rounded-[8px] border border-zinc-300 px-3.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  <Download size={15} />
                  Unduh PDF
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteRegistration(selectedStudent)}
                  disabled={deletingId === selectedStudent.id}
                  className="inline-flex items-center gap-1.5 rounded-[8px] border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 hover:border-rose-300 transition-colors disabled:opacity-50"
                  title="Hapus Data Calon Siswa (Soft Delete)"
                >
                  <Trash2 size={15} />
                  {deletingId === selectedStudent.id ? "Menghapus..." : "Hapus Data"}
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
                    <p className="text-sm font-bold text-zinc-800">{selectedStudent.choicePriority || "Pilihan Utama"}</p>
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
              <p className="text-sm font-black text-zinc-900">Bukti Transfer Pembayaran</p>
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
