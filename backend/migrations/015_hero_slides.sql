CREATE TABLE IF NOT EXISTS hero_slides (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(220) NOT NULL,
  subtitle TEXT NOT NULL,
  image_url TEXT NOT NULL,
  eyebrow VARCHAR(120) NOT NULL DEFAULT 'Portal Resmi Sekolah',
  primary_text VARCHAR(80) NOT NULL DEFAULT 'Lihat Berita',
  primary_url VARCHAR(255) NOT NULL DEFAULT '#artikel',
  second_text VARCHAR(80) NOT NULL DEFAULT 'Profil Jurusan',
  second_url VARCHAR(255) NOT NULL DEFAULT '#jurusan',
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_hero_slides_active_sort (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO hero_slides (
  title, subtitle, image_url, eyebrow, primary_text, primary_url, second_text, second_url, sort_order, is_active
)
SELECT seed.title, seed.subtitle, seed.image_url, seed.eyebrow, seed.primary_text, seed.primary_url,
       seed.second_text, seed.second_url, seed.sort_order, seed.is_active
FROM (
  SELECT 'Talenta Digital Berkarakter' AS title,
         'Portal utama SMK Telkom Lampung untuk informasi sekolah, inovasi siswa, dan perkembangan pendidikan teknologi.' AS subtitle,
         'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1800&q=82' AS image_url,
         'Portal Resmi Sekolah' AS eyebrow,
         'Lihat Berita' AS primary_text,
         '#artikel' AS primary_url,
         'Profil Jurusan' AS second_text,
         '#jurusan' AS second_url,
         1 AS sort_order,
         TRUE AS is_active
  UNION ALL
  SELECT 'Belajar Dekat dengan Industri',
         'Program vokasi diarahkan pada praktik nyata, kolaborasi industri, dan budaya kerja profesional.',
         'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1800&q=82',
         'Portal Resmi Sekolah',
         'Lihat Berita',
         '#artikel',
         'Profil Jurusan',
         '#jurusan',
         2,
         TRUE
  UNION ALL
  SELECT 'Ekosistem Sekolah Teknologi',
         'Artikel, agenda, pengumuman, dan profil jurusan tersaji rapi untuk siswa, orang tua, alumni, dan masyarakat.',
         'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1800&q=82',
         'Portal Resmi Sekolah',
         'Lihat Berita',
         '#artikel',
         'Profil Jurusan',
         '#jurusan',
         3,
         TRUE
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM (SELECT id FROM hero_slides LIMIT 1) AS existing_slides);
