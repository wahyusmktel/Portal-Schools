"use client";

import { useState, useEffect, FormEvent } from "react";
import { Plus, Edit2, Trash2, X, Lock, Users } from "lucide-react";
import { API_URL } from "@/lib/api";
import { getCookie } from "@/lib/auth-client";
import { formatDate } from "@/lib/article-utils";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
};

export function UserManager() {
  const [items, setItems] = useState<User[]>([]);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "reset" | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [form, setForm] = useState({
    id: 0,
    name: "",
    email: "",
    password: "",
    role: "admin",
    isActive: true
  });

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    const res = await fetch(`${API_URL}/users`, {
      headers: { "X-CSRF-Token": getCookie("csrf_token") },
      credentials: "include"
    }).catch(() => null);
    if (res?.ok) {
      const data = await res.json();
      setItems(data || []);
    }
  }

  function openCreate() {
    setForm({ id: 0, name: "", email: "", password: "", role: "admin", isActive: true });
    setNotice(null);
    setModalMode("create");
  }

  function openEdit(item: User) {
    setForm({
      id: item.id,
      name: item.name,
      email: item.email,
      password: "",
      role: item.role,
      isActive: item.isActive
    });
    setNotice(null);
    setModalMode("edit");
  }

  function openReset(item: User) {
    setForm({ ...form, id: item.id, password: "" });
    setNotice(null);
    setModalMode("reset");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setNotice(null);

    let endpoint = "";
    let method = "";
    let payload: any = {};

    if (modalMode === "create") {
      endpoint = `${API_URL}/users`;
      method = "POST";
      payload = { name: form.name, email: form.email, password: form.password, role: form.role };
    } else if (modalMode === "edit") {
      endpoint = `${API_URL}/users/${form.id}`;
      method = "PUT";
      payload = { name: form.name, email: form.email, role: form.role, isActive: form.isActive };
    } else if (modalMode === "reset") {
      endpoint = `${API_URL}/users/${form.id}/reset-password`;
      method = "PUT";
      payload = { newPassword: form.password };
    }

    const res = await fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": getCookie("csrf_token")
      },
      credentials: "include",
      body: JSON.stringify(payload)
    }).catch(() => null);

    setLoading(false);
    if (res?.ok) {
      setNotice({ type: "success", message: `Aksi ${modalMode} berhasil.` });
      setModalMode(null);
      fetchItems();
    } else {
      const err = await res?.json().catch(() => null);
      setNotice({ type: "error", message: err?.message || "Gagal memproses." });
    }
  }

  async function deleteItem(item: User) {
    if (!window.confirm(`Hapus pengguna "${item.name}"?`)) return;
    
    const res = await fetch(`${API_URL}/users/${item.id}`, {
      method: "DELETE",
      headers: { "X-CSRF-Token": getCookie("csrf_token") },
      credentials: "include"
    }).catch(() => null);

    if (res?.ok) {
      fetchItems();
    } else {
      alert("Gagal menghapus pengguna.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900">Manajemen Pengguna</h1>
          <p className="text-zinc-600 mt-1">Kelola akses akun Superadmin, Admin, dan Kontributor.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex h-11 items-center gap-2 rounded-[8px] bg-rosebrand-500 px-5 text-sm font-extrabold text-white transition hover:bg-rosebrand-600"
        >
          <Plus size={18} /> Tambah Pengguna
        </button>
      </div>

      <div className="rounded-[8px] border border-zinc-200 bg-white overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600">
            <tr>
              <th className="px-6 py-4 font-extrabold">Nama & Email</th>
              <th className="px-6 py-4 font-extrabold">Peran</th>
              <th className="px-6 py-4 font-extrabold">Status</th>
              <th className="px-6 py-4 font-extrabold">Dibuat</th>
              <th className="px-6 py-4 font-extrabold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-zinc-50/50 transition">
                <td className="px-6 py-4">
                  <div className="font-bold text-zinc-900">{item.name}</div>
                  <div className="text-zinc-500 text-xs mt-1">{item.email}</div>
                </td>
                <td className="px-6 py-4 capitalize font-bold text-zinc-700">{item.role}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
                    item.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                  }`}>
                    {item.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                </td>
                <td className="px-6 py-4 text-zinc-600">{formatDate(item.createdAt)}</td>
                <td className="px-6 py-4 text-right space-x-1">
                  <button onClick={() => openEdit(item)} className="p-2 text-zinc-500 hover:text-rosebrand-600 hover:bg-rosebrand-50 rounded-[6px] transition" title="Edit Pengguna">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => openReset(item)} className="p-2 text-zinc-500 hover:text-orange-600 hover:bg-orange-50 rounded-[6px] transition" title="Reset Password">
                    <Lock size={16} />
                  </button>
                  <button onClick={() => deleteItem(item)} className="p-2 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-[6px] transition" title="Hapus">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-zinc-500">
                  Memuat data pengguna...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-zinc-950/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-[12px] shadow-soft overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
              <h3 className="text-lg font-black text-zinc-900">
                {modalMode === "create" ? "Tambah Pengguna" : modalMode === "edit" ? "Edit Pengguna" : "Reset Password"}
              </h3>
              <button onClick={() => setModalMode(null)} className="text-zinc-400 hover:text-zinc-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={onSubmit} className="p-6 grid gap-5">
              {notice && (
                <div className={`p-4 rounded-[8px] text-sm font-bold ${notice.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                  {notice.message}
                </div>
              )}
              
              {modalMode !== "reset" && (
                <>
                  <label className="grid gap-2 text-sm font-bold text-zinc-700">
                    Nama Lengkap
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      className="rounded-[8px] border border-zinc-200 px-4 py-3 outline-none focus:border-rosebrand-500"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-bold text-zinc-700">
                    Email
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      className="rounded-[8px] border border-zinc-200 px-4 py-3 outline-none focus:border-rosebrand-500"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-bold text-zinc-700">
                    Peran (Role)
                    <select
                      value={form.role}
                      onChange={e => setForm({ ...form, role: e.target.value })}
                      className="rounded-[8px] border border-zinc-200 px-4 py-3 outline-none focus:border-rosebrand-500"
                    >
                      <option value="superadmin">Superadmin</option>
                      <option value="admin">Admin</option>
                      <option value="admin-spmb">Admin SPMB</option>
                      <option value="contributor">Contributor</option>
                    </select>
                  </label>
                  {modalMode === "edit" && (
                    <label className="flex items-center gap-2 text-sm font-bold text-zinc-700 mt-2">
                      <input
                        type="checkbox"
                        checked={form.isActive}
                        onChange={e => setForm({ ...form, isActive: e.target.checked })}
                        className="w-4 h-4 rounded text-rosebrand-600 focus:ring-rosebrand-500"
                      />
                      Akun Aktif (Bisa Login)
                    </label>
                  )}
                </>
              )}

              {(modalMode === "create" || modalMode === "reset") && (
                <label className="grid gap-2 text-sm font-bold text-zinc-700">
                  Password Baru
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    className="rounded-[8px] border border-zinc-200 px-4 py-3 outline-none focus:border-rosebrand-500"
                  />
                </label>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalMode(null)} className="h-11 px-5 rounded-[8px] font-bold text-zinc-600 hover:bg-zinc-100 transition">
                  Batal
                </button>
                <button type="submit" disabled={loading} className="h-11 px-5 rounded-[8px] font-extrabold text-white bg-rosebrand-500 hover:bg-rosebrand-600 transition disabled:opacity-50">
                  {loading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
