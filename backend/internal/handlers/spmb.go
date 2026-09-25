package handlers

import (
	"net/http"

	"github.com/go-chi/chi/v5"

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

func (h *Handler) adminDeleteSpmbRegistration(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(chi.URLParam(r, "id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id tidak valid")
		return
	}

	if err := h.repo.DeleteSpmbRegistration(r.Context(), id); err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "data pendaftaran berhasil dihapus"})
}

func (h *Handler) adminUpdateSpmbRegistration(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(chi.URLParam(r, "id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id tidak valid")
		return
	}

	var payload models.SpmbRegistration
	if err := httpx.DecodeJSON(r, &payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "payload tidak valid")
		return
	}
	payload.ID = id

	item, err := h.repo.UpdateSpmbRegistration(r.Context(), payload)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	httpx.JSON(w, http.StatusOK, item)
}

func (h *Handler) createPaymentConfirmation(w http.ResponseWriter, r *http.Request) {
	var payload models.SpmbPaymentConfirmation
	if err := httpx.DecodeJSON(r, &payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "payload tidak valid")
		return
	}

	item, err := h.repo.CreateSpmbPaymentConfirmation(r.Context(), payload)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	httpx.JSON(w, http.StatusCreated, item)
}

func (h *Handler) adminPaymentConfirmations(w http.ResponseWriter, r *http.Request) {
	items, err := h.repo.SpmbPaymentConfirmations(r.Context())
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal memuat data konfirmasi pembayaran")
		return
	}
	httpx.JSON(w, http.StatusOK, items)
}

func (h *Handler) adminUpdatePaymentConfirmationStatus(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(chi.URLParam(r, "id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id tidak valid")
		return
	}

	var payload struct {
		Status string `json:"status"`
		Notes  string `json:"notes"`
	}
	if err := httpx.DecodeJSON(r, &payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "payload tidak valid")
		return
	}

	if err := h.repo.UpdateSpmbPaymentConfirmationStatus(r.Context(), id, payload.Status, payload.Notes); err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "status pembayaran berhasil diperbarui"})
}

func (h *Handler) createSupplementaryDocument(w http.ResponseWriter, r *http.Request) {
	var payload models.SpmbSupplementaryDocument
	if err := httpx.DecodeJSON(r, &payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "payload tidak valid")
		return
	}

	item, err := h.repo.CreateSpmbSupplementaryDocument(r.Context(), payload)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	httpx.JSON(w, http.StatusCreated, item)
}

func (h *Handler) adminSupplementaryDocuments(w http.ResponseWriter, r *http.Request) {
	items, err := h.repo.SpmbSupplementaryDocuments(r.Context())
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal memuat data berkas pendukung")
		return
	}
	httpx.JSON(w, http.StatusOK, items)
}
