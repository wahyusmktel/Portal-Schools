package handlers

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"time"

	"portal-smktelkom/backend/internal/httpx"
	"portal-smktelkom/backend/internal/models"
)

func (h *Handler) getAISetting(w http.ResponseWriter, r *http.Request) {
	setting, err := h.repo.GetAISetting(r.Context())
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "gagal memuat konfigurasi AI")
		return
	}
	httpx.JSON(w, http.StatusOK, setting)
}

func (h *Handler) updateAISetting(w http.ResponseWriter, r *http.Request) {
	var payload models.AISetting
	if err := httpx.DecodeJSON(r, &payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "payload tidak valid")
		return
	}

	payload.BaseURL = strings.TrimSpace(payload.BaseURL)
	payload.APIKey = strings.TrimSpace(payload.APIKey)
	payload.Model = strings.TrimSpace(payload.Model)

	if payload.BaseURL == "" {
		payload.BaseURL = "https://waverouter.web.id/v1"
	}
	if payload.Model == "" {
		payload.Model = "glm-5.2"
	}

	if err := h.repo.UpdateAISetting(r.Context(), payload); err != nil {
		httpx.Error(w, http.StatusBadRequest, "gagal menyimpan konfigurasi AI: "+err.Error())
		return
	}

	httpx.JSON(w, http.StatusOK, map[string]string{
		"message": "Konfigurasi AI berhasil disimpan.",
	})
}

func (h *Handler) testAIConnection(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		BaseURL string `json:"baseUrl"`
		APIKey  string `json:"apiKey"`
		Model   string `json:"model"`
	}
	_ = httpx.DecodeJSON(r, &payload)

	setting, err := h.repo.GetAISetting(r.Context())
	if err != nil && payload.BaseURL == "" {
		httpx.Error(w, http.StatusInternalServerError, "gagal memuat konfigurasi AI")
		return
	}

	baseURL := strings.TrimSpace(payload.BaseURL)
	if baseURL == "" {
		baseURL = setting.BaseURL
	}
	apiKey := strings.TrimSpace(payload.APIKey)
	if apiKey == "" {
		apiKey = setting.APIKey
	}
	model := strings.TrimSpace(payload.Model)
	if model == "" {
		model = setting.Model
	}

	if apiKey == "" {
		httpx.Error(w, http.StatusBadRequest, "API Key belum diisi, silakan masukkan API Key terlebih dahulu.")
		return
	}

	endpoint := strings.TrimRight(baseURL, "/") + "/chat/completions"

	reqBody, _ := json.Marshal(map[string]interface{}{
		"model": model,
		"messages": []map[string]string{
			{"role": "user", "content": "Hello! Please respond with a brief confirmation 'Koneksi AI Berhasil'."},
		},
	})

	client := &http.Client{Timeout: 15 * time.Second}
	req, err := http.NewRequestWithContext(r.Context(), "POST", endpoint, bytes.NewBuffer(reqBody))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "URL Endpoint tidak valid: "+err.Error())
		return
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	resp, err := client.Do(req)
	if err != nil {
		httpx.Error(w, http.StatusBadGateway, "Gagal menghubungi server AI: "+err.Error())
		return
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "Gagal membaca respons dari AI server")
		return
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		httpx.Error(w, resp.StatusCode, "Gagal dari Server AI ("+http.StatusText(resp.StatusCode)+"): "+string(respBytes))
		return
	}

	var aiResult struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	_ = json.Unmarshal(respBytes, &aiResult)

	outputContent := ""
	if len(aiResult.Choices) > 0 {
		outputContent = aiResult.Choices[0].Message.Content
	}

	httpx.JSON(w, http.StatusOK, map[string]interface{}{
		"status":  "success",
		"message": "Koneksi ke AI Provider berhasil!",
		"output":  outputContent,
	})
}
