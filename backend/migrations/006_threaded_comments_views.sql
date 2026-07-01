-- Migration 006: Add threaded comments and view count

ALTER TABLE article_comments
ADD COLUMN parent_id BIGINT NULL AFTER article_id,
ADD CONSTRAINT fk_article_comments_parent FOREIGN KEY (parent_id) REFERENCES article_comments(id) ON DELETE CASCADE;

ALTER TABLE articles
ADD COLUMN view_count INT NOT NULL DEFAULT 0;
