#!/bin/bash

# ============================================================================
# Google Cloud Setup Script for Startup Sherlock
# ============================================================================
# This script sets up Google Cloud infrastructure:
# - Cloud SQL (PostgreSQL)
# - Cloud Storage bucket
# - IAM service accounts and permissions
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-startup-sherlock}"
REGION="${GCP_REGION:-us-central1}"
ZONE="${GCP_ZONE:-us-central1-a}"

# Cloud SQL Configuration
DB_INSTANCE_NAME="${DB_INSTANCE_NAME:-startup-sherlock-db}"
DB_NAME="${DB_NAME:-startup_sherlock}"
DB_USER="${DB_USER:-app_user}"
DB_VERSION="POSTGRES_15"
DB_TIER="db-custom-4-16384"  # 4 vCPU, 16GB RAM
DB_STORAGE="100"  # GB

# Cloud Storage Configuration
BUCKET_NAME="${GCS_BUCKET:-${PROJECT_ID}-documents}"
BUCKET_LOCATION="${GCS_LOCATION:-US}"

# Service Account
SERVICE_ACCOUNT_NAME="startup-sherlock-sa"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

# ============================================================================
# Helper Functions
# ============================================================================

print_header() {
  echo -e "\n${BLUE}========================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if gcloud is installed
check_gcloud() {
  if ! command -v gcloud &> /dev/null; then
    print_error "gcloud CLI is not installed"
    print_info "Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
  fi
  print_success "gcloud CLI found"
}

# ============================================================================
# Main Setup Functions
# ============================================================================

setup_project() {
  print_header "Setting up Google Cloud Project"
  
  # Set project
  gcloud config set project "$PROJECT_ID"
  print_success "Project set to: $PROJECT_ID"
  
  # Enable required APIs
  print_info "Enabling required APIs..."
  gcloud services enable \
    sqladmin.googleapis.com \
    storage-api.googleapis.com \
    storage-component.googleapis.com \
    iam.googleapis.com \
    compute.googleapis.com
  
  print_success "APIs enabled"
}

setup_service_account() {
  print_header "Setting up Service Account"
  
  # Check if service account exists
  if gcloud iam service-accounts describe "$SERVICE_ACCOUNT_EMAIL" &> /dev/null; then
    print_warning "Service account already exists"
  else
    # Create service account
    gcloud iam service-accounts create "$SERVICE_ACCOUNT_NAME" \
      --display-name="Startup Sherlock Application Service Account" \
      --description="Service account for Startup Sherlock application"
    
    print_success "Service account created: $SERVICE_ACCOUNT_EMAIL"
  fi
  
  # Grant necessary roles
  print_info "Granting IAM roles..."
  
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/cloudsql.client" \
    --condition=None
  
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/storage.objectAdmin" \
    --condition=None
  
  print_success "IAM roles granted"
  
  # Create and download key
  print_info "Creating service account key..."
  KEY_FILE="./gcloud-service-account-key.json"
  
  if [ -f "$KEY_FILE" ]; then
    print_warning "Key file already exists: $KEY_FILE"
  else
    gcloud iam service-accounts keys create "$KEY_FILE" \
      --iam-account="$SERVICE_ACCOUNT_EMAIL"
    
    print_success "Service account key created: $KEY_FILE"
    print_warning "Keep this file secure! Add to .gitignore"
  fi
}

setup_cloud_sql() {
  print_header "Setting up Cloud SQL (PostgreSQL)"
  
  # Check if instance exists
  if gcloud sql instances describe "$DB_INSTANCE_NAME" &> /dev/null; then
    print_warning "Cloud SQL instance already exists: $DB_INSTANCE_NAME"
  else
    print_info "Creating Cloud SQL instance (this may take 5-10 minutes)..."
    
    gcloud sql instances create "$DB_INSTANCE_NAME" \
      --database-version="$DB_VERSION" \
      --tier="$DB_TIER" \
      --region="$REGION" \
      --storage-size="$DB_STORAGE" \
      --storage-type=SSD \
      --storage-auto-increase \
      --storage-auto-increase-limit=500 \
      --backup \
      --backup-start-time="02:00" \
      --retained-backups-count=7 \
      --maintenance-window-day=SUN \
      --maintenance-window-hour=3 \
      --database-flags=max_connections=100 \
      --availability-type=regional \
      --enable-bin-log
    
    print_success "Cloud SQL instance created: $DB_INSTANCE_NAME"
  fi
  
  # Set root password
  print_info "Setting root password..."
  DB_ROOT_PASSWORD=$(openssl rand -base64 32)
  gcloud sql users set-password postgres \
    --instance="$DB_INSTANCE_NAME" \
    --password="$DB_ROOT_PASSWORD"
  
  echo "DB_ROOT_PASSWORD=$DB_ROOT_PASSWORD" >> .env.local
  print_success "Root password set and saved to .env.local"
  
  # Create database
  print_info "Creating database: $DB_NAME"
  if gcloud sql databases describe "$DB_NAME" --instance="$DB_INSTANCE_NAME" &> /dev/null; then
    print_warning "Database already exists: $DB_NAME"
  else
    gcloud sql databases create "$DB_NAME" \
      --instance="$DB_INSTANCE_NAME" \
      --charset=UTF8 \
      --collation=en_US.UTF8
    
    print_success "Database created: $DB_NAME"
  fi
  
  # Create application user
  print_info "Creating application user: $DB_USER"
  DB_PASSWORD=$(openssl rand -base64 32)
  
  gcloud sql users create "$DB_USER" \
    --instance="$DB_INSTANCE_NAME" \
    --password="$DB_PASSWORD" || true
  
  echo "DB_USER=$DB_USER" >> .env.local
  echo "DB_PASSWORD=$DB_PASSWORD" >> .env.local
  print_success "Application user created"
  
  # Get connection details
  CONNECTION_NAME=$(gcloud sql instances describe "$DB_INSTANCE_NAME" --format="value(connectionName)")
  print_info "Connection Name: $CONNECTION_NAME"
  
  # Generate connection string
  DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@/$DB_NAME?host=/cloudsql/$CONNECTION_NAME"
  echo "DATABASE_URL=$DATABASE_URL" >> .env.local
  
  print_success "Database URL saved to .env.local"
  
  # Public IP (for development only)
  PUBLIC_IP=$(gcloud sql instances describe "$DB_INSTANCE_NAME" --format="value(ipAddresses[0].ipAddress)")
  print_info "Public IP: $PUBLIC_IP (for development only)"
  
  # For local development, add your IP to authorized networks
  print_warning "To connect from local machine, add your IP to authorized networks:"
  print_info "gcloud sql instances patch $DB_INSTANCE_NAME --authorized-networks=YOUR_IP/32"
}

setup_cloud_storage() {
  print_header "Setting up Cloud Storage"
  
  # Check if bucket exists
  if gsutil ls -b "gs://$BUCKET_NAME" &> /dev/null; then
    print_warning "Bucket already exists: $BUCKET_NAME"
  else
    print_info "Creating Cloud Storage bucket..."
    
    gsutil mb -p "$PROJECT_ID" -c STANDARD -l "$BUCKET_LOCATION" "gs://$BUCKET_NAME"
    
    print_success "Bucket created: gs://$BUCKET_NAME"
  fi
  
  # Set bucket permissions
  print_info "Setting bucket permissions..."
  
  gsutil iam ch \
    "serviceAccount:$SERVICE_ACCOUNT_EMAIL:roles/storage.objectAdmin" \
    "gs://$BUCKET_NAME"
  
  print_success "Bucket permissions configured"
  
  # Enable versioning
  gsutil versioning set on "gs://$BUCKET_NAME"
  print_success "Versioning enabled"
  
  # Set lifecycle policy (move old files to Nearline after 90 days)
  cat > /tmp/lifecycle.json <<EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "SetStorageClass", "storageClass": "NEARLINE"},
        "condition": {"age": 90}
      },
      {
        "action": {"type": "Delete"},
        "condition": {"age": 730}
      }
    ]
  }
}
EOF
  
  gsutil lifecycle set /tmp/lifecycle.json "gs://$BUCKET_NAME"
  rm /tmp/lifecycle.json
  print_success "Lifecycle policy configured"
  
  echo "GCS_BUCKET=$BUCKET_NAME" >> .env.local
}

run_migration() {
  print_header "Running Database Migration"
  
  print_info "Install Cloud SQL Proxy for local migration:"
  print_info "  brew install cloud-sql-proxy  # macOS"
  print_info "  or download from: https://cloud.google.com/sql/docs/postgres/sql-proxy"
  
  print_info "\nTo run migration locally:"
  print_info "  1. Start Cloud SQL Proxy:"
  print_info "     cloud-sql-proxy $CONNECTION_NAME"
  print_info "  2. In another terminal, run migration:"
  print_info "     psql \"postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME\" -f migrations/001_initial_enhanced_schema.sql"
  
  print_warning "Migration must be run manually after verifying connection"
}

create_env_template() {
  print_header "Creating Environment Configuration"
  
  cat > .env.example <<EOF
# Google Cloud Configuration
GCP_PROJECT_ID=$PROJECT_ID
GCP_REGION=$REGION

# Cloud SQL Configuration
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
DB_INSTANCE_CONNECTION_NAME=

# Cloud Storage Configuration
GCS_BUCKET=$BUCKET_NAME
GCS_PROJECT_ID=$PROJECT_ID
GOOGLE_APPLICATION_CREDENTIALS=./gcloud-service-account-key.json

# API Keys
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_SEARCH_API_KEY=your_google_search_api_key_here
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id_here

# Application Configuration
NODE_ENV=development
PORT=5000
EOF
  
  print_success ".env.example created"
  print_info "Copy to .env and fill in the values"
}

print_summary() {
  print_header "Setup Complete! 🎉"
  
  echo -e "${GREEN}Resources Created:${NC}"
  echo -e "  • Cloud SQL Instance: $DB_INSTANCE_NAME"
  echo -e "  • Database: $DB_NAME"
  echo -e "  • Cloud Storage Bucket: gs://$BUCKET_NAME"
  echo -e "  • Service Account: $SERVICE_ACCOUNT_EMAIL"
  
  echo -e "\n${BLUE}Configuration Files:${NC}"
  echo -e "  • Service Account Key: gcloud-service-account-key.json"
  echo -e "  • Environment Variables: .env.local"
  echo -e "  • Environment Template: .env.example"
  
  echo -e "\n${YELLOW}Next Steps:${NC}"
  echo -e "  1. Review .env.local and copy to .env"
  echo -e "  2. Add GEMINI_API_KEY and other API keys to .env"
  echo -e "  3. Install Cloud SQL Proxy: brew install cloud-sql-proxy"
  echo -e "  4. Run database migration (see instructions above)"
  echo -e "  5. Start application: npm run dev"
  
  echo -e "\n${YELLOW}Estimated Monthly Cost:${NC}"
  echo -e "  • Cloud SQL ($DB_TIER): ~\$150/month"
  echo -e "  • Cloud Storage: ~\$5-10/month"
  echo -e "  • Total: ~\$165/month (33% of \$500 credit)"
  
  echo -e "\n${RED}Security Notes:${NC}"
  echo -e "  • Keep gcloud-service-account-key.json secure!"
  echo -e "  • Add to .gitignore immediately"
  echo -e "  • Never commit .env files to git"
  echo -e "  • Rotate service account keys regularly"
  
  print_success "Setup completed successfully!"
}

# ============================================================================
# Main Execution
# ============================================================================

main() {
  print_header "Startup Sherlock - Google Cloud Setup"
  
  print_info "Project ID: $PROJECT_ID"
  print_info "Region: $REGION"
  print_info "DB Instance: $DB_INSTANCE_NAME"
  print_info "Bucket: $BUCKET_NAME"
  
  echo -e "\n${YELLOW}This script will:${NC}"
  echo "  1. Enable required Google Cloud APIs"
  echo "  2. Create a service account with necessary permissions"
  echo "  3. Set up Cloud SQL (PostgreSQL) instance"
  echo "  4. Create Cloud Storage bucket"
  echo "  5. Generate configuration files"
  
  echo -e "\n${YELLOW}Estimated time: 10-15 minutes${NC}"
  echo -e "${YELLOW}Estimated cost: ~\$165/month${NC}\n"
  
  read -p "Continue? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_error "Setup cancelled"
    exit 1
  fi
  
  # Run setup steps
  check_gcloud
  setup_project
  setup_service_account
  setup_cloud_sql
  setup_cloud_storage
  create_env_template
  run_migration
  print_summary
}

# Run main function
main "$@"

