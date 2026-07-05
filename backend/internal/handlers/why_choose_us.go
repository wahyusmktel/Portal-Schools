package handlers

import (
	"database/sql"
	"errors"
	"net/http"

	"portal-smktelkom/backend/internal/httpx"
	"portal-smktelkom/backend/internal/models"

	"github.com/go-chi/chi/v5"
)

func (h *Handler) whyChooseUs(w http.ResponseWriter, r *http.Request) {
	items, err := h.repo.WhyChooseUs(r.Context(), false)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "Gagal mengambil data alasan memilih sekolah")
		return
	}
	httpx.JSON(w, http.StatusOK, items)
}

func (h *Handler) adminWhyChooseUs(w http.ResponseWriter, r *http.Request) {
	items, err := h.repo.WhyChooseUs(r.Context(), true)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "Gagal mengambil data alasan memilih sekolah")
		return
	}
	httpx.JSON(w, http.StatusOK, items)
}

func (h *Handler) createWhyChooseUsItem(w http.ResponseWriter, r *http.Request) {
	var payload models.WhyChooseUsItem
	if err := httpx.DecodeJSON(r, &payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "Payload tidak valid")
		return
	}

	id, err := h.repo.CreateWhyChooseUsItem(r.Context(), payload)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	httpx.JSON(w, http.StatusCreated, map[string]int64{"id": id})
}

func (h *Handler) updateWhyChooseUsItem(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(chi.URLParam(r, "id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "ID tidak valid")
		return
	}

	var payload models.WhyChooseUsItem
	if err := httpx.DecodeJSON(r, &payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "Payload tidak valid")
		return
	}

	if err := h.repo.UpdateWhyChooseUsItem(r.Context(), id, payload); errors.Is(err, sql.ErrNoRows) {
		httpx.Error(w, http.StatusNotFound, "Alasan memilih sekolah tidak ditemukan")
		return
	} else if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "Alasan memilih sekolah berhasil diperbarui"})
}

func (h *Handler) deleteWhyChooseUsItem(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(chi.URLParam(r, "id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "ID tidak valid")
		return
	}

	if err := h.repo.DeleteWhyChooseUsItem(r.Context(), id); errors.Is(err, sql.ErrNoRows) {
		httpx.Error(w, http.StatusNotFound, "Alasan memilih sekolah tidak ditemukan")
		return
	} else if err != nil {
		httpx.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "Alasan memilih sekolah berhasil dihapus"})
}
