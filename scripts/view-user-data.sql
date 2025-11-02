-- View Data by User - Shows clear user ownership
-- Run this in Cloud SQL Studio or via psql

-- 1. Show all users and their startup count
SELECT 
  u.id as user_id,
  u.email,
  u.display_name,
  COUNT(DISTINCT s.id) as total_startups,
  COUNT(DISTINCT d.id) as total_documents,
  MAX(s.created_at) as last_startup_created
FROM users u
LEFT JOIN startups s ON s.user_id = u.id
LEFT JOIN documents d ON d.startup_id = s.id
GROUP BY u.id, u.email, u.display_name
ORDER BY last_startup_created DESC NULLS LAST;

-- 2. Show startups with their owner
SELECT 
  s.id as startup_id,
  s.name as startup_name,
  s.user_id,
  u.email as owner_email,
  u.display_name as owner_name,
  s.created_at,
  COUNT(d.id) as document_count
FROM startups s
INNER JOIN users u ON s.user_id = u.id
LEFT JOIN documents d ON d.startup_id = s.id
GROUP BY s.id, s.name, s.user_id, u.email, u.display_name, s.created_at
ORDER BY s.created_at DESC;

-- 3. Show documents with owner and startup info
SELECT 
  d.id as document_id,
  d.file_name,
  d.gcs_url,
  s.name as startup_name,
  s.user_id,
  u.email as owner_email,
  d.created_at
FROM documents d
INNER JOIN startups s ON d.startup_id = s.id
INNER JOIN users u ON s.user_id = u.id
ORDER BY d.created_at DESC;

-- 4. Show user isolation - Count resources per user
SELECT 
  u.email,
  u.display_name,
  (SELECT COUNT(*) FROM startups WHERE user_id = u.id) as my_startups,
  (SELECT COUNT(*) FROM documents d 
   INNER JOIN startups s ON d.startup_id = s.id 
   WHERE s.user_id = u.id) as my_documents,
  (SELECT COUNT(*) FROM analyses a 
   INNER JOIN startups s ON a.startup_id = s.id 
   WHERE s.user_id = u.id) as my_analyses
FROM users u
ORDER BY u.created_at DESC;

-- 5. Quick check: Is there any orphaned data?
SELECT 
  'Startups without user' as issue_type,
  COUNT(*) as count
FROM startups
WHERE user_id IS NULL

UNION ALL

SELECT 
  'Startups with invalid user',
  COUNT(*)
FROM startups s
LEFT JOIN users u ON s.user_id = u.id
WHERE s.user_id IS NOT NULL AND u.id IS NULL;

