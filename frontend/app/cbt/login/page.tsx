import { Metadata } from "next";
import { CbtStudentLogin } from "@/components/cbt/student/CbtStudentLogin";

export const metadata: Metadata = {
  title: "Login Peserta CBT - SMK Telkom Lampung",
};

export default function StudentLoginPage() {
  return <CbtStudentLogin />;
}
