package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"portal-smktelkom/backend/internal/cbtparser"
	"portal-smktelkom/backend/internal/httpx"
	"portal-smktelkom/backend/internal/models"
)

// --- SUBJECTS ---

func (h *Handler) listCbtSubjects(w http.ResponseWriter, r *http.Request) {
	subjects, err := h.repo.ListCbtSubjects(r.Context())
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	if subjects == nil {
		subjects = []models.CbtSubject{}
	}
	httpx.JSON(w, http.StatusOK, subjects)
}

func (h *Handler) createCbtSubject(w http.ResponseWriter, r *http.Request) {
	var payload models.CreateCbtSubjectPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "format data tidak valid")
		return
	}
	payload.Code = strings.TrimSpace(payload.Code)
	payload.Name = strings.TrimSpace(payload.Name)
	if payload.Code == "" || payload.Name == "" {
		httpx.Error(w, http.StatusBadRequest, "kode dan nama mata pelajaran wajib diisi")
		return
	}

	id, err := h.repo.CreateCbtSubject(r.Context(), payload)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "gagal menyimpan mata pelajaran: "+err.Error())
		return
	}

	httpx.JSON(w, http.StatusCreated, map[string]interface{}{
		"id":      id,
		"message": "mata pelajaran berhasil ditambahkan",
	})
}

func (h *Handler) updateCbtSubject(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id tidak valid")
		return
	}

	var payload models.CreateCbtSubjectPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "format data tidak valid")
		return
	}
	payload.Code = strings.TrimSpace(payload.Code)
	payload.Name = strings.TrimSpace(payload.Name)
	if payload.Code == "" || payload.Name == "" {
		httpx.Error(w, http.StatusBadRequest, "kode dan nama mata pelajaran wajib diisi")
		return
	}

	if err := h.repo.UpdateCbtSubject(r.Context(), id, payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	httpx.JSON(w, http.StatusOK, map[string]string{"message": "mata pelajaran berhasil diperbarui"})
}

func (h *Handler) deleteCbtSubject(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id tidak valid")
		return
	}

	if err := h.repo.DeleteCbtSubject(r.Context(), id); err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	httpx.JSON(w, http.StatusOK, map[string]string{"message": "mata pelajaran berhasil dihapus"})
}

// --- QUESTION BANKS ---

func (h *Handler) listCbtQuestionBanks(w http.ResponseWriter, r *http.Request) {
	var subjectID int64
	if s := r.URL.Query().Get("subject_id"); s != "" {
		subjectID, _ = strconv.ParseInt(s, 10, 64)
	}

	banks, err := h.repo.ListCbtQuestionBanks(r.Context(), subjectID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	if banks == nil {
		banks = []models.CbtQuestionBank{}
	}
	httpx.JSON(w, http.StatusOK, banks)
}

func (h *Handler) getCbtQuestionBank(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id tidak valid")
		return
	}

	bank, err := h.repo.GetCbtQuestionBank(r.Context(), id)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	if bank == nil {
		httpx.Error(w, http.StatusNotFound, "bank soal tidak ditemukan")
		return
	}

	httpx.JSON(w, http.StatusOK, bank)
}

func (h *Handler) createCbtQuestionBank(w http.ResponseWriter, r *http.Request) {
	var payload models.CreateCbtQuestionBankPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "format data tidak valid")
		return
	}
	payload.Title = strings.TrimSpace(payload.Title)
	if payload.Title == "" || payload.SubjectID <= 0 {
		httpx.Error(w, http.StatusBadRequest, "judul bank soal dan mata pelajaran wajib dipilih")
		return
	}
	if payload.GradeLevel == "" {
		payload.GradeLevel = "Semua"
	}
	if payload.Major == "" {
		payload.Major = "Semua"
	}

	var authorID *int64
	if claims, ok := claimsFromRequest(r); ok && claims != nil && claims.UserID > 0 {
		uid := claims.UserID
		authorID = &uid
	}

	id, err := h.repo.CreateCbtQuestionBank(r.Context(), authorID, payload)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "gagal membuat bank soal: "+err.Error())
		return
	}

	httpx.JSON(w, http.StatusCreated, map[string]interface{}{
		"id":      id,
		"message": "bank soal berhasil dibuat",
	})
}

func (h *Handler) updateCbtQuestionBank(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id tidak valid")
		return
	}

	var payload models.CreateCbtQuestionBankPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "format data tidak valid")
		return
	}
	payload.Title = strings.TrimSpace(payload.Title)
	if payload.Title == "" || payload.SubjectID <= 0 {
		httpx.Error(w, http.StatusBadRequest, "judul bank soal dan mata pelajaran wajib dipilih")
		return
	}

	if err := h.repo.UpdateCbtQuestionBank(r.Context(), id, payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	httpx.JSON(w, http.StatusOK, map[string]string{"message": "bank soal berhasil diperbarui"})
}

func (h *Handler) deleteCbtQuestionBank(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id tidak valid")
		return
	}

	if err := h.repo.DeleteCbtQuestionBank(r.Context(), id); err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	httpx.JSON(w, http.StatusOK, map[string]string{"message": "bank soal berhasil dihapus"})
}

// --- QUESTIONS ---

func (h *Handler) listCbtQuestions(w http.ResponseWriter, r *http.Request) {
	bankIDStr := chi.URLParam(r, "bankId")
	bankID, err := strconv.ParseInt(bankIDStr, 10, 64)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id bank soal tidak valid")
		return
	}

	questions, err := h.repo.ListCbtQuestionsByBank(r.Context(), bankID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	if questions == nil {
		questions = []models.CbtQuestion{}
	}
	httpx.JSON(w, http.StatusOK, questions)
}

func (h *Handler) createCbtQuestion(w http.ResponseWriter, r *http.Request) {
	bankIDStr := chi.URLParam(r, "bankId")
	bankID, err := strconv.ParseInt(bankIDStr, 10, 64)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id bank soal tidak valid")
		return
	}

	var payload models.UpsertCbtQuestionPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "format data tidak valid")
		return
	}
	payload.QuestionBankID = bankID
	if strings.TrimSpace(payload.QuestionText) == "" {
		httpx.Error(w, http.StatusBadRequest, "teks soal tidak boleh kosong")
		return
	}
	if payload.Points <= 0 {
		payload.Points = 1.00
	}
	if payload.QuestionType == "" {
		payload.QuestionType = "multiple_choice"
	}
	if len(payload.Options) == 0 {
		payload.Options = []byte("[]")
	}
	if len(payload.CorrectAnswer) == 0 {
		payload.CorrectAnswer = []byte("[]")
	}

	qID, err := h.repo.CreateCbtQuestion(r.Context(), payload)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "gagal menyimpan butir soal: "+err.Error())
		return
	}

	httpx.JSON(w, http.StatusCreated, map[string]interface{}{
		"id":      qID,
		"message": "soal berhasil ditambahkan",
	})
}

func (h *Handler) updateCbtQuestion(w http.ResponseWriter, r *http.Request) {
	qIDStr := chi.URLParam(r, "id")
	qID, err := strconv.ParseInt(qIDStr, 10, 64)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id soal tidak valid")
		return
	}

	var payload models.UpsertCbtQuestionPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "format data tidak valid")
		return
	}
	if strings.TrimSpace(payload.QuestionText) == "" {
		httpx.Error(w, http.StatusBadRequest, "teks soal tidak boleh kosong")
		return
	}
	if payload.Points <= 0 {
		payload.Points = 1.00
	}
	if len(payload.Options) == 0 {
		payload.Options = []byte("[]")
	}
	if len(payload.CorrectAnswer) == 0 {
		payload.CorrectAnswer = []byte("[]")
	}

	if err := h.repo.UpdateCbtQuestion(r.Context(), qID, payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	httpx.JSON(w, http.StatusOK, map[string]string{"message": "soal berhasil diperbarui"})
}

func (h *Handler) deleteCbtQuestion(w http.ResponseWriter, r *http.Request) {
	qIDStr := chi.URLParam(r, "id")
	qID, err := strconv.ParseInt(qIDStr, 10, 64)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id soal tidak valid")
		return
	}

	if err := h.repo.DeleteCbtQuestion(r.Context(), qID); err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	httpx.JSON(w, http.StatusOK, map[string]string{"message": "soal berhasil dihapus"})
}

// --- IMPORT DOCX & TEMPLATE ---

func (h *Handler) importCbtDocx(w http.ResponseWriter, r *http.Request) {
	bankIDStr := chi.URLParam(r, "bankId")
	bankID, err := strconv.ParseInt(bankIDStr, 10, 64)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id bank soal tidak valid")
		return
	}

	const maxUploadSize = 30 << 20 // 30MB max for docx with embedded images
	if err := r.ParseMultipartForm(maxUploadSize); err != nil {
		httpx.Error(w, http.StatusBadRequest, "file terlalu besar atau format form tidak valid")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "file .docx wajib diunggah")
		return
	}
	defer file.Close()

	if !strings.HasSuffix(strings.ToLower(header.Filename), ".docx") {
		httpx.Error(w, http.StatusBadRequest, "hanya mendukung file format Microsoft Word (.docx)")
		return
	}

	// We need an io.ReaderAt and size
	tempFile, err := os.CreateTemp("", "cbt-upload-*.docx")
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal membuat file temporary")
		return
	}
	defer os.Remove(tempFile.Name())
	defer tempFile.Close()

	size, err := io.Copy(tempFile, file)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal menyalin file docx")
		return
	}

	parsedQuestions, err := cbtparser.ParseDocx(tempFile, size, "uploads")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "gagal membaca isi file docx: "+err.Error())
		return
	}

	if len(parsedQuestions) == 0 {
		httpx.Error(w, http.StatusBadRequest, "tidak ada soal yang berhasil dikenali dari file docx. Pastikan mengikuti format penomoran dan tag ANS: A")
		return
	}

	inserted, err := h.repo.BatchInsertCbtQuestions(r.Context(), bankID, parsedQuestions)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal menyimpan butir soal ke database: "+err.Error())
		return
	}

	httpx.JSON(w, http.StatusOK, map[string]interface{}{
		"message":        fmt.Sprintf("berhasil mengimpor %d butir soal ke bank soal", inserted),
		"inserted_count": inserted,
	})
}

func (h *Handler) downloadCbtDocxTemplate(w http.ResponseWriter, r *http.Request) {
	docxBytes, err := cbtparser.GenerateSampleDocx()
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal membuat template docx: "+err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
	w.Header().Set("Content-Disposition", `attachment; filename="Template_Bank_Soal_CBT.docx"`)
	w.Header().Set("Content-Length", strconv.Itoa(len(docxBytes)))
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(docxBytes)
}

// --- MEDIA UPLOADS (AUDIO & IMAGE) ---

func (h *Handler) uploadCbtAudio(w http.ResponseWriter, r *http.Request) {
	const maxAudioSize = 25 << 20 // 25MB
	if err := r.ParseMultipartForm(maxAudioSize); err != nil {
		httpx.Error(w, http.StatusBadRequest, "ukuran audio maksimal 25MB")
		return
	}

	file, header, err := r.FormFile("audio")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "file audio wajib diunggah")
		return
	}
	defer file.Close()

	ext := strings.ToLower(filepath.Ext(header.Filename))
	if ext != ".mp3" && ext != ".wav" && ext != ".ogg" && ext != ".m4a" {
		httpx.Error(w, http.StatusBadRequest, "format audio harus mp3, wav, ogg, atau m4a")
		return
	}

	cbtAudioDir := filepath.Join("uploads", "cbt", "audio")
	if err := os.MkdirAll(cbtAudioDir, 0755); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal membuat folder audio")
		return
	}

	fname := fmt.Sprintf("audio-%d%s", time.Now().UnixNano(), ext)
	outPath := filepath.Join(cbtAudioDir, fname)
	outFile, err := os.Create(outPath)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal menyimpan file audio")
		return
	}
	defer outFile.Close()

	if _, err := io.Copy(outFile, file); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal menulis file audio")
		return
	}

	httpx.JSON(w, http.StatusOK, map[string]string{
		"url": "/uploads/cbt/audio/" + fname,
	})
}

func (h *Handler) uploadCbtImage(w http.ResponseWriter, r *http.Request) {
	const maxImgSize = 10 << 20 // 10MB
	if err := r.ParseMultipartForm(maxImgSize); err != nil {
		httpx.Error(w, http.StatusBadRequest, "ukuran gambar maksimal 10MB")
		return
	}

	file, header, err := r.FormFile("image")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "file gambar wajib diunggah")
		return
	}
	defer file.Close()

	ext := strings.ToLower(filepath.Ext(header.Filename))
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".webp" && ext != ".gif" {
		httpx.Error(w, http.StatusBadRequest, "format gambar harus jpg, jpeg, png, webp, atau gif")
		return
	}

	cbtImgDir := filepath.Join("uploads", "cbt", "images")
	if err := os.MkdirAll(cbtImgDir, 0755); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal membuat folder gambar")
		return
	}

	fname := fmt.Sprintf("img-%d%s", time.Now().UnixNano(), ext)
	outPath := filepath.Join(cbtImgDir, fname)
	outFile, err := os.Create(outPath)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal menyimpan file gambar")
		return
	}
	defer outFile.Close()

	if _, err := io.Copy(outFile, file); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal menulis file gambar")
		return
	}

	httpx.JSON(w, http.StatusOK, map[string]string{
		"url": "/uploads/cbt/images/" + fname,
	})
}
