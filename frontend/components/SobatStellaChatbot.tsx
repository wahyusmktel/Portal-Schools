"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Bot, ChevronLeft, ChevronRight, Loader2, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

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
  const [isMinimized, setIsMinimized] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior
      });
    }
  };

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("stella_ai_minimized");
      if (saved === "false") {
        setIsMinimized(false);
      } else {
        setIsMinimized(true);
      }
    } catch {}

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-scroll ke bawah saat percakapan bertambah, user mengirim pesan, atau bot merespon
  useEffect(() => {
    if (!isOpen) return;

    const timer1 = setTimeout(() => {
      scrollToBottom("smooth");
    }, 50);

    const timer2 = setTimeout(() => {
      scrollToBottom("smooth");
    }, 250);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [messages, isLoading, isOpen]);

  const handleDragStart = () => {
    isDraggingRef.current = true;
  };

  const handleDragEnd = () => {
    window.setTimeout(() => {
      isDraggingRef.current = false;
    }, 100);
  };

  const setMinimizedState = (val: boolean) => {
    setIsMinimized(val);
    try {
      sessionStorage.setItem("stella_ai_minimized", String(val));
    } catch {}
  };

  const shouldHide = pathname?.startsWith("/dashboard");
  const visibleMessages = messages;

  if (shouldHide) {
    return null;
  }

  function openChat() {
    setIsOpen(true);
    window.setTimeout(() => {
      inputRef.current?.focus();
      scrollToBottom("auto");
    }, 120);
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
    window.setTimeout(() => scrollToBottom("smooth"), 40);

    try {
      const apiMessages = nextMessages
        .slice(-8)
        .filter((message) => !(message.role === "assistant" && message.content === initialMessages[0].content))
        .map((message) => ({
          role: message.role,
          content: message.content
        }));

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: apiMessages
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
      window.setTimeout(() => scrollToBottom("smooth"), 60);
    }
  }

  return (
    <>
      {/* CHAT WINDOW DIALOG */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[95] flex items-end justify-end p-2 sm:p-5 pointer-events-none">
            {/* Backdrop for mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="pointer-events-auto fixed inset-0 bg-zinc-950/40 backdrop-blur-sm sm:hidden"
            />

            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 1 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="pointer-events-auto relative z-10 flex h-[min(640px,calc(100dvh-90px))] w-full flex-col overflow-hidden rounded-[20px] sm:rounded-[12px] border border-zinc-200 bg-white shadow-2xl sm:w-[390px]"
            >
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
                    className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 active:scale-95"
                    aria-label="Tutup Sobat Stella"
                  >
                    <X size={18} aria-hidden />
                  </button>
                </div>
              </div>

              <div
                ref={messagesContainerRef}
                className="flex-1 space-y-3 overflow-y-auto bg-zinc-50 px-4 py-4 scroll-smooth"
              >
                {visibleMessages.map((message, index) => {
                  const isUser = message.role === "user";
                  return (
                    <div key={`${message.role}-${index}-${message.content.slice(0, 12)}`} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[86%] rounded-[12px] px-4 py-3 text-sm font-semibold leading-6 shadow-sm ${
                          isUser ? "bg-rosebrand-600 text-white" : "border border-zinc-100 bg-white text-zinc-700"
                        }`}
                      >
                        <ChatMessageContent content={message.content} />
                      </div>
                    </div>
                  );
                })}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="inline-flex items-center gap-2 rounded-[12px] border border-zinc-100 bg-white px-4 py-3 text-sm font-bold text-zinc-500 shadow-sm">
                      <Loader2 size={16} className="animate-spin" aria-hidden />
                      Sobat Stella sedang mengetik...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} className="h-0 w-full" />
              </div>

              <div className="border-t border-zinc-100 bg-white p-4">
                {messages.length === 1 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {quickPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => submitMessage(undefined, prompt)}
                        className="rounded-full bg-rosebrand-50 px-3 py-1.5 text-xs font-extrabold text-rosebrand-700 transition hover:bg-rosebrand-100 active:scale-95"
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
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-rosebrand-600 text-white shadow-sm transition hover:bg-rosebrand-700 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
                    aria-label="Kirim pesan"
                  >
                    {isLoading ? <Loader2 size={19} className="animate-spin" aria-hidden /> : <Send size={19} aria-hidden />}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DESKTOP FLOATING BUTTON (Tetap di pojok kanan bawah untuk desktop/laptop) */}
      <div className="hidden sm:block fixed bottom-5 right-5 z-[90]">
        <button
          type="button"
          onClick={isOpen ? () => setIsOpen(false) : openChat}
          className="group flex h-16 w-16 items-center justify-center rounded-full bg-rosebrand-600 text-white shadow-2xl ring-4 ring-white transition hover:-translate-y-1 hover:bg-zinc-950"
          aria-label={isOpen ? "Tutup Sobat Stella" : "Buka Sobat Stella"}
        >
          {isOpen ? <X size={26} aria-hidden /> : <MessageCircle size={28} aria-hidden />}
          {!isOpen && (
            <span className="absolute -left-36 hidden rounded-full bg-zinc-950 px-4 py-2 text-sm font-black text-white shadow-soft transition group-hover:-translate-x-1 sm:block">
              Sobat Stella
            </span>
          )}
        </button>
      </div>

      {/* MOBILE LAUNCHER: Gaya Samsung Assistant Menu / Edge Handle (Bisa digeser vertikal & disembunyikan/ditampilkan) */}
      {!isOpen && (
        <motion.div
          drag="y"
          dragConstraints={{ top: -45, bottom: 420 }}
          dragElastic={0.06}
          dragMomentum={false}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          className={`block sm:hidden fixed z-[70] top-[124px] ${
            isMinimized ? "right-0" : "right-3"
          } touch-none`}
        >
          <AnimatePresence mode="wait">
            {isMinimized ? (
              /* State Sembunyi / Docked ala Edge Panel Samsung */
              <motion.button
                key="minimized-trigger"
                type="button"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.18 }}
                onClick={() => {
                  if (!isDraggingRef.current) {
                    setMinimizedState(false);
                  }
                }}
                title="Geser naik/turun atau klik untuk membuka Stella AI"
                aria-label="Tampilkan menu Stella AI"
                className="group flex h-12 items-center gap-1.5 rounded-l-full bg-zinc-950/95 py-1.5 pl-2.5 pr-2 text-white shadow-[0_6px_28px_rgba(0,0,0,0.65)] ring-1 ring-r-0 ring-white/25 backdrop-blur-md active:scale-95 cursor-grab active:cursor-grabbing select-none"
              >
                {/* Grip Handle 3 Titik Khas Samsung Edge */}
                <div className="flex flex-col gap-1 pr-0.5 opacity-40 group-hover:opacity-80" aria-hidden>
                  <span className="h-1 w-1 rounded-full bg-white" />
                  <span className="h-1 w-1 rounded-full bg-white" />
                  <span className="h-1 w-1 rounded-full bg-white" />
                </div>

                <ChevronLeft size={15} className="text-white/80 transition group-hover:-translate-x-0.5 group-hover:text-white" />
                <span className="relative grid h-8 w-8 place-items-center rounded-full bg-gradient-to-tr from-rosebrand-600 to-rosebrand-500 text-white shadow-sm">
                  <Bot size={16} aria-hidden />
                  <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-rosebrand-400" />
                  </span>
                </span>
              </motion.button>
            ) : (
              /* State Tampil: Floating Pill Modern di bawah Navbar */
              <motion.div
                key="expanded-trigger"
                initial={{ opacity: 0, x: 20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{ duration: 0.18 }}
                className="flex items-center gap-2 rounded-full bg-zinc-950/95 py-1.5 pl-2 pr-2 text-white shadow-[0_8px_30px_rgba(225,29,79,0.45)] ring-1 ring-white/20 backdrop-blur-md cursor-grab active:cursor-grabbing select-none"
              >
                {/* Grip Handle saat expanded */}
                <div className="flex flex-col gap-1 pl-1 opacity-35" aria-hidden>
                  <span className="h-1 w-1 rounded-full bg-white" />
                  <span className="h-1 w-1 rounded-full bg-white" />
                  <span className="h-1 w-1 rounded-full bg-white" />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!isDraggingRef.current) {
                      openChat();
                    }
                  }}
                  className="flex items-center gap-2 text-left active:scale-95 transition-transform"
                  aria-label="Buka Chat Sobat Stella"
                >
                  <span className="relative grid h-8 w-8 place-items-center rounded-full bg-gradient-to-tr from-rosebrand-600 to-rosebrand-500 text-white shadow-sm">
                    <Bot size={17} aria-hidden />
                    <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rosebrand-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-rosebrand-400" />
                    </span>
                  </span>
                  <div className="flex flex-col pr-1">
                    <span className="flex items-center gap-1 text-xs font-black tracking-wide text-white">
                      Stella AI
                      <Sparkles size={11} className="text-rosebrand-300" aria-hidden />
                    </span>
                    <span className="text-[10px] font-semibold text-white/70">Tanya Sekolah</span>
                  </div>
                </button>

                <div className="h-4 w-px bg-white/20" />

                {/* Tombol sembunyikan ala Samsung Assistant Menu */}
                <button
                  type="button"
                  onClick={() => {
                    if (!isDraggingRef.current) {
                      setMinimizedState(true);
                    }
                  }}
                  title="Sembunyikan ke tepi layar"
                  aria-label="Sembunyikan Stella AI ke tepi layar"
                  className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white active:scale-90"
                >
                  <ChevronRight size={15} aria-hidden />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </>
  );
}

function ChatMessageContent({ content }: { content: string }) {
  const lines = content
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-2">
      {lines.map((line, index) => {
        const bulletMatch = line.match(/^[-•]\s+(.+)/);
        const numberMatch = line.match(/^(\d+)[.)]\s+(.+)/);

        if (bulletMatch) {
          return (
            <p key={`${line}-${index}`} className="grid grid-cols-[16px_1fr] gap-2">
              <span aria-hidden>•</span>
              <span>{bulletMatch[1]}</span>
            </p>
          );
        }

        if (numberMatch) {
          return (
            <p key={`${line}-${index}`} className="grid grid-cols-[24px_1fr] gap-2">
              <span className="font-black">{numberMatch[1]}.</span>
              <span>{numberMatch[2]}</span>
            </p>
          );
        }

        return <p key={`${line}-${index}`}>{line}</p>;
      })}
    </div>
  );
}
