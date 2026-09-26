package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"math/big"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"golang.org/x/crypto/bcrypt"
	"portal-smktelkom/backend/internal/cbttoken"
	"portal-smktelkom/backend/internal/httpx"
	"portal-smktelkom/backend/internal/models"
)

// --- EXAMS ---

func (h *Handler) listCbtExams(w http.ResponseWriter, r *http.Request) {
	exams, err := h.repo.ListCbtExams(r.Context())
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	if exams == nil {
		exams = []models.CbtExam{}
	}
	httpx.JSON(w, http.StatusOK, exams)
}

func (h *Handler) getCbtExam(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id ujian tidak valid")
		return
	}

	exam, err := h.repo.GetCbtExam(r.Context(), id)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	if exam == nil {
		httpx.Error(w, http.StatusNotFound, "jadwal ujian tidak ditemukan")
		return
	}

	httpx.JSON(w, http.StatusOK, exam)
}

func (h *Handler) createCbtExam(w http.ResponseWriter, r *http.Request) {
	var payload models.CreateCbtExamPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "format data tidak valid")
		return
	}

	payload.Title = strings.TrimSpace(payload.Title)
	if payload.Title == "" || payload.QuestionBankID <= 0 {
		httpx.Error(w, http.StatusBadRequest, "nama ujian dan bank soal wajib dipilih")
		return
	}
	if payload.DurationMinutes <= 0 {
		payload.DurationMinutes = 90
	}
	if payload.RandomizeMode == "" {
		payload.RandomizeMode = "both"
	}
	if payload.ScoringMode == "" {
		payload.ScoringMode = "auto_even_100"
	}

	// Generate a secure secret for rotating TOTP token
	randBytes := make([]byte, 16)
	_, _ = rand.Read(randBytes)
	secret := hex.EncodeToString(randBytes)

	id, err := h.repo.CreateCbtExam(r.Context(), payload, secret)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "gagal membuat jadwal ujian: "+err.Error())
		return
	}

	httpx.JSON(w, http.StatusCreated, map[string]interface{}{
		"id":      id,
		"message": "jadwal ujian berhasil dibuat",
	})
}

func (h *Handler) updateCbtExam(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id ujian tidak valid")
		return
	}

	var payload models.CreateCbtExamPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "format data tidak valid")
		return
	}
	payload.Title = strings.TrimSpace(payload.Title)
	if payload.Title == "" || payload.QuestionBankID <= 0 {
		httpx.Error(w, http.StatusBadRequest, "nama ujian dan bank soal wajib dipilih")
		return
	}

	if err := h.repo.UpdateCbtExam(r.Context(), id, payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	httpx.JSON(w, http.StatusOK, map[string]string{"message": "jadwal ujian berhasil diperbarui"})
}

func (h *Handler) deleteCbtExam(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id ujian tidak valid")
		return
	}

	if err := h.repo.DeleteCbtExam(r.Context(), id); err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	httpx.JSON(w, http.StatusOK, map[string]string{"message": "jadwal ujian berhasil dihapus"})
}

// --- DYNAMIC ROTATING TOKEN (1 MINUTE TOTP) ---

func (h *Handler) getExamLiveToken(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id ujian tidak valid")
		return
	}

	exam, err := h.repo.GetCbtExam(r.Context(), id)
	if err != nil || exam == nil {
		httpx.Error(w, http.StatusNotFound, "ujian tidak ditemukan")
		return
	}

	if !exam.TokenEnabled {
		httpx.JSON(w, http.StatusOK, models.CbtLiveToken{
			ExamID:           id,
			Token:            "BEBAS",
			SecondsRemaining: 60,
		})
		return
	}

	token, secRemaining := cbttoken.GenerateCurrentToken(id, exam.TokenSecret)
	httpx.JSON(w, http.StatusOK, models.CbtLiveToken{
		ExamID:           id,
		Token:            token,
		SecondsRemaining: secRemaining,
	})
}

func (h *Handler) validateExamToken(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id ujian tidak valid")
		return
	}

	var req struct {
		Token string `json:"token"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.Error(w, http.StatusBadRequest, "token tidak valid")
		return
	}

	exam, err := h.repo.GetCbtExam(r.Context(), id)
	if err != nil || exam == nil {
		httpx.Error(w, http.StatusNotFound, "ujian tidak ditemukan")
		return
	}

	if !exam.TokenEnabled {
		httpx.JSON(w, http.StatusOK, map[string]interface{}{"valid": true})
		return
	}

	isValid := cbttoken.ValidateToken(id, exam.TokenSecret, req.Token)
	if !isValid {
		httpx.Error(w, http.StatusBadRequest, "Token ujian salah atau telah kedaluwarsa. Silakan periksa token terbaru di layar pengawas.")
		return
	}

	httpx.JSON(w, http.StatusOK, map[string]interface{}{
		"valid":   true,
		"message": "Token valid, selamat mengerjakan ujian!",
	})
}

// --- STUDENTS ---

func (h *Handler) listCbtStudents(w http.ResponseWriter, r *http.Request) {
	className := r.URL.Query().Get("class_name")
	room := r.URL.Query().Get("session_room")
	search := r.URL.Query().Get("search")

	students, err := h.repo.ListCbtStudents(r.Context(), className, room, search)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	if students == nil {
		students = []models.CbtStudent{}
	}
	httpx.JSON(w, http.StatusOK, students)
}

func (h *Handler) createCbtStudent(w http.ResponseWriter, r *http.Request) {
	var payload models.CreateCbtStudentPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "format data tidak valid")
		return
	}

	payload.ExamNumber = strings.TrimSpace(payload.ExamNumber)
	payload.Name = strings.TrimSpace(payload.Name)
	if payload.ExamNumber == "" || payload.Name == "" {
		httpx.Error(w, http.StatusBadRequest, "nomor peserta dan nama siswa wajib diisi")
		return
	}
	if payload.Password == "" {
		payload.Password = generateRandomPassword(6)
	}

	passHash, err := bcrypt.GenerateFromPassword([]byte(payload.Password), bcrypt.DefaultCost)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal mengenkripsi kata sandi")
		return
	}

	id, err := h.repo.CreateCbtStudent(r.Context(), payload, string(passHash))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "gagal mendaftarkan siswa: "+err.Error())
		return
	}

	httpx.JSON(w, http.StatusCreated, map[string]interface{}{
		"id":       id,
		"message":  "siswa berhasil didaftarkan",
		"password": payload.Password,
	})
}

func (h *Handler) batchGenerateCbtStudents(w http.ResponseWriter, r *http.Request) {
	var payload models.GenerateStudentsBatchPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "format data tidak valid")
		return
	}

	if payload.Count <= 0 || payload.Count > 200 {
		httpx.Error(w, http.StatusBadRequest, "jumlah siswa harus antara 1 sampai 200")
		return
	}
	if payload.ClassName == "" {
		payload.ClassName = "Umum"
	}
	if payload.SessionRoom == "" {
		payload.SessionRoom = "Ruang 1"
	}
	if payload.Prefix == "" {
		payload.Prefix = "UJN-" + strings.ToUpper(strings.ReplaceAll(payload.ClassName, " ", "-"))
	}

	var students []models.CreateCbtStudentPayload
	var hashes []string

	for i := 1; i <= payload.Count; i++ {
		examNum := fmt.Sprintf("%s-%03d", payload.Prefix, i)
		pass := generateRandomPassword(6)
		pHash, _ := bcrypt.GenerateFromPassword([]byte(pass), bcrypt.DefaultCost)

		students = append(students, models.CreateCbtStudentPayload{
			ExamNumber:  examNum,
			NISN:        fmt.Sprintf("00%d%06d", time.Now().Year()%100, i),
			Name:        fmt.Sprintf("Siswa %s #%02d", payload.ClassName, i),
			ClassName:   payload.ClassName,
			Major:       payload.Major,
			SessionRoom: payload.SessionRoom,
			Password:    pass,
		})
		hashes = append(hashes, string(pHash))
	}

	inserted, err := h.repo.BatchCreateCbtStudents(r.Context(), students, hashes)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal generate akun siswa: "+err.Error())
		return
	}

	httpx.JSON(w, http.StatusOK, map[string]interface{}{
		"message": fmt.Sprintf("berhasil generate %d akun peserta ujian", inserted),
		"count":   inserted,
	})
}

func (h *Handler) deleteCbtStudent(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id siswa tidak valid")
		return
	}

	if err := h.repo.DeleteCbtStudent(r.Context(), id); err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	httpx.JSON(w, http.StatusOK, map[string]string{"message": "siswa berhasil dihapus"})
}

func (h *Handler) assignClassToExam(w http.ResponseWriter, r *http.Request) {
	examIDStr := chi.URLParam(r, "id")
	examID, err := strconv.ParseInt(examIDStr, 10, 64)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id ujian tidak valid")
		return
	}

	var req struct {
		ClassName string `json:"class_name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.ClassName == "" {
		httpx.Error(w, http.StatusBadRequest, "kelas wajib dipilih")
		return
	}

	count, err := h.repo.AssignClassToExam(r.Context(), examID, req.ClassName)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal mendaftarkan kelas ke ujian: "+err.Error())
		return
	}

	httpx.JSON(w, http.StatusOK, map[string]interface{}{
		"message": fmt.Sprintf("berhasil mendaftarkan %d siswa dari kelas %s ke ujian ini", count, req.ClassName),
		"count":   count,
	})
}

// --- PROCTORS & ATTENDANCE ---

func (h *Handler) listExamProctors(w http.ResponseWriter, r *http.Request) {
	examIDStr := chi.URLParam(r, "id")
	examID, err := strconv.ParseInt(examIDStr, 10, 64)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id ujian tidak valid")
		return
	}

	proctors, err := h.repo.ListExamProctors(r.Context(), examID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	if proctors == nil {
		proctors = []models.CbtExamProctor{}
	}
	httpx.JSON(w, http.StatusOK, proctors)
}

func (h *Handler) assignExamProctor(w http.ResponseWriter, r *http.Request) {
	examIDStr := chi.URLParam(r, "id")
	examID, err := strconv.ParseInt(examIDStr, 10, 64)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id ujian tidak valid")
		return
	}

	var req struct {
		UserID   int64  `json:"user_id"`
		RoomName string `json:"room_name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.UserID <= 0 {
		httpx.Error(w, http.StatusBadRequest, "pengawas dan ruangan wajib dipilih")
		return
	}
	if req.RoomName == "" {
		req.RoomName = "Ruang 1"
	}

	if err := h.repo.AssignExamProctor(r.Context(), examID, req.UserID, req.RoomName); err != nil {
		httpx.Error(w, http.StatusBadRequest, "gagal menugaskan pengawas: "+err.Error())
		return
	}

	httpx.JSON(w, http.StatusOK, map[string]string{"message": "pengawas berhasil ditugaskan"})
}

func (h *Handler) removeExamProctor(w http.ResponseWriter, r *http.Request) {
	proctorIDStr := chi.URLParam(r, "proctorId")
	proctorID, err := strconv.ParseInt(proctorIDStr, 10, 64)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id pengawas tidak valid")
		return
	}

	if err := h.repo.RemoveExamProctor(r.Context(), proctorID); err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	httpx.JSON(w, http.StatusOK, map[string]string{"message": "pengawas berhasil dicopot"})
}

func (h *Handler) listExamAttendances(w http.ResponseWriter, r *http.Request) {
	examIDStr := chi.URLParam(r, "id")
	examID, err := strconv.ParseInt(examIDStr, 10, 64)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id ujian tidak valid")
		return
	}

	room := r.URL.Query().Get("room")
	attendances, err := h.repo.ListExamAttendances(r.Context(), examID, room)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	if attendances == nil {
		attendances = []models.CbtExamAttendance{}
	}
	httpx.JSON(w, http.StatusOK, attendances)
}

// recordStudentStartExam (Absensi otomatis: klik mulai ujian langsung berstatus HADIR / sedang_mengerjakan)
func (h *Handler) recordStudentStartExam(w http.ResponseWriter, r *http.Request) {
	examIDStr := chi.URLParam(r, "id")
	examID, err := strconv.ParseInt(examIDStr, 10, 64)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id ujian tidak valid")
		return
	}

	var req struct {
		StudentID int64 `json:"student_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.StudentID <= 0 {
		httpx.Error(w, http.StatusBadRequest, "id siswa tidak valid")
		return
	}

	ip := r.RemoteAddr
	ua := r.UserAgent()

	if err := h.repo.RecordExamStart(r.Context(), examID, req.StudentID, ip, ua); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal mencatat absensi mulai: "+err.Error())
		return
	}

	httpx.JSON(w, http.StatusOK, map[string]string{
		"message": "absensi kehadiran berhasil dicatat (sedang mengerjakan)",
	})
}

// --- OFFICIAL REPORT (BERITA ACARA) ---

func (h *Handler) getExamOfficialReport(w http.ResponseWriter, r *http.Request) {
	examIDStr := chi.URLParam(r, "id")
	examID, err := strconv.ParseInt(examIDStr, 10, 64)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id ujian tidak valid")
		return
	}

	room := r.URL.Query().Get("room")
	if room == "" {
		room = "Ruang 1"
	}

	report, err := h.repo.GetExamOfficialReport(r.Context(), examID, room)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	// If not found yet, calculate live counts from attendances
	if report == nil {
		attendances, _ := h.repo.ListExamAttendances(r.Context(), examID, room)
		exam, _ := h.repo.GetCbtExam(r.Context(), examID)

		present := 0
		absent := 0
		var absentNames []string
		for _, a := range attendances {
			if a.Status == "sedang_mengerjakan" || a.Status == "selesai" {
				present++
			} else {
				absent++
				absentNames = append(absentNames, fmt.Sprintf("%s (%s)", a.StudentName, a.ExamNumber))
			}
		}

		title := ""
		subj := ""
		if exam != nil {
			title = exam.Title
			subj = exam.SubjectName
		}

		proctorName := ""
		var proctorID int64
		proctors, _ := h.repo.ListExamProctors(r.Context(), examID)
		for _, p := range proctors {
			if p.RoomName == room {
				proctorID = p.UserID
				proctorName = p.UserName
				break
			}
		}

		report = &models.CbtOfficialReport{
			ExamID:             examID,
			ExamTitle:          title,
			SubjectName:        subj,
			ProctorID:          proctorID,
			ProctorName:        proctorName,
			RoomName:           room,
			ReportDate:         time.Now().Format("2006-01-02"),
			StartTime:          "08:00",
			EndTime:            "10:00",
			TotalCandidates:    len(attendances),
			PresentCount:       present,
			AbsentCount:        absent,
			AbsentStudentsText: strings.Join(absentNames, ", "),
			Notes:              "Ujian berjalan dengan tertib dan lancar tanpa kendala teknis berarti.",
			IsFinalized:        false,
		}
	}

	httpx.JSON(w, http.StatusOK, report)
}

func (h *Handler) saveExamOfficialReport(w http.ResponseWriter, r *http.Request) {
	var payload models.CbtOfficialReport
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "format data berita acara tidak valid")
		return
	}

	if payload.ExamID <= 0 || payload.RoomName == "" {
		httpx.Error(w, http.StatusBadRequest, "id ujian dan nama ruang wajib disertakan")
		return
	}

	id, err := h.repo.SaveExamOfficialReport(r.Context(), payload)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal menyimpan berita acara: "+err.Error())
		return
	}

	httpx.JSON(w, http.StatusOK, map[string]interface{}{
		"id":      id,
		"message": "berita acara ujian berhasil disimpan dan dicatat",
	})
}

// helper
func generateRandomPassword(length int) string {
	const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
	res := make([]byte, length)
	for i := range res {
		n, _ := rand.Int(rand.Reader, big.NewInt(int64(len(chars))))
		res[i] = chars[n.Int64()]
	}
	return string(res)
}
