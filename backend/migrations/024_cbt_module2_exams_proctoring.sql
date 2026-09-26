CREATE TABLE IF NOT EXISTS cbt_exams (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  question_bank_id BIGINT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 90,
  randomize_mode ENUM('none', 'questions_only', 'options_only', 'both') NOT NULL DEFAULT 'both',
  scoring_mode ENUM('auto_even_100', 'custom_points') NOT NULL DEFAULT 'auto_even_100',
  token_secret VARCHAR(64) NOT NULL,
  token_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cbt_exams_bank FOREIGN KEY (question_bank_id) REFERENCES cbt_question_banks(id) ON DELETE CASCADE,
  INDEX idx_cbt_exams_active (is_active, start_time, end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cbt_students (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  exam_number VARCHAR(64) NOT NULL UNIQUE,
  nisn VARCHAR(32) NOT NULL,
  name VARCHAR(160) NOT NULL,
  class_name VARCHAR(64) NOT NULL,
  major VARCHAR(64) NOT NULL DEFAULT 'Semua',
  username VARCHAR(64) NOT NULL UNIQUE,
  password_plain VARCHAR(64) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  session_room VARCHAR(64) NOT NULL DEFAULT 'Ruang 1',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_logged_in BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cbt_students_class (class_name),
  INDEX idx_cbt_students_room (session_room)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cbt_exam_proctors (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  exam_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  room_name VARCHAR(64) NOT NULL DEFAULT 'Ruang 1',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cbt_proctors_exam FOREIGN KEY (exam_id) REFERENCES cbt_exams(id) ON DELETE CASCADE,
  CONSTRAINT fk_cbt_proctors_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_cbt_exam_user_room (exam_id, user_id, room_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cbt_exam_attendances (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  exam_id BIGINT NOT NULL,
  student_id BIGINT NOT NULL,
  status ENUM('belum_mulai', 'sedang_mengerjakan', 'selesai', 'tidak_hadir') NOT NULL DEFAULT 'belum_mulai',
  current_question_index INT NOT NULL DEFAULT 1,
  answered_count INT NOT NULL DEFAULT 0,
  flagged_count INT NOT NULL DEFAULT 0,
  started_at TIMESTAMP NULL,
  finished_at TIMESTAMP NULL,
  score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cbt_att_exam FOREIGN KEY (exam_id) REFERENCES cbt_exams(id) ON DELETE CASCADE,
  CONSTRAINT fk_cbt_att_student FOREIGN KEY (student_id) REFERENCES cbt_students(id) ON DELETE CASCADE,
  UNIQUE KEY uq_cbt_exam_student (exam_id, student_id),
  INDEX idx_cbt_att_status (exam_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cbt_official_reports (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  exam_id BIGINT NOT NULL,
  proctor_id BIGINT NOT NULL,
  room_name VARCHAR(64) NOT NULL,
  report_date DATE NOT NULL,
  start_time VARCHAR(10) NOT NULL,
  end_time VARCHAR(10) NOT NULL,
  total_candidates INT NOT NULL DEFAULT 0,
  present_count INT NOT NULL DEFAULT 0,
  absent_count INT NOT NULL DEFAULT 0,
  absent_students_text TEXT,
  notes TEXT,
  is_finalized BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cbt_reports_exam FOREIGN KEY (exam_id) REFERENCES cbt_exams(id) ON DELETE CASCADE,
  CONSTRAINT fk_cbt_reports_proctor FOREIGN KEY (proctor_id) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_cbt_reports_exam_room (exam_id, room_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
