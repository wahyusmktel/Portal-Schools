import type { SpmbRegistration } from "@/types/content";
import { KOP_SMK_TELKOM_BASE64 } from "@/lib/spmb-kop-base64";

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

function tableRow2Col(y: number, l1: string, v1: string, l2: string, v2: string, h = 22): string {
  return [
    strokeRect(40, y, 515, h, "D1D5DB", 0.75),
    rect(40, y, 110, h, "F9FAFB"),
    line(150, y, 150, y + h, "D1D5DB", 0.75),
    text(46, y + 6, l1, { size: 7.5, font: "bold", color: "4B5563" }),
    text(156, y + 6, String(v1 || "-").slice(0, 28), { size: 8, font: "bold", color: "111827" }),
    line(297.5, y, 297.5, y + h, "D1D5DB", 0.75),
    rect(297.5, y, 110, h, "F9FAFB"),
    line(407.5, y, 407.5, y + h, "D1D5DB", 0.75),
    text(303.5, y + 6, l2, { size: 7.5, font: "bold", color: "4B5563" }),
    text(413.5, y + 6, String(v2 || "-").slice(0, 28), { size: 8, font: "bold", color: "111827" })
  ].join("\n");
}

function tableRowFull(y: number, label: string, val: string, h = 22): string {
  return [
    strokeRect(40, y, 515, h, "D1D5DB", 0.75),
    rect(40, y, 110, h, "F9FAFB"),
    line(150, y, 150, y + h, "D1D5DB", 0.75),
    text(46, y + 6, label, { size: 7.5, font: "bold", color: "4B5563" }),
    text(156, y + 6, String(val || "-").slice(0, 75), { size: 8, font: "bold", color: "111827" })
  ].join("\n");
}

function categoryRow(y: number, title: string, h = 18): string {
  return [
    rect(40, y, 515, h, "E5E7EB"),
    strokeRect(40, y, 515, h, "9CA3AF", 0.75),
    text(48, y + 5, title, { size: 8, font: "bold", color: "111827" })
  ].join("\n");
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = typeof window !== "undefined" ? window.atob(base64) : Buffer.from(base64, "base64").toString("binary");
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function createSpmbCardPdfBlob(registration: SpmbRegistration): Blob {
  const createdDate = registration.createdAt
    ? new Date(registration.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })
    : new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });

  const imageWidth = 1024;
  const imageHeight = 178;
  const kopHeight = 595 * (imageHeight / imageWidth); // 103.41 pt
  const kopY = 842 - kopHeight; // Flush to top (738.59 pt)

  const commands = [
    // Background Canvas
    rect(0, 0, 595, 842, "FFFFFF"),

    // 1. KOP SURAT (0 MARGIN ATAS, KANAN, KIRI)
    `q\n595 0 0 ${kopHeight.toFixed(2)} 0 ${kopY.toFixed(2)} cm\n/Im1 Do\nQ`,

    // 2. JUDUL KARTU & BADGE REGISTRASI (y = 692, h = 36)
    rect(40, 692, 515, 36, "F9FAFB"),
    strokeRect(40, 692, 515, 36, "D1D5DB", 1),
    text(48, 714, "KARTU TANDA BUKTI PENDAFTARAN RESMI (TERAKREDITASI A)", { size: 9.5, font: "bold", color: "111827" }),
    text(48, 701, "SISTEM PENERIMAAN MURID BARU TAHUN PELAJARAN 2027/2028", { size: 7.5, font: "bold", color: "BE123C" }),

    // Box Nomor Pendaftaran
    rect(350, 692, 205, 36, "111827"),
    text(360, 714, "NO. REGISTRASI:", { size: 7, font: "bold", color: "9CA3AF" }),
    text(435, 713, registration.registrationNumber, { size: 10, font: "bold", color: "FFFFFF" }),
    text(360, 701, `Jalur: ${registration.registrationTrack || "Reguler"} • ${createdDate}`, { size: 7, font: "bold", color: "FCA5A5" }),

    // 3. TABEL: A. IDENTITAS CALON SISWA
    categoryRow(666, "A. IDENTITAS CALON SISWA"),
    tableRow2Col(644, "Nama Lengkap", registration.fullName, "Jenjang Saat Daftar", registration.classGrade || "Kelas 9 SMP/Sederajat"),
    tableRow2Col(622, "NIK Calon Siswa", registration.nik, "NISN Siswa", registration.nisn),
    tableRow2Col(600, "Jenis Kelamin", registration.gender, "Agama", registration.religion),
    tableRow2Col(578, "Tanggal Lahir", registration.birthDate, "No. WhatsApp / HP", registration.whatsappNumber),
    tableRowFull(556, "Alamat Email", registration.email),

    // 4. TABEL: B. PILIHAN JURUSAN, ASRAMA & ASAL SEKOLAH
    categoryRow(530, "B. KOMPETENSI KEAHLIAN, ASRAMA & ASAL SEKOLAH"),
    tableRow2Col(508, "Pilihan Jurusan", registration.selectedMajorName, "Prioritas Pilihan", registration.choicePriority || "Pilihan Utama"),
    tableRow2Col(486, "Nama Asal Sekolah", registration.previousSchool, "Fasilitas Asrama", registration.dormitoryOption === "Ya" ? "Ya (Boarding)" : "Tidak (Non-Asrama)"),
    tableRowFull(464, "Alamat Sekolah Asal", registration.previousSchoolAddress),

    // 5. TABEL: C. DATA ORANG TUA / WALI & ALAMAT DOMISILI
    categoryRow(438, "C. DATA ORANG TUA / WALI & ALAMAT DOMISILI"),
    tableRow2Col(416, "Nama Ayah / Wali", `${registration.fatherName || "-"} (${registration.fatherOccupation || "-"})`, "No. Telepon Ayah", registration.fatherPhone || "-"),
    tableRow2Col(394, "Nama Ibu / Wali", `${registration.motherName || "-"} (${registration.motherOccupation || "-"})`, "No. Telepon Ibu", registration.motherPhone || "-"),
    tableRowFull(372, "Alamat Rumah", registration.currentAddress),
    tableRow2Col(350, "Kecamatan", registration.district ? `Kec. ${registration.district}` : "-", "Kabupaten / Kota", `${registration.city || "-"} (${registration.province || "-"})`),

    // 6. TABEL: D. AKUN TES SELEKSI TPA & AGENDA SELEKSI RESMI
    categoryRow(324, "D. AKUN TES SELEKSI TPA & AGENDA SELEKSI RESMI"),
    rect(40, 236, 515, 84, "F8FAFC"),
    strokeRect(40, 236, 515, 84, "CBD5E1", 0.75),

    // Sub-Box Kiri: Akun TPA Online
    rect(48, 242, 230, 72, "EFF6FF"),
    strokeRect(48, 242, 230, 72, "BFDBFE", 0.75),
    text(56, 302, "AKUN TES POTENSI AKADEMIK (TPA ONLINE):", { size: 7.5, font: "bold", color: "1E40AF" }),
    text(56, 289, `Username : ${registration.registrationNumber}`, { size: 8, font: "bold", color: "1E293B" }),
    text(56, 276, `Password : TPA-${registration.registrationNumber.slice(-4) || "2027"}`, { size: 8, font: "bold", color: "1E293B" }),
    text(56, 263, "Portal Ujian : cbt.smktelkom-lpg.sch.id", { size: 7, font: "bold", color: "2563EB" }),
    text(56, 250, "*Simpan akun di atas untuk login tes seleksi TPA.", { size: 6, color: "64748B" }),

    // Sub-Box Kanan: 4 Agenda Tes Seleksi
    rect(286, 242, 261, 72, "FEF2F2"),
    strokeRect(286, 242, 261, 72, "FECDD3", 0.75),
    text(294, 302, "AGENDA & TAHAPAN TES SELEKSI MASUK:", { size: 7.5, font: "bold", color: "991B1B" }),
    text(294, 290, "1. Wawancara (Orang Tua & Calon Siswa)", { size: 7, font: "bold", color: "1F2937" }),
    text(294, 279, "2. Tes Mengaji / Baca Tulis Al-Qur'an", { size: 7, font: "bold", color: "1F2937" }),
    text(294, 268, "3. Tes Buta Warna & Pemeriksaan Fisik", { size: 7, font: "bold", color: "1F2937" }),
    text(294, 257, "4. Tes Potensi Akademik (TPA Online)", { size: 7, font: "bold", color: "1F2937" }),
    text(294, 247, "*Wajib hadir rapi berseragam & membawa fotokopi berkas legalisir.", { size: 5.5, color: "64748B" }),

    // 7. TANDA TANGAN
    text(65, 216, "Calon Siswa / Orang Tua / Wali,", { size: 7.5, font: "bold", color: "374151" }),
    line(50, 150, 200, 150, "9CA3AF", 0.75),
    text(65, 138, `( ${registration.fullName.slice(0, 28)} )`, { size: 7, font: "bold", color: "111827" }),

    text(375, 224, `Pringsewu, ${createdDate}`, { size: 7, color: "4B5563" }),
    text(375, 216, "Panitia Pelaksana SPMB,", { size: 7.5, font: "bold", color: "374151" }),
    line(355, 150, 515, 150, "9CA3AF", 0.75),
    text(370, 138, "( Panitia Penerimaan Murid Baru )", { size: 7, font: "bold", color: "111827" }),

    // Footer Watermark
    text(40, 110, "Dokumen resmi dicetak secara elektronik melalui Portal SPMB SMK Telkom Lampung (Terakreditasi A). Sah tanpa legalisir basah awal.", { size: 6, color: "9CA3AF" })
  ];

  const streamContent = commands.join("\n");
  const encoder = new TextEncoder();
  const streamBytes = encoder.encode(streamContent);
  const jpgBytes = base64ToUint8Array(KOP_SMK_TELKOM_BASE64);

  // PDF Structure:
  // 1: Catalog, 2: Pages, 3: Page, 4: Font F1, 5: Font F2, 6: Content Stream, 7: Image XObject
  const obj1 = "<< /Type /Catalog /Pages 2 0 R >>";
  const obj2 = "<< /Type /Pages /Kids [3 0 R] /Count 1 >>";
  const obj3 = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> /XObject << /Im1 7 0 R >> >> /Contents 6 0 R >>";
  const obj4 = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  const obj5 = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";
  const obj6Header = `<< /Length ${streamBytes.length} >>\nstream\n`;
  const obj6Footer = `\nendstream`;
  const obj7Header = `<< /Type /XObject /Subtype /Image /Width ${imageWidth} /Height ${imageHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpgBytes.length} >>\nstream\n`;
  const obj7Footer = `\nendstream`;

  // Calculate byte offsets accurately
  let currentOffset = 0;
  const offsets: number[] = [];

  function recordOffset(len: number) {
    offsets.push(currentOffset);
    currentOffset += len;
  }

  // Header: %PDF-1.4\n
  const pdfHeader = "%PDF-1.4\n";
  currentOffset += pdfHeader.length;

  // Obj 1
  const bObj1 = `1 0 obj\n${obj1}\nendobj\n`;
  recordOffset(encoder.encode(bObj1).length);

  // Obj 2
  const bObj2 = `2 0 obj\n${obj2}\nendobj\n`;
  recordOffset(encoder.encode(bObj2).length);

  // Obj 3
  const bObj3 = `3 0 obj\n${obj3}\nendobj\n`;
  recordOffset(encoder.encode(bObj3).length);

  // Obj 4
  const bObj4 = `4 0 obj\n${obj4}\nendobj\n`;
  recordOffset(encoder.encode(bObj4).length);

  // Obj 5
  const bObj5 = `5 0 obj\n${obj5}\nendobj\n`;
  recordOffset(encoder.encode(bObj5).length);

  // Obj 6
  const bObj6Prefix = `6 0 obj\n${obj6Header}`;
  const bObj6Suffix = `${obj6Footer}\nendobj\n`;
  const bObj6Len = encoder.encode(bObj6Prefix).length + streamBytes.length + encoder.encode(bObj6Suffix).length;
  recordOffset(bObj6Len);

  // Obj 7 (Image)
  const bObj7Prefix = `7 0 obj\n${obj7Header}`;
  const bObj7Suffix = `${obj7Footer}\nendobj\n`;
  const bObj7Len = encoder.encode(bObj7Prefix).length + jpgBytes.length + encoder.encode(bObj7Suffix).length;
  recordOffset(bObj7Len);

  // XRef Table
  const startXref = currentOffset;
  let xref = `xref\n0 8\n0000000000 65535 f \n`;
  for (let i = 0; i < 7; i++) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  xref += `trailer\n<< /Size 8 /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF`;

  // Assembling all chunks into final Blob
  const blobParts: BlobPart[] = [
    pdfHeader,
    bObj1,
    bObj2,
    bObj3,
    bObj4,
    bObj5,
    bObj6Prefix,
    streamBytes as unknown as BlobPart,
    bObj6Suffix,
    bObj7Prefix,
    jpgBytes as unknown as BlobPart,
    bObj7Suffix,
    xref
  ];

  return new Blob(blobParts, { type: "application/pdf" });
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
