// Package main seeds SEO-focused public content for SMK Telkom Lampung.
package main

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	"portal-smktelkom/backend/internal/config"

	_ "github.com/go-sql-driver/mysql"
)

type articleSeed struct {
	Title      string
	Slug       string
	Excerpt    string
	Content    string
	CoverImage string
	Category   string
	Published  time.Time
}

type faqSeed struct {
	Question  string
	Answer    string
	Category  string
	SortOrder int
}

func main() {
	cfg := config.Load()
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true&loc=Local", cfg.DBUser, cfg.DBPassword, cfg.DBHost, cfg.DBPort, cfg.DBName)
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatal(err)
	}

	fmt.Println("Seeding SEO articles...")
	for _, article := range articles() {
		if err := upsertArticle(db, article); err != nil {
			log.Printf("Failed to seed article %q: %v", article.Title, err)
		}
	}

	fmt.Println("Seeding FAQ...")
	for _, faq := range faqs() {
		if err := upsertFAQ(db, faq); err != nil {
			log.Printf("Failed to seed FAQ %q: %v", faq.Question, err)
		}
	}

	fmt.Println("SEO content seeding completed successfully!")
}

func upsertArticle(db *sql.DB, item articleSeed) error {
	_, err := db.Exec(`
		INSERT INTO articles (title, slug, excerpt, content, cover_image, category, status, published_at, author_id)
		VALUES (?, ?, ?, ?, ?, ?, 'published', ?, NULL)
		ON DUPLICATE KEY UPDATE
		  title = VALUES(title),
		  excerpt = VALUES(excerpt),
		  content = VALUES(content),
		  cover_image = VALUES(cover_image),
		  category = VALUES(category),
		  status = 'published',
		  published_at = VALUES(published_at)
	`, item.Title, item.Slug, item.Excerpt, item.Content, item.CoverImage, item.Category, item.Published)
	return err
}

func upsertFAQ(db *sql.DB, item faqSeed) error {
	var id int64
	err := db.QueryRow("SELECT id FROM faqs WHERE question = ? LIMIT 1", item.Question).Scan(&id)
	if err == nil {
		_, err = db.Exec(`
			UPDATE faqs
			SET answer = ?, category = ?, sort_order = ?
			WHERE id = ?
		`, item.Answer, item.Category, item.SortOrder, id)
		return err
	}
	if err != sql.ErrNoRows {
		return err
	}

	_, err = db.Exec(`
		INSERT INTO faqs (question, answer, category, sort_order)
		VALUES (?, ?, ?, ?)
	`, item.Question, item.Answer, item.Category, item.SortOrder)
	return err
}

func articles() []articleSeed {
	baseDate := time.Date(2026, time.July, 4, 9, 0, 0, 0, time.Local)
	return []articleSeed{
		{
			Title:      "4 Jurusan SMK Telkom Lampung yang Siap Membuka Jalan Karier Digital",
			Slug:       "4-jurusan-smk-telkom-lampung-karier-digital",
			Excerpt:    "Kenali empat jurusan SMK Telkom Lampung, mulai dari jaringan telekomunikasi, TKJ, RPL, hingga Animasi, beserta peluang kariernya.",
			CoverImage: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=82",
			Category:   "Jurusan",
			Published:  baseDate,
			Content: articleHTML(
				"Memilih jurusan SMK bukan hanya soal mata pelajaran, tetapi soal arah karier. SMK Telkom Lampung menghadirkan empat pilihan jurusan yang dekat dengan kebutuhan industri digital: Teknik Jaringan Akses Telekomunikasi, Teknik Komputer dan Jaringan, Rekayasa Perangkat Lunak, dan Animasi.",
				"Teknik Jaringan Akses Telekomunikasi cocok untuk siswa yang ingin memahami fiber optic, jaringan akses, dan infrastruktur layanan internet. Teknik Komputer dan Jaringan fokus pada server, routing, switching, dan keamanan jaringan. Rekayasa Perangkat Lunak mengarahkan siswa membangun aplikasi web, mobile, dan sistem database. Animasi menyiapkan talenta kreatif untuk desain karakter, motion, video, dan produksi konten visual.",
				"Keempat jurusan ini saling melengkapi. Siswa dapat membangun portofolio teknis, memahami budaya kerja industri, dan mulai mengenali peluang kerja sejak masa sekolah. Bagi calon siswa yang mencari SMK teknologi di Lampung, pilihan jurusan ini menjadi pintu masuk yang kuat menuju ekosistem digital.",
			),
		},
		{
			Title:      "Teknik Jaringan Akses Telekomunikasi SMK Telkom Lampung: Belajar Fiber Optic dari Dasar",
			Slug:       "teknik-jaringan-akses-telekomunikasi-smk-telkom-lampung",
			Excerpt:    "Jurusan Teknik Jaringan Akses Telekomunikasi membekali siswa dengan kompetensi fiber optic, FTTH, pengukuran jaringan, dan layanan telekomunikasi.",
			CoverImage: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1600&q=82",
			Category:   "TJAT",
			Published:  baseDate.Add(-1 * time.Hour),
			Content: articleHTML(
				"Teknik Jaringan Akses Telekomunikasi di SMK Telkom Lampung dirancang untuk siswa yang tertarik pada jaringan akses internet, fiber optic, FTTH, dan perangkat telekomunikasi. Kompetensi ini relevan karena kebutuhan konektivitas terus meningkat di rumah, sekolah, kantor, dan industri.",
				"Di jurusan ini, siswa belajar dasar telekomunikasi, instalasi kabel fiber optic, teknik penyambungan, pengukuran kualitas jaringan, serta keselamatan kerja lapangan. Pembelajaran tidak berhenti pada teori, tetapi diarahkan pada praktik agar siswa memahami alur kerja teknisi jaringan akses.",
				"Lulusan jurusan ini memiliki peluang sebagai teknisi fiber optic, access network technician, field operation engineer, dan technical support di perusahaan telekomunikasi atau penyedia layanan internet.",
			),
		},
		{
			Title:      "Teknik Komputer dan Jaringan SMK Telkom Lampung untuk Calon Network Administrator",
			Slug:       "teknik-komputer-dan-jaringan-smk-telkom-lampung",
			Excerpt:    "TKJ SMK Telkom Lampung mempersiapkan siswa memahami jaringan komputer, server, cloud dasar, dan keamanan infrastruktur IT.",
			CoverImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1600&q=82",
			Category:   "TKJ",
			Published:  baseDate.Add(-2 * time.Hour),
			Content: articleHTML(
				"Teknik Komputer dan Jaringan adalah pilihan tepat bagi siswa yang ingin bekerja di bidang infrastruktur IT. Di SMK Telkom Lampung, TKJ diarahkan untuk membentuk pemahaman tentang jaringan komputer, server, perangkat routing, switching, dan keamanan jaringan.",
				"Siswa mempelajari administrasi server Linux dan Windows, konfigurasi router, manajemen jaringan lokal, troubleshooting, serta dasar cyber security. Materi tersebut menjadi fondasi penting untuk menghadapi kebutuhan industri yang semakin bergantung pada sistem digital.",
				"Prospek lulusan TKJ mencakup network administrator, IT support, system administrator, network technician, dan junior cyber security analyst. Jurusan ini juga menjadi bekal kuat bagi siswa yang ingin melanjutkan studi di bidang teknologi informasi.",
			),
		},
		{
			Title:      "Rekayasa Perangkat Lunak SMK Telkom Lampung: Jalur Awal Menjadi Developer",
			Slug:       "rekayasa-perangkat-lunak-smk-telkom-lampung",
			Excerpt:    "RPL SMK Telkom Lampung membantu siswa membangun kemampuan coding, database, UI/UX, website, dan aplikasi digital.",
			CoverImage: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1600&q=82",
			Category:   "RPL",
			Published:  baseDate.Add(-3 * time.Hour),
			Content: articleHTML(
				"Rekayasa Perangkat Lunak adalah jurusan untuk siswa yang tertarik membuat website, aplikasi, sistem informasi, dan produk digital. Di SMK Telkom Lampung, siswa RPL belajar dari dasar pemrograman hingga praktik membangun proyek yang dapat masuk ke portofolio.",
				"Materi RPL mencakup HTML, CSS, JavaScript, backend, REST API, database, UI/UX, pengujian aplikasi, dan manajemen proyek sederhana. Siswa juga dibiasakan memecahkan masalah secara logis dan menulis kode yang rapi.",
				"Jurusan ini membuka peluang sebagai frontend developer, backend developer, full-stack junior developer, software QA tester, dan web developer. Dengan portofolio yang kuat, siswa dapat lebih siap masuk dunia kerja, magang, atau kuliah di bidang teknologi.",
			),
		},
		{
			Title:      "Jurusan Animasi SMK Telkom Lampung untuk Siswa Kreatif dan Visual Storyteller",
			Slug:       "jurusan-animasi-smk-telkom-lampung",
			Excerpt:    "Jurusan Animasi mengembangkan kemampuan desain karakter, storyboard, animasi 2D/3D, editing video, dan produksi konten kreatif.",
			CoverImage: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1600&q=82",
			Category:   "Animasi",
			Published:  baseDate.Add(-4 * time.Hour),
			Content: articleHTML(
				"Jurusan Animasi SMK Telkom Lampung cocok untuk siswa yang menyukai gambar, desain visual, storytelling, video, dan dunia kreatif digital. Industri kreatif membutuhkan talenta yang tidak hanya bisa menggambar, tetapi juga memahami proses produksi konten.",
				"Siswa belajar dasar desain, ilustrasi digital, storyboard, desain karakter, animasi 2D, animasi 3D, video editing, dan compositing. Pembelajaran diarahkan agar siswa mampu membuat karya yang bisa ditampilkan sebagai portofolio.",
				"Prospek jurusan Animasi mencakup animator, motion graphic designer, content creator, storyboard artist, video editor, dan visual effect artist. Kompetensi ini relevan untuk dunia media, iklan, game, edukasi, dan konten digital.",
			),
		},
		{
			Title:      "Cara Memilih Jurusan SMK Telkom Lampung Sesuai Minat dan Bakat",
			Slug:       "cara-memilih-jurusan-smk-telkom-lampung",
			Excerpt:    "Panduan memilih jurusan SMK Telkom Lampung berdasarkan minat, gaya belajar, portofolio, dan rencana karier masa depan.",
			CoverImage: "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1600&q=82",
			Category:   "SPMB",
			Published:  baseDate.Add(-5 * time.Hour),
			Content: articleHTML(
				"Memilih jurusan sebaiknya dimulai dari mengenali minat. Siswa yang suka jaringan, kabel, dan perangkat lapangan dapat mempertimbangkan Teknik Jaringan Akses Telekomunikasi. Siswa yang senang mengatur komputer, server, dan keamanan jaringan dapat memilih Teknik Komputer dan Jaringan.",
				"Jika tertarik membuat aplikasi, website, dan sistem digital, Rekayasa Perangkat Lunak menjadi pilihan yang kuat. Jika lebih dekat dengan gambar, visual, video, dan cerita kreatif, jurusan Animasi dapat menjadi ruang tumbuh yang tepat.",
				"Orang tua dan calon siswa dapat melihat kurikulum, prospek kerja, dan contoh proyek setiap jurusan sebelum mendaftar. Pilihan terbaik adalah jurusan yang membuat siswa bersemangat belajar sekaligus punya arah karier yang realistis.",
			),
		},
		{
			Title:      "Peluang Kerja Lulusan Jurusan Teknologi di SMK Telkom Lampung",
			Slug:       "peluang-kerja-lulusan-jurusan-teknologi-smk-telkom-lampung",
			Excerpt:    "Lulusan jurusan teknologi punya peluang di jaringan, software, support IT, telekomunikasi, animasi, dan konten digital.",
			CoverImage: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1600&q=82",
			Category:   "Karier",
			Published:  baseDate.Add(-6 * time.Hour),
			Content: articleHTML(
				"Perkembangan digital membuat kebutuhan talenta teknologi terus terbuka. Lulusan SMK yang memiliki portofolio dan pengalaman praktik punya peluang masuk ke berbagai bidang, mulai dari teknisi jaringan, IT support, web developer, hingga kreator konten visual.",
				"Jurusan Teknik Jaringan Akses Telekomunikasi dekat dengan dunia ISP dan telekomunikasi. TKJ relevan untuk infrastruktur IT perusahaan. RPL membuka jalur ke software development. Animasi memberi ruang di industri kreatif, media, desain, dan konten digital.",
				"Kunci utama bukan hanya nama jurusan, tetapi kemampuan siswa membangun kebiasaan belajar, disiplin proyek, komunikasi, dan portofolio. Karena itu, sekolah vokasi perlu menghubungkan pembelajaran dengan kebutuhan industri.",
			),
		},
		{
			Title:      "Mengapa SMK Telkom Lampung Cocok untuk Siswa yang Ingin Masuk Dunia Digital",
			Slug:       "mengapa-smk-telkom-lampung-cocok-untuk-dunia-digital",
			Excerpt:    "SMK Telkom Lampung menghadirkan lingkungan belajar teknologi untuk siswa yang ingin membangun kompetensi digital sejak sekolah.",
			CoverImage: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1600&q=82",
			Category:   "Sekolah",
			Published:  baseDate.Add(-7 * time.Hour),
			Content: articleHTML(
				"Dunia digital membutuhkan lulusan yang bisa belajar cepat, memahami teknologi, dan punya karakter kerja. SMK Telkom Lampung hadir sebagai pilihan bagi siswa yang ingin masuk ke lingkungan pendidikan vokasi dengan fokus teknologi.",
				"Empat jurusan yang tersedia memberi ruang bagi berbagai minat: jaringan akses, infrastruktur komputer, pengembangan aplikasi, dan animasi. Siswa dapat mengenal alat, software, metode kerja, dan proyek yang dekat dengan kebutuhan dunia industri.",
				"Bagi orang tua, memilih sekolah teknologi berarti membantu anak memiliki arah yang lebih jelas. Bagi siswa, ini adalah kesempatan membangun skill, portofolio, dan kepercayaan diri sejak dini.",
			),
		},
		{
			Title:      "Perbedaan TJAT, TKJ, RPL, dan Animasi di SMK Telkom Lampung",
			Slug:       "perbedaan-tjat-tkj-rpl-animasi-smk-telkom-lampung",
			Excerpt:    "Pahami perbedaan fokus belajar TJAT, TKJ, RPL, dan Animasi agar calon siswa lebih yakin memilih jurusan.",
			CoverImage: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1600&q=82",
			Category:   "Jurusan",
			Published:  baseDate.Add(-8 * time.Hour),
			Content: articleHTML(
				"TJAT, TKJ, RPL, dan Animasi sama-sama berada dalam ekosistem teknologi, tetapi fokusnya berbeda. TJAT berfokus pada jaringan akses telekomunikasi seperti fiber optic dan layanan internet. TKJ lebih dekat dengan jaringan komputer, server, dan keamanan infrastruktur.",
				"RPL berfokus pada pembuatan software, website, aplikasi, database, dan UI/UX. Animasi berfokus pada karya visual, desain karakter, storyboard, animasi, editing, dan produksi konten kreatif.",
				"Jika suka kerja lapangan dan infrastruktur jaringan, pilih TJAT. Jika suka perangkat jaringan dan server, pilih TKJ. Jika suka coding, pilih RPL. Jika suka visual dan cerita kreatif, pilih Animasi.",
			),
		},
		{
			Title:      "SPMB SMK Telkom Lampung: Persiapan Sebelum Memilih Jurusan",
			Slug:       "spmb-smk-telkom-lampung-persiapan-memilih-jurusan",
			Excerpt:    "Sebelum mendaftar SPMB, calon siswa dapat menyiapkan pilihan jurusan, data diri, dan gambaran minat belajar.",
			CoverImage: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=82",
			Category:   "SPMB",
			Published:  baseDate.Add(-9 * time.Hour),
			Content: articleHTML(
				"Sebelum mengikuti SPMB SMK Telkom Lampung, calon siswa sebaiknya membaca profil jurusan, memahami minat pribadi, dan berdiskusi dengan orang tua. Pilihan jurusan akan menentukan fokus belajar selama masa sekolah.",
				"Siapkan data seperti nama lengkap, nomor WhatsApp, alamat, asal sekolah, nama orang tua, dan pilihan jurusan. Informasi ini membantu proses pendaftaran berjalan lebih cepat dan rapi.",
				"Calon siswa juga dapat membaca artikel jurusan, melihat brosur SPMB, dan mempelajari peluang karier dari setiap program keahlian. Semakin jelas alasan memilih jurusan, semakin kuat motivasi belajar saat masuk sekolah.",
			),
		},
	}
}

func articleHTML(paragraphs ...string) string {
	body := ""
	for _, paragraph := range paragraphs {
		body += "<p>" + paragraph + "</p>"
	}
	return body
}

func faqs() []faqSeed {
	return []faqSeed{
		{
			Question:  "Apa saja jurusan di SMK Telkom Lampung?",
			Answer:    "SMK Telkom Lampung memiliki jurusan Teknik Jaringan Akses Telekomunikasi, Teknik Komputer dan Jaringan, Rekayasa Perangkat Lunak, dan Animasi.",
			Category:  "Jurusan",
			SortOrder: 1,
		},
		{
			Question:  "Jurusan apa yang cocok untuk siswa yang suka coding?",
			Answer:    "Siswa yang suka coding, website, aplikasi, database, dan UI/UX dapat memilih Rekayasa Perangkat Lunak.",
			Category:  "Jurusan",
			SortOrder: 2,
		},
		{
			Question:  "Apa beda Teknik Jaringan Akses Telekomunikasi dan Teknik Komputer Jaringan?",
			Answer:    "Teknik Jaringan Akses Telekomunikasi fokus pada jaringan akses seperti fiber optic dan layanan telekomunikasi, sedangkan Teknik Komputer dan Jaringan fokus pada jaringan komputer, server, routing, switching, dan keamanan infrastruktur IT.",
			Category:  "Jurusan",
			SortOrder: 3,
		},
		{
			Question:  "Apakah jurusan Animasi hanya belajar menggambar?",
			Answer:    "Tidak. Jurusan Animasi juga mempelajari storyboard, desain karakter, animasi 2D dan 3D, editing video, compositing, dan produksi konten kreatif.",
			Category:  "Jurusan",
			SortOrder: 4,
		},
		{
			Question:  "Apakah lulusan SMK Telkom Lampung bisa langsung bekerja?",
			Answer:    "Lulusan dapat menyiapkan diri untuk bekerja, magang, berwirausaha, atau melanjutkan kuliah. Peluangnya bergantung pada kompetensi, portofolio, dan kesiapan masing-masing siswa.",
			Category:  "Karier",
			SortOrder: 5,
		},
		{
			Question:  "Bagaimana cara daftar SPMB SMK Telkom Lampung?",
			Answer:    "Calon siswa dapat membuka halaman SPMB, mengisi formulir pendaftaran, memilih jurusan, lalu mengikuti instruksi daftar ulang yang diberikan setelah formulir terkirim.",
			Category:  "SPMB",
			SortOrder: 6,
		},
		{
			Question:  "Apakah pilihan jurusan bisa dipertimbangkan bersama orang tua?",
			Answer:    "Sangat disarankan. Calon siswa sebaiknya membaca profil jurusan, memahami minat, lalu berdiskusi dengan orang tua sebelum menentukan pilihan.",
			Category:  "SPMB",
			SortOrder: 7,
		},
		{
			Question:  "Apa manfaat membaca artikel jurusan sebelum mendaftar?",
			Answer:    "Artikel jurusan membantu calon siswa memahami materi belajar, prospek karier, dan perbedaan setiap jurusan sehingga keputusan pendaftaran lebih matang.",
			Category:  "SPMB",
			SortOrder: 8,
		},
	}
}
