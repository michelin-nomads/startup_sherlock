#!/bin/bash

# Frontend Build & Deploy Script for Firebase Hosting
# This script ensures all VITE_* environment variables are properly loaded

set -e  # Exit on error

echo "🏗️  Building and Deploying Frontend to Firebase Hosting"
echo "========================================================"
echo ""

# Load environment variables from .env file
if [ -f .env ]; then
  echo "📄 Loading environment variables from .env..."
  export $(grep -v '^#' .env | grep 'VITE_' | xargs)
  echo "✅ Environment variables loaded"
else
  echo "❌ .env file not found!"
  exit 1
fi

# Verify critical variables are set
if [ -z "$VITE_FIREBASE_API_KEY" ]; then
  echo "❌ VITE_FIREBASE_API_KEY is not set!"
  exit 1
fi

if [ -z "$VITE_API_BASE_URL" ]; then
  echo "❌ VITE_API_BASE_URL is not set!"
  exit 1
fi

echo ""
echo "🔧 Environment variables verified:"
echo "   VITE_FIREBASE_API_KEY: ${VITE_FIREBASE_API_KEY:0:20}..."
echo "   VITE_FIREBASE_PROJECT_ID: $VITE_FIREBASE_PROJECT_ID"
echo "   VITE_API_BASE_URL: $VITE_API_BASE_URL"

# Build the frontend
echo ""
echo "🏗️  Building frontend..."
npm run build

# Verify build output
if [ ! -d "client/dist" ]; then
  echo "❌ Build failed - client/dist directory not found!"
  exit 1
fi

echo ""
echo "✅ Build successful!"

# Deploy to Firebase
echo ""
echo "🚀 Deploying to Firebase Hosting..."
firebase deploy --only hosting

echo ""
echo "========================================================"
echo "✅ Deployment Complete!"
echo "========================================================"
echo ""
echo "🌐 Your app is live at: https://startup-sherlock.web.app"
echo ""

