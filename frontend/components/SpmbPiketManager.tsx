"use client";

import { useMemo, useState } from "react";
import {
  Calendar,
  Clock,
  Download,
  Filter,
  GraduationCap,
  Info,
  Printer,
  Search,
  UserCheck,
  Users,
  CheckCircle2,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import type { SpmbPiketGroup } from "@/types/spmb_piket";

interface Props {
  initialGroups: SpmbPiketGroup[];
}

export function SpmbPiketManager({ initialGroups }: Props) {
  const [groups] = useState<SpmbPiketGroup[]>(initialGroups);
  const [selectedGroup, setSelectedGroup] = useState<number | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"document" | "byDate">("document");
  const [selectedDate, setSelectedDate] = useState<string>("");

  // Total stats
  const totalEmployees = useMemo(() => {
    return groups.reduce((acc, g) => acc + (g.members?.length || 0), 0);
  }, [groups]);

  // Unique sorted dates
  const allDates = useMemo(() => {
    const map = new Map<string, { date: string; label: string; groupNumber: number; groupName: string }>();
    groups.forEach((g) => {
      g.dates.forEach((d) => {
        map.set(d.date, {
          date: d.date,
          label: d.label,
          groupNumber: g.groupNumber,
          groupName: g.groupName,
        });
      });
    });
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [groups]);

  // Filtered groups based on search & group selection
  const filteredGroups = useMemo(() => {
    return groups
      .filter((g) => {
        if (selectedGroup !== "all" && g.groupNumber !== selectedGroup) return false;
        return true;
      })
      .map((g) => {
        if (!searchQuery.trim()) return g;
        const q = searchQuery.toLowerCase();
        const matchedMembers = g.members.filter(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            String(m.order).includes(q)
        );
        return {
          ...g,
          members: matchedMembers,
        };
      })
      .filter((g) => {
        if (!searchQuery.trim()) return true;
        return g.members.length > 0;
      });
  }, [groups, selectedGroup, searchQuery]);

  // Date view data
  const dateMembers = useMemo(() => {
    if (!selectedDate) {
      if (allDates.length > 0) {
        return {
          dateInfo: allDates[0],
          group: groups.find((g) => g.groupNumber === allDates[0].groupNumber),
        };
      }
      return null;
    }
    const dateInfo = allDates.find((d) => d.date === selectedDate);
    if (!dateInfo) return null;
    const group = groups.find((g) => g.groupNumber === dateInfo.groupNumber);
    return { dateInfo, group };
  }, [selectedDate, allDates, groups]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero (hidden on print) */}
      <div className="print:hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rosebrand-50 px-3 py-1 text-xs font-bold text-rosebrand-700 ring-1 ring-rosebrand-200">
                <Sparkles size={13} />
                SPMB Tahun Ajaran 2027/2028
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                <CheckCircle2 size={13} />
                SK Resmi Pegawai
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900 sm:text-3xl">
              Jadwal Piket SPMB Pegawai
            </h1>
            <p className="max-w-2xl text-sm font-semibold text-zinc-500">
              SMK Telkom Lampung • Pelaksanaan setiap hari <strong>Sabtu</strong> pukul <strong>07.30 - 12.00 WIB</strong>.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-zinc-800 focus:ring-4 focus:ring-zinc-900/10"
            >
              <Printer size={15} />
              Cetak Format Resmi
            </button>
          </div>
        </div>

        {/* Quick Summary Cards */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-3.5">
            <div className="flex items-center gap-2 text-zinc-500 text-xs font-semibold">
              <Users size={15} className="text-rosebrand-600" />
              Total Pegawai Piket
            </div>
            <p className="mt-1.5 text-xl font-black text-zinc-900">{totalEmployees} Pegawai</p>
          </div>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-3.5">
            <div className="flex items-center gap-2 text-zinc-500 text-xs font-semibold">
              <GraduationCap size={15} className="text-blue-600" />
              Total Kelompok
            </div>
            <p className="mt-1.5 text-xl font-black text-zinc-900">{groups.length} Kelompok</p>
          </div>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-3.5">
            <div className="flex items-center gap-2 text-zinc-500 text-xs font-semibold">
              <CalendarDays size={15} className="text-amber-600" />
              Hari Piket
            </div>
            <p className="mt-1.5 text-xl font-black text-zinc-900">Setiap Sabtu</p>
          </div>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-3.5">
            <div className="flex items-center gap-2 text-zinc-500 text-xs font-semibold">
              <Clock size={15} className="text-purple-600" />
              Waktu Piket
            </div>
            <p className="mt-1.5 text-xl font-black text-zinc-900">07.30 - 12.00</p>
          </div>
        </div>
      </div>

      {/* Filter and View Mode Toolbar (hidden on print) */}
      <div className="print:hidden flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs md:flex-row md:items-center md:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama pegawai / guru (cth: Wahyu, Imam, Rizki)..."
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-4 text-xs font-semibold text-zinc-900 outline-none transition focus:border-rosebrand-500 focus:bg-white focus:ring-4 focus:ring-rosebrand-500/10"
          />
        </div>

        {/* Filter Kelompok */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedGroup("all")}
            type="button"
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              selectedGroup === "all"
                ? "bg-rosebrand-500 text-white shadow-xs"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            Semua
          </button>
          {groups.map((g) => (
            <button
              key={g.groupNumber}
              onClick={() => setSelectedGroup(g.groupNumber)}
              type="button"
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                selectedGroup === g.groupNumber
                  ? "bg-rosebrand-500 text-white shadow-xs"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              Kel. {g.groupNumber}
            </button>
          ))}
        </div>

        {/* View Switcher */}
        <div className="flex items-center rounded-xl bg-zinc-100 p-1">
          <button
            onClick={() => setViewMode("document")}
            type="button"
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              viewMode === "document"
                ? "bg-white text-zinc-900 shadow-xs"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            Tabel Resmi
          </button>
          <button
            onClick={() => setViewMode("byDate")}
            type="button"
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              viewMode === "byDate"
                ? "bg-white text-zinc-900 shadow-xs"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            Per Tanggal
          </button>
        </div>
      </div>

      {/* MAIN VIEW: Mode 1 - Tampilan Format Dokumen Resmi */}
      {viewMode === "document" && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs sm:p-8 print:p-0 print:border-none print:shadow-none">
          {/* Header Surat (Tampil di cetak & di layar) */}
          <div className="text-center mb-8 border-b-2 border-zinc-900 pb-4">
            <h2 className="text-xl font-black uppercase tracking-wide text-zinc-900 sm:text-2xl">
              Jadwal Piket SPMB Pegawai SMK Telkom Lampung
            </h2>
            <h3 className="text-lg font-extrabold uppercase tracking-wide text-zinc-800">
              Tahun Ajaran 2027/2028
            </h3>
          </div>

          {/* Tabel Utama Format Sesuai Dokumen Referensi */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border-2 border-zinc-900 text-xs sm:text-sm">
              <thead>
                <tr className="bg-zinc-100/90 text-zinc-900">
                  <th className="border-2 border-zinc-900 px-3 py-3 text-center font-black w-14">NO</th>
                  <th className="border-2 border-zinc-900 px-4 py-3 text-left font-black w-72">NAMA</th>
                  <th className="border-2 border-zinc-900 px-4 py-3 text-center font-black w-52">HARI/ TANGGAL</th>
                  <th className="border-2 border-zinc-900 px-4 py-3 text-center font-black w-40">WAKTU</th>
                  <th className="border-2 border-zinc-900 px-4 py-3 text-center font-black w-32">KETERANGAN</th>
                </tr>
              </thead>
              <tbody>
                {filteredGroups.map((group, groupIdx) => {
                  const memberCount = group.members.length;
                  return group.members.map((member, mIdx) => {
                    const isFirstInGroup = mIdx === 0;

                    return (
                      <tr
                        key={member.order}
                        className={`hover:bg-zinc-50/80 transition-colors ${
                          searchQuery && member.name.toLowerCase().includes(searchQuery.toLowerCase())
                            ? "bg-amber-50/70 font-semibold"
                            : ""
                        }`}
                      >
                        {/* NO */}
                        <td className="border border-zinc-900/60 px-3 py-2 text-center font-bold text-zinc-800">
                          {member.order}
                        </td>

                        {/* NAMA */}
                        <td className="border border-zinc-900/60 px-4 py-2 font-bold text-zinc-900">
                          {member.name}
                        </td>

                        {/* HARI / TANGGAL (Merged per Kelompok) */}
                        {isFirstInGroup && (
                          <td
                            rowSpan={memberCount}
                            className="border-2 border-zinc-900 px-3 py-3 text-center align-middle bg-zinc-50/40"
                          >
                            <div className="font-black text-zinc-950 uppercase mb-2 text-xs tracking-wider">
                              {group.dayName}
                            </div>
                            <div className="flex flex-col gap-1 text-[11px] sm:text-xs font-semibold text-zinc-800">
                              {group.dates.map((d) => (
                                <span
                                  key={d.date}
                                  className="inline-block rounded px-1.5 py-0.5 bg-white border border-zinc-200/80 shadow-2xs"
                                >
                                  {d.label}
                                </span>
                              ))}
                            </div>
                          </td>
                        )}

                        {/* WAKTU (Merged per Kelompok) */}
                        {isFirstInGroup && (
                          <td
                            rowSpan={memberCount}
                            className="border-2 border-zinc-900 px-3 py-3 text-center align-middle font-black text-zinc-900 bg-zinc-50/40"
                          >
                            {group.timeRange}
                          </td>
                        )}

                        {/* KETERANGAN (Merged per Kelompok) */}
                        {isFirstInGroup && (
                          <td
                            rowSpan={memberCount}
                            className="border-2 border-zinc-900 px-3 py-3 text-center align-middle text-zinc-500 font-semibold"
                          >
                            -
                          </td>
                        )}
                      </tr>
                    );
                  });
                })}
              </tbody>
            </table>
          </div>

          {/* Noted Footnote */}
          <div className="mt-4 text-xs sm:text-sm font-bold text-zinc-800">
            <strong>Noted :</strong> Perkelompok Nama Wajib Hadir Sesuai Hari dan Tanggal yang telah dijadwalkan
          </div>

          {/* Tanda Tangan & Pengesahan Dokumen */}
          <div className="mt-12 flex justify-end">
            <div className="w-72 text-center text-xs sm:text-sm">
              <p className="font-semibold text-zinc-700">Pringsewu, 21 September 2026</p>
              <p className="font-bold text-zinc-900">Kepala SMK Telkom Lampung</p>

              {/* Stempel / Tanda Tangan visual */}
              <div className="my-3 flex items-center justify-center">
                <div className="rounded-full border-2 border-dashed border-rosebrand-300 p-2 text-rosebrand-700/60 font-black text-[10px] uppercase tracking-widest">
                  [ Tanda Tangan & Stempel ]
                </div>
              </div>

              <p className="font-black underline text-zinc-950">Dedi Eko Cahyono, S.Kom</p>
              <p className="text-zinc-600 font-semibold">NIP. 22880011</p>
            </div>
          </div>
        </div>
      )}

      {/* MAIN VIEW: Mode 2 - Tampilan Per Tanggal (Interactive Timeline) */}
      {viewMode === "byDate" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          {/* Daftar Tanggal */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
            <h3 className="mb-3 text-sm font-black text-zinc-900 flex items-center gap-2">
              <Calendar size={16} className="text-rosebrand-600" />
              Pilih Tanggal Piket (Sabtu)
            </h3>
            <div className="max-h-[500px] overflow-y-auto space-y-1.5 pr-1">
              {allDates.map((item) => {
                const isSelected = (selectedDate || allDates[0].date) === item.date;
                return (
                  <button
                    key={item.date}
                    onClick={() => setSelectedDate(item.date)}
                    type="button"
                    className={`flex w-full items-center justify-between rounded-xl p-3 text-left transition ${
                      isSelected
                        ? "bg-rosebrand-500 text-white shadow-xs font-bold"
                        : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100 font-semibold"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <CalendarDays size={16} className={isSelected ? "text-white" : "text-zinc-400"} />
                      <span>{item.label}</span>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                        isSelected ? "bg-white/20 text-white" : "bg-zinc-200 text-zinc-700"
                      }`}
                    >
                      {item.groupName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Daftar Anggota pada Tanggal Terpilih */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs">
            {dateMembers && dateMembers.group ? (
              <div className="space-y-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-100 pb-4">
                  <div>
                    <span className="text-xs font-bold text-rosebrand-600 uppercase tracking-wider">
                      Jadwal Piket Terpilih
                    </span>
                    <h3 className="text-2xl font-black text-zinc-900">
                      Sabtu, {dateMembers.dateInfo.label}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-black text-zinc-800">
                      {dateMembers.group.groupName}
                    </span>
                    <span className="rounded-full bg-rosebrand-50 px-3 py-1 text-xs font-black text-rosebrand-700">
                      {dateMembers.group.timeRange}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="mb-3 text-xs font-black uppercase tracking-wider text-zinc-400">
                    Daftar Petugas Piket ({dateMembers.group.members.length} Orang)
                  </h4>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {dateMembers.group.members.map((m) => (
                      <div
                        key={m.order}
                        className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50/60 p-3"
                      >
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white border border-zinc-200 text-xs font-black text-zinc-700 shadow-2xs">
                          {m.order}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs sm:text-sm font-bold text-zinc-900">{m.name}</p>
                          <p className="text-[11px] font-semibold text-zinc-500">Petugas SPMB</p>
                        </div>
                        <UserCheck size={16} className="text-emerald-600 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-zinc-400 text-sm">
                Pilih tanggal di sebelah kiri untuk melihat daftar petugas piket.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
