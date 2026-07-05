CREATE TABLE IF NOT EXISTS school_uvp_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(190) NOT NULL,
  subtitle VARCHAR(190) NULL,
  description TEXT NOT NULL,
  category VARCHAR(80) NOT NULL DEFAULT 'UVP',
  icon VARCHAR(80) NOT NULL DEFAULT 'Sparkles',
  highlight VARCHAR(120) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_school_uvp_items_active_sort (is_active, sort_order)
);

INSERT INTO school_uvp_items (title, subtitle, description, category, icon, highlight, sort_order, is_active)
SELECT title, subtitle, description, category, icon, highlight, sort_order, is_active
FROM (
  SELECT
    'Strategi BMW' AS title,
    'Bekerja, Melanjutkan, Wirausaha' AS subtitle,
    'SMK Telkom Lampung menyiapkan tiga jalur masa depan: bekerja lewat magang industri, teaching factory, kelas expertise, job fair, bootcamp, career center, dan sertifikasi kompetensi; melanjutkan lewat fast track, bimbel UTBK, IELTS/TOEFL, dan edu fair; serta wirausaha lewat bisnis digital, e-commerce, aplikasi, konten kreatif, dan business center.' AS description,
    'Pathway Karier' AS category,
    'Route' AS icon,
    'BMW Pathway' AS highlight,
    1 AS sort_order,
    TRUE AS is_active
  UNION ALL
  SELECT
    'Centre of Excellence',
    'Digital Product Development',
    'Branding sekolah diarahkan sebagai The Real Informatic School dengan Centre of Excellence pada pengembangan produk digital. Siswa didorong membangun solusi nyata, bukan hanya mengerjakan tugas.',
    'Branding',
    'BadgeCheck',
    'COE Digital Product Dev',
    2,
    TRUE
  UNION ALL
  SELECT
    'Strategi Portofolio Siswa',
    '1 siswa 5 portofolio',
    'Setiap siswa diarahkan memiliki minimal lima portofolio berupa prestasi, karya, proyek, atau sertifikat. Strategi ini diperkuat talent mapping, career plan sejak kelas X, penguatan jejaring alumni, dan forum sharing karier.',
    'Strategi Umum',
    'Layers3',
    'Portofolio sejak sekolah',
    3,
    TRUE
  UNION ALL
  SELECT
    'Karakter dan Pembinaan',
    'Disiplin, spiritual, dan tanggung jawab',
    'Pendidikan karakter diperkuat melalui salam sapa pagi, sholawat bersama, sholat berjamaah, Stella Zero Trash, serta pengelolaan asrama dengan pembinaan keagamaan, karakter, dan tahfiz Al-Quran.',
    'Karakter',
    'ShieldCheck',
    'Karakter produktif',
    4,
    TRUE
  UNION ALL
  SELECT
    'Kompetensi Keahlian Relevan Industri',
    'Re-engineering jurusan untuk kebutuhan masa depan',
    'TJAT diperkuat Smart Home dan Smart Village, TKJ diperkuat Cloud Infrastructure, RPL diperkuat AI dan Digital Product Development, sedangkan Animasi diarahkan ke Creative Digital Content dengan kelas industri bersama agensi kreatif.',
    'Kompetensi',
    'Cpu',
    'Relevan industri',
    5,
    TRUE
  UNION ALL
  SELECT
    'Target Tumbuh 2026',
    'Penerimaan terarah, kualitas tetap terjaga',
    'SPMB dirancang untuk menjangkau calon siswa yang tepat: siap belajar teknologi, siap dibina karakternya, dan siap bertumbuh bersama ekosistem industri digital Telkom Schools.',
    'Target SPMB',
    'Target',
    '224 siswa terarah',
    6,
    TRUE
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM school_uvp_items LIMIT 1);
