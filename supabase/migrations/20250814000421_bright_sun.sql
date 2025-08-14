/*
  # Initial Real Estate Platform Schema

  1. New Tables
    - `users` - User management with role-based access
    - `regions` - Tanzania regions for normalized location data  
    - `districts` - Districts within regions
    - `councils` - Councils within districts
    - `plots` - Land plots with geospatial data and business logic
    - `orders` - Purchase orders linking users and plots

  2. Security
    - Enable RLS on all tables
    - Role-based policies for different user types
    - Geospatial indexing for performance

  3. Extensions
    - PostGIS for geospatial operations
    - UUID generation for primary keys
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;

-- User Roles Enum
CREATE TYPE user_role AS ENUM ('master_admin', 'admin', 'partner', 'user');

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    email VARCHAR(100) UNIQUE NOT NULL,
    phone_number VARCHAR(20) UNIQUE,
    hashed_password TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Normalized Location Tables for Tanzania
CREATE TABLE IF NOT EXISTS regions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS districts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    region_id INT REFERENCES regions(id) ON DELETE CASCADE,
    UNIQUE(name, region_id)
);

CREATE TABLE IF NOT EXISTS councils (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    district_id INT REFERENCES districts(id) ON DELETE CASCADE,
    UNIQUE(name, district_id)
);

-- Enhanced Plot Status Enum
CREATE TYPE plot_status AS ENUM ('available', 'locked', 'pending_payment', 'sold');

-- Enhanced Plots Table
CREATE TABLE IF NOT EXISTS plots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plot_number VARCHAR(50) UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    area_sqm NUMERIC(10, 2) NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    image_urls TEXT[],
    usage_type VARCHAR(100) DEFAULT 'Residential',
    status plot_status NOT NULL DEFAULT 'available',
    council_id INT REFERENCES councils(id),
    geom GEOMETRY(Polygon, 4326),
    uploaded_by_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create spatial index for fast location-based queries
CREATE INDEX IF NOT EXISTS idx_plots_geom ON plots USING GIST (geom);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    plot_id UUID REFERENCES plots(id) NOT NULL,
    order_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE councils ENABLE ROW LEVEL SECURITY;
ALTER TABLE plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can read all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'master_admin')
        )
    );

-- RLS Policies for location tables (public read)
CREATE POLICY "Anyone can read regions" ON regions FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can read districts" ON districts FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can read councils" ON councils FOR SELECT TO public USING (true);

-- RLS Policies for plots table
CREATE POLICY "Anyone can read available plots" ON plots
    FOR SELECT USING (status = 'available');

CREATE POLICY "Authenticated users can read all plots" ON plots
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert plots" ON plots
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'master_admin')
        )
    );

CREATE POLICY "Admins can update plots" ON plots
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'master_admin')
        )
    );

-- RLS Policies for orders table
CREATE POLICY "Users can read own orders" ON orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders" ON orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all orders" ON orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'master_admin')
        )
    );

-- Insert sample Tanzania location data
INSERT INTO regions (name) VALUES 
    ('Dar es Salaam'),
    ('Arusha'),
    ('Mwanza'),
    ('Dodoma'),
    ('Mbeya')
ON CONFLICT (name) DO NOTHING;

INSERT INTO districts (name, region_id) VALUES 
    ('Kinondoni', (SELECT id FROM regions WHERE name = 'Dar es Salaam')),
    ('Ilala', (SELECT id FROM regions WHERE name = 'Dar es Salaam')),
    ('Temeke', (SELECT id FROM regions WHERE name = 'Dar es Salaam')),
    ('Arusha Urban', (SELECT id FROM regions WHERE name = 'Arusha')),
    ('Arusha Rural', (SELECT id FROM regions WHERE name = 'Arusha'))
ON CONFLICT (name, region_id) DO NOTHING;

INSERT INTO councils (name, district_id) VALUES 
    ('Kinondoni Municipal', (SELECT id FROM districts WHERE name = 'Kinondoni')),
    ('Ilala Municipal', (SELECT id FROM districts WHERE name = 'Ilala')),
    ('Temeke Municipal', (SELECT id FROM districts WHERE name = 'Temeke')),
    ('Arusha City', (SELECT id FROM districts WHERE name = 'Arusha Urban')),
    ('Arusha District', (SELECT id FROM districts WHERE name = 'Arusha Rural'))
ON CONFLICT (name, district_id) DO NOTHING;