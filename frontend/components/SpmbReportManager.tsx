"use client";

import { useMemo, useState } from "react";
import { Download, Printer, Search } from "lucide-react";
import { printSpmbCardPdf } from "@/lib/spmb-card";
import type { SpmbRegistration } from "@/types/content";

export function SpmbReportManager({ items }: { items: SpmbRegistration[] }) {
  const [query, setQuery] = useState("");
  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return items;
    }
    return items.filter((item) =>
      [
        item.registrationNumber,
        item.fullName,
        item.whatsappNumber,
        item.previousSchool,
        item.selectedMajorName,
        item.academicYear
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    );
  }, [items, query]);

  function downloadCsv() {
    const header = [
      "Nomor Pendaftaran",
      "Nama",
      "WhatsApp",
      "Alamat",
      "Asal Sekolah",
      "Info",
      "Ayah",
      "Ibu",
      "Jurusan",
      "Tahun Ajaran",
      "Tanggal"
    ];
    const rows = filteredItems.map((item) => [
      item.registrationNumber,
      item.fullName,
      item.whatsappNumber,
      item.currentAddress,
      item.previousSchool,
      item.infoSource,
      item.fatherName,
      item.motherName,
      item.selectedMajorName,
      item.academicYear,
      item.createdAt
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "report-spmb.csv";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 rounded-[8px] bg-white p-5 shadow-sm lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-sm font-extrabold uppercase text-rosebrand-600">Report SPMB</p>
          <h1 className="mt-2 text-3xl font-black text-zinc-950">Data Pendaftaran Murid Baru</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-zinc-500">
            Pantau calon siswa yang sudah mengisi formulir SPMB dan print kartu pendaftaran untuk daftar ulang.
          </p>
        </div>
        <button
          type="button"
          onClick={downloadCsv}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-zinc-950 px-5 text-sm font-extrabold text-white hover:bg-rosebrand-600"
        >
          <Download size={17} aria-hidden />
          Download CSV
        </button>
      </section>

      <section className="rounded-[8px] bg-white p-5 shadow-sm">
        <label className="relative block">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" aria-hidden />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama, nomor, sekolah, jurusan..."
            className="h-11 w-full rounded-[8px] border border-zinc-200 pl-11 pr-4 text-sm font-semibold outline-none focus:border-rosebrand-500"
          />
        </label>

        <div className="mt-5 overflow-hidden rounded-[8px] border border-zinc-100">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-extrabold">Pendaftar</th>
                  <th className="px-4 py-3 font-extrabold">Kontak</th>
                  <th className="px-4 py-3 font-extrabold">Asal Sekolah</th>
                  <th className="px-4 py-3 font-extrabold">Jurusan</th>
                  <th className="px-4 py-3 font-extrabold">Orang Tua</th>
                  <th className="px-4 py-3 font-extrabold">Info</th>
                  <th className="px-4 py-3 text-right font-extrabold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="align-top">
                    <td className="px-4 py-4">
                      <p className="font-black text-zinc-900">{item.fullName}</p>
                      <p className="mt-1 text-xs font-bold text-rosebrand-600">{item.registrationNumber}</p>
                      <p className="mt-1 text-xs font-semibold text-zinc-400">SPMB {item.academicYear}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-bold text-zinc-700">{item.whatsappNumber}</p>
                      <p className="mt-1 line-clamp-2 max-w-xs text-xs text-zinc-500">{item.currentAddress}</p>
                    </td>
                    <td className="px-4 py-4 font-semibold text-zinc-700">{item.previousSchool}</td>
                    <td className="px-4 py-4 font-semibold text-zinc-700">{item.selectedMajorName}</td>
                    <td className="px-4 py-4 text-xs font-semibold leading-6 text-zinc-600">
                      <p>Ayah: {item.fatherName}</p>
                      <p>Ibu: {item.motherName}</p>
                    </td>
                    <td className="px-4 py-4 font-semibold text-zinc-700">{item.infoSource}</td>
                    <td className="px-4 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => printSpmbCardPdf(item)}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-[8px] border border-zinc-200 px-3 text-xs font-extrabold text-zinc-700 hover:bg-zinc-50"
                      >
                        <Printer size={15} aria-hidden />
                        Print Kartu
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm font-bold text-zinc-500">
                      Belum ada data pendaftaran yang cocok.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
