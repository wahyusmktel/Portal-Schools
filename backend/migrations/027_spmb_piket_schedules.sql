CREATE TABLE IF NOT EXISTS spmb_piket_groups (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    academic_year VARCHAR(20) NOT NULL DEFAULT '2027/2028',
    group_number INT NOT NULL,
    group_name VARCHAR(50) NOT NULL,
    day_name VARCHAR(50) NOT NULL DEFAULT 'SABTU',
    time_range VARCHAR(50) NOT NULL DEFAULT '07.30 - 12.00',
    dates_json JSON NOT NULL,
    members_json JSON NOT NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_piket_academic_year (academic_year),
    INDEX idx_piket_group (group_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
