package models

import "time"

type SpmbPiketMember struct {
	Order int    `json:"order"`
	Name  string `json:"name"`
	Notes string `json:"notes,omitempty"`
}

type SpmbPiketDate struct {
	Date  string `json:"date"`  // YYYY-MM-DD
	Label string `json:"label"` // e.g. "26 Sep 2026"
}

type SpmbPiketGroup struct {
	ID           int64             `json:"id"`
	AcademicYear string            `json:"academicYear"`
	GroupNumber  int               `json:"groupNumber"`
	GroupName    string            `json:"groupName"`
	DayName      string            `json:"dayName"`
	TimeRange    string            `json:"timeRange"`
	Dates        []SpmbPiketDate   `json:"dates"`
	Members      []SpmbPiketMember `json:"members"`
	Notes        string            `json:"notes"`
	CreatedAt    time.Time         `json:"createdAt"`
	UpdatedAt    time.Time         `json:"updatedAt"`
}
