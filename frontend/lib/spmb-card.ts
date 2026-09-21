import type { SpmbRegistration } from "@/types/content";

type TextOptions = {
  size?: number;
  font?: "regular" | "bold";
  color?: string;
};

function toPdfSafeText(value: string): string {
  return (value || "-")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function text(x: number, y: number, value: string, options: TextOptions = {}): string {
  const size = options.size || 9;
  const font = options.font === "bold" ? "F2" : "F1";
  return `BT\n${fillColor(options.color || "111827")}\n/${font} ${size} Tf\n1 0 0 1 ${x} ${y} Tm\n(${toPdfSafeText(value)}) Tj\nET`;
}

function rect(x: number, y: number, width: number, height: number, fill: string): string {
  return `q\n${fillColor(fill)}\n${x} ${y} ${width} ${height} re f\nQ`;
}

function strokeRect(x: number, y: number, width: number, height: number, stroke: string, lineWidth = 1): string {
  return `q\n${strokeColor(stroke)}\n${lineWidth} w\n${x} ${y} ${width} ${height} re S\nQ`;
}

function line(x1: number, y1: number, x2: number, y2: number, stroke: string, lineWidth = 1): string {
  return `q\n${strokeColor(stroke)}\n${lineWidth} w\n${x1} ${y1} m ${x2} ${y2} l S\nQ`;
}

function rgb(hex: string): string {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;
  return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)}`;
}

function fillColor(hex: string): string {
  return `${rgb(hex)} rg`;
}

function strokeColor(hex: string): string {
  return `${rgb(hex)} RG`;
}

function field(label: string, value: string, x: number, y: number, width = 240, height = 34): string {
  return [
    rect(x, y - 6, width, height, "F9FAFB"),
    strokeRect(x, y - 6, width, height, "E5E7EB", 0.75),
    text(x + 8, y + 18, label.toUpperCase(), { size: 6.5, font: "bold", color: "6B7280" }),
    text(x + 8, y + 4, value || "-", { size: 8.5, font: "bold", color: "111827" })
  ].join("\n");
}

function wrapText(value: string, maxLength: number): string[] {
  const words = (value || "-").split(/\s+/);
  const rows: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength && current) {
      rows.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) {
    rows.push(current);
  }
  return rows.slice(0, 3);
}

export function createSpmbCardPdfBlob(registration: SpmbRegistration): Blob {
  const formattedAddress = [
    registration.currentAddress,
    registration.district ? `Kec. ${registration.district}` : "",
    registration.city,
    registration.province
  ]
    .filter(Boolean)
    .join(", ");

  const addressRows = wrapText(formattedAddress, 65);

  const createdDate = registration.createdAt
    ? new Date(registration.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })
    : new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });

  const commands = [
    // Background Canvas
    rect(0, 0, 595, 842, "FFFFFF"),

    // Outer Frame Border
    strokeRect(28, 28, 539, 786, "D1D5DB", 1),
    strokeRect(30, 30, 535, 782, "E5E7EB", 0.5),

    // Top Brand Accent Bar (Telkom Red)
    rect(30, 804, 535, 8, "E11D48"),

    // ==========================================
    // KOP SURAT RESMI
    // ==========================================
    text(45, 782, "YAYASAN PENDIDIKAN TELKOM (YPT)", { size: 9, font: "bold", color: "4B5563" }),
    text(45, 764, "SMK TELKOM LAMPUNG", { size: 17, font: "bold", color: "BE123C" }),
    text(45, 750, "TERAKREDITASI 'A' • NPSN: 69947477 • KODE SEKOLAH: 1803001", { size: 7.5, font: "bold", color: "374151" }),
    text(45, 739, "Alamat Kampus: Jl. Raya Gadingrejo No. 272, Pringsewu / Natar, Lampung", { size: 7, color: "6B7280" }),
    text(45, 729, "Website: https://smktelkom-lpg.sch.id • Helpdesk SPMB: 0811-799-8800", { size: 7, color: "6B7280" }),

    // Kop Double Line
    line(45, 722, 550, 722, "111827", 1.5),
    line(45, 719, 550, 719, "9CA3AF", 0.5),

    // ==========================================
    // JUDUL KARTU & BADGE REGISTRASI
    // ==========================================
    rect(45, 664, 320, 46, "F9FAFB"),
    strokeRect(45, 664, 320, 46, "E5E7EB", 1),
    text(55, 696, "KARTU TANDA BUKTI PENDAFTARAN", { size: 11, font: "bold", color: "111827" }),
    text(55, 683, `SISTEM PENERIMAAN MURID BARU (SPMB) T.A. ${registration.academicYear}`, { size: 8, font: "bold", color: "BE123C" }),
    text(55, 672, `Tanggal Pendaftaran: ${createdDate}`, { size: 7.5, color: "4B5563" }),

    // Box Nomor Pendaftaran
    rect(375, 664, 175, 46, "111827"),
    rect(375, 664, 5, 46, "E11D48"),
    text(388, 696, "NOMOR REGISTRASI", { size: 6.5, font: "bold", color: "9CA3AF" }),
    text(388, 679, registration.registrationNumber, { size: 12, font: "bold", color: "FFFFFF" }),
    text(388, 669, `Jalur: ${registration.registrationTrack || "Reguler"}`, { size: 7.5, font: "bold", color: "FCA5A5" }),

    // ==========================================
    // A. DATA DIRI CALON SISWA
    // ==========================================
    rect(45, 642, 505, 18, "F3F4F6"),
    text(55, 647, "A. IDENTITAS CALON SISWA", { size: 8, font: "bold", color: "111827" }),

    field("Nama Lengkap Siswa", registration.fullName, 45, 602, 248),
    field("Jenjang Kelas Saat Mendaftar", registration.classGrade, 302, 602, 248),

    field("NIK Calon Siswa", registration.nik, 45, 562, 120),
    field("NISN Siswa", registration.nisn, 173, 562, 120),
    field("Jenis Kelamin", registration.gender, 302, 562, 120),
    field("Agama", registration.religion, 430, 562, 120),

    field("Tanggal Lahir", registration.birthDate, 45, 522, 120),
    field("Nomor WhatsApp / HP", registration.whatsappNumber, 173, 522, 120),
    field("Alamat Email Aktif", registration.email, 302, 522, 248),

    // ==========================================
    // B. KOMPETENSI KEAHLIAN & ASAL SEKOLAH
    // ==========================================
    rect(45, 496, 505, 18, "F3F4F6"),
    text(55, 501, "B. PILIHAN JURUSAN & SEKOLAH ASAL", { size: 8, font: "bold", color: "111827" }),

    field("Kompetensi Keahlian (Pilihan Jurusan)", registration.selectedMajorName, 45, 456, 320),
    field("Prioritas Pilihan", registration.choicePriority || "Pilihan Utama", 373, 456, 177),

    field("Asal Sekolah", registration.previousSchool, 45, 416, 248),
    field("Naungan & Tipe Sekolah", `${registration.schoolType || "SMP"} (${registration.ministry || "Kemdikbud"})`, 302, 416, 248),

    field("Alamat Lengkap Asal Sekolah", registration.previousSchoolAddress, 45, 376, 505),

    // ==========================================
    // C. DATA ORANG TUA / WALI & ALAMAT
    // ==========================================
    rect(45, 350, 505, 18, "F3F4F6"),
    text(55, 355, "C. DATA ORANG TUA / WALI & ALAMAT RUMAH", { size: 8, font: "bold", color: "111827" }),

    field("Nama Ayah / Wali", `${registration.fatherName || "-"} (${registration.fatherOccupation || "-"})`, 45, 310, 248),
    field("Nomor Telepon Ayah", registration.fatherPhone || "-", 302, 310, 248),

    field("Nama Ibu / Wali", `${registration.motherName || "-"} (${registration.motherOccupation || "-"})`, 45, 270, 248),
    field("Nomor Telepon Ibu", registration.motherPhone || "-", 302, 270, 248),

    // Alamat Rumah
    rect(45, 218, 505, 44, "F9FAFB"),
    strokeRect(45, 218, 505, 44, "E5E7EB", 0.75),
    text(53, 250, "ALAMAT TEMPAT TINGGAL LENGKAP SISWA", { size: 6.5, font: "bold", color: "6B7280" }),
    ...addressRows.map((r, i) => text(53, 238 - i * 11, r, { size: 8, font: i === 0 ? "bold" : "regular", color: "111827" })),

    // ==========================================
    // D. PETUNJUK VERIFIKASI & DAFTAR ULANG
    // ==========================================
    rect(45, 138, 505, 72, "FEF2F2"),
    strokeRect(45, 138, 505, 72, "FECDD3", 1),
    text(55, 196, "PETUNJUK BAGI CALON SISWA & ORANG TUA / WALI:", { size: 7.5, font: "bold", color: "991B1B" }),
    text(55, 184, "1. Simpan dan bawa cetakan Kartu Bukti Pendaftaran ini saat verifikasi berkas fisik atau tes seleksi di sekolah.", { size: 7, color: "1F2937" }),
    text(55, 173, "2. Siapkan dokumen asli dan fotokopi: Akta Kelahiran, Kartu Keluarga, Rapor/Ijazah, dan Sertifikat Prestasi (jika ada).", { size: 7, color: "1F2937" }),
    text(55, 162, "3. Mengenakan seragam sekolah asal lengkap, rapi, dan bersepatu saat hadir ke kampus SMK Telkom Lampung.", { size: 7, color: "1F2937" }),
    text(55, 151, "4. Informasi kelulusan & jadwal tes dapat dipantau di web.smktelkom-lpg.id atau Helpdesk SPMB: 0811-799-8800.", { size: 7, color: "1F2937" }),

    // ==========================================
    // TANDA TANGAN RESMI
    // ==========================================
    text(70, 118, "Calon Siswa / Orang Tua / Wali,", { size: 7.5, font: "bold", color: "374151" }),
    line(55, 62, 195, 62, "9CA3AF", 0.75),
    text(70, 52, `( ${registration.fullName.slice(0, 22)} )`, { size: 7, font: "bold", color: "111827" }),

    text(375, 126, `Lampung, ${createdDate}`, { size: 7, color: "4B5563" }),
    text(375, 116, "Panitia Pelaksana SPMB,", { size: 7.5, font: "bold", color: "374151" }),
    strokeRect(390, 72, 70, 28, "FCA5A5", 0.5),
    text(400, 84, "CAP RESMI SPMB", { size: 6, font: "bold", color: "EF4444" }),
    line(355, 62, 515, 62, "9CA3AF", 0.75),
    text(370, 52, "( Panitia Penerimaan Murid Baru )", { size: 7, font: "bold", color: "111827" }),

    // Footer Watermark
    text(45, 36, "Dokumen resmi dicetak secara elektronik melalui Portal SPMB SMK Telkom Lampung. Sah tanpa legalisir basah awal.", { size: 6, color: "9CA3AF" })
  ];

  const stream = commands.join("\n");
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj",
    `6 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  }
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index <= objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}

export function downloadSpmbCardPdf(registration: SpmbRegistration): void {
  const blob = createSpmbCardPdfBlob(registration);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `kartu-spmb-${registration.registrationNumber}.pdf`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export function printSpmbCardPdf(registration: SpmbRegistration): void {
  const blob = createSpmbCardPdfBlob(registration);
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, "_blank", "noopener,noreferrer");
  if (printWindow) {
    printWindow.addEventListener("load", () => printWindow.print(), { once: true });
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
}
