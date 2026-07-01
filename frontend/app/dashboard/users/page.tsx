import { Metadata } from "next";
import { UserManager } from "@/components/UserManager";

export const metadata: Metadata = {
  title: "Manajemen Pengguna",
};

export const dynamic = "force-dynamic";

export default function AdminUsersPage() {
  return <UserManager />;
}
