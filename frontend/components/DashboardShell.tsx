"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import {
  Bot,
  Bell,
  BookOpen,
  BookOpenCheck,
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
  Sparkles,
  Target,
  ChevronDown,
  Database,
  Layers,
  Laptop,
} from "lucide-react";
import { API_URL } from "@/lib/api-config";
import { logout } from "@/lib/auth-client";

type MenuItem =
  | {
      type?: "link";
      href: string;
      label: string;
      icon: any;
    }
  | {
      type: "group";
      label: string;
      icon: any;
      children: {
        href: string;
        label: string;
        icon: any;
      }[];
    };

const menu: MenuItem[] = [
  { href: "/dashboard", label: "Ringkasan", icon: LayoutDashboard },
  {
    type: "group",
    label: "CBT",
    icon: Laptop,
    children: [
      { href: "/dashboard/cbt/exams", label: "Jadwal Ujian CBT", icon: Calendar },
      { href: "/dashboard/cbt/students", label: "Peserta & Kartu CBT", icon: Users },
      { href: "/dashboard/cbt/banks", label: "Bank Soal CBT", icon: Database },
      { href: "/dashboard/cbt/subjects", label: "Mapel CBT", icon: Layers },
    ],
  },
  { href: "/dashboard/school-profile", label: "Profil Sekolah", icon: Building },
  { href: "/dashboard/hero-slides", label: "Slider Hero", icon: Images },
  { href: "/dashboard/why-choose-us", label: "Why Sekolah", icon: Sparkles },
  { href: "/dashboard/school-uvp", label: "UVP Sekolah", icon: Target },
  { href: "/dashboard/teaching-modules", label: "Modul Ajar", icon: BookOpenCheck },
  { href: "/dashboard/articles", label: "Artikel & Berita", icon: FileText },
  { href: "/dashboard/comments", label: "Moderasi Komentar", icon: MessageCircle },
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
  { href: "/dashboard/ai-config", label: "Config AI", icon: Bot },
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
    if (
      role === "redaksi" &&
      !pathname.startsWith("/dashboard/articles") &&
      !pathname.startsWith("/dashboard/comments") &&
      pathname !== "/dashboard/login"
    ) {
      router.replace("/dashboard/articles");
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

  const [isCbtOpen, setIsCbtOpen] = useState(true);

  // Keep CBT open if navigating to a CBT route
  useEffect(() => {
    if (pathname.startsWith("/dashboard/cbt")) {
      setIsCbtOpen(true);
    }
  }, [pathname]);

  const visibleMenu = menu.filter((item) => {
    if (role === "admin-spmb") {
      return "href" in item && item.href === "/dashboard/spmb";
    }
    if (role === "redaksi") {
      return "href" in item && (item.href === "/dashboard/articles" || item.href === "/dashboard/comments");
    }
    if (role === "contributor") {
      if (item.type === "group") return false;
      return (
        item.href === "/dashboard" ||
        item.href === "/dashboard/articles" ||
        item.href === "/dashboard/announcements" ||
        item.href === "/dashboard/agendas" ||
        item.href === "/dashboard/teaching-modules"
      );
    }
    if ("href" in item) {
      if (item.href === "/dashboard/spmb") {
        return role === "superadmin" || role === "admin";
      }
      if (item.href === "/dashboard/users" || item.href === "/dashboard/ai-config") {
        return role === "superadmin";
      }
    }
    if (item.type === "group" && item.label === "CBT") {
      return role === "superadmin" || role === "admin";
    }
    return true;
  });

  const renderNavItems = (onItemClick?: () => void) => {
    return visibleMenu.map((item) => {
      if (item.type === "group") {
        const isGroupActive = item.children.some(
          (sub) => pathname === sub.href || pathname.startsWith(sub.href + "/")
        );
        return (
          <div key={item.label} className="grid gap-1">
            <button
              type="button"
              onClick={() => setIsCbtOpen((prev) => !prev)}
              className={`flex w-full items-center justify-between rounded-[8px] px-4 py-3 text-sm font-bold transition select-none ${
                isGroupActive
                  ? "bg-rosebrand-50/70 text-rosebrand-700 font-extrabold"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-rosebrand-600"
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={18} className={isGroupActive ? "text-rosebrand-600" : "text-zinc-500"} aria-hidden />
                <span>{item.label}</span>
              </div>
              <ChevronDown
                size={16}
                className={`text-zinc-400 transition-transform duration-200 ${
                  isCbtOpen ? "rotate-180 text-rosebrand-600" : ""
                }`}
                aria-hidden
              />
            </button>

            {isCbtOpen && (
              <div className="ml-5 mt-0.5 grid gap-1 border-l-2 border-rosebrand-100 pl-2.5 py-1">
                {item.children.map((sub) => {
                  const isSubActive = pathname === sub.href || pathname.startsWith(sub.href + "/");
                  return (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      onClick={onItemClick}
                      className={`flex items-center gap-2.5 rounded-[8px] px-3 py-2 text-xs font-bold transition ${
                        isSubActive
                          ? "bg-rosebrand-50 text-rosebrand-700 shadow-xs"
                          : "text-zinc-600 hover:bg-zinc-50 hover:text-rosebrand-600"
                      }`}
                    >
                      <sub.icon size={15} className={isSubActive ? "text-rosebrand-600" : "text-zinc-400"} aria-hidden />
                      <span>{sub.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      }

      const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={onItemClick}
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
    });
  };

  return (
    <div className="min-h-screen bg-softgray">
      <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col border-r border-zinc-200 bg-white p-5 lg:flex">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-rosebrand-500 text-white">
            <ShieldCheck size={22} aria-hidden />
          </span>
          <span>
            <span className="block font-black">Portal Admin</span>
            <span className="text-sm text-zinc-500">SMK Telkom Lampung</span>
          </span>
        </Link>
        <nav className="smooth-sidebar-scroll mt-10 grid min-h-0 flex-1 content-start gap-2 overflow-y-auto overscroll-contain pr-1 pb-4">
          {renderNavItems()}
        </nav>
        <div className="mt-4 grid gap-2 border-t border-zinc-100 pt-4">
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
            
            <nav className="smooth-sidebar-scroll mt-8 grid min-h-0 flex-1 content-start gap-2 overflow-y-auto overscroll-contain pr-1 pb-4">
              {renderNavItems(() => setIsMobileMenuOpen(false))}
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
