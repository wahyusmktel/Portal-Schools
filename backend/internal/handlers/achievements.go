package handlers

import (
	"database/sql"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"portal-smktelkom/backend/internal/httpx"
	"portal-smktelkom/backend/internal/models"
)

func (h *Handler) achievements(w http.ResponseWriter, r *http.Request) {
	items, err := h.repo.Achievements(r.Context())
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal memuat prestasi")
		return
	}
	httpx.JSON(w, http.StatusOK, items)
}

func (h *Handler) createAchievement(w http.ResponseWriter, r *http.Request) {
	var payload models.Achievement
	if err := httpx.DecodeJSON(r, &payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "payload tidak valid")
		return
	}
	id, err := h.repo.CreateAchievement(r.Context(), payload)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	httpx.JSON(w, http.StatusCreated, map[string]int64{"id": id})
}

func (h *Handler) updateAchievement(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(chi.URLParam(r, "id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id prestasi tidak valid")
		return
	}
	var payload models.Achievement
	if err := httpx.DecodeJSON(r, &payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "payload tidak valid")
		return
	}
	if err := h.repo.UpdateAchievement(r.Context(), id, payload); errors.Is(err, sql.ErrNoRows) {
		httpx.Error(w, http.StatusNotFound, "prestasi tidak ditemukan")
		return
	} else if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "prestasi berhasil diperbarui"})
}

func (h *Handler) deleteAchievement(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(chi.URLParam(r, "id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id prestasi tidak valid")
		return
	}
	if err := h.repo.DeleteAchievement(r.Context(), id); errors.Is(err, sql.ErrNoRows) {
		httpx.Error(w, http.StatusNotFound, "prestasi tidak ditemukan")
		return
	} else if err != nil {
		httpx.Error(w, http.StatusBadRequest, "gagal menghapus prestasi")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "prestasi berhasil dihapus"})
}
