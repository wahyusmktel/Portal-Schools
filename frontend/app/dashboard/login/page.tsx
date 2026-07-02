import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, KeyRound, ShieldCheck } from "lucide-react";
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
    <main className="min-h-screen bg-zinc-100 px-4 py-10 text-zinc-950">
      <section className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-5xl overflow-hidden rounded-[8px] border border-zinc-200 bg-white shadow-soft lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="hidden bg-zinc-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <Link href="/" className="inline-flex w-fit items-center gap-2 text-sm font-bold text-white/70 transition hover:text-white">
            <ArrowLeft size={17} aria-hidden />
            Kembali ke portal
          </Link>
          <div>
            <div className="mb-6 grid h-14 w-14 place-items-center rounded-[8px] bg-white/10 text-white ring-1 ring-white/15">
              <ShieldCheck size={28} aria-hidden />
            </div>
            <h1 className="max-w-sm text-4xl font-black tracking-normal">Akses dashboard internal</h1>
            <p className="mt-4 max-w-sm text-sm font-semibold leading-6 text-white/60">
              Area ini hanya untuk akun pengelola resmi portal sekolah.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-white/70">
            <div className="flex items-center gap-3 rounded-[8px] border border-white/10 bg-white/5 px-4 py-3">
              <KeyRound size={17} className="text-rosebrand-500" aria-hidden />
              Sesi dilindungi cookie aman dan token CSRF.
            </div>
          </div>
        </aside>

        <div className="grid content-center p-6 sm:p-10">
          <Link href="/" className="mb-10 inline-flex w-fit items-center gap-2 text-sm font-bold text-zinc-500 transition hover:text-zinc-900 lg:hidden">
            <ArrowLeft size={17} aria-hidden />
            Kembali ke portal
          </Link>
          <div className="mx-auto w-full max-w-md">
            <div className="grid h-12 w-12 place-items-center rounded-[8px] bg-rosebrand-50 text-rosebrand-700">
              <ShieldCheck size={25} aria-hidden />
            </div>
            <h2 className="mt-6 text-3xl font-black tracking-normal">Dashboard Admin</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-zinc-500">
              Masukkan kredensial admin untuk mengelola konten portal.
            </p>
            <div className="mt-8">
              <LoginForm />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
