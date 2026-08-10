import { Metadata } from "next";
import { AgendaManager } from "@/components/AgendaManager";
import { API_URL } from "@/lib/api";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Manajemen Agenda",
};

export const dynamic = "force-dynamic";

export default async function AdminAgendasPage() {
  const cookieStore = await cookies();
  const response = await fetch(`${API_URL}/admin/agendas`, {
    cache: "no-store",
    headers: { Cookie: cookieStore.toString(), Accept: "application/json" }
  }).catch(() => null);
  const items = response?.ok ? await response.json() : [];
  return <AgendaManager initialItems={items} />;
}
