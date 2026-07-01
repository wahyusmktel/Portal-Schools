import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";
import { EmployeeManager } from "@/components/EmployeeManager";
import { API_URL } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  const res = await fetch(`${API_URL}/employees`, {
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    return (
      <div className="rounded-[8px] bg-red-50 p-4 text-red-600">
        Gagal memuat data pegawai. Status: {res.status}. Body: {text}
      </div>
    );
  }

  const initialItems = await res.json();

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-sm font-extrabold uppercase text-rosebrand-600">Direktori Pegawai</p>
        <h1 className="mt-2 text-3xl font-black">Manajemen Tenaga Pendidik & Kependidikan</h1>
        <p className="mt-4 max-w-2xl leading-7 text-zinc-600">
          Kelola daftar pegawai, foto profil, dan status keaktifan. Pegawai aktif akan tampil di
          atas, sementara yang purna tugas akan diabadikan di bagian bawah portal publik.
        </p>
      </section>
      <EmployeeManager initialItems={initialItems || []} />
    </div>
  );
}
