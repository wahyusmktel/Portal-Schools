"use client";

import { Users, User, ShieldAlert, ChevronRight } from "lucide-react";

type Employee = {
  id: number;
  name: string;
  role: string;
  imageUrl: string;
};

export default function ClientStrukturOrganisasiPage({ initialEmployees }: { initialEmployees: Employee[] }) {
  // Simple categorization based on role keywords (case insensitive)
  const getGroup = (role: string) => {
    const r = role.toLowerCase();
    if (r.includes("kepala sekolah")) return 1;
    if (r.includes("wakil")) return 2;
    if (r.includes("kaprog") || r.includes("kepala program")) return 3;
    return 4;
  };

  const sortedEmployees = [...initialEmployees].sort((a, b) => getGroup(a.role) - getGroup(b.role));

  const principals = sortedEmployees.filter((e) => getGroup(e.role) === 1);
  const vicePrincipals = sortedEmployees.filter((e) => getGroup(e.role) === 2);
  const managers = sortedEmployees.filter((e) => getGroup(e.role) === 3);
  const staff = sortedEmployees.filter((e) => getGroup(e.role) === 4);

  return (
    <main className="min-h-screen bg-zinc-50 pt-28 pb-20">
      <div className="mx-auto max-w-7xl px-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-500 mb-10">
          <a href="/" className="hover:text-rosebrand-600 transition-colors">Beranda</a>
          <ChevronRight size={14} />
          <span className="text-zinc-900">Struktur Organisasi</span>
        </div>
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-rosebrand-100 text-rosebrand-600 mb-6">
            <Users size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-zinc-900 mb-4 tracking-tight">
            Struktur Organisasi
          </h1>
          <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
            Susunan pengurus dan tenaga pendidik SMK Telkom Lampung yang berdedikasi memajukan mutu pendidikan.
          </p>
        </div>

        {initialEmployees.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-zinc-100">
            <ShieldAlert className="mx-auto h-12 w-12 text-zinc-300 mb-4" />
            <h3 className="text-xl font-bold text-zinc-900 mb-2">Belum ada data pegawai</h3>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-12 relative before:absolute before:inset-y-0 before:w-1 before:bg-zinc-200 before:-z-10 before:left-1/2 before:-translate-x-1/2">
            
            {/* Level 1: Kepala Sekolah */}
            {principals.length > 0 && (
              <div className="flex flex-wrap justify-center gap-6">
                {principals.map(emp => <OrgCard key={emp.id} employee={emp} />)}
              </div>
            )}

            {/* Level 2: Wakil Kepala Sekolah */}
            {vicePrincipals.length > 0 && (
              <div className="flex flex-wrap justify-center gap-6 relative">
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-1/2 h-12 border-t-4 border-zinc-200" />
                {vicePrincipals.map(emp => <OrgCard key={emp.id} employee={emp} />)}
              </div>
            )}

            {/* Level 3: Kepala Program */}
            {managers.length > 0 && (
              <div className="flex flex-wrap justify-center gap-6 relative">
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-3/4 h-12 border-t-4 border-zinc-200" />
                {managers.map(emp => <OrgCard key={emp.id} employee={emp} />)}
              </div>
            )}

            {/* Level 4: Guru & Staf */}
            {staff.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 mt-10">
                {staff.map(emp => <OrgCard key={emp.id} employee={emp} small />)}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function OrgCard({ employee, small = false }: { employee: Employee; small?: boolean }) {
  return (
    <div className={`bg-white p-4 rounded-2xl shadow-lg border border-zinc-100 flex flex-col items-center text-center relative ${small ? 'w-40' : 'w-56'} z-10 hover:-translate-y-1 transition-transform`}>
      <div className={`rounded-full overflow-hidden mb-4 bg-zinc-100 border-4 border-white shadow-sm ${small ? 'w-20 h-20' : 'w-32 h-32'}`}>
        {employee.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={employee.imageUrl} alt={employee.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full grid place-items-center text-zinc-400">
            <User size={small ? 32 : 48} />
          </div>
        )}
      </div>
      <h3 className={`font-black text-zinc-900 ${small ? 'text-sm' : 'text-base'}`}>{employee.name}</h3>
      <p className={`text-zinc-500 font-semibold mt-1 ${small ? 'text-xs' : 'text-sm'}`}>{employee.role}</p>
    </div>
  );
}
