SET @add_cover_image = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE majors ADD COLUMN cover_image TEXT NULL AFTER icon',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'majors'
    AND COLUMN_NAME = 'cover_image'
);
PREPARE stmt FROM @add_cover_image;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_curriculum_json = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE majors ADD COLUMN curriculum_json JSON NULL AFTER cover_image',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'majors'
    AND COLUMN_NAME = 'curriculum_json'
);
PREPARE stmt FROM @add_curriculum_json;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_career_prospects_json = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE majors ADD COLUMN career_prospects_json JSON NULL AFTER curriculum_json',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'majors'
    AND COLUMN_NAME = 'career_prospects_json'
);
PREPARE stmt FROM @add_career_prospects_json;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE majors
SET
  cover_image = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=82',
  curriculum_json = JSON_ARRAY('Jaringan komputer dasar', 'Administrasi server', 'Keamanan jaringan'),
  career_prospects_json = JSON_ARRAY('Network engineer', 'IT support', 'System administrator')
WHERE cover_image IS NULL;

DELETE FROM majors
WHERE slug IN ('tjkt', 'pplg', 'dkv');

INSERT INTO majors (name, slug, summary, icon, cover_image, curriculum_json, career_prospects_json, sort_order, is_active)
VALUES
  (
    'Teknik Jaringan Akses Telekomunikasi',
    'teknik-jaringan-akses-telekomunikasi',
    'Mempelajari instalasi, pengukuran, dan pemeliharaan jaringan akses telekomunikasi berbasis fiber optic, radio, dan perangkat transmisi.',
    'Network',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=82',
    JSON_ARRAY('Fiber optic dan FTTH', 'Sistem transmisi telekomunikasi', 'Pengukuran jaringan akses', 'Keselamatan kerja lapangan'),
    JSON_ARRAY('Teknisi fiber optic', 'Access network technician', 'Field operation engineer', 'Telecommunication support'),
    1,
    TRUE
  ),
  (
    'Teknik Komputer dan Jaringan',
    'teknik-komputer-dan-jaringan',
    'Berfokus pada perakitan komputer, administrasi jaringan, server, keamanan infrastruktur, dan layanan teknologi informasi.',
    'Network',
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1600&q=82',
    JSON_ARRAY('Administrasi sistem jaringan', 'Routing dan switching', 'Server Linux dan Windows', 'Cybersecurity dasar'),
    JSON_ARRAY('Network administrator', 'IT infrastructure staff', 'Technical support specialist', 'Junior cybersecurity analyst'),
    2,
    TRUE
  ),
  (
    'Rekayasa Perangkat Lunak',
    'rekayasa-perangkat-lunak',
    'Mengembangkan kemampuan membuat aplikasi web, mobile, basis data, UI, dan produk digital dengan praktik kerja industri.',
    'Code',
    'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1600&q=82',
    JSON_ARRAY('Pemrograman web frontend', 'Backend dan REST API', 'Basis data relasional', 'UI/UX dan pengujian aplikasi'),
    JSON_ARRAY('Frontend developer', 'Backend developer', 'Full-stack junior developer', 'Software QA tester'),
    3,
    TRUE
  ),
  (
    'Animasi',
    'animasi',
    'Membekali siswa dengan kompetensi ilustrasi digital, storyboard, animasi 2D/3D, editing, dan produksi konten kreatif.',
    'Palette',
    'https://images.unsplash.com/photo-1542626991-cbc4e32524cc?auto=format&fit=crop&w=1600&q=82',
    JSON_ARRAY('Dasar desain visual', 'Storyboard dan character design', 'Animasi 2D dan 3D', 'Video editing dan compositing'),
    JSON_ARRAY('Animator 2D/3D', 'Motion graphic designer', 'Content creator', 'Storyboard artist'),
    4,
    TRUE
  )
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  summary = VALUES(summary),
  icon = VALUES(icon),
  cover_image = VALUES(cover_image),
  curriculum_json = VALUES(curriculum_json),
  career_prospects_json = VALUES(career_prospects_json),
  sort_order = VALUES(sort_order),
  is_active = TRUE;
