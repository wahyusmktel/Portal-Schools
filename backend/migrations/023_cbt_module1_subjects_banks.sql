CREATE TABLE IF NOT EXISTS cbt_subjects (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cbt_subjects_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cbt_question_banks (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  subject_id BIGINT NOT NULL,
  title VARCHAR(255) NOT NULL,
  grade_level VARCHAR(50) NOT NULL DEFAULT 'Semua',
  major VARCHAR(100) NOT NULL DEFAULT 'Semua',
  author_id BIGINT NULL,
  total_questions INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cbt_banks_subject FOREIGN KEY (subject_id) REFERENCES cbt_subjects(id) ON DELETE CASCADE,
  CONSTRAINT fk_cbt_banks_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_cbt_banks_subject (subject_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cbt_questions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  question_bank_id BIGINT NOT NULL,
  question_type ENUM('multiple_choice', 'complex_multiple_choice', 'true_false', 'matching', 'essay') NOT NULL DEFAULT 'multiple_choice',
  question_text MEDIUMTEXT NOT NULL,
  image_url TEXT NULL,
  audio_url TEXT NULL,
  points DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  options_json JSON NULL,
  correct_answer_json JSON NOT NULL,
  explanation TEXT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cbt_questions_bank FOREIGN KEY (question_bank_id) REFERENCES cbt_question_banks(id) ON DELETE CASCADE,
  INDEX idx_cbt_questions_bank (question_bank_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
