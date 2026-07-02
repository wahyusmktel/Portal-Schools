import { Metadata } from "next";
import { getFaqs, getSchoolProfile } from "@/lib/api";
import ClientBantuanPage from "./ClientBantuanPage";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Pusat Bantuan - SMK Telkom Lampung",
  description: "Pertanyaan yang sering diajukan dan pusat bantuan SMK Telkom Lampung",
};

export default async function BantuanPage() {
  const profile = await getSchoolProfile().catch(() => null);
  const faqs = (await getFaqs().catch(() => null)) || [];
  return (
    <>
      <Header logoUrl={profile?.headerLogo} />
      <ClientBantuanPage initialFaqs={faqs} />
      <Footer profile={profile} />
    </>
  );
}
