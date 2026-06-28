# Portal Website SMK Telkom Lampung

Monorepo portal utama SMK Telkom Lampung dengan:

- `frontend`: Next.js App Router, SEO metadata, halaman publik, dan dashboard admin.
- `backend`: Go REST API, MySQL, autentikasi cookie HTTP-only, role-based access control.
- `database`: migrasi SQL untuk tabel inti.

## Struktur

```text
.
├── backend
│   ├── cmd/api
│   ├── internal
│   └── migrations
├── frontend
│   ├── app
│   ├── components
│   ├── lib
│   └── types
├── .env.example
└── docker-compose.yml
```

## Jalankan lokal

1. Salin konfigurasi:

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
```

2. Jalankan MySQL lokal atau Docker:

```bash
docker compose up -d mysql
```

3. Jalankan backend:

```bash
cd backend
go mod download
go run ./cmd/api
```

4. Jalankan frontend:

```bash
cd frontend
npm install
npm run dev
```

Frontend default: `http://localhost:3000`  
Backend default: `http://localhost:8080`

## Akun awal

Backend akan membuat akun superadmin pertama jika tabel `users` masih kosong.

- Email: nilai `SEED_SUPERADMIN_EMAIL`
- Password: nilai `SEED_SUPERADMIN_PASSWORD`

Ganti nilai tersebut sebelum production.

## Catatan keamanan production

- Gunakan `APP_ENV=production`.
- Wajib ganti `JWT_SECRET` minimal 32 karakter acak.
- Gunakan HTTPS dan set `COOKIE_SECURE=true`.
- Batasi `CORS_ALLOWED_ORIGINS` ke domain resmi.
- Jalankan migrasi database dari `backend/migrations`.
- Jangan commit file `.env`.
