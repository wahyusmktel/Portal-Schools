package config

import (
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	AppEnv                 string
	HTTPPort               string
	DBHost                 string
	DBPort                 string
	DBName                 string
	DBUser                 string
	DBPassword             string
	FrontendURL            string
	CORSAllowedOrigins     []string
	JWTSecret              string
	JWTTTL                 time.Duration
	CookieDomain           string
	CookieSecure           bool
	SeedSuperadminName     string
	SeedSuperadminEmail    string
	SeedSuperadminPassword string
}

func Load() Config {
	_ = godotenv.Load()

	ttlMinutes, err := strconv.Atoi(env("JWT_TTL_MINUTES", "120"))
	if err != nil || ttlMinutes < 15 {
		ttlMinutes = 120
	}

	return Config{
		AppEnv:                 env("APP_ENV", "development"),
		HTTPPort:               env("HTTP_PORT", env("BACKEND_PORT", "8080")),
		DBHost:                 env("DB_HOST", env("MYSQL_HOST", "127.0.0.1")),
		DBPort:                 env("DB_PORT", env("MYSQL_PORT", "3306")),
		DBName:                 env("DB_NAME", env("MYSQL_DATABASE", "portal_smk_telkom_lampung")),
		DBUser:                 env("DB_USER", env("MYSQL_USER", "root")),
		DBPassword:             env("DB_PASSWORD", env("MYSQL_PASSWORD", "0899")),
		FrontendURL:            env("FRONTEND_URL", "http://localhost:3000"),
		CORSAllowedOrigins:     splitCSV(env("CORS_ALLOWED_ORIGINS", env("FRONTEND_URL", "http://localhost:3000"))),
		JWTSecret:              env("JWT_SECRET", "change-this-local-secret-minimum-32-characters"),
		JWTTTL:                 time.Duration(ttlMinutes) * time.Minute,
		CookieDomain:           env("COOKIE_DOMAIN", ""),
		CookieSecure:           env("COOKIE_SECURE", "false") == "true",
		SeedSuperadminName:     env("SEED_SUPERADMIN_NAME", "Super Admin"),
		SeedSuperadminEmail:    env("SEED_SUPERADMIN_EMAIL", "superadmin@smktelkom-lpg.sch.id"),
		SeedSuperadminPassword: env("SEED_SUPERADMIN_PASSWORD", "ChangeMe123!"),
	}
}

func env(key string, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
}

func splitCSV(value string) []string {
	parts := strings.Split(value, ",")
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		item := strings.TrimSpace(part)
		if item != "" {
			result = append(result, item)
		}
	}
	return result
}
