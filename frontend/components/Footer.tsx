import Link from "next/link";
import { Facebook, Instagram, Mail, MapPin, Youtube } from "lucide-react";
import type { SchoolProfile } from "@/types/content";

export function Footer({ profile }: { profile: SchoolProfile }) {
  return (
    <footer className="bg-zinc-900 py-14 text-white">
      <div className="container-page grid gap-10 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <h2 className="text-2xl font-black">{profile.name}</h2>
          <p className="mt-4 max-w-md text-sm leading-7 text-white/70">{profile.description}</p>
          <p className="mt-5 flex items-start gap-2 text-sm text-white/70">
            <MapPin size={18} className="mt-0.5 shrink-0 text-rosebrand-500" aria-hidden />
            {profile.address}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-extrabold uppercase text-white/90">Link Partner</h3>
          <div className="mt-5 grid gap-3 text-sm text-white/70">
            <Link href="https://www.kemdikbud.go.id" target="_blank">Kemendikbud</Link>
            <Link href="https://www.telkom.co.id" target="_blank">Telkom Indonesia</Link>
            <Link href="https://www.smktelkom-lpg.sch.id" target="_blank">Website Lama</Link>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-extrabold uppercase text-white/90">Sosial Media</h3>
          <div className="mt-5 flex gap-3">
            {[
              { label: "Instagram", icon: Instagram, href: "https://www.instagram.com" },
              { label: "Facebook", icon: Facebook, href: "https://www.facebook.com" },
              { label: "YouTube", icon: Youtube, href: "https://www.youtube.com" },
              { label: "Email", icon: Mail, href: `mailto:${profile.email}` }
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                aria-label={item.label}
                className="focus-ring grid h-11 w-11 place-items-center rounded-full bg-white/10 transition hover:-translate-y-1 hover:bg-rosebrand-500"
                target={item.href.startsWith("http") ? "_blank" : undefined}
              >
                <item.icon size={20} aria-hidden />
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="container-page mt-10 border-t border-white/10 pt-6 text-sm text-white/50">
        © {new Date().getFullYear()} SMK Telkom Lampung. Seluruh hak cipta dilindungi.
      </div>
    </footer>
  );
}
