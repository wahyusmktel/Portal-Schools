import { Metadata } from "next";
import { getSchoolProfile } from "@/lib/api";
import ClientStrukturOrganisasiPage from "./ClientStrukturOrganisasiPage";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Struktur Organisasi - SMK Telkom Lampung",
  description: "Susunan pengurus dan tenaga pendidik SMK Telkom Lampung",
};

async function getEmployees() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080/api/v1";
  const res = await fetch(`${API_URL}/employees`, { next: { revalidate: 60 } }).catch(() => null);
  if (!res || !res.ok) return [];
  return res.json();
}

export default async function StrukturOrganisasiPage() {
  const profile = await getSchoolProfile().catch(() => null);
  const employees = await getEmployees();

  return (
    <>
      <Header logoUrl={profile?.headerLogo} />
      <ClientStrukturOrganisasiPage initialEmployees={employees} />
      <Footer profile={profile} />
    </>
  );
}
