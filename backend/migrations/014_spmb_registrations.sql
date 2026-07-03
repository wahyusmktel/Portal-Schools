ALTER TABLE users MODIFY role ENUM('superadmin', 'admin', 'contributor', 'admin-spmb') NOT NULL DEFAULT 'contributor';

ALTER TABLE school_profiles ADD COLUMN spmb_academic_year VARCHAR(20) NOT NULL DEFAULT '2026/2027';

CREATE TABLE IF NOT EXISTS spmb_registrations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  registration_number VARCHAR(40) NOT NULL UNIQUE,
  full_name VARCHAR(220) NOT NULL,
  whatsapp_number VARCHAR(40) NOT NULL,
  current_address TEXT NOT NULL,
  previous_school VARCHAR(220) NOT NULL,
  info_source VARCHAR(120) NOT NULL,
  father_name VARCHAR(160) NOT NULL,
  mother_name VARCHAR(160) NOT NULL,
  selected_major_id BIGINT NULL,
  selected_major_name VARCHAR(190) NOT NULL,
  academic_year VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_spmb_academic_year (academic_year),
  INDEX idx_spmb_created_at (created_at),
  INDEX idx_spmb_major (selected_major_id),
  CONSTRAINT fk_spmb_major FOREIGN KEY (selected_major_id) REFERENCES majors(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
