package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
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
}

type generateArticleResponse struct {
	Title    string `json:"title"`
	Excerpt  string `json:"excerpt"`
	Category string `json:"category"`
	Content  string `json:"content"`
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
	if req.Topic == "" {
		httpx.Error(w, http.StatusBadRequest, "topik artikel wajib diisi")
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

	sentencesConstraint := "panjang kalimat dinamis dan alami sesuai konteks"
	if req.SentencesPerParagraph > 0 {
		sentencesConstraint = fmt.Sprintf("sekitar %d kalimat per paragraf", req.SentencesPerParagraph)
	}

	categoryConstraint := "pilih kategori yang relevan seperti 'Berita', 'Teknologi', 'Pembelajaran', 'Prestasi', atau 'Sekolah'"
	if strings.TrimSpace(req.Category) != "" {
		categoryConstraint = fmt.Sprintf("kategori HARUS '%s'", req.Category)
	}

	prompt := fmt.Sprintf(`Anda adalah SEO Content Writer & Jurnalis Pendidikan profesional untuk website resmi SMK Telkom Lampung (web.smktelkom-lpg.id).
Tugas Anda adalah menulis artikel berkualitas tinggi yang dioptimalkan untuk peringkat Halaman 1 Google (Google Page 1 SEO).

Detail Permintaan Artikel:
- Topik / Detail: %s
- Jumlah Paragraf: Exactly %d paragraf utama
- Kalimat: %s
- Kategori: %s

ATURAN STRUKTUR & SEO WAJIB:
1. JUDUL: Buat judul yang sangat menarik (click-worthy), mengandung kata kunci utama, dan berstandar SEO (tanpa tanda petik ganda di dalam string judul).
2. RINGKASAN/EXCERPT: Buat meta description / ringkasan artikel 140-160 karakter yang menggugah pembaca.
3. KONTEN DENGAN HTML MODEREN:
   - Gunakan <h2> dan <h3> untuk sub-judul yang rapi dan terstruktur.
   - Gunakan tag <p> untuk setiap paragraf.
   - Gunakan <strong> untuk menekankan poin kunci.
   - Sisipkan kutipan atau opini realistis dari Guru atau Kepala Sekolah (misal: Kepala SMK Telkom Lampung) untuk meningkatkan otoritas artikel.
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
}`, req.Topic, req.Paragraphs, sentencesConstraint, categoryConstraint)

	endpoint := strings.TrimRight(setting.BaseURL, "/") + "/chat/completions"

	reqBody, _ := json.Marshal(map[string]interface{}{
		"model": setting.Model,
		"messages": []map[string]string{
			{"role": "system", "content": "You are a professional SEO content writer. Always output clean valid JSON only with keys: title, excerpt, category, content."},
			{"role": "user", "content": prompt},
		},
		"max_tokens":  2000,
		"temperature": 0.7,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 35*time.Second)
	defer cancel()

	client := &http.Client{Timeout: 35 * time.Second}
	aiReq, err := http.NewRequestWithContext(ctx, "POST", endpoint, bytes.NewBuffer(reqBody))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "URL AI Endpoint tidak valid: "+err.Error())
		return
	}

	aiReq.Header.Set("Content-Type", "application/json")
	aiReq.Header.Set("Authorization", "Bearer "+setting.APIKey)

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

	var aiResult struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.Unmarshal(respBytes, &aiResult); err != nil || len(aiResult.Choices) == 0 {
		httpx.Error(w, http.StatusInternalServerError, "Format respons AI tidak dikenali")
		return
	}

	rawContent := aiResult.Choices[0].Message.Content
	articleRes := parseAIArticleResponse(rawContent, req.Topic)

	httpx.JSON(w, http.StatusOK, articleRes)
}

func parseAIArticleResponse(rawContent string, fallbackTopic string) generateArticleResponse {
	rawContent = strings.TrimSpace(rawContent)
	if idx := strings.Index(rawContent, "{"); idx != -1 {
		if lastIdx := strings.LastIndex(rawContent, "}"); lastIdx > idx {
			rawContent = rawContent[idx : lastIdx+1]
		}
	}

	var res generateArticleResponse
	if err := json.Unmarshal([]byte(rawContent), &res); err == nil && res.Title != "" && res.Content != "" {
		return res
	}

	sanitized := sanitizeJSONStringLiterals(rawContent)
	if err := json.Unmarshal([]byte(sanitized), &res); err == nil && res.Title != "" && res.Content != "" {
		return res
	}

	res.Title = extractJSONStringField(rawContent, "title")
	res.Excerpt = extractJSONStringField(rawContent, "excerpt")
	res.Category = extractJSONStringField(rawContent, "category")
	res.Content = extractJSONStringField(rawContent, "content")

	if res.Title == "" {
		res.Title = fallbackTopic
	}
	if res.Category == "" {
		res.Category = "Teknologi"
	}
	if res.Content == "" {
		res.Content = rawContent
	}
	if res.Excerpt == "" {
		plain := stripTags(res.Content)
		if len(plain) > 155 {
			res.Excerpt = plain[:152] + "..."
		} else {
			res.Excerpt = plain
		}
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

func stripTags(html string) string {
	var buf strings.Builder
	inTag := false
	for _, r := range html {
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
