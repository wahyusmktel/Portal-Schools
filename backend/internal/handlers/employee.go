package handlers

import (
	"database/sql"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"portal-smktelkom/backend/internal/httpx"
	"portal-smktelkom/backend/internal/models"
)

func (h *Handler) employees(w http.ResponseWriter, r *http.Request) {
	items, err := h.repo.Employees(r.Context())
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal memuat karyawan")
		return
	}
	httpx.JSON(w, http.StatusOK, items)
}

func (h *Handler) createEmployee(w http.ResponseWriter, r *http.Request) {
	var payload models.Employee
	if err := httpx.DecodeJSON(r, &payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "payload tidak valid")
		return
	}

	id, err := h.repo.CreateEmployee(r.Context(), payload)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	httpx.JSON(w, http.StatusCreated, map[string]int64{"id": id})
}

func (h *Handler) updateEmployee(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(chi.URLParam(r, "id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id karyawan tidak valid")
		return
	}
	var payload models.Employee
	if err := httpx.DecodeJSON(r, &payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "payload tidak valid")
		return
	}

	if err := h.repo.UpdateEmployee(r.Context(), id, payload); errors.Is(err, sql.ErrNoRows) {
		httpx.Error(w, http.StatusNotFound, "karyawan tidak ditemukan")
		return
	} else if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "karyawan berhasil diperbarui"})
}

func (h *Handler) deleteEmployee(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(chi.URLParam(r, "id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id karyawan tidak valid")
		return
	}

	if err := h.repo.DeleteEmployee(r.Context(), id); errors.Is(err, sql.ErrNoRows) {
		httpx.Error(w, http.StatusNotFound, "karyawan tidak ditemukan")
		return
	} else if err != nil {
		httpx.Error(w, http.StatusBadRequest, "gagal menghapus karyawan")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "karyawan berhasil dihapus"})
}
