package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"portal-smktelkom/backend/internal/config"
	"portal-smktelkom/backend/internal/models"
	"portal-smktelkom/backend/internal/repository"
)

type employeeSeed struct {
	Name   string
	Role   string
	Avatar string
}

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
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	fmt.Println("Clearing old employee records...")
	if _, err := db.ExecContext(ctx, "DELETE FROM employees"); err != nil {
		log.Fatalf("failed to clear employees: %v", err)
	}
	_, _ = db.ExecContext(ctx, "ALTER TABLE employees AUTO_INCREMENT = 1")

	// 42 Official Employees of SMK Telkom Lampung
	employees := []employeeSeed{
		{"Ahmad Ikhsan", "Guru / Tenaga Pendidik", "/images/avatars/avatar-male.svg"},
		{"Aji Sakti Kurniawan", "Guru / Tenaga Pendidik", "/images/avatars/avatar-male.svg"},
		{"Anang Esa Sulistiawan", "Guru / Tenaga Pendidik", "/images/avatars/avatar-male.svg"},
		{"Arohman", "Guru / Tenaga Pendidik", "/images/avatars/avatar-male.svg"},
		{"Asep Perdiansyah", "Guru / Tenaga Pendidik", "/images/avatars/avatar-male.svg"},
		{"Astri Damayanti", "Guru / Tenaga Pendidik", "/images/avatars/avatar-female.svg"},
		{"Azhar Mustofa", "Guru / Tenaga Pendidik", "/images/avatars/avatar-male.svg"},
		{"Budi Saffa Nugraha", "Guru / Tenaga Pendidik", "/images/avatars/avatar-male.svg"},
		{"Dany Rahmatullah", "Guru / Tenaga Pendidik", "/images/avatars/avatar-male.svg"},
		{"Dedi Eko Cahyono", "Guru / Tenaga Pendidik", "/images/avatars/avatar-male.svg"},
		{"Desy Nur Anggita", "Tenaga Kependidikan (TPA)", "/images/avatars/avatar-female.svg"},
		{"Dita Safitri", "Guru / Tenaga Pendidik", "/images/avatars/avatar-female.svg"},
		{"Erwin Romel", "Guru / Tenaga Pendidik", "/images/avatars/avatar-male.svg"},
		{"Evie Tyaswati", "Guru / Tenaga Pendidik", "/images/avatars/avatar-female.svg"},
		{"Faalih Qowiy", "Guru / Tenaga Pendidik", "/images/avatars/avatar-male.svg"},
		{"Fatriade Saputra", "Guru / Tenaga Pendidik", "/images/avatars/avatar-male.svg"},
		{"Hafizh Pubiando", "Guru / Tenaga Pendidik", "/images/avatars/avatar-male.svg"},
		{"Hanifah Sahhan", "Guru / Tenaga Pendidik", "/images/avatars/avatar-female.svg"},
		{"Hari Hartoyo", "Guru / Tenaga Pendidik", "/images/avatars/avatar-male.svg"},
		{"Hermawan Rijal Arasy", "Guru / Tenaga Pendidik", "/images/avatars/avatar-male.svg"},
		{"Ihwan Hamid Huzain", "Guru / Tenaga Pendidik", "/images/avatars/avatar-male.svg"},
		{"Imam Mahmudi", "Guru / Tenaga Pendidik", "/images/avatars/avatar-male.svg"},
		{"Imam Suhendri", "Guru / Tenaga Pendidik", "/images/avatars/avatar-male.svg"},
		{"Irfan Novra Desando", "Guru / Tenaga Pendidik", "/images/avatars/avatar-male.svg"},
		{"Khafidh Febriansyah", "Guru / Tenaga Pendidik", "/images/avatars/avatar-male.svg"},
		{"Meliya Trisna Wahyuni", "Guru / Tenaga Pendidik", "/images/avatars/avatar-female.svg"},
		{"Mevita Yollanda", "Tenaga Kependidikan (TPA)", "/images/avatars/avatar-female.svg"},
		{"Mirza Abdi Wiguna", "Guru / Tenaga Pendidik", "/images/avatars/avatar-male.svg"},
		{"Muhammad Galih Febrian", "Guru / Tenaga Pendidik", "/images/avatars/avatar-male.svg"},
		{"Nifia Anda Ningrum", "Guru / Tenaga Pendidik", "/images/avatars/avatar-female.svg"},
		{"Nur Cahyana Aminuallah", "Guru / Tenaga Pendidik", "/images/avatars/avatar-male.svg"},
		{"Rendi Syaputra", "Guru / Tenaga Pendidik", "/images/avatars/avatar-male.svg"},
		{"Retno Ayu Ningsih", "Guru / Tenaga Pendidik", "/images/avatars/avatar-female.svg"},
		{"Rizki Nurmansyah", "Guru / Tenaga Pendidik", "/images/avatars/avatar-male.svg"},
		{"Shinta Amelia Wardhani", "Guru / Tenaga Pendidik", "/images/avatars/avatar-female.svg"},
		{"Siti Khairunnisa", "Guru / Tenaga Pendidik", "/images/avatars/avatar-female.svg"},
		{"Sri Lastari", "Guru / Tenaga Pendidik", "/images/avatars/avatar-female.svg"},
		{"Suntoro", "Tenaga Kependidikan (TPA)", "/images/avatars/avatar-male.svg"},
		{"Surya Aditia Pratama", "Guru / Tenaga Pendidik", "/images/avatars/avatar-male.svg"},
		{"Tamara Azhar Azizah", "Guru / Tenaga Pendidik", "/images/avatars/avatar-female.svg"},
		{"Wahyu Rahmat Hidayat", "Guru / Tenaga Pendidik", "/images/avatars/avatar-male.svg"},
		{"Yuni Marlina", "Guru / Tenaga Pendidik", "/images/avatars/avatar-female.svg"},
	}

	fmt.Printf("Seeding %d official employees...\n", len(employees))

	for i, emp := range employees {
		sortOrder := i + 1
		payload := models.Employee{
			Name:             emp.Name,
			Role:             emp.Role,
			Biography:        "",
			ImageURL:         emp.Avatar,
			SocialLinks:      []models.SocialLink{},
			EmploymentPeriod: "",
			IsActive:         true,
			SortOrder:        sortOrder,
		}

		_, err := repo.CreateEmployee(ctx, payload)
		if err != nil {
			log.Printf("Failed to insert employee %d: %v", sortOrder, err)
		} else {
			fmt.Printf("[%d/%d] Inserted: %s (%s)\n", sortOrder, len(employees), emp.Name, emp.Role)
		}
	}

	fmt.Println("Seeding completed successfully!")
}
