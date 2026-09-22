import * as XLSX from "xlsx";
import { normalizeImageUrl } from "./image-url";
import type { SpmbPaymentConfirmation, SpmbRegistration, SpmbSupplementaryDocument } from "@/types/content";

function toTextCell(val: unknown): XLSX.CellObject {
  if (val === null || val === undefined) {
    return { t: "s", v: "" };
  }
  return { t: "s", v: String(val).trim() };
}

function toNumCell(val: number): XLSX.CellObject {
  return { t: "n", v: isNaN(val) ? 0 : val };
}

function formatDateIndo(isoStr?: string): string {
  if (!isoStr) return "-";
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(d);
  } catch {
    return isoStr;
  }
}

export function exportSpmbExcel({
  items,
  payments = [],
  supplementaryDocs = [],
  academicYear
}: {
  items: SpmbRegistration[];
  payments?: SpmbPaymentConfirmation[];
  supplementaryDocs?: SpmbSupplementaryDocument[];
  academicYear?: string;
}) {
  if (!items || items.length === 0) {
    throw new Error("Tidak ada data pendaftaran yang dapat diekspor.");
  }

  const wb = XLSX.utils.book_new();

  // Create payment lookup map
  const paymentMap = new Map<string, SpmbPaymentConfirmation>();
  payments.forEach((p) => {
    if (p.registrationNumber) {
      paymentMap.set(p.registrationNumber, p);
    }
  });

  // -------------------------------------------------------------------------
  // SHEET 1: DATA MASTER PENDAFTAR (Data Lengkap untuk Analisis & Pengolahan)
  // -------------------------------------------------------------------------
  const masterHeaders = [
    "No",
    "No. Pendaftaran",
    "Status Pembayaran",
    "Nominal Tiket (Rp)",
    "Gelombang Pembayaran",
    "Tahun Ajaran",
    "Jalur Pendaftaran",
    "Pilihan Jurusan",
    "Prioritas Pilihan",
    "Nama Lengkap",
    "Jenis Kelamin",
    "NIK",
    "NISN",
    "Agama",
    "Tanggal Lahir",
    "No. WhatsApp Siswa",
    "Email",
    "Provinsi",
    "Kabupaten / Kota",
    "Kecamatan",
    "Alamat Lengkap",
    "Asal Sekolah",
    "Naungan Sekolah",
    "Tipe Sekolah",
    "Alamat Sekolah Asal",
    "Nama Ayah",
    "Pendidikan Ayah",
    "Pekerjaan Ayah",
    "No. HP Ayah",
    "Tgl Lahir Ayah",
    "Nama Ibu",
    "Pendidikan Ibu",
    "Pekerjaan Ibu",
    "No. HP Ibu",
    "Tgl Lahir Ibu",
    "Sumber Informasi",
    "Nama Afiliator / Rekomendasi",
    "Alasan Memilih Stella",
    "Catatan Prestasi Siswa",
    "Kelengkapan Dokumen",
    "Link File Kartu Pelajar",
    "Link File Kartu Keluarga",
    "Link File Akta Kelahiran",
    "Link File Sertifikat Prestasi",
    "Waktu Mendaftar"
  ];

  const masterRows: (XLSX.CellObject | string | number)[][] = [];

  items.forEach((item, index) => {
    const pay = paymentMap.get(item.registrationNumber);
    let payStatus = "BELUM KONFIRMASI";
    let payAmount = 0;
    let payBatch = "-";

    if (pay) {
      payAmount = pay.amount || 0;
      payBatch = pay.batch || "-";
      if (pay.status === "verified") {
        payStatus = "LUNAS / TERVERIFIKASI";
      } else if (pay.status === "pending") {
        payStatus = "MENUNGGU VERIFIKASI";
      } else if (pay.status === "rejected") {
        payStatus = "DITOLAK";
      }
    }

    // Hitung dokumen kelengkapan
    let docCount = 0;
    if (item.studentCardFile) docCount++;
    if (item.familyCardFile) docCount++;
    if (item.birthCertificateFile) docCount++;
    if (item.achievementCertificateFile) docCount++;
    const docStatus = `${docCount}/4 Berkas (${docCount === 4 ? "Lengkap" : "Sebagian"})`;

    masterRows.push([
      toNumCell(index + 1),
      toTextCell(item.registrationNumber),
      toTextCell(payStatus),
      toNumCell(payAmount),
      toTextCell(payBatch),
      toTextCell(item.academicYear || academicYear || "-"),
      toTextCell(item.registrationTrack || "Reguler"),
      toTextCell(item.selectedMajorName || "-"),
      toTextCell(item.choicePriority || "-"),
      toTextCell(item.fullName),
      toTextCell(item.gender === "L" || item.gender === "Laki-laki" ? "Laki-laki" : "Perempuan"),
      toTextCell(item.nik),
      toTextCell(item.nisn),
      toTextCell(item.religion || "-"),
      toTextCell(item.birthDate || "-"),
      toTextCell(item.whatsappNumber),
      toTextCell(item.email || "-"),
      toTextCell(item.province || "-"),
      toTextCell(item.city || "-"),
      toTextCell(item.district || "-"),
      toTextCell(item.currentAddress || "-"),
      toTextCell(item.previousSchool || "-"),
      toTextCell(item.ministry || "-"),
      toTextCell(item.schoolType || "-"),
      toTextCell(item.previousSchoolAddress || "-"),
      toTextCell(item.fatherName || "-"),
      toTextCell(item.fatherEducation || "-"),
      toTextCell(item.fatherOccupation || "-"),
      toTextCell(item.fatherPhone || "-"),
      toTextCell(item.fatherBirthDate || "-"),
      toTextCell(item.motherName || "-"),
      toTextCell(item.motherEducation || "-"),
      toTextCell(item.motherOccupation || "-"),
      toTextCell(item.motherPhone || "-"),
      toTextCell(item.motherBirthDate || "-"),
      toTextCell(item.infoSource || "-"),
      toTextCell(item.affiliatorName || "-"),
      toTextCell(item.reason || "-"),
      toTextCell(item.achievementsNote || "-"),
      toTextCell(docStatus),
      toTextCell(item.studentCardFile ? normalizeImageUrl(item.studentCardFile) : "-"),
      toTextCell(item.familyCardFile ? normalizeImageUrl(item.familyCardFile) : "-"),
      toTextCell(item.birthCertificateFile ? normalizeImageUrl(item.birthCertificateFile) : "-"),
      toTextCell(item.achievementCertificateFile ? normalizeImageUrl(item.achievementCertificateFile) : "-"),
      toTextCell(formatDateIndo(item.createdAt))
    ]);
  });

  const wsMaster = XLSX.utils.aoa_to_sheet([
    masterHeaders.map(h => toTextCell(h)),
    ...masterRows
  ]);

  // Lebar kolom rapi & terbaca
  wsMaster["!cols"] = [
    { wch: 6 },  // No
    { wch: 18 }, // No. Pendaftaran
    { wch: 24 }, // Status Pembayaran
    { wch: 18 }, // Nominal Tiket
    { wch: 20 }, // Gelombang
    { wch: 14 }, // Tahun Ajaran
    { wch: 20 }, // Jalur
    { wch: 34 }, // Jurusan
    { wch: 16 }, // Prioritas
    { wch: 28 }, // Nama Lengkap
    { wch: 14 }, // Jenis Kelamin
    { wch: 20 }, // NIK (Preserved string)
    { wch: 15 }, // NISN (Preserved string)
    { wch: 14 }, // Agama
    { wch: 15 }, // Tgl Lahir
    { wch: 18 }, // WA Siswa (Preserved string)
    { wch: 26 }, // Email
    { wch: 18 }, // Provinsi
    { wch: 22 }, // Kab/Kota
    { wch: 18 }, // Kecamatan
    { wch: 35 }, // Alamat
    { wch: 28 }, // Asal Sekolah
    { wch: 16 }, // Naungan
    { wch: 14 }, // Tipe
    { wch: 30 }, // Alamat Sekolah
    { wch: 22 }, // Nama Ayah
    { wch: 16 }, // Pend Ayah
    { wch: 20 }, // Pekerjaan Ayah
    { wch: 18 }, // No HP Ayah
    { wch: 15 }, // Tgl Lahir Ayah
    { wch: 22 }, // Nama Ibu
    { wch: 16 }, // Pend Ibu
    { wch: 20 }, // Pekerjaan Ibu
    { wch: 18 }, // No HP Ibu
    { wch: 15 }, // Tgl Lahir Ibu
    { wch: 24 }, // Info Source
    { wch: 26 }, // Afiliator
    { wch: 32 }, // Alasan
    { wch: 28 }, // Prestasi
    { wch: 22 }, // Kelengkapan Dokumen
    { wch: 35 }, // Link Kartu Pelajar
    { wch: 35 }, // Link KK
    { wch: 35 }, // Link Akta
    { wch: 35 }, // Link Sertifikat
    { wch: 24 }  // Waktu Mendaftar
  ];

  XLSX.utils.book_append_sheet(wb, wsMaster, "Rekap Data Master");

  // -------------------------------------------------------------------------
  // SHEET 2: RINGKASAN & ANALITIK EKSEKUTIF (Executive Summary Dashboard)
  // -------------------------------------------------------------------------
  const totalStudents = items.length;
  const verifiedPayments = payments.filter((p) => p.status === "verified");
  const pendingPayments = payments.filter((p) => p.status === "pending");
  const rejectedPayments = payments.filter((p) => p.status === "rejected");
  const totalVerifiedRevenue = verifiedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  // Jurusan Stats
  const majorCounts: Record<string, number> = {};
  items.forEach((item) => {
    const m = item.selectedMajorName || "Belum Ditentukan";
    majorCounts[m] = (majorCounts[m] || 0) + 1;
  });
  const sortedMajors = Object.entries(majorCounts).sort((a, b) => b[1] - a[1]);

  // Jalur Stats
  const trackCounts: Record<string, number> = {};
  items.forEach((item) => {
    const t = item.registrationTrack || "Reguler";
    trackCounts[t] = (trackCounts[t] || 0) + 1;
  });
  const sortedTracks = Object.entries(trackCounts).sort((a, b) => b[1] - a[1]);

  // Gender Stats
  const maleCount = items.filter((i) => i.gender === "L" || i.gender === "Laki-laki").length;
  const femaleCount = totalStudents - maleCount;

  // Asal Sekolah Stats (Top 15)
  const schoolCounts: Record<string, number> = {};
  items.forEach((item) => {
    const s = (item.previousSchool || "").trim() || "Tidak Diisi";
    schoolCounts[s] = (schoolCounts[s] || 0) + 1;
  });
  const sortedSchools = Object.entries(schoolCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  // Wilayah / Kota Stats
  const cityCounts: Record<string, number> = {};
  items.forEach((item) => {
    const c = (item.city || "").trim() || "Lainnya";
    cityCounts[c] = (cityCounts[c] || 0) + 1;
  });
  const sortedCities = Object.entries(cityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Sumber Informasi Stats
  const infoCounts: Record<string, number> = {};
  items.forEach((item) => {
    const s = (item.infoSource || "").trim() || "Lainnya";
    infoCounts[s] = (infoCounts[s] || 0) + 1;
  });
  const sortedInfo = Object.entries(infoCounts).sort((a, b) => b[1] - a[1]);

  // Afiliator Stats
  const affiliatorCounts: Record<string, number> = {};
  items.forEach((item) => {
    const af = (item.affiliatorName || "").trim();
    if (af && af !== "-" && af.toLowerCase() !== "tidak ada" && af.toLowerCase() !== "none") {
      affiliatorCounts[af] = (affiliatorCounts[af] || 0) + 1;
    }
  });
  const sortedAffiliators = Object.entries(affiliatorCounts).sort((a, b) => b[1] - a[1]);

  const summarySheetRows: (XLSX.CellObject | string | number)[][] = [
    [toTextCell("REKAPITULASI & ANALITIK PENDAFTARAN SISWA BARU (SPMB)")],
    [toTextCell("SMK TELKOM LAMPUNG")],
    [
      toTextCell(`Tahun Ajaran: ${academicYear || "Semua"}`),
      toTextCell(""),
      toTextCell(`Tanggal Rekap: ${formatDateIndo(new Date().toISOString())}`)
    ],
    [],
    // RINGKASAN UTAMA (METRICS CARD)
    [toTextCell("=== RINGKASAN UTAMA PENDAFTARAN ===")],
    [toTextCell("Indikator"), toTextCell("Nilai"), toTextCell("Keterangan")],
    [toTextCell("Total Calon Siswa Terdaftar"), toNumCell(totalStudents), toTextCell("Siswa")],
    [toTextCell("Pembayaran Terverifikasi (Lunas)"), toNumCell(verifiedPayments.length), toTextCell(`${totalStudents > 0 ? Math.round((verifiedPayments.length / totalStudents) * 100) : 0}% dari total pendaftar`)],
    [toTextCell("Pembayaran Menunggu Verifikasi"), toNumCell(pendingPayments.length), toTextCell("Perlu tindakan Panitia/Bendahara")],
    [toTextCell("Pembayaran Ditolak"), toNumCell(rejectedPayments.length), toTextCell("Bukti transfer tidak valid")],
    [toTextCell("Belum Mengonfirmasi Pembayaran"), toNumCell(totalStudents - payments.length), toTextCell("Siswa belum upload bukti bayar")],
    [toTextCell("Total Dana Tiket Masuk Terverifikasi"), toNumCell(totalVerifiedRevenue), toTextCell("Rupiah (Lunas)")],
    [],
    // TABEL 1: PEMINATAN JURUSAN
    [toTextCell("=== 1. DISTRIBUSI PEMINATAN PROGRAM KEAHLIAN / JURUSAN ===")],
    [toTextCell("No"), toTextCell("Program Keahlian (Jurusan)"), toTextCell("Jumlah Pendaftar"), toTextCell("Persentase (%)")],
    ...sortedMajors.map(([name, count], i) => [
      toNumCell(i + 1),
      toTextCell(name),
      toNumCell(count),
      toTextCell(`${totalStudents > 0 ? ((count / totalStudents) * 100).toFixed(1) : 0}%`)
    ]),
    [],
    // TABEL 2: JALUR PENDAFTARAN
    [toTextCell("=== 2. DISTRIBUSI JALUR PENDAFTARAN ===")],
    [toTextCell("No"), toTextCell("Jalur Pendaftaran"), toTextCell("Jumlah Pendaftar"), toTextCell("Persentase (%)")],
    ...sortedTracks.map(([track, count], i) => [
      toNumCell(i + 1),
      toTextCell(track),
      toNumCell(count),
      toTextCell(`${totalStudents > 0 ? ((count / totalStudents) * 100).toFixed(1) : 0}%`)
    ]),
    [],
    // TABEL 3: JENIS KELAMIN
    [toTextCell("=== 3. DISTRIBUSI JENIS KELAMIN ===")],
    [toTextCell("No"), toTextCell("Jenis Kelamin"), toTextCell("Jumlah Pendaftar"), toTextCell("Persentase (%)")],
    [
      toNumCell(1),
      toTextCell("Laki-laki"),
      toNumCell(maleCount),
      toTextCell(`${totalStudents > 0 ? ((maleCount / totalStudents) * 100).toFixed(1) : 0}%`)
    ],
    [
      toNumCell(2),
      toTextCell("Perempuan"),
      toNumCell(femaleCount),
      toTextCell(`${totalStudents > 0 ? ((femaleCount / totalStudents) * 100).toFixed(1) : 0}%`)
    ],
    [],
    // TABEL 4: TOP ASAL SEKOLAH
    [toTextCell("=== 4. TOP 15 ASAL SEKOLAH SMP / MTs TERBANYAK ===")],
    [toTextCell("No"), toTextCell("Nama Sekolah SMP / MTs"), toTextCell("Jumlah Siswa"), toTextCell("Persentase (%)")],
    ...sortedSchools.map(([school, count], i) => [
      toNumCell(i + 1),
      toTextCell(school),
      toNumCell(count),
      toTextCell(`${totalStudents > 0 ? ((count / totalStudents) * 100).toFixed(1) : 0}%`)
    ]),
    [],
    // TABEL 5: SEBARAN WILAYAH
    [toTextCell("=== 5. SEBARAN KABUPATEN / KOTA ASAL SISWA ===")],
    [toTextCell("No"), toTextCell("Kabupaten / Kota"), toTextCell("Jumlah Siswa"), toTextCell("Persentase (%)")],
    ...sortedCities.map(([city, count], i) => [
      toNumCell(i + 1),
      toTextCell(city),
      toNumCell(count),
      toTextCell(`${totalStudents > 0 ? ((count / totalStudents) * 100).toFixed(1) : 0}%`)
    ]),
    [],
    // TABEL 6: SUMBER INFORMASI
    [toTextCell("=== 6. EFEKTIVITAS SALURAN INFORMASI PROMOSI ===")],
    [toTextCell("No"), toTextCell("Saluran Informasi"), toTextCell("Jumlah Siswa"), toTextCell("Persentase (%)")],
    ...sortedInfo.map(([source, count], i) => [
      toNumCell(i + 1),
      toTextCell(source),
      toNumCell(count),
      toTextCell(`${totalStudents > 0 ? ((count / totalStudents) * 100).toFixed(1) : 0}%`)
    ]),
    [],
    // TABEL 7: LEADERBOARD AFILIATOR
    [toTextCell("=== 7. LEADERBOARD AFILIATOR / REKOMENDASI GURU BK ===")],
    [toTextCell("No"), toTextCell("Nama Afiliator / Guru"), toTextCell("Jumlah Rekomendasi Siswa"), toTextCell("Catatan")],
    ...(sortedAffiliators.length > 0
      ? sortedAffiliators.map(([name, count], i) => [
          toNumCell(i + 1),
          toTextCell(name),
          toNumCell(count),
          toTextCell("Program Afiliasi PPDB")
        ])
      : [[toNumCell(1), toTextCell("Belum ada data afiliator"), toNumCell(0), toTextCell("-")]])
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summarySheetRows);
  wsSummary["!cols"] = [
    { wch: 8 },  // No / Col 1
    { wch: 38 }, // Nama / Deskripsi
    { wch: 22 }, // Jumlah
    { wch: 30 }  // Persentase / Ket
  ];

  XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan & Analitik");

  // -------------------------------------------------------------------------
  // SHEET 3: DATA TRANSAKSI & PEMBAYARAN TIKET
  // -------------------------------------------------------------------------
  if (payments && payments.length > 0) {
    const paymentHeaders = [
      "No",
      "No. Pendaftaran",
      "Nama Calon Siswa",
      "Gelombang / Batch",
      "Nominal Transfer (Rp)",
      "Status Verifikasi",
      "Catatan Bendahara",
      "Link Bukti Transfer",
      "Waktu Konfirmasi"
    ];

    const paymentRows = payments.map((p, i) => [
      toNumCell(i + 1),
      toTextCell(p.registrationNumber),
      toTextCell(p.studentName),
      toTextCell(p.batch || "-"),
      toNumCell(p.amount || 0),
      toTextCell(
        p.status === "verified"
          ? "TERVERIFIKASI (LUNAS)"
          : p.status === "pending"
          ? "MENUNGGU VERIFIKASI"
          : "DITOLAK"
      ),
      toTextCell(p.notes || "-"),
      toTextCell(p.proofFile ? normalizeImageUrl(p.proofFile) : "-"),
      toTextCell(formatDateIndo(p.createdAt))
    ]);

    const wsPayments = XLSX.utils.aoa_to_sheet([
      paymentHeaders.map(h => toTextCell(h)),
      ...paymentRows
    ]);

    wsPayments["!cols"] = [
      { wch: 6 },  // No
      { wch: 18 }, // No Pendaftaran
      { wch: 28 }, // Nama
      { wch: 20 }, // Gelombang
      { wch: 24 }, // Nominal
      { wch: 24 }, // Status
      { wch: 30 }, // Catatan
      { wch: 35 }, // Bukti File
      { wch: 24 }  // Waktu
    ];

    XLSX.utils.book_append_sheet(wb, wsPayments, "Rekap Pembayaran");
  }

  // -------------------------------------------------------------------------
  // EXPORT FILE
  // -------------------------------------------------------------------------
  const safeYear = (academicYear || "All").replace(/[/\\?%*:|"<>]/g, "-");
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `Rekap_SPMB_SMK_Telkom_Lampung_${safeYear}_${dateStr}.xlsx`;

  XLSX.writeFile(wb, fileName);
}
