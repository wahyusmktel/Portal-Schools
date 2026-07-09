"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff, LockKeyhole, LogIn, Mail, RefreshCw, ShieldCheck } from "lucide-react";
import { login } from "@/lib/auth-client";
import { API_URL } from "@/lib/api-config";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [captchaId, setCaptchaId] = useState("");
  const [captchaValue, setCaptchaValue] = useState("");
  const [captchaLoading, setCaptchaLoading] = useState(false);

  useEffect(() => {
    loadCaptcha();
  }, []);

  async function loadCaptcha() {
    setCaptchaLoading(true);
    setCaptchaValue("");
    try {
      const response = await fetch(`${API_URL}/captcha/new`, {
        cache: "no-store",
        headers: { Accept: "application/json" }
      });
      const data = await response.json();
      setCaptchaId(data?.captchaId || "");
    } catch {
      setMessage("Gagal memuat captcha. Muat ulang halaman atau coba beberapa saat lagi.");
    } finally {
      setCaptchaLoading(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!captchaId || !captchaValue.trim()) {
      setMessage("Masukkan kode captcha terlebih dahulu.");
      return;
    }

    setLoading(true);
    setMessage("");

    const result = await login(email, password, captchaId, captchaValue);
    setLoading(false);

    if (!result.ok) {
      setMessage(result.message);
      await loadCaptcha();
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <label className="grid gap-2 text-sm font-bold text-zinc-800">
        Email admin
        <span className="flex h-12 items-center gap-3 rounded-[8px] border border-zinc-200 bg-white px-4 transition focus-within:border-rosebrand-500 focus-within:ring-4 focus-within:ring-rosebrand-500/10">
          <Mail size={18} className="text-zinc-400" aria-hidden />
          <input
            className="w-full bg-transparent text-sm font-semibold outline-none"
            type="email"
            value={email}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </span>
      </label>
      <label className="grid gap-2 text-sm font-bold text-zinc-800">
        Password
        <span className="flex h-12 items-center gap-3 rounded-[8px] border border-zinc-200 bg-white px-4 transition focus-within:border-rosebrand-500 focus-within:ring-4 focus-within:ring-rosebrand-500/10">
          <LockKeyhole size={18} className="text-zinc-400" aria-hidden />
          <input
            className="w-full bg-transparent text-sm font-semibold outline-none"
            type={showPassword ? "text" : "password"}
            value={password}
            autoComplete="current-password"
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="grid h-8 w-8 place-items-center rounded-[8px] text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
          >
            {showPassword ? <EyeOff size={17} aria-hidden /> : <Eye size={17} aria-hidden />}
          </button>
        </span>
      </label>
      <label className="grid gap-2 text-sm font-bold text-zinc-800">
        Kode captcha
        <div className="grid gap-3 rounded-[8px] border border-zinc-200 bg-zinc-50 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex h-14 min-w-0 flex-1 items-center justify-center overflow-hidden rounded-[8px] border border-zinc-200 bg-white">
              {captchaId ? (
                <img
                  src={`${API_URL}/captcha/image/${captchaId}`}
                  alt="Kode captcha"
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="inline-flex items-center gap-2 text-xs font-bold text-zinc-500">
                  <ShieldCheck size={15} aria-hidden />
                  {captchaLoading ? "Memuat captcha..." : "Captcha tidak tersedia"}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={loadCaptcha}
              disabled={captchaLoading}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-[8px] border border-zinc-200 bg-white text-zinc-500 transition hover:border-rosebrand-200 hover:bg-rosebrand-50 hover:text-rosebrand-700 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Muat ulang captcha"
            >
              <RefreshCw size={18} className={captchaLoading ? "animate-spin" : ""} aria-hidden />
            </button>
          </div>
          <input
            className="h-12 rounded-[8px] border border-zinc-200 bg-white px-4 text-sm font-semibold tracking-[0.24em] outline-none transition focus:border-rosebrand-500 focus:ring-4 focus:ring-rosebrand-500/10"
            value={captchaValue}
            onChange={(event) => setCaptchaValue(event.target.value)}
            inputMode="numeric"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            required
          />
        </div>
      </label>
      {message ? <p className="rounded-[8px] bg-rosebrand-50 px-4 py-3 text-sm font-bold text-rosebrand-700">{message}</p> : null}
      <button
        type="submit"
        disabled={loading || captchaLoading}
        className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-[8px] bg-zinc-950 px-5 font-extrabold text-white transition hover:bg-rosebrand-600 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <LogIn size={19} aria-hidden />
        {loading ? "Memproses..." : "Masuk Dashboard"}
      </button>
    </form>
  );
}
