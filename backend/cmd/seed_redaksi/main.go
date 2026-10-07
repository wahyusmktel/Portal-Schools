package main

import (
	"context"
	"log"

	"portal-smktelkom/backend/internal/config"
	"portal-smktelkom/backend/internal/database"
	"portal-smktelkom/backend/internal/repository"
)

func main() {
	cfg := config.Load()

	db, err := database.Open(cfg)
	if err != nil {
		log.Fatalf("database connection failed: %v", err)
	}
	defer db.Close()

	if err := database.RunMigrations(db, "migrations"); err != nil {
		log.Fatalf("database migration failed: %v", err)
	}

	repo := repository.New(db)
	err = repo.SeedRedaksi(
		context.Background(),
		"Tim Redaksi SMK Telkom Lampung",
		"redaksi@smktelkom-lpg.sch.id",
		"Redaksistella0101!",
	)
	if err != nil {
		log.Fatalf("gagal melakukan seeding akun redaksi: %v", err)
	}

	log.Println("Berhasil! Akun redaksi telah di-seed:")
	log.Println("Email    : redaksi@smktelkom-lpg.sch.id")
	log.Println("Password : Redaksistella0101!")
	log.Println("Role     : redaksi")
}
