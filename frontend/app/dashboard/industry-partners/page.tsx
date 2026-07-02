import { IndustryPartnerManager } from "@/components/IndustryPartnerManager";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manajemen Mitra Industri - Admin Portal",
};

export default function IndustryPartnersPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <IndustryPartnerManager />
    </div>
  );
}
