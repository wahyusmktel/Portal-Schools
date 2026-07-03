package handlers

import (
	"net/http"

	"portal-smktelkom/backend/internal/httpx"
	"portal-smktelkom/backend/internal/models"
)

func (h *Handler) createSpmbRegistration(w http.ResponseWriter, r *http.Request) {
	var payload models.SpmbRegistration
	if err := httpx.DecodeJSON(r, &payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "payload tidak valid")
		return
	}

	profile, err := h.repo.SchoolProfile(r.Context())
	if err == nil && profile.SpmbAcademicYear != "" {
		payload.AcademicYear = profile.SpmbAcademicYear
	}

	item, err := h.repo.CreateSpmbRegistration(r.Context(), payload)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	httpx.JSON(w, http.StatusCreated, item)
}

func (h *Handler) adminSpmbRegistrations(w http.ResponseWriter, r *http.Request) {
	items, err := h.repo.SpmbRegistrations(r.Context())
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal memuat data pendaftaran SPMB")
		return
	}
	httpx.JSON(w, http.StatusOK, items)
}
