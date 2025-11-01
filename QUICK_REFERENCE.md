# Quick Reference - Startup Sherlock Database

## 🚀 Quick Start Commands

### Initial Setup (One-Time)
```bash
# 1. Run automated Google Cloud setup
./scripts/setup-google-cloud.sh

# 2. Install Cloud SQL Proxy
brew install cloud-sql-proxy

# 3. Install Node dependencies
npm install

# 4. Configure environment
cp .env.local .env
# Edit .env and add GEMINI_API_KEY
```

### Daily Development
```bash
# Terminal 1: Start Cloud SQL Proxy
cloud-sql-proxy startup-sherlock:us-central1:startup-sherlock-db

# Terminal 2: Start application
npm run dev

# Application runs at http://localhost:5000
```

---

## 📊 Database Commands

```bash
# Test database connection
npm run db:test

# Run migration
npm run db:migrate

# List all tables
npm run db:tables

# Connect to database (psql)
psql "$DATABASE_URL"
```

---

## ☁️ Google Cloud Commands

### Cloud SQL
```bash
# List instances
gcloud sql instances list

# Describe instance
gcloud sql instances describe startup-sherlock-db

# View logs
gcloud sql operations list --instance=startup-sherlock-db --limit=10

# Create backup
npm run gcloud:backup

# Connect directly
gcloud sql connect startup-sherlock-db --user=app_user --database=startup_sherlock
```

### Cloud Storage
```bash
# List buckets
gsutil ls

# List files in bucket
gsutil ls gs://startup-sherlock-documents/

# Check bucket size
gsutil du -sh gs://startup-sherlock-documents/

# Upload file
gsutil cp file.pdf gs://startup-sherlock-documents/test/
```

### Monitoring
```bash
# View costs
gcloud billing accounts list

# View project info
gcloud projects describe startup-sherlock

# View enabled APIs
gcloud services list --enabled
```

---

## 🔧 Useful SQL Queries

### Check Database Status
```sql
-- Connection count
SELECT count(*) FROM pg_stat_activity;

-- Database size
SELECT pg_size_pretty(pg_database_size('startup_sherlock'));

-- Table sizes
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Recent activity
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;
```

### Data Queries
```sql
-- Top startups by score
SELECT name, latest_overall_score, latest_risk_level 
FROM startups 
WHERE deleted_at IS NULL 
ORDER BY latest_overall_score DESC 
LIMIT 10;

-- Startups by industry
SELECT industry, COUNT(*) as count 
FROM startups 
WHERE deleted_at IS NULL 
GROUP BY industry 
ORDER BY count DESC;

-- Recent analyses
SELECT s.name, a.analysis_type, a.overall_score, a.created_at
FROM analyses a
JOIN startups s ON a.startup_id = s.id
ORDER BY a.created_at DESC
LIMIT 10;

-- Open risk flags
SELECT s.name, rf.severity, rf.title
FROM risk_flags rf
JOIN startups s ON rf.startup_id = s.id
WHERE rf.status = 'open'
ORDER BY 
  CASE rf.severity 
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    ELSE 4
  END;
```

---

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check if Cloud SQL Proxy is running
ps aux | grep cloud-sql-proxy

# Restart proxy
pkill cloud-sql-proxy
cloud-sql-proxy startup-sherlock:us-central1:startup-sherlock-db

# Test connection
psql "$DATABASE_URL" -c "SELECT 1"
```

### Application Won't Start
```bash
# Check environment variables
env | grep -E "DATABASE_URL|GCS_BUCKET|GEMINI_API_KEY"

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check logs
npm run dev 2>&1 | tee debug.log
```

### Cloud Storage Issues
```bash
# Check bucket permissions
gcloud storage buckets get-iam-policy gs://startup-sherlock-documents

# Test upload
echo "test" > test.txt
gsutil cp test.txt gs://startup-sherlock-documents/test/
rm test.txt
```

---

## 📈 Performance Tips

### Optimize Queries
```sql
-- Analyze query plan
EXPLAIN ANALYZE SELECT * FROM startups WHERE industry = 'fintech';

-- Update statistics
ANALYZE;

-- Refresh materialized view
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_startup_dashboard;
```

### Monitor Performance
```sql
-- Slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Cache hit rate
SELECT 
  sum(heap_blks_read) as heap_read,
  sum(heap_blks_hit)  as heap_hit,
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as ratio
FROM pg_statio_user_tables;
```

---

## 💰 Cost Management

### Check Current Usage
```bash
# Cloud SQL storage
gcloud sql instances describe startup-sherlock-db \
  --format="value(settings.dataDiskSizeGb)"

# Storage bucket size
gsutil du -sh gs://startup-sherlock-documents/

# View billing
gcloud billing accounts list
```

### Optimize Costs
```bash
# Scale down instance (development)
gcloud sql instances patch startup-sherlock-db --tier=db-custom-2-8192

# Move old files to Nearline
gsutil setmeta -h "Content-Type:application/pdf" \
  -h "x-goog-storage-class:NEARLINE" \
  gs://startup-sherlock-documents/old-files/*
```

---

## 🔒 Security Checklist

```bash
# ✓ Service account key is in .gitignore
# ✓ .env file is not committed to git
# ✓ Database uses SSL/TLS
# ✓ Cloud Storage uses IAM authentication
# ✓ Database credentials are strong (32+ chars)
# ✓ Session secret is unique and random
# ✓ Backup encryption is enabled
# ✓ Audit logging is active
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `DATABASE_DESIGN.md` | Complete architecture documentation |
| `SETUP_GUIDE.md` | Detailed setup instructions |
| `ENV_CONFIGURATION.md` | Environment variable guide |
| `IMPLEMENTATION_SUMMARY.md` | Implementation overview |
| `QUICK_REFERENCE.md` | This file - common commands |

---

## 🆘 Emergency Procedures

### Database is Down
```bash
# Check instance status
gcloud sql instances list

# View recent operations
gcloud sql operations list --instance=startup-sherlock-db --limit=5

# Restart instance
gcloud sql instances restart startup-sherlock-db
```

### Need to Restore Backup
```bash
# List available backups
gcloud sql backups list --instance=startup-sherlock-db

# Restore from backup
gcloud sql backups restore BACKUP_ID --backup-instance=startup-sherlock-db
```

### High Costs Alert
```bash
# Check what's using resources
gcloud sql instances describe startup-sherlock-db --format=json

# Temporary scale down
gcloud sql instances patch startup-sherlock-db --tier=db-custom-1-3840

# Delete old backups
gcloud sql backups delete BACKUP_ID --instance=startup-sherlock-db
```

---

## 📞 Support Resources

- **Google Cloud Support**: https://cloud.google.com/support
- **Documentation**: See files listed above
- **PostgreSQL Docs**: https://www.postgresql.org/docs/15/
- **Drizzle ORM Docs**: https://orm.drizzle.team/docs
- **Stack Overflow**: Tag `google-cloud-sql` or `google-cloud-storage`

---

## 💡 Pro Tips

1. **Keep Cloud SQL Proxy running** in a dedicated terminal tab
2. **Use tmux/screen** for persistent sessions
3. **Set up shell aliases** for common commands:
   ```bash
   alias db-proxy="cloud-sql-proxy startup-sherlock:us-central1:startup-sherlock-db"
   alias db-connect="psql \"$DATABASE_URL\""
   alias db-tables="npm run db:tables"
   ```
4. **Monitor costs weekly** with `gcloud billing` commands
5. **Test backups monthly** by restoring to a test instance
6. **Keep documentation updated** as you make changes

---

**Last Updated**: 2025-10-30  
**Version**: 1.0.0

