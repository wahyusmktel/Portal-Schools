import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SMK Telkom Lampung | Portal Utama Sekolah Teknologi",
    template: "%s | SMK Telkom Lampung"
  },
  description:
    "Portal resmi SMK Telkom Lampung berisi profil sekolah, jurusan, berita pendidikan, teknologi, agenda, dan pengumuman terbaru.",
  keywords: [
    "SMK Telkom Lampung",
    "SMK Teknologi Lampung",
    "Sekolah Telkom Lampung",
    "Jurusan TKJ",
    "Jurusan RPL",
    "Berita pendidikan"
  ],
  authors: [{ name: "SMK Telkom Lampung" }],
  creator: "SMK Telkom Lampung",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "SMK Telkom Lampung",
    description:
      "Portal utama SMK Telkom Lampung untuk profil sekolah, jurusan, berita, agenda, dan pengumuman.",
    url: siteUrl,
    siteName: "SMK Telkom Lampung",
    locale: "id_ID",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "SMK Telkom Lampung",
    description: "Portal resmi sekolah teknologi di Lampung."
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="id" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
