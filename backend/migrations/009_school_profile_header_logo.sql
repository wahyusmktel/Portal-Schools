-- Migration 009: Add header_logo to school_profiles
SET @dbname = DATABASE();

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE table_name = 'school_profiles'
    AND table_schema = @dbname
    AND column_name = 'header_logo'
  ) > 0,
  'SELECT 1',
  'ALTER TABLE school_profiles ADD COLUMN header_logo TEXT NULL AFTER partner_links'
));

PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
