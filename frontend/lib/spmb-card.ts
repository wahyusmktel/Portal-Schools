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

function field(label: string, value: string, x: number, y: number, width = 255, height = 34): string {
  return [
    rect(x, y - 6, width, height, "F9FAFB"),
    strokeRect(x, y - 6, width, height, "E5E7EB", 0.75),
    text(x + 8, y + 18, label.toUpperCase(), { size: 6.5, font: "bold", color: "6B7280" }),
    text(x + 8, y + 4, String(value || "-").slice(0, 48), { size: 8.5, font: "bold", color: "111827" })
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

  const imageWidth = 1024;
  const imageHeight = 178;
  const kopHeight = 595 * (imageHeight / imageWidth); // 103.41 pt
  const kopY = 842 - kopHeight; // Flush to top (738.59 pt)

  const commands = [
    // Background Canvas
    rect(0, 0, 595, 842, "FFFFFF"),

    // 1. KOP SURAT (0 MARGIN ATAS, KANAN, KIRI)
    `q\n595 0 0 ${kopHeight.toFixed(2)} 0 ${kopY.toFixed(2)} cm\n/Im1 Do\nQ`,

    // Outer frame boundary below the Kop Surat
    strokeRect(30, 25, 535, 705, "E5E7EB", 1),

    // 2. JUDUL KARTU & BADGE REGISTRASI (y = 668)
    rect(45, 668, 335, 46, "F9FAFB"),
    strokeRect(45, 668, 335, 46, "E5E7EB", 1),
    text(55, 700, "KARTU TANDA BUKTI PENDAFTARAN", { size: 11, font: "bold", color: "111827" }),
    text(55, 687, `SISTEM PENERIMAAN MURID BARU (SPMB) T.A. ${registration.academicYear}`, { size: 8, font: "bold", color: "BE123C" }),
    text(55, 676, `Tanggal Registrasi: ${createdDate}`, { size: 7.5, color: "4B5563" }),

    // Box Nomor Pendaftaran
    rect(390, 668, 160, 46, "111827"),
    rect(390, 668, 5, 46, "E11D48"),
    text(402, 700, "NOMOR REGISTRASI", { size: 6.5, font: "bold", color: "9CA3AF" }),
    text(402, 683, registration.registrationNumber, { size: 12, font: "bold", color: "FFFFFF" }),
    text(402, 673, `Jalur: ${registration.registrationTrack || "Reguler"}`, { size: 7.5, font: "bold", color: "FCA5A5" }),

    // 3. A. IDENTITAS CALON SISWA (y = 642)
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

    // 4. B. PILIHAN JURUSAN & ASAL SEKOLAH (y = 496)
    rect(45, 496, 505, 18, "F3F4F6"),
    text(55, 501, "B. PILIHAN JURUSAN & ASAL SEKOLAH", { size: 8, font: "bold", color: "111827" }),

    field("Kompetensi Keahlian (Pilihan Jurusan)", registration.selectedMajorName, 45, 456, 320),
    field("Prioritas Pilihan", registration.choicePriority || "Pilihan Utama", 373, 456, 177),

    field("Asal Sekolah", registration.previousSchool, 45, 416, 248),
    field("Naungan & Tipe Sekolah", `${registration.schoolType || "SMP"} (${registration.ministry || "Kemdikbud"})`, 302, 416, 248),

    field("Alamat Lengkap Asal Sekolah", registration.previousSchoolAddress, 45, 376, 505),

    // 5. C. DATA ORANG TUA / WALI & ALAMAT (y = 350)
    rect(45, 350, 505, 18, "F3F4F6"),
    text(55, 355, "C. DATA ORANG TUA / WALI & ALAMAT RUMAH", { size: 8, font: "bold", color: "111827" }),

    field("Nama Ayah / Wali", `${registration.fatherName || "-"} (${registration.fatherOccupation || "-"})`, 45, 310, 248),
    field("Nomor Telepon Ayah", registration.fatherPhone || "-", 302, 310, 248),

    field("Nama Ibu / Wali", `${registration.motherName || "-"} (${registration.motherOccupation || "-"})`, 45, 270, 248),
    field("Nomor Telepon Ibu", registration.motherPhone || "-", 302, 270, 248),

    // Alamat Rumah
    rect(45, 222, 505, 40, "F9FAFB"),
    strokeRect(45, 222, 505, 40, "E5E7EB", 0.75),
    text(53, 250, "ALAMAT TEMPAT TINGGAL LENGKAP SISWA", { size: 6.5, font: "bold", color: "6B7280" }),
    ...addressRows.map((r, i) => text(53, 238 - i * 11, r, { size: 8, font: i === 0 ? "bold" : "regular", color: "111827" })),

    // 6. D. PETUNJUK VERIFIKASI & DAFTAR ULANG (y = 144)
    rect(45, 144, 505, 70, "FEF2F2"),
    strokeRect(45, 144, 505, 70, "FECDD3", 1),
    text(55, 200, "PETUNJUK BAGI CALON SISWA & ORANG TUA / WALI:", { size: 7.5, font: "bold", color: "991B1B" }),
    text(55, 188, "1. Simpan dan bawa cetakan Kartu Bukti Pendaftaran ini saat verifikasi berkas fisik atau tes seleksi di sekolah.", { size: 7, color: "1F2937" }),
    text(55, 177, "2. Siapkan dokumen asli dan fotokopi: Akta Kelahiran, Kartu Keluarga, Rapor/Ijazah, dan Sertifikat Prestasi (jika ada).", { size: 7, color: "1F2937" }),
    text(55, 166, "3. Mengenakan seragam sekolah asal lengkap, rapi, dan bersepatu saat hadir ke kampus SMK Telkom Lampung.", { size: 7, color: "1F2937" }),
    text(55, 155, "4. Informasi kelulusan & jadwal tes dapat dipantau di web.smktelkom-lpg.sch.id atau Helpdesk SPMB: 0811-799-8800.", { size: 7, color: "1F2937" }),

    // 7. TANDA TANGAN RESMI (y = 120)
    text(70, 122, "Calon Siswa / Orang Tua / Wali,", { size: 7.5, font: "bold", color: "374151" }),
    line(55, 68, 195, 68, "9CA3AF", 0.75),
    text(70, 58, `( ${registration.fullName.slice(0, 22)} )`, { size: 7, font: "bold", color: "111827" }),

    text(375, 130, `Lampung, ${createdDate}`, { size: 7, color: "4B5563" }),
    text(375, 120, "Panitia Pelaksana SPMB,", { size: 7.5, font: "bold", color: "374151" }),
    strokeRect(390, 78, 70, 26, "FCA5A5", 0.5),
    text(398, 88, "CAP RESMI SPMB", { size: 6, font: "bold", color: "EF4444" }),
    line(355, 68, 515, 68, "9CA3AF", 0.75),
    text(370, 58, "( Panitia Penerimaan Murid Baru )", { size: 7, font: "bold", color: "111827" }),

    // Footer Watermark
    text(45, 34, "Dokumen resmi dicetak secara elektronik melalui Portal SPMB SMK Telkom Lampung. Sah tanpa legalisir basah awal.", { size: 6, color: "9CA3AF" })
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
