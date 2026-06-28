"use client";

import { FormEvent, useState } from "react";
import { UserPlus } from "lucide-react";
import { API_URL } from "@/lib/api";
import { getCookie } from "@/lib/auth-client";

export function UserEditor() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("contributor");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const response = await fetch(`${API_URL}/users`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": getCookie("csrf_token")
      },
      body: JSON.stringify({ name, email, password, role })
    }).catch(() => null);

    setLoading(false);

    if (!response?.ok) {
      setMessage("User belum tersimpan. Pastikan akun yang login adalah superadmin.");
      return;
    }

    setName("");
    setEmail("");
    setPassword("");
    setRole("contributor");
    setMessage("User berhasil dibuat.");
  }

  return (
    <form onSubmit={onSubmit} className="grid max-w-2xl gap-4 rounded-[8px] bg-white p-6 shadow-sm">
      <h2 className="text-xl font-black">Tambah Pengguna</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-zinc-700">
          Nama
          <input value={name} onChange={(event) => setName(event.target.value)} className="rounded-[8px] border border-zinc-200 px-4 py-3 outline-none focus:border-rosebrand-500" required />
        </label>
        <label className="grid gap-2 text-sm font-bold text-zinc-700">
          Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-[8px] border border-zinc-200 px-4 py-3 outline-none focus:border-rosebrand-500" required />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-zinc-700">
          Password
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="rounded-[8px] border border-zinc-200 px-4 py-3 outline-none focus:border-rosebrand-500" minLength={8} required />
        </label>
        <label className="grid gap-2 text-sm font-bold text-zinc-700">
          Role
          <select value={role} onChange={(event) => setRole(event.target.value)} className="rounded-[8px] border border-zinc-200 px-4 py-3 outline-none focus:border-rosebrand-500">
            <option value="contributor">Kontributor</option>
            <option value="admin">Admin</option>
            <option value="superadmin">Superadmin</option>
          </select>
        </label>
      </div>
      {message ? <p className="rounded-[8px] bg-softgray px-4 py-3 text-sm font-bold text-zinc-600">{message}</p> : null}
      <button type="submit" disabled={loading} className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-rosebrand-500 px-5 text-sm font-extrabold text-white disabled:opacity-70">
        <UserPlus size={18} aria-hidden />
        {loading ? "Menyimpan..." : "Tambah User"}
      </button>
    </form>
  );
}
