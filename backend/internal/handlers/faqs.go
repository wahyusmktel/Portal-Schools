package handlers

import (
	"database/sql"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"portal-smktelkom/backend/internal/httpx"
	"portal-smktelkom/backend/internal/models"
)

func (h *Handler) faqs(w http.ResponseWriter, r *http.Request) {
	items, err := h.repo.FAQs(r.Context())
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal memuat faq")
		return
	}
	httpx.JSON(w, http.StatusOK, items)
}

func (h *Handler) createFAQ(w http.ResponseWriter, r *http.Request) {
	var payload models.FAQ
	if err := httpx.DecodeJSON(r, &payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "payload tidak valid")
		return
	}
	id, err := h.repo.CreateFAQ(r.Context(), payload)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	httpx.JSON(w, http.StatusCreated, map[string]int64{"id": id})
}

func (h *Handler) updateFAQ(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(chi.URLParam(r, "id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id faq tidak valid")
		return
	}
	var payload models.FAQ
	if err := httpx.DecodeJSON(r, &payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "payload tidak valid")
		return
	}
	if err := h.repo.UpdateFAQ(r.Context(), id, payload); errors.Is(err, sql.ErrNoRows) {
		httpx.Error(w, http.StatusNotFound, "faq tidak ditemukan")
		return
	} else if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "faq berhasil diperbarui"})
}

func (h *Handler) deleteFAQ(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(chi.URLParam(r, "id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id faq tidak valid")
		return
	}
	if err := h.repo.DeleteFAQ(r.Context(), id); errors.Is(err, sql.ErrNoRows) {
		httpx.Error(w, http.StatusNotFound, "faq tidak ditemukan")
		return
	} else if err != nil {
		httpx.Error(w, http.StatusBadRequest, "gagal menghapus faq")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "faq berhasil dihapus"})
}
