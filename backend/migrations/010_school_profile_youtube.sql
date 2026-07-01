-- Migration 010: Add youtube_embed_url to school_profiles
SET @dbname = DATABASE();

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE table_name = 'school_profiles'
    AND table_schema = @dbname
    AND column_name = 'youtube_embed_url'
  ) > 0,
  'SELECT 1',
  'ALTER TABLE school_profiles ADD COLUMN youtube_embed_url TEXT NULL AFTER map_embed_url'
));

PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
