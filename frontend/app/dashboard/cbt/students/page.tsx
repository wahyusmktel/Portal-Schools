import { Metadata } from "next";
import { CbtStudentManager } from "@/components/cbt/CbtStudentManager";

export const metadata: Metadata = {
  title: "Peserta & Kartu Ujian CBT - Portal SMK Telkom Lampung",
};

export default function CbtStudentsPage() {
  return <CbtStudentManager />;
}
