package handlers

import (
	"database/sql"
	"errors"
	"net/http"

	"portal-smktelkom/backend/internal/httpx"
	"portal-smktelkom/backend/internal/models"

	"github.com/go-chi/chi/v5"
)

func (h *Handler) facilities(w http.ResponseWriter, r *http.Request) {
	items, err := h.repo.Facilities(r.Context())
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "Gagal mengambil data fasilitas")
		return
	}
	httpx.JSON(w, http.StatusOK, items)
}

func (h *Handler) createFacility(w http.ResponseWriter, r *http.Request) {
	var payload models.Facility
	if err := httpx.DecodeJSON(r, &payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "Payload tidak valid")
		return
	}
	id, err := h.repo.CreateFacility(r.Context(), payload)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	httpx.JSON(w, http.StatusCreated, map[string]int64{"id": id})
}

func (h *Handler) updateFacility(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(chi.URLParam(r, "id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "ID tidak valid")
		return
	}
	var payload models.Facility
	if err := httpx.DecodeJSON(r, &payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "Payload tidak valid")
		return
	}
	if err := h.repo.UpdateFacility(r.Context(), id, payload); errors.Is(err, sql.ErrNoRows) {
		httpx.Error(w, http.StatusNotFound, "Fasilitas tidak ditemukan")
		return
	} else if err != nil {
		httpx.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "Fasilitas berhasil diperbarui"})
}

func (h *Handler) deleteFacility(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(chi.URLParam(r, "id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "ID tidak valid")
		return
	}
	if err := h.repo.DeleteFacility(r.Context(), id); errors.Is(err, sql.ErrNoRows) {
		httpx.Error(w, http.StatusNotFound, "Fasilitas tidak ditemukan")
		return
	} else if err != nil {
		httpx.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "Fasilitas berhasil dihapus"})
}
