import { Metadata } from "next";
import { getSchoolProfile } from "@/lib/api";
import { EsportLanding } from "@/components/EsportLanding";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "STELLA E-Sport Championship Season 2 (2027) | Turnamen Mobile Legends",
  description:
    "Official Landing Page Turnamen Mobile Legends: Bang Bang SMK Telkom Lampung Season 2 Tahun 2027. Rebut Total Hadiah Rp 5.000.000+, Piala Bergilir Stella, dan Tahta Tertinggi Land of Dawn!",
  openGraph: {
    title: "STELLA E-Sport Championship Season 2 (2027) - MLBB Tournament",
    description:
      "Turnamen Mobile Legends: Bang Bang Pelajar Terbesar Lampung oleh SMK Telkom Lampung. Total Hadiah Rp 5 Juta+, 64 Tim Slot.",
    images: [
      {
        url: "/images/esport/arena-banner.jpg",
        width: 1200,
        height: 675,
        alt: "STELLA E-Sport Championship Season 2 2027",
      },
    ],
  },
};

export default async function EsportPage() {
  const profile = await getSchoolProfile().catch(() => null);

  return (
    <main>
      <EsportLanding schoolName={profile?.name || "SMK Telkom Lampung"} />
    </main>
  );
}
