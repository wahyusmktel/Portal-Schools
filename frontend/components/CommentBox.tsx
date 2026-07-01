"use client";

import { FormEvent, useEffect, useState } from "react";
import { MessageSquare, Send, Reply, X, RefreshCcw } from "lucide-react";
import { formatDate } from "@/lib/article-utils";
import { API_URL } from "@/lib/api";

type Comment = {
  id: number;
  name: string;
  content: string;
  createdAt: string;
  parentId?: number | null;
  replies?: Comment[];
};

export function CommentBox({ articleSlug }: { articleSlug: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [captchaId, setCaptchaId] = useState("");
  const [captchaValue, setCaptchaValue] = useState("");

  useEffect(() => {
    fetchComments();
    refreshCaptcha();
  }, [articleSlug]);

  async function refreshCaptcha() {
    try {
      const res = await fetch(`${API_URL}/captcha/new`);
      const data = await res.json();
      setCaptchaId(data.captchaId);
      setCaptchaValue("");
    } catch (e) {
      console.error("Gagal memuat captcha");
    }
  }

  async function fetchComments() {
    try {
      const res = await fetch(`${API_URL}/articles/${articleSlug}/comments`, {
        headers: { Accept: "application/json" }
      });
      if (res.ok) {
        const data: Comment[] = await res.json();
        
        // Group by parentId
        const roots: Comment[] = [];
        const repliesMap = new Map<number, Comment[]>();
        
        data.forEach(c => {
          c.replies = [];
          if (c.parentId) {
            if (!repliesMap.has(c.parentId)) {
              repliesMap.set(c.parentId, []);
            }
            repliesMap.get(c.parentId)!.push(c);
          } else {
            roots.push(c);
          }
        });
        
        data.forEach(c => {
          c.replies = repliesMap.get(c.id) || [];
        });
        
        setComments(roots);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/articles/${articleSlug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name, 
          email, 
          content,
          parentId: replyingTo?.id || null,
          captchaId,
          captchaValue
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || "Komentar berhasil disiapkan untuk moderasi.");
        setName("");
        setEmail("");
        setContent("");
        setReplyingTo(null);
      } else {
        setMessage(data.message || "Gagal mengirim komentar.");
      }
    } catch (err) {
      setMessage("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
      refreshCaptcha(); // Refresh CAPTCHA after any submit attempt
    }
  }

  function handleReply(c: Comment) {
    setReplyingTo(c);
    setMessage("");
    document.getElementById("comment-form")?.scrollIntoView({ behavior: "smooth" });
  }

  function cancelReply() {
    setReplyingTo(null);
  }

  const renderComment = (c: Comment, isReply = false) => (
    <div key={c.id} className={`rounded-[8px] border border-zinc-100 bg-zinc-50 p-4 ${isReply ? 'ml-6 mt-3 border-l-4 border-l-rosebrand-300' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-zinc-900">{c.name}</span>
        <span className="text-xs font-bold text-zinc-500">{formatDate(c.createdAt)}</span>
      </div>
      <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap mb-3">{c.content}</p>
      
      <button 
        onClick={() => handleReply(c)}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-rosebrand-600 hover:text-rosebrand-800 transition"
      >
        <Reply size={14} /> Balas
      </button>

      {c.replies && c.replies.length > 0 && (
        <div className="mt-2 space-y-3">
          {c.replies.map(reply => renderComment(reply, true))}
        </div>
      )}
    </div>
  );

  return (
    <section className="rounded-[8px] bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-2 text-2xl font-black mb-6">
        <MessageSquare size={24} className="text-rosebrand-600" aria-hidden />
        Komentar
      </h2>
      
      {comments.length > 0 && (
        <div className="mb-8 grid gap-5">
          {comments.map((c) => renderComment(c, false))}
        </div>
      )}

      <form id="comment-form" onSubmit={onSubmit} className="grid gap-4 border-t border-zinc-100 pt-6">
        <h3 className="text-lg font-bold">
          {replyingTo ? "Membalas Komentar" : "Tinggalkan Komentar"}
        </h3>
        
        {replyingTo && (
          <div className="flex items-start justify-between rounded-[8px] bg-rosebrand-50 p-3 mb-2">
            <div>
              <p className="text-xs font-bold text-rosebrand-600 mb-1">Membalas {replyingTo.name}:</p>
              <p className="text-sm text-zinc-600 line-clamp-2">{replyingTo.content}</p>
            </div>
            <button type="button" onClick={cancelReply} className="text-zinc-400 hover:text-zinc-600 p-1">
              <X size={16} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="grid gap-2 text-sm font-bold text-zinc-700">
            Nama *
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="rounded-[8px] border border-zinc-200 px-4 py-3 outline-none focus:border-rosebrand-500"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-zinc-700">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-[8px] border border-zinc-200 px-4 py-3 outline-none focus:border-rosebrand-500"
            />
          </label>
        </div>
        <label className="grid gap-2 text-sm font-bold text-zinc-700">
          Komentar *
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={5}
            className="rounded-[8px] border border-zinc-200 px-4 py-3 outline-none focus:border-rosebrand-500"
            required
          />
        </label>

        <div className="grid gap-2">
          <label className="text-sm font-bold text-zinc-700">Validasi Keamanan *</label>
          <div className="flex flex-wrap sm:flex-nowrap gap-3 items-center">
            {captchaId && (
              <div className="relative rounded-[8px] overflow-hidden border border-zinc-200 bg-zinc-50 shrink-0">
                 {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${API_URL}/captcha/image/${captchaId}`} alt="Captcha" className="h-12 w-[120px] object-cover" />
              </div>
            )}
            <button type="button" onClick={refreshCaptcha} className="p-2 shrink-0 rounded-[8px] bg-zinc-100 text-zinc-500 hover:text-rosebrand-600 hover:bg-rosebrand-50 transition" title="Ganti Captcha">
              <RefreshCcw size={18} />
            </button>
            <input
              type="text"
              value={captchaValue}
              onChange={(e) => setCaptchaValue(e.target.value)}
              placeholder="Ketik huruf/angka di samping"
              className="rounded-[8px] border border-zinc-200 px-4 py-3 outline-none focus:border-rosebrand-500 flex-1 min-w-[200px]"
              required
            />
          </div>
        </div>

        {message ? <p className={`rounded-[8px] px-4 py-3 text-sm font-bold ${message.includes("berhasil") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{message}</p> : null}
        <button 
          type="submit" 
          disabled={loading}
          className="inline-flex h-11 w-fit items-center gap-2 rounded-[8px] bg-rosebrand-500 px-5 text-sm font-extrabold text-white transition hover:bg-rosebrand-600 disabled:opacity-50"
        >
          <Send size={17} aria-hidden />
          {loading ? "Mengirim..." : "Kirim Komentar"}
        </button>
      </form>
    </section>
  );
}
