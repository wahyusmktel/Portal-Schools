import type { Agenda, Announcement, Article, Major, SchoolProfile } from "@/types/content";

export const schoolProfile: SchoolProfile = {
  name: "SMK Telkom Lampung",
  tagline: "Sekolah teknologi yang menyiapkan talenta digital berkarakter.",
  description:
    "SMK Telkom Lampung berfokus pada pembelajaran vokasi berbasis industri, budaya inovasi, dan penguatan karakter agar siswa siap berkarya di dunia teknologi.",
  address: "Jl. Pulau Morotai No. 12, Jagabaya III, Bandar Lampung",
  phone: "(0721) 000000",
  email: "info@smktelkom-lpg.sch.id",
  mapEmbedUrl:
    "https://www.google.com/maps?q=SMK%20Telkom%20Lampung&output=embed",
  principalName: "Kepala SMK Telkom Lampung",
  principalTitle: "Kepala Sekolah",
  principalMessage:
    "Selamat datang di portal utama SMK Telkom Lampung. Website ini menjadi ruang informasi resmi untuk memperkenalkan profil sekolah, karya siswa, agenda, dan perkembangan pendidikan teknologi kepada masyarakat.",
  principalImage:
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=900&q=82",
  stats: [
    { label: "Program Keahlian", value: "4+" },
    { label: "Ekosistem Industri", value: "Telkom" },
    { label: "Fokus Belajar", value: "Digital" }
  ]
};

export const majors: Major[] = [
  {
    id: 1,
    name: "Teknik Jaringan Akses Telekomunikasi",
    slug: "teknik-jaringan-akses-telekomunikasi",
    summary:
      "Mempelajari instalasi, pengukuran, dan pemeliharaan jaringan akses telekomunikasi berbasis fiber optic, radio, dan perangkat transmisi.",
    icon: "Network",
    coverImage:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=82",
    curriculum: [
      "Fiber optic dan FTTH",
      "Sistem transmisi telekomunikasi",
      "Pengukuran jaringan akses",
      "Keselamatan kerja lapangan"
    ],
    careerProspects: [
      "Teknisi fiber optic",
      "Access network technician",
      "Field operation engineer",
      "Telecommunication support"
    ]
  },
  {
    id: 2,
    name: "Teknik Komputer dan Jaringan",
    slug: "teknik-komputer-dan-jaringan",
    summary:
      "Berfokus pada perakitan komputer, administrasi jaringan, server, keamanan infrastruktur, dan layanan teknologi informasi.",
    icon: "Network",
    coverImage:
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1600&q=82",
    curriculum: [
      "Administrasi sistem jaringan",
      "Routing dan switching",
      "Server Linux dan Windows",
      "Cybersecurity dasar"
    ],
    careerProspects: [
      "Network administrator",
      "IT infrastructure staff",
      "Technical support specialist",
      "Junior cybersecurity analyst"
    ]
  },
  {
    id: 3,
    name: "Rekayasa Perangkat Lunak",
    slug: "rekayasa-perangkat-lunak",
    summary:
      "Mengembangkan kemampuan membuat aplikasi web, mobile, basis data, UI, dan produk digital dengan praktik kerja industri.",
    icon: "Code",
    coverImage:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1600&q=82",
    curriculum: [
      "Pemrograman web frontend",
      "Backend dan REST API",
      "Basis data relasional",
      "UI/UX dan pengujian aplikasi"
    ],
    careerProspects: [
      "Frontend developer",
      "Backend developer",
      "Full-stack junior developer",
      "Software QA tester"
    ]
  },
  {
    id: 4,
    name: "Animasi",
    slug: "animasi",
    summary:
      "Membekali siswa dengan kompetensi ilustrasi digital, storyboard, animasi 2D/3D, editing, dan produksi konten kreatif.",
    icon: "Palette",
    coverImage:
      "https://images.unsplash.com/photo-1542626991-cbc4e32524cc?auto=format&fit=crop&w=1600&q=82",
    curriculum: [
      "Dasar desain visual",
      "Storyboard dan character design",
      "Animasi 2D dan 3D",
      "Video editing dan compositing"
    ],
    careerProspects: [
      "Animator 2D/3D",
      "Motion graphic designer",
      "Content creator",
      "Storyboard artist"
    ]
  }
];

export const articles: Article[] = [
  {
    id: 1,
    title: "Siswa SMK Telkom Lampung Mengembangkan Proyek IoT Sekolah",
    slug: "siswa-smk-telkom-lampung-mengembangkan-proyek-iot-sekolah",
    excerpt:
      "Proyek pembelajaran berbasis Internet of Things membantu siswa memahami sensor, jaringan, dan pengolahan data.",
    coverImage:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80",
    category: "Teknologi",
    publishedAt: "2026-06-20T08:00:00+07:00",
    authorName: "Admin Sekolah"
  },
  {
    id: 2,
    title: "Budaya Literasi Digital untuk Pembelajaran yang Lebih Aman",
    slug: "budaya-literasi-digital-untuk-pembelajaran-yang-lebih-aman",
    excerpt:
      "Literasi digital menjadi bekal penting agar warga sekolah mampu memakai teknologi secara produktif dan bertanggung jawab.",
    coverImage:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80",
    category: "Pendidikan",
    publishedAt: "2026-06-18T09:30:00+07:00",
    authorName: "Kontributor"
  },
  {
    id: 3,
    title: "Kolaborasi Industri Membuka Ruang Praktik Kompetensi",
    slug: "kolaborasi-industri-membuka-ruang-praktik-kompetensi",
    excerpt:
      "Kegiatan praktisi mengajar mempertemukan siswa dengan standar kerja nyata di bidang teknologi.",
    coverImage:
      "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1400&q=80",
    category: "Sekolah",
    publishedAt: "2026-06-12T10:00:00+07:00",
    authorName: "Humas"
  }
];

export const announcements: Announcement[] = [
  {
    id: 1,
    title: "Daftar ulang peserta didik baru",
    body: "Daftar ulang dilaksanakan pada jam kerja melalui loket administrasi sekolah.",
    publishedAt: "2026-06-21T07:00:00+07:00"
  },
  {
    id: 2,
    title: "Pemeliharaan sistem informasi akademik",
    body: "Akses sistem akademik sementara dibatasi saat proses pemeliharaan terjadwal.",
    publishedAt: "2026-06-19T15:30:00+07:00"
  }
];

export const agendas: Agenda[] = [
  {
    id: 1,
    title: "Workshop keamanan siber dasar",
    location: "Laboratorium Jaringan",
    startsAt: "2026-07-08T09:00:00+07:00"
  },
  {
    id: 2,
    title: "Rapat orang tua peserta didik",
    location: "Aula Sekolah",
    startsAt: "2026-07-12T08:30:00+07:00"
  }
];
