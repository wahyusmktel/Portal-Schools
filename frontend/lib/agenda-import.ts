import * as XLSX from "xlsx";

export type AgendaImportItem = {
  title: string;
  location: string;
  startsAt: string;
  endsAt: string;
  sourceRow: number;
  sourcePeriod: string;
};

export type AgendaImportResult = {
  items: AgendaImportItem[];
  errors: string[];
  sheetName: string;
};

const MONTHS: Record<string, number> = {
  jan: 0,
  januari: 0,
  feb: 1,
  februari: 1,
  mar: 2,
  maret: 2,
  apr: 3,
  april: 3,
  may: 4,
  mei: 4,
  jun: 5,
  juni: 5,
  jul: 6,
  juli: 6,
  aug: 7,
  agu: 7,
  agustus: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  okt: 9,
  oktober: 9,
  nov: 10,
  november: 10,
  dec: 11,
  des: 11,
  desember: 11
};

function normalize(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ");
}

function normalizeHeader(value: unknown) {
  return normalize(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function year(value: string) {
  const parsed = Number(value);
  return parsed < 100 ? 2000 + parsed : parsed;
}

function month(value: string) {
  return MONTHS[value.toLowerCase().replace(/\.$/, "")];
}

function validDate(yearValue: number, monthValue: number, day: number) {
  const date = new Date(yearValue, monthValue, day);
  return date.getFullYear() === yearValue && date.getMonth() === monthValue && date.getDate() === day;
}

function toIso(yearValue: number, monthValue: number, day: number) {
  return new Date(yearValue, monthValue, day, 0, 0, 0, 0).toISOString();
}

function endOfMonth(yearValue: number, monthValue: number) {
  return new Date(yearValue, monthValue + 1, 0).getDate();
}

export function parseAgendaPeriod(input: string): { startsAt: string; endsAt: string } | null {
  const value = normalize(input);
  let match: RegExpMatchArray | null;

  match = value.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{2,4})\s*-\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{2,4})$/i);
  if (match) {
    const startYear = year(match[3]);
    const endYear = year(match[6]);
    const startMonth = month(match[2]);
    const endMonth = month(match[5]);
    if (startMonth === undefined || endMonth === undefined || !validDate(startYear, startMonth, Number(match[1])) || !validDate(endYear, endMonth, Number(match[4]))) return null;
    return { startsAt: toIso(startYear, startMonth, Number(match[1])), endsAt: toIso(endYear, endMonth, Number(match[4])) };
  }

  match = value.match(/^(\d{1,2})\s+([A-Za-z]+)\s*-\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{2,4})$/i);
  if (match) {
    const endYear = year(match[5]);
    const startMonth = month(match[2]);
    const endMonth = month(match[4]);
    if (startMonth === undefined || endMonth === undefined) return null;
    const startYear = startMonth > endMonth ? endYear - 1 : endYear;
    if (!validDate(startYear, startMonth, Number(match[1])) || !validDate(endYear, endMonth, Number(match[3]))) return null;
    return { startsAt: toIso(startYear, startMonth, Number(match[1])), endsAt: toIso(endYear, endMonth, Number(match[3])) };
  }

  match = value.match(/^(\d{1,2})\s*-\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{2,4})$/i);
  if (match) {
    const parsedYear = year(match[4]);
    const parsedMonth = month(match[3]);
    if (parsedMonth === undefined || !validDate(parsedYear, parsedMonth, Number(match[1])) || !validDate(parsedYear, parsedMonth, Number(match[2]))) return null;
    return { startsAt: toIso(parsedYear, parsedMonth, Number(match[1])), endsAt: toIso(parsedYear, parsedMonth, Number(match[2])) };
  }

  match = value.match(/^([A-Za-z]+)\s*-\s*([A-Za-z]+)\s+(\d{2,4})$/i);
  if (match) {
    const endYear = year(match[3]);
    const startMonth = month(match[1]);
    const endMonth = month(match[2]);
    if (startMonth === undefined || endMonth === undefined) return null;
    const startYear = startMonth > endMonth ? endYear - 1 : endYear;
    return { startsAt: toIso(startYear, startMonth, 1), endsAt: toIso(endYear, endMonth, endOfMonth(endYear, endMonth)) };
  }

  match = value.match(/^(\d{1,2})[-\s]+([A-Za-z]+)[-\s]+(\d{2,4})$/i);
  if (match) {
    const parsedYear = year(match[3]);
    const parsedMonth = month(match[2]);
    const day = Number(match[1]);
    if (parsedMonth === undefined || !validDate(parsedYear, parsedMonth, day)) return null;
    const date = toIso(parsedYear, parsedMonth, day);
    return { startsAt: date, endsAt: date };
  }

  return null;
}

export async function parseAgendaWorkbook(file: File): Promise<AgendaImportResult> {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("Workbook tidak memiliki sheet.");

  const rows = XLSX.utils.sheet_to_json<(string | number)[]>(workbook.Sheets[sheetName], {
    header: 1,
    defval: "",
    raw: false
  });
  const headerIndex = rows.findIndex((row) => {
    const headers = row.map(normalizeHeader);
    return headers.some((cell) => cell.includes("tanggal") || cell.includes("periode")) && headers.some((cell) => cell.includes("kegiatan") || cell.includes("agenda"));
  });
  if (headerIndex < 0) throw new Error('Header "Tanggal / Periode" dan "Kegiatan / Agenda" tidak ditemukan.');

  const headers = rows[headerIndex].map(normalizeHeader);
  const periodIndex = headers.findIndex((cell) => cell.includes("tanggal") || cell.includes("periode"));
  const titleIndex = headers.findIndex((cell) => cell.includes("kegiatan") || cell.includes("agenda"));
  const locationIndex = headers.findIndex((cell) => cell.includes("lokasi") || cell.includes("tempat"));
  const items: AgendaImportItem[] = [];
  const errors: string[] = [];

  rows.slice(headerIndex + 1).forEach((row, offset) => {
    const sourceRow = headerIndex + offset + 2;
    const sourcePeriod = normalize(row[periodIndex]);
    const title = normalize(row[titleIndex]);
    if (!sourcePeriod && !title) return;
    if (!sourcePeriod || !title) {
      errors.push(`Baris ${sourceRow}: tanggal/periode atau nama agenda kosong.`);
      return;
    }
    const period = parseAgendaPeriod(sourcePeriod);
    if (!period) {
      errors.push(`Baris ${sourceRow}: format tanggal "${sourcePeriod}" belum dikenali.`);
      return;
    }
    items.push({
      title,
      location: locationIndex >= 0 ? normalize(row[locationIndex]) || "SMK Telkom Lampung" : "SMK Telkom Lampung",
      ...period,
      sourceRow,
      sourcePeriod
    });
  });

  if (items.length === 0) throw new Error("Tidak ada agenda valid yang ditemukan di dalam file.");
  return { items, errors, sheetName };
}
