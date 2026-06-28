import { MajorEditor } from "@/components/MajorEditor";
import { getMajors } from "@/lib/api";

export default async function DashboardMajorsPage() {
  const majors = await getMajors();

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-sm font-extrabold uppercase text-rosebrand-600">Jurusan</p>
        <h1 className="mt-2 text-3xl font-black">Manajemen jurusan</h1>
        <p className="mt-4 max-w-2xl leading-7 text-zinc-600">
          Kelola profil kompetensi keahlian, cover besar, fokus kurikulum, dan prospek pekerjaan
          yang tampil di portal utama.
        </p>
      </section>
      <MajorEditor majors={majors} />
    </div>
  );
}
