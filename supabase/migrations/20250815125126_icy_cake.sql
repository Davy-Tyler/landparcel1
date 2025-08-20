-- Initialize PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create initial admin user (password: admin123)
INSERT INTO users (id, first_name, last_name, email, hashed_password, role, is_active)
VALUES (
    gen_random_uuid(),
    'System',
    'Administrator',
    'admin@landhub.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq5/H7S', -- admin123
    'master_admin',
    true
) ON CONFLICT (email) DO NOTHING;

-- Insert sample Tanzania location data
INSERT INTO regions (name) VALUES 
    ('Dar es Salaam'),
    ('Arusha'),
    ('Mwanza'),
    ('Dodoma'),
    ('Mbeya'),
    ('Kilimanjaro'),
    ('Tanga'),
    ('Morogoro')
ON CONFLICT (name) DO NOTHING;

-- Insert sample districts
INSERT INTO districts (name, region_id) VALUES 
    ('Kinondoni', (SELECT id FROM regions WHERE name = 'Dar es Salaam')),
    ('Ilala', (SELECT id FROM regions WHERE name = 'Dar es Salaam')),
    ('Temeke', (SELECT id FROM regions WHERE name = 'Dar es Salaam')),
    ('Arusha Urban', (SELECT id FROM regions WHERE name = 'Arusha')),
    ('Arusha Rural', (SELECT id FROM regions WHERE name = 'Arusha')),
    ('Moshi Urban', (SELECT id FROM regions WHERE name = 'Kilimanjaro')),
    ('Moshi Rural', (SELECT id FROM regions WHERE name = 'Kilimanjaro'))
ON CONFLICT (name, region_id) DO NOTHING;

-- Insert sample councils
INSERT INTO councils (name, district_id) VALUES 
    ('Kinondoni Municipal', (SELECT id FROM districts WHERE name = 'Kinondoni')),
    ('Ilala Municipal', (SELECT id FROM districts WHERE name = 'Ilala')),
    ('Temeke Municipal', (SELECT id FROM districts WHERE name = 'Temeke')),
    ('Arusha City', (SELECT id FROM districts WHERE name = 'Arusha Urban')),
    ('Arusha District', (SELECT id FROM districts WHERE name = 'Arusha Rural')),
    ('Moshi Municipal', (SELECT id FROM districts WHERE name = 'Moshi Urban')),
    ('Moshi Rural', (SELECT id FROM districts WHERE name = 'Moshi Rural'))
ON CONFLICT (name, district_id) DO NOTHING;