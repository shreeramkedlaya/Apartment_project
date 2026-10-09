-- ============================================================================
-- Apartment Issue Management System - Database & Schema Initialization Script
-- ============================================================================
-- DUAL-SCHEMA ARCHITECTURE:
--
-- 1. "public" SCHEMA:
--    - Holds Django Framework & Core Infrastructure tables:
--        * Migration history ("django_migrations")
--        * User Authentication model ("auth_user", "auth_group", "auth_permission")
--        * Session management & content types ("django_session", "django_content_type")
--        * Asynchronous task state ("django_celery_beat_*", "django_celery_results_*")
--
-- 2. "apt_data" SCHEMA:
--    - Dedicated isolated domain schema for all application tables:
--        * Accounts: "blocks", "flats", "roles", "user_profiles"
--        * Profile Extensions: "co_residents", "vehicles", "personal_emergency_contacts"
--        * Notices & Comms: "notices", "notice_approvals", "notice_acknowledgements"
--        * Helpdesk: "issues", "issue_categories", "issue_timelines"
--        * Operations: "visitor_logs", "amenities", "amenity_bookings"
--        * Emergency: "emergency_contacts", "emergency_broadcasts"
--        * Finance: "invoices", "transactions"
--        * Media & Tokens: "media", "device_tokens"
--    - Every domain model explicitly specifies: db_table = '"apt_data"."<table_name>"'
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Server-Level Setup (Execute while connected to default 'postgres' DB)
-- ----------------------------------------------------------------------------

-- Set default postgres user password to match settings (.env.local: 'test@123')
ALTER USER postgres WITH PASSWORD 'test@123';

-- Create the primary application database if it does not already exist
-- (In psql, \gexec executes the query conditionally; in pgAdmin, use CREATE DATABASE apartment_db)
SELECT 'CREATE DATABASE apartment_db OWNER postgres'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'apartment_db')\gexec

-- ----------------------------------------------------------------------------
-- STEP 2: Database-Level Setup (Execute inside 'apartment_db')
-- Note: If running via pgAdmin or DBeaver Query Tool, connect directly to
-- 'apartment_db' in your object explorer and run the lines below.
-- ----------------------------------------------------------------------------
\c apartment_db

-- 1. Ensure schemas exist with explicit ownership and permissions
CREATE SCHEMA IF NOT EXISTS public;
ALTER SCHEMA public OWNER TO postgres;
GRANT ALL ON SCHEMA public TO postgres;

CREATE SCHEMA IF NOT EXISTS apt_data;
ALTER SCHEMA apt_data OWNER TO postgres;
GRANT ALL ON SCHEMA apt_data TO postgres;

-- 2. Configure default search path for database & user
-- Automatically resolves tables in 'apt_data' first, falling back to 'public' for auth/admin
ALTER DATABASE apartment_db SET search_path TO apt_data, public;
ALTER ROLE postgres SET search_path TO apt_data, public;
SET search_path TO apt_data, public;

-- 3. Configure Default Privileges for future tables and sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA apt_data GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA apt_data GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;

-- 4. Enable Recommended PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- Trigram similarity for notice, issue, and directory search
