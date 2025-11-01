# Environment Configuration Guide

## Quick Start

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your values in `.env`

3. **Never commit `.env` to git!** (already in `.gitignore`)

## Required Variables

### Google Cloud Configuration

```bash
# Your Google Cloud Project ID
GCP_PROJECT_ID=startup-sherlock

# Google Cloud Region
GCP_REGION=us-central1

# Path to service account key
GOOGLE_APPLICATION_CREDENTIALS=./gcloud-service-account-key.json
```

### Database Configuration

```bash
# Full PostgreSQL connection string
DATABASE_URL=postgresql://app_user:PASSWORD@localhost:5432/startup_sherlock

# Cloud SQL connection name (format: PROJECT:REGION:INSTANCE)
DB_INSTANCE_CONNECTION_NAME=startup-sherlock:us-central1:startup-sherlock-db
```

### Cloud Storage

```bash
# Bucket name for document storage
GCS_BUCKET=startup-sherlock-documents
GCS_PROJECT_ID=startup-sherlock
```

### API Keys

```bash
# Google Gemini API (required for AI analysis)
GEMINI_API_KEY=your_key_here

# Google Custom Search (optional - for research features)
GOOGLE_SEARCH_API_KEY=your_key_here
GOOGLE_SEARCH_ENGINE_ID=your_id_here
```

### Application

```bash
NODE_ENV=development
PORT=5000
SESSION_SECRET=generate_random_string_here
```

## Getting API Keys

### 1. Gemini API Key (Required)

1. Go to https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key to your `.env` file

### 2. Google Custom Search API (Optional)

1. Go to https://console.cloud.google.com/apis/credentials
2. Click "Create Credentials" → "API Key"
3. Enable "Custom Search API"
4. Copy the key to your `.env` file

### 3. Custom Search Engine ID (Optional)

1. Go to https://programmablesearchengine.google.com/
2. Click "Add" to create a new search engine
3. Search the entire web or specific sites
4. Copy the Search Engine ID to your `.env` file

## Connection Methods

### Method 1: Cloud SQL Proxy (Recommended for Development)

```bash
# 1. Install Cloud SQL Proxy
brew install cloud-sql-proxy  # macOS
# or download from https://cloud.google.com/sql/docs/postgres/sql-proxy

# 2. Start the proxy
cloud-sql-proxy YOUR_CONNECTION_NAME

# 3. Connect via localhost
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/DATABASE
```

### Method 2: Direct Connection (Production)

```bash
# Use Cloud SQL instance public IP (for development only)
DATABASE_URL=postgresql://USER:PASSWORD@INSTANCE_IP:5432/DATABASE

# Note: Add your IP to authorized networks:
gcloud sql instances patch INSTANCE_NAME --authorized-networks=YOUR_IP/32
```

### Method 3: Unix Socket (Production on GCP)

```bash
# Use Unix socket connection (recommended for App Engine, Cloud Run)
DATABASE_URL=postgresql://USER:PASSWORD@/DATABASE?host=/cloudsql/CONNECTION_NAME
```

## Security Best Practices

### 1. Service Account Key

```bash
# Store securely, never commit
GOOGLE_APPLICATION_CREDENTIALS=./gcloud-service-account-key.json

# Add to .gitignore
echo "gcloud-service-account-key.json" >> .gitignore
```

### 2. Database Credentials

```bash
# Use strong passwords (32+ characters)
DB_PASSWORD=$(openssl rand -base64 32)

# Rotate credentials regularly
# Use Google Secret Manager in production
```

### 3. Session Secret

```bash
# Generate a secure random string
SESSION_SECRET=$(openssl rand -base64 64)
```

### 4. Production Environment

```bash
NODE_ENV=production
DEBUG=false
FORCE_HTTPS=true
```

## Environment-Specific Configurations

### Development

```bash
NODE_ENV=development
DEBUG=true
LOG_LEVEL=debug
USE_MEMORY_STORAGE=false  # Use real database
```

### Testing

```bash
NODE_ENV=test
DATABASE_URL=postgresql://user:pass@localhost:5432/startup_sherlock_test
MOCK_EXTERNAL_APIS=true
```

### Production

```bash
NODE_ENV=production
DEBUG=false
LOG_LEVEL=info
FORCE_HTTPS=true
HELMET_ENABLED=true
```

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
psql "$DATABASE_URL"

# Check Cloud SQL Proxy status
ps aux | grep cloud-sql-proxy

# View Cloud SQL logs
gcloud sql operations list --instance=INSTANCE_NAME
```

### Cloud Storage Issues

```bash
# Test bucket access
gsutil ls gs://YOUR_BUCKET_NAME/

# Check service account permissions
gcloud storage buckets get-iam-policy gs://YOUR_BUCKET_NAME
```

### API Key Issues

```bash
# Test Gemini API
curl "https://generativelanguage.googleapis.com/v1/models?key=$GEMINI_API_KEY"

# Check API quotas
gcloud services list --enabled
```

## Migration Guide

### From In-Memory to Database

1. Ensure database is set up and migrated
2. Update `.env`:
   ```bash
   USE_MEMORY_STORAGE=false
   DATABASE_URL=your_connection_string
   ```
3. Restart application

### From Neon to Google Cloud SQL

1. Export data from Neon:
   ```bash
   pg_dump "$OLD_DATABASE_URL" > backup.sql
   ```

2. Import to Cloud SQL:
   ```bash
   psql "$NEW_DATABASE_URL" < backup.sql
   ```

3. Update `.env` with new connection string

4. Restart application

## Monitoring & Alerts

### Set Up Monitoring

```bash
# Cloud SQL monitoring
gcloud sql operations list --instance=INSTANCE_NAME --limit=10

# Storage monitoring
gsutil du -sh gs://YOUR_BUCKET_NAME
```

### Cost Monitoring

```bash
# View current month costs
gcloud billing accounts list
gcloud billing budgets list --billing-account=ACCOUNT_ID
```

### Alerts

Set up budget alerts in Google Cloud Console:
1. Go to Billing → Budgets & alerts
2. Create budget for $500/month
3. Set alert thresholds at 50%, 75%, 90%, 100%

## Additional Resources

- [Google Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [Cloud Storage Documentation](https://cloud.google.com/storage/docs)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Service Account Best Practices](https://cloud.google.com/iam/docs/best-practices-service-accounts)

