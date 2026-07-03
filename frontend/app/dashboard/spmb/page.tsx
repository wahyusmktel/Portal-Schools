import { cookies } from "next/headers";
import { API_URL } from "@/lib/api";
import { SpmbReportManager } from "@/components/SpmbReportManager";
import type { SpmbRegistration } from "@/types/content";

export const metadata = {
  title: "Report SPMB"
};

export const dynamic = "force-dynamic";

export default async function DashboardSpmbPage() {
  const cookieStore = await cookies();
  const response = await fetch(`${API_URL}/admin/spmb/registrations`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Cookie: cookieStore.toString()
    }
  }).catch(() => null);

  if (!response?.ok) {
    return (
      <div className="rounded-[8px] bg-rosebrand-50 p-4 text-sm font-bold text-rosebrand-700">
        Gagal memuat data SPMB. Pastikan akun memiliki akses report SPMB.
      </div>
    );
  }

  const items = (await response.json()) as SpmbRegistration[];
  return <SpmbReportManager items={items || []} />;
}
