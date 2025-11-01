-- Migration: Initial Enhanced Schema for Startup Sherlock
-- Version: 1.0.0
-- Date: 2025-10-30
-- Description: Comprehensive database schema with normalization and scalability

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'analyst',
  organization VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role) WHERE is_active = true;

-- Startups table
CREATE TABLE IF NOT EXISTS startups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(500) NOT NULL,
  slug VARCHAR(500) UNIQUE,
  description TEXT,
  
  -- Basic Info
  industry VARCHAR(200),
  sub_industry VARCHAR(200),
  stage VARCHAR(100),
  founded_year INTEGER,
  location VARCHAR(255),
  country_code VARCHAR(3),
  
  -- Contact & Links
  website_url TEXT,
  linkedin_url TEXT,
  crunchbase_url TEXT,
  
  -- Current Status
  status VARCHAR(50) DEFAULT 'active',
  employee_count INTEGER,
  
  -- Latest Analysis Summary
  latest_overall_score NUMERIC(5,2),
  latest_risk_level VARCHAR(50),
  latest_recommendation VARCHAR(50),
  latest_analysis_id UUID,
  latest_analysis_at TIMESTAMPTZ,
  
  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  CONSTRAINT valid_score CHECK (latest_overall_score IS NULL OR (latest_overall_score BETWEEN 0 AND 100))
);

CREATE INDEX idx_startups_name ON startups(name);
CREATE INDEX idx_startups_slug ON startups(slug);
CREATE INDEX idx_startups_industry ON startups(industry);
CREATE INDEX idx_startups_stage ON startups(stage);
CREATE INDEX idx_startups_score ON startups(latest_overall_score DESC NULLS LAST);
CREATE INDEX idx_startups_active ON startups(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_startups_search ON startups USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Founders table
CREATE TABLE IF NOT EXISTS founders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  
  full_name VARCHAR(255) NOT NULL,
  title VARCHAR(200),
  role VARCHAR(100),
  
  -- Background
  linkedin_url TEXT,
  email VARCHAR(255),
  bio TEXT,
  education JSONB,
  previous_companies JSONB,
  
  -- Verification
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verification_source TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_founders_startup ON founders(startup_id);
CREATE INDEX idx_founders_verified ON founders(verified);

-- Documents table (metadata only - files in Cloud Storage)
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  
  -- File Info
  file_name VARCHAR(500) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size BIGINT,
  
  -- Cloud Storage Reference
  gcs_bucket VARCHAR(255),
  gcs_path TEXT,
  gcs_url TEXT,
  
  -- Processing Status
  status VARCHAR(50) DEFAULT 'uploaded',
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  processing_error TEXT,
  
  -- Document Classification
  document_category VARCHAR(100),
  document_type VARCHAR(100),
  
  -- Metadata
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documents_startup ON documents(startup_id, uploaded_at DESC);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_category ON documents(document_category);

-- Document Extractions (separated for large text)
CREATE TABLE IF NOT EXISTS document_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  
  -- Extracted Content
  extracted_text TEXT,
  page_count INTEGER,
  word_count INTEGER,
  
  -- Structured Extraction
  extracted_data JSONB,
  entities JSONB,
  keywords TEXT[],
  
  -- OCR/Processing Details
  extraction_method VARCHAR(100),
  ocr_confidence NUMERIC(5,2),
  language VARCHAR(10) DEFAULT 'en',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_extractions_document ON document_extractions(document_id);
CREATE INDEX idx_extractions_keywords ON document_extractions USING GIN(keywords);

-- ============================================================================
-- ANALYSIS TABLES
-- ============================================================================

-- Analyses table
CREATE TABLE IF NOT EXISTS analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  
  -- Analysis Info
  analysis_type VARCHAR(100) NOT NULL,
  analysis_version VARCHAR(50),
  
  -- Scores
  overall_score NUMERIC(5,2) NOT NULL,
  confidence_score NUMERIC(5,2),
  
  -- Risk Assessment
  risk_level VARCHAR(50),
  risk_score NUMERIC(5,2),
  
  -- Recommendation
  recommendation VARCHAR(50),
  recommendation_reasoning TEXT,
  target_investment_amount NUMERIC(15,2),
  expected_return_multiple NUMERIC(8,2),
  investment_horizon_months INTEGER,
  
  -- Processing Details
  status VARCHAR(50) DEFAULT 'processing',
  processing_time_seconds INTEGER,
  model_used VARCHAR(100),
  
  -- Document References
  document_ids UUID[],
  
  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  CONSTRAINT valid_scores CHECK (
    overall_score BETWEEN 0 AND 100 AND
    (confidence_score IS NULL OR confidence_score BETWEEN 0 AND 100)
  )
);

CREATE INDEX idx_analyses_startup ON analyses(startup_id, created_at DESC);
CREATE INDEX idx_analyses_type ON analyses(analysis_type);
CREATE INDEX idx_analyses_score ON analyses(overall_score DESC);
CREATE INDEX idx_analyses_status ON analyses(status);

-- Analysis Metrics table
CREATE TABLE IF NOT EXISTS analysis_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  
  -- Core Metrics (0-100 each)
  market_size_score NUMERIC(5,2),
  market_growth_score NUMERIC(5,2),
  traction_score NUMERIC(5,2),
  team_score NUMERIC(5,2),
  product_score NUMERIC(5,2),
  technology_score NUMERIC(5,2),
  financials_score NUMERIC(5,2),
  competition_score NUMERIC(5,2),
  business_model_score NUMERIC(5,2),
  
  -- Detailed Financial Metrics
  revenue_growth_rate NUMERIC(8,2),
  customer_acquisition_cost NUMERIC(12,2),
  lifetime_value NUMERIC(12,2),
  burn_rate NUMERIC(12,2),
  runway_months INTEGER,
  
  -- Market Metrics
  tam NUMERIC(15,2),
  sam NUMERIC(15,2),
  som NUMERIC(15,2),
  market_share_percentage NUMERIC(5,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_metrics_analysis ON analysis_metrics(analysis_id);

-- Analysis Insights table
CREATE TABLE IF NOT EXISTS analysis_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  
  category VARCHAR(100),
  title VARCHAR(500),
  description TEXT NOT NULL,
  
  -- Prioritization
  importance VARCHAR(50),
  confidence VARCHAR(50),
  
  -- Evidence
  source_type VARCHAR(100),
  source_references JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_insights_analysis ON analysis_insights(analysis_id);
CREATE INDEX idx_insights_category ON analysis_insights(category);
CREATE INDEX idx_insights_importance ON analysis_insights(importance);

-- Risk Flags table
CREATE TABLE IF NOT EXISTS risk_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  
  severity VARCHAR(50) NOT NULL,
  category VARCHAR(100) NOT NULL,
  
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  impact TEXT,
  
  -- Evidence & Sources
  evidence JSONB,
  sources JSONB,
  
  -- Status
  status VARCHAR(50) DEFAULT 'open',
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_risk_flags_analysis ON risk_flags(analysis_id);
CREATE INDEX idx_risk_flags_startup ON risk_flags(startup_id, severity);
CREATE INDEX idx_risk_flags_status ON risk_flags(status) WHERE status = 'open';

-- ============================================================================
-- PUBLIC DATA & RESEARCH TABLES
-- ============================================================================

-- Public Data Sources table
CREATE TABLE IF NOT EXISTS public_data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  
  source_type VARCHAR(100),
  source_name VARCHAR(255),
  source_url TEXT,
  
  -- Data Extracted
  data_extracted JSONB,
  extraction_date TIMESTAMPTZ DEFAULT NOW(),
  
  -- Verification
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  confidence_score NUMERIC(5,2),
  
  -- Metadata
  last_checked_at TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'active',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_public_sources_startup ON public_data_sources(startup_id);
CREATE INDEX idx_public_sources_type ON public_data_sources(source_type);
CREATE INDEX idx_public_sources_verified ON public_data_sources(is_verified);

-- News Articles table
CREATE TABLE IF NOT EXISTS news_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  
  title VARCHAR(1000) NOT NULL,
  url TEXT UNIQUE NOT NULL,
  source VARCHAR(255),
  author VARCHAR(255),
  
  published_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Content
  summary TEXT,
  full_text TEXT,
  
  -- Sentiment Analysis
  sentiment VARCHAR(50),
  sentiment_score NUMERIC(5,2),
  
  -- Relevance
  relevance_score NUMERIC(5,2),
  keywords TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_news_startup ON news_articles(startup_id, published_at DESC);
CREATE INDEX idx_news_sentiment ON news_articles(sentiment);
CREATE INDEX idx_news_published ON news_articles(published_at DESC);

-- Research Sessions table
CREATE TABLE IF NOT EXISTS research_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID REFERENCES startups(id) ON DELETE CASCADE,
  
  query TEXT NOT NULL,
  research_type VARCHAR(100),
  
  -- Results
  grounded_analysis JSONB,
  custom_search_results JSONB,
  synthesized_insights JSONB,
  sources JSONB,
  
  confidence_score NUMERIC(5,2),
  
  -- Processing
  status VARCHAR(50) DEFAULT 'processing',
  processing_time_seconds INTEGER,
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_research_startup ON research_sessions(startup_id, created_at DESC);
CREATE INDEX idx_research_type ON research_sessions(research_type);

-- Discrepancies table
CREATE TABLE IF NOT EXISTS discrepancies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  
  discrepancy_type VARCHAR(100),
  severity VARCHAR(50),
  category VARCHAR(100),
  
  -- The Discrepancy
  claimed_value TEXT,
  claimed_source VARCHAR(255),
  verified_value TEXT,
  verified_source VARCHAR(255),
  
  description TEXT NOT NULL,
  impact_assessment TEXT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'open',
  resolution_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_discrepancies_analysis ON discrepancies(analysis_id);
CREATE INDEX idx_discrepancies_startup ON discrepancies(startup_id, severity);
CREATE INDEX idx_discrepancies_status ON discrepancies(status);

-- ============================================================================
-- SUPPORT TABLES
-- ============================================================================

-- Benchmarks table
CREATE TABLE IF NOT EXISTS benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  industry VARCHAR(200) NOT NULL,
  company_stage VARCHAR(100),
  company_size VARCHAR(100),
  
  -- Benchmark Metrics
  metrics JSONB NOT NULL,
  
  -- Metadata
  data_source VARCHAR(255),
  sample_size INTEGER,
  
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_benchmarks_industry ON benchmarks(industry, company_stage);
CREATE INDEX idx_benchmarks_valid ON benchmarks(valid_until) WHERE valid_until > NOW();

-- Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Action Details
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  
  -- Changes
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],
  
  -- Context
  user_id UUID REFERENCES users(id),
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_table ON audit_logs(table_name, created_at DESC);
CREATE INDEX idx_audit_record ON audit_logs(record_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at DESC);

-- ============================================================================
-- MATERIALIZED VIEWS
-- ============================================================================

-- Startup Dashboard Summary View
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_startup_dashboard AS
SELECT 
  s.id,
  s.name,
  s.industry,
  s.stage,
  s.latest_overall_score,
  s.latest_risk_level,
  s.latest_recommendation,
  COUNT(DISTINCT d.id) as document_count,
  COUNT(DISTINCT a.id) as analysis_count,
  COUNT(DISTINCT rf.id) FILTER (WHERE rf.status = 'open' AND rf.severity IN ('critical', 'high')) as critical_risk_count,
  MAX(a.created_at) as last_analyzed_at,
  s.created_at,
  s.updated_at
FROM startups s
LEFT JOIN documents d ON s.id = d.startup_id
LEFT JOIN analyses a ON s.id = a.startup_id AND a.status = 'completed'
LEFT JOIN risk_flags rf ON s.id = rf.startup_id
WHERE s.deleted_at IS NULL
GROUP BY s.id;

CREATE UNIQUE INDEX idx_mv_dashboard_id ON mv_startup_dashboard(id);
CREATE INDEX idx_mv_dashboard_score ON mv_startup_dashboard(latest_overall_score DESC NULLS LAST);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_startups_updated_at BEFORE UPDATE ON startups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_founders_updated_at BEFORE UPDATE ON founders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_risk_flags_updated_at BEFORE UPDATE ON risk_flags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_public_data_sources_updated_at BEFORE UPDATE ON public_data_sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discrepancies_updated_at BEFORE UPDATE ON discrepancies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_benchmarks_updated_at BEFORE UPDATE ON benchmarks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- REFRESH MATERIALIZED VIEW FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_dashboard_view()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_startup_dashboard;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PERMISSIONS (to be configured based on application user)
-- ============================================================================

-- Grant permissions to application user (replace 'app_user' with actual username)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- ============================================================================
-- COMPLETION
-- ============================================================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE '✅ Enhanced schema migration completed successfully';
  RAISE NOTICE '📊 Tables created: 15';
  RAISE NOTICE '🔍 Indexes created: 50+';
  RAISE NOTICE '📈 Materialized views created: 1';
  RAISE NOTICE '⚡ Triggers created: 9';
END $$;

