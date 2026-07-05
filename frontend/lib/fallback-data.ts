import type { Agenda, Announcement, Article, HeroSlide, Major, SchoolProfile, SchoolUVPItem, WhyChooseUsItem } from "@/types/content";

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

export const heroSlides: HeroSlide[] = [
  {
    id: 1,
    title: "Talenta Digital Berkarakter",
    subtitle:
      "Portal utama SMK Telkom Lampung untuk informasi sekolah, inovasi siswa, dan perkembangan pendidikan teknologi.",
    imageUrl:
      "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1800&q=82",
    eyebrow: "Portal Resmi Sekolah",
    primaryText: "Lihat Berita",
    primaryUrl: "#artikel",
    secondText: "Profil Jurusan",
    secondUrl: "#jurusan",
    sortOrder: 1,
    isActive: true
  },
  {
    id: 2,
    title: "Belajar Dekat dengan Industri",
    subtitle:
      "Program vokasi diarahkan pada praktik nyata, kolaborasi industri, dan budaya kerja profesional.",
    imageUrl:
      "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1800&q=82",
    eyebrow: "Portal Resmi Sekolah",
    primaryText: "Lihat Berita",
    primaryUrl: "#artikel",
    secondText: "Profil Jurusan",
    secondUrl: "#jurusan",
    sortOrder: 2,
    isActive: true
  },
  {
    id: 3,
    title: "Ekosistem Sekolah Teknologi",
    subtitle:
      "Artikel, agenda, pengumuman, dan profil jurusan tersaji rapi untuk siswa, orang tua, alumni, dan masyarakat.",
    imageUrl:
      "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1800&q=82",
    eyebrow: "Portal Resmi Sekolah",
    primaryText: "Lihat Berita",
    primaryUrl: "#artikel",
    secondText: "Profil Jurusan",
    secondUrl: "#jurusan",
    sortOrder: 3,
    isActive: true
  }
];

export const whyChooseUsItems: WhyChooseUsItem[] = [
  {
    id: 1,
    title: "Bagian dari Telkom Schools",
    description:
      "SMK Telkom Lampung berada dalam ekosistem Yayasan Pendidikan Telkom yang membawa standar budaya digital, jejaring nasional, dan semangat inovasi ke ruang belajar siswa.",
    icon: "Network",
    highlight: "Ekosistem nasional",
    sortOrder: 1,
    isActive: true
  },
  {
    id: 2,
    title: "Kurikulum Vokasi Digital",
    description:
      "Pembelajaran disiapkan untuk dunia teknologi hari ini: jaringan, perangkat lunak, kreativitas digital, dan kompetensi produktif yang relevan dengan kebutuhan industri.",
    icon: "Code2",
    highlight: "Siap industri",
    sortOrder: 2,
    isActive: true
  },
  {
    id: 3,
    title: "Belajar Berbasis Praktik",
    description:
      "Siswa tidak hanya memahami teori. Mereka dibiasakan membuat proyek, berlatih di lab, memecahkan masalah nyata, dan membangun portofolio sejak sekolah.",
    icon: "Cpu",
    highlight: "Project based",
    sortOrder: 3,
    isActive: true
  },
  {
    id: 4,
    title: "Karakter, Disiplin, dan Percaya Diri",
    description:
      "Lingkungan sekolah membentuk kebiasaan profesional: disiplin, tanggung jawab, komunikasi, kerja tim, dan keberanian tampil sebagai talenta muda.",
    icon: "ShieldCheck",
    highlight: "Karakter kuat",
    sortOrder: 4,
    isActive: true
  },
  {
    id: 5,
    title: "Peluang Karier dan Lanjut Studi",
    description:
      "Lulusan diarahkan agar siap memilih jalur terbaik: bekerja, berwirausaha, masuk industri digital, atau melanjutkan studi ke perguruan tinggi.",
    icon: "GraduationCap",
    highlight: "Masa depan jelas",
    sortOrder: 5,
    isActive: true
  }
];

export const schoolUVPItems: SchoolUVPItem[] = [
  {
    id: 1,
    title: "Strategi BMW",
    subtitle: "Bekerja, Melanjutkan, Wirausaha",
    description:
      "Tiga jalur masa depan siswa disiapkan secara serius: bekerja lewat magang industri, teaching factory, kelas expertise, job fair, career center, dan sertifikasi; melanjutkan lewat fast track, bimbel UTBK, IELTS/TOEFL, dan edu fair; serta wirausaha lewat bisnis digital, aplikasi, e-commerce, dan konten kreatif.",
    category: "Pathway Karier",
    icon: "Route",
    highlight: "BMW Pathway",
    sortOrder: 1,
    isActive: true
  },
  {
    id: 2,
    title: "Centre of Excellence",
    subtitle: "Digital Product Development",
    description:
      "SMK Telkom Lampung diarahkan sebagai The Real Informatic School dengan Centre of Excellence pada pengembangan produk digital. Siswa dibiasakan merancang solusi nyata dan membangun portofolio yang relevan.",
    category: "Branding",
    icon: "BadgeCheck",
    highlight: "COE Digital Product Dev",
    sortOrder: 2,
    isActive: true
  },
  {
    id: 3,
    title: "Strategi Portofolio Siswa",
    subtitle: "1 siswa 5 portofolio",
    description:
      "Setiap siswa diarahkan memiliki minimal lima portofolio berupa prestasi, karya, proyek, atau sertifikat. Strategi ini diperkuat talent mapping, career plan sejak kelas X, jejaring alumni, dan forum sharing karier.",
    category: "Strategi Umum",
    icon: "Layers3",
    highlight: "Portofolio sejak sekolah",
    sortOrder: 3,
    isActive: true
  },
  {
    id: 4,
    title: "Karakter dan Pembinaan",
    subtitle: "Disiplin, spiritual, dan tanggung jawab",
    description:
      "Pendidikan karakter diperkuat melalui salam sapa pagi, sholawat bersama, sholat berjamaah, Stella Zero Trash, serta pembinaan asrama yang menumbuhkan kebiasaan baik, karakter kuat, dan tahfiz Al-Quran.",
    category: "Karakter",
    icon: "ShieldCheck",
    highlight: "Karakter produktif",
    sortOrder: 4,
    isActive: true
  },
  {
    id: 5,
    title: "Kompetensi Relevan Industri",
    subtitle: "Re-engineering jurusan untuk masa depan",
    description:
      "TJAT diperkuat Smart Home dan Smart Village, TKJ diperkuat Cloud Infrastructure, RPL diperkuat AI dan Digital Product Development, sedangkan Animasi diarahkan ke Creative Digital Content bersama ekosistem agensi kreatif.",
    category: "Kompetensi",
    icon: "Cpu",
    highlight: "Relevan industri",
    sortOrder: 5,
    isActive: true
  },
  {
    id: 6,
    title: "Target Tumbuh 2026",
    subtitle: "Penerimaan terarah, kualitas tetap terjaga",
    description:
      "SPMB dirancang untuk menjangkau calon siswa yang tepat: siap belajar teknologi, siap dibina karakternya, dan siap bertumbuh bersama ekosistem industri digital Telkom Schools.",
    category: "Target SPMB",
    icon: "Target",
    highlight: "224 siswa terarah",
    sortOrder: 6,
    isActive: true
  }
];

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
