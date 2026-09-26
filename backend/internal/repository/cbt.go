package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"math/rand"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
	"portal-smktelkom/backend/internal/models"
)

// --- SUBJECTS ---

func (r *Repository) ListCbtSubjects(ctx context.Context) ([]models.CbtSubject, error) {
	query := `SELECT id, code, name, COALESCE(description, ''), created_at, updated_at FROM cbt_subjects ORDER BY name ASC`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.CbtSubject
	for rows.Next() {
		var item models.CbtSubject
		if err := rows.Scan(&item.ID, &item.Code, &item.Name, &item.Description, &item.CreatedAt, &item.UpdatedAt); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *Repository) GetCbtSubject(ctx context.Context, id int64) (*models.CbtSubject, error) {
	query := `SELECT id, code, name, COALESCE(description, ''), created_at, updated_at FROM cbt_subjects WHERE id = ?`
	var item models.CbtSubject
	err := r.db.QueryRowContext(ctx, query, id).Scan(&item.ID, &item.Code, &item.Name, &item.Description, &item.CreatedAt, &item.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &item, nil
}

func (r *Repository) CreateCbtSubject(ctx context.Context, p models.CreateCbtSubjectPayload) (int64, error) {
	result, err := r.db.ExecContext(ctx, `
		INSERT INTO cbt_subjects (code, name, description)
		VALUES (?, ?, ?)
	`, p.Code, p.Name, p.Description)
	if err != nil {
		return 0, err
	}
	return result.LastInsertId()
}

func (r *Repository) UpdateCbtSubject(ctx context.Context, id int64, p models.CreateCbtSubjectPayload) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE cbt_subjects SET code = ?, name = ?, description = ?
		WHERE id = ?
	`, p.Code, p.Name, p.Description, id)
	return err
}

func (r *Repository) DeleteCbtSubject(ctx context.Context, id int64) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM cbt_subjects WHERE id = ?`, id)
	return err
}

// --- QUESTION BANKS ---

func (r *Repository) ListCbtQuestionBanks(ctx context.Context, subjectID int64) ([]models.CbtQuestionBank, error) {
	query := `
		SELECT b.id, b.subject_id, s.code, s.name, b.title, b.grade_level, b.major,
		       b.author_id, COALESCE(u.name, ''), b.total_questions, b.created_at, b.updated_at
		FROM cbt_question_banks b
		JOIN cbt_subjects s ON s.id = b.subject_id
		LEFT JOIN users u ON u.id = b.author_id
	`
	var args []interface{}
	if subjectID > 0 {
		query += " WHERE b.subject_id = ?"
		args = append(args, subjectID)
	}
	query += " ORDER BY b.id DESC"

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.CbtQuestionBank
	for rows.Next() {
		var item models.CbtQuestionBank
		if err := rows.Scan(
			&item.ID, &item.SubjectID, &item.SubjectCode, &item.SubjectName,
			&item.Title, &item.GradeLevel, &item.Major, &item.AuthorID,
			&item.AuthorName, &item.TotalQuestions, &item.CreatedAt, &item.UpdatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *Repository) GetCbtQuestionBank(ctx context.Context, id int64) (*models.CbtQuestionBank, error) {
	query := `
		SELECT b.id, b.subject_id, s.code, s.name, b.title, b.grade_level, b.major,
		       b.author_id, COALESCE(u.name, ''), b.total_questions, b.created_at, b.updated_at
		FROM cbt_question_banks b
		JOIN cbt_subjects s ON s.id = b.subject_id
		LEFT JOIN users u ON u.id = b.author_id
		WHERE b.id = ?
	`
	var item models.CbtQuestionBank
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&item.ID, &item.SubjectID, &item.SubjectCode, &item.SubjectName,
		&item.Title, &item.GradeLevel, &item.Major, &item.AuthorID,
		&item.AuthorName, &item.TotalQuestions, &item.CreatedAt, &item.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &item, nil
}

func (r *Repository) CreateCbtQuestionBank(ctx context.Context, authorID *int64, p models.CreateCbtQuestionBankPayload) (int64, error) {
	result, err := r.db.ExecContext(ctx, `
		INSERT INTO cbt_question_banks (subject_id, title, grade_level, major, author_id, total_questions)
		VALUES (?, ?, ?, ?, ?, 0)
	`, p.SubjectID, p.Title, p.GradeLevel, p.Major, authorID)
	if err != nil {
		return 0, err
	}
	return result.LastInsertId()
}

func (r *Repository) UpdateCbtQuestionBank(ctx context.Context, id int64, p models.CreateCbtQuestionBankPayload) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE cbt_question_banks
		SET subject_id = ?, title = ?, grade_level = ?, major = ?
		WHERE id = ?
	`, p.SubjectID, p.Title, p.GradeLevel, p.Major, id)
	return err
}

func (r *Repository) DeleteCbtQuestionBank(ctx context.Context, id int64) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM cbt_question_banks WHERE id = ?`, id)
	return err
}

func (r *Repository) SyncQuestionBankCount(ctx context.Context, bankID int64) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE cbt_question_banks
		SET total_questions = (SELECT COUNT(*) FROM cbt_questions WHERE question_bank_id = ?)
		WHERE id = ?
	`, bankID, bankID)
	return err
}

// --- QUESTIONS ---

func (r *Repository) ListCbtQuestionsByBank(ctx context.Context, bankID int64) ([]models.CbtQuestion, error) {
	query := `
		SELECT id, question_bank_id, question_type, question_text,
		       COALESCE(image_url, ''), COALESCE(audio_url, ''), points,
		       COALESCE(options_json, '[]'), correct_answer_json,
		       COALESCE(explanation, ''), sort_order, created_at, updated_at
		FROM cbt_questions
		WHERE question_bank_id = ?
		ORDER BY sort_order ASC, id ASC
	`
	rows, err := r.db.QueryContext(ctx, query, bankID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.CbtQuestion
	for rows.Next() {
		var item models.CbtQuestion
		var optBytes, ansBytes []byte
		if err := rows.Scan(
			&item.ID, &item.QuestionBankID, &item.QuestionType, &item.QuestionText,
			&item.ImageURL, &item.AudioURL, &item.Points,
			&optBytes, &ansBytes,
			&item.Explanation, &item.SortOrder, &item.CreatedAt, &item.UpdatedAt,
		); err != nil {
			return nil, err
		}
		item.Options = optBytes
		item.CorrectAnswer = ansBytes
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *Repository) GetCbtQuestion(ctx context.Context, id int64) (*models.CbtQuestion, error) {
	query := `
		SELECT id, question_bank_id, question_type, question_text,
		       COALESCE(image_url, ''), COALESCE(audio_url, ''), points,
		       COALESCE(options_json, '[]'), correct_answer_json,
		       COALESCE(explanation, ''), sort_order, created_at, updated_at
		FROM cbt_questions
		WHERE id = ?
	`
	var item models.CbtQuestion
	var optBytes, ansBytes []byte
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&item.ID, &item.QuestionBankID, &item.QuestionType, &item.QuestionText,
		&item.ImageURL, &item.AudioURL, &item.Points,
		&optBytes, &ansBytes,
		&item.Explanation, &item.SortOrder, &item.CreatedAt, &item.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	item.Options = optBytes
	item.CorrectAnswer = ansBytes
	return &item, nil
}

func (r *Repository) CreateCbtQuestion(ctx context.Context, p models.UpsertCbtQuestionPayload) (int64, error) {
	res, err := r.db.ExecContext(ctx, `
		INSERT INTO cbt_questions (
			question_bank_id, question_type, question_text, image_url, audio_url,
			points, options_json, correct_answer_json, explanation, sort_order
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, p.QuestionBankID, p.QuestionType, p.QuestionText, p.ImageURL, p.AudioURL,
		p.Points, string(p.Options), string(p.CorrectAnswer), p.Explanation, p.SortOrder)
	if err != nil {
		return 0, err
	}
	qID, _ := res.LastInsertId()
	_ = r.SyncQuestionBankCount(ctx, p.QuestionBankID)
	return qID, nil
}

func (r *Repository) UpdateCbtQuestion(ctx context.Context, id int64, p models.UpsertCbtQuestionPayload) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE cbt_questions SET
			question_type = ?, question_text = ?, image_url = ?, audio_url = ?,
			points = ?, options_json = ?, correct_answer_json = ?, explanation = ?, sort_order = ?
		WHERE id = ?
	`, p.QuestionType, p.QuestionText, p.ImageURL, p.AudioURL,
		p.Points, string(p.Options), string(p.CorrectAnswer), p.Explanation, p.SortOrder, id)
	return err
}

func (r *Repository) DeleteCbtQuestion(ctx context.Context, id int64) error {
	var bankID int64
	_ = r.db.QueryRowContext(ctx, `SELECT question_bank_id FROM cbt_questions WHERE id = ?`, id).Scan(&bankID)
	_, err := r.db.ExecContext(ctx, `DELETE FROM cbt_questions WHERE id = ?`, id)
	if err == nil && bankID > 0 {
		_ = r.SyncQuestionBankCount(ctx, bankID)
	}
	return err
}

func (r *Repository) BatchInsertCbtQuestions(ctx context.Context, bankID int64, questions []models.UpsertCbtQuestionPayload) (int, error) {
	if len(questions) == 0 {
		return 0, nil
	}

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()

	stmt, err := tx.PrepareContext(ctx, `
		INSERT INTO cbt_questions (
			question_bank_id, question_type, question_text, image_url, audio_url,
			points, options_json, correct_answer_json, explanation, sort_order
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`)
	if err != nil {
		return 0, err
	}
	defer stmt.Close()

	insertedCount := 0
	for i, q := range questions {
		sortOrder := q.SortOrder
		if sortOrder == 0 {
			sortOrder = i + 1
		}
		points := q.Points
		if points <= 0 {
			points = 1.00
		}
		qType := q.QuestionType
		if qType == "" {
			qType = "multiple_choice"
		}

		_, err := stmt.ExecContext(ctx,
			bankID, qType, q.QuestionText, q.ImageURL, q.AudioURL,
			points, string(q.Options), string(q.CorrectAnswer), q.Explanation, sortOrder,
		)
		if err != nil {
			return insertedCount, fmt.Errorf("failed inserting question #%d: %w", i+1, err)
		}
		insertedCount++
	}

	if err := tx.Commit(); err != nil {
		return 0, err
	}

	_ = r.SyncQuestionBankCount(ctx, bankID)
	return insertedCount, nil
}

// ==========================================
// --- MODULE 2: EXAMS & PROCTORING ENGINE ---
// ==========================================

// --- EXAMS ---

func (r *Repository) ListCbtExams(ctx context.Context) ([]models.CbtExam, error) {
	query := `
		SELECT e.id, e.question_bank_id, b.title, s.name, e.title, COALESCE(e.description, ''),
		       e.start_time, e.end_time, e.duration_minutes, e.randomize_mode, e.scoring_mode,
		       e.token_secret, e.token_enabled, e.is_active,
		       (SELECT COUNT(*) FROM cbt_questions WHERE question_bank_id = e.question_bank_id) AS total_questions,
		       (SELECT COUNT(*) FROM cbt_exam_attendances WHERE exam_id = e.id) AS total_participants,
		       e.created_at, e.updated_at
		FROM cbt_exams e
		JOIN cbt_question_banks b ON b.id = e.question_bank_id
		JOIN cbt_subjects s ON s.id = b.subject_id
		ORDER BY e.start_time DESC, e.id DESC
	`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.CbtExam
	for rows.Next() {
		var item models.CbtExam
		if err := rows.Scan(
			&item.ID, &item.QuestionBankID, &item.BankTitle, &item.SubjectName,
			&item.Title, &item.Description, &item.StartTime, &item.EndTime,
			&item.DurationMinutes, &item.RandomizeMode, &item.ScoringMode,
			&item.TokenSecret, &item.TokenEnabled, &item.IsActive,
			&item.TotalQuestions, &item.TotalParticipants,
			&item.CreatedAt, &item.UpdatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *Repository) GetCbtExam(ctx context.Context, id int64) (*models.CbtExam, error) {
	query := `
		SELECT e.id, e.question_bank_id, b.title, s.name, e.title, COALESCE(e.description, ''),
		       e.start_time, e.end_time, e.duration_minutes, e.randomize_mode, e.scoring_mode,
		       e.token_secret, e.token_enabled, e.is_active,
		       (SELECT COUNT(*) FROM cbt_questions WHERE question_bank_id = e.question_bank_id) AS total_questions,
		       (SELECT COUNT(*) FROM cbt_exam_attendances WHERE exam_id = e.id) AS total_participants,
		       e.created_at, e.updated_at
		FROM cbt_exams e
		JOIN cbt_question_banks b ON b.id = e.question_bank_id
		JOIN cbt_subjects s ON s.id = b.subject_id
		WHERE e.id = ?
	`
	var item models.CbtExam
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&item.ID, &item.QuestionBankID, &item.BankTitle, &item.SubjectName,
		&item.Title, &item.Description, &item.StartTime, &item.EndTime,
		&item.DurationMinutes, &item.RandomizeMode, &item.ScoringMode,
		&item.TokenSecret, &item.TokenEnabled, &item.IsActive,
		&item.TotalQuestions, &item.TotalParticipants,
		&item.CreatedAt, &item.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &item, nil
}

func (r *Repository) CreateCbtExam(ctx context.Context, p models.CreateCbtExamPayload, tokenSecret string) (int64, error) {
	res, err := r.db.ExecContext(ctx, `
		INSERT INTO cbt_exams (
			question_bank_id, title, description, start_time, end_time,
			duration_minutes, randomize_mode, scoring_mode, token_secret, token_enabled, is_active
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, p.QuestionBankID, p.Title, p.Description, p.StartTime, p.EndTime,
		p.DurationMinutes, p.RandomizeMode, p.ScoringMode, tokenSecret, p.TokenEnabled, p.IsActive)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (r *Repository) UpdateCbtExam(ctx context.Context, id int64, p models.CreateCbtExamPayload) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE cbt_exams SET
			question_bank_id = ?, title = ?, description = ?,
			start_time = ?, end_time = ?, duration_minutes = ?,
			randomize_mode = ?, scoring_mode = ?, token_enabled = ?, is_active = ?
		WHERE id = ?
	`, p.QuestionBankID, p.Title, p.Description, p.StartTime, p.EndTime,
		p.DurationMinutes, p.RandomizeMode, p.ScoringMode, p.TokenEnabled, p.IsActive, id)
	return err
}

func (r *Repository) DeleteCbtExam(ctx context.Context, id int64) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM cbt_exams WHERE id = ?`, id)
	return err
}

// --- STUDENTS ---

func (r *Repository) ListCbtStudents(ctx context.Context, className, sessionRoom, search string) ([]models.CbtStudent, error) {
	query := `
		SELECT id, exam_number, nisn, name, class_name, major,
		       username, password_plain, session_room, is_active, is_logged_in,
		       created_at, updated_at
		FROM cbt_students
		WHERE 1=1
	`
	var args []interface{}
	if className != "" {
		query += " AND class_name = ?"
		args = append(args, className)
	}
	if sessionRoom != "" {
		query += " AND session_room = ?"
		args = append(args, sessionRoom)
	}
	if search != "" {
		query += " AND (name LIKE ? OR exam_number LIKE ? OR username LIKE ?)"
		like := "%" + search + "%"
		args = append(args, like, like, like)
	}
	query += " ORDER BY class_name ASC, exam_number ASC"

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.CbtStudent
	for rows.Next() {
		var item models.CbtStudent
		if err := rows.Scan(
			&item.ID, &item.ExamNumber, &item.NISN, &item.Name, &item.ClassName, &item.Major,
			&item.Username, &item.PasswordPlain, &item.SessionRoom, &item.IsActive, &item.IsLoggedIn,
			&item.CreatedAt, &item.UpdatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *Repository) GetCbtStudent(ctx context.Context, id int64) (*models.CbtStudent, error) {
	query := `
		SELECT id, exam_number, nisn, name, class_name, major,
		       username, password_plain, session_room, is_active, is_logged_in,
		       created_at, updated_at
		FROM cbt_students
		WHERE id = ?
	`
	var item models.CbtStudent
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&item.ID, &item.ExamNumber, &item.NISN, &item.Name, &item.ClassName, &item.Major,
		&item.Username, &item.PasswordPlain, &item.SessionRoom, &item.IsActive, &item.IsLoggedIn,
		&item.CreatedAt, &item.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &item, nil
}

func (r *Repository) CreateCbtStudent(ctx context.Context, p models.CreateCbtStudentPayload, passHash string) (int64, error) {
	username := p.ExamNumber
	res, err := r.db.ExecContext(ctx, `
		INSERT INTO cbt_students (
			exam_number, nisn, name, class_name, major,
			username, password_plain, password_hash, session_room, is_active
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
	`, p.ExamNumber, p.NISN, p.Name, p.ClassName, p.Major,
		username, p.Password, passHash, p.SessionRoom)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (r *Repository) BatchCreateCbtStudents(ctx context.Context, students []models.CreateCbtStudentPayload, hashes []string) (int, error) {
	if len(students) == 0 {
		return 0, nil
	}
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()

	stmt, err := tx.PrepareContext(ctx, `
		INSERT INTO cbt_students (
			exam_number, nisn, name, class_name, major,
			username, password_plain, password_hash, session_room, is_active
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
		ON DUPLICATE KEY UPDATE
			name = VALUES(name), nisn = VALUES(nisn), class_name = VALUES(class_name),
			major = VALUES(major), password_plain = VALUES(password_plain),
			password_hash = VALUES(password_hash), session_room = VALUES(session_room)
	`)
	if err != nil {
		return 0, err
	}
	defer stmt.Close()

	count := 0
	for i, s := range students {
		username := s.ExamNumber
		_, err := stmt.ExecContext(ctx,
			s.ExamNumber, s.NISN, s.Name, s.ClassName, s.Major,
			username, s.Password, hashes[i], s.SessionRoom,
		)
		if err != nil {
			return count, err
		}
		count++
	}

	return count, tx.Commit()
}

func (r *Repository) DeleteCbtStudent(ctx context.Context, id int64) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM cbt_students WHERE id = ?`, id)
	return err
}

// AssignClassToExam adds all students of a class to an exam
func (r *Repository) AssignClassToExam(ctx context.Context, examID int64, className string) (int64, error) {
	query := `
		INSERT IGNORE INTO cbt_exam_attendances (exam_id, student_id, status)
		SELECT ?, id, 'belum_mulai'
		FROM cbt_students
		WHERE class_name = ? AND is_active = 1
	`
	res, err := r.db.ExecContext(ctx, query, examID, className)
	if err != nil {
		return 0, err
	}
	return res.RowsAffected()
}

// AssignStudentsToExam adds specific students to an exam
func (r *Repository) AssignStudentsToExam(ctx context.Context, examID int64, studentIDs []int64) (int, error) {
	if len(studentIDs) == 0 {
		return 0, nil
	}
	query := `INSERT IGNORE INTO cbt_exam_attendances (exam_id, student_id, status) VALUES (?, ?, 'belum_mulai')`
	stmt, err := r.db.PrepareContext(ctx, query)
	if err != nil {
		return 0, err
	}
	defer stmt.Close()

	count := 0
	for _, sid := range studentIDs {
		_, err := stmt.ExecContext(ctx, examID, sid)
		if err == nil {
			count++
		}
	}
	return count, nil
}

// --- PROCTORS & ATTENDANCE ---

func (r *Repository) ListExamProctors(ctx context.Context, examID int64) ([]models.CbtExamProctor, error) {
	query := `
		SELECT p.id, p.exam_id, p.user_id, u.name, u.email, p.room_name, p.created_at
		FROM cbt_exam_proctors p
		JOIN users u ON u.id = p.user_id
		WHERE p.exam_id = ?
		ORDER BY p.room_name ASC, u.name ASC
	`
	rows, err := r.db.QueryContext(ctx, query, examID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.CbtExamProctor
	for rows.Next() {
		var item models.CbtExamProctor
		if err := rows.Scan(
			&item.ID, &item.ExamID, &item.UserID, &item.UserName, &item.UserEmail,
			&item.RoomName, &item.CreatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *Repository) AssignExamProctor(ctx context.Context, examID, userID int64, roomName string) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO cbt_exam_proctors (exam_id, user_id, room_name)
		VALUES (?, ?, ?)
		ON DUPLICATE KEY UPDATE room_name = VALUES(room_name)
	`, examID, userID, roomName)
	return err
}

func (r *Repository) RemoveExamProctor(ctx context.Context, id int64) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM cbt_exam_proctors WHERE id = ?`, id)
	return err
}

func (r *Repository) ListExamAttendances(ctx context.Context, examID int64, roomName string) ([]models.CbtExamAttendance, error) {
	query := `
		SELECT a.id, a.exam_id, a.student_id, s.name, s.exam_number, s.class_name, s.session_room,
		       a.status, a.current_question_index, a.answered_count, a.flagged_count,
		       a.started_at, a.finished_at, a.score, COALESCE(a.ip_address, ''), COALESCE(a.user_agent, ''),
		       a.created_at, a.updated_at
		FROM cbt_exam_attendances a
		JOIN cbt_students s ON s.id = a.student_id
		WHERE a.exam_id = ?
	`
	var args []interface{}
	args = append(args, examID)
	if roomName != "" && roomName != "Semua" {
		query += " AND s.session_room = ?"
		args = append(args, roomName)
	}
	query += " ORDER BY s.session_room ASC, s.exam_number ASC"

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.CbtExamAttendance
	for rows.Next() {
		var item models.CbtExamAttendance
		if err := rows.Scan(
			&item.ID, &item.ExamID, &item.StudentID, &item.StudentName, &item.ExamNumber, &item.ClassName, &item.SessionRoom,
			&item.Status, &item.CurrentQuestionIndex, &item.AnsweredCount, &item.FlaggedCount,
			&item.StartedAt, &item.FinishedAt, &item.Score, &item.IPAddress, &item.UserAgent,
			&item.CreatedAt, &item.UpdatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

// RecordExamStart sets status to sedang_mengerjakan and saves started_at (Automatic Attendance)
func (r *Repository) RecordExamStart(ctx context.Context, examID, studentID int64, ip, userAgent string) error {
	query := `
		UPDATE cbt_exam_attendances
		SET status = 'sedang_mengerjakan',
		    started_at = COALESCE(started_at, NOW()),
		    ip_address = ?,
		    user_agent = ?
		WHERE exam_id = ? AND student_id = ?
	`
	_, err := r.db.ExecContext(ctx, query, ip, userAgent, examID, studentID)
	return err
}

// RecordExamFinish sets status to selesai and records finished_at
func (r *Repository) RecordExamFinish(ctx context.Context, examID, studentID int64, score float64) error {
	query := `
		UPDATE cbt_exam_attendances
		SET status = 'selesai',
		    finished_at = NOW(),
		    score = ?
		WHERE exam_id = ? AND student_id = ?
	`
	_, err := r.db.ExecContext(ctx, query, score, examID, studentID)
	return err
}

func (r *Repository) UpdateStudentExamProgress(ctx context.Context, examID, studentID int64, curQ, answered, flagged int) error {
	query := `
		UPDATE cbt_exam_attendances
		SET current_question_index = ?,
		    answered_count = ?,
		    flagged_count = ?
		WHERE exam_id = ? AND student_id = ?
	`
	_, err := r.db.ExecContext(ctx, query, curQ, answered, flagged, examID, studentID)
	return err
}

// --- OFFICIAL REPORTS (BERITA ACARA) ---

func (r *Repository) GetExamOfficialReport(ctx context.Context, examID int64, roomName string) (*models.CbtOfficialReport, error) {
	query := `
		SELECT r.id, r.exam_id, e.title, s.name, r.proctor_id, u.name, r.room_name,
		       r.report_date, r.start_time, r.end_time, r.total_candidates, r.present_count,
		       r.absent_count, COALESCE(r.absent_students_text, ''), COALESCE(r.notes, ''),
		       r.is_finalized, r.created_at, r.updated_at
		FROM cbt_official_reports r
		JOIN cbt_exams e ON e.id = r.exam_id
		JOIN cbt_question_banks b ON b.id = e.question_bank_id
		JOIN cbt_subjects s ON s.id = b.subject_id
		JOIN users u ON u.id = r.proctor_id
		WHERE r.exam_id = ? AND r.room_name = ?
	`
	var item models.CbtOfficialReport
	err := r.db.QueryRowContext(ctx, query, examID, roomName).Scan(
		&item.ID, &item.ExamID, &item.ExamTitle, &item.SubjectName, &item.ProctorID, &item.ProctorName, &item.RoomName,
		&item.ReportDate, &item.StartTime, &item.EndTime, &item.TotalCandidates, &item.PresentCount,
		&item.AbsentCount, &item.AbsentStudentsText, &item.Notes,
		&item.IsFinalized, &item.CreatedAt, &item.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &item, nil
}

func (r *Repository) SaveExamOfficialReport(ctx context.Context, report models.CbtOfficialReport) (int64, error) {
	query := `
		INSERT INTO cbt_official_reports (
			exam_id, proctor_id, room_name, report_date, start_time, end_time,
			total_candidates, present_count, absent_count, absent_students_text, notes, is_finalized
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON DUPLICATE KEY UPDATE
			proctor_id = VALUES(proctor_id),
			report_date = VALUES(report_date),
			start_time = VALUES(start_time),
			end_time = VALUES(end_time),
			total_candidates = VALUES(total_candidates),
			present_count = VALUES(present_count),
			absent_count = VALUES(absent_count),
			absent_students_text = VALUES(absent_students_text),
			notes = VALUES(notes),
			is_finalized = VALUES(is_finalized)
	`
	res, err := r.db.ExecContext(ctx, query,
		report.ExamID, report.ProctorID, report.RoomName, report.ReportDate,
		report.StartTime, report.EndTime, report.TotalCandidates, report.PresentCount,
		report.AbsentCount, report.AbsentStudentsText, report.Notes, report.IsFinalized,
	)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

// ==========================================
// --- MODULE 3: STUDENT EXAM & AUTOSAVE ---
// ==========================================

func (r *Repository) AuthenticateCbtStudent(ctx context.Context, identifier, password string) (*models.CbtStudent, error) {
	query := `
		SELECT id, exam_number, nisn, name, class_name, major,
		       username, password_plain, password_hash, session_room,
		       is_active, is_logged_in, created_at, updated_at
		FROM cbt_students
		WHERE (username = ? OR exam_number = ? OR nisn = ?) AND is_active = 1
	`
	var s models.CbtStudent
	var pHash string
	err := r.db.QueryRowContext(ctx, query, identifier, identifier, identifier).Scan(
		&s.ID, &s.ExamNumber, &s.NISN, &s.Name, &s.ClassName, &s.Major,
		&s.Username, &s.PasswordPlain, &pHash, &s.SessionRoom,
		&s.IsActive, &s.IsLoggedIn, &s.CreatedAt, &s.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	// Compare bcrypt password
	errBcrypt := bcrypt.CompareHashAndPassword([]byte(pHash), []byte(password))
	if errBcrypt != nil {
		// Fallback for plain comparison
		if s.PasswordPlain != password {
			return nil, nil
		}
	}

	return &s, nil
}

func (r *Repository) GetStudentAvailableExams(ctx context.Context, studentID int64) ([]models.CbtExam, error) {
	query := `
		SELECT e.id, e.question_bank_id, b.title, s.name, e.title, COALESCE(e.description, ''),
		       e.start_time, e.end_time, e.duration_minutes, e.randomize_mode, e.scoring_mode,
		       e.token_secret, e.token_enabled, e.is_active,
		       (SELECT COUNT(*) FROM cbt_questions WHERE question_bank_id = e.question_bank_id) AS total_questions,
		       COALESCE(a.status, 'belum_mulai') AS student_status,
		       e.created_at, e.updated_at
		FROM cbt_exams e
		JOIN cbt_question_banks b ON b.id = e.question_bank_id
		JOIN cbt_subjects s ON s.id = b.subject_id
		LEFT JOIN cbt_exam_attendances a ON a.exam_id = e.id AND a.student_id = ?
		WHERE e.is_active = 1
		ORDER BY e.start_time ASC
	`
	rows, err := r.db.QueryContext(ctx, query, studentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.CbtExam
	for rows.Next() {
		var item models.CbtExam
		var status string
		if err := rows.Scan(
			&item.ID, &item.QuestionBankID, &item.BankTitle, &item.SubjectName,
			&item.Title, &item.Description, &item.StartTime, &item.EndTime,
			&item.DurationMinutes, &item.RandomizeMode, &item.ScoringMode,
			&item.TokenSecret, &item.TokenEnabled, &item.IsActive,
			&item.TotalQuestions, &status,
			&item.CreatedAt, &item.UpdatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *Repository) GetStudentExamWorksheet(ctx context.Context, examID, studentID int64) (*models.CbtStudentExamWorksheet, error) {
	exam, err := r.GetCbtExam(ctx, examID)
	if err != nil || exam == nil {
		return nil, fmt.Errorf("ujian tidak ditemukan")
	}

	// Fetch student info & attendance
	studentQuery := `
		SELECT s.id, s.exam_number, s.nisn, s.name, s.class_name, s.major,
		       s.username, s.password_plain, s.session_room, s.is_active, s.is_logged_in,
		       COALESCE(a.status, 'belum_mulai'), a.started_at
		FROM cbt_students s
		LEFT JOIN cbt_exam_attendances a ON a.student_id = s.id AND a.exam_id = ?
		WHERE s.id = ?
	`
	var st models.CbtStudent
	var attStatus string
	var startedAt *time.Time
	err = r.db.QueryRowContext(ctx, studentQuery, examID, studentID).Scan(
		&st.ID, &st.ExamNumber, &st.NISN, &st.Name, &st.ClassName, &st.Major,
		&st.Username, &st.PasswordPlain, &st.SessionRoom, &st.IsActive, &st.IsLoggedIn,
		&attStatus, &startedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("data peserta tidak ditemukan: %w", err)
	}

	// Calculate remaining seconds
	remainingSeconds := exam.DurationMinutes * 60
	if startedAt != nil {
		elapsed := int(time.Since(*startedAt).Seconds())
		remainingSeconds = exam.DurationMinutes*60 - elapsed
		if remainingSeconds < 0 {
			remainingSeconds = 0
		}
	}

	// Fetch questions for this exam's question bank
	qList, err := r.ListCbtQuestionsByBank(ctx, exam.QuestionBankID)
	if err != nil {
		return nil, err
	}

	// Deterministic pseudo-random seed per student per exam
	rnd := rand.New(rand.NewSource(examID*1000 + studentID))

	// Convert questions to sanitized student view (STRIP correct answer & explanation)
	var studentQuestions []models.CbtStudentQuestionView
	for _, q := range qList {
		var opts []models.CbtQuestionOption
		_ = json.Unmarshal(q.Options, &opts)

		// Shuffle options if mode is both or options_only
		if (exam.RandomizeMode == "both" || exam.RandomizeMode == "options_only") && len(opts) > 1 {
			rnd.Shuffle(len(opts), func(i, j int) {
				opts[i], opts[j] = opts[j], opts[i]
			})
		}

		studentQuestions = append(studentQuestions, models.CbtStudentQuestionView{
			ID:           q.ID,
			QuestionType: q.QuestionType,
			QuestionText: q.QuestionText,
			ImageURL:     q.ImageURL,
			AudioURL:     q.AudioURL,
			Points:       q.Points,
			Options:      opts,
			SortOrder:    q.SortOrder,
		})
	}

	// Shuffle questions order if mode is both or questions_only
	if (exam.RandomizeMode == "both" || exam.RandomizeMode == "questions_only") && len(studentQuestions) > 1 {
		rnd.Shuffle(len(studentQuestions), func(i, j int) {
			studentQuestions[i], studentQuestions[j] = studentQuestions[j], studentQuestions[i]
		})
	}

	// Fetch existing student answers
	ansQuery := `
		SELECT id, exam_id, student_id, question_id, answer_json, is_flagged, score, is_graded, updated_at
		FROM cbt_student_answers
		WHERE exam_id = ? AND student_id = ?
	`
	rows, err := r.db.QueryContext(ctx, ansQuery, examID, studentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	existingAnswers := make(map[int64]models.CbtStudentAnswer)
	for rows.Next() {
		var a models.CbtStudentAnswer
		var ansBytes []byte
		if err := rows.Scan(
			&a.ID, &a.ExamID, &a.StudentID, &a.QuestionID, &ansBytes,
			&a.IsFlagged, &a.Score, &a.IsGraded, &a.UpdatedAt,
		); err != nil {
			return nil, err
		}
		a.Answer = ansBytes
		existingAnswers[a.QuestionID] = a
	}

	return &models.CbtStudentExamWorksheet{
		Exam:             *exam,
		Student:          st,
		StartedAt:        startedAt,
		RemainingSeconds: remainingSeconds,
		Status:           attStatus,
		Questions:        studentQuestions,
		ExistingAnswers:  existingAnswers,
	}, nil
}

func (r *Repository) SaveStudentAnswer(ctx context.Context, examID, studentID int64, p models.CbtSaveAnswerPayload) error {
	ansStr := string(p.Answer)
	if strings.TrimSpace(ansStr) == "" {
		ansStr = "[]"
	}

	// 1. Upsert into cbt_student_answers
	query := `
		INSERT INTO cbt_student_answers (exam_id, student_id, question_id, answer_json, is_flagged)
		VALUES (?, ?, ?, ?, ?)
		ON DUPLICATE KEY UPDATE
			answer_json = VALUES(answer_json),
			is_flagged = VALUES(is_flagged),
			updated_at = NOW()
	`
	_, err := r.db.ExecContext(ctx, query, examID, studentID, p.QuestionID, ansStr, p.IsFlagged)
	if err != nil {
		return err
	}

	// 2. Update progress in attendances
	progressQuery := `
		UPDATE cbt_exam_attendances
		SET current_question_index = ?,
		    answered_count = (
		        SELECT COUNT(*) FROM cbt_student_answers
		        WHERE exam_id = ? AND student_id = ? AND answer_json != '[]' AND answer_json != '""'
		    ),
		    flagged_count = (
		        SELECT COUNT(*) FROM cbt_student_answers
		        WHERE exam_id = ? AND student_id = ? AND is_flagged = 1
		    )
		WHERE exam_id = ? AND student_id = ?
	`
	_, _ = r.db.ExecContext(ctx, progressQuery, p.CurrentIndex, examID, studentID, examID, studentID, examID, studentID)
	return nil
}

func (r *Repository) SubmitStudentExam(ctx context.Context, examID, studentID int64) (float64, error) {
	exam, err := r.GetCbtExam(ctx, examID)
	if err != nil || exam == nil {
		return 0, fmt.Errorf("ujian tidak ditemukan")
	}

	questions, err := r.ListCbtQuestionsByBank(ctx, exam.QuestionBankID)
	if err != nil {
		return 0, err
	}

	// Fetch student answers
	ansQuery := `SELECT question_id, answer_json FROM cbt_student_answers WHERE exam_id = ? AND student_id = ?`
	rows, err := r.db.QueryContext(ctx, ansQuery, examID, studentID)
	if err != nil {
		return 0, err
	}
	defer rows.Close()

	studentAnswers := make(map[int64][]string)
	for rows.Next() {
		var qID int64
		var ansBytes []byte
		if err := rows.Scan(&qID, &ansBytes); err == nil {
			var parsed []string
			if err := json.Unmarshal(ansBytes, &parsed); err == nil {
				studentAnswers[qID] = parsed
			} else {
				var singleStr string
				if err := json.Unmarshal(ansBytes, &singleStr); err == nil && singleStr != "" {
					studentAnswers[qID] = []string{singleStr}
				}
			}
		}
	}

	totalQuestions := len(questions)
	if totalQuestions == 0 {
		totalQuestions = 1
	}

	pointsPerQ := 100.0 / float64(totalQuestions)
	totalScore := 0.0

	for _, q := range questions {
		if q.QuestionType == "essay" {
			continue // Essay requires manual grading
		}

		var correctKeys []string
		_ = json.Unmarshal(q.CorrectAnswer, &correctKeys)
		sAns := studentAnswers[q.ID]

		isCorrect := false
		if len(correctKeys) > 0 && len(sAns) > 0 {
			if len(correctKeys) == 1 && len(sAns) == 1 {
				isCorrect = strings.EqualFold(strings.TrimSpace(correctKeys[0]), strings.TrimSpace(sAns[0]))
			} else if len(correctKeys) == len(sAns) {
				// Match all
				matched := 0
				for _, ck := range correctKeys {
					for _, sa := range sAns {
						if strings.EqualFold(strings.TrimSpace(ck), strings.TrimSpace(sa)) {
							matched++
							break
						}
					}
				}
				if matched == len(correctKeys) {
					isCorrect = true
				}
			}
		}

		qScore := 0.0
		if isCorrect {
			if exam.ScoringMode == "auto_even_100" {
				qScore = pointsPerQ
			} else {
				qScore = q.Points
			}
			totalScore += qScore
		}

		// Update answer score
		_, _ = r.db.ExecContext(ctx, `
			UPDATE cbt_student_answers
			SET score = ?, is_graded = 1
			WHERE exam_id = ? AND student_id = ? AND question_id = ?
		`, qScore, examID, studentID, q.ID)
	}

	if exam.ScoringMode == "auto_even_100" && totalScore > 100.0 {
		totalScore = 100.0
	}

	// Update attendance to selesai
	_, err = r.db.ExecContext(ctx, `
		UPDATE cbt_exam_attendances
		SET status = 'selesai',
		    finished_at = NOW(),
		    score = ?
		WHERE exam_id = ? AND student_id = ?
	`, totalScore, examID, studentID)

	return totalScore, err
}


