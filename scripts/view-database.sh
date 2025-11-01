#!/bin/bash
# Quick script to view database tables and data

cd "$(dirname "$0")/.."
export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"

echo "📊 Startup Sherlock - Database Viewer"
echo "======================================"
echo ""

PGPASSWORD="StartupSherlock2025" psql -h 127.0.0.1 -p 5432 -U postgres -d startup_sherlock << 'EOF'
-- Show all tables with row counts
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size('public.'||tablename)) AS size,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = tablename) as columns
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Show recent data if any
\echo ''
\echo '📋 Recent Startups:'
SELECT id, name, industry, stage, created_at FROM startups ORDER BY created_at DESC LIMIT 5;

\echo ''
\echo '📄 Recent Documents:'
SELECT id, file_name, file_type, uploaded_at FROM documents ORDER BY uploaded_at DESC LIMIT 5;

\echo ''
\echo '📊 Recent Analyses:'
SELECT id, startup_id, analysis_type, overall_score, created_at FROM analyses ORDER BY created_at DESC LIMIT 5;

\echo ''
\echo '🚩 Recent Risk Flags:'
SELECT id, startup_id, severity, title FROM risk_flags ORDER BY created_at DESC LIMIT 5;
EOF

echo ""
echo "To connect interactively:"
echo "  PGPASSWORD='StartupSherlock2025' psql -h 127.0.0.1 -p 5432 -U postgres -d startup_sherlock"

