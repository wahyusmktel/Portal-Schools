import type { SpmbRegistration } from "@/types/content";

function escapePdfText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function line(label: string, value: string): string {
  return `${label}: ${value || "-"}`;
}

export function createSpmbCardPdfBlob(registration: SpmbRegistration): Blob {
  const lines = [
    "KARTU PENDAFTARAN SPMB",
    "SMK TELKOM LAMPUNG",
    line("Nomor Pendaftaran", registration.registrationNumber),
    line("Tahun Ajaran", registration.academicYear),
    line("Nama Lengkap", registration.fullName),
    line("Nomor WhatsApp", registration.whatsappNumber),
    line("Alamat", registration.currentAddress),
    line("Asal Sekolah", registration.previousSchool),
    line("Jurusan Pilihan", registration.selectedMajorName),
    line("Ayah", registration.fatherName),
    line("Ibu", registration.motherName),
    "",
    "Instruksi Daftar Ulang:",
    "1. Screenshot halaman konfirmasi pendaftaran.",
    "2. Datang ke SMK Telkom Lampung untuk daftar ulang.",
    "3. Tunjukkan screenshot atau kartu pendaftaran ini kepada petugas.",
    "",
    "Promo hari ini: Gratis biaya pendaftaran.",
    "Biaya daftar ulang: Rp. 500.000. Sisa biaya dapat dicicil."
  ];

  const textCommands = lines
    .map((item, index) => {
      const fontSize = index === 0 ? 18 : index === 1 ? 14 : 11;
      const y = 790 - index * 25;
      return `/F1 ${fontSize} Tf 1 0 0 1 54 ${y} Tm (${escapePdfText(item)}) Tj`;
    })
    .join("\n");

  const stream = `BT\n${textCommands}\nET`;
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`
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
