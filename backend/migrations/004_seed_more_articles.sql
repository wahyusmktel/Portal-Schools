INSERT INTO articles (title, slug, excerpt, content, cover_image, category, status, published_at)
VALUES
  (
    'Praktik Fiber Optic Membuka Wawasan Infrastruktur Digital',
    'praktik-fiber-optic-membuka-wawasan-infrastruktur-digital',
    'Siswa mempelajari proses penyambungan, pengukuran, dan troubleshooting jaringan fiber optic sebagai bekal kompetensi industri.',
    'Siswa mempelajari proses penyambungan, pengukuran, dan troubleshooting jaringan fiber optic sebagai bekal kompetensi industri.\n\nKegiatan praktik ini memperkuat pemahaman siswa tentang infrastruktur digital yang menjadi tulang punggung konektivitas modern. Melalui pembelajaran berbasis proyek, siswa dilatih membaca kebutuhan lapangan, bekerja sesuai prosedur keselamatan, dan membuat laporan teknis yang rapi.',
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1400&q=80',
    'Teknologi',
    'published',
    '2026-06-24 08:30:00'
  ),
  (
    'Kelas Industri Menguatkan Portofolio Siswa RPL',
    'kelas-industri-menguatkan-portofolio-siswa-rpl',
    'Program kelas industri mendorong siswa membangun aplikasi nyata, dokumentasi proyek, dan portofolio digital sejak dini.',
    'Program kelas industri mendorong siswa membangun aplikasi nyata, dokumentasi proyek, dan portofolio digital sejak dini.\n\nPembelajaran dilakukan melalui siklus perencanaan, desain antarmuka, pengembangan fitur, pengujian, dan presentasi hasil. Dengan pola ini, siswa tidak hanya memahami kode, tetapi juga cara bekerja dalam tim dan menyampaikan solusi teknologi kepada pengguna.',
    'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1400&q=80',
    'Pendidikan',
    'published',
    '2026-06-23 09:15:00'
  ),
  (
    'Karya Animasi Siswa Dipamerkan dalam Pekan Kreatif',
    'karya-animasi-siswa-dipamerkan-dalam-pekan-kreatif',
    'Pekan kreatif menjadi ruang apresiasi bagi siswa animasi untuk menampilkan storyboard, karakter, dan motion graphic.',
    'Pekan kreatif menjadi ruang apresiasi bagi siswa animasi untuk menampilkan storyboard, karakter, dan motion graphic.\n\nKegiatan ini dirancang agar siswa berani mempresentasikan proses kreatif, menerima masukan, dan memperbaiki karya berdasarkan standar produksi konten digital. Sekolah mendorong budaya kreatif yang disiplin, kolaboratif, dan relevan dengan industri.',
    'https://images.unsplash.com/photo-1542626991-cbc4e32524cc?auto=format&fit=crop&w=1400&q=80',
    'Sekolah',
    'published',
    '2026-06-22 13:00:00'
  )
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  excerpt = VALUES(excerpt),
  content = VALUES(content),
  cover_image = VALUES(cover_image),
  category = VALUES(category),
  status = VALUES(status),
  published_at = VALUES(published_at);
