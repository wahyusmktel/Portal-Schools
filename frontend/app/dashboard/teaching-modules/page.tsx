import { BookOpenCheck } from "lucide-react";
import { cookies } from "next/headers";
import { TeachingModuleManager } from "@/components/TeachingModuleManager";
import { API_URL } from "@/lib/api";

export const revalidate = 0;

export const metadata = {
  title: "Manajemen Modul Ajar"
};

export default async function TeachingModulesAdminPage() {
  const cookieStore = await cookies();
  const response = await fetch(`${API_URL}/admin/teaching-modules`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store"
  }).catch(() => null);

  if (!response || !response.ok) {
    const text = response ? await response.text() : "Koneksi ke backend gagal";
    return (
      <div className="rounded-[8px] border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-600">
        Gagal memuat data modul ajar. Status: {response?.status || 500}. Error: {text}
      </div>
    );
  }

  const modules = await response.json();

  return (
    <div className="grid gap-6">
      <section>
        <p className="flex items-center gap-2 text-sm font-extrabold uppercase text-rosebrand-600">
          <BookOpenCheck size={16} aria-hidden />
          Perpustakaan Digital
        </p>
        <h1 className="mt-2 text-3xl font-black text-zinc-900">Manajemen Modul Ajar</h1>
        <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-zinc-500">
          Kelola modul ajar PDF, cover, statistik baca, statistik unduh, status publish, dan urutan tampil di website.
        </p>
      </section>

      <TeachingModuleManager initialItems={modules || []} />
    </div>
  );
}
