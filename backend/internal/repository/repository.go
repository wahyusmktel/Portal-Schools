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
	if role != models.RoleAdmin && role != models.RoleContributor && role != models.RoleSuperadmin && role != models.RoleAdminSPMB {
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
	var socialMediaJSON []byte
	var partnerLinksJSON []byte
	var address sql.NullString
	var phone sql.NullString
	var email sql.NullString
	var mapEmbedURL sql.NullString
	var youtubeEmbedURL sql.NullString
	var principalName sql.NullString
	var headerLogo sql.NullString
	var footerLogo sql.NullString
	var footerText sql.NullString
	var vision sql.NullString
	var mission sql.NullString
	var spmbBrochureURL sql.NullString
	var spmbAcademicYear sql.NullString
	err := r.db.QueryRowContext(ctx, `
		SELECT name, tagline, description, address, phone, email, map_embed_url, youtube_embed_url,
		       principal_name, principal_title, principal_message, principal_image, stats_json,
		       social_media, partner_links, header_logo, footer_logo, footer_text,
		       vision, mission, spmb_brochure_url, spmb_academic_year
		FROM school_profiles
		ORDER BY id ASC
		LIMIT 1
	`).Scan(
		&profile.Name,
		&profile.Tagline,
		&profile.Description,
		&address,
		&phone,
		&email,
		&mapEmbedURL,
		&youtubeEmbedURL,
		&principalName,
		&profile.PrincipalTitle,
		&profile.PrincipalMessage,
		&profile.PrincipalImage,
		&statsJSON,
		&socialMediaJSON,
		&partnerLinksJSON,
		&headerLogo,
		&footerLogo,
		&footerText,
		&vision,
		&mission,
		&spmbBrochureURL,
		&spmbAcademicYear,
	)
	if err != nil {
		return profile, err
	}
	_ = json.Unmarshal(statsJSON, &profile.Stats)
	_ = json.Unmarshal(socialMediaJSON, &profile.SocialMedia)
	_ = json.Unmarshal(partnerLinksJSON, &profile.PartnerLinks)
	profile.Address = address.String
	profile.Phone = phone.String
	profile.Email = email.String
	profile.MapEmbedURL = mapEmbedURL.String
	profile.YoutubeEmbedURL = youtubeEmbedURL.String
	profile.PrincipalName = principalName.String
	profile.HeaderLogo = headerLogo.String
	profile.FooterLogo = footerLogo.String
	profile.FooterText = footerText.String
	profile.Vision = vision.String
	profile.Mission = mission.String
	profile.SpmbBrochureURL = spmbBrochureURL.String
	profile.SpmbAcademicYear = spmbAcademicYear.String
	if profile.SpmbAcademicYear == "" {
		profile.SpmbAcademicYear = "2026/2027"
	}
	return profile, nil
}

func (r *Repository) UpdateSchoolProfile(ctx context.Context, profile models.SchoolProfile) error {
	if strings.TrimSpace(profile.Name) == "" || strings.TrimSpace(profile.Description) == "" {
		return errors.New("nama sekolah dan deskripsi wajib diisi")
	}
	statsJSON, err := json.Marshal(profile.Stats)
	if err != nil {
		return err
	}
	socialMediaJSON, err := json.Marshal(profile.SocialMedia)
	if err != nil {
		return err
	}
	partnerLinksJSON, err := json.Marshal(profile.PartnerLinks)
	if err != nil {
		return err
	}

	_, err = r.db.ExecContext(ctx, `
		UPDATE school_profiles
		SET name = ?, tagline = ?, description = ?, address = ?, phone = ?, email = ?,
		    map_embed_url = ?, youtube_embed_url = ?, principal_name = ?, principal_title = ?, principal_message = ?,
		    principal_image = ?, stats_json = ?, social_media = ?, partner_links = ?,
		    header_logo = ?, footer_logo = ?, footer_text = ?, vision = ?, mission = ?, spmb_brochure_url = ?,
		    spmb_academic_year = ?
		WHERE id = 1
	`, profile.Name, profile.Tagline, profile.Description, profile.Address, profile.Phone, profile.Email,
		profile.MapEmbedURL, profile.YoutubeEmbedURL, profile.PrincipalName, profile.PrincipalTitle, profile.PrincipalMessage,
		profile.PrincipalImage, statsJSON, socialMediaJSON, partnerLinksJSON, profile.HeaderLogo, profile.FooterLogo, profile.FooterText,
		profile.Vision, profile.Mission, profile.SpmbBrochureURL, profile.SpmbAcademicYear)
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

func (r *Repository) DeleteMajor(ctx context.Context, id int64) error {
	if id <= 0 {
		return errors.New("id jurusan tidak valid")
	}

	result, err := r.db.ExecContext(ctx, `
		UPDATE majors
		SET is_active = false, updated_at = CURRENT_TIMESTAMP
		WHERE id = ? AND is_active = true
	`, id)
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
		SELECT a.id, a.title, a.slug, a.excerpt, a.content, a.cover_image, a.category, a.status, a.view_count,
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
		if err := rows.Scan(&item.ID, &item.Title, &item.Slug, &item.Excerpt, &item.Content, &item.CoverImage, &item.Category, &item.Status, &item.ViewCount, &item.PublishedAt, &item.AuthorName); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *Repository) ArticleBySlug(ctx context.Context, slug string) (models.Article, error) {
	var item models.Article
	err := r.db.QueryRowContext(ctx, `
		SELECT a.id, a.title, a.slug, a.excerpt, a.content, a.cover_image, a.category, a.status, a.view_count,
		       COALESCE(a.published_at, a.created_at), COALESCE(u.name, 'Admin Sekolah')
		FROM articles a
		LEFT JOIN users u ON u.id = a.author_id
		WHERE a.slug = ? AND a.status = 'published'
	`, slug).Scan(&item.ID, &item.Title, &item.Slug, &item.Excerpt, &item.Content, &item.CoverImage, &item.Category, &item.Status, &item.ViewCount, &item.PublishedAt, &item.AuthorName)
	return item, err
}

func (r *Repository) CreateArticle(ctx context.Context, userID int64, title string, excerpt string, content string, category string, status string, coverImage string) (int64, error) {
	if title == "" || excerpt == "" {
		return 0, errors.New("title and excerpt are required")
	}
	if status != "published" {
		status = "draft"
	}
	if category == "" {
		category = "Sekolah"
	}
	if coverImage == "" {
		coverImage = defaultCoverImage
	}
	publishedAt := sql.NullTime{}
	if status == "published" {
		publishedAt = sql.NullTime{Time: time.Now(), Valid: true}
	}

	result, err := r.db.ExecContext(ctx, `
		INSERT INTO articles (title, slug, excerpt, content, cover_image, category, status, published_at, author_id)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, title, uniqueSlug(title), excerpt, content, coverImage, category, status, publishedAt, userID)
	if err != nil {
		return 0, err
	}
	return result.LastInsertId()
}

func (r *Repository) IncrementArticleView(ctx context.Context, slug string) error {
	_, err := r.db.ExecContext(ctx, "UPDATE articles SET view_count = view_count + 1 WHERE slug = ?", slug)
	return err
}

func (r *Repository) UpdateArticle(ctx context.Context, id int64, title string, excerpt string, content string, category string, status string, coverImage string) error {
	if id <= 0 {
		return errors.New("id artikel tidak valid")
	}
	if strings.TrimSpace(title) == "" || strings.TrimSpace(excerpt) == "" {
		return errors.New("judul dan ringkasan wajib diisi")
	}
	if category == "" {
		category = "Sekolah"
	}
	if status != "published" {
		status = "draft"
	}
	if coverImage == "" {
		coverImage = defaultCoverImage
	}

	publishedAt := sql.NullTime{}
	if status == "published" {
		publishedAt = sql.NullTime{Time: time.Now(), Valid: true}
	}

	result, err := r.db.ExecContext(ctx, `
		UPDATE articles
		SET title = ?, excerpt = ?, content = ?, cover_image = ?, category = ?,
		    status = ?, published_at = CASE
		      WHEN ? = 'published' AND published_at IS NULL THEN ?
		      WHEN ? = 'published' THEN published_at
		      ELSE NULL
		    END
		WHERE id = ?
	`, title, excerpt, content, coverImage, category, status, status, publishedAt, status, id)
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

func (r *Repository) DeleteArticle(ctx context.Context, id int64) error {
	result, err := r.db.ExecContext(ctx, "DELETE FROM articles WHERE id = ?", id)
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

func (r *Repository) UpdateAnnouncement(ctx context.Context, id int64, title string, body string, status string) error {
	if status != "draft" {
		status = "published"
	}
	publishedAt := sql.NullTime{}
	if status == "published" {
		publishedAt = sql.NullTime{Time: time.Now(), Valid: true}
	}
	result, err := r.db.ExecContext(ctx, `
		UPDATE announcements
		SET title = ?, body = ?, status = ?, published_at = CASE
		      WHEN ? = 'published' AND published_at IS NULL THEN ?
		      WHEN ? = 'published' THEN published_at
		      ELSE NULL
		    END
		WHERE id = ?
	`, title, body, status, status, publishedAt, status, id)
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

func (r *Repository) DeleteAnnouncement(ctx context.Context, id int64) error {
	result, err := r.db.ExecContext(ctx, "DELETE FROM announcements WHERE id = ?", id)
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

func (r *Repository) UpdateAgenda(ctx context.Context, id int64, title string, location string, startsAt time.Time) error {
	result, err := r.db.ExecContext(ctx, `
		UPDATE agendas
		SET title = ?, location = ?, starts_at = ?
		WHERE id = ?
	`, title, location, startsAt, id)
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

func (r *Repository) DeleteAgenda(ctx context.Context, id int64) error {
	result, err := r.db.ExecContext(ctx, "DELETE FROM agendas WHERE id = ?", id)
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

func (r *Repository) UpdateUser(ctx context.Context, id int64, name string, email string, role models.Role, isActive bool) error {
	if name == "" || email == "" {
		return errors.New("nama dan email wajib diisi")
	}
	if role != models.RoleAdmin && role != models.RoleContributor && role != models.RoleSuperadmin && role != models.RoleAdminSPMB {
		role = models.RoleContributor
	}
	result, err := r.db.ExecContext(ctx, `
		UPDATE users
		SET name = ?, email = ?, role = ?, is_active = ?
		WHERE id = ?
	`, name, strings.ToLower(email), role, isActive, id)
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

func (r *Repository) DeleteUser(ctx context.Context, id int64) error {
	result, err := r.db.ExecContext(ctx, "DELETE FROM users WHERE id = ?", id)
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

func (r *Repository) ResetPassword(ctx context.Context, id int64, newPassword string) error {
	if len(newPassword) < 8 {
		return errors.New("password minimal 8 karakter")
	}
	hash, err := auth.HashPassword(newPassword)
	if err != nil {
		return err
	}
	result, err := r.db.ExecContext(ctx, "UPDATE users SET password_hash = ? WHERE id = ?", hash, id)
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

func (r *Repository) Employees(ctx context.Context) ([]models.Employee, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, name, role, biography, image_url, social_links_json, employment_period, is_active, sort_order, created_at, updated_at
		FROM employees
		ORDER BY sort_order ASC, created_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.Employee
	for rows.Next() {
		var item models.Employee
		if err := rows.Scan(&item.ID, &item.Name, &item.Role, &item.Biography, &item.ImageURL, &item.SocialLinksJSON, &item.EmploymentPeriod, &item.IsActive, &item.SortOrder, &item.CreatedAt, &item.UpdatedAt); err != nil {
			return nil, err
		}
		if item.SocialLinksJSON != "" {
			_ = json.Unmarshal([]byte(item.SocialLinksJSON), &item.SocialLinks)
		} else {
			item.SocialLinks = []models.SocialLink{}
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *Repository) CreateEmployee(ctx context.Context, emp models.Employee) (int64, error) {
	if strings.TrimSpace(emp.Name) == "" || strings.TrimSpace(emp.Role) == "" {
		return 0, errors.New("nama dan peran wajib diisi")
	}

	socials, err := json.Marshal(emp.SocialLinks)
	if err != nil || string(socials) == "null" {
		socials = []byte("[]")
	}

	result, err := r.db.ExecContext(ctx, `
		INSERT INTO employees (name, role, biography, image_url, social_links_json, employment_period, is_active, sort_order)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`, emp.Name, emp.Role, emp.Biography, emp.ImageURL, string(socials), emp.EmploymentPeriod, emp.IsActive, emp.SortOrder)
	if err != nil {
		return 0, err
	}
	return result.LastInsertId()
}

func (r *Repository) UpdateEmployee(ctx context.Context, id int64, emp models.Employee) error {
	if id <= 0 {
		return errors.New("id tidak valid")
	}
	if strings.TrimSpace(emp.Name) == "" || strings.TrimSpace(emp.Role) == "" {
		return errors.New("nama dan peran wajib diisi")
	}

	socials, err := json.Marshal(emp.SocialLinks)
	if err != nil || string(socials) == "null" {
		socials = []byte("[]")
	}

	result, err := r.db.ExecContext(ctx, `
		UPDATE employees
		SET name = ?, role = ?, biography = ?, image_url = ?, social_links_json = ?, employment_period = ?, is_active = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP
		WHERE id = ?
	`, emp.Name, emp.Role, emp.Biography, emp.ImageURL, string(socials), emp.EmploymentPeriod, emp.IsActive, emp.SortOrder, id)
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

func (r *Repository) DeleteEmployee(ctx context.Context, id int64) error {
	result, err := r.db.ExecContext(ctx, "DELETE FROM employees WHERE id = ?", id)
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

func (r *Repository) Facilities(ctx context.Context) ([]models.Facility, error) {
	rows, err := r.db.QueryContext(ctx, "SELECT id, name, description, image_url, images_json, icon, sort_order, created_at, updated_at FROM facilities ORDER BY sort_order ASC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var facilities []models.Facility
	for rows.Next() {
		var f models.Facility
		var img, imagesJson, icon sql.NullString
		if err := rows.Scan(&f.ID, &f.Name, &f.Description, &img, &imagesJson, &icon, &f.SortOrder, &f.CreatedAt, &f.UpdatedAt); err != nil {
			return nil, err
		}
		f.ImageURL = img.String
		f.Icon = icon.String
		if imagesJson.Valid && imagesJson.String != "" {
			_ = json.Unmarshal([]byte(imagesJson.String), &f.Images)
		}
		if f.Images == nil {
			f.Images = []string{}
		}
		facilities = append(facilities, f)
	}
	return facilities, nil
}

func (r *Repository) CreateFacility(ctx context.Context, payload models.Facility) (int64, error) {
	imagesBytes, _ := json.Marshal(payload.Images)
	res, err := r.db.ExecContext(ctx, `
		INSERT INTO facilities (name, description, image_url, images_json, icon, sort_order)
		VALUES (?, ?, ?, ?, ?, ?)
	`, payload.Name, payload.Description, payload.ImageURL, string(imagesBytes), payload.Icon, payload.SortOrder)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (r *Repository) UpdateFacility(ctx context.Context, id int64, payload models.Facility) error {
	imagesBytes, _ := json.Marshal(payload.Images)
	res, err := r.db.ExecContext(ctx, `
		UPDATE facilities
		SET name = ?, description = ?, image_url = ?, images_json = ?, icon = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP
		WHERE id = ?
	`, payload.Name, payload.Description, payload.ImageURL, string(imagesBytes), payload.Icon, payload.SortOrder, id)
	if err != nil {
		return err
	}
	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *Repository) DeleteFacility(ctx context.Context, id int64) error {
	res, err := r.db.ExecContext(ctx, "DELETE FROM facilities WHERE id = ?", id)
	if err != nil {
		return err
	}
	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}
	return nil
}

// --- Achievements CRUD ---
func (r *Repository) Achievements(ctx context.Context) ([]models.Achievement, error) {
	rows, err := r.db.QueryContext(ctx, "SELECT id, title, description, image_url, student_name, achievement_level, achieved_at, created_at FROM achievements ORDER BY achieved_at DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.Achievement
	for rows.Next() {
		var item models.Achievement
		if err := rows.Scan(&item.ID, &item.Title, &item.Description, &item.ImageURL, &item.StudentName, &item.AchievementLevel, &item.AchievedAt, &item.CreatedAt); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, nil
}

func (r *Repository) CreateAchievement(ctx context.Context, item models.Achievement) (int64, error) {
	res, err := r.db.ExecContext(ctx, `
		INSERT INTO achievements (title, description, image_url, student_name, achievement_level, achieved_at)
		VALUES (?, ?, ?, ?, ?, ?)
	`, item.Title, item.Description, item.ImageURL, item.StudentName, item.AchievementLevel, item.AchievedAt)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (r *Repository) UpdateAchievement(ctx context.Context, id int64, item models.Achievement) error {
	res, err := r.db.ExecContext(ctx, `
		UPDATE achievements
		SET title = ?, description = ?, image_url = ?, student_name = ?, achievement_level = ?, achieved_at = ?
		WHERE id = ?
	`, item.Title, item.Description, item.ImageURL, item.StudentName, item.AchievementLevel, item.AchievedAt, id)
	if err != nil {
		return err
	}
	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *Repository) DeleteAchievement(ctx context.Context, id int64) error {
	res, err := r.db.ExecContext(ctx, "DELETE FROM achievements WHERE id = ?", id)
	if err != nil {
		return err
	}
	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}
	return nil
}

// --- IndustryPartner CRUD ---
func (r *Repository) IndustryPartners(ctx context.Context) ([]models.IndustryPartner, error) {
	rows, err := r.db.QueryContext(ctx, "SELECT id, name, logo_url, description, field_of_industry, website_url, sort_order, created_at FROM industry_partners ORDER BY sort_order ASC, created_at DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.IndustryPartner
	for rows.Next() {
		var item models.IndustryPartner
		if err := rows.Scan(&item.ID, &item.Name, &item.LogoURL, &item.Description, &item.FieldOfIndustry, &item.WebsiteURL, &item.SortOrder, &item.CreatedAt); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, nil
}

func (r *Repository) CreateIndustryPartner(ctx context.Context, item models.IndustryPartner) (int64, error) {
	res, err := r.db.ExecContext(ctx, `
		INSERT INTO industry_partners (name, logo_url, description, field_of_industry, website_url, sort_order)
		VALUES (?, ?, ?, ?, ?, ?)
	`, item.Name, item.LogoURL, item.Description, item.FieldOfIndustry, item.WebsiteURL, item.SortOrder)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (r *Repository) UpdateIndustryPartner(ctx context.Context, id int64, item models.IndustryPartner) error {
	res, err := r.db.ExecContext(ctx, `
		UPDATE industry_partners
		SET name = ?, logo_url = ?, description = ?, field_of_industry = ?, website_url = ?, sort_order = ?
		WHERE id = ?
	`, item.Name, item.LogoURL, item.Description, item.FieldOfIndustry, item.WebsiteURL, item.SortOrder, id)
	if err != nil {
		return err
	}
	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *Repository) DeleteIndustryPartner(ctx context.Context, id int64) error {
	res, err := r.db.ExecContext(ctx, "DELETE FROM industry_partners WHERE id = ?", id)
	if err != nil {
		return err
	}
	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}
	return nil
}

// --- Alumni CRUD ---
func (r *Repository) Alumni(ctx context.Context) ([]models.Alumni, error) {
	rows, err := r.db.QueryContext(ctx, "SELECT id, name, graduation_year, current_status, company_or_university, testimonial, image_url, created_at FROM alumni ORDER BY graduation_year DESC, created_at DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.Alumni
	for rows.Next() {
		var item models.Alumni
		if err := rows.Scan(&item.ID, &item.Name, &item.GraduationYear, &item.CurrentStatus, &item.CompanyOrUniversity, &item.Testimonial, &item.ImageURL, &item.CreatedAt); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, nil
}

func (r *Repository) CreateAlumni(ctx context.Context, item models.Alumni) (int64, error) {
	res, err := r.db.ExecContext(ctx, `
		INSERT INTO alumni (name, graduation_year, current_status, company_or_university, testimonial, image_url)
		VALUES (?, ?, ?, ?, ?, ?)
	`, item.Name, item.GraduationYear, item.CurrentStatus, item.CompanyOrUniversity, item.Testimonial, item.ImageURL)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (r *Repository) UpdateAlumni(ctx context.Context, id int64, item models.Alumni) error {
	res, err := r.db.ExecContext(ctx, `
		UPDATE alumni
		SET name = ?, graduation_year = ?, current_status = ?, company_or_university = ?, testimonial = ?, image_url = ?
		WHERE id = ?
	`, item.Name, item.GraduationYear, item.CurrentStatus, item.CompanyOrUniversity, item.Testimonial, item.ImageURL, id)
	if err != nil {
		return err
	}
	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *Repository) DeleteAlumni(ctx context.Context, id int64) error {
	res, err := r.db.ExecContext(ctx, "DELETE FROM alumni WHERE id = ?", id)
	if err != nil {
		return err
	}
	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *Repository) GetAlumniStats(ctx context.Context) ([]models.AlumniStat, error) {
	rows, err := r.db.QueryContext(ctx, "SELECT current_status, COUNT(*) FROM alumni GROUP BY current_status")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var stats []models.AlumniStat
	for rows.Next() {
		var stat models.AlumniStat
		if err := rows.Scan(&stat.Status, &stat.Count); err != nil {
			return nil, err
		}
		stats = append(stats, stat)
	}
	return stats, nil
}

// --- FAQ CRUD ---
func (r *Repository) FAQs(ctx context.Context) ([]models.FAQ, error) {
	rows, err := r.db.QueryContext(ctx, "SELECT id, question, answer, category, sort_order, created_at FROM faqs ORDER BY sort_order ASC, created_at DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.FAQ
	for rows.Next() {
		var item models.FAQ
		if err := rows.Scan(&item.ID, &item.Question, &item.Answer, &item.Category, &item.SortOrder, &item.CreatedAt); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, nil
}

func (r *Repository) CreateFAQ(ctx context.Context, item models.FAQ) (int64, error) {
	res, err := r.db.ExecContext(ctx, `
		INSERT INTO faqs (question, answer, category, sort_order)
		VALUES (?, ?, ?, ?)
	`, item.Question, item.Answer, item.Category, item.SortOrder)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (r *Repository) UpdateFAQ(ctx context.Context, id int64, item models.FAQ) error {
	res, err := r.db.ExecContext(ctx, `
		UPDATE faqs
		SET question = ?, answer = ?, category = ?, sort_order = ?
		WHERE id = ?
	`, item.Question, item.Answer, item.Category, item.SortOrder, id)
	if err != nil {
		return err
	}
	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *Repository) DeleteFAQ(ctx context.Context, id int64) error {
	res, err := r.db.ExecContext(ctx, "DELETE FROM faqs WHERE id = ?", id)
	if err != nil {
		return err
	}
	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *Repository) CreateSpmbRegistration(ctx context.Context, item models.SpmbRegistration) (models.SpmbRegistration, error) {
	item.FullName = strings.TrimSpace(item.FullName)
	item.WhatsappNumber = strings.TrimSpace(item.WhatsappNumber)
	item.CurrentAddress = strings.TrimSpace(item.CurrentAddress)
	item.PreviousSchool = strings.TrimSpace(item.PreviousSchool)
	item.InfoSource = strings.TrimSpace(item.InfoSource)
	item.FatherName = strings.TrimSpace(item.FatherName)
	item.MotherName = strings.TrimSpace(item.MotherName)
	item.AcademicYear = strings.TrimSpace(item.AcademicYear)

	if item.FullName == "" || item.WhatsappNumber == "" || item.CurrentAddress == "" ||
		item.PreviousSchool == "" || item.InfoSource == "" || item.FatherName == "" ||
		item.MotherName == "" || item.SelectedMajorID <= 0 {
		return item, errors.New("semua data pendaftaran wajib diisi")
	}

	err := r.db.QueryRowContext(ctx, `
		SELECT name
		FROM majors
		WHERE id = ? AND is_active = true
	`, item.SelectedMajorID).Scan(&item.SelectedMajorName)
	if errors.Is(err, sql.ErrNoRows) {
		return item, errors.New("jurusan pilihan tidak tersedia")
	}
	if err != nil {
		return item, err
	}

	if item.AcademicYear == "" {
		item.AcademicYear = "2026/2027"
	}
	item.RegistrationNumber = newSpmbRegistrationNumber()

	result, err := r.db.ExecContext(ctx, `
		INSERT INTO spmb_registrations (
			registration_number, full_name, whatsapp_number, current_address, previous_school,
			info_source, father_name, mother_name, selected_major_id, selected_major_name, academic_year
		)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, item.RegistrationNumber, item.FullName, item.WhatsappNumber, item.CurrentAddress, item.PreviousSchool,
		item.InfoSource, item.FatherName, item.MotherName, item.SelectedMajorID, item.SelectedMajorName, item.AcademicYear)
	if err != nil {
		return item, err
	}
	item.ID, err = result.LastInsertId()
	if err != nil {
		return item, err
	}
	return item, nil
}

func (r *Repository) SpmbRegistrations(ctx context.Context) ([]models.SpmbRegistration, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, registration_number, full_name, whatsapp_number, current_address, previous_school,
		       info_source, father_name, mother_name, COALESCE(selected_major_id, 0), selected_major_name,
		       academic_year, created_at
		FROM spmb_registrations
		ORDER BY created_at DESC
		LIMIT 500
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.SpmbRegistration
	for rows.Next() {
		var item models.SpmbRegistration
		if err := rows.Scan(
			&item.ID,
			&item.RegistrationNumber,
			&item.FullName,
			&item.WhatsappNumber,
			&item.CurrentAddress,
			&item.PreviousSchool,
			&item.InfoSource,
			&item.FatherName,
			&item.MotherName,
			&item.SelectedMajorID,
			&item.SelectedMajorName,
			&item.AcademicYear,
			&item.CreatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func newSpmbRegistrationNumber() string {
	return "SPMB-" + time.Now().Format("20060102-150405000000000")
}
