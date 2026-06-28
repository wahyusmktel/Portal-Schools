import { CalendarDays, FileText, Megaphone, ShieldCheck } from "lucide-react";
import { ContentEditor } from "@/components/ContentEditor";
import { getAgendas, getAnnouncements, getArticles } from "@/lib/api";

export default async function DashboardPage() {
  const [articles, announcements, agendas] = await Promise.all([
    getArticles(),
    getAnnouncements(),
    getAgendas()
  ]);

  const stats = [
    { label: "Artikel", value: articles.length, icon: FileText },
    { label: "Pengumuman", value: announcements.length, icon: Megaphone },
    { label: "Agenda", value: agendas.length, icon: CalendarDays },
    { label: "Role Aktif", value: "3", icon: ShieldCheck }
  ];

  return (
    <div className="grid gap-8">
      <div>
        <p className="text-sm font-extrabold uppercase text-rosebrand-600">Dashboard</p>
        <h1 className="mt-2 text-4xl font-black">Kelola portal sekolah</h1>
        <p className="mt-3 max-w-2xl text-zinc-600">
          Superadmin dan admin dapat mengelola seluruh konten. Kontributor difokuskan untuk
          menambahkan artikel, agenda, dan pengumuman.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-[8px] bg-white p-5 shadow-sm">
            <stat.icon className="text-rosebrand-600" size={22} aria-hidden />
            <p className="mt-5 text-3xl font-black">{stat.value}</p>
            <p className="text-sm font-semibold text-zinc-500">{stat.label}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <ContentEditor type="articles" />
        <ContentEditor type="announcements" />
        <ContentEditor type="agendas" />
      </div>
    </div>
  );
}
