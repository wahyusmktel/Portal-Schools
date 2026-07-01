import { API_URL } from "@/lib/api";
import { FacilityManager } from "@/components/FacilityManager";
import { DashboardShell } from "@/components/DashboardShell";
import { Building2 } from "lucide-react";
import { cookies } from "next/headers";

export const revalidate = 0;

export default async function FacilitiesPage() {
  const cookieStore = await cookies();
  const res = await fetch(`${API_URL}/facilities`, {
    headers: { Cookie: cookieStore.toString() }
  });

  if (!res.ok) {
    const text = await res.text();
    return (
      <DashboardShell>
        <div className="rounded-xl bg-red-50 p-4 text-red-600 border border-red-100">
          Gagal memuat data fasilitas. Status: {res.status}. Error: {text}
        </div>
      </DashboardShell>
    );
  }

  const facilities = await res.json();

  return (
    <div className="grid gap-6">
      <section>
        <p className="flex items-center gap-2 text-sm font-extrabold uppercase text-rosebrand-600">
          <Building2 size={16} /> Fasilitas & Infrastruktur
        </p>
        <h1 className="mt-2 text-3xl font-black text-zinc-900">Manajemen Fasilitas Sekolah</h1>
      </section>
      <FacilityManager initialItems={facilities || []} />
    </div>
  );
}
