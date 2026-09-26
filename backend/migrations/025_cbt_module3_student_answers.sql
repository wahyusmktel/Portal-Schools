CREATE TABLE IF NOT EXISTS cbt_student_answers (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  exam_id BIGINT NOT NULL,
  student_id BIGINT NOT NULL,
  question_id BIGINT NOT NULL,
  answer_json JSON NOT NULL,
  is_flagged BOOLEAN NOT NULL DEFAULT FALSE,
  score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  is_graded BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cbt_ans_exam FOREIGN KEY (exam_id) REFERENCES cbt_exams(id) ON DELETE CASCADE,
  CONSTRAINT fk_cbt_ans_student FOREIGN KEY (student_id) REFERENCES cbt_students(id) ON DELETE CASCADE,
  CONSTRAINT fk_cbt_ans_question FOREIGN KEY (question_id) REFERENCES cbt_questions(id) ON DELETE CASCADE,
  UNIQUE KEY uq_cbt_student_exam_q (exam_id, student_id, question_id),
  INDEX idx_cbt_student_exam (exam_id, student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
