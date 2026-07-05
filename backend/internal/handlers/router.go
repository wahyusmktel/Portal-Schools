package handlers

import (
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/dchest/captcha"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/go-chi/httprate"

	"portal-smktelkom/backend/internal/auth"
	"portal-smktelkom/backend/internal/config"
	"portal-smktelkom/backend/internal/httpx"
	"portal-smktelkom/backend/internal/models"
	"portal-smktelkom/backend/internal/repository"
)

type Handler struct {
	cfg    config.Config
	repo   *repository.Repository
	tokens *auth.TokenManager
}

func NewRouter(cfg config.Config, repo *repository.Repository, tokens *auth.TokenManager) http.Handler {
	h := &Handler{cfg: cfg, repo: repo, tokens: tokens}

	r := chi.NewRouter()
	r.Use(securityHeaders)
	r.Use(httprate.LimitByIP(180, time.Minute))
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   cfg.CORSAllowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Get("/healthz", h.health)
	r.Handle("/uploads/*", cachedUploadsHandler("uploads"))
	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/school-profile", h.schoolProfile)
		r.Get("/hero-slides", h.heroSlides)
		r.Get("/why-choose-us", h.whyChooseUs)
		r.Get("/majors", h.majors)
		r.Get("/teaching-modules", h.teachingModules)
		r.Get("/teaching-modules/{slug}", h.teachingModuleBySlug)
		r.Post("/teaching-modules/{slug}/view", h.incrementTeachingModuleView)
		r.Post("/teaching-modules/{slug}/download", h.incrementTeachingModuleDownload)
		r.Get("/articles", h.articles)
		r.Get("/articles/{slug}", h.articleBySlug)
		r.Post("/articles/{slug}/view", h.incrementArticleView)
		r.Get("/articles/{slug}/comments", h.getComments)
		r.Post("/articles/{slug}/comments", h.createComment)
		r.Get("/announcements", h.announcements)
		r.Get("/agendas", h.agendas)
		r.Get("/employees", h.employees)

		r.Get("/captcha/new", h.newCaptcha)
		r.Get("/captcha/image/{id}", h.captchaImage)

		r.Post("/auth/login", h.login)
		r.Get("/facilities", h.facilities)
		r.Get("/achievements", h.achievements)
		r.Get("/industry-partners", h.industryPartners)
		r.Get("/alumni", h.alumni)
		r.Get("/alumni/stats", h.alumniStats)
		r.Get("/faqs", h.faqs)
		r.Post("/spmb/registrations", h.createSpmbRegistration)

		r.Group(func(protected chi.Router) {
			protected.Use(h.requireAuth)
			protected.Get("/auth/me", h.me)
			protected.Post("/auth/logout", h.requireCSRF(h.logout))
			protected.Get("/admin/articles", h.requireAnyRole(h.adminArticles, models.RoleSuperadmin, models.RoleAdmin, models.RoleContributor))
			protected.Get("/admin/announcements", h.requireAnyRole(h.adminAnnouncements, models.RoleSuperadmin, models.RoleAdmin, models.RoleContributor))
			protected.Get("/admin/hero-slides", h.requireAnyRole(h.adminHeroSlides, models.RoleSuperadmin, models.RoleAdmin))
			protected.Get("/admin/why-choose-us", h.requireAnyRole(h.adminWhyChooseUs, models.RoleSuperadmin, models.RoleAdmin))
			protected.Get("/admin/teaching-modules", h.requireAnyRole(h.adminTeachingModules, models.RoleSuperadmin, models.RoleAdmin, models.RoleContributor))
			protected.Get("/admin/spmb/registrations", h.requireAnyRole(h.adminSpmbRegistrations, models.RoleSuperadmin, models.RoleAdmin, models.RoleAdminSPMB))
			protected.Post("/articles", h.requireCSRF(h.requireAnyRole(h.createArticle, models.RoleSuperadmin, models.RoleAdmin, models.RoleContributor)))
			protected.Put("/articles/{id}", h.requireCSRF(h.requireAnyRole(h.updateArticle, models.RoleSuperadmin, models.RoleAdmin)))
			protected.Delete("/articles/{id}", h.requireCSRF(h.requireAnyRole(h.deleteArticle, models.RoleSuperadmin, models.RoleAdmin)))
			protected.Post("/announcements", h.requireCSRF(h.requireAnyRole(h.createAnnouncement, models.RoleSuperadmin, models.RoleAdmin, models.RoleContributor)))
			protected.Post("/agendas", h.requireCSRF(h.requireAnyRole(h.createAgenda, models.RoleSuperadmin, models.RoleAdmin, models.RoleContributor)))
			protected.Post("/majors", h.requireCSRF(h.requireAnyRole(h.createMajor, models.RoleSuperadmin, models.RoleAdmin)))
			protected.Put("/majors/{id}", h.requireCSRF(h.requireAnyRole(h.updateMajor, models.RoleSuperadmin, models.RoleAdmin)))
			protected.Delete("/majors/{id}", h.requireCSRF(h.requireAnyRole(h.deleteMajor, models.RoleSuperadmin, models.RoleAdmin)))
			protected.Put("/school-profile", h.requireCSRF(h.requireAnyRole(h.updateSchoolProfile, models.RoleSuperadmin, models.RoleAdmin)))
			protected.Post("/hero-slides", h.requireCSRF(h.requireAnyRole(h.createHeroSlide, models.RoleSuperadmin, models.RoleAdmin)))
			protected.Put("/hero-slides/{id}", h.requireCSRF(h.requireAnyRole(h.updateHeroSlide, models.RoleSuperadmin, models.RoleAdmin)))
			protected.Delete("/hero-slides/{id}", h.requireCSRF(h.requireAnyRole(h.deleteHeroSlide, models.RoleSuperadmin, models.RoleAdmin)))
			protected.Post("/why-choose-us", h.requireCSRF(h.requireAnyRole(h.createWhyChooseUsItem, models.RoleSuperadmin, models.RoleAdmin)))
			protected.Put("/why-choose-us/{id}", h.requireCSRF(h.requireAnyRole(h.updateWhyChooseUsItem, models.RoleSuperadmin, models.RoleAdmin)))
			protected.Delete("/why-choose-us/{id}", h.requireCSRF(h.requireAnyRole(h.deleteWhyChooseUsItem, models.RoleSuperadmin, models.RoleAdmin)))
			protected.Post("/teaching-modules", h.requireCSRF(h.requireAnyRole(h.createTeachingModule, models.RoleSuperadmin, models.RoleAdmin, models.RoleContributor)))
			protected.Put("/teaching-modules/{id}", h.requireCSRF(h.requireAnyRole(h.updateTeachingModule, models.RoleSuperadmin, models.RoleAdmin, models.RoleContributor)))
			protected.Delete("/teaching-modules/{id}", h.requireCSRF(h.requireAnyRole(h.deleteTeachingModule, models.RoleSuperadmin, models.RoleAdmin)))
			protected.Post("/uploads/images", h.requireCSRF(h.requireAnyRole(h.uploadImage, models.RoleSuperadmin, models.RoleAdmin, models.RoleContributor)))
			protected.Post("/uploads/documents", h.requireCSRF(h.requireAnyRole(h.uploadDocument, models.RoleSuperadmin, models.RoleAdmin, models.RoleContributor)))
			protected.Get("/admin/comments", h.requireAnyRole(h.adminComments, models.RoleSuperadmin, models.RoleAdmin, models.RoleContributor))
			protected.Put("/admin/comments/{id}/status", h.requireCSRF(h.requireAnyRole(h.updateCommentStatus, models.RoleSuperadmin, models.RoleAdmin, models.RoleContributor)))
			protected.Get("/users", h.requireAnyRole(h.users, models.RoleSuperadmin))
			protected.Post("/users", h.requireCSRF(h.requireAnyRole(h.createUser, models.RoleSuperadmin)))
			protected.Put("/announcements/{id}", h.requireCSRF(h.requireAnyRole(h.updateAnnouncement, models.RoleSuperadmin, models.RoleAdmin)))
			protected.Delete("/announcements/{id}", h.requireCSRF(h.requireAnyRole(h.deleteAnnouncement, models.RoleSuperadmin, models.RoleAdmin)))
			protected.Put("/agendas/{id}", h.requireCSRF(h.requireAnyRole(h.updateAgenda, models.RoleSuperadmin, models.RoleAdmin)))
			protected.Delete("/agendas/{id}", h.requireCSRF(h.requireAnyRole(h.deleteAgenda, models.RoleSuperadmin, models.RoleAdmin)))
			protected.Post("/employees", h.requireCSRF(h.requireAnyRole(h.createEmployee, models.RoleSuperadmin, models.RoleAdmin)))
			protected.Put("/employees/{id}", h.requireCSRF(h.requireAnyRole(h.updateEmployee, models.RoleSuperadmin, models.RoleAdmin)))
			protected.Delete("/employees/{id}", h.requireCSRF(h.requireAnyRole(h.deleteEmployee, models.RoleSuperadmin, models.RoleAdmin)))
			protected.Post("/facilities", h.requireCSRF(h.requireAnyRole(h.createFacility, models.RoleSuperadmin, models.RoleAdmin)))
			protected.Put("/facilities/{id}", h.requireCSRF(h.requireAnyRole(h.updateFacility, models.RoleSuperadmin, models.RoleAdmin)))
			protected.Delete("/facilities/{id}", h.requireCSRF(h.requireAnyRole(h.deleteFacility, models.RoleSuperadmin, models.RoleAdmin)))
			protected.Put("/users/{id}", h.requireCSRF(h.requireAnyRole(h.updateUser, models.RoleSuperadmin)))
			protected.Delete("/users/{id}", h.requireCSRF(h.requireAnyRole(h.deleteUser, models.RoleSuperadmin)))
			protected.Put("/users/{id}/reset-password", h.requireCSRF(h.requireAnyRole(h.resetPassword, models.RoleSuperadmin)))
			protected.Post("/achievements", h.requireCSRF(h.requireAnyRole(h.createAchievement, models.RoleSuperadmin, models.RoleAdmin)))
			protected.Put("/achievements/{id}", h.requireCSRF(h.requireAnyRole(h.updateAchievement, models.RoleSuperadmin, models.RoleAdmin)))
			protected.Delete("/achievements/{id}", h.requireCSRF(h.requireAnyRole(h.deleteAchievement, models.RoleSuperadmin, models.RoleAdmin)))
			protected.Post("/industry-partners", h.requireCSRF(h.requireAnyRole(h.createIndustryPartner, models.RoleSuperadmin, models.RoleAdmin)))
			protected.Put("/industry-partners/{id}", h.requireCSRF(h.requireAnyRole(h.updateIndustryPartner, models.RoleSuperadmin, models.RoleAdmin)))
			protected.Delete("/industry-partners/{id}", h.requireCSRF(h.requireAnyRole(h.deleteIndustryPartner, models.RoleSuperadmin, models.RoleAdmin)))
			protected.Post("/alumni", h.requireCSRF(h.requireAnyRole(h.createAlumni, models.RoleSuperadmin, models.RoleAdmin)))
			protected.Put("/alumni/{id}", h.requireCSRF(h.requireAnyRole(h.updateAlumni, models.RoleSuperadmin, models.RoleAdmin)))
			protected.Delete("/alumni/{id}", h.requireCSRF(h.requireAnyRole(h.deleteAlumni, models.RoleSuperadmin, models.RoleAdmin)))
			protected.Post("/faqs", h.requireCSRF(h.requireAnyRole(h.createFAQ, models.RoleSuperadmin, models.RoleAdmin)))
			protected.Put("/faqs/{id}", h.requireCSRF(h.requireAnyRole(h.updateFAQ, models.RoleSuperadmin, models.RoleAdmin)))
			protected.Delete("/faqs/{id}", h.requireCSRF(h.requireAnyRole(h.deleteFAQ, models.RoleSuperadmin, models.RoleAdmin)))
		})
	})

	return r
}

func securityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		if !strings.HasPrefix(r.URL.Path, "/uploads/documents/") {
			w.Header().Set("X-Frame-Options", "DENY")
		}
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		w.Header().Set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
		next.ServeHTTP(w, r)
	})
}

func cachedUploadsHandler(dir string) http.Handler {
	fileServer := http.StripPrefix("/uploads/", http.FileServer(http.Dir(dir)))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
		w.Header().Set("Vary", "Accept-Encoding")
		fileServer.ServeHTTP(w, r)
	})
}

func (h *Handler) health(w http.ResponseWriter, r *http.Request) {
	httpx.JSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) schoolProfile(w http.ResponseWriter, r *http.Request) {
	profile, err := h.repo.SchoolProfile(r.Context())
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "profil sekolah belum tersedia")
		return
	}
	httpx.JSON(w, http.StatusOK, profile)
}

func (h *Handler) majors(w http.ResponseWriter, r *http.Request) {
	items, err := h.repo.Majors(r.Context())
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal memuat jurusan")
		return
	}
	httpx.JSON(w, http.StatusOK, items)
}

func (h *Handler) articles(w http.ResponseWriter, r *http.Request) {
	items, err := h.repo.Articles(r.Context(), false)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal memuat artikel")
		return
	}
	httpx.JSON(w, http.StatusOK, items)
}

func (h *Handler) adminArticles(w http.ResponseWriter, r *http.Request) {
	items, err := h.repo.Articles(r.Context(), true)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal memuat artikel")
		return
	}
	httpx.JSON(w, http.StatusOK, items)
}

func (h *Handler) articleBySlug(w http.ResponseWriter, r *http.Request) {
	item, err := h.repo.ArticleBySlug(r.Context(), chi.URLParam(r, "slug"))
	if errors.Is(err, sql.ErrNoRows) {
		httpx.Error(w, http.StatusNotFound, "artikel tidak ditemukan")
		return
	}
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal memuat artikel")
		return
	}
	httpx.JSON(w, http.StatusOK, item)
}

func (h *Handler) announcements(w http.ResponseWriter, r *http.Request) {
	items, err := h.repo.Announcements(r.Context(), false)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal memuat pengumuman")
		return
	}
	httpx.JSON(w, http.StatusOK, items)
}

func (h *Handler) adminAnnouncements(w http.ResponseWriter, r *http.Request) {
	items, err := h.repo.Announcements(r.Context(), true)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal memuat pengumuman")
		return
	}
	httpx.JSON(w, http.StatusOK, items)
}

func (h *Handler) agendas(w http.ResponseWriter, r *http.Request) {
	items, err := h.repo.Agendas(r.Context())
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal memuat agenda")
		return
	}
	httpx.JSON(w, http.StatusOK, items)
}

func (h *Handler) login(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := httpx.DecodeJSON(r, &payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "payload tidak valid")
		return
	}

	user, err := h.repo.FindUserByEmail(r.Context(), strings.ToLower(payload.Email))
	if err != nil || !user.IsActive || !auth.CheckPassword(user.PasswordHash, payload.Password) {
		httpx.Error(w, http.StatusUnauthorized, "email atau password salah")
		return
	}

	token, expiresAt, err := h.tokens.Issue(user)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal membuat sesi")
		return
	}

	csrfToken, err := randomToken(32)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal membuat token keamanan")
		return
	}

	h.setCookie(w, "session_token", token, expiresAt, true)
	h.setCookie(w, "csrf_token", csrfToken, expiresAt, false)

	httpx.JSON(w, http.StatusOK, map[string]interface{}{
		"user": map[string]interface{}{
			"id": user.ID, "name": user.Name, "email": user.Email, "role": user.Role,
		},
	})
}

func (h *Handler) me(w http.ResponseWriter, r *http.Request) {
	claims, _ := claimsFromRequest(r)
	httpx.JSON(w, http.StatusOK, map[string]interface{}{
		"id": claims.UserID, "email": claims.Email, "role": claims.Role,
	})
}

func (h *Handler) logout(w http.ResponseWriter, r *http.Request) {
	h.clearCookie(w, "session_token", true)
	h.clearCookie(w, "csrf_token", false)
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "logout berhasil"})
}

func (h *Handler) createArticle(w http.ResponseWriter, r *http.Request) {
	claims, _ := claimsFromRequest(r)
	var payload struct {
		Title      string `json:"title"`
		Excerpt    string `json:"excerpt"`
		Content    string `json:"content"`
		CoverImage string `json:"coverImage"`
		Category   string `json:"category"`
		Status     string `json:"status"`
	}
	if err := httpx.DecodeJSON(r, &payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "payload tidak valid")
		return
	}
	id, err := h.repo.CreateArticle(r.Context(), claims.UserID, payload.Title, payload.Excerpt, payload.Content, payload.Category, payload.Status, payload.CoverImage)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	httpx.JSON(w, http.StatusCreated, map[string]int64{"id": id})
}

func (h *Handler) incrementArticleView(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	err := h.repo.IncrementArticleView(r.Context(), slug)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal mencatat view")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "view counted"})
}

func (h *Handler) updateArticle(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	if idStr == "" {
		idStr = chi.URLParam(r, "slug")
	}
	id, err := parseID(idStr)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id artikel tidak valid")
		return
	}
	var payload struct {
		Title      string `json:"title"`
		Excerpt    string `json:"excerpt"`
		Content    string `json:"content"`
		CoverImage string `json:"coverImage"`
		Category   string `json:"category"`
		Status     string `json:"status"`
	}
	if err := httpx.DecodeJSON(r, &payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "payload tidak valid")
		return
	}

	if err := h.repo.UpdateArticle(r.Context(), id, payload.Title, payload.Excerpt, payload.Content, payload.Category, payload.Status, payload.CoverImage); errors.Is(err, sql.ErrNoRows) {
		httpx.Error(w, http.StatusNotFound, "artikel tidak ditemukan")
		return
	} else if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "artikel berhasil diperbarui"})
}

func (h *Handler) deleteArticle(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	if idStr == "" {
		idStr = chi.URLParam(r, "slug")
	}
	id, err := parseID(idStr)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id artikel tidak valid")
		return
	}

	if err := h.repo.DeleteArticle(r.Context(), id); errors.Is(err, sql.ErrNoRows) {
		httpx.Error(w, http.StatusNotFound, "artikel tidak ditemukan")
		return
	} else if err != nil {
		httpx.Error(w, http.StatusBadRequest, "gagal menghapus artikel")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "artikel berhasil dihapus"})
}

func (h *Handler) createAnnouncement(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		Title  string `json:"title"`
		Body   string `json:"body"`
		Status string `json:"status"`
	}
	if err := httpx.DecodeJSON(r, &payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "payload tidak valid")
		return
	}
	id, err := h.repo.CreateAnnouncement(r.Context(), payload.Title, payload.Body, payload.Status)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "gagal menyimpan pengumuman")
		return
	}
	httpx.JSON(w, http.StatusCreated, map[string]int64{"id": id})
}

func (h *Handler) createAgenda(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		Title    string    `json:"title"`
		Location string    `json:"location"`
		StartsAt time.Time `json:"startsAt"`
	}
	if err := httpx.DecodeJSON(r, &payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "payload tidak valid")
		return
	}
	id, err := h.repo.CreateAgenda(r.Context(), payload.Title, payload.Location, payload.StartsAt)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "gagal menyimpan agenda")
		return
	}
	httpx.JSON(w, http.StatusCreated, map[string]int64{"id": id})
}

func (h *Handler) createMajor(w http.ResponseWriter, r *http.Request) {
	var payload models.Major
	if err := httpx.DecodeJSON(r, &payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "payload tidak valid")
		return
	}

	id, err := h.repo.CreateMajor(r.Context(), payload)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	httpx.JSON(w, http.StatusCreated, map[string]int64{"id": id})
}

func (h *Handler) updateMajor(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(chi.URLParam(r, "id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id jurusan tidak valid")
		return
	}
	var payload models.Major
	if err := httpx.DecodeJSON(r, &payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "payload tidak valid")
		return
	}

	if err := h.repo.UpdateMajor(r.Context(), id, payload); errors.Is(err, sql.ErrNoRows) {
		httpx.Error(w, http.StatusNotFound, "jurusan tidak ditemukan")
		return
	} else if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "jurusan berhasil diperbarui"})
}

func (h *Handler) deleteMajor(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(chi.URLParam(r, "id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id jurusan tidak valid")
		return
	}

	if err := h.repo.DeleteMajor(r.Context(), id); errors.Is(err, sql.ErrNoRows) {
		httpx.Error(w, http.StatusNotFound, "jurusan tidak ditemukan")
		return
	} else if err != nil {
		httpx.Error(w, http.StatusBadRequest, "gagal menghapus jurusan")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "jurusan berhasil dihapus"})
}

func (h *Handler) updateSchoolProfile(w http.ResponseWriter, r *http.Request) {
	var payload models.SchoolProfile
	if err := httpx.DecodeJSON(r, &payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "payload tidak valid")
		return
	}

	if err := h.repo.UpdateSchoolProfile(r.Context(), payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "profil sekolah berhasil diperbarui"})
}

func (h *Handler) uploadImage(w http.ResponseWriter, r *http.Request) {
	const maxUploadSize = 5 << 20

	r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize)
	if err := r.ParseMultipartForm(maxUploadSize); err != nil {
		httpx.Error(w, http.StatusBadRequest, "ukuran gambar maksimal 5MB")
		return
	}

	file, header, err := r.FormFile("image")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "file gambar wajib diunggah")
		return
	}
	defer file.Close()

	buffer := make([]byte, 512)
	read, err := file.Read(buffer)
	if err != nil && err != io.EOF {
		httpx.Error(w, http.StatusBadRequest, "gagal membaca gambar")
		return
	}

	contentType := http.DetectContentType(buffer[:read])
	extension, ok := allowedImageExtension(contentType)
	if !ok {
		httpx.Error(w, http.StatusBadRequest, "format gambar harus jpg, png, atau webp")
		return
	}

	if _, err := file.Seek(0, io.SeekStart); err != nil {
		httpx.Error(w, http.StatusBadRequest, "gagal memproses gambar")
		return
	}

	targetDir := filepath.Join("uploads", "images")
	if err := os.MkdirAll(targetDir, 0755); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal membuat folder upload")
		return
	}

	filename := fmt.Sprintf("%d-%s%s", time.Now().UnixNano(), safeFilename(header.Filename), extension)
	targetPath := filepath.Join(targetDir, filename)
	destination, err := os.OpenFile(targetPath, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0644)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal menyimpan gambar")
		return
	}
	defer destination.Close()

	if _, err := io.Copy(destination, file); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal menulis gambar")
		return
	}

	httpx.JSON(w, http.StatusCreated, map[string]string{
		"url": absoluteUploadURL(r, "/uploads/images/"+filename),
	})
}

func (h *Handler) uploadDocument(w http.ResponseWriter, r *http.Request) {
	const maxUploadSize = 100 << 20

	r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize)
	if err := r.ParseMultipartForm(maxUploadSize); err != nil {
		httpx.Error(w, http.StatusBadRequest, "ukuran PDF maksimal 100MB")
		return
	}

	file, header, err := r.FormFile("document")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "file PDF wajib diunggah")
		return
	}
	defer file.Close()

	buffer := make([]byte, 512)
	read, err := file.Read(buffer)
	if err != nil && err != io.EOF {
		httpx.Error(w, http.StatusBadRequest, "gagal membaca PDF")
		return
	}

	contentType := http.DetectContentType(buffer[:read])
	if contentType != "application/pdf" && !strings.HasPrefix(string(buffer[:read]), "%PDF") {
		httpx.Error(w, http.StatusBadRequest, "file modul harus berformat PDF")
		return
	}

	if _, err := file.Seek(0, io.SeekStart); err != nil {
		httpx.Error(w, http.StatusBadRequest, "gagal memproses PDF")
		return
	}

	targetDir := filepath.Join("uploads", "documents")
	if err := os.MkdirAll(targetDir, 0755); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal membuat folder dokumen")
		return
	}

	filename := fmt.Sprintf("%d-%s.pdf", time.Now().UnixNano(), safeFilename(header.Filename))
	targetPath := filepath.Join(targetDir, filename)
	destination, err := os.OpenFile(targetPath, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0644)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal menyimpan PDF")
		return
	}
	defer destination.Close()

	written, err := io.Copy(destination, file)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal menulis PDF")
		return
	}

	httpx.JSON(w, http.StatusCreated, map[string]any{
		"url":      absoluteUploadURL(r, "/uploads/documents/"+filename),
		"fileSize": written,
	})
}

func (h *Handler) users(w http.ResponseWriter, r *http.Request) {
	users, err := h.repo.Users(r.Context())
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal memuat pengguna")
		return
	}
	httpx.JSON(w, http.StatusOK, users)
}

func (h *Handler) createUser(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		Name     string      `json:"name"`
		Email    string      `json:"email"`
		Password string      `json:"password"`
		Role     models.Role `json:"role"`
	}
	if err := httpx.DecodeJSON(r, &payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "payload tidak valid")
		return
	}

	id, err := h.repo.CreateUser(r.Context(), payload.Name, payload.Email, payload.Password, payload.Role)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	httpx.JSON(w, http.StatusCreated, map[string]int64{"id": id})
}

func (h *Handler) updateAnnouncement(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(chi.URLParam(r, "id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id pengumuman tidak valid")
		return
	}
	var payload struct {
		Title  string `json:"title"`
		Body   string `json:"body"`
		Status string `json:"status"`
	}
	if err := httpx.DecodeJSON(r, &payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "payload tidak valid")
		return
	}

	if err := h.repo.UpdateAnnouncement(r.Context(), id, payload.Title, payload.Body, payload.Status); errors.Is(err, sql.ErrNoRows) {
		httpx.Error(w, http.StatusNotFound, "pengumuman tidak ditemukan")
		return
	} else if err != nil {
		httpx.Error(w, http.StatusBadRequest, "gagal memperbarui pengumuman")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "pengumuman berhasil diperbarui"})
}

func (h *Handler) deleteAnnouncement(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(chi.URLParam(r, "id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id pengumuman tidak valid")
		return
	}
	if err := h.repo.DeleteAnnouncement(r.Context(), id); errors.Is(err, sql.ErrNoRows) {
		httpx.Error(w, http.StatusNotFound, "pengumuman tidak ditemukan")
		return
	} else if err != nil {
		httpx.Error(w, http.StatusBadRequest, "gagal menghapus pengumuman")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "pengumuman berhasil dihapus"})
}

func (h *Handler) updateAgenda(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(chi.URLParam(r, "id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id agenda tidak valid")
		return
	}
	var payload struct {
		Title    string    `json:"title"`
		Location string    `json:"location"`
		StartsAt time.Time `json:"startsAt"`
	}
	if err := httpx.DecodeJSON(r, &payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "payload tidak valid")
		return
	}

	if err := h.repo.UpdateAgenda(r.Context(), id, payload.Title, payload.Location, payload.StartsAt); errors.Is(err, sql.ErrNoRows) {
		httpx.Error(w, http.StatusNotFound, "agenda tidak ditemukan")
		return
	} else if err != nil {
		httpx.Error(w, http.StatusBadRequest, "gagal memperbarui agenda")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "agenda berhasil diperbarui"})
}

func (h *Handler) deleteAgenda(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(chi.URLParam(r, "id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id agenda tidak valid")
		return
	}
	if err := h.repo.DeleteAgenda(r.Context(), id); errors.Is(err, sql.ErrNoRows) {
		httpx.Error(w, http.StatusNotFound, "agenda tidak ditemukan")
		return
	} else if err != nil {
		httpx.Error(w, http.StatusBadRequest, "gagal menghapus agenda")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "agenda berhasil dihapus"})
}

func (h *Handler) updateUser(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(chi.URLParam(r, "id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id pengguna tidak valid")
		return
	}
	var payload struct {
		Name     string      `json:"name"`
		Email    string      `json:"email"`
		Role     models.Role `json:"role"`
		IsActive bool        `json:"isActive"`
	}
	if err := httpx.DecodeJSON(r, &payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "payload tidak valid")
		return
	}

	if err := h.repo.UpdateUser(r.Context(), id, payload.Name, payload.Email, payload.Role, payload.IsActive); errors.Is(err, sql.ErrNoRows) {
		httpx.Error(w, http.StatusNotFound, "pengguna tidak ditemukan")
		return
	} else if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "pengguna berhasil diperbarui"})
}

func (h *Handler) deleteUser(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(chi.URLParam(r, "id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id pengguna tidak valid")
		return
	}
	if err := h.repo.DeleteUser(r.Context(), id); errors.Is(err, sql.ErrNoRows) {
		httpx.Error(w, http.StatusNotFound, "pengguna tidak ditemukan")
		return
	} else if err != nil {
		httpx.Error(w, http.StatusBadRequest, "gagal menghapus pengguna")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "pengguna berhasil dihapus"})
}

func (h *Handler) resetPassword(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(chi.URLParam(r, "id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "id pengguna tidak valid")
		return
	}
	var payload struct {
		NewPassword string `json:"newPassword"`
	}
	if err := httpx.DecodeJSON(r, &payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "payload tidak valid")
		return
	}
	if err := h.repo.ResetPassword(r.Context(), id, payload.NewPassword); errors.Is(err, sql.ErrNoRows) {
		httpx.Error(w, http.StatusNotFound, "pengguna tidak ditemukan")
		return
	} else if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "password berhasil direset"})
}

func (h *Handler) requireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("session_token")
		if err != nil || cookie.Value == "" {
			httpx.Error(w, http.StatusUnauthorized, "sesi tidak ditemukan")
			return
		}

		claims, err := h.tokens.Verify(cookie.Value)
		if err != nil {
			httpx.Error(w, http.StatusUnauthorized, "sesi tidak valid")
			return
		}

		next.ServeHTTP(w, withClaims(r, claims))
	})
}

func (h *Handler) requireCSRF(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("csrf_token")
		header := r.Header.Get("X-CSRF-Token")
		if err != nil || cookie.Value == "" || header == "" || header != cookie.Value {
			httpx.Error(w, http.StatusForbidden, "csrf token tidak valid")
			return
		}
		next(w, r)
	}
}

func (h *Handler) requireAnyRole(next http.HandlerFunc, roles ...models.Role) http.HandlerFunc {
	allowed := map[models.Role]bool{}
	for _, role := range roles {
		allowed[role] = true
	}
	return func(w http.ResponseWriter, r *http.Request) {
		claims, ok := claimsFromRequest(r)
		if !ok || !allowed[claims.Role] {
			httpx.Error(w, http.StatusForbidden, "akses role tidak diizinkan")
			return
		}
		next(w, r)
	}
}

func (h *Handler) setCookie(w http.ResponseWriter, name string, value string, expires time.Time, httpOnly bool) {
	sameSite := http.SameSiteLaxMode
	if h.cfg.CookieSecure {
		sameSite = http.SameSiteNoneMode
	}

	http.SetCookie(w, &http.Cookie{
		Name:     name,
		Value:    value,
		Path:     "/",
		Domain:   h.cfg.CookieDomain,
		Expires:  expires,
		HttpOnly: httpOnly,
		Secure:   h.cfg.CookieSecure,
		SameSite: sameSite,
	})
}

func (h *Handler) clearCookie(w http.ResponseWriter, name string, httpOnly bool) {
	http.SetCookie(w, &http.Cookie{
		Name:     name,
		Value:    "",
		Path:     "/",
		Domain:   h.cfg.CookieDomain,
		Expires:  time.Unix(0, 0),
		MaxAge:   -1,
		HttpOnly: httpOnly,
		Secure:   h.cfg.CookieSecure,
		SameSite: http.SameSiteLaxMode,
	})
}

func randomToken(size int) (string, error) {
	buffer := make([]byte, size)
	if _, err := rand.Read(buffer); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(buffer), nil
}

func parseID(value string) (int64, error) {
	var id int64
	for _, char := range value {
		if char < '0' || char > '9' {
			return 0, errors.New("invalid id")
		}
		id = id*10 + int64(char-'0')
	}
	if id <= 0 {
		return 0, errors.New("invalid id")
	}
	return id, nil
}

func allowedImageExtension(contentType string) (string, bool) {
	switch contentType {
	case "image/jpeg":
		return ".jpg", true
	case "image/png":
		return ".png", true
	case "image/webp":
		return ".webp", true
	default:
		return "", false
	}
}

func safeFilename(value string) string {
	name := strings.TrimSuffix(filepath.Base(value), filepath.Ext(value))
	name = strings.ToLower(name)
	replacer := strings.NewReplacer(" ", "-", "_", "-", ".", "-", "/", "-", "\\", "-")
	name = replacer.Replace(name)
	if len(name) > 42 {
		name = name[:42]
	}
	name = strings.Trim(name, "-")
	if name == "" {
		return "image"
	}
	return name
}

func absoluteUploadURL(r *http.Request, path string) string {
	scheme := "http"
	if r.TLS != nil || r.Header.Get("X-Forwarded-Proto") == "https" {
		scheme = "https"
	}
	host := r.Header.Get("X-Forwarded-Host")
	if host == "" {
		host = r.Host
	}
	return scheme + "://" + host + path
}

func (h *Handler) newCaptcha(w http.ResponseWriter, r *http.Request) {
	captchaId := captcha.New()
	httpx.JSON(w, http.StatusOK, map[string]string{"captchaId": captchaId})
}

func (h *Handler) captchaImage(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}
	w.Header().Set("Content-Type", "image/png")
	if err := captcha.WriteImage(w, id, captcha.StdWidth, captcha.StdHeight); err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}
