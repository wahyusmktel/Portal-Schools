package cbtparser

import (
	"archive/zip"
	"bytes"
	"encoding/json"
	"encoding/xml"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"portal-smktelkom/backend/internal/models"
)

type ParagraphItem struct {
	Text     string
	ImageRId string
}

func ParseDocx(r io.ReaderAt, size int64, uploadsDir string) ([]models.UpsertCbtQuestionPayload, error) {
	zr, err := zip.NewReader(r, size)
	if err != nil {
		return nil, fmt.Errorf("gagal membuka file zip docx: %w", err)
	}

	// 1. Extract relationships: rId -> target media path
	rels := make(map[string]string)
	for _, f := range zr.File {
		if f.Name == "word/_rels/document.xml.rels" {
			rc, err := f.Open()
			if err == nil {
				rels = parseRels(rc)
				rc.Close()
			}
			break
		}
	}

	// 2. Read media files into memory
	mediaFiles := make(map[string][]byte)
	for _, f := range zr.File {
		if strings.HasPrefix(f.Name, "word/media/") {
			rc, err := f.Open()
			if err == nil {
				data, err := io.ReadAll(rc)
				if err == nil {
					// target in rels is usually "media/image1.png"
					cleanName := strings.TrimPrefix(f.Name, "word/")
					mediaFiles[cleanName] = data
				}
				rc.Close()
			}
		}
	}

	// 3. Parse word/document.xml into sequential paragraphs
	var paragraphs []ParagraphItem
	for _, f := range zr.File {
		if f.Name == "word/document.xml" {
			rc, err := f.Open()
			if err != nil {
				return nil, fmt.Errorf("gagal membuka document.xml: %w", err)
			}
			paragraphs, err = parseDocumentXml(rc)
			rc.Close()
			if err != nil {
				return nil, fmt.Errorf("gagal parse document.xml: %w", err)
			}
			break
		}
	}

	if len(paragraphs) == 0 {
		return nil, fmt.Errorf("dokumen word kosong atau tidak memiliki paragraf yang terbaca")
	}

	// 4. Helper to save image to uploadsDir/cbt and return URL
	saveMediaImage := func(rId string) string {
		if rId == "" {
			return ""
		}
		target, ok := rels[rId]
		if !ok {
			return ""
		}
		imgBytes, ok := mediaFiles[target]
		if !ok {
			return ""
		}

		cbtUploadsDir := filepath.Join(uploadsDir, "cbt")
		_ = os.MkdirAll(cbtUploadsDir, 0755)

		ext := filepath.Ext(target)
		if ext == "" {
			ext = ".png"
		}
		fname := fmt.Sprintf("cbt-img-%d%s", time.Now().UnixNano(), ext)
		fpath := filepath.Join(cbtUploadsDir, fname)
		if err := os.WriteFile(fpath, imgBytes, 0644); err != nil {
			return ""
		}
		return "/uploads/cbt/" + fname
	}

	// 5. Parse paragraphs into Questions
	reQuestionStart := regexp.MustCompile(`^(?:(\d+)[\.\)]\s*(.*)|(?:\[(SOAL|QUESTION)\]\s*(.*)))$`)
	reOption := regexp.MustCompile(`^([A-Ea-e])[\.\)]\s*(.*)$`)
	reAnswer := regexp.MustCompile(`^(?i)(?:ANS|KUNCI|JAWABAN)\s*:\s*([A-Ea-e0-9,\s]+)$`)
	reAudio := regexp.MustCompile(`\[AUDIO:\s*([^\]]+)\]`)
	rePoints := regexp.MustCompile(`\[POIN:\s*([0-9\.]+)\]`)
	reExplanation := regexp.MustCompile(`^(?i)(?:PEMBAHASAN|EXPLANATION)\s*:\s*(.*)$`)

	type TempQuestion struct {
		Text        strings.Builder
		ImageURL    string
		AudioURL    string
		Points      float64
		Options     []models.CbtQuestionOption
		Answers     []string
		Explanation string
		IsEssay     bool
	}

	var parsedQuestions []TempQuestion
	var current *TempQuestion

	finalizeCurrent := func() {
		if current == nil {
			return
		}
		if current.Points <= 0 {
			current.Points = 1.00
		}
		parsedQuestions = append(parsedQuestions, *current)
		current = nil
	}

	for _, p := range paragraphs {
		trimmed := strings.TrimSpace(p.Text)
		if trimmed == "" && p.ImageRId == "" {
			continue
		}

		// Check if start of question
		if match := reQuestionStart.FindStringSubmatch(trimmed); len(match) > 0 {
			finalizeCurrent()
			current = &TempQuestion{
				Points: 1.00,
			}
			qBody := ""
			if match[1] != "" {
				qBody = match[2]
			} else if match[3] != "" {
				qBody = match[4]
			}
			current.Text.WriteString(qBody)
			if p.ImageRId != "" {
				current.ImageURL = saveMediaImage(p.ImageRId)
			}
			continue
		}

		if current == nil {
			// Skip preamble text before question 1
			continue
		}

		// Check Answer Key
		if match := reAnswer.FindStringSubmatch(trimmed); len(match) > 0 {
			rawAns := strings.ToUpper(strings.TrimSpace(match[1]))
			// Split by comma if multi answer
			parts := strings.Split(rawAns, ",")
			for _, part := range parts {
				pClean := strings.TrimSpace(part)
				if pClean != "" {
					current.Answers = append(current.Answers, pClean)
				}
			}
			continue
		}

		// Check Option (A. / B. / etc.)
		if match := reOption.FindStringSubmatch(trimmed); len(match) > 0 {
			label := strings.ToUpper(match[1])
			optText := strings.TrimSpace(match[2])
			optImg := ""
			if p.ImageRId != "" {
				optImg = saveMediaImage(p.ImageRId)
			}
			current.Options = append(current.Options, models.CbtQuestionOption{
				ID:       label,
				Label:    label,
				Text:     optText,
				ImageURL: optImg,
			})
			continue
		}

		// Check Explanation
		if match := reExplanation.FindStringSubmatch(trimmed); len(match) > 0 {
			current.Explanation = strings.TrimSpace(match[1])
			continue
		}

		// Check Audio tag
		if match := reAudio.FindStringSubmatch(trimmed); len(match) > 0 {
			current.AudioURL = strings.TrimSpace(match[1])
			trimmed = reAudio.ReplaceAllString(trimmed, "")
		}

		// Check Points tag
		if match := rePoints.FindStringSubmatch(trimmed); len(match) > 0 {
			var pt float64
			fmt.Sscanf(match[1], "%f", &pt)
			if pt > 0 {
				current.Points = pt
			}
			trimmed = rePoints.ReplaceAllString(trimmed, "")
		}

		// If current option exists and this looks like a continuation of that option
		if len(current.Options) > 0 && len(current.Answers) == 0 {
			idx := len(current.Options) - 1
			if trimmed != "" {
				current.Options[idx].Text += " " + trimmed
			}
			if p.ImageRId != "" && current.Options[idx].ImageURL == "" {
				current.Options[idx].ImageURL = saveMediaImage(p.ImageRId)
			}
			continue
		}

		// Otherwise continuation of question text
		if trimmed != "" {
			if current.Text.Len() > 0 {
				current.Text.WriteString("\n")
			}
			current.Text.WriteString(trimmed)
		}
		if p.ImageRId != "" && current.ImageURL == "" {
			current.ImageURL = saveMediaImage(p.ImageRId)
		}
	}
	finalizeCurrent()

	// Convert parsed into UpsertCbtQuestionPayload
	var result []models.UpsertCbtQuestionPayload
	for i, q := range parsedQuestions {
		qType := "multiple_choice"
		if len(q.Options) == 0 {
			qType = "essay"
		} else if len(q.Answers) > 1 {
			qType = "complex_multiple_choice"
		}

		optBytes, _ := json.Marshal(q.Options)

		var ansBytes []byte
		if qType == "essay" {
			ansBytes, _ = json.Marshal([]string{})
		} else {
			ansBytes, _ = json.Marshal(q.Answers)
		}

		result = append(result, models.UpsertCbtQuestionPayload{
			QuestionType:  qType,
			QuestionText:  strings.TrimSpace(q.Text.String()),
			ImageURL:      q.ImageURL,
			AudioURL:      q.AudioURL,
			Points:        q.Points,
			Options:       optBytes,
			CorrectAnswer: ansBytes,
			Explanation:   q.Explanation,
			SortOrder:     i + 1,
		})
	}

	return result, nil
}

func parseRels(rc io.Reader) map[string]string {
	rels := make(map[string]string)
	decoder := xml.NewDecoder(rc)
	for {
		t, err := decoder.Token()
		if err != nil {
			break
		}
		if se, ok := t.(xml.StartElement); ok && se.Name.Local == "Relationship" {
			var id, target string
			for _, attr := range se.Attr {
				if attr.Name.Local == "Id" {
					id = attr.Value
				} else if attr.Name.Local == "Target" {
					target = attr.Value
				}
			}
			if id != "" && target != "" {
				// Normalize target
				target = strings.TrimPrefix(target, "word/")
				target = strings.TrimPrefix(target, "/")
				rels[id] = target
			}
		}
	}
	return rels
}

func parseDocumentXml(rc io.Reader) ([]ParagraphItem, error) {
	var paragraphs []ParagraphItem
	decoder := xml.NewDecoder(rc)

	var inParagraph bool
	var curText strings.Builder
	var curImageRId string

	for {
		t, err := decoder.Token()
		if err != nil {
			if err == io.EOF {
				break
			}
			return nil, err
		}

		switch elem := t.(type) {
		case xml.StartElement:
			if elem.Name.Local == "p" {
				inParagraph = true
				curText.Reset()
				curImageRId = ""
			} else if elem.Name.Local == "blip" || elem.Name.Local == "imagedata" {
				for _, attr := range elem.Attr {
					if attr.Name.Local == "embed" || attr.Name.Local == "id" {
						curImageRId = attr.Value
					}
				}
			}
		case xml.CharData:
			if inParagraph {
				curText.Write(elem)
			}
		case xml.EndElement:
			if elem.Name.Local == "p" {
				inParagraph = false
				paragraphs = append(paragraphs, ParagraphItem{
					Text:     curText.String(),
					ImageRId: curImageRId,
				})
			}
		}
	}

	return paragraphs, nil
}

// GenerateSampleDocx produces a valid Word (.docx) file pre-filled with clean examples
func GenerateSampleDocx() ([]byte, error) {
	buf := new(bytes.Buffer)
	zw := zip.NewWriter(buf)

	// [Content_Types].xml
	ct, err := zw.Create("[Content_Types].xml")
	if err != nil {
		return nil, err
	}
	_, _ = io.WriteString(ct, `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`)

	// _rels/.rels
	relsRoot, err := zw.Create("_rels/.rels")
	if err != nil {
		return nil, err
	}
	_, _ = io.WriteString(relsRoot, `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`)

	// word/document.xml
	docXml, err := zw.Create("word/document.xml")
	if err != nil {
		return nil, err
	}

	sampleContent := `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>PETUNJUK FORMAT PEMBUATAN SOAL CBT:</w:t></w:r></w:p>
    <w:p><w:r><w:t>1. Format nomor diawali angka dan titik: "1. Pertanyaan..."</w:t></w:r></w:p>
    <w:p><w:r><w:t>2. Opsi jawaban diawali huruf kapital dan titik: "A. Pilihan jawaban..."</w:t></w:r></w:p>
    <w:p><w:r><w:t>3. Kunci jawaban ditulis di baris bawah opsi: "ANS: A" (Bisa ANS: A, C untuk pilihan ganda kompleks)</w:t></w:r></w:p>
    <w:p><w:r><w:t>4. Gambar cukup di-paste / insert langsung di Microsoft Word ini pada bawah soal.</w:t></w:r></w:p>
    <w:p><w:r><w:t>5. Rumus matematika dapat menggunakan notasi KaTeX diapit tanda dolar: $E = mc^2$ atau $x = \frac{-b \pm \sqrt{D}}{2a}$</w:t></w:r></w:p>
    <w:p><w:r><w:t>6. Teks Arab cukup diketik langsung dengan harakat.</w:t></w:r></w:p>
    <w:p><w:r><w:t>===============================================================</w:t></w:r></w:p>
    
    <w:p><w:r><w:t>1. Ibukota dari Negara Kesatuan Republik Indonesia pada saat ini adalah?</w:t></w:r></w:p>
    <w:p><w:r><w:t>A. Bandung</w:t></w:r></w:p>
    <w:p><w:r><w:t>B. Surabaya</w:t></w:r></w:p>
    <w:p><w:r><w:t>C. Jakarta</w:t></w:r></w:p>
    <w:p><w:r><w:t>D. Medan</w:t></w:r></w:p>
    <w:p><w:r><w:t>E. Makassar</w:t></w:r></w:p>
    <w:p><w:r><w:t>ANS: C</w:t></w:r></w:p>

    <w:p><w:r><w:t>2. Nilai diskriminan dari persamaan kuadrat $2x^2 + 5x - 3 = 0$ dengan rumus $D = b^2 - 4ac$ adalah?</w:t></w:r></w:p>
    <w:p><w:r><w:t>A. 25</w:t></w:r></w:p>
    <w:p><w:r><w:t>B. 49</w:t></w:r></w:p>
    <w:p><w:r><w:t>C. 1</w:t></w:r></w:p>
    <w:p><w:r><w:t>D. -1</w:t></w:r></w:p>
    <w:p><w:r><w:t>E. 36</w:t></w:r></w:p>
    <w:p><w:r><w:t>ANS: B</w:t></w:r></w:p>

    <w:p><w:r><w:t>3. Manakah terjemahan yang tepat dari kalimat bahasa Arab: هَذَا كِتَابٌ مُفِيدٌ لِلطَّالِبِ ?</w:t></w:r></w:p>
    <w:p><w:r><w:t>A. Ini meja belajar yang besar</w:t></w:r></w:p>
    <w:p><w:r><w:t>B. Ini buku yang bermanfaat bagi siswa</w:t></w:r></w:p>
    <w:p><w:r><w:t>C. Itu pensil milik guru</w:t></w:r></w:p>
    <w:p><w:r><w:t>D. Siswa sedang membaca buku di perpustakaan</w:t></w:r></w:p>
    <w:p><w:r><w:t>E. Buku ini sangat tebal</w:t></w:r></w:p>
    <w:p><w:r><w:t>ANS: B</w:t></w:r></w:p>

    <w:p><w:r><w:t>4. Manakah di antara protokol berikut yang termasuk dalam transport layer pada model TCP/IP? (Pilihan Ganda Kompleks)</w:t></w:r></w:p>
    <w:p><w:r><w:t>A. TCP (Transmission Control Protocol)</w:t></w:r></w:p>
    <w:p><w:r><w:t>B. IP (Internet Protocol)</w:t></w:r></w:p>
    <w:p><w:r><w:t>C. UDP (User Datagram Protocol)</w:t></w:r></w:p>
    <w:p><w:r><w:t>D. HTTP (Hypertext Transfer Protocol)</w:t></w:r></w:p>
    <w:p><w:r><w:t>E. FTP (File Transfer Protocol)</w:t></w:r></w:p>
    <w:p><w:r><w:t>ANS: A, C</w:t></w:r></w:p>

    <w:p><w:r><w:t>5. Jelaskan perbedaan mendasar antara topologi Star dan topologi Mesh dalam jaringan komputer beserta kelebihan masing-masing! [POIN: 10]</w:t></w:r></w:p>
    <w:p><w:r><w:t>ANS:</w:t></w:r></w:p>
  </w:body>
</w:document>`

	_, _ = io.WriteString(docXml, sampleContent)

	if err := zw.Close(); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}
