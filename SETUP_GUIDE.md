# Startup Sherlock - Complete Setup Guide

## 🎯 Overview

This guide will help you set up the complete Startup Sherlock infrastructure using Google Cloud services with your $500 credit.

**Total Setup Time:** ~30 minutes  
**Monthly Cost:** ~$165/month (33% of your $500 credit)  
**Stack:**
- **Database:** Google Cloud SQL (PostgreSQL 15)
- **File Storage:** Google Cloud Storage
- **Backend:** Node.js + Express + Drizzle ORM
- **Frontend:** React + Vite + TailwindCSS

---

## 📋 Prerequisites

### 1. Software Requirements

```bash
# Node.js 18+ and npm
node --version  # Should be 18.x or higher
npm --version

# PostgreSQL client (for migrations)
psql --version

# Google Cloud SDK
gcloud --version

# Git
git --version
```

### 2. Install Missing Tools

#### macOS

```bash
# Install Homebrew if needed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install tools
brew install node postgresql google-cloud-sdk
```

#### Linux

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL client
sudo apt-get install -y postgresql-client

# Install Google Cloud SDK
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

#### Windows

```powershell
# Use Chocolatey
choco install nodejs postgresql gcloud
```

---

## 🚀 Step-by-Step Setup

### Step 1: Clone and Install Dependencies

```bash
cd /Users/m0s1csy/Documents/Hckthn/git/phase_2/startup_sherlock

# Install Node.js dependencies
npm install

# Install additional Google Cloud dependencies
npm install @google-cloud/storage postgres drizzle-orm

# Install dev dependencies
npm install -D drizzle-kit @types/pg
```

### Step 2: Configure Google Cloud

```bash
# Login to Google Cloud
gcloud auth login

# Set your project (create if doesn't exist)
gcloud projects create startup-sherlock --name="Startup Sherlock"
gcloud config set project startup-sherlock

# Link billing account (required for $500 credit)
gcloud billing accounts list
gcloud billing projects link startup-sherlock --billing-account=BILLING_ACCOUNT_ID
```

### Step 3: Run Automated Setup Script

```bash
# Make script executable
chmod +x scripts/setup-google-cloud.sh

# Run setup (will take 10-15 minutes)
./scripts/setup-google-cloud.sh

# Follow prompts and save generated credentials
```

**What this script does:**
- ✅ Enables required Google Cloud APIs
- ✅ Creates service account with proper permissions
- ✅ Sets up Cloud SQL (PostgreSQL) instance
- ✅ Creates Cloud Storage bucket
- ✅ Generates `.env.local` with all credentials
- ✅ Downloads service account key

### Step 4: Configure Environment Variables

```bash
# Copy generated credentials to .env
cp .env.local .env

# Add your Gemini API key (get from https://aistudio.google.com/app/apikey)
echo "GEMINI_API_KEY=your_actual_key_here" >> .env

# Optional: Add Google Search API credentials
echo "GOOGLE_SEARCH_API_KEY=your_key_here" >> .env
echo "GOOGLE_SEARCH_ENGINE_ID=your_id_here" >> .env
```

### Step 5: Set Up Database Connection

#### Option A: Cloud SQL Proxy (Recommended for Development)

```bash
# Install Cloud SQL Proxy
brew install cloud-sql-proxy  # macOS
# OR download from https://cloud.google.com/sql/docs/postgres/sql-proxy

# Start proxy in a separate terminal (keep running)
cloud-sql-proxy startup-sherlock:us-central1:startup-sherlock-db

# Your DATABASE_URL should be:
# postgresql://app_user:PASSWORD@localhost:5432/startup_sherlock
```

#### Option B: Direct Connection (Quick Test)

```bash
# Get your Cloud SQL instance IP
gcloud sql instances describe startup-sherlock-db --format="value(ipAddresses[0].ipAddress)"

# Authorize your IP
MY_IP=$(curl -s ifconfig.me)
gcloud sql instances patch startup-sherlock-db --authorized-networks=$MY_IP/32

# Update DATABASE_URL in .env with the instance IP
```

### Step 6: Run Database Migration

```bash
# With Cloud SQL Proxy running, run migration
psql "$DATABASE_URL" -f migrations/001_initial_enhanced_schema.sql

# Verify migration
psql "$DATABASE_URL" -c "\dt"  # List tables

# You should see 15+ tables
```

### Step 7: Test Database Connection

```bash
# Create a test script
cat > test-db.js << 'EOF'
import { initDatabase } from './server/storage.enhanced.ts';

const config = {
  connectionString: process.env.DATABASE_URL,
};

const db = initDatabase(config);

async function test() {
  const success = await db.testConnection();
  console.log(success ? '✅ Database connected!' : '❌ Connection failed');
  await db.close();
}

test();
EOF

# Run test
node test-db.js
```

### Step 8: Test Cloud Storage

```bash
# Test bucket access
gsutil ls gs://$(grep GCS_BUCKET .env | cut -d'=' -f2)

# Upload test file
echo "test" > test.txt
gsutil cp test.txt gs://$(grep GCS_BUCKET .env | cut -d'=' -f2)/test/
rm test.txt
```

### Step 9: Start the Application

```bash
# Start backend and frontend
npm run dev

# Application should be running at:
# http://localhost:5000
```

### Step 10: Verify Everything Works

```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Expected response:
# {"status":"ok","timestamp":"2025-10-30T..."}
```

---

## 🔧 Configuration Details

### Database Configuration

**Instance Specs:**
- Type: `db-custom-4-16384` (4 vCPU, 16GB RAM)
- Storage: 100GB SSD (auto-scaling to 500GB)
- Backups: Daily at 2 AM UTC, 7-day retention
- High Availability: Regional with failover
- PostgreSQL Version: 15

**Connection Pooling:**
- Max Connections: 20
- Idle Timeout: 30 seconds
- Connect Timeout: 10 seconds

### Storage Configuration

**Bucket Settings:**
- Storage Class: Standard
- Location: US
- Versioning: Enabled
- Lifecycle:
  - Move to Nearline after 90 days
  - Delete after 730 days (2 years)

### Cost Breakdown

| Service | Configuration | Est. Monthly Cost |
|---------|--------------|-------------------|
| Cloud SQL | db-custom-4-16384, 100GB | ~$150 |
| Cloud Storage | Standard, ~10GB | ~$5-10 |
| Network Egress | Typical usage | ~$5 |
| **Total** | | **~$165/month** |

**Budget Alerts:**
- 50% threshold: $250
- 75% threshold: $375
- 90% threshold: $450
- 100% threshold: $500

---

## 🛠️ Common Tasks

### Backup Database

```bash
# Manual backup
gcloud sql export sql startup-sherlock-db \
  gs://startup-sherlock-backups/backup-$(date +%Y%m%d-%H%M%S).sql \
  --database=startup_sherlock

# Download backup
gsutil cp gs://startup-sherlock-backups/backup-*.sql ./backups/
```

### Restore Database

```bash
# Upload backup to Cloud Storage
gsutil cp backup.sql gs://startup-sherlock-backups/

# Import to Cloud SQL
gcloud sql import sql startup-sherlock-db \
  gs://startup-sherlock-backups/backup.sql \
  --database=startup_sherlock
```

### Scale Database

```bash
# Upgrade to more powerful instance
gcloud sql instances patch startup-sherlock-db \
  --tier=db-custom-8-32768  # 8 vCPU, 32GB RAM

# Add storage
gcloud sql instances patch startup-sherlock-db \
  --storage-size=200
```

### Monitor Costs

```bash
# View current month usage
gcloud billing accounts list

# Check Cloud SQL metrics
gcloud sql operations list --instance=startup-sherlock-db --limit=10

# Check storage usage
gsutil du -sh gs://startup-sherlock-documents
```

### Rotate Service Account Keys

```bash
# Create new key
gcloud iam service-accounts keys create new-key.json \
  --iam-account=startup-sherlock-sa@startup-sherlock.iam.gserviceaccount.com

# Update .env with new key path
# GOOGLE_APPLICATION_CREDENTIALS=./new-key.json

# Delete old key
gcloud iam service-accounts keys delete KEY_ID \
  --iam-account=startup-sherlock-sa@startup-sherlock.iam.gserviceaccount.com
```

---

## 🚨 Troubleshooting

### Database Won't Connect

```bash
# Check Cloud SQL Proxy status
ps aux | grep cloud-sql-proxy

# Restart proxy
pkill cloud-sql-proxy
cloud-sql-proxy startup-sherlock:us-central1:startup-sherlock-db

# Test connection directly
psql "$DATABASE_URL" -c "SELECT 1"
```

### Cloud Storage Access Denied

```bash
# Verify bucket exists
gsutil ls gs://startup-sherlock-documents

# Check permissions
gcloud storage buckets get-iam-policy gs://startup-sherlock-documents

# Re-grant permissions
gsutil iam ch serviceAccount:SERVICE_ACCOUNT_EMAIL:roles/storage.objectAdmin \
  gs://startup-sherlock-documents
```

### Application Won't Start

```bash
# Check environment variables
cat .env | grep -v PASSWORD

# Verify dependencies
npm install

# Check logs
npm run dev 2>&1 | tee app.log
```

### Migration Fails

```bash
# Check PostgreSQL version
psql "$DATABASE_URL" -c "SELECT version()"

# Run migration with verbose output
psql "$DATABASE_URL" -f migrations/001_initial_enhanced_schema.sql -v ON_ERROR_STOP=1

# Check existing tables
psql "$DATABASE_URL" -c "\dt"
```

---

## 📊 Monitoring & Alerts

### Set Up Cloud Monitoring

```bash
# Install monitoring agent (optional)
curl -sSO https://dl.google.com/cloudagents/add-monitoring-agent-repo.sh
sudo bash add-monitoring-agent-repo.sh
sudo apt-get update
sudo apt-get install stackdriver-agent
```

### Create Alerts

1. Go to Google Cloud Console → Monitoring → Alerting
2. Create alerts for:
   - Database CPU > 80%
   - Database storage > 90%
   - Failed database connections
   - High API error rates

### View Logs

```bash
# Cloud SQL logs
gcloud sql operations list --instance=startup-sherlock-db

# Application logs (if using Cloud Run/App Engine)
gcloud logging read "resource.type=cloud_run_revision"
```

---

## 🎓 Next Steps

### 1. Production Deployment

- Set up CI/CD pipeline (GitHub Actions, Cloud Build)
- Deploy to Cloud Run or App Engine
- Set up custom domain with Cloud Load Balancing
- Enable Cloud CDN for static assets

### 2. Security Hardening

- Enable Cloud Armor (DDoS protection)
- Set up VPC Service Controls
- Enable audit logging
- Implement rate limiting

### 3. Performance Optimization

- Add read replicas for analytics queries
- Implement Redis caching (Cloud Memorystore)
- Enable connection pooling (PgBouncer)
- Set up materialized views

### 4. Backup Strategy

- Configure automated backups
- Test restore procedures monthly
- Export to separate GCS bucket
- Document recovery procedures

---

## 📚 Additional Resources

- **Google Cloud SQL Docs:** https://cloud.google.com/sql/docs
- **Cloud Storage Docs:** https://cloud.google.com/storage/docs
- **Drizzle ORM Docs:** https://orm.drizzle.team/docs
- **PostgreSQL Docs:** https://www.postgresql.org/docs/15/
- **Cost Calculator:** https://cloud.google.com/products/calculator

---

## 🆘 Getting Help

### Community Resources

- Google Cloud Support: https://cloud.google.com/support
- Stack Overflow: Tag `google-cloud-platform`
- GitHub Issues: Submit bugs and feature requests

### Emergency Contacts

- Save billing account ID
- Save project ID
- Keep service account keys backed up
- Document recovery procedures

---

## ✅ Setup Checklist

Use this checklist to verify your setup is complete:

- [ ] Google Cloud project created and billing enabled
- [ ] `gcloud` CLI installed and configured
- [ ] Node.js 18+ and npm installed
- [ ] Repository cloned and dependencies installed
- [ ] Setup script executed successfully
- [ ] `.env` file created with all credentials
- [ ] Service account key downloaded and secured
- [ ] Cloud SQL instance running
- [ ] Cloud SQL Proxy installed and running
- [ ] Database migrated successfully
- [ ] Cloud Storage bucket created
- [ ] Application starts without errors
- [ ] Health endpoint responds correctly
- [ ] Can upload and retrieve test file
- [ ] Budget alerts configured
- [ ] Backups configured
- [ ] Documentation reviewed

---

**Congratulations! 🎉 Your Startup Sherlock infrastructure is now ready!**

For questions or issues, refer to the troubleshooting section or check the documentation files:
- `DATABASE_DESIGN.md` - Database architecture details
- `ENV_CONFIGURATION.md` - Environment variable guide
- `README.md` - General project information

