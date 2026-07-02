import { Metadata } from "next";
import { getAlumni, getAlumniStats, getSchoolProfile } from "@/lib/api";
import ClientAlumniPage from "./ClientAlumniPage";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Portal Alumni & Tracer Study - SMK Telkom Lampung",
  description: "Tracer study dan data alumni SMK Telkom Lampung",
};

export default async function AlumniPage() {
  const profile = await getSchoolProfile().catch(() => null);
  const alumni = (await getAlumni().catch(() => null)) || [];
  const stats = (await getAlumniStats().catch(() => null)) || [];

  return (
    <>
      <Header logoUrl={profile?.headerLogo} />
      <ClientAlumniPage initialAlumni={alumni} initialStats={stats} />
      <Footer profile={profile} />
    </>
  );
}
