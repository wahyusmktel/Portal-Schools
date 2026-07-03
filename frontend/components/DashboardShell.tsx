"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import {
  Bell,
  BookOpen,
  Calendar,
  FileText,
  MessageCircle,
  LayoutDashboard,
  LogOut,
  Home,
  Images,
  ShieldCheck,
  School,
  Users,
  UserCheck,
  Building2,
  Trophy,
  Briefcase,
  GraduationCap,
  HelpCircle,
  Menu,
  X,
  Building,
  Megaphone,
  ClipboardList,
} from "lucide-react";
import { API_URL } from "@/lib/api-config";
import { logout } from "@/lib/auth-client";

const menu = [
  { href: "/dashboard", label: "Ringkasan", icon: LayoutDashboard },
  { href: "/dashboard/school-profile", label: "Profil Sekolah", icon: Building },
  { href: "/dashboard/hero-slides", label: "Slider Hero", icon: Images },
  { href: "/dashboard/articles", label: "Artikel Utama", icon: FileText },
  { href: "/dashboard/agendas", label: "Agenda Kegiatan", icon: Calendar },
  { href: "/dashboard/announcements", label: "Pengumuman", icon: Megaphone },
  { href: "/dashboard/spmb", label: "Report SPMB", icon: ClipboardList },
  { href: "/dashboard/facilities", label: "Fasilitas", icon: Building2 },
  { href: "/dashboard/majors", label: "Jurusan", icon: BookOpen },
  { href: "/dashboard/employees", label: "Pegawai", icon: UserCheck },
  { href: "/dashboard/achievements", label: "Prestasi", icon: Trophy },
  { href: "/dashboard/industry-partners", label: "Mitra Industri", icon: Briefcase },
  { href: "/dashboard/alumni", label: "Alumni", icon: GraduationCap },
  { href: "/dashboard/faqs", label: "Pusat Bantuan", icon: HelpCircle },
  { href: "/dashboard/users", label: "Pengguna", icon: Users },
];

export function DashboardShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [role, setRole] = useState("");

  // Prevent scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (pathname === "/dashboard/login") {
      return;
    }
    fetch(`${API_URL}/auth/me`, {
      credentials: "include",
      cache: "no-store",
      headers: { Accept: "application/json" }
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setRole(data?.role || ""))
      .catch(() => setRole(""));
  }, [pathname]);

  useEffect(() => {
    if (role === "admin-spmb" && pathname !== "/dashboard/spmb" && pathname !== "/dashboard/login") {
      router.replace("/dashboard/spmb");
    }
  }, [pathname, role, router]);

  if (pathname === "/dashboard/login") {
    return <>{children}</>;
  }

  async function handleLogout() {
    await logout();
    router.push("/dashboard/login");
    router.refresh();
  }

  const visibleMenu =
    role === "admin-spmb"
      ? menu.filter((item) => item.href === "/dashboard/spmb")
      : menu.filter((item) => item.href !== "/dashboard/spmb" || role === "superadmin" || role === "admin");

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
          {visibleMenu.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`flex items-center gap-3 rounded-[8px] px-4 py-3 text-sm font-bold transition ${
                  isActive 
                    ? "bg-rosebrand-50 text-rosebrand-700 shadow-sm" 
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-rosebrand-600"
                }`}
              >
                <item.icon size={18} aria-hidden />
                {item.label}
              </Link>
            );
          })}
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

      {/* MOBILE HEADER */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-200 bg-white px-5 py-4 lg:hidden">
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-rosebrand-500 text-white">
            <ShieldCheck size={16} aria-hidden />
          </span>
          <p className="font-black">Portal Admin</p>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="grid h-10 w-10 place-items-center rounded-full bg-zinc-50 text-zinc-600 transition hover:bg-zinc-100"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* MOBILE SIDEBAR OVERLAY */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* BACKDROP */}
          <div 
            className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* SIDEBAR CONTENT */}
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[80vw] bg-white p-5 shadow-2xl flex flex-col h-full animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3" onClick={() => setIsMobileMenuOpen(false)}>
                <span className="grid h-11 w-11 place-items-center rounded-full bg-rosebrand-500 text-white">
                  <ShieldCheck size={22} aria-hidden />
                </span>
                <span>
                  <span className="block font-black">Portal Admin</span>
                  <span className="text-xs text-zinc-500">SMK Telkom</span>
                </span>
              </Link>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-zinc-50 text-zinc-500"
              >
                <X size={18} />
              </button>
            </div>
            
            <nav className="mt-8 grid gap-2 overflow-y-auto flex-1 pb-4">
              {visibleMenu.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link 
                    key={item.href} 
                    href={item.href} 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-[8px] px-4 py-3 text-sm font-bold transition ${
                      isActive 
                        ? "bg-rosebrand-50 text-rosebrand-700 shadow-sm" 
                        : "text-zinc-600 hover:bg-zinc-50 hover:text-rosebrand-600"
                    }`}
                  >
                    <item.icon size={18} aria-hidden />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="grid gap-2 pt-4 border-t border-zinc-100">
              <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 rounded-[8px] px-4 py-3 text-sm font-bold text-zinc-600 transition hover:bg-zinc-100">
                <Home size={18} aria-hidden />
                Lihat Website
              </Link>
              <button type="button" onClick={handleLogout} className="flex items-center gap-3 rounded-[8px] px-4 py-3 text-sm font-bold text-rosebrand-600 transition hover:bg-rosebrand-50">
                <LogOut size={18} aria-hidden />
                Keluar
              </button>
            </div>
          </aside>
        </div>
      )}

      <main className="lg:pl-72">
        <div className="p-5 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
