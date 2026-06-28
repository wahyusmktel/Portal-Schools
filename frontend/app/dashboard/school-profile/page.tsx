import { SchoolProfileEditor } from "@/components/SchoolProfileEditor";
import { getSchoolProfile } from "@/lib/api";

export default async function DashboardSchoolProfilePage() {
  const profile = await getSchoolProfile();

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-sm font-extrabold uppercase text-rosebrand-600">Profil Sekolah</p>
        <h1 className="mt-2 text-3xl font-black">Sambutan dan profil singkat</h1>
        <p className="mt-4 max-w-2xl leading-7 text-zinc-600">
          Kelola sambutan kepala sekolah, foto kepala sekolah, identitas sekolah, statistik profil,
          alamat, dan kontak yang tampil di portal utama.
        </p>
      </section>
      <SchoolProfileEditor profile={profile} />
    </div>
  );
}
