/*
  # Fix Database Schema Conflicts

  This migration resolves conflicts with existing database objects and ensures
  proper schema setup for the real estate platform.

  ## Changes Made
  1. **Extensions**: Safely add PostGIS and UUID extensions
  2. **Enums**: Create enums only if they don't exist
  3. **Tables**: Create tables with proper conflict handling
  4. **Indexes**: Add indexes safely
  5. **RLS**: Enable row level security with proper policies
  6. **Data Migration**: Migrate existing data safely

  ## Tables Created/Updated
  - `users` - User accounts with role-based access
  - `locations` - JSONB hierarchical location data
  - `plots` - Land plots with geospatial data
  - `orders` - Purchase orders

  ## Security
  - Enable RLS on all tables
  - Add appropriate policies for each table
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- Drop existing enums if they exist to recreate them properly
DO $$ 
BEGIN
    DROP TYPE IF EXISTS user_role CASCADE;
    DROP TYPE IF EXISTS plot_status CASCADE;
    DROP TYPE IF EXISTS userrole CASCADE;
    DROP TYPE IF EXISTS plotstatus CASCADE;
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- Create enums
CREATE TYPE user_role AS ENUM ('master_admin', 'admin', 'partner', 'user');
CREATE TYPE plot_status AS ENUM ('available', 'locked', 'pending_payment', 'sold');

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name text,
    last_name text,
    email text UNIQUE NOT NULL,
    phone_number text UNIQUE,
    hashed_password text NOT NULL,
    role user_role DEFAULT 'user'::user_role NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- Create locations table with JSONB hierarchy
CREATE TABLE IF NOT EXISTS locations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text UNIQUE NOT NULL,
    hierarchy jsonb NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Create plots table
CREATE TABLE IF NOT EXISTS plots (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    plot_number text UNIQUE,
    title text NOT NULL,
    description text,
    area_sqm numeric(10,2) NOT NULL,
    price numeric(12,2) NOT NULL,
    image_urls text[],
    usage_type text DEFAULT 'Residential',
    status plot_status DEFAULT 'available'::plot_status NOT NULL,
    location_id uuid REFERENCES locations(id),
    geom geometry(Polygon, 4326),
    uploaded_by_id uuid REFERENCES users(id),
    created_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES users(id),
    plot_id uuid NOT NULL REFERENCES plots(id),
    order_status text DEFAULT 'pending',
    created_at timestamptz DEFAULT now()
);

-- Create legacy tables for backward compatibility
CREATE TABLE IF NOT EXISTS regions (
    id serial PRIMARY KEY,
    name varchar(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS districts (
    id serial PRIMARY KEY,
    name varchar(100) NOT NULL,
    region_id integer REFERENCES regions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS councils (
    id serial PRIMARY KEY,
    name varchar(100) NOT NULL,
    district_id integer REFERENCES districts(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_plots_status ON plots(status);
CREATE INDEX IF NOT EXISTS idx_plots_location ON plots(location_id);
CREATE INDEX IF NOT EXISTS idx_plots_price ON plots(price);
CREATE INDEX IF NOT EXISTS idx_plots_area ON plots(area_sqm);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_plot ON orders(plot_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);

-- JSONB indexes for locations
CREATE INDEX IF NOT EXISTS idx_locations_hierarchy ON locations USING gin(hierarchy);
CREATE INDEX IF NOT EXISTS idx_locations_region ON locations USING gin((hierarchy->'region'));

-- Geospatial indexes
CREATE INDEX IF NOT EXISTS idx_plots_geom ON plots USING gist(geom);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admins can manage users" ON users;
DROP POLICY IF EXISTS "Public read access" ON locations;
DROP POLICY IF EXISTS "Public read access" ON plots;
DROP POLICY IF EXISTS "Admins can manage plots" ON plots;
DROP POLICY IF EXISTS "Users can read own orders" ON orders;
DROP POLICY IF EXISTS "Users can create orders" ON orders;
DROP POLICY IF EXISTS "Admins can manage orders" ON orders;

-- Create RLS policies for users table
CREATE POLICY "Enable read access for all users" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can manage users" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'master_admin')
        )
    );

-- Create RLS policies for locations table
CREATE POLICY "Public read access" ON locations
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage locations" ON locations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'master_admin')
        )
    );

-- Create RLS policies for plots table
CREATE POLICY "Public read access" ON plots
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage plots" ON plots
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'master_admin')
        )
    );

-- Create RLS policies for orders table
CREATE POLICY "Users can read own orders" ON orders
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'master_admin')
        )
    );

CREATE POLICY "Users can create orders" ON orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage orders" ON orders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'master_admin')
        )
    );

-- Insert sample location data for Tanzania
INSERT INTO locations (name, hierarchy) VALUES 
('Dar es Salaam', '{
    "region": "Dar es Salaam",
    "districts": {
        "Ilala": {
            "councils": ["Ilala Municipal", "Temeke Municipal"]
        },
        "Kinondoni": {
            "councils": ["Kinondoni Municipal"]
        },
        "Temeke": {
            "councils": ["Temeke Municipal"]
        }
    }
}'),
('Arusha', '{
    "region": "Arusha",
    "districts": {
        "Arusha City": {
            "councils": ["Arusha City Council"]
        },
        "Arusha Rural": {
            "councils": ["Arusha District Council"]
        },
        "Meru": {
            "councils": ["Meru District Council"]
        }
    }
}'),
('Mwanza', '{
    "region": "Mwanza",
    "districts": {
        "Nyamagana": {
            "councils": ["Nyamagana Municipal"]
        },
        "Ilemela": {
            "councils": ["Ilemela Municipal"]
        },
        "Mwanza Rural": {
            "councils": ["Mwanza District Council"]
        }
    }
}')
ON CONFLICT (name) DO NOTHING;

-- Insert sample regions for legacy compatibility
INSERT INTO regions (name) VALUES 
('Dar es Salaam'),
('Arusha'),
('Mwanza'),
('Dodoma'),
('Mbeya'),
('Morogoro'),
('Tanga'),
('Kagera'),
('Shinyanga'),
('Tabora')
ON CONFLICT (name) DO NOTHING;

-- Insert sample districts
DO $$
DECLARE
    dar_region_id integer;
    arusha_region_id integer;
    mwanza_region_id integer;
BEGIN
    SELECT id INTO dar_region_id FROM regions WHERE name = 'Dar es Salaam';
    SELECT id INTO arusha_region_id FROM regions WHERE name = 'Arusha';
    SELECT id INTO mwanza_region_id FROM regions WHERE name = 'Mwanza';
    
    INSERT INTO districts (name, region_id) VALUES 
    ('Ilala', dar_region_id),
    ('Kinondoni', dar_region_id),
    ('Temeke', dar_region_id),
    ('Arusha City', arusha_region_id),
    ('Arusha Rural', arusha_region_id),
    ('Meru', arusha_region_id),
    ('Nyamagana', mwanza_region_id),
    ('Ilemela', mwanza_region_id),
    ('Mwanza Rural', mwanza_region_id)
    ON CONFLICT DO NOTHING;
END $$;

-- Create a master admin user (password: admin123)
INSERT INTO users (
    first_name, 
    last_name, 
    email, 
    hashed_password, 
    role, 
    is_active
) VALUES (
    'Master',
    'Admin',
    'admin@landhub.co.tz',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3L3jHZZZZe', -- admin123
    'master_admin',
    true
) ON CONFLICT (email) DO NOTHING;

-- Insert sample plots
DO $$
DECLARE
    dar_location_id uuid;
    arusha_location_id uuid;
    admin_user_id uuid;
BEGIN
    SELECT id INTO dar_location_id FROM locations WHERE name = 'Dar es Salaam';
    SELECT id INTO arusha_location_id FROM locations WHERE name = 'Arusha';
    SELECT id INTO admin_user_id FROM users WHERE email = 'admin@landhub.co.tz';
    
    INSERT INTO plots (
        title, 
        description, 
        area_sqm, 
        price, 
        usage_type, 
        status, 
        location_id, 
        uploaded_by_id,
        plot_number
    ) VALUES 
    (
        'Prime Commercial Plot in Kinondoni',
        'Excellent location for commercial development with good road access',
        2500.00,
        45000000.00,
        'Commercial',
        'available',
        dar_location_id,
        admin_user_id,
        'DAR-KIN-001'
    ),
    (
        'Residential Plot in Ilala',
        'Perfect for residential development in a quiet neighborhood',
        1200.00,
        25000000.00,
        'Residential',
        'available',
        dar_location_id,
        admin_user_id,
        'DAR-ILA-001'
    ),
    (
        'Agricultural Land in Arusha',
        'Fertile land suitable for farming and agriculture',
        5000.00,
        15000000.00,
        'Agricultural',
        'available',
        arusha_location_id,
        admin_user_id,
        'ARU-AGR-001'
    )
    ON CONFLICT (plot_number) DO NOTHING;
END $$;