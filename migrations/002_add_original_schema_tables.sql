-- Migration: Add original schema tables for backward compatibility
-- This allows the existing application code to work without changes
-- while keeping the enhanced tables for future migration

-- Drop existing tables if they exist (from original schema)
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS startups CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table (original schema)
CREATE TABLE users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
);

-- Startups table (original schema)  
CREATE TABLE startups (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  industry TEXT,
  stage TEXT,
  founded_year INTEGER,
  location TEXT,
  description TEXT,
  website_url TEXT,
  overall_score REAL,
  risk_level TEXT,
  recommendation TEXT,
  analysis_data JSON,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Documents table (original schema)
CREATE TABLE documents (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  startup_id VARCHAR REFERENCES startups(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  extracted_text TEXT,
  analysis_result JSON,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_startups_updated ON startups(updated_at DESC);
CREATE INDEX idx_documents_startup ON documents(startup_id, uploaded_at DESC);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_startups_updated_at 
  BEFORE UPDATE ON startups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

RAISE NOTICE '✅ Original schema tables created successfully';

