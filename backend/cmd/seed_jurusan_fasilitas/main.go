package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"

	"portal-smktelkom/backend/internal/config"
	_ "github.com/go-sql-driver/mysql"
)

func main() {
	cfg := config.Load()
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true", cfg.DBUser, cfg.DBPassword, cfg.DBHost, cfg.DBPort, cfg.DBName)
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	fmt.Println("Seeding Youtube URL...")
	_, err = db.Exec("UPDATE school_profiles SET youtube_embed_url = 'https://www.youtube.com/embed/dQw4w9WgXcQ' WHERE id = 1")
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("Seeding Majors...")
	majors := []struct {
		Name           string
		Slug           string
		Summary        string
		Icon           string
		CoverImage     string
		Curriculum     string
		CareerProspects string
	}{
		{
			Name:           "TJAT (Teknik Jaringan Akses Telekomunikasi)",
			Slug:           "tjat",
			Summary:        "Mempelajari dan mendalami infrastruktur jaringan serat optik, akses broadband, dan sistem telekomunikasi nirkabel modern.",
			Icon:           "Radio",
			CoverImage:     "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=1200&auto=format&fit=crop",
			Curriculum:     "Dasar Telekomunikasi, Instalasi Fiber Optik, VSAT, Jaringan Nirkabel Terapan",
			CareerProspects: "Teknisi Fiber Optik, Network Engineer Provider, Spesialis Telekomunikasi",
		},
		{
			Name:           "TKJ (Teknik Komputer dan Jaringan)",
			Slug:           "tkj",
			Summary:        "Fokus pada rekayasa infrastruktur jaringan enterprise, keamanan siber, dan administrasi server tingkat lanjut.",
			Icon:           "Server",
			CoverImage:     "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1200&auto=format&fit=crop",
			Curriculum:     "Administrasi Server Linux/Windows, Keamanan Jaringan, Cloud Computing, Mikrotik/Cisco",
			CareerProspects: "System Administrator, Network Architect, Cyber Security Analyst",
		},
		{
			Name:           "RPL (Rekayasa Perangkat Lunak)",
			Slug:           "rpl",
			Summary:        "Mencetak talenta programmer handal di bidang web development, mobile app, dan kecerdasan buatan.",
			Icon:           "Code2",
			CoverImage:     "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop",
			Curriculum:     "Pemrograman Web, Mobile App Development, Database Design, UI/UX",
			CareerProspects: "Fullstack Developer, Mobile Programmer, UI/UX Designer, Software Engineer",
		},
		{
			Name:           "Animasi",
			Slug:           "animasi",
			Summary:        "Berfokus pada industri kreatif, animasi 2D/3D, pemodelan, efek visual, hingga pengembangan game.",
			Icon:           "Film",
			CoverImage:     "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200&auto=format&fit=crop",
			Curriculum:     "Desain Karakter, Animasi 2D & 3D, Rigging, Game Engine, Video Editing",
			CareerProspects: "3D Animator, Concept Artist, Game Developer, Visual Effect (VFX) Artist",
		},
	}

	for _, m := range majors {
		_, err := db.Exec(`
			INSERT INTO majors (name, slug, summary, icon, cover_image, curriculum_json, career_prospects_json)
			VALUES (?, ?, ?, ?, ?, JSON_ARRAY(?), JSON_ARRAY(?))
			ON DUPLICATE KEY UPDATE summary=VALUES(summary), icon=VALUES(icon), cover_image=VALUES(cover_image), curriculum_json=VALUES(curriculum_json), career_prospects_json=VALUES(career_prospects_json)
		`, m.Name, m.Slug, m.Summary, m.Icon, m.CoverImage, m.Curriculum, m.CareerProspects)
		if err != nil {
			log.Printf("Failed to insert major %s: %v", m.Name, err)
		}
	}

	fmt.Println("Seeding Facilities...")
	facilities := []struct {
		Name        string
		Description string
		ImageURL    string
		Images      []string
		Icon        string
		SortOrder   int
	}{
		{
			Name:        "Smart Lab TJAT",
			Description: "Laboratorium Teknik Jaringan Akses Telekomunikasi modern dengan spesifikasi standar industri ISP. Dilengkapi Splicer Fiber Optik, OLT, ONT, dan perangkat transmisi nirkabel berteknologi tinggi untuk simulasi jaringan akses pita lebar sekelas Telkom.",
			ImageURL:    "https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=1200&auto=format&fit=crop",
			Images: []string{
				"https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=1200&auto=format&fit=crop",
				"https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1200&auto=format&fit=crop",
			},
			Icon:        "Wifi",
			SortOrder:   1,
		},
		{
			Name:        "Cyber Lab TKJ",
			Description: "Laboratorium Jaringan tingkat lanjut dengan AC sentral dan kursi ergonomis. Menyediakan rack server nyata, router Cisco/Mikrotik, dan lingkungan virtualisasi untuk praktik cyber security dan infrastruktur enterprise.",
			ImageURL:    "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1200&auto=format&fit=crop",
			Images: []string{
				"https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1200&auto=format&fit=crop",
				"https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop",
				"https://images.unsplash.com/photo-1614064641913-a53b118b6256?q=80&w=1200&auto=format&fit=crop",
			},
			Icon:        "Server",
			SortOrder:   2,
		},
		{
			Name:        "Software House RPL",
			Description: "Lab pengembangan perangkat lunak bernuansa startup Silicon Valley. Dilengkapi PC All-in-One berkinerja tinggi, layar ganda, dan ruang kolaborasi terbuka untuk membangun proyek web dan mobile application mutakhir.",
			ImageURL:    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop",
			Images: []string{
				"https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop",
				"https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop",
			},
			Icon:        "Laptop",
			SortOrder:   3,
		},
		{
			Name:        "Studio Animasi & Multimedia",
			Description: "Studio kreatif bertaraf industri pertelevisian. Tersedia workstation khusus rendering 3D, digital pen tablet/Cintiq, green screen, dan perangkat rekaman audio visual untuk mencetak karya animasi berkualitas bioskop.",
			ImageURL:    "https://images.unsplash.com/photo-1600132806370-bf17e65e942f?q=80&w=1200&auto=format&fit=crop",
			Images: []string{
				"https://images.unsplash.com/photo-1600132806370-bf17e65e942f?q=80&w=1200&auto=format&fit=crop",
				"https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200&auto=format&fit=crop",
			},
			Icon:        "MonitorPlay",
			SortOrder:   4,
		},
		{
			Name:        "Perpustakaan Digital Terpadu",
			Description: "Ruang baca futuristik yang menyediakan ribuan koleksi e-book IT dan referensi teknologi. Area yang nyaman, tenang, dan didukung koneksi Wi-Fi 6 berkecepatan gigabit.",
			ImageURL:    "https://images.unsplash.com/photo-1568667256549-094345857637?q=80&w=1200&auto=format&fit=crop",
			Images: []string{
				"https://images.unsplash.com/photo-1568667256549-094345857637?q=80&w=1200&auto=format&fit=crop",
				"https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=1200&auto=format&fit=crop",
			},
			Icon:        "BookOpen",
			SortOrder:   5,
		},
	}

	for _, f := range facilities {
		imagesBytes, _ := json.Marshal(f.Images)
		_, err := db.Exec(`
			INSERT INTO facilities (name, description, image_url, images_json, icon, sort_order)
			VALUES (?, ?, ?, ?, ?, ?)
			ON DUPLICATE KEY UPDATE description=VALUES(description), image_url=VALUES(image_url), images_json=VALUES(images_json), icon=VALUES(icon)
		`, f.Name, f.Description, f.ImageURL, string(imagesBytes), f.Icon, f.SortOrder)
		if err != nil {
			log.Printf("Failed to insert facility %s: %v", f.Name, err)
		}
	}

	fmt.Println("Seeding completed successfully!")
}
