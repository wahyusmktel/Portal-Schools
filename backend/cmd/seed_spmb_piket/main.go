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
	if err := repo.SeedSpmbPiket(context.Background()); err != nil {
		log.Fatalf("spmb piket seed failed: %v", err)
	}

	log.Println("✅ Berhasil menjalankan seeder Jadwal Piket SPMB 2027/2028 (4 kelompok, 41 pegawai)!")
}
