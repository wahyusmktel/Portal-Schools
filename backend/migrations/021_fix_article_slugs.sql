-- Clean up colons and URL-encoded characters in article slugs for clean routing
UPDATE articles
SET slug = LOWER(REPLACE(REPLACE(REPLACE(REPLACE(slug, ':', '-'), '%3a', '-'), '%3A', '-'), '!', ''))
WHERE slug LIKE '%:%' OR slug LIKE '%\%3a%' OR slug LIKE '%\%3A%' OR slug LIKE '%!%';
