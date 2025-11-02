# 🚀 Railway Deployment Guide

## 📋 Prerequisites

1. Railway account
2. Firebase service account key JSON file
3. Google Cloud service account key JSON file
4. PostgreSQL database (Cloud SQL)

---

## 🔐 Step 1: Convert JSON Files to Base64

Run these commands in your terminal:

```bash
# Convert Firebase service account to base64
cat firebase-service-account-key.json | base64 > firebase-base64.txt

# Convert Google Cloud service account to base64
cat gcloud-service-account-key.json | base64 > gcloud-base64.txt
```

**Important:** These `.txt` files contain sensitive data. DO NOT commit them to git!

---

## ⚙️ Step 2: Add Environment Variables in Railway

Go to your Railway project → **Variables** tab and add:

### Required Variables:

```bash
# Database
DATABASE_URL=postgresql://postgres:PASSWORD@HOST:5432/startup_sherlock

# Google Cloud
GCS_PROJECT_ID=startup-sherlock
GCS_BUCKET_NAME=startup-sherlock-documents

# Firebase (paste the base64 content from firebase-base64.txt)
FIREBASE_SERVICE_ACCOUNT_BASE64=<paste base64 content here>

# Google Cloud Storage (paste the base64 content from gcloud-base64.txt)
GCS_SERVICE_ACCOUNT_BASE64=<paste base64 content here>

# Firebase Client Config (for frontend)
VITE_FIREBASE_API_KEY=AIzaSyAc8mtEVtika0wYmdRFLin5OCmBosvEl9U
VITE_FIREBASE_AUTH_DOMAIN=startup-sherlock.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=startup-sherlock
VITE_FIREBASE_STORAGE_BUCKET=startup-sherlock.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=85308161557
VITE_FIREBASE_APP_ID=1:85308161557:web:776d7b07924e2fdcc6981c

# Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Node Environment
NODE_ENV=production
```

### How to Paste Base64 in Railway:

1. Open `firebase-base64.txt` in a text editor
2. Copy **ALL** the content (it will be very long, multiple lines)
3. In Railway, create variable `FIREBASE_SERVICE_ACCOUNT_BASE64`
4. Paste the entire base64 string as the value
5. Repeat for `GCS_SERVICE_ACCOUNT_BASE64`

**Note:** Railway handles multi-line values automatically. Just paste the entire base64 string!

---

## 📝 Alternative: Use JSON String (If Base64 Doesn't Work)

Instead of base64, you can use the JSON directly:

```bash
# Minify JSON (remove all whitespace)
cat firebase-service-account-key.json | jq -c . > firebase-minified.json
```

Then in Railway, use:
```bash
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}
```

---

## 🗃️ Step 3: Database Setup

### For Cloud SQL (Recommended):

1. Ensure Cloud SQL instance is running
2. Cloud SQL Proxy is running locally for migrations
3. Run migrations:

```bash
npm run db:migrate
```

### Database URL Format:

```
postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE
```

For Cloud SQL public IP:
```
postgresql://postgres:PASSWORD@35.x.x.x:5432/startup_sherlock
```

---

## 🔨 Step 4: Deploy to Railway

### Option A: Connect GitHub Repository

1. Go to Railway dashboard
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect and deploy

### Option B: Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# Deploy
railway up
```

---

## ✅ Step 5: Verify Deployment

### Check Logs:

Look for these success messages in Railway logs:

```
✅ Database storage initialized with IST timezone
✅ Loaded Firebase service account from FIREBASE_SERVICE_ACCOUNT_BASE64 env var
✅ Firebase Admin initialized with service account
✅ Loaded GCS credentials from GCS_SERVICE_ACCOUNT_BASE64 env var
```

### Test Endpoints:

```bash
# Health check
curl https://your-railway-app.railway.app/api/health

# Should return: {"status":"ok","timestamp":"..."}
```

---

## 🎯 Step 6: Update Frontend (Firebase Hosting)

### Update API URL:

In `client/src/lib/config.ts`, ensure it points to Railway:

```typescript
export const getApiUrl = (path: string) => {
  const baseUrl = import.meta.env.VITE_API_URL || 
                  'https://your-railway-app.railway.app';
  return `${baseUrl}${path}`;
};
```

### Deploy Frontend:

```bash
# Build
npm run build:client

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

---

## 🔒 Security Checklist

- [ ] `.gitignore` includes `*service-account*.json`
- [ ] JSON files are NOT committed to git
- [ ] Base64 environment variables are set in Railway
- [ ] Database password is strong and not exposed
- [ ] Firebase API keys are restricted in Firebase Console
- [ ] CORS is configured for your frontend domain

---

## 🐛 Troubleshooting

### Issue: "Firebase Admin initialization failed"

**Solution:** Check that `FIREBASE_SERVICE_ACCOUNT_BASE64` is set correctly.

```bash
# Verify it's valid base64 and valid JSON
echo $FIREBASE_SERVICE_ACCOUNT_BASE64 | base64 -d | jq .
```

### Issue: "GCS bucket not found"

**Solution:** Ensure:
1. Bucket exists in Google Cloud Console
2. Service account has Storage Admin role
3. `GCS_BUCKET_NAME` matches actual bucket name

### Issue: "Database connection failed"

**Solution:** 
1. Check `DATABASE_URL` format
2. Ensure Cloud SQL allows connections from Railway IPs
3. Verify password and database name

---

## 📊 Monitoring

### Railway Logs:

```bash
railway logs
```

### Database Queries:

```sql
-- Check users
SELECT COUNT(*) FROM users;

-- Check startups
SELECT COUNT(*) FROM startups;

-- Check recent activity
SELECT * FROM users ORDER BY last_login_at DESC LIMIT 10;
```

---

## 🎉 Success!

Your app is now deployed! 

- **Backend:** https://your-railway-app.railway.app
- **Frontend:** https://startup-sherlock.web.app
- **Database:** Cloud SQL (IST timezone)
- **Storage:** Google Cloud Storage

All sensitive keys are securely stored as environment variables! 🔐

