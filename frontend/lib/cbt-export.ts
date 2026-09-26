import ExcelJS from "exceljs";
import type { CbtExam, CbtStudentExamResult, CbtItemAnalysis } from "@/types/cbt";

function formatDateIndo(isoStr?: string): string {
  if (!isoStr) return "-";
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(d);
  } catch {
    return isoStr;
  }
}

const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFE2E8F0" } },
  left: { style: "thin", color: { argb: "FFE2E8F0" } },
  bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
  right: { style: "thin", color: { argb: "FFE2E8F0" } }
};

const headerBorder: Partial<ExcelJS.Borders> = {
  top: { style: "medium", color: { argb: "FF0F172A" } },
  left: { style: "thin", color: { argb: "FF334155" } },
  bottom: { style: "medium", color: { argb: "FF0F172A" } },
  right: { style: "thin", color: { argb: "FF334155" } }
};

export async function exportCbtExamReportExcel({
  exam,
  results,
  itemAnalysis
}: {
  exam: CbtExam;
  results: CbtStudentExamResult[];
  itemAnalysis: CbtItemAnalysis[];
}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Portal SMK Telkom Lampung - CBT Engine";
  workbook.lastModifiedBy = "Proctor / Admin CBT";
  workbook.created = new Date();
  workbook.modified = new Date();

  // =========================================================================
  // SHEET 1: REKAPITULASI NILAI SISWA
  // =========================================================================
  const wsScores = workbook.addWorksheet("Rekap Nilai Siswa", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 6 }]
  });

  // Title & Metadata
  wsScores.mergeCells("A1:K1");
  const titleCell = wsScores.getCell("A1");
  titleCell.value = "SMK TELKOM LAMPUNG - DAFTAR NILAI UJIAN CBT";
  titleCell.font = { name: "Segoe UI", size: 16, bold: true, color: { argb: "FF0F172A" } };
  titleCell.alignment = { vertical: "middle", horizontal: "left" };

  wsScores.mergeCells("A2:K2");
  const subCell = wsScores.getCell("A2");
  subCell.value = `Ujian: ${exam.title} | Mapel: ${exam.subject_name || "-"} | Bank Soal: ${exam.bank_title || "-"}`;
  subCell.font = { name: "Segoe UI", size: 11, bold: false, color: { argb: "FF475569" } };

  wsScores.mergeCells("A3:K3");
  const dateCell = wsScores.getCell("A3");
  dateCell.value = `Durasi: ${exam.duration_minutes} Menit | Waktu Mulai: ${formatDateIndo(exam.start_time)} | Dicetak: ${formatDateIndo(new Date().toISOString())}`;
  dateCell.font = { name: "Segoe UI", size: 9, italic: true, color: { argb: "FF64748B" } };

  wsScores.addRow([]); // Row 4 spacer

  // Table Headers
  const scoreHeaders = [
    "No",
    "No. Ujian",
    "NISN",
    "Nama Lengkap Siswa",
    "Kelas",
    "Status Ujian",
    "Jml Benar",
    "Total Soal",
    "Nilai Akhir",
    "Keterangan",
    "Waktu Selesai"
  ];
  const headerRow = wsScores.addRow(scoreHeaders);
  headerRow.height = 28;

  headerRow.eachCell((cell) => {
    cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = headerBorder;
  });

  // Table Columns Width
  wsScores.columns = [
    { key: "no", width: 6 },
    { key: "exam_number", width: 18 },
    { key: "nisn", width: 16 },
    { key: "name", width: 32 },
    { key: "class_name", width: 16 },
    { key: "status", width: 20 },
    { key: "correct_count", width: 12 },
    { key: "total_questions", width: 12 },
    { key: "score", width: 14 },
    { key: "status_kkm", width: 16 },
    { key: "finished_at", width: 20 }
  ];

  // Data rows
  results.forEach((res, idx) => {
    const isPass = res.score >= 75.0;
    const isCompleted = res.status === "selesai";

    const row = wsScores.addRow([
      idx + 1,
      res.exam_number,
      res.nisn || "-",
      res.name,
      res.class_name || "-",
      isCompleted ? "SELESAI" : res.status === "sedang_mengerjakan" ? "SEDANG MENGERJAKAN" : "BELUM MULAI",
      res.correct_count,
      res.total_questions || exam.total_questions || 0,
      res.score,
      isPass ? "TUNTAS (>=75)" : "BELUM TUNTAS",
      formatDateIndo(res.finished_at)
    ]);
    row.height = 22;

    const isEven = idx % 2 === 1;
    row.eachCell((cell, colNum) => {
      cell.font = { name: "Segoe UI", size: 9.5 };
      cell.border = thinBorder;
      cell.alignment = { vertical: "middle" };

      if (isEven) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
      }

      // Center alignments
      if ([1, 2, 3, 5, 6, 7, 8, 10, 11].includes(colNum)) {
        cell.alignment = { vertical: "middle", horizontal: "center" };
      }

      // Score column formatting
      if (colNum === 9) {
        cell.numFmt = "0.00";
        cell.alignment = { vertical: "middle", horizontal: "right" };
        cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: isPass ? "FF166534" : "FF991B1B" } };
      }

      // Keterangan status KKM color
      if (colNum === 10) {
        cell.font = { name: "Segoe UI", size: 9, bold: true, color: { argb: isPass ? "FF15803D" : "FFB91C1C" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: isPass ? "FFDCFCE7" : "FFFEE2E2" } };
      }
    });
  });

  // Summary Statistical Rows
  const startRow = 6;
  const endRow = 5 + results.length;
  if (results.length > 0) {
    wsScores.addRow([]); // Blank line

    const avgRow = wsScores.addRow([
      "", "", "", "", "", "Rata-rata Nilai", "", "",
      { formula: `AVERAGE(I${startRow}:I${endRow})` }, "", ""
    ]);
    avgRow.getCell(6).font = { name: "Segoe UI", size: 10, bold: true };
    avgRow.getCell(9).font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF1D4ED8" } };
    avgRow.getCell(9).numFmt = "0.00";

    const maxRow = wsScores.addRow([
      "", "", "", "", "", "Nilai Tertinggi", "", "",
      { formula: `MAX(I${startRow}:I${endRow})` }, "", ""
    ]);
    maxRow.getCell(6).font = { name: "Segoe UI", size: 10, bold: true };
    maxRow.getCell(9).font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF15803D" } };
    maxRow.getCell(9).numFmt = "0.00";

    const minRow = wsScores.addRow([
      "", "", "", "", "", "Nilai Terendah", "", "",
      { formula: `MIN(I${startRow}:I${endRow})` }, "", ""
    ]);
    minRow.getCell(6).font = { name: "Segoe UI", size: 10, bold: true };
    minRow.getCell(9).font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFB91C1C" } };
    minRow.getCell(9).numFmt = "0.00";
  }

  // =========================================================================
  // SHEET 2: ANALISIS BUTIR SOAL (ITEM ANALYSIS & DISCRIMINATION)
  // =========================================================================
  const wsAnalysis = workbook.addWorksheet("Analisis Butir Soal", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 5 }]
  });

  // Title
  wsAnalysis.mergeCells("A1:N1");
  const aTitle = wsAnalysis.getCell("A1");
  aTitle.value = "ANALISIS BUTIR SOAL, TINGKAT KESUKARAN (P), & DAYA PEMBEDA (D)";
  aTitle.font = { name: "Segoe UI", size: 15, bold: true, color: { argb: "FF0F172A" } };

  wsAnalysis.mergeCells("A2:N2");
  const aSub = wsAnalysis.getCell("A2");
  aSub.value = `Ujian: ${exam.title} | Metode: 27% Upper-Lower Group Klasik | Jumlah Butir: ${itemAnalysis.length}`;
  aSub.font = { name: "Segoe UI", size: 10.5, color: { argb: "FF475569" } };

  wsAnalysis.addRow([]); // Blank spacer

  const analysisHeaders = [
    "No",
    "Tipe Soal",
    "Teks Soal (Ringkasan)",
    "Kunci",
    "Responden",
    "Jml Benar",
    "Indeks P",
    "Tingkat Kesukaran",
    "Indeks D",
    "Daya Pembeda",
    "Pil A",
    "Pil B",
    "Pil C",
    "Pil D",
    "Pil E"
  ];

  const aHeaderRow = wsAnalysis.addRow(analysisHeaders);
  aHeaderRow.height = 28;
  aHeaderRow.eachCell((cell) => {
    cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = headerBorder;
  });

  wsAnalysis.columns = [
    { key: "no", width: 6 },
    { key: "q_type", width: 14 },
    { key: "text", width: 45 },
    { key: "key", width: 10 },
    { key: "respondents", width: 12 },
    { key: "correct", width: 12 },
    { key: "p_val", width: 12 },
    { key: "p_label", width: 18 },
    { key: "d_val", width: 12 },
    { key: "d_label", width: 18 },
    { key: "opt_a", width: 9 },
    { key: "opt_b", width: 9 },
    { key: "opt_c", width: 9 },
    { key: "opt_d", width: 9 },
    { key: "opt_e", width: 9 }
  ];

  itemAnalysis.forEach((it, idx) => {
    // Strip HTML/markdown for excel preview
    const cleanText = it.question_text.replace(/<[^>]*>?/gm, "").slice(0, 100);

    const dist = it.option_distribution || {};
    const row = wsAnalysis.addRow([
      it.sort_order || idx + 1,
      it.question_type.toUpperCase(),
      cleanText,
      it.correct_answer || "-",
      it.total_respondents,
      it.correct_count,
      it.difficulty_index,
      it.difficulty_label,
      it.discrimination_index,
      it.discrimination_label,
      dist["A"] || 0,
      dist["B"] || 0,
      dist["C"] || 0,
      dist["D"] || 0,
      dist["E"] || 0
    ]);
    row.height = 24;

    const isEven = idx % 2 === 1;
    row.eachCell((cell, colNum) => {
      cell.font = { name: "Segoe UI", size: 9.5 };
      cell.border = thinBorder;
      cell.alignment = { vertical: "middle" };

      if (isEven) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
      }

      // Center for numeric / badge cols
      if ([1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].includes(colNum)) {
        cell.alignment = { vertical: "middle", horizontal: "center" };
      }

      // Tingkat Kesukaran badge color
      if (colNum === 8) {
        if (it.difficulty_label === "Mudah") {
          cell.font = { name: "Segoe UI", size: 9, bold: true, color: { argb: "FF15803D" } };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCFCE7" } };
        } else if (it.difficulty_label === "Sedang") {
          cell.font = { name: "Segoe UI", size: 9, bold: true, color: { argb: "FFA16207" } };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF9C3" } };
        } else {
          cell.font = { name: "Segoe UI", size: 9, bold: true, color: { argb: "FFB91C1C" } };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } };
        }
      }

      // Daya Pembeda badge color
      if (colNum === 10) {
        if (it.discrimination_label === "Sangat Baik" || it.discrimination_label === "Baik") {
          cell.font = { name: "Segoe UI", size: 9, bold: true, color: { argb: "FF15803D" } };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCFCE7" } };
        } else if (it.discrimination_label === "Cukup") {
          cell.font = { name: "Segoe UI", size: 9, bold: true, color: { argb: "FF1D4ED8" } };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDBEAFE" } };
        } else {
          cell.font = { name: "Segoe UI", size: 9, bold: true, color: { argb: "FF991B1B" } };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } };
        }
      }
    });
  });

  // =========================================================================
  // DOWNLOAD TRIGGER
  // =========================================================================
  const safeTitle = (exam.title || "Ujian").replace(/[/\\?%*:|"<>]/g, "_");
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `Hasil_CBT_${safeTitle}_${dateStr}.xlsx`;

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
