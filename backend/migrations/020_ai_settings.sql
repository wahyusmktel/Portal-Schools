CREATE TABLE IF NOT EXISTS ai_settings (
  id BIGINT PRIMARY KEY,
  base_url VARCHAR(255) NOT NULL DEFAULT 'https://waverouter.web.id/v1',
  api_key VARCHAR(255) NOT NULL DEFAULT '',
  model VARCHAR(100) NOT NULL DEFAULT 'glm-5.2',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO ai_settings (id, base_url, api_key, model, is_active)
SELECT 1, 'https://waverouter.web.id/v1', '', 'glm-5.2', TRUE
WHERE NOT EXISTS (SELECT 1 FROM ai_settings WHERE id = 1);
