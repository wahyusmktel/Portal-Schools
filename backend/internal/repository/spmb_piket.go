package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"

	"portal-smktelkom/backend/internal/models"
)

func (r *Repository) AllSpmbPiketGroups(ctx context.Context, academicYear string) ([]models.SpmbPiketGroup, error) {
	query := `
		SELECT id, academic_year, group_number, group_name, day_name, time_range, dates_json, members_json, notes, created_at, updated_at
		FROM spmb_piket_groups
	`
	var args []interface{}
	if academicYear != "" {
		query += " WHERE academic_year = ?"
		args = append(args, academicYear)
	}
	query += " ORDER BY group_number ASC"

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var groups []models.SpmbPiketGroup
	for rows.Next() {
		var g models.SpmbPiketGroup
		var datesRaw, membersRaw []byte
		var notes sql.NullString

		if err := rows.Scan(
			&g.ID, &g.AcademicYear, &g.GroupNumber, &g.GroupName, &g.DayName, &g.TimeRange,
			&datesRaw, &membersRaw, &notes, &g.CreatedAt, &g.UpdatedAt,
		); err != nil {
			return nil, err
		}

		if notes.Valid {
			g.Notes = notes.String
		}

		if len(datesRaw) > 0 {
			_ = json.Unmarshal(datesRaw, &g.Dates)
		}
		if g.Dates == nil {
			g.Dates = []models.SpmbPiketDate{}
		}

		if len(membersRaw) > 0 {
			_ = json.Unmarshal(membersRaw, &g.Members)
		}
		if g.Members == nil {
			g.Members = []models.SpmbPiketMember{}
		}

		groups = append(groups, g)
	}

	return groups, rows.Err()
}

func (r *Repository) SpmbPiketGroupByID(ctx context.Context, id int64) (*models.SpmbPiketGroup, error) {
	query := `
		SELECT id, academic_year, group_number, group_name, day_name, time_range, dates_json, members_json, notes, created_at, updated_at
		FROM spmb_piket_groups
		WHERE id = ?
	`
	var g models.SpmbPiketGroup
	var datesRaw, membersRaw []byte
	var notes sql.NullString

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&g.ID, &g.AcademicYear, &g.GroupNumber, &g.GroupName, &g.DayName, &g.TimeRange,
		&datesRaw, &membersRaw, &notes, &g.CreatedAt, &g.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	if notes.Valid {
		g.Notes = notes.String
	}
	if len(datesRaw) > 0 {
		_ = json.Unmarshal(datesRaw, &g.Dates)
	}
	if len(membersRaw) > 0 {
		_ = json.Unmarshal(membersRaw, &g.Members)
	}

	return &g, nil
}

func (r *Repository) CreateSpmbPiketGroup(ctx context.Context, g *models.SpmbPiketGroup) error {
	datesJSON, err := json.Marshal(g.Dates)
	if err != nil {
		return err
	}
	membersJSON, err := json.Marshal(g.Members)
	if err != nil {
		return err
	}

	query := `
		INSERT INTO spmb_piket_groups (academic_year, group_number, group_name, day_name, time_range, dates_json, members_json, notes)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`
	res, err := r.db.ExecContext(ctx, query,
		g.AcademicYear, g.GroupNumber, g.GroupName, g.DayName, g.TimeRange, datesJSON, membersJSON, g.Notes,
	)
	if err != nil {
		return err
	}
	id, err := res.LastInsertId()
	if err == nil {
		g.ID = id
	}
	return nil
}

func (r *Repository) UpdateSpmbPiketGroup(ctx context.Context, g *models.SpmbPiketGroup) error {
	datesJSON, err := json.Marshal(g.Dates)
	if err != nil {
		return err
	}
	membersJSON, err := json.Marshal(g.Members)
	if err != nil {
		return err
	}

	query := `
		UPDATE spmb_piket_groups
		SET academic_year = ?, group_number = ?, group_name = ?, day_name = ?, time_range = ?, dates_json = ?, members_json = ?, notes = ?
		WHERE id = ?
	`
	res, err := r.db.ExecContext(ctx, query,
		g.AcademicYear, g.GroupNumber, g.GroupName, g.DayName, g.TimeRange, datesJSON, membersJSON, g.Notes, g.ID,
	)
	if err != nil {
		return err
	}
	affected, _ := res.RowsAffected()
	if affected == 0 {
		return errors.New("kelompok piket tidak ditemukan")
	}
	return nil
}

func (r *Repository) DeleteSpmbPiketGroup(ctx context.Context, id int64) error {
	res, err := r.db.ExecContext(ctx, "DELETE FROM spmb_piket_groups WHERE id = ?", id)
	if err != nil {
		return err
	}
	affected, _ := res.RowsAffected()
	if affected == 0 {
		return errors.New("kelompok piket tidak ditemukan")
	}
	return nil
}

func (r *Repository) SeedSpmbPiket(ctx context.Context) error {
	var count int
	err := r.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM spmb_piket_groups").Scan(&count)
	if err == nil && count > 0 {
		return nil // already seeded
	}

	const notes = "Perkelompok Nama Wajib Hadir Sesuai Hari dan Tanggal yang telah dijadwalkan"
	const ay = "2027/2028"
	const day = "SABTU"
	const timeRange = "07.30 - 12.00"

	groups := []models.SpmbPiketGroup{
		{
			AcademicYear: ay,
			GroupNumber:  1,
			GroupName:    "Kelompok 1",
			DayName:      day,
			TimeRange:    timeRange,
			Notes:        notes,
			Dates: []models.SpmbPiketDate{
				{Date: "2026-09-26", Label: "26 Sep 2026"},
				{Date: "2026-10-24", Label: "24 Oct 2026"},
				{Date: "2026-11-21", Label: "21 Nov 2026"},
				{Date: "2026-12-19", Label: "19 Dec 2026"},
				{Date: "2027-01-23", Label: "23 Jan 2027"},
				{Date: "2027-02-27", Label: "27 Feb 2027"},
				{Date: "2027-04-03", Label: "3 Apr 2027"},
				{Date: "2027-05-08", Label: "8 May 2027"},
				{Date: "2027-06-05", Label: "5 Jun 2027"},
				{Date: "2027-07-03", Label: "3 Jul 2027"},
			},
			Members: []models.SpmbPiketMember{
				{Order: 1, Name: "Imam Mahmudi, S.Pd."},
				{Order: 2, Name: "Suntoro, M.Acc."},
				{Order: 3, Name: "Shinta Amelia Wardhani, S.Pd."},
				{Order: 4, Name: "Tamara Azhar Azizah, S.Pd"},
				{Order: 5, Name: "Astri Damayanti, S.Pd."},
				{Order: 6, Name: "Hari Hartoyo, S.Pd."},
				{Order: 7, Name: "Imam Suhendri, S.Kom."},
				{Order: 8, Name: "Rendi Syaputra, S.Kom"},
				{Order: 9, Name: "Ahmad Ikhsan, M.Kom."},
				{Order: 10, Name: "Surya Aditia Pratama, S.Pd.I"},
			},
		},
		{
			AcademicYear: ay,
			GroupNumber:  2,
			GroupName:    "Kelompok 2",
			DayName:      day,
			TimeRange:    timeRange,
			Notes:        notes,
			Dates: []models.SpmbPiketDate{
				{Date: "2026-10-03", Label: "3 Oct 2026"},
				{Date: "2026-10-31", Label: "31 Oct 2026"},
				{Date: "2026-11-28", Label: "28 Nov 2026"},
				{Date: "2026-12-26", Label: "26 Dec 2026"},
				{Date: "2027-01-30", Label: "30 Jan 2027"},
				{Date: "2027-03-06", Label: "6 Mar 2027"},
				{Date: "2027-04-10", Label: "10 Apr 2027"},
				{Date: "2027-05-15", Label: "15 May 2027"},
				{Date: "2027-06-12", Label: "12 Jun 2027"},
			},
			Members: []models.SpmbPiketMember{
				{Order: 11, Name: "Azhar Mustofa, S.Kom."},
				{Order: 12, Name: "Desy Nur Anggita, S.Kom."},
				{Order: 13, Name: "Nifia Anda Ningrum, S.Pd"},
				{Order: 14, Name: "Yuni Marlina, S.Pd"},
				{Order: 15, Name: "Retno Ayu Ningsih, S.Pd"},
				{Order: 16, Name: "Khafidh Febriansyah, S.Pd."},
				{Order: 17, Name: "Aji Sakti Kurniawan, S.Kom."},
				{Order: 18, Name: "Irfan Novra Desando, S.Pd"},
				{Order: 19, Name: "Budi Safta Nugraha, S.Kom"},
				{Order: 20, Name: "Faalih Qowiy, M.Pd"},
			},
		},
		{
			AcademicYear: ay,
			GroupNumber:  3,
			GroupName:    "Kelompok 3",
			DayName:      day,
			TimeRange:    timeRange,
			Notes:        notes,
			Dates: []models.SpmbPiketDate{
				{Date: "2026-10-10", Label: "10 Oct 2026"},
				{Date: "2026-11-07", Label: "7 Nov 2026"},
				{Date: "2026-12-05", Label: "5 Dec 2026"},
				{Date: "2027-01-09", Label: "9 Jan 2027"},
				{Date: "2027-02-13", Label: "13 Feb 2027"},
				{Date: "2027-03-20", Label: "20 Mar 2027"},
				{Date: "2027-04-17", Label: "17 Apr 2027"},
				{Date: "2027-05-22", Label: "22 May 2027"},
				{Date: "2027-06-19", Label: "19 Jun 2027"},
			},
			Members: []models.SpmbPiketMember{
				{Order: 21, Name: "Fatriade Saputra, S.Kom."},
				{Order: 22, Name: "Mevita Yollanda, S.E."},
				{Order: 23, Name: "Dita Safitri, S.Pd."},
				{Order: 24, Name: "Muhammad Galih Febrian, S.Pd"},
				{Order: 25, Name: "Nur Cahyana Aminuallah, S.Kom"},
				{Order: 26, Name: "Wahyu Rahmat Hidayat, S.Kom."},
				{Order: 27, Name: "Evie Tyaswati, S.Pd"},
				{Order: 28, Name: "Hermawan Rijal Arasy, S.Kom."},
				{Order: 29, Name: "Ihwan Hamid Huazain, S.Kom."},
				{Order: 30, Name: "Anang Esa Sulistiawan, S.Kom"},
			},
		},
		{
			AcademicYear: ay,
			GroupNumber:  4,
			GroupName:    "Kelompok 4",
			DayName:      day,
			TimeRange:    timeRange,
			Notes:        notes,
			Dates: []models.SpmbPiketDate{
				{Date: "2026-10-17", Label: "17 Oct 2026"},
				{Date: "2026-11-14", Label: "14 Nov 2026"},
				{Date: "2026-12-12", Label: "12 Dec 2026"},
				{Date: "2027-01-16", Label: "16 Jan 2027"},
				{Date: "2027-02-20", Label: "20 Feb 2027"},
				{Date: "2027-03-27", Label: "27 Mar 2027"},
				{Date: "2027-04-24", Label: "24 Apr 2027"},
				{Date: "2027-05-29", Label: "29 May 2027"},
				{Date: "2027-06-26", Label: "26 Jun 2027"},
			},
			Members: []models.SpmbPiketMember{
				{Order: 31, Name: "Siti Khairunnisa, S.Pd."},
				{Order: 32, Name: "Hanifah Sahhan, S.Kom"},
				{Order: 33, Name: "Rizki Nurmansyah, S.Pd"},
				{Order: 34, Name: "Meliya Trisna Wahyuni, S.Pd"},
				{Order: 35, Name: "Sri Lastari, S.Pd"},
				{Order: 36, Name: "Arohman, S.Kom."},
				{Order: 37, Name: "Dany Rahmatullah, S.Kom."},
				{Order: 38, Name: "Mirza Abdi Wiguna, S.Pd"},
				{Order: 39, Name: "Hafizh Pubiando, S.Pd"},
				{Order: 40, Name: "Asep Perdiansyah, M.Pd"},
				{Order: 41, Name: "Erwin Romel, S.Kom."},
			},
		},
	}

	for _, g := range groups {
		if err := r.CreateSpmbPiketGroup(ctx, &g); err != nil {
			return err
		}
	}

	return nil
}
