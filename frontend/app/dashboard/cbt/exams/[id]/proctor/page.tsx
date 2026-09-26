import { Metadata } from "next";
import { CbtProctorDashboard } from "@/components/cbt/CbtProctorDashboard";

export const metadata: Metadata = {
  title: "Layar Pengawas & Token Ujian CBT - Portal SMK Telkom Lampung",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CbtProctorPage({ params }: Props) {
  const { id } = await params;
  return <CbtProctorDashboard examId={Number(id)} />;
}
