package handlers

import (
	"database/sql"
	"errors"
	"net/http"

	"portal-smktelkom/backend/internal/httpx"
	"portal-smktelkom/backend/internal/models"

	"github.com/go-chi/chi/v5"
)

func (h *Handler) schoolUVPItems(w http.ResponseWriter, r *http.Request) {
	items, err := h.repo.SchoolUVPItems(r.Context(), false)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "Gagal mengambil data UVP sekolah")
		return
	}
	httpx.JSON(w, http.StatusOK, items)
}

func (h *Handler) adminSchoolUVPItems(w http.ResponseWriter, r *http.Request) {
	items, err := h.repo.SchoolUVPItems(r.Context(), true)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "Gagal mengambil data UVP sekolah")
		return
	}
	httpx.JSON(w, http.StatusOK, items)
}

func (h *Handler) createSchoolUVPItem(w http.ResponseWriter, r *http.Request) {
	var payload models.SchoolUVPItem
	if err := httpx.DecodeJSON(r, &payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "Payload tidak valid")
		return
	}

	id, err := h.repo.CreateSchoolUVPItem(r.Context(), payload)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	httpx.JSON(w, http.StatusCreated, map[string]int64{"id": id})
}

func (h *Handler) updateSchoolUVPItem(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(chi.URLParam(r, "id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "ID tidak valid")
		return
	}

	var payload models.SchoolUVPItem
	if err := httpx.DecodeJSON(r, &payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "Payload tidak valid")
		return
	}

	if err := h.repo.UpdateSchoolUVPItem(r.Context(), id, payload); errors.Is(err, sql.ErrNoRows) {
		httpx.Error(w, http.StatusNotFound, "UVP sekolah tidak ditemukan")
		return
	} else if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "UVP sekolah berhasil diperbarui"})
}

func (h *Handler) deleteSchoolUVPItem(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(chi.URLParam(r, "id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "ID tidak valid")
		return
	}

	if err := h.repo.DeleteSchoolUVPItem(r.Context(), id); errors.Is(err, sql.ErrNoRows) {
		httpx.Error(w, http.StatusNotFound, "UVP sekolah tidak ditemukan")
		return
	} else if err != nil {
		httpx.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "UVP sekolah berhasil dihapus"})
}
