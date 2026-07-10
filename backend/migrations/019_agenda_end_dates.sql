SET @add_agenda_ends_at = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE agendas ADD COLUMN ends_at DATETIME NULL AFTER starts_at',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'agendas'
    AND COLUMN_NAME = 'ends_at'
);
PREPARE stmt FROM @add_agenda_ends_at;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE agendas
SET ends_at = starts_at
WHERE ends_at IS NULL;
