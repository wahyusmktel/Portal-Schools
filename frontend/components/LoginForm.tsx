"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Eye, EyeOff, LockKeyhole, LogIn, Mail } from "lucide-react";
import { login } from "@/lib/auth-client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const result = await login(email, password);
    setLoading(false);

    if (!result.ok) {
      setMessage(result.message);
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
      {message ? <p className="rounded-[8px] bg-rosebrand-50 px-4 py-3 text-sm font-bold text-rosebrand-700">{message}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-[8px] bg-zinc-950 px-5 font-extrabold text-white transition hover:bg-rosebrand-600 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <LogIn size={19} aria-hidden />
        {loading ? "Memproses..." : "Masuk Dashboard"}
      </button>
    </form>
  );
}
