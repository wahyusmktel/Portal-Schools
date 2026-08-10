import type { Metadata } from "next";
import { AgendaArchive } from "@/components/AgendaArchive";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getAllAgendas, getSchoolProfile } from "@/lib/api";

export const metadata: Metadata = {
  title: "Agenda Sekolah",
  description: "Kalender kegiatan dan agenda lengkap SMK Telkom Lampung, baik yang akan datang maupun yang telah terlaksana."
};

export const dynamic = "force-dynamic";

export default async function AgendaPage() {
  const [profile, agendas] = await Promise.all([getSchoolProfile(), getAllAgendas()]);

  return (
    <>
      <Header logoUrl={profile.headerLogo} />
      <main className="min-h-screen bg-white pt-24">
        <AgendaArchive items={agendas} nowIso={new Date().toISOString()} />
      </main>
      <Footer profile={profile} />
    </>
  );
}
