package handlers

import (
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"errors"
	"net/http"
	"strings"
	"time"

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
	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/school-profile", h.schoolProfile)
		r.Get("/majors", h.majors)
		r.Get("/articles", h.articles)
		r.Get("/articles/{slug}", h.articleBySlug)
		r.Get("/announcements", h.announcements)
		r.Get("/agendas", h.agendas)

		r.Post("/auth/login", h.login)
		r.Group(func(protected chi.Router) {
			protected.Use(h.requireAuth)
			protected.Get("/auth/me", h.me)
			protected.Post("/auth/logout", h.requireCSRF(h.logout))
			protected.Post("/articles", h.requireCSRF(h.requireAnyRole(h.createArticle, models.RoleSuperadmin, models.RoleAdmin, models.RoleContributor)))
			protected.Post("/announcements", h.requireCSRF(h.requireAnyRole(h.createAnnouncement, models.RoleSuperadmin, models.RoleAdmin, models.RoleContributor)))
			protected.Post("/agendas", h.requireCSRF(h.requireAnyRole(h.createAgenda, models.RoleSuperadmin, models.RoleAdmin, models.RoleContributor)))
			protected.Post("/majors", h.requireCSRF(h.requireAnyRole(h.createMajor, models.RoleSuperadmin, models.RoleAdmin)))
			protected.Put("/majors/{id}", h.requireCSRF(h.requireAnyRole(h.updateMajor, models.RoleSuperadmin, models.RoleAdmin)))
			protected.Put("/school-profile", h.requireCSRF(h.requireAnyRole(h.updateSchoolProfile, models.RoleSuperadmin, models.RoleAdmin)))
			protected.Get("/users", h.requireAnyRole(h.users, models.RoleSuperadmin))
			protected.Post("/users", h.requireCSRF(h.requireAnyRole(h.createUser, models.RoleSuperadmin)))
		})
	})

	return r
}

func securityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		w.Header().Set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
		next.ServeHTTP(w, r)
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
		Title    string `json:"title"`
		Excerpt  string `json:"excerpt"`
		Content  string `json:"content"`
		Category string `json:"category"`
		Status   string `json:"status"`
	}
	if err := httpx.DecodeJSON(r, &payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "payload tidak valid")
		return
	}
	id, err := h.repo.CreateArticle(r.Context(), claims.UserID, payload.Title, payload.Excerpt, payload.Content, payload.Category, payload.Status)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	httpx.JSON(w, http.StatusCreated, map[string]int64{"id": id})
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
