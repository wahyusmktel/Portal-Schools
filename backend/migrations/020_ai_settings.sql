CREATE TABLE IF NOT EXISTS ai_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    base_url TEXT NOT NULL DEFAULT 'https://waverouter.web.id/v1',
    api_key TEXT NOT NULL DEFAULT '',
    model TEXT NOT NULL DEFAULT 'glm-5.2',
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO ai_settings (id, base_url, api_key, model, is_active)
SELECT 1, 'https://waverouter.web.id/v1', '', 'glm-5.2', 1
WHERE NOT EXISTS (SELECT 1 FROM ai_settings WHERE id = 1);
