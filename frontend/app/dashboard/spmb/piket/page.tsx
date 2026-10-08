import { cookies } from "next/headers";
import { API_URL } from "@/lib/api";
import { SpmbPiketManager } from "@/components/SpmbPiketManager";
import type { SpmbPiketGroup } from "@/types/spmb_piket";

export const metadata = {
  title: "Jadwal Piket SPMB 2027/2028 | Portal Admin",
};

export const dynamic = "force-dynamic";

export default async function DashboardSpmbPiketPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const res = await fetch(`${API_URL}/admin/spmb/piket`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Cookie: cookieHeader,
    },
  }).catch(() => null);

  let groups: SpmbPiketGroup[] = [];
  if (res?.ok) {
    groups = (await res.json()) || [];
  } else {
    // Fallback: try public endpoint if admin cookie is unavailable during build
    const publicRes = await fetch(`${API_URL}/spmb/piket`, {
      cache: "no-store",
    }).catch(() => null);
    if (publicRes?.ok) {
      groups = (await publicRes.json()) || [];
    }
  }

  return <SpmbPiketManager initialGroups={groups} />;
}
