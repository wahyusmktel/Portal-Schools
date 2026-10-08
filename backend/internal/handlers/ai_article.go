package handlers

import (
	"bytes"
	"context"
	"encoding/json"
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
)

type generateArticleRequest struct {
	Topic                 string `json:"topic"`
	Paragraphs            int    `json:"paragraphs"`
	SentencesPerParagraph int    `json:"sentencesPerParagraph"`
	Category              string `json:"category"`
	SourceURL             string `json:"source_url"`
	SourceCaption         string `json:"source_caption"`
	ExtraInstructions     string `json:"extra_instructions"`
	UseRecommendation     bool   `json:"use_ai_recommendation"`
	IncludeCodeSnippets   bool   `json:"include_code_snippets"`
}

type generateArticleResponse struct {
	Title          string `json:"title"`
	Excerpt        string `json:"excerpt"`
	Category       string `json:"category"`
	Content        string `json:"content"`
	ParagraphCount int    `json:"paragraph_count"`
	SentenceCount  int    `json:"sentence_count"`
}

type extractURLRequest struct {
	URL string `json:"url"`
}

type extractedData struct {
	Platform  string `json:"platform"`
	SourceURL string `json:"source_url"`
	Title     string `json:"title"`
	Caption   string `json:"caption"`
	ImageURL  string `json:"image_url"`
	Author    string `json:"author"`
}

func (h *Handler) getAIStatus(w http.ResponseWriter, r *http.Request) {
	setting, err := h.repo.GetAISetting(r.Context())
	ready := err == nil && setting.IsActive && strings.TrimSpace(setting.APIKey) != ""
	httpx.JSON(w, http.StatusOK, map[string]interface{}{
		"ready": ready,
	})
}

func (h *Handler) extractSocialOrWebURL(w http.ResponseWriter, r *http.Request) {
	var req extractURLRequest
	if err := httpx.DecodeJSON(r, &req); err != nil {
		httpx.Error(w, http.StatusBadRequest, "payload tidak valid")
		return
	}

	req.URL = strings.TrimSpace(req.URL)
	if req.URL == "" {
		httpx.Error(w, http.StatusBadRequest, "URL wajib diisi")
		return
	}

	parsedURL, err := url.ParseRequestURI(req.URL)
	if err != nil || (parsedURL.Scheme != "http" && parsedURL.Scheme != "https") {
		httpx.JSON(w, http.StatusUnprocessableEntity, map[string]interface{}{
			"success": false,
			"message": "Format URL tidak valid. Pastikan menyertakan https://",
		})
		return
	}

	platform := detectPlatform(req.URL)

	// 1. YouTube oEmbed
	if platform == "YouTube" {
		data, err := fetchYouTubeOEmbed(req.URL)
		if err == nil && (data.Title != "" || data.Caption != "") {
			httpx.JSON(w, http.StatusOK, map[string]interface{}{
				"success": true,
				"data":    data,
			})
			return
		}
	}

	// 2. TikTok oEmbed
	if platform == "TikTok" {
		data, err := fetchTikTokOEmbed(req.URL)
		if err == nil && (data.Title != "" || data.Caption != "") {
			httpx.JSON(w, http.StatusOK, map[string]interface{}{
				"success": true,
				"data":    data,
			})
			return
		}
	}

	// 3. Instagram, Facebook, Web, fallback: Fetch HTML
	htmlContent, err := fetchHTMLWithUserAgents(req.URL)
	if err != nil || strings.TrimSpace(htmlContent) == "" {
		httpx.JSON(w, http.StatusUnprocessableEntity, map[string]interface{}{
			"success":    false,
			"platform":   platform,
			"source_url": req.URL,
			"message":    "Tidak dapat mengakses konten dari tautan tersebut (server tujuan menolak atau waktu habis).",
		})
		return
	}

	data := parseMetadata(htmlContent, platform, req.URL)
	if strings.TrimSpace(data.Caption) == "" && strings.TrimSpace(data.Title) == "" {
		httpx.JSON(w, http.StatusUnprocessableEntity, map[string]interface{}{
			"success":    false,
			"platform":   platform,
			"source_url": req.URL,
			"message":    "Tidak ada teks atau caption yang dapat diekstrak secara otomatis dari URL ini. Anda dapat menempelkan caption secara manual.",
		})
		return
	}

	httpx.JSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"data":    data,
	})
}

func detectPlatform(rawURL string) string {
	u, err := url.Parse(rawURL)
	if err != nil {
		return "Website"
	}
	host := strings.ToLower(u.Host)
	if strings.Contains(host, "instagram.com") {
		return "Instagram"
	}
	if strings.Contains(host, "youtube.com") || strings.Contains(host, "youtu.be") {
		return "YouTube"
	}
	if strings.Contains(host, "tiktok.com") {
		return "TikTok"
	}
	if strings.Contains(host, "facebook.com") || strings.Contains(host, "fb.watch") {
		return "Facebook"
	}
	if strings.Contains(host, "twitter.com") || strings.Contains(host, "x.com") {
		return "X (Twitter)"
	}
	return "Website"
}

func fetchYouTubeOEmbed(rawURL string) (*extractedData, error) {
	oembedURL := fmt.Sprintf("https://www.youtube.com/oembed?url=%s&format=json", url.QueryEscape(rawURL))
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(oembedURL)
	if err != nil || resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("oembed failed")
	}
	defer resp.Body.Close()

	var data struct {
		Title        string `json:"title"`
		AuthorName   string `json:"author_name"`
		ThumbnailURL string `json:"thumbnail_url"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, err
	}

	return &extractedData{
		Platform:  "YouTube",
		SourceURL: rawURL,
		Title:     strings.TrimSpace(data.Title),
		Caption:   strings.TrimSpace(data.Title),
		ImageURL:  strings.TrimSpace(data.ThumbnailURL),
		Author:    strings.TrimSpace(data.AuthorName),
	}, nil
}

func fetchTikTokOEmbed(rawURL string) (*extractedData, error) {
	oembedURL := fmt.Sprintf("https://www.tiktok.com/oembed?url=%s", url.QueryEscape(rawURL))
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(oembedURL)
	if err != nil || resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("oembed failed")
	}
	defer resp.Body.Close()

	var data struct {
		Title        string `json:"title"`
		AuthorName   string `json:"author_name"`
		ThumbnailURL string `json:"thumbnail_url"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, err
	}

	return &extractedData{
		Platform:  "TikTok",
		SourceURL: rawURL,
		Title:     strings.TrimSpace(data.Title),
		Caption:   strings.TrimSpace(data.Title),
		ImageURL:  strings.TrimSpace(data.ThumbnailURL),
		Author:    strings.TrimSpace(data.AuthorName),
	}, nil
}

func fetchHTMLWithUserAgents(rawURL string) (string, error) {
	userAgents := []string{
		"facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
		"Twitterbot/1.0",
		"WhatsApp/2.21.12.21 A",
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
	}

	client := &http.Client{Timeout: 12 * time.Second}
	for _, ua := range userAgents {
		req, err := http.NewRequest("GET", rawURL, nil)
		if err != nil {
			continue
		}
		req.Header.Set("User-Agent", ua)
		req.Header.Set("Accept-Language", "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7")
		req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")

		resp, err := client.Do(req)
		if err == nil && resp.StatusCode == http.StatusOK {
			bodyBytes, readErr := io.ReadAll(io.LimitReader(resp.Body, 2<<20)) // 2MB max
			resp.Body.Close()
			if readErr == nil && len(bodyBytes) > 200 {
				return string(bodyBytes), nil
			}
		}
		if resp != nil && resp.Body != nil {
			resp.Body.Close()
		}
	}

	return "", fmt.Errorf("failed to fetch HTML with all user-agents")
}

func parseMetadata(htmlContent string, platform string, rawURL string) *extractedData {
	ogTitle := getMetaContent(htmlContent, "og:title")
	if ogTitle == "" {
		ogTitle = getHTMLTitle(htmlContent)
	}
	ogDesc := getMetaContent(htmlContent, "og:description")
	if ogDesc == "" {
		ogDesc = getMetaContent(htmlContent, "description")
	}
	ogImage := getMetaContent(htmlContent, "og:image")
	author := getMetaContent(htmlContent, "og:site_name")
	if author == "" {
		author = getMetaContent(htmlContent, "author")
	}

	title := ogTitle
	caption := ogDesc

	if platform == "Instagram" {
		t, c, a := extractInstagramContent(ogTitle, ogDesc)
		title = t
		caption = c
		if a != "" {
			author = a
		}
	} else if platform == "Website" {
		if len(caption) < 150 {
			bodyText := extractArticleBodyText(htmlContent)
			if len(bodyText) > len(caption) {
				caption = bodyText
			}
		}
	}

	return &extractedData{
		Platform:  platform,
		SourceURL: rawURL,
		Title:     strings.TrimSpace(stripTags(title)),
		Caption:   strings.TrimSpace(caption),
		ImageURL:  strings.TrimSpace(ogImage),
		Author:    strings.TrimSpace(stripTags(author)),
	}
}

func extractInstagramContent(ogTitle, ogDesc string) (string, string, string) {
	ogTitle = html.UnescapeString(ogTitle)
	ogDesc = html.UnescapeString(ogDesc)

	account := ""
	caption := ""

	reAcc := regexp.MustCompile(`(?i)^(.*?)\s+(?:di|on)\s+Instagram`)
	if match := reAcc.FindStringSubmatch(ogTitle); len(match) > 1 {
		account = strings.TrimSpace(match[1])
	}

	reQuote := regexp.MustCompile(`(?s):\s*["“](.*?)["”]\s*$`)
	if match := reQuote.FindStringSubmatch(ogTitle); len(match) > 1 {
		caption = strings.TrimSpace(match[1])
	} else if match := reQuote.FindStringSubmatch(ogDesc); len(match) > 1 {
		caption = strings.TrimSpace(match[1])
	}

	if caption == "" {
		reCleanTitle := regexp.MustCompile(`(?i)^(.*?)\s+(?:di|on)\s+Instagram:\s*`)
		cleanTitle := reCleanTitle.ReplaceAllString(ogTitle, "")
		reCleanDesc := regexp.MustCompile(`(?s)^.*?:\s*`)
		cleanDesc := reCleanDesc.ReplaceAllString(ogDesc, "")
		if len(cleanTitle) > len(cleanDesc) {
			caption = cleanTitle
		} else {
			caption = cleanDesc
		}
	}

	title := ""
	lines := strings.Split(caption, "\n")
	for _, l := range lines {
		l = strings.TrimSpace(l)
		if l != "" {
			// Remove hashtags
			reHash := regexp.MustCompile(`#\S+`)
			cleanLine := strings.TrimSpace(reHash.ReplaceAllString(l, ""))
			if len(cleanLine) > 120 {
				cleanLine = cleanLine[:117] + "..."
			}
			title = cleanLine
			break
		}
	}
	if title == "" {
		title = "Kabar Terbaru SMK Telkom Lampung"
	}

	return title, caption, account
}

func extractArticleBodyText(htmlContent string) string {
	// Try article containers
	containers := []string{`article`, `main`, `div[^>]*class="[^"]*(?:detail__body|read__content|entry-content)[^"]*"`}
	for _, tag := range containers {
		tagBase := strings.Split(tag, "[")[0]
		re := regexp.MustCompile(fmt.Sprintf(`(?is)<%s[^>]*>(.*?)</%s>`, tag, tagBase))
		if match := re.FindStringSubmatch(htmlContent); len(match) > 1 {
			txt := stripTags(match[1])
			reSpaces := regexp.MustCompile(`\s+`)
			txt = strings.TrimSpace(reSpaces.ReplaceAllString(txt, " "))
			if len(txt) > 150 {
				if len(txt) > 3000 {
					txt = txt[:3000]
				}
				return txt
			}
		}
	}

	// Fallback to <p> tags
	reP := regexp.MustCompile(`(?is)<p[^>]*>(.*?)</p>`)
	pMatches := reP.FindAllStringSubmatch(htmlContent, -1)
	var paragraphs []string
	for _, m := range pMatches {
		if len(m) > 1 {
			cleaned := strings.TrimSpace(stripTags(m[1]))
			if len(cleaned) > 40 {
				paragraphs = append(paragraphs, cleaned)
			}
		}
	}
	if len(paragraphs) > 0 {
		if len(paragraphs) > 10 {
			paragraphs = paragraphs[:10]
		}
		res := strings.Join(paragraphs, "\n\n")
		if len(res) > 3000 {
			res = res[:3000]
		}
		return res
	}

	return ""
}

func getMetaContent(htmlContent string, nameOrProp string) string {
	quoted := regexp.QuoteMeta(nameOrProp)
	p1 := regexp.MustCompile(fmt.Sprintf(`(?is)<meta\s+[^>]*(?:property|name)=["']%s["'][^>]*content=["'](.*?)["']`, quoted))
	if match := p1.FindStringSubmatch(htmlContent); len(match) > 1 {
		return html.UnescapeString(match[1])
	}
	p2 := regexp.MustCompile(fmt.Sprintf(`(?is)<meta\s+[^>]*content=["'](.*?)["'][^>]*(?:property|name)=["']%s["']`, quoted))
	if match := p2.FindStringSubmatch(htmlContent); len(match) > 1 {
		return html.UnescapeString(match[1])
	}
	return ""
}

func getHTMLTitle(htmlContent string) string {
	re := regexp.MustCompile(`(?is)<title[^>]*>(.*?)</title>`)
	if match := re.FindStringSubmatch(htmlContent); len(match) > 1 {
		return html.UnescapeString(match[1])
	}
	return ""
}

func (h *Handler) downloadCoverImage(w http.ResponseWriter, r *http.Request) {
	var req struct {
		URL string `json:"url"`
	}
	if err := httpx.DecodeJSON(r, &req); err != nil || strings.TrimSpace(req.URL) == "" {
		httpx.Error(w, http.StatusBadRequest, "URL gambar tidak valid")
		return
	}

	client := &http.Client{Timeout: 15 * time.Second}
	imgReq, err := http.NewRequestWithContext(r.Context(), "GET", req.URL, nil)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "URL tidak valid")
		return
	}
	imgReq.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")

	resp, err := client.Do(imgReq)
	if err != nil || resp.StatusCode != http.StatusOK {
		httpx.Error(w, http.StatusBadGateway, "Gagal mengunduh gambar dari sumber")
		return
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(io.LimitReader(resp.Body, 10<<20))
	if err != nil || len(bodyBytes) < 50 {
		httpx.Error(w, http.StatusBadRequest, "Gambar kosong atau tidak dapat diunduh")
		return
	}

	contentType := http.DetectContentType(bodyBytes)
	extension := ".jpg"
	if strings.Contains(contentType, "png") {
		extension = ".png"
	} else if strings.Contains(contentType, "webp") {
		extension = ".webp"
	} else if strings.Contains(contentType, "gif") {
		extension = ".gif"
	}

	targetDir := filepath.Join("uploads", "images")
	if err := os.MkdirAll(targetDir, 0755); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal membuat folder upload")
		return
	}

	filename := fmt.Sprintf("cover-%d%s", time.Now().UnixNano(), extension)
	targetPath := filepath.Join(targetDir, filename)
	if err := os.WriteFile(targetPath, bodyBytes, 0644); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal menyimpan gambar cover")
		return
	}

	httpx.JSON(w, http.StatusOK, map[string]string{
		"url": absoluteUploadURL(r, "/uploads/images/"+filename),
	})
}

func (h *Handler) generateAIArticle(w http.ResponseWriter, r *http.Request) {
	defer func() {
		if rec := recover(); rec != nil {
			httpx.Error(w, http.StatusInternalServerError, fmt.Sprintf("Terjadi kesalahan sistem pada pemrosesan AI: %v", rec))
		}
	}()

	var req generateArticleRequest
	if err := httpx.DecodeJSON(r, &req); err != nil {
		httpx.Error(w, http.StatusBadRequest, "payload tidak valid")
		return
	}

	req.Topic = strings.TrimSpace(req.Topic)
	req.SourceCaption = strings.TrimSpace(req.SourceCaption)
	req.SourceURL = strings.TrimSpace(req.SourceURL)
	req.ExtraInstructions = strings.TrimSpace(req.ExtraInstructions)

	if req.Topic == "" && req.SourceCaption != "" {
		req.Topic = req.SourceCaption
	} else if req.Topic == "" && req.SourceURL != "" {
		req.Topic = "Artikel dari tautan " + req.SourceURL
	}

	if req.Topic == "" {
		httpx.Error(w, http.StatusBadRequest, "topik atau materi sumber artikel wajib diisi")
		return
	}

	if req.Paragraphs <= 0 {
		req.Paragraphs = 5
	}

	setting, err := h.repo.GetAISetting(r.Context())
	if err != nil || !setting.IsActive || strings.TrimSpace(setting.APIKey) == "" {
		httpx.Error(w, http.StatusBadRequest, "Layanan AI belum dikonfigurasi atau belum aktif. Silakan atur API Key terlebih dahulu di menu Config AI (Superadmin).")
		return
	}

	schoolName := "SMK Telkom Lampung"

	var sourceInstruction string
	if req.SourceCaption != "" || req.SourceURL != "" {
		sourceInstruction = fmt.Sprintf(`Materi Sumber Asli (Postingan Media Sosial / Web):
%s- Teks / Caption Sumber:
"""
%s
"""

Instruksi Pengolahan Sumber:
1. Olah materi sumber di atas menjadi artikel berita resmi %s yang lengkap, kaya informasi, bernada positif, dan inspiratif.
2. Ubah format ringkas media sosial menjadi narasi berita jurnalistik utuh dengan struktur piramida terbalik (lead 5W+1H yang memikat, detail pencapaian/kegiatan/peristiwa, kutipan atau apresiasi yang relevan dari Kepala Sekolah atau Guru Pembimbing, serta pesan penutup yang membangun).
3. Pertahankan fakta-fakta spesifik yang ada pada sumber (seperti nama siswa, cabang lomba, kategori, tempat, tanggal, penghargaan). Jangan mengubah atau mengarang data faktual di luar apa yang ada pada sumber atau instruksi tambahan.
4. Buat judul berita jurnalistik yang menarik, lugas, dan resmi (hindari hashtag atau format status media sosial).
`,
			func() string {
				if req.SourceURL != "" {
					return fmt.Sprintf("- Tautan Sumber: %s\n", req.SourceURL)
				}
				return ""
			}(),
			req.SourceCaption,
			schoolName,
		)
	}

	topicInstruction := ""
	if req.ExtraInstructions != "" {
		topicInstruction = fmt.Sprintf("Instruksi redaksi tambahan:\n%s\n", req.ExtraInstructions)
	} else if req.Topic != "" && sourceInstruction == "" {
		topicInstruction = fmt.Sprintf("Topik / Arahan artikel:\n%s\n", req.Topic)
	}

	lengthInstruction := "Tentukan panjang terbaik berdasarkan kategori berita. Gunakan 3-7 paragraf dan 2-5 kalimat per paragraf."
	if !req.UseRecommendation && req.Paragraphs > 0 {
		sentencesPart := "sekitar 3-4 kalimat per paragraf"
		if req.SentencesPerParagraph > 0 {
			sentencesPart = fmt.Sprintf("sekitar %d kalimat per paragraf", req.SentencesPerParagraph)
		}
		lengthInstruction = fmt.Sprintf("Buat tepat %d paragraf dengan %s.", req.Paragraphs, sentencesPart)
	}

	codeInstruction := "Jangan memaksakan contoh kode kecuali artikel bertema tutorial teknologi."
	if req.IncludeCodeSnippets {
		codeInstruction = "Sertakan contoh kode teknologi yang relevan dan siap dipelajari. Gunakan fenced code block dengan nama bahasa pemrograman (misal: ```php, ```python, ```javascript) serta berikan penjelasan singkat."
	}

	categoryConstraint := "pilih kategori yang relevan seperti 'Berita', 'Teknologi', 'Pembelajaran', 'Prestasi', atau 'Sekolah'"
	if strings.TrimSpace(req.Category) != "" {
		categoryConstraint = fmt.Sprintf("kategori HARUS '%s'", req.Category)
	}

	prompt := fmt.Sprintf(`Anda adalah Jurnalis Pendidikan & SEO Content Specialist profesional untuk website resmi %s (web.smktelkom-lpg.id).
Tugas Anda adalah menulis artikel berkualitas tinggi, organik, dan berbobot yang dioptimalkan untuk peringkat Halaman 1 Google (Google Page 1 SEO).

Detail Permintaan Artikel:
- Kategori: %s
%s%s- Aturan Panjang: %s
- Ketentuan Kode: %s

ATURAN STRUKTUR & SEO WAJIB:
1. JUDUL HUMANIS & ORGANIK (SANGAT PENTING):
   - Buat judul yang mengalir alami seperti ditulis oleh jurnalis manusia profesional, BUKAN hasil template robot/AI.
   - DILARANG KERAS menggunakan tanda titik dua (:) atau format formulaik kaku seperti "Topik: Penjelasan".
   - DILARANG menggunakan kata awalan klise robotik seperti "Mengenal X:", "Menjelajahi X:", atau "Panduan Lengkap:".
   - Buat judul mengalir natural dengan sudut pandang menarik, relevan dengan siswa/pelajar, membangkitkan rasa ingin tahu pembaca, dan tetap mengandung kata kunci utama secara organik untuk menduduki Google Page 1 (panjang ideal 50-65 karakter).
   - Contoh gaya humanis yang disukai:
     * "Alasan Mengapa Siswa SMK Telkom Lampung Meraih Juara di Kompetisi Nasional"
     * "Seberapa Tangguh Ekosistem Digital Menemani Kebutuhan Praktikum dan Tugas Harian Siswa?"
     * "Melihat Alasan Kuat Mengapa Pendidikan Vokasi Tetap Relevan untuk Generasi Muda"

2. RINGKASAN/EXCERPT:
   - Buat meta description 140-160 karakter yang menggugah pembaca, informatif, dan mengundang klik di hasil pencarian Google.

3. KONTEN DENGAN HTML MODEREN:
   - Gunakan <h2> dan <h3> untuk sub-judul yang rapi dan terstruktur alami.
   - Gunakan tag <p> untuk setiap paragraf.
   - Gunakan <strong> untuk menekankan poin kunci.
   - Sisipkan kutipan atau opini realistis dari Guru Pembimbing atau Kepala Sekolah (misal: Kepala SMK Telkom Lampung) untuk meningkatkan kredibilitas & otoritas artikel di mata Google (E-E-A-T).

4. INTERNAL & EXTERNAL LINK OTOMATIS:
   - Selipkan LINK INTERNAL alami menggunakan tag <a href="..."> dengan anchor text yang relevan:
     * '/jurusan' (atau '/jurusan/rpl', '/jurusan/tkj', '/jurusan/tjat', '/jurusan/animasi')
     * '/spmb' (Pendaftaran SPMB / PPDB)
     * '/profil' (Profil Sekolah)
     * '/prestasi' (Prestasi Siswa)
     * '/alumni' (Tracer Alumni)
   - Selipkan 1-2 LINK EKSTERNAL kredibel menggunakan tag <a href="..." target="_blank" rel="noopener noreferrer"> (contoh: 'https://telkom-schools.sch.id', 'https://kemdikbud.go.id', 'https://id.wikipedia.org').

FORMAT OUTPUT WAJIB:
Keluarkan HANYA JSON murni tanpa markdown triple backticks.
PENTING: Jangan gunakan enter/line break mentah di dalam nilai string JSON. Gunakan \n untuk baris baru.
Format JSON:
{
  "title": "...",
  "excerpt": "...",
  "category": "...",
  "content": "..."
}`, schoolName, categoryConstraint, sourceInstruction, topicInstruction, lengthInstruction, codeInstruction)

	endpoint := strings.TrimRight(setting.BaseURL, "/")
	if !strings.HasSuffix(endpoint, "/chat/completions") && !strings.Contains(endpoint, ":generateContent") {
		endpoint += "/chat/completions"
	}

	reqBody, _ := json.Marshal(map[string]interface{}{
		"model": setting.Model,
		"messages": []map[string]string{
			{"role": "system", "content": "You are an experienced, award-winning human education journalist and SEO specialist. You write natural, compelling, human-toned articles without robotic clichés. Never use colons (:) in titles. Always output clean valid JSON only with keys: title, excerpt, category, content."},
			{"role": "user", "content": prompt},
		},
		"stream":      false,
		"max_tokens":  3500,
		"temperature": 0.75,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 75*time.Second)
	defer cancel()

	client := &http.Client{Timeout: 75 * time.Second}
	aiReq, err := http.NewRequestWithContext(ctx, "POST", endpoint, bytes.NewBuffer(reqBody))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "URL AI Endpoint tidak valid: "+err.Error())
		return
	}

	aiReq.Header.Set("Content-Type", "application/json")
	aiReq.Header.Set("Authorization", "Bearer "+setting.APIKey)
	aiReq.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

	resp, err := client.Do(aiReq)
	if err != nil {
		httpx.Error(w, http.StatusBadGateway, "Gagal menghubungi AI Provider: "+err.Error())
		return
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "Gagal membaca respons dari AI")
		return
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		httpx.Error(w, resp.StatusCode, "Gagal dari AI Server: "+string(respBytes))
		return
	}

	rawContent, err := extractAIText(respBytes)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	articleRes := parseAIArticleResponse(rawContent, req.Topic)
	httpx.JSON(w, http.StatusOK, articleRes)
}

func extractAIText(respBytes []byte) (string, error) {
	// 1. Check for upstream error payload inside JSON
	var errObj struct {
		Error *struct {
			Message string `json:"message"`
			Code    any    `json:"code"`
			Type    string `json:"type"`
		} `json:"error"`
		Message string `json:"message"`
	}
	if err := json.Unmarshal(respBytes, &errObj); err == nil {
		if errObj.Error != nil && strings.TrimSpace(errObj.Error.Message) != "" {
			return "", fmt.Errorf("AI provider error: %s", errObj.Error.Message)
		}
	}

	// 2. Check if this is an SSE stream response (data: lines)
	trimmedStr := strings.TrimSpace(string(respBytes))
	if strings.HasPrefix(trimmedStr, "data:") || strings.Contains(trimmedStr, "\ndata:") {
		var sb strings.Builder
		for _, line := range strings.Split(trimmedStr, "\n") {
			line = strings.TrimSpace(line)
			if !strings.HasPrefix(line, "data:") {
				continue
			}
			chunkJSON := strings.TrimSpace(strings.TrimPrefix(line, "data:"))
			if chunkJSON == "[DONE]" || chunkJSON == "" {
				continue
			}
			var chunk struct {
				Choices []struct {
					Delta struct {
						Content          string `json:"content"`
						ReasoningContent string `json:"reasoning_content"`
					} `json:"delta"`
					Text string `json:"text"`
				} `json:"choices"`
			}
			if err := json.Unmarshal([]byte(chunkJSON), &chunk); err == nil && len(chunk.Choices) > 0 {
				if chunk.Choices[0].Delta.Content != "" {
					sb.WriteString(chunk.Choices[0].Delta.Content)
				} else if chunk.Choices[0].Text != "" {
					sb.WriteString(chunk.Choices[0].Text)
				}
			}
		}
		if sb.Len() > 0 {
			return sb.String(), nil
		}
	}

	// 3. Generic JSON unmarshal
	var raw map[string]interface{}
	if err := json.Unmarshal(respBytes, &raw); err != nil {
		if trimmedStr != "" {
			return trimmedStr, nil
		}
		return "", fmt.Errorf("respons AI bukan JSON valid: %v", err)
	}

	// 3. OpenAI Chat Completions: choices[0].message
	if choices, ok := raw["choices"].([]interface{}); ok && len(choices) > 0 {
		if choiceMap, ok := choices[0].(map[string]interface{}); ok {
			if msgMap, ok := choiceMap["message"].(map[string]interface{}); ok {
				// String content
				if contentStr, ok := msgMap["content"].(string); ok && strings.TrimSpace(contentStr) != "" {
					return contentStr, nil
				}
				// Array of content parts: [{"type": "text", "text": "..."}]
				if contentArr, ok := msgMap["content"].([]interface{}); ok {
					var sb strings.Builder
					for _, item := range contentArr {
						if partMap, ok := item.(map[string]interface{}); ok {
							if txt, ok := partMap["text"].(string); ok {
								sb.WriteString(txt)
							}
						}
					}
					if sb.Len() > 0 {
						return sb.String(), nil
					}
				}
				// Reasoning content (DeepSeek R1, GLM-5, Qwen, etc.)
				if reasonStr, ok := msgMap["reasoning_content"].(string); ok && strings.TrimSpace(reasonStr) != "" {
					return reasonStr, nil
				}
			}
			// Delta (streaming format if proxy forwarded chunk)
			if deltaMap, ok := choiceMap["delta"].(map[string]interface{}); ok {
				if contentStr, ok := deltaMap["content"].(string); ok && strings.TrimSpace(contentStr) != "" {
					return contentStr, nil
				}
			}
			// Text (legacy completion format)
			if textStr, ok := choiceMap["text"].(string); ok && strings.TrimSpace(textStr) != "" {
				return textStr, nil
			}
		}
	}

	// 4. Google Gemini native candidates: candidates[0].content.parts[0].text
	if cands, ok := raw["candidates"].([]interface{}); ok && len(cands) > 0 {
		if candMap, ok := cands[0].(map[string]interface{}); ok {
			if contentMap, ok := candMap["content"].(map[string]interface{}); ok {
				if partsArr, ok := contentMap["parts"].([]interface{}); ok {
					var sb strings.Builder
					for _, part := range partsArr {
						if partMap, ok := part.(map[string]interface{}); ok {
							if txt, ok := partMap["text"].(string); ok {
								sb.WriteString(txt)
							}
						}
					}
					if sb.Len() > 0 {
						return sb.String(), nil
					}
				}
			}
		}
	}

	// 5. Anthropic Claude native: content[0].text
	if contentArr, ok := raw["content"].([]interface{}); ok && len(contentArr) > 0 {
		var sb strings.Builder
		for _, part := range contentArr {
			if partMap, ok := part.(map[string]interface{}); ok {
				if txt, ok := partMap["text"].(string); ok {
					sb.WriteString(txt)
				}
			}
		}
		if sb.Len() > 0 {
			return sb.String(), nil
		}
	}

	// 6. Direct root string fields (output, response, text, result, generated_text, message)
	for _, k := range []string{"output", "response", "text", "result", "generated_text", "message"} {
		if val, ok := raw[k].(string); ok && strings.TrimSpace(val) != "" {
			return val, nil
		}
	}

	preview := string(respBytes)
	if len(preview) > 300 {
		preview = preview[:297] + "..."
	}
	return "", fmt.Errorf("Format respons AI tidak dikenali: %s", preview)
}

func parseAIArticleResponse(rawContent string, fallbackTopic string) generateArticleResponse {
	rawContent = strings.TrimSpace(rawContent)

	// Remove thinking blocks from reasoning models
	reThink := regexp.MustCompile(`(?s)<think>.*?</think>`)
	rawContent = reThink.ReplaceAllString(rawContent, "")
	rawContent = strings.TrimSpace(rawContent)

	// Strip markdown code fences if wrapped in ```json ... ``` or ``` ... ```
	reCodeBlock := regexp.MustCompile("(?s)```(?:json)?\\s*(\\{.*?\\})\\s*```")
	if match := reCodeBlock.FindStringSubmatch(rawContent); len(match) > 1 {
		rawContent = match[1]
	} else {
		rawContent = strings.TrimPrefix(rawContent, "```json")
		rawContent = strings.TrimPrefix(rawContent, "```")
		rawContent = strings.TrimSuffix(rawContent, "```")
		rawContent = strings.TrimSpace(rawContent)
	}

	targetJSON := rawContent
	if idx := strings.Index(targetJSON, "{"); idx != -1 {
		if lastIdx := strings.LastIndex(targetJSON, "}"); lastIdx > idx {
			targetJSON = targetJSON[idx : lastIdx+1]
		}
	}

	var res generateArticleResponse
	if err := json.Unmarshal([]byte(targetJSON), &res); err == nil && res.Title != "" && res.Content != "" {
		return finalizeArticleResponse(res, fallbackTopic)
	}

	sanitized := sanitizeJSONStringLiterals(targetJSON)
	if err := json.Unmarshal([]byte(sanitized), &res); err == nil && res.Title != "" && res.Content != "" {
		return finalizeArticleResponse(res, fallbackTopic)
	}

	res.Title = extractJSONStringField(targetJSON, "title")
	res.Excerpt = extractJSONStringField(targetJSON, "excerpt")
	res.Category = extractJSONStringField(targetJSON, "category")
	res.Content = extractJSONStringField(targetJSON, "content")

	if res.Title == "" {
		res.Title = extractJSONStringField(rawContent, "title")
	}
	if res.Excerpt == "" {
		res.Excerpt = extractJSONStringField(rawContent, "excerpt")
	}
	if res.Category == "" {
		res.Category = extractJSONStringField(rawContent, "category")
	}
	if res.Content == "" {
		res.Content = extractJSONStringField(rawContent, "content")
	}

	if res.Content == "" {
		res.Content = rawContent
	}

	return finalizeArticleResponse(res, fallbackTopic)
}

func finalizeArticleResponse(res generateArticleResponse, fallbackTopic string) generateArticleResponse {
	if strings.TrimSpace(res.Title) == "" {
		res.Title = fallbackTopic
	}

	// Remove any robotic colons and format title naturally
	if strings.Contains(res.Title, ":") {
		parts := strings.SplitN(res.Title, ":", 2)
		if len(parts) == 2 {
			p1 := strings.TrimSpace(parts[0])
			p2 := strings.TrimSpace(parts[1])
			if strings.HasPrefix(strings.ToLower(p1), "mengenal ") || strings.HasPrefix(strings.ToLower(p1), "panduan ") {
				res.Title = p1 + " dan " + p2
			} else if len(p1) > 0 && len(p2) > 0 {
				res.Title = p1 + " - " + p2
			} else {
				res.Title = p1 + p2
			}
		}
		res.Title = strings.ReplaceAll(res.Title, ":", "")
	}
	res.Title = strings.TrimSpace(res.Title)

	if strings.TrimSpace(res.Category) == "" {
		res.Category = "Sekolah"
	}
	if strings.TrimSpace(res.Excerpt) == "" {
		plain := stripTags(res.Content)
		if len(plain) > 155 {
			res.Excerpt = plain[:152] + "..."
		} else {
			res.Excerpt = plain
		}
	}

	// Count paragraphs
	pCount := 0
	reP := regexp.MustCompile(`(?i)<p[^>]*>.*?</p>`)
	pMatches := reP.FindAllString(res.Content, -1)
	if len(pMatches) > 0 {
		pCount = len(pMatches)
	} else {
		parts := strings.Split(res.Content, "\n\n")
		pCount = len(parts)
	}
	res.ParagraphCount = pCount

	// Count sentences
	cleanText := stripTags(res.Content)
	reSent := regexp.MustCompile(`(?i)[.!?]+(?:\s+|$)`)
	sentMatches := reSent.FindAllString(cleanText, -1)
	res.SentenceCount = len(sentMatches)
	if res.SentenceCount == 0 && pCount > 0 {
		res.SentenceCount = pCount * 3
	}

	return res
}

func sanitizeJSONStringLiterals(s string) string {
	var buf strings.Builder
	inString := false
	escaped := false

	for i := 0; i < len(s); i++ {
		ch := s[i]
		if inString {
			if escaped {
				escaped = false
				buf.WriteByte(ch)
				continue
			}
			if ch == '\\' {
				escaped = true
				buf.WriteByte(ch)
				continue
			}
			if ch == '"' {
				inString = false
				buf.WriteByte(ch)
				continue
			}
			if ch == '\n' {
				buf.WriteString(`\n`)
				continue
			}
			if ch == '\r' {
				buf.WriteString(`\r`)
				continue
			}
			if ch == '\t' {
				buf.WriteString(`\t`)
				continue
			}
			buf.WriteByte(ch)
		} else {
			if ch == '"' {
				inString = true
			}
			buf.WriteByte(ch)
		}
	}
	return buf.String()
}

func extractJSONStringField(jsonStr string, fieldName string) string {
	re := regexp.MustCompile(fmt.Sprintf(`"%s"\s*:\s*"`, fieldName))
	loc := re.FindStringIndex(jsonStr)
	if loc == nil {
		return ""
	}
	startIdx := loc[1]
	sub := jsonStr[startIdx:]

	var buf strings.Builder
	escaped := false
	for i := 0; i < len(sub); i++ {
		ch := sub[i]
		if escaped {
			switch ch {
			case 'n':
				buf.WriteByte('\n')
			case 'r':
				buf.WriteByte('\r')
			case 't':
				buf.WriteByte('\t')
			case '"':
				buf.WriteByte('"')
			case '\\':
				buf.WriteByte('\\')
			default:
				buf.WriteByte(ch)
			}
			escaped = false
			continue
		}
		if ch == '\\' {
			escaped = true
			continue
		}
		if ch == '"' {
			rest := strings.TrimSpace(sub[i+1:])
			if len(rest) == 0 || strings.HasPrefix(rest, ",") || strings.HasPrefix(rest, "}") || strings.HasPrefix(rest, "\n") || strings.HasPrefix(rest, "\r") {
				break
			}
		}
		buf.WriteByte(ch)
	}
	return strings.TrimSpace(buf.String())
}

func stripTags(htmlStr string) string {
	var buf strings.Builder
	inTag := false
	for _, r := range htmlStr {
		if r == '<' {
			inTag = true
			continue
		}
		if r == '>' {
			inTag = false
			continue
		}
		if !inTag {
			buf.WriteRune(r)
		}
	}
	return strings.TrimSpace(buf.String())
}
