import { Metadata } from "next";
import { CbtSubjectManager } from "@/components/cbt/CbtSubjectManager";

export const metadata: Metadata = {
  title: "Mata Pelajaran CBT - Portal SMK Telkom Lampung",
};

export default function CbtSubjectsPage() {
  return <CbtSubjectManager />;
}
