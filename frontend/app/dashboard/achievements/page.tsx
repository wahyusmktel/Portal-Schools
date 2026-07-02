import { AchievementManager } from "@/components/AchievementManager";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manajemen Prestasi - Admin Portal",
};

export default function AchievementsPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <AchievementManager />
    </div>
  );
}
