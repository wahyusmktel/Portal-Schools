export interface CbtSubject {
  id: number;
  code: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface CbtQuestionBank {
  id: number;
  subject_id: number;
  subject_code?: string;
  subject_name?: string;
  title: string;
  grade_level: string;
  major: string;
  author_id?: number;
  author_name?: string;
  total_questions: number;
  created_at: string;
  updated_at: string;
}

export interface CbtQuestionOption {
  id: string;        // "A", "B", "C", "D", "E"
  label: string;     // "A", "B", ...
  text: string;      // Option text (can have KaTeX or Arabic)
  image_url?: string;
}

export type CbtQuestionType =
  | "multiple_choice"
  | "complex_multiple_choice"
  | "true_false"
  | "matching"
  | "essay";

export interface CbtQuestion {
  id: number;
  question_bank_id: number;
  question_type: CbtQuestionType;
  question_text: string;
  image_url?: string;
  audio_url?: string;
  points: number;
  options: CbtQuestionOption[];
  correct_answer: string[] | any;
  explanation?: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

// --- MODULE 2 TYPES ---

export type RandomizeMode = "none" | "questions_only" | "options_only" | "both";
export type ScoringMode = "auto_even_100" | "custom_points";

export interface CbtExam {
  id: number;
  question_bank_id: number;
  bank_title?: string;
  subject_name?: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  randomize_mode: RandomizeMode;
  scoring_mode: ScoringMode;
  token_enabled: boolean;
  is_active: boolean;
  total_questions?: number;
  total_participants?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CbtStudent {
  id: number;
  exam_number: string;
  nisn: string;
  name: string;
  class_name: string;
  major: string;
  username: string;
  password_plain: string;
  session_room: string;
  is_active: boolean;
  is_logged_in: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CbtExamProctor {
  id: number;
  exam_id: number;
  user_id: number;
  user_name?: string;
  user_email?: string;
  room_name: string;
  created_at?: string;
}

export type AttendanceStatus = "belum_mulai" | "sedang_mengerjakan" | "selesai" | "tidak_hadir";

export interface CbtExamAttendance {
  id: number;
  exam_id: number;
  student_id: number;
  student_name?: string;
  exam_number?: string;
  class_name?: string;
  session_room?: string;
  status: AttendanceStatus;
  current_question_index: number;
  answered_count: number;
  flagged_count: number;
  started_at?: string;
  finished_at?: string;
  score: number;
  ip_address?: string;
  user_agent?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CbtOfficialReport {
  id?: number;
  exam_id: number;
  exam_title?: string;
  subject_name?: string;
  proctor_id: number;
  proctor_name?: string;
  room_name: string;
  report_date: string;
  start_time: string;
  end_time: string;
  total_candidates: number;
  present_count: number;
  absent_count: number;
  absent_students_text: string;
  notes: string;
  is_finalized: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CbtLiveToken {
  exam_id: number;
  token: string;
  seconds_remaining: number;
}

export interface CbtStudentAnswer {
  id?: number;
  exam_id: number;
  student_id: number;
  question_id: number;
  answer: string[] | any;
  is_flagged: boolean;
  score?: number;
  is_graded?: boolean;
  updated_at?: string;
}

export interface CbtStudentQuestionView {
  id: number;
  question_type: CbtQuestionType;
  question_text: string;
  image_url?: string;
  audio_url?: string;
  points: number;
  options: CbtQuestionOption[];
  sort_order: number;
}

export interface CbtStudentExamWorksheet {
  exam: CbtExam;
  Exam?: CbtExam;
  student: CbtStudent;
  started_at?: string;
  remaining_seconds: number;
  status: string;
  questions: CbtStudentQuestionView[];
  existing_answers: Record<number, CbtStudentAnswer>;
}

