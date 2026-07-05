package handlers

import (
	"database/sql"
	"errors"
	"net/http"

	"portal-smktelkom/backend/internal/httpx"
	"portal-smktelkom/backend/internal/models"

	"github.com/go-chi/chi/v5"
)

func (h *Handler) teachingModules(w http.ResponseWriter, r *http.Request) {
	items, err := h.repo.TeachingModules(r.Context(), false)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "Gagal mengambil data modul ajar")
		return
	}
	httpx.JSON(w, http.StatusOK, items)
}

func (h *Handler) adminTeachingModules(w http.ResponseWriter, r *http.Request) {
	items, err := h.repo.TeachingModules(r.Context(), true)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "Gagal mengambil data modul ajar")
		return
	}
	httpx.JSON(w, http.StatusOK, items)
}

func (h *Handler) teachingModuleBySlug(w http.ResponseWriter, r *http.Request) {
	item, err := h.repo.TeachingModuleBySlug(r.Context(), chi.URLParam(r, "slug"), false)
	if errors.Is(err, sql.ErrNoRows) {
		httpx.Error(w, http.StatusNotFound, "Modul ajar tidak ditemukan")
		return
	}
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "Gagal mengambil data modul ajar")
		return
	}
	httpx.JSON(w, http.StatusOK, item)
}

func (h *Handler) createTeachingModule(w http.ResponseWriter, r *http.Request) {
	var payload models.TeachingModule
	if err := httpx.DecodeJSON(r, &payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "Payload tidak valid")
		return
	}
	id, err := h.repo.CreateTeachingModule(r.Context(), payload)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	httpx.JSON(w, http.StatusCreated, map[string]int64{"id": id})
}

func (h *Handler) updateTeachingModule(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(chi.URLParam(r, "id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "ID tidak valid")
		return
	}

	var payload models.TeachingModule
	if err := httpx.DecodeJSON(r, &payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "Payload tidak valid")
		return
	}

	if err := h.repo.UpdateTeachingModule(r.Context(), id, payload); errors.Is(err, sql.ErrNoRows) {
		httpx.Error(w, http.StatusNotFound, "Modul ajar tidak ditemukan")
		return
	} else if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "Modul ajar berhasil diperbarui"})
}

func (h *Handler) deleteTeachingModule(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(chi.URLParam(r, "id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "ID tidak valid")
		return
	}

	if err := h.repo.DeleteTeachingModule(r.Context(), id); errors.Is(err, sql.ErrNoRows) {
		httpx.Error(w, http.StatusNotFound, "Modul ajar tidak ditemukan")
		return
	} else if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "Gagal menghapus modul ajar")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "Modul ajar berhasil dihapus"})
}

func (h *Handler) incrementTeachingModuleView(w http.ResponseWriter, r *http.Request) {
	if err := h.repo.IncrementTeachingModuleView(r.Context(), chi.URLParam(r, "slug")); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "Gagal mencatat statistik baca")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "Statistik baca tercatat"})
}

func (h *Handler) incrementTeachingModuleDownload(w http.ResponseWriter, r *http.Request) {
	if err := h.repo.IncrementTeachingModuleDownload(r.Context(), chi.URLParam(r, "slug")); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "Gagal mencatat statistik unduh")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "Statistik unduh tercatat"})
}
