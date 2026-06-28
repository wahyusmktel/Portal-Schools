SET @add_principal_name = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE school_profiles ADD COLUMN principal_name VARCHAR(190) NOT NULL DEFAULT ''Kepala SMK Telkom Lampung'' AFTER map_embed_url',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'school_profiles'
    AND COLUMN_NAME = 'principal_name'
);
PREPARE stmt FROM @add_principal_name;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_principal_title = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE school_profiles ADD COLUMN principal_title VARCHAR(190) NOT NULL DEFAULT ''Kepala Sekolah'' AFTER principal_name',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'school_profiles'
    AND COLUMN_NAME = 'principal_title'
);
PREPARE stmt FROM @add_principal_title;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_principal_message = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE school_profiles ADD COLUMN principal_message TEXT NULL AFTER principal_title',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'school_profiles'
    AND COLUMN_NAME = 'principal_message'
);
PREPARE stmt FROM @add_principal_message;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_principal_image = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE school_profiles ADD COLUMN principal_image TEXT NULL AFTER principal_message',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'school_profiles'
    AND COLUMN_NAME = 'principal_image'
);
PREPARE stmt FROM @add_principal_image;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE school_profiles
SET
  principal_name = 'Kepala SMK Telkom Lampung',
  principal_title = 'Kepala Sekolah',
  principal_message = 'Selamat datang di portal utama SMK Telkom Lampung. Website ini menjadi ruang informasi resmi untuk memperkenalkan profil sekolah, karya siswa, agenda, dan perkembangan pendidikan teknologi kepada masyarakat.',
  principal_image = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=900&q=82'
WHERE id = 1;
