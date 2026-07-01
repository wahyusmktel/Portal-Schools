package repository

import (
	"context"
	"portal-smktelkom/backend/internal/models"
)

func (r *Repository) CommentsByArticleID(ctx context.Context, articleID int64, onlyApproved bool) ([]models.Comment, error) {
	query := `
		SELECT id, article_id, parent_id, name, email, content, status, created_at
		FROM article_comments
		WHERE article_id = ?
	`
	if onlyApproved {
		query += " AND status = 'approved'"
	}
	query += " ORDER BY created_at ASC"

	rows, err := r.db.QueryContext(ctx, query, articleID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.Comment
	for rows.Next() {
		var item models.Comment
		if err := rows.Scan(&item.ID, &item.ArticleID, &item.ParentID, &item.Name, &item.Email, &item.Content, &item.Status, &item.CreatedAt); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *Repository) AllComments(ctx context.Context) ([]models.Comment, error) {
	query := `
		SELECT c.id, c.article_id, c.parent_id, c.name, c.email, c.content, c.status, c.created_at, a.title, a.slug
		FROM article_comments c
		JOIN articles a ON a.id = c.article_id
		ORDER BY c.created_at DESC LIMIT 100
	`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.Comment
	for rows.Next() {
		var item models.Comment
		if err := rows.Scan(&item.ID, &item.ArticleID, &item.ParentID, &item.Name, &item.Email, &item.Content, &item.Status, &item.CreatedAt, &item.ArticleTitle, &item.ArticleSlug); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *Repository) CreateComment(ctx context.Context, articleID int64, parentID *int64, name, email, content string) (int64, error) {
	result, err := r.db.ExecContext(ctx, `
		INSERT INTO article_comments (article_id, parent_id, name, email, content, status)
		VALUES (?, ?, ?, ?, ?, 'pending')
	`, articleID, parentID, name, email, content)
	if err != nil {
		return 0, err
	}
	return result.LastInsertId()
}

func (r *Repository) UpdateCommentStatus(ctx context.Context, id int64, status models.CommentStatus) error {
	_, err := r.db.ExecContext(ctx, "UPDATE article_comments SET status = ? WHERE id = ?", status, id)
	return err
}
