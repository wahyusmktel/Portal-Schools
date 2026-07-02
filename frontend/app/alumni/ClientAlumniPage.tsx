"use client";

import { useState } from "react";
import { Alumni, AlumniStat } from "@/types/content";
import { GraduationCap, Briefcase, BookOpen, Lightbulb, Search, MessageSquareQuote, ChevronRight } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

type Props = {
  initialAlumni: Alumni[];
  initialStats: AlumniStat[];
};

const COLORS = ['#e11d48', '#0284c7', '#ea580c', '#64748b'];

export default function ClientAlumniPage({ initialAlumni, initialStats }: Props) {
  const [search, setSearch] = useState("");
  const [filterYear, setFilterYear] = useState<string>("all");

  const years = Array.from(new Set(initialAlumni.map(a => a.graduationYear))).sort((a, b) => b - a);

  const filteredAlumni = initialAlumni.filter(a => {
    const matchName = a.name.toLowerCase().includes(search.toLowerCase()) || (a.companyOrUniversity || "").toLowerCase().includes(search.toLowerCase());
    const matchYear = filterYear === "all" || a.graduationYear.toString() === filterYear;
    return matchName && matchYear;
  });

  // Calculate default stats if api fails or empty
  const defaultStats = [
    { name: 'Kerja', value: 65 },
    { name: 'Kuliah', value: 25 },
    { name: 'Wirausaha', value: 10 },
  ];

  const chartData = initialStats.length > 0 
    ? initialStats.map(s => ({ name: s.status, value: s.count }))
    : defaultStats;

  return (
    <main className="min-h-screen bg-zinc-50 pt-28 pb-20">
      <div className="mx-auto max-w-7xl px-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-500 mb-10">
          <a href="/" className="hover:text-rosebrand-600 transition-colors">Beranda</a>
          <ChevronRight size={14} />
          <span className="text-zinc-900">Portal Alumni & Tracer Study</span>
        </div>
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-rosebrand-100 text-rosebrand-600 mb-6">
            <GraduationCap size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-zinc-900 mb-4 tracking-tight">
            Portal Alumni & Tracer Study
          </h1>
          <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
            Jejaring ikatan alumni SMK Telkom Lampung. Ketahui rekam jejak lulusan kami di dunia industri, wirausaha, dan perguruan tinggi.
          </p>
        </div>

        {/* Tracer Study Stats */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl shadow-zinc-200/50 border border-zinc-100 mb-16 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 w-full text-center md:text-left">
            <h2 className="text-3xl font-black text-zinc-900 mb-4">Statistik Sebaran Alumni</h2>
            <p className="text-zinc-600 mb-8 max-w-lg">
              Berdasarkan hasil penelusuran lulusan (Tracer Study), mayoritas alumni SMK Telkom Lampung langsung terserap di dunia kerja atau melanjutkan pendidikan ke perguruan tinggi.
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-rosebrand-50 rounded-2xl p-4 text-center">
                <Briefcase className="mx-auto h-6 w-6 text-rosebrand-600 mb-2" />
                <span className="block text-xl font-black text-zinc-900">{chartData.find(d => d.name === 'Kerja')?.value || 0}</span>
                <span className="text-xs font-bold text-zinc-500 uppercase">Kerja</span>
              </div>
              <div className="bg-sky-50 rounded-2xl p-4 text-center">
                <BookOpen className="mx-auto h-6 w-6 text-sky-600 mb-2" />
                <span className="block text-xl font-black text-zinc-900">{chartData.find(d => d.name === 'Kuliah')?.value || 0}</span>
                <span className="text-xs font-bold text-zinc-500 uppercase">Kuliah</span>
              </div>
              <div className="bg-orange-50 rounded-2xl p-4 text-center">
                <Lightbulb className="mx-auto h-6 w-6 text-orange-600 mb-2" />
                <span className="block text-xl font-black text-zinc-900">{chartData.find(d => d.name === 'Wirausaha')?.value || 0}</span>
                <span className="text-xs font-bold text-zinc-500 uppercase">Wirausaha</span>
              </div>
            </div>
          </div>
          <div className="flex-1 w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alumni Search & Grid */}
        <div className="mb-10 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
            <input 
              type="text" 
              placeholder="Cari nama alumni atau tempat kerja/kuliah..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-rosebrand-500 transition-all"
            />
          </div>
          <select 
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="w-full sm:w-auto px-4 py-3 rounded-xl border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-rosebrand-500 font-semibold text-zinc-700"
          >
            <option value="all">Semua Angkatan</option>
            {years.map(y => (
              <option key={y} value={y.toString()}>Angkatan {y}</option>
            ))}
          </select>
        </div>

        {filteredAlumni.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-zinc-100">
            <h3 className="text-xl font-bold text-zinc-900 mb-2">Tidak ditemukan data alumni</h3>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAlumni.map(alumni => (
              <div key={alumni.id} className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-16 w-16 rounded-full overflow-hidden bg-zinc-100 shrink-0">
                    {alumni.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={alumni.imageUrl} alt={alumni.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-zinc-400">
                        <GraduationCap size={24} />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-zinc-900">{alumni.name}</h3>
                    <p className="text-sm font-bold text-rosebrand-600">Angkatan {alumni.graduationYear}</p>
                  </div>
                </div>
                
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 text-xs font-bold text-zinc-700 mb-4">
                  {alumni.currentStatus === 'Kerja' && <Briefcase size={14} className="text-rosebrand-600" />}
                  {alumni.currentStatus === 'Kuliah' && <BookOpen size={14} className="text-sky-600" />}
                  {alumni.currentStatus === 'Wirausaha' && <Lightbulb size={14} className="text-orange-600" />}
                  <span>{alumni.currentStatus}</span>
                  {alumni.companyOrUniversity && <span className="text-zinc-400">&bull;</span>}
                  {alumni.companyOrUniversity && <span>{alumni.companyOrUniversity}</span>}
                </div>

                {alumni.testimonial && (
                  <div className="relative pt-4 border-t border-zinc-100">
                    <MessageSquareQuote size={20} className="absolute top-4 left-0 text-zinc-200" />
                    <p className="text-sm text-zinc-600 pl-8 italic line-clamp-4">
                      "{alumni.testimonial}"
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
