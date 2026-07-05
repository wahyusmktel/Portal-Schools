package models

import "time"

type Role string

const (
	RoleSuperadmin  Role = "superadmin"
	RoleAdmin       Role = "admin"
	RoleContributor Role = "contributor"
	RoleAdminSPMB   Role = "admin-spmb"
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
	YoutubeEmbedURL  string              `json:"youtubeEmbedUrl"`
	PrincipalName    string              `json:"principalName"`
	PrincipalTitle   string              `json:"principalTitle"`
	PrincipalMessage string              `json:"principalMessage"`
	PrincipalImage   string              `json:"principalImage"`
	Vision           string              `json:"vision"`
	Mission          string              `json:"mission"`
	SpmbBrochureURL  string              `json:"spmbBrochureUrl"`
	SpmbAcademicYear string              `json:"spmbAcademicYear"`
	Stats            []map[string]string `json:"stats"`
	SocialMedia      []map[string]string `json:"socialMedia"`
	PartnerLinks     []map[string]string `json:"partnerLinks"`
	HeaderLogo       string              `json:"headerLogo"`
	FooterLogo       string              `json:"footerLogo"`
	FooterText       string              `json:"footerText"`
}

type HeroSlide struct {
	ID          int64  `json:"id"`
	Title       string `json:"title"`
	Subtitle    string `json:"subtitle"`
	ImageURL    string `json:"imageUrl"`
	Eyebrow     string `json:"eyebrow"`
	PrimaryText string `json:"primaryText"`
	PrimaryURL  string `json:"primaryUrl"`
	SecondText  string `json:"secondText"`
	SecondURL   string `json:"secondUrl"`
	SortOrder   int    `json:"sortOrder"`
	IsActive    bool   `json:"isActive"`
	CreatedAt   string `json:"createdAt"`
	UpdatedAt   string `json:"updatedAt"`
}

type WhyChooseUsItem struct {
	ID          int64  `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
	Highlight   string `json:"highlight"`
	SortOrder   int    `json:"sortOrder"`
	IsActive    bool   `json:"isActive"`
	CreatedAt   string `json:"createdAt"`
	UpdatedAt   string `json:"updatedAt"`
}

type SchoolUVPItem struct {
	ID          int64  `json:"id"`
	Title       string `json:"title"`
	Subtitle    string `json:"subtitle"`
	Description string `json:"description"`
	Category    string `json:"category"`
	Icon        string `json:"icon"`
	Highlight   string `json:"highlight"`
	SortOrder   int    `json:"sortOrder"`
	IsActive    bool   `json:"isActive"`
	CreatedAt   string `json:"createdAt"`
	UpdatedAt   string `json:"updatedAt"`
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

type TeachingModule struct {
	ID            int64  `json:"id"`
	Title         string `json:"title"`
	Slug          string `json:"slug"`
	Description   string `json:"description"`
	Subject       string `json:"subject"`
	GradeLevel    string `json:"gradeLevel"`
	AuthorName    string `json:"authorName"`
	CoverImage    string `json:"coverImage"`
	FileURL       string `json:"fileUrl"`
	FileSize      int64  `json:"fileSize"`
	PageCount     int    `json:"pageCount"`
	ViewCount     int    `json:"viewCount"`
	DownloadCount int    `json:"downloadCount"`
	SortOrder     int    `json:"sortOrder"`
	IsPublished   bool   `json:"isPublished"`
	CreatedAt     string `json:"createdAt"`
	UpdatedAt     string `json:"updatedAt"`
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
	ViewCount   int       `json:"viewCount"`
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

type SocialLink struct {
	Label string `json:"label"`
	Value string `json:"value"`
}

type Employee struct {
	ID               int64        `json:"id"`
	Name             string       `json:"name"`
	Role             string       `json:"role"`
	Biography        string       `json:"biography"`
	ImageURL         string       `json:"imageUrl"`
	SocialLinksJSON  string       `json:"-"`
	SocialLinks      []SocialLink `json:"socialLinks"`
	EmploymentPeriod string       `json:"employmentPeriod"`
	IsActive         bool         `json:"isActive"`
	SortOrder        int          `json:"sortOrder"`
	CreatedAt        string       `json:"createdAt"`
	UpdatedAt        string       `json:"updatedAt"`
}

type Facility struct {
	ID          int64    `json:"id"`
	Name        string   `json:"name"`
	Description string   `json:"description"`
	ImageURL    string   `json:"imageUrl"`
	Images      []string `json:"images"`
	Icon        string   `json:"icon"`
	SortOrder   int      `json:"sortOrder"`
	CreatedAt   string   `json:"createdAt"`
	UpdatedAt   string   `json:"updatedAt"`
}

type Achievement struct {
	ID               int64  `json:"id"`
	Title            string `json:"title"`
	Description      string `json:"description"`
	ImageURL         string `json:"imageUrl"`
	StudentName      string `json:"studentName"`
	AchievementLevel string `json:"achievementLevel"`
	AchievedAt       string `json:"achievedAt"`
	CreatedAt        string `json:"createdAt"`
}

type IndustryPartner struct {
	ID              int64  `json:"id"`
	Name            string `json:"name"`
	LogoURL         string `json:"logoUrl"`
	Description     string `json:"description"`
	FieldOfIndustry string `json:"fieldOfIndustry"`
	WebsiteURL      string `json:"websiteUrl"`
	SortOrder       int    `json:"sortOrder"`
	CreatedAt       string `json:"createdAt"`
}

type Alumni struct {
	ID                  int64  `json:"id"`
	Name                string `json:"name"`
	GraduationYear      int    `json:"graduationYear"`
	CurrentStatus       string `json:"currentStatus"`
	CompanyOrUniversity string `json:"companyOrUniversity"`
	Testimonial         string `json:"testimonial"`
	ImageURL            string `json:"imageUrl"`
	CreatedAt           string `json:"createdAt"`
}

type AlumniStat struct {
	Status string `json:"status"`
	Count  int    `json:"count"`
}

type FAQ struct {
	ID        int64  `json:"id"`
	Question  string `json:"question"`
	Answer    string `json:"answer"`
	Category  string `json:"category"`
	SortOrder int    `json:"sortOrder"`
	CreatedAt string `json:"createdAt"`
}

type SpmbRegistration struct {
	ID                 int64  `json:"id"`
	RegistrationNumber string `json:"registrationNumber"`
	FullName           string `json:"fullName"`
	WhatsappNumber     string `json:"whatsappNumber"`
	CurrentAddress     string `json:"currentAddress"`
	PreviousSchool     string `json:"previousSchool"`
	InfoSource         string `json:"infoSource"`
	FatherName         string `json:"fatherName"`
	MotherName         string `json:"motherName"`
	SelectedMajorID    int64  `json:"selectedMajorId"`
	SelectedMajorName  string `json:"selectedMajorName"`
	AcademicYear       string `json:"academicYear"`
	CreatedAt          string `json:"createdAt"`
}
