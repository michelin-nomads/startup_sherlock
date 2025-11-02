# ☁️ Google Cloud Run Deployment - Complete!

## 🎉 Deployment Status: **LIVE and WORKING**

### 🌐 URLs
- **Frontend**: https://startup-sherlock.web.app
- **Backend**: https://startup-sherlock-backend-85308161557.us-central1.run.app

---

## ✅ What Was Deployed

### Backend (Cloud Run)
- **Container**: Node.js 20 with Express
- **Database**: Cloud SQL (PostgreSQL) via Unix socket
- **Storage**: Google Cloud Storage
- **Authentication**: Firebase Admin SDK
- **Memory**: 2GB RAM, 2 CPU cores
- **Scaling**: 0-10 instances (auto-scales based on traffic)

### Frontend (Firebase Hosting)
- **Framework**: React + Vite
- **CDN**: Global Firebase CDN
- **Authentication**: Firebase Client SDK

### Infrastructure
- ✅ Cloud SQL Database (PostgreSQL 15)
- ✅ Google Cloud Storage Bucket
- ✅ Firebase Authentication
- ✅ Cloud Run Service
- ✅ Firebase Hosting

---

## 📝 Environment Variables Set

### Backend (Cloud Run)
```yaml
NODE_ENV: production
DATABASE_URL: postgresql://postgres:***@localhost/postgres?host=/cloudsql/startup-sherlock:us-central1:startup-sherlock-db
GCS_PROJECT_ID: startup-sherlock
GCS_BUCKET: startup-sherlock-documents
GEMINI_API_KEY: [set]
ALLOWED_ORIGINS: [frontend URLs + localhost for development]
VITE_FIREBASE_*: [all 6 Firebase config variables]
```

### Frontend (.env)
```bash
VITE_API_BASE_URL=https://startup-sherlock-backend-85308161557.us-central1.run.app
VITE_FIREBASE_*: [all 6 Firebase config variables]
```

---

## 🚀 Deployment Process Summary

### What We Fixed
1. ❌ **Railway limitation** → ✅ **Switched to Cloud Run**
2. ❌ **Missing vite package** → ✅ **Installed all dependencies**
3. ❌ **vite.config.ts excluded** → ✅ **Included in Docker image**
4. ❌ **Invalid DATABASE_URL** → ✅ **Fixed Unix socket format**
5. ✅ **Granted IAM permissions** for Cloud SQL & Storage
6. ✅ **Configured CORS** for all origins
7. ✅ **Updated frontend** to use new backend URL

### Files Created
- `Dockerfile` - Container configuration
- `.dockerignore` - Exclude unnecessary files
- `deploy-cloud-run.sh` - Automated deployment script
- `env-vars.yaml` - Environment variables configuration
- `cloud-run-env-vars.txt` - Reference for env vars

---

## 💰 Cost Breakdown (with $500 GCP Credit)

| Service | Monthly Cost | Covered By Credit |
|---------|-------------|-------------------|
| Cloud Run | $5-10 | ✅ Yes |
| Cloud SQL | $7-15 | ✅ Yes |
| Cloud Storage | $1-5 | ✅ Yes |
| Firebase Hosting | FREE | N/A |
| Firebase Auth | FREE | N/A |

**Total**: ~$13-30/month → Covered by your $500 credit for 16-38 months!

---

## 🔧 How to Redeploy

### Backend (Cloud Run)
```bash
# Make changes to backend code
# Rebuild and deploy
gcloud builds submit --tag gcr.io/startup-sherlock/startup-sherlock-backend .
gcloud run deploy startup-sherlock-backend \
  --image gcr.io/startup-sherlock/startup-sherlock-backend:latest \
  --region us-central1 \
  --env-vars-file env-vars.yaml
```

Or use the script:
```bash
./deploy-cloud-run.sh
```

### Frontend (Firebase Hosting)

**Easy way (recommended):**
```bash
./build-and-deploy-frontend.sh
```

**Manual way:**
```bash
# Export all VITE_* variables from .env
export $(grep -v '^#' .env | grep 'VITE_' | xargs)

# Build and deploy
npm run build
firebase deploy --only hosting
```

**Note:** Vite needs VITE_* environment variables at BUILD TIME, not runtime. The build script ensures they're loaded from .env file.

---

## 🧪 Testing

### Health Check
```bash
curl https://startup-sherlock-backend-85308161557.us-central1.run.app/api/health
# Expected: {"status":"ok","timestamp":"..."}
```

### Frontend
1. Visit: https://startup-sherlock.web.app
2. Sign in with Google or Email
3. Upload a document
4. Check analysis results

---

## 📊 Monitoring

### Cloud Run Logs
```bash
gcloud logging read "resource.type=cloud_run_revision" \
  --limit 50 \
  --project startup-sherlock
```

### Cloud Run Dashboard
https://console.cloud.google.com/run?project=startup-sherlock

### Firebase Console
https://console.firebase.google.com/project/startup-sherlock

---

## 🎯 Key Features Working

✅ **User Authentication**
- Google Sign-In
- Email/Password
- Firebase Auth integration

✅ **Document Processing**
- File uploads to GCS
- Text extraction
- Gemini AI analysis

✅ **Database Operations**
- PostgreSQL via Cloud SQL
- User data segregation
- Secure data access

✅ **API Security**
- JWT token verification
- CORS configured
- Data ownership checks

---

## 🔐 Security

- ✅ Service account keys via IAM (no JSON files in container)
- ✅ HTTPS only (enforced by Cloud Run & Firebase)
- ✅ CORS properly configured
- ✅ User data segregation
- ✅ Firebase Admin SDK for backend auth
- ✅ Environment variables for secrets

---

## 📚 Additional Resources

- **Cloud Run Documentation**: https://cloud.google.com/run/docs
- **Firebase Hosting**: https://firebase.google.com/docs/hosting
- **Cloud SQL**: https://cloud.google.com/sql/docs

---

## ✅ Next Steps (Optional)

1. **Custom Domain**: Add your own domain to Firebase Hosting
2. **Monitoring**: Set up Cloud Monitoring alerts
3. **Backup**: Configure automated Cloud SQL backups
4. **CI/CD**: Set up GitHub Actions for automatic deployments

---

**Deployment completed**: November 2, 2025  
**Time taken**: ~20 minutes  
**Status**: ✅ Fully functional and production-ready

