import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Roboto } from "next/font/google";
import { DashboardShell } from "@/components/DashboardShell";

const roboto = Roboto({
  weight: ["300", "400", "500", "700", "900"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "Dashboard",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${roboto.className} ${roboto.variable} font-sans`} data-dashboard-root>
      <DashboardShell>{children}</DashboardShell>
    </div>
  );
}
