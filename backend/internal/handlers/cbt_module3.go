package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"portal-smktelkom/backend/internal/auth"
	"portal-smktelkom/backend/internal/cbttoken"
	"portal-smktelkom/backend/internal/httpx"
	"portal-smktelkom/backend/internal/models"
)

const studentClaimsContextKey contextKey = "student_claims"

func withStudentClaims(r *http.Request, claims *auth.StudentClaims) *http.Request {
	ctx := context.WithValue(r.Context(), studentClaimsContextKey, claims)
	return r.WithContext(ctx)
}

func studentClaimsFromRequest(r *http.Request) (*auth.StudentClaims, bool) {
	claims, ok := r.Context().Value(studentClaimsContextKey).(*auth.StudentClaims)
	return claims, ok
}

func (h *Handler) requireStudentAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		tokenValue := ""
		if authHeader := r.Header.Get("Authorization"); strings.HasPrefix(authHeader, "Bearer ") {
			tokenValue = strings.TrimPrefix(authHeader, "Bearer ")
		} else if cookie, err := r.Cookie("cbt_student_token"); err == nil {
			tokenValue = cookie.Value
		}

		if tokenValue == "" {
			httpx.Error(w, http.StatusUnauthorized, "silakan login peserta terlebih dahulu")
			return
		}

		claims, err := h.tokens.VerifyStudent(tokenValue)
		if err != nil {
			httpx.Error(w, http.StatusUnauthorized, "sesi login siswa telah berakhir")
			return
		}

		next(w, withStudentClaims(r, claims))
	}
}

// --- STUDENT AUTH ---

func (h *Handler) cbtStudentLogin(w http.ResponseWriter, r *http.Request) {
	var payload models.CbtStudentLoginPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "format data login tidak valid")
		return
	}

	payload.Username = strings.TrimSpace(payload.Username)
	payload.Password = strings.TrimSpace(payload.Password)
	if payload.Username == "" || payload.Password == "" {
		httpx.Error(w, http.StatusBadRequest, "nomor peserta/username dan kata sandi wajib diisi")
		return
	}

	student, err := h.repo.AuthenticateCbtStudent(r.Context(), payload.Username, payload.Password)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "kesalahan sistem saat autentikasi")
		return
	}
	if student == nil {
		httpx.Error(w, http.StatusUnauthorized, "nomor peserta atau kata sandi salah")
		return
	}

	tokenStr, expiresAt, err := h.tokens.IssueStudent(*student)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal membuat token sesi")
		return
	}

	// Set httpOnly cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "cbt_student_token",
		Value:    tokenStr,
		Path:     "/",
		Expires:  expiresAt,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   false,
	})

	httpx.JSON(w, http.StatusOK, models.CbtStudentAuthResponse{
		Token:   tokenStr,
		Student: *student,
	})
}

func (h *Handler) cbtStudentMe(w http.ResponseWriter, r *http.Request) {
	claims, ok := studentClaimsFromRequest(r)
	if !ok || claims == nil {
		httpx.Error(w, http.StatusUnauthorized, "tidak terautentikasi")
		return
	}

	student, err := h.repo.GetCbtStudent(r.Context(), claims.StudentID)
	if err != nil || student == nil {
		httpx.Error(w, http.StatusNotFound, "data siswa tidak ditemukan")
		return
	}

	httpx.JSON(w, http.StatusOK, student)
}

func (h *Handler) cbtStudentLogout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:     "cbt_student_token",
		Value:    "",
		Path:     "/",
		Expires:  time.Unix(0, 0),
		HttpOnly: true,
	})
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "berhasil keluar dari sesi siswa"})
}

// --- STUDENT EXAMS ---

func (h *Handler) cbtStudentAvailableExams(w http.ResponseWriter, r *http.Request) {
	claims, ok := studentClaimsFromRequest(r)
	if !ok || claims == nil {
		httpx.Error(w, http.StatusUnauthorized, "tidak terautentikasi")
		return
	}

	exams, err := h.repo.GetStudentAvailableExams(r.Context(), claims.StudentID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	if exams == nil {
		exams = []models.CbtExam{}
	}
	httpx.JSON(w, http.StatusOK, exams)
}

func (h *Handler) cbtStudentStartExam(w http.ResponseWriter, r *http.Request) {
	claims, ok := studentClaimsFromRequest(r)
	if !ok || claims == nil {
		httpx.Error(w, http.StatusUnauthorized, "tidak terautentikasi")
		return
	}

	examIDStr := chi.URLParam(r, "id")
	examID, err := strconv.ParseInt(examIDStr, 10, 64)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id ujian tidak valid")
		return
	}

	var req struct {
		Token string `json:"token"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)

	exam, err := h.repo.GetCbtExam(r.Context(), examID)
	if err != nil || exam == nil {
		httpx.Error(w, http.StatusNotFound, "ujian tidak ditemukan")
		return
	}

	// Validate Token if enabled
	if exam.TokenEnabled {
		if !cbttoken.ValidateToken(examID, exam.TokenSecret, req.Token) {
			httpx.Error(w, http.StatusBadRequest, "Token ujian tidak valid atau sudah kedaluwarsa. Silakan tanyakan token terbaru kepada pengawas.")
			return
		}
	}

	ip := r.RemoteAddr
	ua := r.UserAgent()

	// Record attendance start
	if err := h.repo.RecordExamStart(r.Context(), examID, claims.StudentID, ip, ua); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal mencatat mulai ujian: "+err.Error())
		return
	}

	httpx.JSON(w, http.StatusOK, map[string]interface{}{
		"message": "ujian berhasil dimulai",
		"exam_id": examID,
	})
}

func (h *Handler) cbtStudentGetWorksheet(w http.ResponseWriter, r *http.Request) {
	claims, ok := studentClaimsFromRequest(r)
	if !ok || claims == nil {
		httpx.Error(w, http.StatusUnauthorized, "tidak terautentikasi")
		return
	}

	examIDStr := chi.URLParam(r, "id")
	examID, err := strconv.ParseInt(examIDStr, 10, 64)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id ujian tidak valid")
		return
	}

	worksheet, err := h.repo.GetStudentExamWorksheet(r.Context(), examID, claims.StudentID)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	httpx.JSON(w, http.StatusOK, worksheet)
}

func (h *Handler) cbtStudentSaveAnswer(w http.ResponseWriter, r *http.Request) {
	claims, ok := studentClaimsFromRequest(r)
	if !ok || claims == nil {
		httpx.Error(w, http.StatusUnauthorized, "tidak terautentikasi")
		return
	}

	examIDStr := chi.URLParam(r, "id")
	examID, err := strconv.ParseInt(examIDStr, 10, 64)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id ujian tidak valid")
		return
	}

	var payload models.CbtSaveAnswerPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "format jawaban tidak valid")
		return
	}

	if err := h.repo.SaveStudentAnswer(r.Context(), examID, claims.StudentID, payload); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal menyimpan jawaban: "+err.Error())
		return
	}

	httpx.JSON(w, http.StatusOK, map[string]string{"message": "jawaban tersimpan"})
}

func (h *Handler) cbtStudentSubmitExam(w http.ResponseWriter, r *http.Request) {
	claims, ok := studentClaimsFromRequest(r)
	if !ok || claims == nil {
		httpx.Error(w, http.StatusUnauthorized, "tidak terautentikasi")
		return
	}

	examIDStr := chi.URLParam(r, "id")
	examID, err := strconv.ParseInt(examIDStr, 10, 64)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id ujian tidak valid")
		return
	}

	score, err := h.repo.SubmitStudentExam(r.Context(), examID, claims.StudentID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal menyelesaikan ujian: "+err.Error())
		return
	}

	httpx.JSON(w, http.StatusOK, map[string]interface{}{
		"message": "ujian berhasil diselesaikan dan dinilai",
		"score":   score,
		"status":  "selesai",
	})
}
