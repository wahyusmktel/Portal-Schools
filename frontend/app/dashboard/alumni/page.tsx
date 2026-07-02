import { AlumniManager } from "@/components/AlumniManager";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Direktori Alumni - Admin Portal",
};

export default function AlumniPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <AlumniManager />
    </div>
  );
}
