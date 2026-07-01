package handlers

import (
	"encoding/json"
	"net/http"
	"portal-smktelkom/backend/internal/httpx"
	"portal-smktelkom/backend/internal/models"
	"strconv"
	"github.com/go-chi/chi/v5"
	"github.com/dchest/captcha"
)

func (h *Handler) createComment(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	article, err := h.repo.ArticleBySlug(r.Context(), slug)
	if err != nil {
		httpx.Error(w, http.StatusNotFound, "artikel tidak ditemukan")
		return
	}

	var payload struct {
		Name         string `json:"name"`
		Email        string `json:"email"`
		Content      string `json:"content"`
		ParentID     *int64 `json:"parentId,omitempty"`
		CaptchaId    string `json:"captchaId"`
		CaptchaValue string `json:"captchaValue"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "payload tidak valid")
		return
	}

	if payload.Name == "" || payload.Content == "" {
		httpx.Error(w, http.StatusBadRequest, "nama dan komentar wajib diisi")
		return
	}

	if !captcha.VerifyString(payload.CaptchaId, payload.CaptchaValue) {
		httpx.Error(w, http.StatusBadRequest, "kode CAPTCHA tidak valid")
		return
	}

	_, err = h.repo.CreateComment(r.Context(), article.ID, payload.ParentID, payload.Name, payload.Email, payload.Content)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal mengirim komentar")
		return
	}

	httpx.JSON(w, http.StatusCreated, map[string]string{"message": "Komentar berhasil dikirim dan menunggu moderasi."})
}

func (h *Handler) getComments(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	article, err := h.repo.ArticleBySlug(r.Context(), slug)
	if err != nil {
		httpx.Error(w, http.StatusNotFound, "artikel tidak ditemukan")
		return
	}

	comments, err := h.repo.CommentsByArticleID(r.Context(), article.ID, true)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal memuat komentar")
		return
	}
	if comments == nil {
		comments = []models.Comment{}
	}

	httpx.JSON(w, http.StatusOK, comments)
}

func (h *Handler) adminComments(w http.ResponseWriter, r *http.Request) {
	comments, err := h.repo.AllComments(r.Context())
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal memuat komentar")
		return
	}
	if comments == nil {
		comments = []models.Comment{}
	}
	httpx.JSON(w, http.StatusOK, comments)
}

func (h *Handler) updateCommentStatus(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id tidak valid")
		return
	}

	var payload struct {
		Status models.CommentStatus `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "payload tidak valid")
		return
	}

	if payload.Status != models.CommentStatusApproved && payload.Status != models.CommentStatusRejected && payload.Status != models.CommentStatusPending {
		httpx.Error(w, http.StatusBadRequest, "status tidak valid")
		return
	}

	if err := h.repo.UpdateCommentStatus(r.Context(), id, payload.Status); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal update status komentar")
		return
	}

	httpx.JSON(w, http.StatusOK, map[string]string{"message": "Status komentar berhasil diupdate."})
}
