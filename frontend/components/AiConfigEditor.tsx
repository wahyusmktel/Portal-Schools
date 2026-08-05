"use client";

import { FormEvent, useEffect, useState } from "react";
import { Bot, CheckCircle2, Eye, EyeOff, Key, KeyRound, Layers, Link as LinkIcon, RefreshCw, Save, Send, ShieldAlert, Sparkles } from "lucide-react";
import { API_URL } from "@/lib/api-config";
import { getCookie } from "@/lib/auth-client";

type AISetting = {
  id?: number;
  baseUrl: string;
  apiKey: string;
  model: string;
  isActive: boolean;
  updatedAt?: string;
};

export function AiConfigEditor() {
  const [baseUrl, setBaseUrl] = useState("https://waverouter.web.id/v1");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("glm-5.2");
  const [isActive, setIsActive] = useState(true);

  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [testing, setTesting] = useState(false);

  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [testResult, setTestResult] = useState<{ type: "success" | "error"; message: string; output?: string } | null>(null);

  useEffect(() => {
    async function loadConfig() {
      setFetching(true);
      try {
        const res = await fetch(`${API_URL}/ai-config`, {
          credentials: "include",
          headers: { Accept: "application/json" }
        });
        if (res.ok) {
          const data: AISetting = await res.json();
          if (data) {
            setBaseUrl(data.baseUrl || "https://waverouter.web.id/v1");
            setApiKey(data.apiKey || "");
            setModel(data.model || "glm-5.2");
            setIsActive(data.isActive !== false);
          }
        }
      } catch {
        setNotice({
          type: "error",
          message: "Gagal memuat konfigurasi AI dari server."
        });
      } finally {
        setFetching(false);
      }
    }

    loadConfig();
  }, []);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setNotice(null);

    const payload: AISetting = {
      baseUrl: baseUrl.trim() || "https://waverouter.web.id/v1",
      apiKey: apiKey.trim(),
      model: model.trim() || "glm-5.2",
      isActive
    };

    try {
      const res = await fetch(`${API_URL}/ai-config`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCookie("csrf_token")
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Gagal menyimpan konfigurasi.");
      }

      setNotice({
        type: "success",
        message: "Konfigurasi AI Provider berhasil disimpan!"
      });
    } catch (err: any) {
      setNotice({
        type: "error",
        message: err?.message || "Terjadi kesalahan saat menyimpan."
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleTestConnection() {
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch(`${API_URL}/ai-config/test`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCookie("csrf_token")
        },
        body: JSON.stringify({
          baseUrl,
          apiKey,
          model
        })
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setTestResult({
          type: "error",
          message: data?.message || "Gagal melakukan tes koneksi AI."
        });
      } else {
        setTestResult({
          type: "success",
          message: data?.message || "Koneksi ke AI Provider Berhasil!",
          output: data?.output
        });
      }
    } catch (err: any) {
      setTestResult({
        type: "error",
        message: "Gagal menghubungi server backend untuk menguji AI: " + (err?.message || "")
      });
    } finally {
      setTesting(false);
    }
  }

  if (fetching) {
    return (
      <div className="flex h-64 items-center justify-center rounded-[8px] bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3 text-sm font-bold text-zinc-500">
          <RefreshCw className="animate-spin text-rosebrand-500" size={20} />
          Memuat konfigurasi AI...
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {notice && (
        <div
          className={`flex items-center gap-3 rounded-[8px] p-4 text-sm font-bold shadow-sm ${
            notice.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {notice.type === "success" ? <CheckCircle2 size={18} /> : <ShieldAlert size={18} />}
          {notice.message}
        </div>
      )}

      <form onSubmit={handleSave} className="rounded-[8px] bg-white p-6 shadow-sm border border-zinc-100 grid gap-6">
        <div className="border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-rosebrand-50 text-rosebrand-600">
              <Bot size={22} />
            </span>
            <div>
              <h2 className="text-xl font-black text-zinc-900">Pengaturan AI Provider</h2>
              <p className="text-xs font-semibold text-zinc-500">
                Konfigurasi kredensial API untuk fitur otomatisasi kecerdasan buatan portal sekolah.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-5">
          {/* Base URL */}
          <div className="grid gap-2">
            <label className="flex items-center gap-2 text-sm font-extrabold text-zinc-700">
              <LinkIcon size={16} className="text-rosebrand-500" />
              Base URL API
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://waverouter.web.id/v1"
              required
              className="h-11 w-full rounded-[8px] border border-zinc-200 bg-zinc-50/50 px-4 font-mono text-sm font-bold text-zinc-800 outline-none transition focus:border-rosebrand-500 focus:bg-white focus:ring-4 focus:ring-rosebrand-100"
            />
            <p className="text-xs font-medium text-zinc-400">Default endpoint: https://waverouter.web.id/v1</p>
          </div>

          {/* API Key */}
          <div className="grid gap-2">
            <label className="flex items-center gap-2 text-sm font-extrabold text-zinc-700">
              <KeyRound size={16} className="text-rosebrand-500" />
              API Key (Token)
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Masukkan API Key / Token OpenAI..."
                required
                className="h-11 w-full rounded-[8px] border border-zinc-200 bg-zinc-50/50 pl-4 pr-12 font-mono text-sm font-bold text-zinc-800 outline-none transition focus:border-rosebrand-500 focus:bg-white focus:ring-4 focus:ring-rosebrand-100"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
              >
                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-xs font-medium text-zinc-400">API Key disimpan dengan aman di database server.</p>
          </div>

          {/* Model */}
          <div className="grid gap-2">
            <label className="flex items-center gap-2 text-sm font-extrabold text-zinc-700">
              <Layers size={16} className="text-rosebrand-500" />
              Model AI
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="glm-5.2"
              required
              className="h-11 w-full rounded-[8px] border border-zinc-200 bg-zinc-50/50 px-4 font-mono text-sm font-bold text-zinc-800 outline-none transition focus:border-rosebrand-500 focus:bg-white focus:ring-4 focus:ring-rosebrand-100"
            />
            <p className="text-xs font-medium text-zinc-400">Contoh model: glm-5.2, gpt-4o, gpt-3.5-turbo, dll.</p>
          </div>

          {/* Status Toggle */}
          <div className="flex items-center justify-between rounded-[8px] bg-zinc-50 p-4 border border-zinc-100">
            <div>
              <p className="text-sm font-extrabold text-zinc-800">Status Layanan AI</p>
              <p className="text-xs font-semibold text-zinc-500">Aktifkan atau nonaktifkan fitur AI otomatisasi di portal.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isActive ? "bg-emerald-500" : "bg-zinc-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isActive ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col-reverse gap-3 pt-4 border-t border-zinc-100 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={testing || !apiKey}
            onClick={handleTestConnection}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] border border-zinc-200 bg-white px-5 text-sm font-extrabold text-zinc-700 transition hover:bg-zinc-50 hover:border-zinc-300 disabled:opacity-50"
          >
            {testing ? <RefreshCw className="animate-spin" size={16} /> : <Send size={16} />}
            {testing ? "Menguji..." : "Uji Koneksi AI"}
          </button>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-rosebrand-500 px-6 text-sm font-extrabold text-white transition hover:bg-rosebrand-600 disabled:opacity-70"
          >
            {loading ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
            {loading ? "Menyimpan..." : "Simpan Konfigurasi"}
          </button>
        </div>
      </form>

      {/* Test Connection Output Box */}
      {testResult && (
        <div
          className={`rounded-[8px] p-5 shadow-sm border grid gap-2 ${
            testResult.type === "success" ? "bg-emerald-50/80 border-emerald-200" : "bg-rose-50/80 border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2 font-black text-sm">
            {testResult.type === "success" ? (
              <CheckCircle2 className="text-emerald-600" size={18} />
            ) : (
              <ShieldAlert className="text-rose-600" size={18} />
            )}
            <span className={testResult.type === "success" ? "text-emerald-900" : "text-rose-900"}>{testResult.message}</span>
          </div>
          {testResult.output && (
            <div className="mt-2 rounded-[6px] bg-zinc-900 p-4 font-mono text-xs text-zinc-200 shadow-inner overflow-x-auto">
              <span className="text-zinc-500 uppercase font-bold block mb-1">Respons AI:</span>
              {testResult.output}
            </div>
          )}
        </div>
      )}

      {/* Developer Integration Code Snippet */}
      <div className="rounded-[8px] bg-zinc-900 p-6 text-zinc-100 shadow-sm grid gap-4">
        <div className="flex items-center gap-2 text-rosebrand-400 font-extrabold text-sm uppercase tracking-wider border-b border-zinc-800 pb-3">
          <Sparkles size={16} />
          Dokumentasi Implementasi AI (Kode Penggunaan)
        </div>
        <p className="text-xs font-semibold text-zinc-400">
          Gunakan contoh berikut di aplikasi/fitur baru untuk memanggil AI menggunakan kredensial yang tersimpan:
        </p>

        <div className="rounded-[6px] bg-zinc-950 p-4 font-mono text-xs text-emerald-400 overflow-x-auto border border-zinc-800">
          <pre>{`import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "${baseUrl || "https://waverouter.web.id/v1"}",
  apiKey: "${apiKey ? "sk-..." : "YOUR_API_KEY"}",
});

const res = await client.chat.completions.create({
  model: "${model || "glm-5.2"}",
  messages: [{ role: "user", content: "Hello" }],
});

console.log(res.choices[0].message.content);`}</pre>
        </div>
      </div>
    </div>
  );
}
