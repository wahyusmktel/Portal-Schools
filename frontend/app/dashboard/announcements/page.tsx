import { Metadata } from "next";
import { AnnouncementManager } from "@/components/AnnouncementManager";
import { API_URL } from "@/lib/api";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Manajemen Pengumuman",
};

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage() {
  const cookieStore = await cookies();
  const response = await fetch(`${API_URL}/admin/announcements`, {
    cache: "no-store",
    headers: { Cookie: cookieStore.toString(), Accept: "application/json" }
  }).catch(() => null);
  const items = response?.ok ? await response.json() : [];
  return <AnnouncementManager initialItems={items} />;
}
