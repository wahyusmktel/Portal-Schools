package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"portal-smktelkom/backend/internal/auth"
	"portal-smktelkom/backend/internal/models"
)

type Repository struct {
	db *sql.DB
}

func New(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) SeedSuperadmin(ctx context.Context, name string, email string, password string) error {
	var count int
	if err := r.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM users").Scan(&count); err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	hash, err := auth.HashPassword(password)
	if err != nil {
		return err
	}

	_, err = r.db.ExecContext(ctx, `
		INSERT INTO users (name, email, password_hash, role, is_active)
		VALUES (?, ?, ?, 'superadmin', true)
	`, name, strings.ToLower(email), hash)
	return err
}

func (r *Repository) FindUserByEmail(ctx context.Context, email string) (models.User, error) {
	var user models.User
	err := r.db.QueryRowContext(ctx, `
		SELECT id, name, email, password_hash, role, is_active, created_at
		FROM users
		WHERE email = ?
	`, strings.ToLower(email)).Scan(&user.ID, &user.Name, &user.Email, &user.PasswordHash, &user.Role, &user.IsActive, &user.CreatedAt)
	return user, err
}

func (r *Repository) Users(ctx context.Context) ([]models.User, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, name, email, role, is_active, created_at
		FROM users
		ORDER BY created_at DESC
		LIMIT 100
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var user models.User
		if err := rows.Scan(&user.ID, &user.Name, &user.Email, &user.Role, &user.IsActive, &user.CreatedAt); err != nil {
			return nil, err
		}
		users = append(users, user)
	}
	return users, rows.Err()
}

func (r *Repository) CreateUser(ctx context.Context, name string, email string, password string, role models.Role) (int64, error) {
	if name == "" || email == "" || len(password) < 8 {
		return 0, errors.New("nama, email, dan password minimal 8 karakter wajib diisi")
	}
	if role != models.RoleAdmin && role != models.RoleContributor && role != models.RoleSuperadmin {
		role = models.RoleContributor
	}

	hash, err := auth.HashPassword(password)
	if err != nil {
		return 0, err
	}

	result, err := r.db.ExecContext(ctx, `
		INSERT INTO users (name, email, password_hash, role, is_active)
		VALUES (?, ?, ?, ?, true)
	`, name, strings.ToLower(email), hash, role)
	if err != nil {
		return 0, err
	}
	return result.LastInsertId()
}

func (r *Repository) SchoolProfile(ctx context.Context) (models.SchoolProfile, error) {
	var profile models.SchoolProfile
	var statsJSON []byte
	err := r.db.QueryRowContext(ctx, `
		SELECT name, tagline, description, address, phone, email, map_embed_url,
		       principal_name, principal_title, principal_message, principal_image, stats_json
		FROM school_profiles
		ORDER BY id ASC
		LIMIT 1
	`).Scan(
		&profile.Name,
		&profile.Tagline,
		&profile.Description,
		&profile.Address,
		&profile.Phone,
		&profile.Email,
		&profile.MapEmbedURL,
		&profile.PrincipalName,
		&profile.PrincipalTitle,
		&profile.PrincipalMessage,
		&profile.PrincipalImage,
		&statsJSON,
	)
	if err != nil {
		return profile, err
	}
	_ = json.Unmarshal(statsJSON, &profile.Stats)
	return profile, nil
}

func (r *Repository) UpdateSchoolProfile(ctx context.Context, profile models.SchoolProfile) error {
	if strings.TrimSpace(profile.Name) == "" || strings.TrimSpace(profile.Description) == "" {
		return errors.New("nama sekolah dan deskripsi wajib diisi")
	}
	if profile.PrincipalImage == "" {
		profile.PrincipalImage = defaultPrincipalImage
	}
	statsJSON, err := json.Marshal(profile.Stats)
	if err != nil {
		return err
	}

	_, err = r.db.ExecContext(ctx, `
		UPDATE school_profiles
		SET name = ?, tagline = ?, description = ?, address = ?, phone = ?, email = ?,
		    map_embed_url = ?, principal_name = ?, principal_title = ?, principal_message = ?,
		    principal_image = ?, stats_json = ?
		WHERE id = 1
	`, profile.Name, profile.Tagline, profile.Description, profile.Address, profile.Phone, profile.Email,
		profile.MapEmbedURL, profile.PrincipalName, profile.PrincipalTitle, profile.PrincipalMessage,
		profile.PrincipalImage, statsJSON)
	return err
}

func (r *Repository) Majors(ctx context.Context) ([]models.Major, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, name, slug, summary, icon, cover_image, curriculum_json, career_prospects_json
		FROM majors
		WHERE is_active = true
		ORDER BY sort_order ASC, name ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.Major
	for rows.Next() {
		var item models.Major
		var curriculumJSON []byte
		var careerProspectsJSON []byte
		if err := rows.Scan(&item.ID, &item.Name, &item.Slug, &item.Summary, &item.Icon, &item.CoverImage, &curriculumJSON, &careerProspectsJSON); err != nil {
			return nil, err
		}
		_ = json.Unmarshal(curriculumJSON, &item.Curriculum)
		_ = json.Unmarshal(careerProspectsJSON, &item.CareerProspects)
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *Repository) CreateMajor(ctx context.Context, major models.Major) (int64, error) {
	if strings.TrimSpace(major.Name) == "" || strings.TrimSpace(major.Summary) == "" {
		return 0, errors.New("nama jurusan dan deskripsi wajib diisi")
	}
	if major.Icon == "" {
		major.Icon = "Network"
	}
	if major.CoverImage == "" {
		major.CoverImage = defaultMajorCoverImage
	}

	curriculumJSON, err := json.Marshal(major.Curriculum)
	if err != nil {
		return 0, err
	}
	careerProspectsJSON, err := json.Marshal(major.CareerProspects)
	if err != nil {
		return 0, err
	}

	result, err := r.db.ExecContext(ctx, `
		INSERT INTO majors (name, slug, summary, icon, cover_image, curriculum_json, career_prospects_json, sort_order, is_active)
		VALUES (?, ?, ?, ?, ?, ?, ?, 99, true)
	`, major.Name, slugify(major.Name), major.Summary, major.Icon, major.CoverImage, curriculumJSON, careerProspectsJSON)
	if err != nil {
		return 0, err
	}
	return result.LastInsertId()
}

func (r *Repository) UpdateMajor(ctx context.Context, id int64, major models.Major) error {
	if id <= 0 {
		return errors.New("id jurusan tidak valid")
	}
	if strings.TrimSpace(major.Name) == "" || strings.TrimSpace(major.Summary) == "" {
		return errors.New("nama jurusan dan deskripsi wajib diisi")
	}
	if major.Icon == "" {
		major.Icon = "Network"
	}
	if major.CoverImage == "" {
		major.CoverImage = defaultMajorCoverImage
	}
	curriculumJSON, err := json.Marshal(major.Curriculum)
	if err != nil {
		return err
	}
	careerProspectsJSON, err := json.Marshal(major.CareerProspects)
	if err != nil {
		return err
	}

	result, err := r.db.ExecContext(ctx, `
		UPDATE majors
		SET name = ?, slug = ?, summary = ?, icon = ?, cover_image = ?,
		    curriculum_json = ?, career_prospects_json = ?, is_active = true
		WHERE id = ?
	`, major.Name, slugify(major.Name), major.Summary, major.Icon, major.CoverImage, curriculumJSON, careerProspectsJSON, id)
	if err != nil {
		return err
	}
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *Repository) Articles(ctx context.Context, includeDraft bool) ([]models.Article, error) {
	query := `
		SELECT a.id, a.title, a.slug, a.excerpt, a.content, a.cover_image, a.category, a.status,
		       COALESCE(a.published_at, a.created_at), COALESCE(u.name, 'Admin Sekolah')
		FROM articles a
		LEFT JOIN users u ON u.id = a.author_id
	`
	if !includeDraft {
		query += " WHERE a.status = 'published' "
	}
	query += " ORDER BY COALESCE(a.published_at, a.created_at) DESC LIMIT 30"

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.Article
	for rows.Next() {
		var item models.Article
		if err := rows.Scan(&item.ID, &item.Title, &item.Slug, &item.Excerpt, &item.Content, &item.CoverImage, &item.Category, &item.Status, &item.PublishedAt, &item.AuthorName); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *Repository) ArticleBySlug(ctx context.Context, slug string) (models.Article, error) {
	var item models.Article
	err := r.db.QueryRowContext(ctx, `
		SELECT a.id, a.title, a.slug, a.excerpt, a.content, a.cover_image, a.category, a.status,
		       COALESCE(a.published_at, a.created_at), COALESCE(u.name, 'Admin Sekolah')
		FROM articles a
		LEFT JOIN users u ON u.id = a.author_id
		WHERE a.slug = ? AND a.status = 'published'
	`, slug).Scan(&item.ID, &item.Title, &item.Slug, &item.Excerpt, &item.Content, &item.CoverImage, &item.Category, &item.Status, &item.PublishedAt, &item.AuthorName)
	return item, err
}

func (r *Repository) CreateArticle(ctx context.Context, userID int64, title string, excerpt string, content string, category string, status string) (int64, error) {
	if title == "" || excerpt == "" {
		return 0, errors.New("title and excerpt are required")
	}
	if status != "published" {
		status = "draft"
	}
	if category == "" {
		category = "Sekolah"
	}
	publishedAt := sql.NullTime{}
	if status == "published" {
		publishedAt = sql.NullTime{Time: time.Now(), Valid: true}
	}

	result, err := r.db.ExecContext(ctx, `
		INSERT INTO articles (title, slug, excerpt, content, cover_image, category, status, published_at, author_id)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, title, uniqueSlug(title), excerpt, content, defaultCoverImage, category, status, publishedAt, userID)
	if err != nil {
		return 0, err
	}
	return result.LastInsertId()
}

func (r *Repository) Announcements(ctx context.Context, includeDraft bool) ([]models.Announcement, error) {
	query := `
		SELECT id, title, body, status, COALESCE(published_at, created_at)
		FROM announcements
	`
	if !includeDraft {
		query += " WHERE status = 'published' "
	}
	query += " ORDER BY COALESCE(published_at, created_at) DESC LIMIT 20"

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.Announcement
	for rows.Next() {
		var item models.Announcement
		if err := rows.Scan(&item.ID, &item.Title, &item.Body, &item.Status, &item.PublishedAt); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *Repository) CreateAnnouncement(ctx context.Context, title string, body string, status string) (int64, error) {
	if status != "draft" {
		status = "published"
	}
	publishedAt := sql.NullTime{}
	if status == "published" {
		publishedAt = sql.NullTime{Time: time.Now(), Valid: true}
	}
	result, err := r.db.ExecContext(ctx, `
		INSERT INTO announcements (title, body, status, published_at)
		VALUES (?, ?, ?, ?)
	`, title, body, status, publishedAt)
	if err != nil {
		return 0, err
	}
	return result.LastInsertId()
}

func (r *Repository) Agendas(ctx context.Context) ([]models.Agenda, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, title, location, starts_at
		FROM agendas
		WHERE starts_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
		ORDER BY starts_at ASC
		LIMIT 20
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.Agenda
	for rows.Next() {
		var item models.Agenda
		if err := rows.Scan(&item.ID, &item.Title, &item.Location, &item.StartsAt); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *Repository) CreateAgenda(ctx context.Context, title string, location string, startsAt time.Time) (int64, error) {
	result, err := r.db.ExecContext(ctx, `
		INSERT INTO agendas (title, location, starts_at)
		VALUES (?, ?, ?)
	`, title, location, startsAt)
	if err != nil {
		return 0, err
	}
	return result.LastInsertId()
}

const defaultCoverImage = "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80"
const defaultMajorCoverImage = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=82"
const defaultPrincipalImage = "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=900&q=82"

func uniqueSlug(title string) string {
	return slugify(title) + "-" + time.Now().Format("20060102150405")
}

func slugify(title string) string {
	slug := strings.ToLower(strings.TrimSpace(title))
	replacer := strings.NewReplacer(" ", "-", "_", "-", "/", "-", "\\", "-", ".", "", ",", "", "'", "", "\"", "")
	slug = replacer.Replace(slug)
	for strings.Contains(slug, "--") {
		slug = strings.ReplaceAll(slug, "--", "-")
	}
	if len(slug) > 90 {
		slug = slug[:90]
	}
	return strings.Trim(slug, "-")
}
