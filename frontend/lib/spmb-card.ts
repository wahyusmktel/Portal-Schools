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
  const size = options.size || 10;
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

function field(label: string, value: string, x: number, y: number, width = 238): string {
  return [
    rect(x, y - 10, width, 42, "F9FAFB"),
    strokeRect(x, y - 10, width, 42, "E5E7EB"),
    text(x + 12, y + 16, label.toUpperCase(), { size: 7, font: "bold", color: "6B7280" }),
    text(x + 12, y, value, { size: 10, font: "bold", color: "111827" })
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
  const addressRows = wrapText(registration.currentAddress, 56);
  const createdDate = registration.createdAt
    ? new Date(registration.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })
    : new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });

  const commands = [
    rect(0, 0, 595, 842, "F3F4F6"),
    rect(36, 42, 523, 758, "FFFFFF"),
    strokeRect(36, 42, 523, 758, "E5E7EB"),
    rect(36, 680, 523, 120, "111827"),
    rect(36, 680, 10, 120, "F43F6B"),
    text(62, 760, "KARTU PENDAFTARAN", { size: 22, font: "bold", color: "FFFFFF" }),
    text(62, 735, "SPMB SMK TELKOM LAMPUNG", { size: 13, font: "bold", color: "FBCFE8" }),
    text(62, 712, `Tahun Ajaran ${registration.academicYear}`, { size: 11, color: "E5E7EB" }),
    rect(360, 724, 166, 42, "FFFFFF"),
    text(374, 750, "NOMOR PENDAFTARAN", { size: 7, font: "bold", color: "6B7280" }),
    text(374, 733, registration.registrationNumber, { size: 12, font: "bold", color: "111827" }),

    text(62, 642, "DATA CALON SISWA", { size: 13, font: "bold", color: "111827" }),
    line(62, 630, 526, 630, "E5E7EB"),
    field("Nama lengkap", registration.fullName, 62, 584),
    field("Nomor WhatsApp", registration.whatsappNumber, 320, 584),
    field("Asal sekolah", registration.previousSchool, 62, 522),
    field("Jurusan pilihan", registration.selectedMajorName, 320, 522),
    field("Nama ayah", registration.fatherName, 62, 460),
    field("Nama ibu", registration.motherName, 320, 460),
    field("Sumber informasi", registration.infoSource, 62, 398),
    field("Tanggal daftar", createdDate, 320, 398),

    rect(62, 282, 464, 84, "F9FAFB"),
    strokeRect(62, 282, 464, 84, "E5E7EB"),
    text(74, 342, "ALAMAT RUMAH TINGGAL SEKARANG", { size: 7, font: "bold", color: "6B7280" }),
    ...addressRows.map((row, index) => text(74, 322 - index * 15, row, { size: 10, font: index === 0 ? "bold" : "regular", color: "111827" })),

    rect(62, 170, 218, 82, "FFF1F4"),
    strokeRect(62, 170, 218, 82, "FFE4EA"),
    text(76, 230, "PROMO HARI INI", { size: 9, font: "bold", color: "BE123F" }),
    text(76, 208, "Biaya pendaftaran: GRATIS", { size: 12, font: "bold", color: "111827" }),
    text(76, 189, "Daftar ulang: Rp. 500.000", { size: 10, font: "bold", color: "111827" }),
    text(76, 174, "Sisa biaya dapat dicicil.", { size: 9, color: "6B7280" }),

    rect(308, 170, 218, 82, "F0FDF4"),
    strokeRect(308, 170, 218, 82, "BBF7D0"),
    text(322, 230, "LANGKAH BERIKUTNYA", { size: 9, font: "bold", color: "166534" }),
    text(322, 208, "1. Screenshot halaman sukses.", { size: 9, color: "111827" }),
    text(322, 192, "2. Datang ke sekolah.", { size: 9, color: "111827" }),
    text(322, 176, "3. Tunjukkan kartu ini ke petugas.", { size: 9, color: "111827" }),

    line(62, 132, 526, 132, "E5E7EB"),
    text(62, 108, "Catatan: Kartu ini adalah bukti pendaftaran awal. Validasi akhir dilakukan saat daftar ulang di sekolah.", { size: 8, color: "6B7280" }),
    text(62, 82, "SMK Telkom Lampung - Sekolah teknologi untuk talenta digital masa depan.", { size: 9, font: "bold", color: "111827" })
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
