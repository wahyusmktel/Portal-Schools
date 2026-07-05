CREATE TABLE IF NOT EXISTS why_choose_us (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(190) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(80) NOT NULL DEFAULT 'Network',
  highlight VARCHAR(120) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_why_choose_us_active_sort (is_active, sort_order)
);

INSERT INTO why_choose_us (title, description, icon, highlight, sort_order, is_active)
SELECT title, description, icon, highlight, sort_order, is_active
FROM (
  SELECT
    'Bagian dari Telkom Schools' AS title,
    'SMK Telkom Lampung berada dalam ekosistem Yayasan Pendidikan Telkom yang membawa standar budaya digital, jejaring nasional, dan semangat inovasi ke ruang belajar siswa.' AS description,
    'Network' AS icon,
    'Ekosistem nasional' AS highlight,
    1 AS sort_order,
    TRUE AS is_active
  UNION ALL
  SELECT
    'Kurikulum Vokasi Digital',
    'Pembelajaran disiapkan untuk dunia teknologi hari ini: jaringan, perangkat lunak, kreativitas digital, dan kompetensi produktif yang relevan dengan kebutuhan industri.',
    'Code2',
    'Siap industri',
    2,
    TRUE
  UNION ALL
  SELECT
    'Belajar Berbasis Praktik',
    'Siswa tidak hanya memahami teori. Mereka dibiasakan membuat proyek, berlatih di lab, memecahkan masalah nyata, dan membangun portofolio sejak sekolah.',
    'Cpu',
    'Project based',
    3,
    TRUE
  UNION ALL
  SELECT
    'Karakter, Disiplin, dan Percaya Diri',
    'Lingkungan sekolah membentuk kebiasaan profesional: disiplin, tanggung jawab, komunikasi, kerja tim, dan keberanian tampil sebagai talenta muda.',
    'ShieldCheck',
    'Karakter kuat',
    4,
    TRUE
  UNION ALL
  SELECT
    'Peluang Karier dan Lanjut Studi',
    'Lulusan diarahkan agar siap memilih jalur terbaik: bekerja, berwirausaha, masuk industri digital, atau melanjutkan studi ke perguruan tinggi.',
    'GraduationCap',
    'Masa depan jelas',
    5,
    TRUE
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM why_choose_us LIMIT 1);
