-- Expand spmb_registrations to fully support official Google Form fields
ALTER TABLE spmb_registrations
  ADD COLUMN class_grade VARCHAR(100) NOT NULL DEFAULT 'Kelas 9 SMP/Sederajat (Tahun Pelajaran 2027/2028)',
  ADD COLUMN nik VARCHAR(30) NOT NULL DEFAULT '',
  ADD COLUMN nisn VARCHAR(30) NOT NULL DEFAULT '',
  ADD COLUMN gender VARCHAR(20) NOT NULL DEFAULT 'Laki-laki',
  ADD COLUMN religion VARCHAR(30) NOT NULL DEFAULT 'Islam',
  ADD COLUMN birth_date VARCHAR(30) NOT NULL DEFAULT '',
  ADD COLUMN email VARCHAR(190) NOT NULL DEFAULT '',
  ADD COLUMN province VARCHAR(100) NOT NULL DEFAULT '',
  ADD COLUMN city VARCHAR(100) NOT NULL DEFAULT '',
  ADD COLUMN district VARCHAR(100) NOT NULL DEFAULT '',
  ADD COLUMN previous_school_address TEXT NULL,
  ADD COLUMN school_type VARCHAR(50) NOT NULL DEFAULT 'Sekolah Menengah Pertama (SMP)',
  ADD COLUMN ministry VARCHAR(80) NOT NULL DEFAULT 'Kementerian Pendidikan',
  ADD COLUMN registration_track VARCHAR(80) NOT NULL DEFAULT 'Reguler',
  ADD COLUMN father_education VARCHAR(80) NOT NULL DEFAULT '',
  ADD COLUMN father_occupation VARCHAR(100) NOT NULL DEFAULT '',
  ADD COLUMN father_birth_date VARCHAR(30) NOT NULL DEFAULT '',
  ADD COLUMN father_phone VARCHAR(40) NOT NULL DEFAULT '',
  ADD COLUMN mother_education VARCHAR(80) NOT NULL DEFAULT '',
  ADD COLUMN mother_occupation VARCHAR(100) NOT NULL DEFAULT '',
  ADD COLUMN mother_birth_date VARCHAR(30) NOT NULL DEFAULT '',
  ADD COLUMN mother_phone VARCHAR(40) NOT NULL DEFAULT '',
  ADD COLUMN student_card_file VARCHAR(255) NOT NULL DEFAULT '',
  ADD COLUMN family_card_file VARCHAR(255) NOT NULL DEFAULT '',
  ADD COLUMN birth_certificate_file VARCHAR(255) NOT NULL DEFAULT '',
  ADD COLUMN achievement_certificate_file VARCHAR(255) NOT NULL DEFAULT '',
  ADD COLUMN affiliator_name VARCHAR(160) NOT NULL DEFAULT '',
  ADD COLUMN reason TEXT NULL,
  ADD COLUMN choice_priority VARCHAR(160) NOT NULL DEFAULT 'Pilihan Utama',
  ADD COLUMN achievements_note TEXT NULL;

-- Table for Konfirmasi Pembayaran SPMB
CREATE TABLE IF NOT EXISTS spmb_payment_confirmations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  registration_number VARCHAR(40) NOT NULL,
  student_name VARCHAR(220) NOT NULL,
  batch VARCHAR(50) NOT NULL,
  amount BIGINT NOT NULL DEFAULT 0,
  proof_file VARCHAR(255) NOT NULL,
  status ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending',
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_spmb_pay_reg (registration_number),
  INDEX idx_spmb_pay_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for Upload Berkas Pendukung Susulan
CREATE TABLE IF NOT EXISTS spmb_supplementary_documents (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  registration_number VARCHAR(40) NOT NULL,
  student_name VARCHAR(220) NOT NULL,
  document_type VARCHAR(120) NOT NULL,
  file_url VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_spmb_doc_reg (registration_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
