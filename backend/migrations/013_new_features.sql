-- Add new columns to school_profiles
ALTER TABLE school_profiles ADD COLUMN vision TEXT;
ALTER TABLE school_profiles ADD COLUMN mission TEXT;
ALTER TABLE school_profiles ADD COLUMN spmb_brochure_url TEXT;

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(220) NOT NULL,
  description TEXT,
  image_url TEXT,
  student_name VARCHAR(150),
  achievement_level ENUM('Sekolah', 'Kabupaten', 'Provinsi', 'Nasional', 'Internasional') DEFAULT 'Nasional',
  achieved_at DATE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_achievements_date (achieved_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create industry_partners table
CREATE TABLE IF NOT EXISTS industry_partners (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(220) NOT NULL,
  logo_url TEXT,
  description TEXT,
  field_of_industry VARCHAR(150),
  website_url TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_industry_partners_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create alumni table
CREATE TABLE IF NOT EXISTS alumni (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(220) NOT NULL,
  graduation_year INT NOT NULL,
  current_status ENUM('Kerja', 'Kuliah', 'Wirausaha', 'Lainnya') NOT NULL,
  company_or_university VARCHAR(220),
  testimonial TEXT,
  image_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_alumni_graduation_year (graduation_year),
  INDEX idx_alumni_status (current_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create faqs table
CREATE TABLE IF NOT EXISTS faqs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  question VARCHAR(500) NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(150) DEFAULT 'Umum',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
