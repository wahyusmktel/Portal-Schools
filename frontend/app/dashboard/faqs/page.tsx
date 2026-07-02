import { FaqManager } from "@/components/FaqManager";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manajemen FAQ - Admin Portal",
};

export default function FaqsPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <FaqManager />
    </div>
  );
}
