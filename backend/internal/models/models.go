package models

import "time"

type Role string

const (
	RoleSuperadmin  Role = "superadmin"
	RoleAdmin       Role = "admin"
	RoleContributor Role = "contributor"
)

type User struct {
	ID           int64     `json:"id"`
	Name         string    `json:"name"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	Role         Role      `json:"role"`
	IsActive     bool      `json:"isActive"`
	CreatedAt    time.Time `json:"createdAt"`
}

type SchoolProfile struct {
	Name             string              `json:"name"`
	Tagline          string              `json:"tagline"`
	Description      string              `json:"description"`
	Address          string              `json:"address"`
	Phone            string              `json:"phone"`
	Email            string              `json:"email"`
	MapEmbedURL      string              `json:"mapEmbedUrl"`
	PrincipalName    string              `json:"principalName"`
	PrincipalTitle   string              `json:"principalTitle"`
	PrincipalMessage string              `json:"principalMessage"`
	PrincipalImage   string              `json:"principalImage"`
	Stats            []map[string]string `json:"stats"`
}

type Major struct {
	ID              int64    `json:"id"`
	Name            string   `json:"name"`
	Slug            string   `json:"slug"`
	Summary         string   `json:"summary"`
	Icon            string   `json:"icon"`
	CoverImage      string   `json:"coverImage"`
	Curriculum      []string `json:"curriculum"`
	CareerProspects []string `json:"careerProspects"`
}

type Article struct {
	ID          int64     `json:"id"`
	Title       string    `json:"title"`
	Slug        string    `json:"slug"`
	Excerpt     string    `json:"excerpt"`
	Content     string    `json:"content,omitempty"`
	CoverImage  string    `json:"coverImage"`
	Category    string    `json:"category"`
	Status      string    `json:"status,omitempty"`
	PublishedAt time.Time `json:"publishedAt"`
	AuthorName  string    `json:"authorName"`
}

type Announcement struct {
	ID          int64     `json:"id"`
	Title       string    `json:"title"`
	Body        string    `json:"body"`
	Status      string    `json:"status,omitempty"`
	PublishedAt time.Time `json:"publishedAt"`
}

type Agenda struct {
	ID       int64     `json:"id"`
	Title    string    `json:"title"`
	Location string    `json:"location"`
	StartsAt time.Time `json:"startsAt"`
}
