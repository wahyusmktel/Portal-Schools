package handlers

import (
	"database/sql"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"portal-smktelkom/backend/internal/httpx"
	"portal-smktelkom/backend/internal/models"
)

func (h *Handler) industryPartners(w http.ResponseWriter, r *http.Request) {
	items, err := h.repo.IndustryPartners(r.Context())
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal memuat mitra industri")
		return
	}
	httpx.JSON(w, http.StatusOK, items)
}

func (h *Handler) createIndustryPartner(w http.ResponseWriter, r *http.Request) {
	var payload models.IndustryPartner
	if err := httpx.DecodeJSON(r, &payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "payload tidak valid")
		return
	}
	id, err := h.repo.CreateIndustryPartner(r.Context(), payload)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	httpx.JSON(w, http.StatusCreated, map[string]int64{"id": id})
}

func (h *Handler) updateIndustryPartner(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(chi.URLParam(r, "id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id mitra industri tidak valid")
		return
	}
	var payload models.IndustryPartner
	if err := httpx.DecodeJSON(r, &payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "payload tidak valid")
		return
	}
	if err := h.repo.UpdateIndustryPartner(r.Context(), id, payload); errors.Is(err, sql.ErrNoRows) {
		httpx.Error(w, http.StatusNotFound, "mitra industri tidak ditemukan")
		return
	} else if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "mitra industri berhasil diperbarui"})
}

func (h *Handler) deleteIndustryPartner(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(chi.URLParam(r, "id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id mitra industri tidak valid")
		return
	}
	if err := h.repo.DeleteIndustryPartner(r.Context(), id); errors.Is(err, sql.ErrNoRows) {
		httpx.Error(w, http.StatusNotFound, "mitra industri tidak ditemukan")
		return
	} else if err != nil {
		httpx.Error(w, http.StatusBadRequest, "gagal menghapus mitra industri")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "mitra industri berhasil dihapus"})
}
