import { Metadata } from "next";
import { CbtQuestionEditor } from "@/components/cbt/CbtQuestionEditor";

export const metadata: Metadata = {
  title: "Kelola Soal CBT - Portal SMK Telkom Lampung",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CbtBankDetailPage({ params }: Props) {
  const { id } = await params;
  return <CbtQuestionEditor bankId={Number(id)} />;
}
