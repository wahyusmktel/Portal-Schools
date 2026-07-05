import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, FileText } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { TeachingModuleReader } from "@/components/TeachingModuleReader";
import { getSchoolProfile, getTeachingModule, getTeachingModules } from "@/lib/api";
import { normalizeImageUrl } from "@/lib/image-url";

type TeachingModuleDetailProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: TeachingModuleDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const module = await getTeachingModule(slug);
  if (!module) {
    return { title: "Modul ajar tidak ditemukan" };
  }
  return {
    title: module.title,
    description: module.description,
    openGraph: {
      title: module.title,
      description: module.description,
      images: module.coverImage ? [module.coverImage] : undefined
    }
  };
}

export default async function TeachingModuleDetailPage({ params }: TeachingModuleDetailProps) {
  const { slug } = await params;
  const [profile, module, modules] = await Promise.all([
    getSchoolProfile(),
    getTeachingModule(slug),
    getTeachingModules()
  ]);

  if (!module) {
    notFound();
  }

  const related = modules.filter((item) => item.slug !== module.slug && item.subject === module.subject).slice(0, 3);

  return (
    <>
      <Header logoUrl={profile.headerLogo} />
      <main className="bg-softgray pt-28">
        <section className="container-page py-10">
          <Link href="/modul-ajar" className="inline-flex items-center gap-2 text-sm font-black text-zinc-500 transition hover:text-rosebrand-600">
            <ArrowLeft size={17} aria-hidden />
            Kembali ke Modul Ajar
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-[0.35fr_0.65fr] lg:items-end">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[8px] bg-zinc-900 shadow-soft">
              {module.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={normalizeImageUrl(module.coverImage)} alt={module.title} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-white">
                  <BookOpen size={64} aria-hidden />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5">
                <p className="rounded-full bg-white/90 px-3 py-1 text-xs font-black text-zinc-900 backdrop-blur">{module.subject}</p>
              </div>
            </div>

            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-rosebrand-50 px-4 py-2 text-sm font-extrabold uppercase text-rosebrand-700">
                <FileText size={17} aria-hidden />
                Modul Ajar Digital
              </p>
              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight text-zinc-950 md:text-6xl">{module.title}</h1>
              <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-zinc-600">{module.description}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-zinc-600 shadow-sm">Kelas: {module.gradeLevel}</span>
                <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-zinc-600 shadow-sm">Penulis: {module.authorName}</span>
                <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-zinc-600 shadow-sm">{formatFileSize(module.fileSize)}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="container-page pb-20">
          <TeachingModuleReader module={module} />

          {related.length > 0 && (
            <section className="mt-12">
              <h2 className="text-2xl font-black text-zinc-950">Modul terkait</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {related.map((item) => (
                  <Link key={item.id} href={`/modul-ajar/${item.slug}`} className="rounded-[8px] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
                    <p className="text-xs font-black uppercase text-rosebrand-600">{item.subject}</p>
                    <h3 className="mt-2 line-clamp-2 text-lg font-black text-zinc-950">{item.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-zinc-500">{item.description}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </section>
      </main>
      <Footer profile={profile} />
    </>
  );
}

function formatFileSize(value: number) {
  if (!value) return "PDF";
  const mb = value / (1024 * 1024);
  return `${mb.toLocaleString("id-ID", { maximumFractionDigits: 1 })} MB`;
}
