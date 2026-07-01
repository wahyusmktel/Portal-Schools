import { Metadata } from "next";
import { AgendaManager } from "@/components/AgendaManager";
import { getAgendas } from "@/lib/api";

export const metadata: Metadata = {
  title: "Manajemen Agenda",
};

export const dynamic = "force-dynamic";

export default async function AdminAgendasPage() {
  const items = await getAgendas().catch(() => []);
  return <AgendaManager initialItems={items} />;
}
