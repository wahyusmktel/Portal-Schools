import { Metadata } from "next";
import { CbtStudentPortal } from "@/components/cbt/student/CbtStudentPortal";

export const metadata: Metadata = {
  title: "Portal Ujian Siswa - CBT SMK Telkom Lampung",
};

export default function StudentPortalPage() {
  return <CbtStudentPortal />;
}
