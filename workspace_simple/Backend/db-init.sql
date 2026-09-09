-- Initialize the PostgreSQL database for the Apartment Issue Management System
-- This uses the single-database architecture defined in settings.py

-- 1. (Optional) Set the default postgres user password to match settings.py ('test@123')
ALTER USER postgres WITH PASSWORD 'test@123';

-- 2. Create the primary application database
CREATE DATABASE apartment_db;

-- 3. Connect to the database and setup schemas
\c apartment_db

-- Grant default privileges on the standard public schema (for Django auth/admin tables)
GRANT ALL ON SCHEMA public TO postgres;

-- Create our custom isolated schema for the application data
CREATE SCHEMA IF NOT EXISTS apt_data;
GRANT ALL ON SCHEMA apt_data TO postgres;
