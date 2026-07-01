import { Metadata } from "next";
import { AnnouncementManager } from "@/components/AnnouncementManager";
import { getAnnouncements } from "@/lib/api";

export const metadata: Metadata = {
  title: "Manajemen Pengumuman",
};

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage() {
  const items = await getAnnouncements(true).catch(() => []);
  return <AnnouncementManager initialItems={items} />;
}
