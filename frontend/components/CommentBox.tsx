"use client";

import { FormEvent, useState } from "react";
import { MessageSquare, Send } from "lucide-react";

export function CommentBox() {
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Komentar berhasil disiapkan untuk moderasi.");
    setName("");
    setComment("");
  }

  return (
    <section className="rounded-[8px] bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-2 text-2xl font-black">
        <MessageSquare size={24} className="text-rosebrand-600" aria-hidden />
        Komentar
      </h2>
      <form onSubmit={onSubmit} className="mt-5 grid gap-4">
        <label className="grid gap-2 text-sm font-bold text-zinc-700">
          Nama
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="rounded-[8px] border border-zinc-200 px-4 py-3 outline-none focus:border-rosebrand-500"
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-zinc-700">
          Komentar
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={5}
            className="rounded-[8px] border border-zinc-200 px-4 py-3 outline-none focus:border-rosebrand-500"
            required
          />
        </label>
        {message ? <p className="rounded-[8px] bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{message}</p> : null}
        <button type="submit" className="inline-flex h-11 w-fit items-center gap-2 rounded-[8px] bg-rosebrand-500 px-5 text-sm font-extrabold text-white transition hover:bg-rosebrand-600">
          <Send size={17} aria-hidden />
          Kirim Komentar
        </button>
      </form>
    </section>
  );
}
