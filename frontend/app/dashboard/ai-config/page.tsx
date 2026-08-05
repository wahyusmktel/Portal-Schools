import { AiConfigEditor } from "@/components/AiConfigEditor";
import { Bot } from "lucide-react";

export default function DashboardAiConfigPage() {
  return (
    <div className="grid gap-6">
      <section className="rounded-[8px] bg-white p-6 shadow-sm border border-zinc-100">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-rosebrand-500 text-white shadow-sm">
            <Bot size={26} aria-hidden />
          </span>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-rosebrand-600">Pengaturan Superadmin</p>
            <h1 className="text-2xl font-black text-zinc-900">Konfigurasi AI Provider</h1>
          </div>
        </div>
        <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-zinc-600">
          Kelola Base URL, API Key, dan model AI yang digunakan untuk otomatisasi sistem dan fitur cerdas portal sekolah.
        </p>
      </section>

      <AiConfigEditor />
    </div>
  );
}
