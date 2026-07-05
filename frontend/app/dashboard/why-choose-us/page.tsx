import { Sparkles } from "lucide-react";
import { cookies } from "next/headers";
import { DashboardShell } from "@/components/DashboardShell";
import { WhyChooseUsManager } from "@/components/WhyChooseUsManager";
import { API_URL } from "@/lib/api";

export const revalidate = 0;

export const metadata = {
  title: "Manajemen Why SMK Telkom Lampung"
};

export default async function WhyChooseUsPage() {
  const cookieStore = await cookies();
  const response = await fetch(`${API_URL}/admin/why-choose-us`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store"
  }).catch(() => null);

  if (!response || !response.ok) {
    const text = response ? await response.text() : "Koneksi ke backend gagal";
    return (
      <DashboardShell>
        <div className="rounded-[8px] border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-600">
          Gagal memuat data Why SMK Telkom Lampung. Status: {response?.status || 500}. Error: {text}
        </div>
      </DashboardShell>
    );
  }

  const items = await response.json();

  return (
    <div className="grid gap-6">
      <section>
        <p className="flex items-center gap-2 text-sm font-extrabold uppercase text-rosebrand-600">
          <Sparkles size={16} aria-hidden /> Tampilan Halaman Utama
        </p>
        <h1 className="mt-2 text-3xl font-black text-zinc-900">Manajemen Why SMK Telkom Lampung</h1>
        <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-zinc-500">
          Kelola alasan utama yang meyakinkan siswa dan orang tua sebelum mereka melihat daftar jurusan.
        </p>
      </section>

      <WhyChooseUsManager initialItems={items || []} />
    </div>
  );
}
