# Data Segregation & User Ownership

## Overview
Every piece of data in the system is linked to a specific user. This ensures complete data isolation between users.

## Database Structure

### 1. User Ownership Chain
```
User (users table)
  └── Startup (startups.user_id → users.id)
       ├── Documents (documents.startup_id → startups.id)
       ├── Analyses (analyses.startup_id → startups.id)
       ├── Risk Flags (risk_flags.startup_id → startups.id)
       ├── Benchmarks (linked via startup)
       └── Public Data Sources (linked via startup)
```

### 2. Key Columns

**startups table:**
- `user_id` (VARCHAR) - Links to `users.id`
- Foreign key constraint ensures referential integrity
- Cascade delete: If user is deleted, all their startups are deleted

**users table:**
- `id` (VARCHAR) - Primary key, auto-generated UUID
- `firebase_uid` (TEXT) - Links to Firebase Authentication
- `email` (TEXT) - Unique, for identification

## Cloud Storage (GCS) Organization

### File Path Structure
```
gs://startup-sherlock-documents/
└── documents/
    └── {userId}/
        └── {startupId}/
            └── {timestamp}-{filename}
```

### Example:
```
documents/
  abc123-user-uuid/
    startup-xyz-789/
      1698765432000-pitch-deck.pdf
      1698765433000-financials.xlsx
```

### Metadata
Each file includes metadata:
- `userId` - Owner of the file
- `startupId` - Associated startup
- `uploadedAt` - Timestamp
- `originalName` - Original filename

## How to Verify Data Segregation

### 1. Check Database (Cloud SQL Studio)

Run the queries in `scripts/view-user-data.sql`:

```sql
-- See which user owns which startups
SELECT 
  u.email,
  s.name as startup_name,
  s.id as startup_id,
  COUNT(d.id) as document_count
FROM users u
INNER JOIN startups s ON s.user_id = u.id
LEFT JOIN documents d ON d.startup_id = s.id
GROUP BY u.email, s.name, s.id;
```

### 2. Check GCS Bucket

Using Google Cloud Console:
1. Go to: https://console.cloud.google.com/storage/browser/startup-sherlock-documents
2. Navigate to `documents/` folder
3. You'll see folders organized by user ID
4. Click on any file → Details → Custom Metadata
5. You'll see `userId` and `startupId`

### 3. Via API (Logged In)

```bash
# Get your startups (only returns YOUR data)
curl http://localhost:5000/api/startups \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Security Enforcement

### Application Level (Primary)
Every API endpoint:
1. **Authenticate**: Verify JWT token
2. **Extract User**: `req.user.id` from token
3. **Filter Queries**: Only fetch data where `user_id = req.user.id`
4. **Verify Ownership**: Check ownership before updates/deletes

### Database Level (Secondary)
1. **Foreign Keys**: Enforce relationships
2. **NOT NULL**: Ensure `user_id` is always set
3. **Unique Constraints**: Prevent duplicates

### Example API Security:
```typescript
// GET /api/startups - Only returns user's startups
const userStartups = await storage.getStartupsByUser(req.user!.id);

// GET /api/startups/:id - Verify ownership
if (startup.userId !== req.user!.id) {
  return res.status(403).json({ error: "Access denied" });
}
```

## What This Means for Users

### As a User, You:
- ✅ Only see YOUR startups
- ✅ Only see YOUR documents
- ✅ Only see YOUR analyses
- ✅ Cannot access other users' data
- ✅ Can share your email for support (we can find your data by email)

### As an Admin, You Can:
- View all users: `SELECT * FROM users;`
- See user's data: Use queries in `scripts/view-user-data.sql`
- Trace file ownership: Check GCS metadata
- Audit access: All queries filter by `user_id`

## Troubleshooting

### "I can't see my data"
1. Check you're logged in (JWT token is valid)
2. Check `user_id` in database: `SELECT user_id FROM startups WHERE id = 'startup-id';`
3. Check Firebase UID matches: `SELECT firebase_uid FROM users WHERE id = 'user-id';`

### "Data appears to be shared"
1. This should NEVER happen due to API-level filtering
2. Check server logs for authentication errors
3. Verify JWT token is being sent: Check browser Network tab

### "Old data has NULL user_id"
Run this migration to assign orphaned data:
```sql
-- Find startups without user_id
SELECT * FROM startups WHERE user_id IS NULL;

-- If needed, assign to a specific user (use your user ID)
UPDATE startups 
SET user_id = 'your-user-id-here' 
WHERE user_id IS NULL;
```

## Testing Data Segregation

### Manual Test:
1. Sign up as User A (`userA@example.com`)
2. Upload documents and analyze startup "TechCo"
3. Sign out
4. Sign up as User B (`userB@example.com`)
5. Upload documents and analyze startup "BioStart"
6. Verify:
   - User A only sees "TechCo"
   - User B only sees "BioStart"
   - Database has separate rows with different `user_id`
   - GCS has separate folders: `documents/userA-id/...` and `documents/userB-id/...`

### Automated Test:
```bash
# Get auth token for User A
TOKEN_A="..."

# Get auth token for User B
TOKEN_B="..."

# User A's data
curl http://localhost:5000/api/startups -H "Authorization: Bearer $TOKEN_A"
# Should only return User A's startups

# User B's data
curl http://localhost:5000/api/startups -H "Authorization: Bearer $TOKEN_B"
# Should only return User B's startups
```

## Summary

✅ **Database**: Every startup has `user_id`
✅ **GCS**: Files organized by `{userId}/{startupId}/`
✅ **API**: All endpoints filter by authenticated user
✅ **Verification**: SQL queries + GCS metadata show clear ownership
✅ **Isolation**: Users cannot see each other's data

