package models

import "time"

type CommentStatus string

const (
	CommentStatusPending  CommentStatus = "pending"
	CommentStatusApproved CommentStatus = "approved"
	CommentStatusRejected CommentStatus = "rejected"
)

type Comment struct {
	ID        int64         `json:"id"`
	ArticleID int64         `json:"articleId"`
	ParentID  *int64        `json:"parentId,omitempty"`
	Name      string        `json:"name"`
	Email     string        `json:"email"`
	Content   string        `json:"content"`
	Status    CommentStatus `json:"status"`
	CreatedAt time.Time     `json:"createdAt"`
	UpdatedAt time.Time     `json:"updatedAt"`

	// Joined fields
	ArticleTitle string    `json:"articleTitle,omitempty"`
	ArticleSlug  string    `json:"articleSlug,omitempty"`
	Replies      []Comment `json:"replies,omitempty"`
}
