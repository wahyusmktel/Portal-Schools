"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { BarChart3, CalendarDays, FileText, GraduationCap, Home, Landmark, LogOut, Megaphone, ShieldCheck, Users } from "lucide-react";
import { logout } from "@/lib/auth-client";

const menu = [
  { href: "/dashboard", label: "Ringkasan", icon: BarChart3 },
  { href: "/dashboard/school-profile", label: "Profil Sekolah", icon: Landmark },
  { href: "/dashboard/articles", label: "Artikel", icon: FileText },
  { href: "/dashboard/majors", label: "Jurusan", icon: GraduationCap },
  { href: "/dashboard/announcements", label: "Pengumuman", icon: Megaphone },
  { href: "/dashboard/agendas", label: "Agenda", icon: CalendarDays },
  { href: "/dashboard/users", label: "Pengguna", icon: Users }
];

export function DashboardShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  if (pathname === "/dashboard/login") {
    return <>{children}</>;
  }

  async function handleLogout() {
    await logout();
    router.push("/dashboard/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-softgray">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-zinc-200 bg-white p-5 lg:block">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-rosebrand-500 text-white">
            <ShieldCheck size={22} aria-hidden />
          </span>
          <span>
            <span className="block font-black">Portal Admin</span>
            <span className="text-sm text-zinc-500">SMK Telkom Lampung</span>
          </span>
        </Link>
        <nav className="mt-10 grid gap-2">
          {menu.map((item) => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-[8px] px-4 py-3 text-sm font-bold text-zinc-600 transition hover:bg-rosebrand-50 hover:text-rosebrand-700">
              <item.icon size={18} aria-hidden />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute inset-x-5 bottom-5 grid gap-2">
          <Link href="/" className="flex items-center gap-3 rounded-[8px] px-4 py-3 text-sm font-bold text-zinc-600 transition hover:bg-zinc-100">
            <Home size={18} aria-hidden />
            Lihat Website
          </Link>
          <button type="button" onClick={handleLogout} className="flex items-center gap-3 rounded-[8px] px-4 py-3 text-sm font-bold text-zinc-600 transition hover:bg-zinc-100">
            <LogOut size={18} aria-hidden />
            Keluar
          </button>
        </div>
      </aside>
      <main className="lg:pl-72">
        <div className="border-b border-zinc-200 bg-white px-5 py-4 lg:hidden">
          <p className="font-black">Portal Admin</p>
        </div>
        <div className="p-5 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
