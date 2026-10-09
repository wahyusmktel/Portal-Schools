package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"html"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"portal-smktelkom/backend/internal/httpx"
	"portal-smktelkom/backend/internal/models"
)

type importRemoteModuleRequest struct {
	URL         string `json:"url"`
	AutoSave    bool   `json:"autoSave"`
	IsPublished bool   `json:"isPublished"`
}

type importRemoteModuleResponse struct {
	ID          int64  `json:"id,omitempty"`
	Title       string `json:"title"`
	Slug        string `json:"slug"`
	Description string `json:"description"`
	Subject     string `json:"subject"`
	GradeLevel  string `json:"gradeLevel"`
	AuthorName  string `json:"authorName"`
	CoverImage  string `json:"coverImage"`
	FileURL     string `json:"fileUrl"`
	FileSize    int64  `json:"fileSize"`
	PageCount   int    `json:"pageCount"`
	IsPublished bool   `json:"isPublished"`
	Message     string `json:"message,omitempty"`
}

type sibiDetailAPIResponse struct {
	Status  string          `json:"status"`
	Results json.RawMessage `json:"results"`
	Message string          `json:"message"`
}

type sibiBookItem struct {
	ID          any    `json:"id"`
	Title       string `json:"title"`
	Slug        string `json:"slug"`
	Image       string `json:"image"`
	Attachment  string `json:"attachment"`
	Description string `json:"description"`
	Class       string `json:"class"`
	Level       string `json:"level"`
	Writer      string `json:"writer"`
	Publisher   string `json:"publisher"`
	Subject     string `json:"subject"`
	ISBN        string `json:"isbn"`
	Curriculum  string `json:"curriculum"`
	Edition     string `json:"edition"`
}

func (h *Handler) importRemoteTeachingModule(w http.ResponseWriter, r *http.Request) {
	var payload importRemoteModuleRequest
	if err := httpx.DecodeJSON(r, &payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "Payload tidak valid")
		return
	}

	targetURL := strings.TrimSpace(payload.URL)
	if targetURL == "" {
		httpx.Error(w, http.StatusBadRequest, "URL remote wajib diisi")
		return
	}

	if !strings.HasPrefix(targetURL, "http://") && !strings.HasPrefix(targetURL, "https://") {
		targetURL = "https://" + targetURL
	}

	parsedURL, err := url.Parse(targetURL)
	if err != nil || parsedURL.Host == "" {
		httpx.Error(w, http.StatusBadRequest, "URL tidak valid")
		return
	}

	httpClient := &http.Client{
		Timeout: 180 * time.Second,
	}

	var (
		title       string
		description string
		subject     string
		gradeLevel  string
		authorName  string
		remoteCover string
		remotePDF   string
	)

	// 1. Cek apakah link berasal dari SIBI Kemendikdasmen / Kemendikbud
	if isSibiCatalogURL(parsedURL) {
		slug := extractSibiSlug(parsedURL)
		if slug == "" {
			httpx.Error(w, http.StatusBadRequest, "Slug buku katalog Kemendikdasmen tidak ditemukan pada URL")
			return
		}

		book, err := fetchSibiBookDetail(r.Context(), httpClient, slug)
		if err != nil {
			httpx.Error(w, http.StatusBadRequest, fmt.Sprintf("Gagal mendeteksi modul Kemendikdasmen: %v", err))
			return
		}

		title = strings.TrimSpace(book.Title)
		remoteCover = strings.TrimSpace(book.Image)
		remotePDF = strings.TrimSpace(book.Attachment)

		// Subject
		subject = cleanSubject(book.Subject)

		// Grade Level
		gradeLevel = cleanGradeLevel(book.Class, book.Level)

		// Author / Publisher
		authorName = strings.TrimSpace(book.Writer)
		if authorName == "" {
			authorName = strings.TrimSpace(book.Publisher)
		}
		if authorName == "" {
			authorName = "Kemendikdasmen"
		}

		// Description
		description = strings.TrimSpace(book.Description)
		if description == "" {
			description = buildSibiDescription(book)
		}
	} else {
		// 2. Generic Scraper (Website umum atau direct PDF link)
		scraped, err := scrapeGenericModulePage(r.Context(), httpClient, targetURL)
		if err != nil {
			httpx.Error(w, http.StatusBadRequest, fmt.Sprintf("Gagal memproses halaman modul: %v", err))
			return
		}

		title = scraped.title
		description = scraped.description
		subject = scraped.subject
		gradeLevel = scraped.gradeLevel
		authorName = scraped.authorName
		remoteCover = scraped.remoteCover
		remotePDF = scraped.remotePDF
	}

	if title == "" {
		title = "Modul Ajar Pembelajaran"
	}
	if subject == "" {
		subject = "Umum"
	}
	if gradeLevel == "" {
		gradeLevel = "Semua Tingkat"
	}
	if authorName == "" {
		authorName = "SMK Telkom Lampung"
	}
	if description == "" {
		description = fmt.Sprintf("Modul ajar %s untuk mendukung proses belajar mengajar peserta didik.", title)
	}

	if remotePDF == "" {
		httpx.Error(w, http.StatusBadRequest, "File PDF modul tidak ditemukan pada link yang diberikan. Pastikan halaman memiliki tautan unduh PDF.")
		return
	}

	// 3. Unduh file PDF dan simpan ke server lokal
	localPDFPath, fileSize, pageCount, err := downloadRemotePDF(r.Context(), httpClient, remotePDF, title)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, fmt.Sprintf("Gagal mengunduh file PDF ke server: %v", err))
		return
	}
	absolutePDFURL := absoluteUploadURL(r, localPDFPath)

	// 4. Unduh cover gambar jika tersedia dan simpan ke server lokal
	var absoluteCoverURL string
	if remoteCover != "" {
		localCoverPath, err := downloadRemoteCover(r.Context(), httpClient, remoteCover, title)
		if err == nil && localCoverPath != "" {
			absoluteCoverURL = absoluteUploadURL(r, localCoverPath)
		}
	}

	resp := importRemoteModuleResponse{
		Title:       title,
		Slug:        safeFilename(title),
		Description: description,
		Subject:     subject,
		GradeLevel:  gradeLevel,
		AuthorName:  authorName,
		CoverImage:  absoluteCoverURL,
		FileURL:      absolutePDFURL,
		FileSize:     fileSize,
		PageCount:    pageCount,
		IsPublished:  payload.IsPublished,
	}

	// 5. Opsi Auto-Save jika dicentang oleh user
	if payload.AutoSave {
		moduleRecord := models.TeachingModule{
			Title:       title,
			Description: description,
			Subject:     subject,
			GradeLevel:  gradeLevel,
			AuthorName:  authorName,
			CoverImage:  absoluteCoverURL,
			FileURL:      absolutePDFURL,
			FileSize:     fileSize,
			PageCount:    pageCount,
			SortOrder:    0,
			IsPublished:  payload.IsPublished,
		}

		newID, err := h.repo.CreateTeachingModule(r.Context(), moduleRecord)
		if err != nil {
			httpx.Error(w, http.StatusBadRequest, fmt.Sprintf("File berhasil diunduh namun gagal menyimpan ke database: %v", err))
			return
		}
		resp.ID = newID
		resp.Message = "Modul ajar berhasil diunduh dan disimpan ke database!"
		httpx.JSON(w, http.StatusCreated, resp)
		return
	}

	resp.Message = "Data dan file modul berhasil dideteksi serta diunduh ke server."
	httpx.JSON(w, http.StatusOK, resp)
}

func isSibiCatalogURL(u *url.URL) bool {
	host := strings.ToLower(u.Hostname())
	return strings.Contains(host, "buku.kemendikdasmen.go.id") ||
		strings.Contains(host, "buku.kemendikbud.go.id") ||
		strings.Contains(host, "buku.cloudapp.web.id")
}

func extractSibiSlug(u *url.URL) string {
	// e.g. /katalog/Kelas-VI-Tema-8-Bumiku or /katalog/buku-kurikulum-merdeka/Kelas-X-Informatika
	trimmed := strings.Trim(u.Path, "/")
	if trimmed == "" {
		return ""
	}
	parts := strings.Split(trimmed, "/")
	last := parts[len(parts)-1]
	unescaped, err := url.PathUnescape(last)
	if err == nil && unescaped != "" {
		return unescaped
	}
	return last
}

func fetchSibiBookDetail(ctx context.Context, client *http.Client, slug string) (*sibiBookItem, error) {
	apiURL := fmt.Sprintf("https://api.buku.cloudapp.web.id/api/catalogue/getDetails?slug=%s", url.QueryEscape(slug))
	req, err := http.NewRequestWithContext(ctx, "GET", apiURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
	req.Header.Set("Accept", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("HTTP %d dari server katalog Kemendikdasmen", resp.StatusCode)
	}

	var apiResp sibiDetailAPIResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		return nil, err
	}

	if len(apiResp.Results) == 0 || apiResp.Results[0] != '{' {
		return nil, errors.New("katalog buku tidak ditemukan atau belum tersedia")
	}

	var book sibiBookItem
	if err := json.Unmarshal(apiResp.Results, &book); err != nil {
		return nil, err
	}

	return &book, nil
}

func cleanSubject(raw string) string {
	s := strings.TrimSpace(raw)
	if s == "" {
		return "Umum"
	}
	s = strings.ReplaceAll(s, "_", " ")
	s = strings.ReplaceAll(s, "-", " ")
	words := strings.Fields(s)
	for i, w := range words {
		if len(w) > 0 {
			words[i] = strings.ToUpper(w[:1]) + strings.ToLower(w[1:])
		}
	}
	return strings.Join(words, " ")
}

func cleanGradeLevel(class, level string) string {
	c := strings.TrimSpace(class)
	l := strings.TrimSpace(level)
	if c != "" && l != "" {
		return fmt.Sprintf("%s Kelas %s", l, c)
	}
	if c != "" {
		return fmt.Sprintf("Kelas %s", c)
	}
	if l != "" {
		return l
	}
	return "Semua Tingkat"
}

func buildSibiDescription(book *sibiBookItem) string {
	var parts []string
	if book.Title != "" {
		parts = append(parts, fmt.Sprintf("Buku %s.", book.Title))
	}
	if book.Level != "" || book.Class != "" {
		parts = append(parts, fmt.Sprintf("Ditujukan untuk peserta didik %s.", cleanGradeLevel(book.Class, book.Level)))
	}
	if book.Curriculum != "" {
		parts = append(parts, fmt.Sprintf("Kurikulum %s.", book.Curriculum))
	}
	if book.Publisher != "" {
		parts = append(parts, fmt.Sprintf("Diterbitkan oleh %s.", book.Publisher))
	}
	if book.Writer != "" {
		parts = append(parts, fmt.Sprintf("Penulis: %s.", book.Writer))
	}
	if book.Edition != "" {
		parts = append(parts, fmt.Sprintf("Edisi tahun %s.", book.Edition))
	}
	if book.ISBN != "" {
		parts = append(parts, fmt.Sprintf("ISBN: %s.", book.ISBN))
	}
	return strings.Join(parts, " ")
}

type scrapedModule struct {
	title       string
	description string
	subject     string
	gradeLevel  string
	authorName  string
	remoteCover string
	remotePDF   string
}

func scrapeGenericModulePage(ctx context.Context, client *http.Client, pageURL string) (*scrapedModule, error) {
	// Cek jika URL langsung merupakan file PDF
	parsedURL, _ := url.Parse(pageURL)
	lowerPath := strings.ToLower(parsedURL.Path)
	if strings.HasSuffix(lowerPath, ".pdf") {
		filename := filepath.Base(parsedURL.Path)
		filename = strings.TrimSuffix(filename, filepath.Ext(filename))
		cleanTitle := strings.ReplaceAll(filename, "-", " ")
		cleanTitle = strings.ReplaceAll(cleanTitle, "_", " ")
		return &scrapedModule{
			title:       strings.Title(cleanTitle),
			description: fmt.Sprintf("Dokumen modul ajar PDF yang diunduh dari %s.", parsedURL.Host),
			subject:     "Umum",
			gradeLevel:  "Semua Tingkat",
			authorName:  "SMK Telkom Lampung",
			remoteCover: "",
			remotePDF:   pageURL,
		}, nil
	}

	req, err := http.NewRequestWithContext(ctx, "GET", pageURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("HTTP %d saat mengakses halaman", resp.StatusCode)
	}

	// Jika Content-Type adalah PDF
	if strings.Contains(strings.ToLower(resp.Header.Get("Content-Type")), "application/pdf") {
		filename := filepath.Base(parsedURL.Path)
		filename = strings.TrimSuffix(filename, filepath.Ext(filename))
		cleanTitle := strings.ReplaceAll(filename, "-", " ")
		cleanTitle = strings.ReplaceAll(cleanTitle, "_", " ")
		return &scrapedModule{
			title:       strings.Title(cleanTitle),
			description: fmt.Sprintf("Dokumen modul ajar PDF yang diunduh dari %s.", parsedURL.Host),
			subject:     "Umum",
			gradeLevel:  "Semua Tingkat",
			authorName:  "SMK Telkom Lampung",
			remotePDF:   pageURL,
		}, nil
	}

	bodyBytes, err := io.ReadAll(io.LimitReader(resp.Body, 2*1024*1024))
	if err != nil {
		return nil, err
	}
	htmlContent := string(bodyBytes)

	res := &scrapedModule{
		subject:    "Umum",
		gradeLevel: "Semua Tingkat",
		authorName: "SMK Telkom Lampung",
	}

	// 1. Title
	if match := regexp.MustCompile(`(?i)<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']`).FindStringSubmatch(htmlContent); len(match) > 1 {
		res.title = html.UnescapeString(match[1])
	} else if match := regexp.MustCompile(`(?i)<title[^>]*>([^<]+)</title>`).FindStringSubmatch(htmlContent); len(match) > 1 {
		res.title = html.UnescapeString(strings.TrimSpace(match[1]))
	}

	// 2. Description
	if match := regexp.MustCompile(`(?i)<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']`).FindStringSubmatch(htmlContent); len(match) > 1 {
		res.description = html.UnescapeString(match[1])
	} else if match := regexp.MustCompile(`(?i)<meta\s+name=["']description["']\s+content=["']([^"']+)["']`).FindStringSubmatch(htmlContent); len(match) > 1 {
		res.description = html.UnescapeString(match[1])
	}

	// 3. Cover Image
	if match := regexp.MustCompile(`(?i)<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']`).FindStringSubmatch(htmlContent); len(match) > 1 {
		imgURL := html.UnescapeString(match[1])
		if ref, err := url.Parse(imgURL); err == nil {
			res.remoteCover = parsedURL.ResolveReference(ref).String()
		}
	}

	// 4. Author
	if match := regexp.MustCompile(`(?i)<meta\s+name=["']author["']\s+content=["']([^"']+)["']`).FindStringSubmatch(htmlContent); len(match) > 1 {
		res.authorName = html.UnescapeString(match[1])
	}

	// 5. Cari link download PDF di dalam halaman
	pdfRe := regexp.MustCompile(`(?i)<a[^>]+href=["']([^"']+\.pdf(?:\?[^"']*)?)["']`)
	if match := pdfRe.FindStringSubmatch(htmlContent); len(match) > 1 {
		foundPDF := html.UnescapeString(match[1])
		if ref, err := url.Parse(foundPDF); err == nil {
			res.remotePDF = parsedURL.ResolveReference(ref).String()
		}
	}

	return res, nil
}

func downloadRemoteCover(ctx context.Context, client *http.Client, imageURL string, title string) (string, error) {
	if strings.TrimSpace(imageURL) == "" {
		return "", nil
	}

	req, err := http.NewRequestWithContext(ctx, "GET", imageURL, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("HTTP %d saat unduh cover", resp.StatusCode)
	}

	ext := ".png"
	ct := strings.ToLower(resp.Header.Get("Content-Type"))
	if strings.Contains(ct, "jpeg") || strings.Contains(ct, "jpg") {
		ext = ".jpg"
	} else if strings.Contains(ct, "webp") {
		ext = ".webp"
	}

	targetDir := filepath.Join("uploads", "images")
	if err := os.MkdirAll(targetDir, 0755); err != nil {
		return "", err
	}

	filename := fmt.Sprintf("%d-%s%s", time.Now().UnixNano(), safeFilename(title), ext)
	targetPath := filepath.Join(targetDir, filename)
	file, err := os.OpenFile(targetPath, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0644)
	if err != nil {
		return "", err
	}
	defer file.Close()

	if _, err := io.Copy(file, io.LimitReader(resp.Body, 15*1024*1024)); err != nil {
		os.Remove(targetPath)
		return "", err
	}

	return "/uploads/images/" + filename, nil
}

func downloadRemotePDF(ctx context.Context, client *http.Client, pdfURL string, title string) (string, int64, int, error) {
	if strings.TrimSpace(pdfURL) == "" {
		return "", 0, 0, errors.New("link PDF tidak ditemukan")
	}

	req, err := http.NewRequestWithContext(ctx, "GET", pdfURL, nil)
	if err != nil {
		return "", 0, 0, err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

	resp, err := client.Do(req)
	if err != nil {
		return "", 0, 0, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", 0, 0, fmt.Errorf("HTTP %d saat unduh PDF", resp.StatusCode)
	}

	targetDir := filepath.Join("uploads", "documents")
	if err := os.MkdirAll(targetDir, 0755); err != nil {
		return "", 0, 0, err
	}

	filename := fmt.Sprintf("%d-%s.pdf", time.Now().UnixNano(), safeFilename(title))
	targetPath := filepath.Join(targetDir, filename)
	file, err := os.OpenFile(targetPath, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0644)
	if err != nil {
		return "", 0, 0, err
	}
	defer file.Close()

	// Batas maks 200MB untuk buku / modul ajar
	written, err := io.Copy(file, io.LimitReader(resp.Body, 200*1024*1024))
	if err != nil {
		os.Remove(targetPath)
		return "", 0, 0, err
	}

	// Verifikasi apakah file berformat PDF
	pdfCheck, err := os.Open(targetPath)
	if err != nil {
		return "", 0, 0, err
	}
	defer pdfCheck.Close()

	headerBuf := make([]byte, 512)
	n, _ := pdfCheck.Read(headerBuf)
	if n < 4 || !bytes.HasPrefix(headerBuf[:n], []byte("%PDF")) {
		os.Remove(targetPath)
		return "", 0, 0, errors.New("file yang diunduh dari link bukan dokumen PDF yang valid")
	}

	// Hitung jumlah halaman PDF
	pageCount := 0
	if written <= 120*1024*1024 {
		contentBytes, err := os.ReadFile(targetPath)
		if err == nil {
			pageRe := regexp.MustCompile(`(?i)/Type\s*/Page\b`)
			matches := pageRe.FindAll(contentBytes, -1)
			pageCount = len(matches)
		}
	}

	return "/uploads/documents/" + filename, written, pageCount, nil
}
