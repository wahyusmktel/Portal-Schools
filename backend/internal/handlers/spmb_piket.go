package handlers

import (
	"net/http"

	"github.com/go-chi/chi/v5"

	"portal-smktelkom/backend/internal/httpx"
	"portal-smktelkom/backend/internal/models"
)

func (h *Handler) getSpmbPiketGroups(w http.ResponseWriter, r *http.Request) {
	ay := r.URL.Query().Get("academic_year")
	items, err := h.repo.AllSpmbPiketGroups(r.Context(), ay)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal memuat data jadwal piket SPMB")
		return
	}
	if items == nil {
		items = []models.SpmbPiketGroup{}
	}
	httpx.JSON(w, http.StatusOK, items)
}

func (h *Handler) getSpmbPiketGroup(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(chi.URLParam(r, "id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id tidak valid")
		return
	}

	item, err := h.repo.SpmbPiketGroupByID(r.Context(), id)
	if err != nil {
		httpx.Error(w, http.StatusNotFound, "kelompok piket tidak ditemukan")
		return
	}
	httpx.JSON(w, http.StatusOK, item)
}

func (h *Handler) createSpmbPiketGroup(w http.ResponseWriter, r *http.Request) {
	var payload models.SpmbPiketGroup
	if err := httpx.DecodeJSON(r, &payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "payload tidak valid")
		return
	}

	if payload.GroupName == "" {
		httpx.Error(w, http.StatusBadRequest, "nama kelompok wajib diisi")
		return
	}
	if payload.AcademicYear == "" {
		payload.AcademicYear = "2027/2028"
	}
	if payload.DayName == "" {
		payload.DayName = "SABTU"
	}
	if payload.TimeRange == "" {
		payload.TimeRange = "07.30 - 12.00"
	}

	if err := h.repo.CreateSpmbPiketGroup(r.Context(), &payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	httpx.JSON(w, http.StatusCreated, payload)
}

func (h *Handler) updateSpmbPiketGroup(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(chi.URLParam(r, "id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id tidak valid")
		return
	}

	var payload models.SpmbPiketGroup
	if err := httpx.DecodeJSON(r, &payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "payload tidak valid")
		return
	}
	payload.ID = id

	if payload.GroupName == "" {
		httpx.Error(w, http.StatusBadRequest, "nama kelompok wajib diisi")
		return
	}

	if err := h.repo.UpdateSpmbPiketGroup(r.Context(), &payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	httpx.JSON(w, http.StatusOK, payload)
}

func (h *Handler) deleteSpmbPiketGroup(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(chi.URLParam(r, "id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id tidak valid")
		return
	}

	if err := h.repo.DeleteSpmbPiketGroup(r.Context(), id); err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "kelompok piket berhasil dihapus"})
}

func (h *Handler) seedSpmbPiket(w http.ResponseWriter, r *http.Request) {
	if err := h.repo.SeedSpmbPiket(r.Context()); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal melakukan seeding jadwal piket SPMB")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "seeding jadwal piket SPMB berhasil"})
}
