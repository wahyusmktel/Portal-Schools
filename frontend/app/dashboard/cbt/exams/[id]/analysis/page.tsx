import { Metadata } from "next";
import { CbtExamAnalysis } from "@/components/cbt/CbtExamAnalysis";

export const metadata: Metadata = {
  title: "Analisis Butir Soal & Rekap Nilai CBT - Portal SMK Telkom Lampung",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CbtExamAnalysisPage({ params }: Props) {
  const { id } = await params;
  return <CbtExamAnalysis examId={Number(id)} />;
}
