"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { LockKeyhole, LogIn, Mail } from "lucide-react";
import { login } from "@/lib/auth-client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("superadmin@smktelkom-lpg.sch.id");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

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
      <label className="grid gap-2 text-sm font-bold text-zinc-700">
        Email
        <span className="flex items-center gap-3 rounded-[8px] border border-zinc-200 bg-white px-4 py-3">
          <Mail size={18} className="text-zinc-400" aria-hidden />
          <input
            className="w-full bg-transparent outline-none"
            type="email"
            value={email}
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </span>
      </label>
      <label className="grid gap-2 text-sm font-bold text-zinc-700">
        Password
        <span className="flex items-center gap-3 rounded-[8px] border border-zinc-200 bg-white px-4 py-3">
          <LockKeyhole size={18} className="text-zinc-400" aria-hidden />
          <input
            className="w-full bg-transparent outline-none"
            type="password"
            value={password}
            autoComplete="current-password"
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </span>
      </label>
      {message ? <p className="rounded-[8px] bg-rosebrand-50 px-4 py-3 text-sm font-bold text-rosebrand-700">{message}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-[8px] bg-rosebrand-500 px-5 font-extrabold text-white transition hover:bg-rosebrand-600 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <LogIn size={19} aria-hidden />
        {loading ? "Memproses..." : "Masuk Dashboard"}
      </button>
    </form>
  );
}
