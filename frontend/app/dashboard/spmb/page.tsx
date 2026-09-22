import { cookies } from "next/headers";
import { API_URL, getSchoolProfile } from "@/lib/api";
import { SpmbReportManager } from "@/components/SpmbReportManager";
import type { SpmbPaymentConfirmation, SpmbRegistration, SpmbSupplementaryDocument } from "@/types/content";

export const metadata = {
  title: "Report & Manajemen SPMB"
};

export const dynamic = "force-dynamic";

export default async function DashboardSpmbPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const [regRes, payRes, docRes, profile] = await Promise.all([
    fetch(`${API_URL}/admin/spmb/registrations`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Cookie: cookieHeader
      }
    }).catch(() => null),
    fetch(`${API_URL}/admin/spmb/payment-confirmations`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Cookie: cookieHeader
      }
    }).catch(() => null),
    fetch(`${API_URL}/admin/spmb/supplementary-documents`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Cookie: cookieHeader
      }
    }).catch(() => null),
    getSchoolProfile().catch(() => null)
  ]);

  if (!regRes?.ok) {
    return (
      <div className="rounded-[8px] bg-rosebrand-50 p-4 text-sm font-bold text-rosebrand-700">
        Gagal memuat data SPMB. Pastikan akun Anda memiliki role Superadmin, Admin, atau Admin SPMB.
      </div>
    );
  }

  const registrations = ((await regRes.json()) || []) as SpmbRegistration[];
  const paymentConfirmations = payRes?.ok ? (((await payRes.json()) || []) as SpmbPaymentConfirmation[]) : [];
  const supplementaryDocuments = docRes?.ok ? (((await docRes.json()) || []) as SpmbSupplementaryDocument[]) : [];

  return (
    <SpmbReportManager
      items={registrations}
      paymentConfirmations={paymentConfirmations}
      supplementaryDocuments={supplementaryDocuments}
      academicYear={profile?.spmbAcademicYear || "2026/2027"}
    />
  );
}

