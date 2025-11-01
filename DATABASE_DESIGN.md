# Startup Sherlock - Database Architecture Design

## Overview
Enterprise-grade database architecture designed for scalability, performance, and maintainability using Google Cloud services.

## Google Cloud Infrastructure

### 1. Cloud SQL (PostgreSQL 15)
**Configuration:**
- Instance: `db-custom-4-16384` (4 vCPU, 16GB RAM) - ~$130/month
- High Availability: Regional with failover replica
- Storage: 100GB SSD with auto-scaling to 500GB
- Automated backups: Daily with 7-day retention
- Connection pooling: Built-in PgBouncer

**Estimated Cost:** ~$150/month (well within $500 credit)

### 2. Cloud Storage
**Buckets:**
- `{project}-documents-prod` - Document files (encrypted at rest)
- `{project}-backups` - Database backup archives

**Configuration:**
- Storage class: Standard (for frequently accessed documents)
- Lifecycle: Move to Nearline after 90 days
- Versioning: Enabled for document history
- IAM: Service account with minimal permissions

**Estimated Cost:** ~$2-10/month (depends on storage volume)

### 3. Cloud Memorystore (Redis) - Optional
**Configuration:**
- Tier: Basic (1GB) - ~$45/month
- Use case: Cache frequently accessed startup analyses

**Estimated Cost:** ~$45/month (optional, implement if needed)

**Total Infrastructure Cost:** ~$200/month (40% of available credit)

---

## Database Schema Design

### Design Principles
1. **Normalization**: Separate concerns, eliminate redundancy
2. **Scalability**: Partition large tables by date
3. **Performance**: Strategic indexes on query patterns
4. **Audit Trail**: Track all changes with timestamps
5. **Versioning**: Maintain analysis history
6. **Flexibility**: JSONB for dynamic/evolving data structures

---

## Core Tables

### 1. `users`
User authentication and profile information.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'analyst', -- analyst, admin, investor
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
```

### 2. `startups`
Core startup information and metadata.

```sql
CREATE TABLE startups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(500) NOT NULL,
  slug VARCHAR(500) UNIQUE,
  description TEXT,
  
  -- Basic Info
  industry VARCHAR(200),
  sub_industry VARCHAR(200),
  stage VARCHAR(100), -- pre-seed, seed, series-a, series-b, etc.
  founded_year INTEGER,
  location VARCHAR(255),
  country_code VARCHAR(3),
  
  -- Contact & Links
  website_url TEXT,
  linkedin_url TEXT,
  crunchbase_url TEXT,
  
  -- Current Status
  status VARCHAR(50) DEFAULT 'active', -- active, acquired, closed, ipo
  employee_count INTEGER,
  
  -- Latest Analysis Summary (denormalized for quick access)
  latest_overall_score NUMERIC(5,2), -- 0-100
  latest_risk_level VARCHAR(50), -- Low, Medium, High, Critical
  latest_recommendation VARCHAR(50), -- strong_buy, buy, hold, pass
  latest_analysis_id UUID,
  latest_analysis_at TIMESTAMPTZ,
  
  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete
);

CREATE INDEX idx_startups_name ON startups(name);
CREATE INDEX idx_startups_slug ON startups(slug);
CREATE INDEX idx_startups_industry ON startups(industry);
CREATE INDEX idx_startups_stage ON startups(stage);
CREATE INDEX idx_startups_score ON startups(latest_overall_score DESC NULLS LAST);
CREATE INDEX idx_startups_active ON startups(created_at DESC) WHERE deleted_at IS NULL;
```

### 3. `founders`
Startup founder/team member information.

```sql
CREATE TABLE founders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  
  full_name VARCHAR(255) NOT NULL,
  title VARCHAR(200),
  role VARCHAR(100), -- CEO, CTO, CFO, etc.
  
  -- Background
  linkedin_url TEXT,
  email VARCHAR(255),
  bio TEXT,
  education JSONB, -- [{school, degree, year}, ...]
  previous_companies JSONB, -- [{company, role, years}, ...]
  
  -- Verification
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verification_source TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_founders_startup ON founders(startup_id);
CREATE INDEX idx_founders_verified ON founders(verified);
```

### 4. `documents`
Document metadata (files stored in Cloud Storage).

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  
  -- File Info
  file_name VARCHAR(500) NOT NULL,
  file_type VARCHAR(100) NOT NULL, -- application/pdf, image/png, etc.
  file_size BIGINT, -- bytes
  
  -- Cloud Storage Reference
  gcs_bucket VARCHAR(255),
  gcs_path TEXT, -- gs://bucket/path/to/file
  gcs_url TEXT, -- Signed URL for temporary access
  
  -- Processing Status
  status VARCHAR(50) DEFAULT 'uploaded', -- uploaded, processing, completed, failed
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  processing_error TEXT,
  
  -- Document Classification
  document_category VARCHAR(100), -- pitch_deck, financials, legal, market_research
  document_type VARCHAR(100), -- pdf, image, spreadsheet, word
  
  -- Metadata
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documents_startup ON documents(startup_id, uploaded_at DESC);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_category ON documents(document_category);
```

### 5. `document_extractions`
Extracted text and metadata from documents (separate table for large text).

```sql
CREATE TABLE document_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  
  -- Extracted Content
  extracted_text TEXT, -- Full text extraction
  page_count INTEGER,
  word_count INTEGER,
  
  -- Structured Extraction
  extracted_data JSONB, -- Structured data extracted (tables, figures, etc.)
  entities JSONB, -- Named entities (companies, people, locations, amounts)
  keywords TEXT[], -- Array of keywords
  
  -- OCR/Processing Details
  extraction_method VARCHAR(100), -- pdf-parse, ocr, manual
  ocr_confidence NUMERIC(5,2), -- 0-100
  language VARCHAR(10) DEFAULT 'en',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_extractions_document ON document_extractions(document_id);
CREATE INDEX idx_extractions_keywords ON document_extractions USING GIN(keywords);
```

---

## Analysis Tables

### 6. `analyses`
Main analysis records with versioning.

```sql
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  
  -- Analysis Info
  analysis_type VARCHAR(100) NOT NULL, -- standard, deep_reasoning, enhanced, hybrid
  analysis_version VARCHAR(50), -- v1.0, v2.0, etc.
  
  -- Scores
  overall_score NUMERIC(5,2) NOT NULL, -- 0-100
  confidence_score NUMERIC(5,2), -- 0-100
  
  -- Risk Assessment
  risk_level VARCHAR(50), -- Low, Medium, High, Critical
  risk_score NUMERIC(5,2), -- 0-100
  
  -- Recommendation
  recommendation VARCHAR(50), -- strong_buy, buy, hold, pass
  recommendation_reasoning TEXT,
  target_investment_amount NUMERIC(15,2),
  expected_return_multiple NUMERIC(8,2),
  investment_horizon_months INTEGER,
  
  -- Processing Details
  status VARCHAR(50) DEFAULT 'processing', -- processing, completed, failed
  processing_time_seconds INTEGER,
  model_used VARCHAR(100), -- gemini-2.5-flash, gpt-4, etc.
  
  -- Document References
  document_ids UUID[], -- Array of document IDs used in analysis
  
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
```

### 7. `analysis_metrics`
Detailed scoring metrics for each analysis.

```sql
CREATE TABLE analysis_metrics (
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
  
  -- Detailed Metrics
  revenue_growth_rate NUMERIC(8,2), -- percentage
  customer_acquisition_cost NUMERIC(12,2),
  lifetime_value NUMERIC(12,2),
  burn_rate NUMERIC(12,2),
  runway_months INTEGER,
  
  -- Market Metrics
  tam NUMERIC(15,2), -- Total Addressable Market
  sam NUMERIC(15,2), -- Serviceable Addressable Market
  som NUMERIC(15,2), -- Serviceable Obtainable Market
  market_share_percentage NUMERIC(5,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_metrics_analysis ON analysis_metrics(analysis_id);
```

### 8. `analysis_insights`
Key findings and insights from analysis.

```sql
CREATE TABLE analysis_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  
  category VARCHAR(100), -- strength, weakness, opportunity, threat, finding
  title VARCHAR(500),
  description TEXT NOT NULL,
  
  -- Prioritization
  importance VARCHAR(50), -- critical, high, medium, low
  confidence VARCHAR(50), -- high, medium, low
  
  -- Evidence
  source_type VARCHAR(100), -- document, public_data, market_research
  source_references JSONB, -- [{type, id, excerpt}, ...]
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_insights_analysis ON analysis_insights(analysis_id);
CREATE INDEX idx_insights_category ON analysis_insights(category);
CREATE INDEX idx_insights_importance ON analysis_insights(importance);
```

### 9. `risk_flags`
Identified risks and red flags.

```sql
CREATE TABLE risk_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  
  severity VARCHAR(50) NOT NULL, -- critical, high, medium, low
  category VARCHAR(100) NOT NULL, -- financial, legal, market, team, technology
  
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  impact TEXT,
  
  -- Evidence & Sources
  evidence JSONB,
  sources JSONB,
  
  -- Status
  status VARCHAR(50) DEFAULT 'open', -- open, investigating, resolved, dismissed
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_risk_flags_analysis ON risk_flags(analysis_id);
CREATE INDEX idx_risk_flags_startup ON risk_flags(startup_id, severity);
CREATE INDEX idx_risk_flags_status ON risk_flags(status) WHERE status = 'open';
```

---

## Public Data & Research Tables

### 10. `public_data_sources`
Tracked public sources and verification data.

```sql
CREATE TABLE public_data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  
  source_type VARCHAR(100), -- crunchbase, linkedin, news, gov_records, etc.
  source_name VARCHAR(255),
  source_url TEXT,
  
  -- Data Extracted
  data_extracted JSONB,
  extraction_date TIMESTAMPTZ DEFAULT NOW(),
  
  -- Verification
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  confidence_score NUMERIC(5,2), -- 0-100
  
  -- Metadata
  last_checked_at TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'active', -- active, stale, unavailable
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_public_sources_startup ON public_data_sources(startup_id);
CREATE INDEX idx_public_sources_type ON public_data_sources(source_type);
CREATE INDEX idx_public_sources_verified ON public_data_sources(is_verified);
```

### 11. `news_articles`
Tracked news and media coverage.

```sql
CREATE TABLE news_articles (
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
  sentiment VARCHAR(50), -- positive, negative, neutral
  sentiment_score NUMERIC(5,2), -- -100 to 100
  
  -- Relevance
  relevance_score NUMERIC(5,2), -- 0-100
  keywords TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_news_startup ON news_articles(startup_id, published_at DESC);
CREATE INDEX idx_news_sentiment ON news_articles(sentiment);
CREATE INDEX idx_news_published ON news_articles(published_at DESC);
```

### 12. `research_sessions`
Hybrid research session tracking.

```sql
CREATE TABLE research_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID REFERENCES startups(id) ON DELETE CASCADE,
  
  query TEXT NOT NULL,
  research_type VARCHAR(100), -- startup, market, competitor
  
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
```

---

## Discrepancy & Verification Tables

### 13. `discrepancies`
Track discrepancies between document claims and public data.

```sql
CREATE TABLE discrepancies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  
  discrepancy_type VARCHAR(100), -- financial, metric, claim, timeline
  severity VARCHAR(50), -- critical, high, medium, low
  
  category VARCHAR(100), -- revenue, team_size, funding, partnerships
  
  -- The Discrepancy
  claimed_value TEXT,
  claimed_source VARCHAR(255), -- Which document
  
  verified_value TEXT,
  verified_source VARCHAR(255), -- Which public source
  
  description TEXT NOT NULL,
  impact_assessment TEXT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'open', -- open, investigating, explained, confirmed
  resolution_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_discrepancies_analysis ON discrepancies(analysis_id);
CREATE INDEX idx_discrepancies_startup ON discrepancies(startup_id, severity);
CREATE INDEX idx_discrepancies_status ON discrepancies(status);
```

---

## Support & Cache Tables

### 14. `benchmarks`
Industry benchmark data cache.

```sql
CREATE TABLE benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  industry VARCHAR(200) NOT NULL,
  company_stage VARCHAR(100), -- pre-seed, seed, series-a, etc.
  company_size VARCHAR(100), -- 1-10, 11-50, 51-200, etc.
  
  -- Benchmark Metrics
  metrics JSONB NOT NULL, -- All benchmark data
  
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
```

### 15. `audit_logs`
Complete audit trail for compliance.

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Action Details
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL, -- INSERT, UPDATE, DELETE
  
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

-- Partition by month for performance
CREATE INDEX idx_audit_table ON audit_logs(table_name, created_at DESC);
CREATE INDEX idx_audit_record ON audit_logs(record_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at DESC);
```

---

## Materialized Views for Performance

### View 1: Startup Dashboard Summary
```sql
CREATE MATERIALIZED VIEW mv_startup_dashboard AS
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
```

---

## Performance Optimization

### Connection Pooling Configuration
```
max_connections = 100
shared_buffers = 4GB
effective_cache_size = 12GB
maintenance_work_mem = 1GB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 10MB
min_wal_size = 1GB
max_wal_size = 4GB
```

### Partitioning Strategy
- `audit_logs`: Partition by month (RANGE on created_at)
- `news_articles`: Partition by quarter (RANGE on published_at)
- `research_sessions`: Partition by month (RANGE on created_at)

---

## Backup Strategy

1. **Automated Backups**: Daily at 2 AM UTC, 7-day retention
2. **Point-in-Time Recovery**: Enabled with transaction log archiving
3. **Export to Cloud Storage**: Weekly full export to GCS
4. **Snapshot Testing**: Monthly restore tests to verify backup integrity

---

## Migration Strategy

1. **Phase 1**: Set up Cloud SQL and Cloud Storage
2. **Phase 2**: Create schema and indexes
3. **Phase 3**: Migrate from in-memory to Cloud SQL
4. **Phase 4**: Update application code
5. **Phase 5**: Performance testing and optimization
6. **Phase 6**: Enable advanced features (caching, materialized views)

---

## Security Measures

1. **Encryption**: At rest (Cloud SQL automatic) and in transit (SSL/TLS required)
2. **Access Control**: IAM-based with principle of least privilege
3. **Connection**: Private IP only, no public access
4. **Secrets**: Stored in Google Secret Manager
5. **Audit**: All database operations logged
6. **Backup Encryption**: Encrypted backup archives

---

## Monitoring & Alerts

1. **Performance Metrics**: Query performance, connection pool usage
2. **Health Checks**: Database availability, replication lag
3. **Storage Monitoring**: Disk usage, growth trends
4. **Alert Thresholds**:
   - CPU > 80% for 5 minutes
   - Disk > 90% used
   - Connection pool > 90% utilized
   - Query latency > 1s average

---

## Cost Optimization

1. **Right-sizing**: Start with db-custom-4-16384, scale as needed
2. **Storage Tiering**: Move old documents to Nearline/Coldline
3. **Query Optimization**: Use materialized views for expensive queries
4. **Connection Pooling**: Reduce connection overhead
5. **Compression**: Enable for archived data

**Projected Monthly Cost:**
- Cloud SQL: ~$150
- Cloud Storage: ~$10
- Network egress: ~$5
- **Total: ~$165/month** (33% of available credit)

---

## Future Enhancements

1. **Read Replicas**: Add read replica for analytics queries
2. **Redis Caching**: Implement for frequently accessed data
3. **BigQuery Integration**: Export for advanced analytics
4. **Data Warehouse**: Separate OLAP workloads
5. **Machine Learning**: Training data pipeline

