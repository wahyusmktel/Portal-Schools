package handlers

import (
	"database/sql"
	"errors"
	"net/http"

	"portal-smktelkom/backend/internal/httpx"
	"portal-smktelkom/backend/internal/models"

	"github.com/go-chi/chi/v5"
)

func (h *Handler) heroSlides(w http.ResponseWriter, r *http.Request) {
	items, err := h.repo.HeroSlides(r.Context(), false)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "Gagal mengambil data slider hero")
		return
	}
	httpx.JSON(w, http.StatusOK, items)
}

func (h *Handler) adminHeroSlides(w http.ResponseWriter, r *http.Request) {
	items, err := h.repo.HeroSlides(r.Context(), true)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "Gagal mengambil data slider hero")
		return
	}
	httpx.JSON(w, http.StatusOK, items)
}

func (h *Handler) createHeroSlide(w http.ResponseWriter, r *http.Request) {
	var payload models.HeroSlide
	if err := httpx.DecodeJSON(r, &payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "Payload tidak valid")
		return
	}
	id, err := h.repo.CreateHeroSlide(r.Context(), payload)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	httpx.JSON(w, http.StatusCreated, map[string]int64{"id": id})
}

func (h *Handler) updateHeroSlide(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(chi.URLParam(r, "id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "ID tidak valid")
		return
	}

	var payload models.HeroSlide
	if err := httpx.DecodeJSON(r, &payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "Payload tidak valid")
		return
	}

	if err := h.repo.UpdateHeroSlide(r.Context(), id, payload); errors.Is(err, sql.ErrNoRows) {
		httpx.Error(w, http.StatusNotFound, "Slide hero tidak ditemukan")
		return
	} else if err != nil {
		httpx.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "Slide hero berhasil diperbarui"})
}

func (h *Handler) deleteHeroSlide(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(chi.URLParam(r, "id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "ID tidak valid")
		return
	}

	if err := h.repo.DeleteHeroSlide(r.Context(), id); errors.Is(err, sql.ErrNoRows) {
		httpx.Error(w, http.StatusNotFound, "Slide hero tidak ditemukan")
		return
	} else if err != nil {
		httpx.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "Slide hero berhasil dihapus"})
}
