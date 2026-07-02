package handlers

import (
	"database/sql"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"portal-smktelkom/backend/internal/httpx"
	"portal-smktelkom/backend/internal/models"
)

func (h *Handler) alumni(w http.ResponseWriter, r *http.Request) {
	items, err := h.repo.Alumni(r.Context())
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal memuat alumni")
		return
	}
	httpx.JSON(w, http.StatusOK, items)
}

func (h *Handler) alumniStats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.repo.GetAlumniStats(r.Context())
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal memuat statistik alumni")
		return
	}
	httpx.JSON(w, http.StatusOK, stats)
}

func (h *Handler) createAlumni(w http.ResponseWriter, r *http.Request) {
	var payload models.Alumni
	if err := httpx.DecodeJSON(r, &payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "payload tidak valid")
		return
	}
	id, err := h.repo.CreateAlumni(r.Context(), payload)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	httpx.JSON(w, http.StatusCreated, map[string]int64{"id": id})
}

func (h *Handler) updateAlumni(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(chi.URLParam(r, "id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id alumni tidak valid")
		return
	}
	var payload models.Alumni
	if err := httpx.DecodeJSON(r, &payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "payload tidak valid")
		return
	}
	if err := h.repo.UpdateAlumni(r.Context(), id, payload); errors.Is(err, sql.ErrNoRows) {
		httpx.Error(w, http.StatusNotFound, "alumni tidak ditemukan")
		return
	} else if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "alumni berhasil diperbarui"})
}

func (h *Handler) deleteAlumni(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(chi.URLParam(r, "id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id alumni tidak valid")
		return
	}
	if err := h.repo.DeleteAlumni(r.Context(), id); errors.Is(err, sql.ErrNoRows) {
		httpx.Error(w, http.StatusNotFound, "alumni tidak ditemukan")
		return
	} else if err != nil {
		httpx.Error(w, http.StatusBadRequest, "gagal menghapus alumni")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "alumni berhasil dihapus"})
}
