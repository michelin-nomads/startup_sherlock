#!/bin/bash

echo "🔐 Generating Base64 Environment Variables for Railway Deployment"
echo "=================================================================="
echo ""

# Check if files exist
if [ ! -f "firebase-service-account-key.json" ]; then
  echo "❌ firebase-service-account-key.json not found!"
  echo "   Please place the file in the project root."
  exit 1
fi

if [ ! -f "gcloud-service-account-key.json" ]; then
  echo "❌ gcloud-service-account-key.json not found!"
  echo "   Please place the file in the project root."
  exit 1
fi

echo "✅ Found service account files"
echo ""

# Generate Firebase base64
echo "📝 Generating FIREBASE_SERVICE_ACCOUNT_BASE64..."
FIREBASE_BASE64=$(cat firebase-service-account-key.json | base64)

# Generate GCS base64
echo "📝 Generating GCS_SERVICE_ACCOUNT_BASE64..."
GCS_BASE64=$(cat gcloud-service-account-key.json | base64)

echo ""
echo "=================================================================="
echo "✅ COPY THESE VALUES TO RAILWAY:"
echo "=================================================================="
echo ""
echo "1️⃣ FIREBASE_SERVICE_ACCOUNT_BASE64"
echo "-----------------------------------"
echo "$FIREBASE_BASE64"
echo ""
echo ""
echo "2️⃣ GCS_SERVICE_ACCOUNT_BASE64"
echo "-----------------------------------"
echo "$GCS_BASE64"
echo ""
echo ""
echo "=================================================================="
echo "📋 INSTRUCTIONS:"
echo "=================================================================="
echo ""
echo "1. Go to Railway → Your Project → Variables"
echo "2. Click 'Add Variable'"
echo "3. Name: FIREBASE_SERVICE_ACCOUNT_BASE64"
echo "4. Value: Copy and paste the entire base64 string above"
echo "5. Repeat for GCS_SERVICE_ACCOUNT_BASE64"
echo ""
echo "⚠️  SECURITY NOTE:"
echo "   - Do NOT commit these base64 strings to git"
echo "   - Do NOT share these publicly"
echo "   - Only paste them in Railway environment variables"
echo ""
