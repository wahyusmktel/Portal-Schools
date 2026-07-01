import { API_URL, getSchoolProfile } from "@/lib/api";
import { FacilityGallery } from "@/components/FacilityGallery";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fasilitas Sekolah",
  description: "Fasilitas, infrastruktur, dan laboratorium modern di SMK Telkom Lampung.",
};

export const revalidate = 0;

export default async function FacilitiesPage() {
  const [profile, facilitiesRes] = await Promise.all([
    getSchoolProfile(),
    fetch(`${API_URL}/facilities`, { cache: 'no-store' })
  ]);
  
  const facilities = facilitiesRes.ok ? await facilitiesRes.json() : [];

  return <FacilityGallery facilities={facilities} profile={profile} />;
}
