#!/bin/bash

# Cloud Run Deployment Script for Startup Sherlock Backend
# This script builds and deploys your backend to Google Cloud Run

set -e  # Exit on error

echo "🚀 Starting Cloud Run Deployment..."
echo "=================================="
echo ""

# Configuration
PROJECT_ID="startup-sherlock"
SERVICE_NAME="startup-sherlock-backend"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed. Please install it first:"
    echo "   https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Set the project
echo "📍 Setting GCP project to: ${PROJECT_ID}"
gcloud config set project ${PROJECT_ID}

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build the Docker image using Cloud Build (faster than local)
echo ""
echo "🏗️  Building Docker image..."
gcloud builds submit --tag ${IMAGE_NAME} .

# Deploy to Cloud Run
echo ""
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME} \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --port 8080 \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --max-instances 10 \
  --min-instances 0 \
  --set-env-vars "NODE_ENV=production"

# Get the service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --platform managed --region ${REGION} --format 'value(status.url)')

echo ""
echo "=================================="
echo "✅ Deployment Complete!"
echo "=================================="
echo ""
echo "🌐 Service URL: ${SERVICE_URL}"
echo ""
echo "📝 Next Steps:"
echo "1. Set environment variables in Cloud Run console:"
echo "   https://console.cloud.google.com/run/detail/${REGION}/${SERVICE_NAME}/variables?project=${PROJECT_ID}"
echo ""
echo "2. Update your frontend .env with:"
echo "   VITE_API_URL=${SERVICE_URL}"
echo ""
echo "3. Test the API:"
echo "   curl ${SERVICE_URL}/api/health"
echo ""

