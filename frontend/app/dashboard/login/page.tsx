import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Login Dashboard",
  robots: {
    index: false,
    follow: false
  }
};

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-softgray px-4 py-12">
      <section className="w-full max-w-md rounded-[8px] bg-white p-8 shadow-soft">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500">
          <ArrowLeft size={17} aria-hidden />
          Kembali ke portal
        </Link>
        <div className="mt-8 grid h-14 w-14 place-items-center rounded-full bg-rosebrand-100 text-rosebrand-700">
          <ShieldCheck size={28} aria-hidden />
        </div>
        <h1 className="mt-5 text-3xl font-black">Dashboard Admin</h1>
        <p className="mt-3 leading-7 text-zinc-600">
          Masuk untuk mengelola artikel, agenda, pengumuman, dan konten portal sekolah.
        </p>
        <div className="mt-8">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
