-- Migration 012: Add multiple images support for facilities
ALTER TABLE facilities ADD COLUMN images_json JSON NULL AFTER image_url;
