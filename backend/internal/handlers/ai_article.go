package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
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
		httpx.Error(w, http.StatusBadRequest, "Layanan AI belum dikonfigurasi atau belum aktif. Silakan atur API Key di menu Config AI (Superadmin).")
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
1. JUDUL: Buat judul yang sangat menarik (click-worthy), mengandung kata kunci utama, dan berstandar SEO.
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

FORMAT OUTPUT:
Keluarkan HANYA JSON murni tanpa markdown triple backticks. Format JSON:
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
			{"role": "system", "content": "You are a professional SEO content writer. Always output clean JSON only."},
			{"role": "user", "content": prompt},
		},
		"max_tokens":  1500,
		"temperature": 0.7,
	})

	client := &http.Client{Timeout: 30 * time.Second}
	aiReq, err := http.NewRequestWithContext(r.Context(), "POST", endpoint, bytes.NewBuffer(reqBody))
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
	rawContent = strings.TrimSpace(rawContent)
	rawContent = strings.TrimPrefix(rawContent, "```json")
	rawContent = strings.TrimPrefix(rawContent, "```")
	rawContent = strings.TrimSuffix(rawContent, "```")
	rawContent = strings.TrimSpace(rawContent)

	var articleRes generateArticleResponse
	if err := json.Unmarshal([]byte(rawContent), &articleRes); err != nil {
		articleRes = generateArticleResponse{
			Title:    "Artikel AI: " + req.Topic,
			Excerpt:  "Artikel yang dihasilkan otomatis oleh AI.",
			Category: "Berita",
			Content:  rawContent,
		}
	}

	httpx.JSON(w, http.StatusOK, articleRes)
}
