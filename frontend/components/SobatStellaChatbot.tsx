"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { Bot, Loader2, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { PUBLIC_API_URL } from "@/lib/api-config";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const initialMessages: ChatMessage[] = [
  {
    role: "assistant",
    content:
      "Halo, saya Sobat Stella. Saya bisa bantu menjawab pertanyaan seputar SMK Telkom Lampung, jurusan, SPMB, agenda, pengumuman, dan informasi sekolah."
  }
];

const quickPrompts = [
  "Apa saja jurusan di SMK Telkom Lampung?",
  "Bagaimana info SPMB?",
  "Dimana alamat sekolah?"
];

export function SobatStellaChatbot() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const shouldHide = pathname?.startsWith("/dashboard");
  const visibleMessages = useMemo(() => messages.slice(-10), [messages]);

  if (shouldHide) {
    return null;
  }

  function openChat() {
    setIsOpen(true);
    window.setTimeout(() => inputRef.current?.focus(), 120);
  }

  async function submitMessage(event?: FormEvent<HTMLFormElement>, quickText?: string) {
    event?.preventDefault();
    const content = (quickText || input).trim();
    if (!content || isLoading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`${PUBLIC_API_URL}/ai/chat`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: nextMessages.slice(-8).map((message) => ({
            role: message.role,
            content: message.content
          }))
        })
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || "Sobat Stella belum bisa menjawab saat ini.");
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: data?.reply || "Maaf, saya belum mendapatkan jawaban yang tepat."
        }
      ]);
    } catch (err: any) {
      setError(err.message || "Koneksi ke Sobat Stella gagal.");
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "Maaf, Sobat Stella sedang sulit terhubung. Silakan coba lagi sebentar lagi."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-[90]">
      {isOpen && (
        <div className="mb-4 flex h-[min(620px,calc(100vh-120px))] w-[min(390px,calc(100vw-40px))] flex-col overflow-hidden rounded-[8px] border border-zinc-200 bg-white shadow-2xl">
          <div className="relative overflow-hidden bg-zinc-950 px-5 py-4 text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_86%_12%,rgba(225,29,72,0.55),transparent_34%)]" />
            <div className="relative flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-rosebrand-600 text-white shadow-soft">
                  <Bot size={23} aria-hidden />
                </span>
                <div>
                  <p className="flex items-center gap-2 text-sm font-black">
                    Sobat Stella
                    <Sparkles size={14} className="text-rosebrand-200" aria-hidden />
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-white/65">Asisten AI SMK Telkom Lampung</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                aria-label="Tutup Sobat Stella"
              >
                <X size={18} aria-hidden />
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-zinc-50 px-4 py-4">
            {visibleMessages.map((message, index) => {
              const isUser = message.role === "user";
              return (
                <div key={`${message.role}-${index}-${message.content.slice(0, 12)}`} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[86%] rounded-[8px] px-4 py-3 text-sm font-semibold leading-6 shadow-sm ${
                      isUser ? "bg-rosebrand-600 text-white" : "border border-zinc-100 bg-white text-zinc-700"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              );
            })}
            {isLoading && (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-[8px] border border-zinc-100 bg-white px-4 py-3 text-sm font-bold text-zinc-500 shadow-sm">
                  <Loader2 size={16} className="animate-spin" aria-hidden />
                  Sobat Stella sedang mengetik...
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-zinc-100 bg-white p-4">
            {messages.length === 1 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => submitMessage(undefined, prompt)}
                    className="rounded-full bg-rosebrand-50 px-3 py-1.5 text-xs font-extrabold text-rosebrand-700 transition hover:bg-rosebrand-100"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
            {error && <p className="mb-2 text-xs font-bold text-rosebrand-600">{error}</p>}
            <form onSubmit={submitMessage} className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                maxLength={500}
                className="h-12 min-w-0 flex-1 rounded-full border border-zinc-200 px-4 text-sm font-semibold outline-none transition focus:border-rosebrand-500"
                placeholder="Tanya Sobat Stella..."
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-rosebrand-600 text-white shadow-sm transition hover:bg-rosebrand-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Kirim pesan"
              >
                {isLoading ? <Loader2 size={19} className="animate-spin" aria-hidden /> : <Send size={19} aria-hidden />}
              </button>
            </form>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={isOpen ? () => setIsOpen(false) : openChat}
        className="group flex h-16 w-16 items-center justify-center rounded-full bg-rosebrand-600 text-white shadow-2xl ring-4 ring-white transition hover:-translate-y-1 hover:bg-zinc-950"
        aria-label={isOpen ? "Tutup Sobat Stella" : "Buka Sobat Stella"}
      >
        {isOpen ? <X size={26} aria-hidden /> : <MessageCircle size={28} aria-hidden />}
        {!isOpen && <span className="absolute -left-36 hidden rounded-full bg-zinc-950 px-4 py-2 text-sm font-black text-white shadow-soft transition group-hover:-translate-x-1 sm:block">Sobat Stella</span>}
      </button>
    </div>
  );
}
