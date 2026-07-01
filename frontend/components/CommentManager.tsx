"use client";

import { useEffect, useState } from "react";
import { MessageCircle, CheckCircle, XCircle } from "lucide-react";
import { formatDate } from "@/lib/article-utils";
import { API_URL } from "@/lib/api";
import { getCookie } from "@/lib/auth-client";

type Comment = {
  id: number;
  articleId: number;
  articleTitle: string;
  name: string;
  email: string;
  content: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

export function CommentManager() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    fetchComments();
  }, []);

  async function fetchComments() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/comments`, {
        credentials: "include",
        cache: "no-store",
        headers: { Accept: "application/json" }
      });
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      setNotice("Gagal memuat komentar.");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: number, status: "approved" | "rejected") {
    try {
      const csrf = getCookie("csrf_token");
      const res = await fetch(`${API_URL}/admin/comments/${id}/status`, {
        method: "PUT",
        credentials: "include",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRF-Token": csrf
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setNotice(`Komentar berhasil di-${status === "approved" ? "setujui" : "tolak"}.`);
        fetchComments();
      } else {
        setNotice("Gagal mengubah status komentar.");
      }
    } catch (err) {
      setNotice("Terjadi kesalahan jaringan.");
    }
  }

  return (
    <section>
      <header className="mb-8">
        <h1 className="text-3xl font-black tracking-normal text-zinc-950">Manajemen Komentar</h1>
        <p className="mt-2 text-zinc-600">Kelola dan moderasi komentar yang masuk pada artikel.</p>
      </header>

      {notice && (
        <div className="mb-6 rounded-[8px] bg-sky-50 px-4 py-3 text-sm font-bold text-sky-700">
          {notice}
        </div>
      )}

      <div className="rounded-[8px] border border-zinc-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr>
                <th className="px-5 py-4 font-extrabold text-zinc-600">Pengomentar</th>
                <th className="px-5 py-4 font-extrabold text-zinc-600">Komentar</th>
                <th className="px-5 py-4 font-extrabold text-zinc-600">Artikel</th>
                <th className="px-5 py-4 font-extrabold text-zinc-600">Status</th>
                <th className="px-5 py-4 font-extrabold text-zinc-600 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500">Memuat komentar...</td>
                </tr>
              ) : comments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500">Belum ada komentar.</td>
                </tr>
              ) : (
                comments.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-50/50">
                    <td className="px-5 py-4">
                      <p className="font-bold text-zinc-900">{c.name}</p>
                      {c.email && <p className="text-xs text-zinc-500">{c.email}</p>}
                      <p className="text-xs text-zinc-400 mt-1">{formatDate(c.createdAt)}</p>
                    </td>
                    <td className="px-5 py-4 max-w-[300px]">
                      <p className="truncate whitespace-normal line-clamp-2 text-zinc-700">{c.content}</p>
                    </td>
                    <td className="px-5 py-4 max-w-[200px]">
                      <p className="truncate font-bold text-zinc-800">{c.articleTitle}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-extrabold capitalize ${
                        c.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                        c.status === "rejected" ? "bg-red-100 text-red-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {c.status !== "approved" && (
                          <button
                            onClick={() => updateStatus(c.id, "approved")}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100"
                            title="Setujui"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                        {c.status !== "rejected" && (
                          <button
                            onClick={() => updateStatus(c.id, "rejected")}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600 transition hover:bg-red-100"
                            title="Tolak"
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
