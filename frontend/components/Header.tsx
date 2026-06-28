import Link from "next/link";
import { GraduationCap, LayoutDashboard } from "lucide-react";

const navItems = [
  { href: "#profil", label: "Profil" },
  { href: "#jurusan", label: "Jurusan" },
  { href: "/artikel", label: "Artikel" },
  { href: "#agenda", label: "Agenda" },
  { href: "#lokasi", label: "Lokasi" }
];

export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/20 bg-zinc-950/50 backdrop-blur-xl">
      <div className="container-page flex h-20 items-center justify-between gap-4 text-white">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-rosebrand-500">
            <GraduationCap size={24} aria-hidden />
          </span>
          <span className="leading-tight">
            <span className="block text-base font-extrabold">SMK Telkom</span>
            <span className="block text-sm text-white/75">Lampung</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-semibold text-white/80 lg:flex">
          {navItems.map((item) => (
            item.href.startsWith("/") ? (
              <Link key={item.href} href={item.href} className="transition hover:text-white">
                {item.label}
              </Link>
            ) : (
              <a key={item.href} href={item.href} className="transition hover:text-white">
                {item.label}
              </a>
            )
          ))}
        </nav>
        <Link
          href="/dashboard/login"
          className="focus-ring inline-flex h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-zinc-900 transition hover:bg-rosebrand-50"
        >
          <LayoutDashboard size={18} aria-hidden />
          Dashboard
        </Link>
      </div>
    </header>
  );
}
