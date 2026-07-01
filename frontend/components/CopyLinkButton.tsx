"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-extrabold shadow-sm transition hover:-translate-y-0.5 ${
        copied
          ? "bg-emerald-500 text-white"
          : "bg-white text-zinc-700 hover:text-rosebrand-700"
      }`}
    >
      <Link2 size={18} aria-hidden />
      {copied ? "Link berhasil disalin!" : "Salin Link"}
    </button>
  );
}
