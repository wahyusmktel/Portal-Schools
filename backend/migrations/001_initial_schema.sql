CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(160) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('superadmin', 'admin', 'contributor') NOT NULL DEFAULT 'contributor',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role (role),
  INDEX idx_users_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS school_profiles (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(190) NOT NULL,
  tagline VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(80) NOT NULL,
  email VARCHAR(190) NOT NULL,
  map_embed_url TEXT NOT NULL,
  stats_json JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS majors (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(190) NOT NULL,
  slug VARCHAR(190) NOT NULL UNIQUE,
  summary TEXT NOT NULL,
  icon VARCHAR(80) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_majors_active_order (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS articles (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(220) NOT NULL,
  slug VARCHAR(230) NOT NULL UNIQUE,
  excerpt TEXT NOT NULL,
  content MEDIUMTEXT NOT NULL,
  cover_image TEXT NOT NULL,
  category VARCHAR(90) NOT NULL DEFAULT 'Sekolah',
  status ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
  published_at TIMESTAMP NULL,
  author_id BIGINT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FULLTEXT KEY ft_articles_search (title, excerpt, content),
  INDEX idx_articles_status_published (status, published_at),
  CONSTRAINT fk_articles_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS announcements (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(220) NOT NULL,
  body TEXT NOT NULL,
  status ENUM('draft', 'published') NOT NULL DEFAULT 'published',
  published_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_announcements_title (title),
  INDEX idx_announcements_status_published (status, published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS agendas (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(220) NOT NULL,
  location VARCHAR(220) NOT NULL,
  starts_at DATETIME NOT NULL,
  ends_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_agendas_title_starts (title, starts_at),
  INDEX idx_agendas_starts_at (starts_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NULL,
  action VARCHAR(120) NOT NULL,
  entity_type VARCHAR(120) NOT NULL,
  entity_id BIGINT NULL,
  ip_address VARCHAR(80) NULL,
  user_agent TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_logs_created_at (created_at),
  CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO school_profiles (id, name, tagline, description, address, phone, email, map_embed_url, stats_json)
VALUES (
  1,
  'SMK Telkom Lampung',
  'Sekolah teknologi yang menyiapkan talenta digital berkarakter.',
  'SMK Telkom Lampung berfokus pada pembelajaran vokasi berbasis industri, budaya inovasi, dan penguatan karakter agar siswa siap berkarya di dunia teknologi.',
  'Jl. Pulau Morotai No. 12, Jagabaya III, Bandar Lampung',
  '(0721) 000000',
  'info@smktelkom-lpg.sch.id',
  'https://www.google.com/maps?q=SMK%20Telkom%20Lampung&output=embed',
  JSON_ARRAY(
    JSON_OBJECT('label', 'Program Keahlian', 'value', '4+'),
    JSON_OBJECT('label', 'Ekosistem Industri', 'value', 'Telkom'),
    JSON_OBJECT('label', 'Fokus Belajar', 'value', 'Digital')
  )
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  tagline = VALUES(tagline),
  description = VALUES(description),
  address = VALUES(address),
  phone = VALUES(phone),
  email = VALUES(email),
  map_embed_url = VALUES(map_embed_url),
  stats_json = VALUES(stats_json);

INSERT INTO majors (name, slug, summary, icon, sort_order)
VALUES
  ('Teknik Jaringan Komputer dan Telekomunikasi', 'tjkt', 'Mempelajari jaringan, infrastruktur server, keamanan jaringan, dan teknologi telekomunikasi modern.', 'Network', 1),
  ('Pengembangan Perangkat Lunak dan Gim', 'pplg', 'Berfokus pada pemrograman web, aplikasi, basis data, UI, dan pengembangan produk digital.', 'Code', 2),
  ('Desain Komunikasi Visual', 'dkv', 'Mengembangkan kemampuan desain visual, branding, multimedia, fotografi, dan produksi konten.', 'Palette', 3)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  summary = VALUES(summary),
  icon = VALUES(icon),
  sort_order = VALUES(sort_order),
  is_active = TRUE;

INSERT INTO articles (title, slug, excerpt, content, cover_image, category, status, published_at)
VALUES
  (
    'Siswa SMK Telkom Lampung Mengembangkan Proyek IoT Sekolah',
    'siswa-smk-telkom-lampung-mengembangkan-proyek-iot-sekolah',
    'Proyek pembelajaran berbasis Internet of Things membantu siswa memahami sensor, jaringan, dan pengolahan data.',
    'Proyek pembelajaran berbasis Internet of Things membantu siswa memahami sensor, jaringan, dan pengolahan data di lingkungan sekolah.',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80',
    'Teknologi',
    'published',
    '2026-06-20 08:00:00'
  ),
  (
    'Budaya Literasi Digital untuk Pembelajaran yang Lebih Aman',
    'budaya-literasi-digital-untuk-pembelajaran-yang-lebih-aman',
    'Literasi digital menjadi bekal penting agar warga sekolah mampu memakai teknologi secara produktif dan bertanggung jawab.',
    'Literasi digital menjadi bekal penting agar warga sekolah mampu memakai teknologi secara produktif dan bertanggung jawab.',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80',
    'Pendidikan',
    'published',
    '2026-06-18 09:30:00'
  )
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  excerpt = VALUES(excerpt),
  content = VALUES(content),
  cover_image = VALUES(cover_image),
  category = VALUES(category),
  status = VALUES(status),
  published_at = VALUES(published_at);

INSERT INTO announcements (title, body, status, published_at)
VALUES
  ('Daftar ulang peserta didik baru', 'Daftar ulang dilaksanakan pada jam kerja melalui loket administrasi sekolah.', 'published', '2026-06-21 07:00:00'),
  ('Pemeliharaan sistem informasi akademik', 'Akses sistem akademik sementara dibatasi saat proses pemeliharaan terjadwal.', 'published', '2026-06-19 15:30:00')
ON DUPLICATE KEY UPDATE
  body = VALUES(body),
  status = VALUES(status),
  published_at = VALUES(published_at);

INSERT INTO agendas (title, location, starts_at)
VALUES
  ('Workshop keamanan siber dasar', 'Laboratorium Jaringan', '2026-07-08 09:00:00'),
  ('Rapat orang tua peserta didik', 'Aula Sekolah', '2026-07-12 08:30:00')
ON DUPLICATE KEY UPDATE
  location = VALUES(location),
  starts_at = VALUES(starts_at);
