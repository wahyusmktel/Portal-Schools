import Link from "next/link";
import { Facebook, Instagram, Mail, MapPin, Youtube, Globe, Twitter, Linkedin, Phone } from "lucide-react";
import type { SchoolProfile } from "@/types/content";

function getIconForLabel(label: string) {
  const normalized = label.toLowerCase();
  if (normalized.includes("instagram") || normalized.includes("ig")) return Instagram;
  if (normalized.includes("facebook") || normalized.includes("fb")) return Facebook;
  if (normalized.includes("youtube") || normalized.includes("yt")) return Youtube;
  if (normalized.includes("twitter") || normalized.includes("x")) return Twitter;
  if (normalized.includes("linkedin")) return Linkedin;
  if (normalized.includes("email") || normalized.includes("mail")) return Mail;
  return Globe; // default
}

export function Footer({ profile }: { profile: SchoolProfile }) {
  const socialMedia = profile.socialMedia || [];
  const partnerLinks = profile.partnerLinks || [];

  return (
    <footer className="bg-zinc-900 py-14 text-white">
      <div className="container-page grid gap-10 md:grid-cols-[1.2fr_0.8fr_1fr]">
        <div>
          {socialMedia.length > 0 && (
            <div>
              <h3 className="text-sm font-extrabold uppercase text-white/90">Sosial Media</h3>
              <div className="mt-5 flex gap-3 flex-wrap">
                {socialMedia.map((item) => {
                  const IconComponent = getIconForLabel(item.label);
                  return (
                    <Link
                      key={item.label}
                      href={item.value}
                      aria-label={item.label}
                      className="focus-ring grid h-11 w-11 place-items-center rounded-full bg-white/10 transition hover:-translate-y-1 hover:bg-rosebrand-500"
                      target={item.value.startsWith("http") ? "_blank" : undefined}
                      title={item.label}
                    >
                      <IconComponent size={20} aria-hidden />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
        <div>
          <h3 className="text-sm font-extrabold uppercase text-white/90">Link Partner</h3>
          <div className="mt-5 grid gap-3 text-sm text-white/70">
            {partnerLinks.length > 0 ? (
              partnerLinks.map((item) => (
                <Link key={item.label} href={item.value} target="_blank" className="hover:text-white transition">
                  {item.label}
                </Link>
              ))
            ) : (
              <p className="italic text-white/50">Belum ada partner link</p>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-black mb-6">{profile.name}</h2>
          <div className="flex items-start gap-6">
            {profile.footerLogo && (
              <div className="relative h-20 w-20 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={profile.footerLogo} alt="Footer Logo" className="object-contain h-full w-full" />
              </div>
            )}
            {profile.footerLogo && profile.footerText && (
              <div className="w-px h-24 bg-white/20 shrink-0"></div>
            )}
            <div className="flex-1">
              {profile.footerText && (
                <p className="text-sm leading-6 text-white/70 whitespace-pre-wrap">
                  {profile.footerText}
                </p>
              )}
              
              <div className={`space-y-3 text-sm text-white/70 ${profile.footerText ? 'mt-6' : ''}`}>
                {profile.address && (
                  <p className="flex items-start gap-3">
                    <MapPin size={16} className="mt-0.5 shrink-0 text-rosebrand-500" aria-hidden />
                    <span>{profile.address}</span>
                  </p>
                )}
                {profile.email && (
                  <p className="flex items-center gap-3">
                    <Mail size={16} className="shrink-0 text-rosebrand-500" aria-hidden />
                    <span>{profile.email}</span>
                  </p>
                )}
                {profile.phone && (
                  <p className="flex items-center gap-3">
                    <Phone size={16} className="shrink-0 text-rosebrand-500" aria-hidden />
                    <span>{profile.phone}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container-page mt-10 border-t border-white/10 pt-6 text-sm text-white/50">
        © {new Date().getFullYear()} {profile.name}. Seluruh hak cipta dilindungi.
      </div>
    </footer>
  );
}
