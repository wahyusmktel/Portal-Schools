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

	endpoint := strings.TrimRight(setting.BaseURL, "/")
	if !strings.HasSuffix(endpoint, "/chat/completions") && !strings.Contains(endpoint, ":generateContent") {
		endpoint += "/chat/completions"
	}

	reqBody, _ := json.Marshal(map[string]interface{}{
		"model": setting.Model,
		"messages": []map[string]string{
			{"role": "system", "content": "You are a professional SEO content writer. Always output clean valid JSON only with keys: title, excerpt, category, content."},
			{"role": "user", "content": prompt},
		},
		"stream":      false,
		"max_tokens":  3500,
		"temperature": 0.7,
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
