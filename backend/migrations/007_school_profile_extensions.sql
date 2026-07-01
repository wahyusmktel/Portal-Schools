-- Migration 007: Add dynamic footer and social media to school_profiles

ALTER TABLE school_profiles
ADD COLUMN social_media JSON NULL,
ADD COLUMN partner_links JSON NULL,
ADD COLUMN footer_logo TEXT NULL,
ADD COLUMN footer_text TEXT NULL;
