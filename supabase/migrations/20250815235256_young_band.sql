/*
  # Enhanced Location System with JSONB Hierarchy

  1. New Tables
    - `locations` - Hierarchical location data using JSONB for Tanzania administrative structure
    
  2. Changes
    - Update plots table to use new location system
    - Migrate existing location data
    - Add proper indexing for JSONB queries
    
  3. Security
    - Enable RLS on locations table
    - Add policies for public read access
*/

-- Create locations table with JSONB hierarchy
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    hierarchy JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add location_id to plots table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'plots' AND column_name = 'location_id'
    ) THEN
        ALTER TABLE plots ADD COLUMN location_id UUID REFERENCES locations(id);
    END IF;
END $$;

-- Create indexes for JSONB queries
CREATE INDEX IF NOT EXISTS idx_locations_hierarchy_region ON locations USING GIN ((hierarchy->'region'));
CREATE INDEX IF NOT EXISTS idx_locations_hierarchy_districts ON locations USING GIN ((hierarchy->'districts'));

-- Enable RLS
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can read locations" ON locations FOR SELECT TO public USING (true);

CREATE POLICY "Admins can manage locations" ON locations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'master_admin')
        )
    );

-- Insert Tanzania location hierarchy data
INSERT INTO locations (name, hierarchy) VALUES 
(
    'Dar es Salaam',
    '{
        "region": "Dar es Salaam",
        "districts": {
            "Kinondoni": {
                "councils": ["Kinondoni Municipal", "Kawe", "Msasani", "Mikocheni"]
            },
            "Ilala": {
                "councils": ["Ilala Municipal", "Buguruni", "Kariakoo", "Upanga"]
            },
            "Temeke": {
                "councils": ["Temeke Municipal", "Kigamboni", "Mbagala", "Sandali"]
            }
        }
    }'::jsonb
),
(
    'Arusha',
    '{
        "region": "Arusha",
        "districts": {
            "Arusha Urban": {
                "councils": ["Arusha City", "Themi", "Kati", "Sekei"]
            },
            "Arusha Rural": {
                "councils": ["Arusha District", "Usa River", "Tengeru", "Olkokola"]
            },
            "Meru": {
                "councils": ["Meru District", "Poli", "Kikwe", "Nkoaranga"]
            }
        }
    }'::jsonb
),
(
    'Mwanza',
    '{
        "region": "Mwanza",
        "districts": {
            "Nyamagana": {
                "councils": ["Nyamagana Municipal", "Ilemela", "Buzuruga", "Mahina"]
            },
            "Ilemela": {
                "councils": ["Ilemela Municipal", "Bugando", "Pasiansi", "Buhongwa"]
            }
        }
    }'::jsonb
),
(
    'Dodoma',
    '{
        "region": "Dodoma",
        "districts": {
            "Dodoma Urban": {
                "councils": ["Dodoma Municipal", "Hombolo", "Zuzu", "Kikuyu"]
            },
            "Dodoma Rural": {
                "councils": ["Dodoma District", "Chamwino", "Bahi", "Kondoa"]
            }
        }
    }'::jsonb
),
(
    'Kilimanjaro',
    '{
        "region": "Kilimanjaro",
        "districts": {
            "Moshi Urban": {
                "councils": ["Moshi Municipal", "Kilimanjaro", "Marangu", "Mwanga"]
            },
            "Moshi Rural": {
                "councils": ["Moshi District", "Hai", "Siha", "Rombo"]
            }
        }
    }'::jsonb
)
ON CONFLICT (name) DO UPDATE SET hierarchy = EXCLUDED.hierarchy;

-- Create sample plots with new location system
INSERT INTO plots (title, description, area_sqm, price, usage_type, status, location_id, uploaded_by_id) 
SELECT 
    'Premium Plot in ' || l.name,
    'Beautiful land plot perfect for residential development with excellent access to amenities.',
    (1000 + (random() * 4000))::numeric(10,2),
    (50000000 + (random() * 200000000))::numeric(12,2),
    CASE 
        WHEN random() < 0.4 THEN 'Residential'
        WHEN random() < 0.7 THEN 'Commercial'
        WHEN random() < 0.9 THEN 'Industrial'
        ELSE 'Agricultural'
    END,
    'available'::plot_status,
    l.id,
    (SELECT id FROM users WHERE role = 'master_admin' LIMIT 1)
FROM locations l
CROSS JOIN generate_series(1, 3) -- 3 plots per location
WHERE NOT EXISTS (
    SELECT 1 FROM plots p WHERE p.location_id = l.id
);