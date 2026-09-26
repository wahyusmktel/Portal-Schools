import { Metadata } from "next";
import { CbtExamManager } from "@/components/cbt/CbtExamManager";

export const metadata: Metadata = {
  title: "Jadwal & Sesi Ujian CBT - Portal SMK Telkom Lampung",
};

export default function CbtExamsPage() {
  return <CbtExamManager />;
}
