// Package main implements a simple seeder for the initial majors (jurusan).
package main

import (
    "database/sql"
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
        Name           string
        Slug           string
        Summary        string
        Icon           string
        CoverImage     string
        Curriculum     string
        CareerProspects string
    }{
        {
            Name:           "Teknik Jaringan Akses Telekomunikasi (TJAT)",
            Slug:           "tjat",
            Summary:        "Mempelajari dan mendalami infrastruktur jaringan serat optik, akses broadband, dan sistem telekomunikasi nirkabel modern.",
            Icon:           "Radio",
            CoverImage:     "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=1200&auto=format&fit=crop",
            Curriculum:     "Dasar Telekomunikasi, Instalasi Fiber Optik, VSAT, Jaringan Nirkabel Terapan",
            CareerProspects: "Teknisi Fiber Optik, Network Engineer Provider, Spesialis Telekomunikasi",
        },
        {
            Name:           "Teknik Komputer dan Jaringan (TKJ)",
            Slug:           "tkj",
            Summary:        "Fokus pada rekayasa infrastruktur jaringan enterprise, keamanan siber, dan administrasi server tingkat lanjut.",
            Icon:           "Server",
            CoverImage:     "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1200&auto=format&fit=crop",
            Curriculum:     "Administrasi Server Linux/Windows, Keamanan Jaringan, Cloud Computing, Mikrotik/Cisco",
            CareerProspects: "System Administrator, Network Architect, Cyber Security Analyst",
        },
        {
            Name:           "Rekayasa Perangkat Lunak (RPL)",
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

    fmt.Println("Seeding majors completed successfully!")
}
