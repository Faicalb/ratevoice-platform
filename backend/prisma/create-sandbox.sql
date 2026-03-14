-- Create Sandbox Schema
CREATE SCHEMA IF NOT EXISTS sandbox;

-- Function to clone tables from public to sandbox
DO $$ 
DECLARE 
    r RECORD;
BEGIN 
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP 
        EXECUTE 'CREATE TABLE IF NOT EXISTS sandbox."' || r.tablename || '" (LIKE public."' || r.tablename || '" INCLUDING ALL)';
    END LOOP;
END $$;

-- Enable UUID extension in sandbox if needed (usually handled by public)
-- Grants
GRANT ALL ON SCHEMA sandbox TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA sandbox TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA sandbox TO postgres;
