import ExcelJS from "exceljs";
import { normalizeImageUrl } from "./image-url";
import type { SpmbPaymentConfirmation, SpmbRegistration, SpmbSupplementaryDocument } from "@/types/content";

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

// Border presets
const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFE2E8F0" } },
  left: { style: "thin", color: { argb: "FFE2E8F0" } },
  bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
  right: { style: "thin", color: { argb: "FFE2E8F0" } }
};

const headerBorder: Partial<ExcelJS.Borders> = {
  top: { style: "medium", color: { argb: "FF991B1B" } },
  left: { style: "thin", color: { argb: "FFB91C1C" } },
  bottom: { style: "medium", color: { argb: "FF7F1D1D" } },
  right: { style: "thin", color: { argb: "FFB91C1C" } }
};

export async function exportSpmbExcel({
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

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Portal SMK Telkom Lampung";
  workbook.lastModifiedBy = "Panitia SPMB";
  workbook.created = new Date();
  workbook.modified = new Date();

  // Create payment lookup map
  const paymentMap = new Map<string, SpmbPaymentConfirmation>();
  payments.forEach((p) => {
    if (p.registrationNumber) {
      paymentMap.set(p.registrationNumber, p);
    }
  });

  // =========================================================================
  // SHEET 1: REKAP DATA MASTER (Data Lengkap untuk Analisis & Pengolahan)
  // =========================================================================
  const wsMaster = workbook.addWorksheet("Data Pendaftar (Master)", {
    views: [{ state: "frozen", xSplit: 2, ySplit: 1 }] // freeze No & No Pendaftaran + Header!
  });

  // Define Columns
  wsMaster.columns = [
    { header: "No", key: "no", width: 8 },
    { header: "No. Pendaftaran", key: "regNo", width: 20 },
    { header: "Status Pembayaran", key: "payStatus", width: 26 },
    { header: "Nominal Tiket (Rp)", key: "payAmount", width: 22 },
    { header: "Gelombang", key: "payBatch", width: 16 },
    { header: "Tahun Ajaran", key: "academicYear", width: 16 },
    { header: "Jalur Pendaftaran", key: "track", width: 20 },
    { header: "Pilihan Jurusan", key: "major", width: 36 },
    { header: "Prioritas", key: "priority", width: 18 },
    { header: "Nama Lengkap", key: "name", width: 32 },
    { header: "Jenis Kelamin", key: "gender", width: 16 },
    { header: "NIK", key: "nik", width: 22 },
    { header: "NISN", key: "nisn", width: 16 },
    { header: "Agama", key: "religion", width: 16 },
    { header: "Tanggal Lahir", key: "birthDate", width: 16 },
    { header: "No. WhatsApp Siswa", key: "wa", width: 20 },
    { header: "Email", key: "email", width: 28 },
    { header: "Provinsi", key: "province", width: 20 },
    { header: "Kabupaten / Kota", key: "city", width: 24 },
    { header: "Kecamatan", key: "district", width: 20 },
    { header: "Alamat Lengkap", key: "address", width: 40 },
    { header: "Asal Sekolah", key: "school", width: 30 },
    { header: "Naungan Sekolah", key: "ministry", width: 18 },
    { header: "Tipe Sekolah", key: "schoolType", width: 16 },
    { header: "Alamat Sekolah Asal", key: "schoolAddress", width: 32 },
    { header: "Nama Ayah", key: "fatherName", width: 24 },
    { header: "Pendidikan Ayah", key: "fatherEdu", width: 18 },
    { header: "Pekerjaan Ayah", key: "fatherJob", width: 22 },
    { header: "No. HP Ayah", key: "fatherPhone", width: 20 },
    { header: "Tgl Lahir Ayah", key: "fatherBirthDate", width: 16 },
    { header: "Nama Ibu", key: "motherName", width: 24 },
    { header: "Pendidikan Ibu", key: "motherEdu", width: 18 },
    { header: "Pekerjaan Ibu", key: "motherJob", width: 22 },
    { header: "No. HP Ibu", key: "motherPhone", width: 20 },
    { header: "Tgl Lahir Ibu", key: "motherBirthDate", width: 16 },
    { header: "Sumber Informasi", key: "infoSource", width: 24 },
    { header: "Nama Afiliator / Rekomendasi", key: "affiliator", width: 28 },
    { header: "Alasan Memilih Stella", key: "reason", width: 35 },
    { header: "Catatan Prestasi Siswa", key: "achievements", width: 30 },
    { header: "Kelengkapan Dokumen", key: "docStatus", width: 22 },
    { header: "Kartu Pelajar", key: "fileStudentCard", width: 20 },
    { header: "Kartu Keluarga", key: "fileFamilyCard", width: 20 },
    { header: "Akta Kelahiran", key: "fileBirthCert", width: 20 },
    { header: "Sertifikat Prestasi", key: "fileAchievement", width: 20 },
    { header: "Waktu Mendaftar", key: "createdAt", width: 25 }
  ];

  // Enable AutoFilter on master sheet
  wsMaster.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: wsMaster.columns.length }
  };

  // Style Header Row
  const headerRow = wsMaster.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    cell.font = {
      name: "Segoe UI",
      size: 11,
      bold: true,
      color: { argb: "FFFFFFFF" }
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFB91C1C" } // Telkom Rose-Red / Crimson
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: false
    };
    cell.border = headerBorder;
  });

  // Populate Data Rows
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

    let docCount = 0;
    if (item.studentCardFile) docCount++;
    if (item.familyCardFile) docCount++;
    if (item.birthCertificateFile) docCount++;
    if (item.achievementCertificateFile) docCount++;
    const docStatus = `${docCount}/4 Berkas (${docCount === 4 ? "Lengkap" : "Sebagian"})`;

    const row = wsMaster.addRow({
      no: index + 1,
      regNo: item.registrationNumber,
      payStatus: payStatus,
      payAmount: payAmount,
      payBatch: payBatch,
      academicYear: item.academicYear || academicYear || "-",
      track: item.registrationTrack || "Reguler",
      major: item.selectedMajorName || "-",
      priority: item.choicePriority || "-",
      name: item.fullName,
      gender: item.gender === "L" || item.gender === "Laki-laki" ? "Laki-laki" : "Perempuan",
      nik: String(item.nik || ""),
      nisn: String(item.nisn || ""),
      religion: item.religion || "-",
      birthDate: item.birthDate || "-",
      wa: String(item.whatsappNumber || ""),
      email: item.email || "-",
      province: item.province || "-",
      city: item.city || "-",
      district: item.district || "-",
      address: item.currentAddress || "-",
      school: item.previousSchool || "-",
      ministry: item.ministry || "-",
      schoolType: item.schoolType || "-",
      schoolAddress: item.previousSchoolAddress || "-",
      fatherName: item.fatherName || "-",
      fatherEdu: item.fatherEducation || "-",
      fatherJob: item.fatherOccupation || "-",
      fatherPhone: String(item.fatherPhone || "-"),
      fatherBirthDate: item.fatherBirthDate || "-",
      motherName: item.motherName || "-",
      motherEdu: item.motherEducation || "-",
      motherJob: item.motherOccupation || "-",
      motherPhone: String(item.motherPhone || "-"),
      motherBirthDate: item.motherBirthDate || "-",
      infoSource: item.infoSource || "-",
      affiliator: item.affiliatorName || "-",
      reason: item.reason || "-",
      achievements: item.achievementsNote || "-",
      docStatus: docStatus,
      fileStudentCard: item.studentCardFile ? { text: "Lihat Berkas", hyperlink: normalizeImageUrl(item.studentCardFile) } : "-",
      fileFamilyCard: item.familyCardFile ? { text: "Lihat Berkas", hyperlink: normalizeImageUrl(item.familyCardFile) } : "-",
      fileBirthCert: item.birthCertificateFile ? { text: "Lihat Berkas", hyperlink: normalizeImageUrl(item.birthCertificateFile) } : "-",
      fileAchievement: item.achievementCertificateFile ? { text: "Lihat Berkas", hyperlink: normalizeImageUrl(item.achievementCertificateFile) } : "-",
      createdAt: formatDateIndo(item.createdAt)
    });

    row.height = 24;

    // Alternating Zebra Row Background
    const isEven = index % 2 === 1;
    const bgArgb = isEven ? "FFF8FAFC" : "FFFFFFFF"; // Light slate / Pure white

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = {
        name: "Segoe UI",
        size: 10,
        color: { argb: "FF1E293B" }
      };
      cell.border = thinBorder;
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: bgArgb }
      };

      // Alignment rules
      // Center aligned columns: No (1), RegNo (2), Status (3), Batch (5), TA (6), Track (7), Priority (9), Gender (11), NIK (12), NISN (13), Agama (14), Tgl Lahir (15), WA (16), Tgl Ayah (30), Tgl Ibu (35), DocStatus (40), Links (41-44), CreatedAt (45)
      const centerCols = [1, 2, 3, 5, 6, 7, 9, 11, 12, 13, 14, 15, 16, 23, 24, 29, 30, 34, 35, 40, 41, 42, 43, 44, 45];
      const rightCols = [4]; // Nominal Tiket

      if (centerCols.includes(colNumber)) {
        cell.alignment = { vertical: "middle", horizontal: "center" };
      } else if (rightCols.includes(colNumber)) {
        cell.alignment = { vertical: "middle", horizontal: "right" };
        cell.numFmt = '"Rp"#,##0';
      } else {
        cell.alignment = { vertical: "middle", horizontal: "left" };
      }

      // Highlight Status Pembayaran
      if (colNumber === 3) {
        if (payStatus.includes("LUNAS")) {
          cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF15803D" } };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCFCE7" } };
        } else if (payStatus.includes("MENUNGGU")) {
          cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFA16207" } };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF9C3" } };
        } else if (payStatus.includes("DITOLAK")) {
          cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFB91C1C" } };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } };
        } else {
          cell.font = { name: "Segoe UI", size: 10, color: { argb: "FF64748B" } };
        }
      }

      // Format hyperlinks
      if ([41, 42, 43, 44].includes(colNumber) && typeof cell.value === "object" && cell.value !== null && "hyperlink" in cell.value) {
        cell.font = { name: "Segoe UI", size: 10, underline: true, color: { argb: "FF2563EB" } };
      }
    });
  });

  // =========================================================================
  // SHEET 2: RINGKASAN & ANALITIK EKSEKUTIF (Executive Summary Dashboard)
  // =========================================================================
  const wsSummary = workbook.addWorksheet("Ringkasan & Analitik", {
    views: [{ showGridLines: true }]
  });

  wsSummary.columns = [
    { width: 8 },  // A
    { width: 38 }, // B
    { width: 22 }, // C
    { width: 26 }, // D
    { width: 20 }  // E
  ];

  let curRow = 1;

  // Title Banner
  wsSummary.mergeCells(`B${curRow}:D${curRow}`);
  const titleCell = wsSummary.getCell(`B${curRow}`);
  titleCell.value = "REKAPITULASI & ANALITIK PENDAFTARAN SISWA BARU (SPMB)";
  titleCell.font = { name: "Segoe UI", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFB91C1C" } };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };
  wsSummary.getRow(curRow).height = 36;
  curRow++;

  wsSummary.mergeCells(`B${curRow}:D${curRow}`);
  const subCell = wsSummary.getCell(`B${curRow}`);
  subCell.value = "SMK TELKOM LAMPUNG";
  subCell.font = { name: "Segoe UI", size: 12, bold: true, color: { argb: "FFFFFFFF" } };
  subCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF991B1B" } };
  subCell.alignment = { vertical: "middle", horizontal: "center" };
  wsSummary.getRow(curRow).height = 26;
  curRow++;

  wsSummary.mergeCells(`B${curRow}:D${curRow}`);
  const metaCell = wsSummary.getCell(`B${curRow}`);
  metaCell.value = `Tahun Ajaran: ${academicYear || "Semua"} | Waktu Unduh: ${formatDateIndo(new Date().toISOString())}`;
  metaCell.font = { name: "Segoe UI", size: 10, italic: true, color: { argb: "FF475569" } };
  metaCell.alignment = { vertical: "middle", horizontal: "center" };
  wsSummary.getRow(curRow).height = 22;
  curRow += 2;

  // Helper for Section Titles
  function addSectionTitle(title: string) {
    wsSummary.mergeCells(`B${curRow}:D${curRow}`);
    const cell = wsSummary.getCell(`B${curRow}`);
    cell.value = title;
    cell.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } }; // Slate Dark
    cell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    wsSummary.getRow(curRow).height = 26;
    curRow++;
  }

  // Helper for Table Headers
  function addTableHeaders(headers: string[]) {
    const row = wsSummary.getRow(curRow);
    row.height = 24;
    headers.forEach((h, idx) => {
      const colLetter = idx === 0 ? "B" : idx === 1 ? "C" : "D";
      const cell = wsSummary.getCell(`${colLetter}${curRow}`);
      cell.value = h;
      cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF475569" } }; // Slate 600
      cell.alignment = { vertical: "middle", horizontal: idx === 0 ? "left" : "center" };
      cell.border = thinBorder;
    });
    curRow++;
  }

  // Calculate Metrics
  const totalStudents = items.length;
  const verifiedPayments = payments.filter((p) => p.status === "verified");
  const pendingPayments = payments.filter((p) => p.status === "pending");
  const rejectedPayments = payments.filter((p) => p.status === "rejected");
  const unconfirmedCount = totalStudents - payments.length;
  const totalVerifiedRevenue = verifiedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  // 1. RINGKASAN UTAMA
  addSectionTitle("1. RINGKASAN UTAMA PENDAFTARAN");
  addTableHeaders(["Indikator Capaian", "Nilai / Jumlah", "Keterangan"]);

  const kpiRows = [
    ["Total Calon Siswa Terdaftar", totalStudents, "Siswa (100%)", false],
    ["Pembayaran Terverifikasi (Lunas)", verifiedPayments.length, `${totalStudents > 0 ? ((verifiedPayments.length / totalStudents) * 100).toFixed(1) : 0}% Terverifikasi`, false],
    ["Pembayaran Menunggu Verifikasi", pendingPayments.length, "Menunggu dicek Bendahara", false],
    ["Pembayaran Ditolak", rejectedPayments.length, "Bukti transfer tidak valid", false],
    ["Belum Konfirmasi Pembayaran", unconfirmedCount > 0 ? unconfirmedCount : 0, "Siswa belum upload bukti", false],
    ["Total Dana Tiket Masuk Terkumpul", totalVerifiedRevenue, "Rupiah (Dana Lunas)", true]
  ];

  kpiRows.forEach(([ind, val, ket, isCurrency], i) => {
    const row = wsSummary.getRow(curRow);
    row.height = 22;
    const bgArgb = i % 2 === 1 ? "FFF8FAFC" : "FFFFFFFF";

    const cellB = wsSummary.getCell(`B${curRow}`);
    cellB.value = ind as string;
    cellB.font = { name: "Segoe UI", size: 10, bold: isCurrency ? true : false, color: { argb: "FF1E293B" } };
    cellB.alignment = { vertical: "middle", horizontal: "left" };
    cellB.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgArgb } };
    cellB.border = thinBorder;

    const cellC = wsSummary.getCell(`C${curRow}`);
    cellC.value = val as number;
    cellC.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: isCurrency ? "FF15803D" : "FF1E293B" } };
    cellC.alignment = { vertical: "middle", horizontal: isCurrency ? "right" : "center" };
    if (isCurrency) cellC.numFmt = '"Rp"#,##0';
    cellC.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgArgb } };
    cellC.border = thinBorder;

    const cellD = wsSummary.getCell(`D${curRow}`);
    cellD.value = ket as string;
    cellD.font = { name: "Segoe UI", size: 10, italic: true, color: { argb: "FF64748B" } };
    cellD.alignment = { vertical: "middle", horizontal: "center" };
    cellD.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgArgb } };
    cellD.border = thinBorder;

    curRow++;
  });
  curRow++;

  // 2. PEMINATAN JURUSAN
  addSectionTitle("2. DISTRIBUSI PEMINATAN PROGRAM KEAHLIAN (JURUSAN)");
  addTableHeaders(["Program Keahlian (Jurusan)", "Jumlah Siswa", "Persentase (%)"]);

  const majorCounts: Record<string, number> = {};
  items.forEach((item) => {
    const m = item.selectedMajorName || "Belum Ditentukan";
    majorCounts[m] = (majorCounts[m] || 0) + 1;
  });
  const sortedMajors = Object.entries(majorCounts).sort((a, b) => b[1] - a[1]);

  sortedMajors.forEach(([name, count], i) => {
    const row = wsSummary.getRow(curRow);
    row.height = 22;
    const bgArgb = i % 2 === 1 ? "FFF8FAFC" : "FFFFFFFF";

    const cellB = wsSummary.getCell(`B${curRow}`);
    cellB.value = name;
    cellB.font = { name: "Segoe UI", size: 10, color: { argb: "FF1E293B" } };
    cellB.alignment = { vertical: "middle", horizontal: "left" };
    cellB.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgArgb } };
    cellB.border = thinBorder;

    const cellC = wsSummary.getCell(`C${curRow}`);
    cellC.value = count;
    cellC.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF1E293B" } };
    cellC.alignment = { vertical: "middle", horizontal: "center" };
    cellC.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgArgb } };
    cellC.border = thinBorder;

    const cellD = wsSummary.getCell(`D${curRow}`);
    cellD.value = `${totalStudents > 0 ? ((count / totalStudents) * 100).toFixed(1) : 0}%`;
    cellD.font = { name: "Segoe UI", size: 10, color: { argb: "FF475569" } };
    cellD.alignment = { vertical: "middle", horizontal: "center" };
    cellD.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgArgb } };
    cellD.border = thinBorder;

    curRow++;
  });
  curRow++;

  // 3. JALUR PENDAFTARAN
  addSectionTitle("3. DISTRIBUSI JALUR PENDAFTARAN");
  addTableHeaders(["Jalur Pendaftaran", "Jumlah Siswa", "Persentase (%)"]);

  const trackCounts: Record<string, number> = {};
  items.forEach((item) => {
    const t = item.registrationTrack || "Reguler";
    trackCounts[t] = (trackCounts[t] || 0) + 1;
  });
  const sortedTracks = Object.entries(trackCounts).sort((a, b) => b[1] - a[1]);

  sortedTracks.forEach(([track, count], i) => {
    const row = wsSummary.getRow(curRow);
    row.height = 22;
    const bgArgb = i % 2 === 1 ? "FFF8FAFC" : "FFFFFFFF";

    const cellB = wsSummary.getCell(`B${curRow}`);
    cellB.value = track;
    cellB.font = { name: "Segoe UI", size: 10, color: { argb: "FF1E293B" } };
    cellB.alignment = { vertical: "middle", horizontal: "left" };
    cellB.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgArgb } };
    cellB.border = thinBorder;

    const cellC = wsSummary.getCell(`C${curRow}`);
    cellC.value = count;
    cellC.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF1E293B" } };
    cellC.alignment = { vertical: "middle", horizontal: "center" };
    cellC.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgArgb } };
    cellC.border = thinBorder;

    const cellD = wsSummary.getCell(`D${curRow}`);
    cellD.value = `${totalStudents > 0 ? ((count / totalStudents) * 100).toFixed(1) : 0}%`;
    cellD.font = { name: "Segoe UI", size: 10, color: { argb: "FF475569" } };
    cellD.alignment = { vertical: "middle", horizontal: "center" };
    cellD.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgArgb } };
    cellD.border = thinBorder;

    curRow++;
  });
  curRow++;

  // 4. TOP 10 ASAL SEKOLAH
  addSectionTitle("4. TOP 10 ASAL SEKOLAH SMP / MTs TERBANYAK");
  addTableHeaders(["Nama Sekolah Asal", "Jumlah Siswa", "Persentase (%)"]);

  const schoolCounts: Record<string, number> = {};
  items.forEach((item) => {
    const s = (item.previousSchool || "").trim() || "Tidak Diisi";
    schoolCounts[s] = (schoolCounts[s] || 0) + 1;
  });
  const sortedSchools = Object.entries(schoolCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  sortedSchools.forEach(([school, count], i) => {
    const row = wsSummary.getRow(curRow);
    row.height = 22;
    const bgArgb = i % 2 === 1 ? "FFF8FAFC" : "FFFFFFFF";

    const cellB = wsSummary.getCell(`B${curRow}`);
    cellB.value = school;
    cellB.font = { name: "Segoe UI", size: 10, color: { argb: "FF1E293B" } };
    cellB.alignment = { vertical: "middle", horizontal: "left" };
    cellB.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgArgb } };
    cellB.border = thinBorder;

    const cellC = wsSummary.getCell(`C${curRow}`);
    cellC.value = count;
    cellC.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF1E293B" } };
    cellC.alignment = { vertical: "middle", horizontal: "center" };
    cellC.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgArgb } };
    cellC.border = thinBorder;

    const cellD = wsSummary.getCell(`D${curRow}`);
    cellD.value = `${totalStudents > 0 ? ((count / totalStudents) * 100).toFixed(1) : 0}%`;
    cellD.font = { name: "Segoe UI", size: 10, color: { argb: "FF475569" } };
    cellD.alignment = { vertical: "middle", horizontal: "center" };
    cellD.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgArgb } };
    cellD.border = thinBorder;

    curRow++;
  });

  // =========================================================================
  // SHEET 3: DATA TRANSAKSI & PEMBAYARAN TIKET
  // =========================================================================
  if (payments && payments.length > 0) {
    const wsPayments = workbook.addWorksheet("Rekap Pembayaran", {
      views: [{ state: "frozen", xSplit: 0, ySplit: 1 }]
    });

    wsPayments.columns = [
      { header: "No", key: "no", width: 8 },
      { header: "No. Pendaftaran", key: "regNo", width: 22 },
      { header: "Nama Calon Siswa", key: "name", width: 32 },
      { header: "Gelombang", key: "batch", width: 18 },
      { header: "Nominal Transfer (Rp)", key: "amount", width: 24 },
      { header: "Status Verifikasi", key: "status", width: 24 },
      { header: "Catatan Bendahara", key: "notes", width: 35 },
      { header: "Bukti Transfer", key: "proof", width: 22 },
      { header: "Waktu Konfirmasi", key: "createdAt", width: 25 }
    ];

    wsPayments.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: wsPayments.columns.length }
    };

    const payHeader = wsPayments.getRow(1);
    payHeader.height = 30;
    payHeader.eachCell((cell) => {
      cell.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF047857" } }; // Emerald 700 (Finance)
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = thinBorder;
    });

    payments.forEach((p, index) => {
      const isVerified = p.status === "verified";
      const isPending = p.status === "pending";
      const isRejected = p.status === "rejected";

      const row = wsPayments.addRow({
        no: index + 1,
        regNo: p.registrationNumber,
        name: p.studentName,
        batch: p.batch || "-",
        amount: p.amount || 0,
        status: isVerified ? "TERVERIFIKASI (LUNAS)" : isPending ? "MENUNGGU VERIFIKASI" : "DITOLAK",
        notes: p.notes || "-",
        proof: p.proofFile ? { text: "Lihat Bukti", hyperlink: normalizeImageUrl(p.proofFile) } : "-",
        createdAt: formatDateIndo(p.createdAt)
      });

      row.height = 24;
      const isEven = index % 2 === 1;
      const bgArgb = isEven ? "FFF8FAFC" : "FFFFFFFF";

      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.font = { name: "Segoe UI", size: 10, color: { argb: "FF1E293B" } };
        cell.border = thinBorder;
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgArgb } };

        if ([1, 2, 4, 6, 8, 9].includes(colNumber)) {
          cell.alignment = { vertical: "middle", horizontal: "center" };
        } else if (colNumber === 5) {
          cell.alignment = { vertical: "middle", horizontal: "right" };
          cell.numFmt = '"Rp"#,##0';
        } else {
          cell.alignment = { vertical: "middle", horizontal: "left" };
        }

        // Status coloring
        if (colNumber === 6) {
          if (isVerified) {
            cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF15803D" } };
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCFCE7" } };
          } else if (isPending) {
            cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFA16207" } };
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF9C3" } };
          } else if (isRejected) {
            cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFB91C1C" } };
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } };
          }
        }

        // Hyperlink styling
        if (colNumber === 8 && typeof cell.value === "object" && cell.value !== null && "hyperlink" in cell.value) {
          cell.font = { name: "Segoe UI", size: 10, underline: true, color: { argb: "FF2563EB" } };
        }
      });
    });
  }

  // =========================================================================
  // DOWNLOAD EXCEL FILE
  // =========================================================================
  const safeYear = (academicYear || "All").replace(/[/\\?%*:|"<>]/g, "-");
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `Rekap_SPMB_SMK_Telkom_Lampung_${safeYear}_${dateStr}.xlsx`;

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.setTimeout(() => window.URL.revokeObjectURL(url), 5000);
}
