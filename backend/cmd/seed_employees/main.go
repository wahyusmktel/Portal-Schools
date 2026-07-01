package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"portal-smktelkom/backend/internal/config"
	"portal-smktelkom/backend/internal/repository"
	"portal-smktelkom/backend/internal/models"
)

func main() {
	cfg := config.Load()

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true", cfg.DBUser, cfg.DBPassword, cfg.DBHost, cfg.DBPort, cfg.DBName)
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		log.Fatalf("failed to open database: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("failed to ping database: %v", err)
	}

	repo := repository.New(db)
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	fmt.Println("Seeding 20 employees (10 active, 10 inactive)...")

	// Dummy data setup
	roles := []string{"Guru Matematika", "Guru Bahasa Inggris", "Staf Tata Usaha", "Wakil Kepala Sekolah", "Guru Produktif RPL", "Guru Produktif TKJ", "Petugas Perpustakaan", "Pembina OSIS"}

	for i := 1; i <= 20; i++ {
		isActive := i <= 10
		statusLabel := "active"
		if !isActive {
			statusLabel = "inactive"
		}

		name := fmt.Sprintf("Pegawai %s %d", statusLabel, i)
		role := roles[i%len(roles)]
		bio := fmt.Sprintf("Ini adalah biografi singkat untuk %s. Memiliki dedikasi tinggi dalam memajukan pendidikan.", name)
		
		// Use UI Avatars for placeholder images with different colors
		imageURL := fmt.Sprintf("https://ui-avatars.com/api/?name=Pegawai+%d&background=random&color=fff&size=256", i)

		socialLinks := []models.SocialLink{
			{Label: "Instagram", Value: fmt.Sprintf("https://instagram.com/pegawai%d", i)},
			{Label: "Email", Value: fmt.Sprintf("mailto:pegawai%d@smktelkom.sch.id", i)},
		}

		var period string
		if !isActive {
			startYear := 2000 + i
			endYear := startYear + 5
			period = fmt.Sprintf("%d - %d", startYear, endYear)
		}

		payload := models.Employee{
			Name:             name,
			Role:             role,
			Biography:        bio,
			ImageURL:         imageURL,
			SocialLinks:      socialLinks,
			EmploymentPeriod: period,
			IsActive:         isActive,
			SortOrder:        i,
		}

		_, err := repo.CreateEmployee(ctx, payload)
		if err != nil {
			log.Printf("Failed to insert employee %d: %v", i, err)
		} else {
			fmt.Printf("Inserted employee: %s\n", name)
		}
	}

	fmt.Println("Seeding completed successfully!")
}
