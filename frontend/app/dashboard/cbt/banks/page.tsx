import { Metadata } from "next";
import { CbtBankManager } from "@/components/cbt/CbtBankManager";

export const metadata: Metadata = {
  title: "Bank Soal CBT - Portal SMK Telkom Lampung",
};

export default function CbtBanksPage() {
  return <CbtBankManager />;
}
