import { Metadata } from "next";
import { CbtExamPlayer } from "@/components/cbt/student/CbtExamPlayer";

export const metadata: Metadata = {
  title: "Lembar Ujian CBT - SMK Telkom Lampung",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function StudentExamPlayerPage({ params }: Props) {
  const { id } = await params;
  return <CbtExamPlayer examId={Number(id)} />;
}
