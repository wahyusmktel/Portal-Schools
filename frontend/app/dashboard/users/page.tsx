import { UserEditor } from "@/components/UserEditor";

export default function DashboardUsersPage() {
  return (
    <div className="grid gap-6">
      <section>
        <p className="text-sm font-extrabold uppercase text-rosebrand-600">Pengguna</p>
        <h1 className="mt-2 text-3xl font-black">Manajemen role</h1>
        <p className="mt-4 max-w-2xl leading-7 text-zinc-600">
          Hanya superadmin yang diizinkan membuat akun baru. Role tersedia: superadmin,
          admin, dan kontributor.
        </p>
      </section>
      <UserEditor />
    </div>
  );
}
