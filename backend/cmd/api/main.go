package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"portal-smktelkom/backend/internal/auth"
	"portal-smktelkom/backend/internal/config"
	"portal-smktelkom/backend/internal/database"
	"portal-smktelkom/backend/internal/handlers"
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
	if err := repo.SeedSuperadmin(context.Background(), cfg.SeedSuperadminName, cfg.SeedSuperadminEmail, cfg.SeedSuperadminPassword); err != nil {
		log.Fatalf("superadmin seed failed: %v", err)
	}

	tokenManager := auth.NewTokenManager(cfg.JWTSecret, cfg.JWTTTL)
	router := handlers.NewRouter(cfg, repo, tokenManager)

	server := &http.Server{
		Addr:              ":" + cfg.HTTPPort,
		Handler:           router,
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       20 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	go func() {
		log.Printf("api listening on http://localhost:%s", cfg.HTTPPort)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server failed: %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Printf("server shutdown failed: %v", err)
	}
}
