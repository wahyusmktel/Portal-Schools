package models

import (
	"encoding/json"
	"time"
)

type CbtSubject struct {
	ID          int64     `json:"id"`
	Code        string    `json:"code"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type CbtQuestionBank struct {
	ID             int64     `json:"id"`
	SubjectID      int64     `json:"subject_id"`
	SubjectCode    string    `json:"subject_code,omitempty"`
	SubjectName    string    `json:"subject_name,omitempty"`
	Title          string    `json:"title"`
	GradeLevel     string    `json:"grade_level"`
	Major          string    `json:"major"`
	AuthorID       *int64    `json:"author_id,omitempty"`
	AuthorName     string    `json:"author_name,omitempty"`
	TotalQuestions int       `json:"total_questions"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type CbtQuestionOption struct {
	ID       string `json:"id"`        // "A", "B", "C", "D", "E"
	Label    string `json:"label"`     // "A", "B", ...
	Text     string `json:"text"`      // Option text (can include KaTeX math / Arabic)
	ImageURL string `json:"image_url"` // Optional image for this option
}

type CbtQuestion struct {
	ID                int64           `json:"id"`
	QuestionBankID    int64           `json:"question_bank_id"`
	QuestionType      string          `json:"question_type"` // multiple_choice, complex_multiple_choice, true_false, matching, essay
	QuestionText      string          `json:"question_text"`
	ImageURL          string          `json:"image_url"`
	AudioURL          string          `json:"audio_url"`
	Points            float64         `json:"points"`
	Options           json.RawMessage `json:"options"`            // raw json array of CbtQuestionOption
	CorrectAnswer     json.RawMessage `json:"correct_answer"`     // raw json: ["A"] or ["A","C"] or true or matching pairs
	Explanation       string          `json:"explanation"`
	SortOrder         int             `json:"sort_order"`
	CreatedAt         time.Time       `json:"created_at"`
	UpdatedAt         time.Time       `json:"updated_at"`
}

type CreateCbtSubjectPayload struct {
	Code        string `json:"code"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

type CreateCbtQuestionBankPayload struct {
	SubjectID  int64  `json:"subject_id"`
	Title      string `json:"title"`
	GradeLevel string `json:"grade_level"`
	Major      string `json:"major"`
}

type UpsertCbtQuestionPayload struct {
	QuestionBankID int64           `json:"question_bank_id"`
	QuestionType   string          `json:"question_type"`
	QuestionText   string          `json:"question_text"`
	ImageURL       string          `json:"image_url"`
	AudioURL       string          `json:"audio_url"`
	Points         float64         `json:"points"`
	Options        json.RawMessage `json:"options"`
	CorrectAnswer  json.RawMessage `json:"correct_answer"`
	Explanation    string          `json:"explanation"`
	SortOrder      int             `json:"sort_order"`
}

// --- MODULE 2 MODELS: EXAMS & PROCTORING ---

type CbtExam struct {
	ID                int64     `json:"id"`
	QuestionBankID    int64     `json:"question_bank_id"`
	BankTitle         string    `json:"bank_title,omitempty"`
	SubjectName       string    `json:"subject_name,omitempty"`
	Title             string    `json:"title"`
	Description       string    `json:"description"`
	StartTime         time.Time `json:"start_time"`
	EndTime           time.Time `json:"end_time"`
	DurationMinutes   int       `json:"duration_minutes"`
	RandomizeMode     string    `json:"randomize_mode"` // none, questions_only, options_only, both
	ScoringMode       string    `json:"scoring_mode"`   // auto_even_100, custom_points
	TokenSecret       string    `json:"-"`
	TokenEnabled      bool      `json:"token_enabled"`
	IsActive          bool      `json:"is_active"`
	TotalQuestions    int       `json:"total_questions,omitempty"`
	TotalParticipants int       `json:"total_participants,omitempty"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

type CreateCbtExamPayload struct {
	QuestionBankID  int64  `json:"question_bank_id"`
	Title           string `json:"title"`
	Description     string `json:"description"`
	StartTime       string `json:"start_time"` // e.g. "2026-10-01T08:00"
	EndTime         string `json:"end_time"`   // e.g. "2026-10-01T12:00"
	DurationMinutes int    `json:"duration_minutes"`
	RandomizeMode   string `json:"randomize_mode"`
	ScoringMode     string `json:"scoring_mode"`
	TokenEnabled    bool   `json:"token_enabled"`
	IsActive        bool   `json:"is_active"`
}

type CbtStudent struct {
	ID            int64     `json:"id"`
	ExamNumber    string    `json:"exam_number"`
	NISN          string    `json:"nisn"`
	Name          string    `json:"name"`
	ClassName     string    `json:"class_name"`
	Major         string    `json:"major"`
	Username      string    `json:"username"`
	PasswordPlain string    `json:"password_plain"`
	SessionRoom   string    `json:"session_room"`
	IsActive      bool      `json:"is_active"`
	IsLoggedIn    bool      `json:"is_logged_in"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type CreateCbtStudentPayload struct {
	ExamNumber  string `json:"exam_number"`
	NISN        string `json:"nisn"`
	Name        string `json:"name"`
	ClassName   string `json:"class_name"`
	Major       string `json:"major"`
	SessionRoom string `json:"session_room"`
	Password    string `json:"password"`
}

type GenerateStudentsBatchPayload struct {
	ClassName   string `json:"class_name"`
	Major       string `json:"major"`
	SessionRoom string `json:"session_room"`
	Count       int    `json:"count"`
	Prefix      string `json:"prefix"`
}

type CbtExamProctor struct {
	ID        int64     `json:"id"`
	ExamID    int64     `json:"exam_id"`
	UserID    int64     `json:"user_id"`
	UserName  string    `json:"user_name,omitempty"`
	UserEmail string    `json:"user_email,omitempty"`
	RoomName  string    `json:"room_name"`
	CreatedAt time.Time `json:"created_at"`
}

type CbtExamAttendance struct {
	ID                   int64      `json:"id"`
	ExamID               int64      `json:"exam_id"`
	StudentID            int64      `json:"student_id"`
	StudentName          string     `json:"student_name,omitempty"`
	ExamNumber           string     `json:"exam_number,omitempty"`
	ClassName            string     `json:"class_name,omitempty"`
	SessionRoom          string     `json:"session_room,omitempty"`
	Status               string     `json:"status"` // belum_mulai, sedang_mengerjakan, selesai, tidak_hadir
	CurrentQuestionIndex int        `json:"current_question_index"`
	AnsweredCount        int        `json:"answered_count"`
	FlaggedCount         int        `json:"flagged_count"`
	StartedAt            *time.Time `json:"started_at"`
	FinishedAt           *time.Time `json:"finished_at"`
	Score                float64    `json:"score"`
	IPAddress            string     `json:"ip_address"`
	UserAgent            string     `json:"user_agent"`
	CreatedAt            time.Time  `json:"created_at"`
	UpdatedAt            time.Time  `json:"updated_at"`
}

type CbtOfficialReport struct {
	ID                 int64     `json:"id"`
	ExamID             int64     `json:"exam_id"`
	ExamTitle          string    `json:"exam_title,omitempty"`
	SubjectName        string    `json:"subject_name,omitempty"`
	ProctorID          int64     `json:"proctor_id"`
	ProctorName        string    `json:"proctor_name,omitempty"`
	RoomName           string    `json:"room_name"`
	ReportDate         string    `json:"report_date"`
	StartTime          string    `json:"start_time"`
	EndTime            string    `json:"end_time"`
	TotalCandidates    int       `json:"total_candidates"`
	PresentCount       int       `json:"present_count"`
	AbsentCount        int       `json:"absent_count"`
	AbsentStudentsText string    `json:"absent_students_text"`
	Notes              string    `json:"notes"`
	IsFinalized        bool      `json:"is_finalized"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

type CbtLiveToken struct {
	ExamID           int64  `json:"exam_id"`
	Token            string `json:"token"`
	SecondsRemaining int    `json:"seconds_remaining"`
}

