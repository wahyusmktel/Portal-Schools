"use client";

import React, { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, KeyRound, User, Lock, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { API_URL } from "@/lib/api-config";

export function CbtStudentLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/cbt/student/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        // Store in localStorage for client state persistence
        localStorage.setItem("cbt_student_token", data.token);
        localStorage.setItem("cbt_student_info", JSON.stringify(data.student));
        router.push("/cbt");
      } else {
        setError(data?.message || "Nomor peserta atau kata sandi tidak cocok.");
      }
    } catch (e: any) {
      setError(e.message || "Gagal terhubung ke server CBT.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      {/* Background ambient elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/20 mb-4 border border-white/20">
            <GraduationCap className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-wide uppercase">
            CBT SMK TELKOM LAMPUNG
          </h1>
          <p className="text-sm text-indigo-200 mt-1">
            Portal Ujian Berbasis Komputer &amp; Smartphone Siswa
          </p>
        </div>

        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-800">Masuk Peserta Ujian</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Gunakan Nomor Peserta dan Kata Sandi pada Kartu Ujian Anda.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                Nomor Peserta / Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Contoh: UJN-X-PPLG1-001"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toUpperCase())}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                Kata Sandi Ujian
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="Kata sandi 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            >
              {loading ? (
                "Memeriksa Akun..."
              ) : (
                <>
                  <span>Masuk Ruang Ujian</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Koneksi Ujian Terproteksi &amp; Aman</span>
          </div>
        </div>

        <div className="text-center mt-6 text-xs text-indigo-300/70 font-mono">
          SMK Telkom Lampung • Sistem Ujian Berbasis Komputer (CBT)
        </div>
      </div>
    </div>
  );
}
