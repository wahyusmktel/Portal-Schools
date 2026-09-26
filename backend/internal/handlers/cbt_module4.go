package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"portal-smktelkom/backend/internal/httpx"
	"portal-smktelkom/backend/internal/models"
)

// --- MODULE 4 HANDLERS: ITEM ANALYSIS, ESSAY GRADING & EXAM RESULTS ---

func (h *Handler) getCbtExamResults(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	examID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id ujian tidak valid")
		return
	}

	results, err := h.repo.GetExamResults(r.Context(), examID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	if results == nil {
		results = []models.CbtStudentExamResult{}
	}

	httpx.JSON(w, http.StatusOK, results)
}

func (h *Handler) getCbtItemAnalysis(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	examID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id ujian tidak valid")
		return
	}

	analysis, err := h.repo.GetExamItemAnalysis(r.Context(), examID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	if analysis == nil {
		analysis = []models.CbtItemAnalysis{}
	}

	httpx.JSON(w, http.StatusOK, analysis)
}

func (h *Handler) getCbtExamEssaySubmissions(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	examID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id ujian tidak valid")
		return
	}

	essays, err := h.repo.GetExamEssaySubmissions(r.Context(), examID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	if essays == nil {
		essays = []models.CbtEssaySubmission{}
	}

	httpx.JSON(w, http.StatusOK, essays)
}

func (h *Handler) gradeCbtStudentEssay(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	examID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id ujian tidak valid")
		return
	}

	var payload models.GradeEssayPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "format data tidak valid")
		return
	}

	if payload.StudentID <= 0 || payload.QuestionID <= 0 {
		httpx.Error(w, http.StatusBadRequest, "student_id dan question_id wajib diisi")
		return
	}

	if err := h.repo.GradeStudentEssay(r.Context(), examID, payload); err != nil {
		httpx.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	httpx.JSON(w, http.StatusOK, map[string]interface{}{
		"message": "Nilai esai berhasil disimpan dan total nilai peserta telah diperbarui",
	})
}
