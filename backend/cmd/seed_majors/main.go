// Package main implements a simple seeder for the initial majors (jurusan).
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

	fmt.Println("Seeding Majors...")
	majors := []struct {
		Name       string
		Slug       string
		Summary    string
		Icon       string
		CoverImage string
		Curriculum []string
		Prospects  []string
		SortOrder  int
	}{
		{
			Name:       "Teknik Jaringan Akses Telekomunikasi",
			Slug:       "teknik-jaringan-akses-telekomunikasi",
			Summary:    "Mempelajari instalasi, pengukuran, dan pemeliharaan jaringan akses telekomunikasi berbasis fiber optic, radio, dan perangkat transmisi modern.",
			Icon:       "Radio",
			CoverImage: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=1600&auto=format&fit=crop",
			Curriculum: []string{
				"Dasar telekomunikasi",
				"Instalasi fiber optic dan FTTH",
				"Pengukuran jaringan akses",
				"Jaringan nirkabel terapan",
				"Keselamatan kerja lapangan",
			},
			Prospects: []string{
				"Teknisi fiber optic",
				"Access network technician",
				"Network engineer provider",
				"Field operation engineer",
			},
			SortOrder: 1,
		},
		{
			Name:       "Teknik Komputer dan Jaringan",
			Slug:       "teknik-komputer-dan-jaringan",
			Summary:    "Berfokus pada administrasi jaringan, server, keamanan infrastruktur, cloud dasar, dan layanan teknologi informasi untuk kebutuhan industri.",
			Icon:       "Server",
			CoverImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1600&auto=format&fit=crop",
			Curriculum: []string{
				"Administrasi server Linux dan Windows",
				"Routing dan switching",
				"Keamanan jaringan",
				"Cloud computing dasar",
				"Mikrotik dan Cisco",
			},
			Prospects: []string{
				"Network administrator",
				"System administrator",
				"IT infrastructure staff",
				"Cyber security analyst",
			},
			SortOrder: 2,
		},
		{
			Name:       "Rekayasa Perangkat Lunak",
			Slug:       "rekayasa-perangkat-lunak",
			Summary:    "Mengembangkan kemampuan membangun aplikasi web, mobile, basis data, UI/UX, dan produk digital dengan praktik kerja proyek.",
			Icon:       "Code2",
			CoverImage: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1600&auto=format&fit=crop",
			Curriculum: []string{
				"Pemrograman web frontend",
				"Backend dan REST API",
				"Mobile app development",
				"Database design",
				"UI/UX dan software testing",
			},
			Prospects: []string{
				"Frontend developer",
				"Backend developer",
				"Full-stack developer",
				"Software QA tester",
			},
			SortOrder: 3,
		},
		{
			Name:       "Animasi",
			Slug:       "animasi",
			Summary:    "Membekali siswa dengan kompetensi ilustrasi digital, storyboard, animasi 2D dan 3D, editing, compositing, serta produksi konten kreatif.",
			Icon:       "Film",
			CoverImage: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1600&auto=format&fit=crop",
			Curriculum: []string{
				"Desain karakter",
				"Storyboard",
				"Animasi 2D dan 3D",
				"Rigging",
				"Video editing dan compositing",
			},
			Prospects: []string{
				"Animator 2D/3D",
				"Concept artist",
				"Motion graphic designer",
				"Visual effect artist",
			},
			SortOrder: 4,
		},
	}

	for _, m := range majors {
		curriculumJSON, err := json.Marshal(m.Curriculum)
		if err != nil {
			log.Printf("Failed to encode curriculum for %s: %v", m.Name, err)
			continue
		}
		prospectsJSON, err := json.Marshal(m.Prospects)
		if err != nil {
			log.Printf("Failed to encode career prospects for %s: %v", m.Name, err)
			continue
		}

		_, err = db.Exec(`
            INSERT INTO majors (name, slug, summary, icon, cover_image, curriculum_json, career_prospects_json, sort_order, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)
            ON DUPLICATE KEY UPDATE
              name = VALUES(name),
              summary = VALUES(summary),
              icon = VALUES(icon),
              cover_image = VALUES(cover_image),
              curriculum_json = VALUES(curriculum_json),
              career_prospects_json = VALUES(career_prospects_json),
              sort_order = VALUES(sort_order),
              is_active = TRUE
        `, m.Name, m.Slug, m.Summary, m.Icon, m.CoverImage, string(curriculumJSON), string(prospectsJSON), m.SortOrder)
		if err != nil {
			log.Printf("Failed to insert major %s: %v", m.Name, err)
		}
	}

	if _, err := db.Exec(`
		UPDATE majors
		SET is_active = FALSE
		WHERE slug IN ('tjat', 'tkj', 'rpl', 'tjkt', 'pplg', 'dkv')
	`); err != nil {
		log.Printf("Failed to deactivate legacy major slugs: %v", err)
	}

	fmt.Println("Seeding majors completed successfully!")
}
