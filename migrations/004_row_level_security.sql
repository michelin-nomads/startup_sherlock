-- Migration: Implement Row-Level Security (RLS) for Data Isolation
-- This adds TRUE database-level security that enforces data segregation
-- even if the application code has bugs

-- ============================================================================
-- IMPORTANT: Row-Level Security Policies
-- ============================================================================
-- RLS ensures that even with direct database access or buggy application code,
-- users can ONLY see and modify their own data. This is TRUE database-level security.

-- ============================================================================
-- 1. ENABLE ROW-LEVEL SECURITY ON STARTUPS TABLE
-- ============================================================================

ALTER TABLE startups ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only SELECT their own startups
CREATE POLICY select_own_startups ON startups
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true)::VARCHAR);

-- Policy: Users can only INSERT startups linked to themselves
CREATE POLICY insert_own_startups ON startups
  FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id', true)::VARCHAR);

-- Policy: Users can only UPDATE their own startups
CREATE POLICY update_own_startups ON startups
  FOR UPDATE
  USING (user_id = current_setting('app.current_user_id', true)::VARCHAR)
  WITH CHECK (user_id = current_setting('app.current_user_id', true)::VARCHAR);

-- Policy: Users can only DELETE their own startups
CREATE POLICY delete_own_startups ON startups
  FOR DELETE
  USING (user_id = current_setting('app.current_user_id', true)::VARCHAR);

-- ============================================================================
-- 2. ENABLE ROW-LEVEL SECURITY ON DOCUMENTS TABLE
-- ============================================================================

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only SELECT documents for their own startups
CREATE POLICY select_own_documents ON documents
  FOR SELECT
  USING (
    startup_id IN (
      SELECT id FROM startups 
      WHERE user_id = current_setting('app.current_user_id', true)::VARCHAR
    )
  );

-- Policy: Users can only INSERT documents for their own startups
CREATE POLICY insert_own_documents ON documents
  FOR INSERT
  WITH CHECK (
    startup_id IN (
      SELECT id FROM startups 
      WHERE user_id = current_setting('app.current_user_id', true)::VARCHAR
    )
  );

-- Policy: Users can only UPDATE documents for their own startups
CREATE POLICY update_own_documents ON documents
  FOR UPDATE
  USING (
    startup_id IN (
      SELECT id FROM startups 
      WHERE user_id = current_setting('app.current_user_id', true)::VARCHAR
    )
  );

-- Policy: Users can only DELETE documents for their own startups
CREATE POLICY delete_own_documents ON documents
  FOR DELETE
  USING (
    startup_id IN (
      SELECT id FROM startups 
      WHERE user_id = current_setting('app.current_user_id', true)::VARCHAR
    )
  );

-- ============================================================================
-- 3. ENABLE ROW-LEVEL SECURITY ON ANALYSES TABLE
-- ============================================================================

ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only SELECT analyses for their own startups
CREATE POLICY select_own_analyses ON analyses
  FOR SELECT
  USING (
    startup_id IN (
      SELECT id FROM startups 
      WHERE user_id = current_setting('app.current_user_id', true)::VARCHAR
    )
  );

-- Policy: Users can only INSERT analyses for their own startups
CREATE POLICY insert_own_analyses ON analyses
  FOR INSERT
  WITH CHECK (
    startup_id IN (
      SELECT id FROM startups 
      WHERE user_id = current_setting('app.current_user_id', true)::VARCHAR
    )
  );

-- Policy: Users can only UPDATE analyses for their own startups
CREATE POLICY update_own_analyses ON analyses
  FOR UPDATE
  USING (
    startup_id IN (
      SELECT id FROM startups 
      WHERE user_id = current_setting('app.current_user_id', true)::VARCHAR
    )
  );

-- Policy: Users can only DELETE analyses for their own startups
CREATE POLICY delete_own_analyses ON analyses
  FOR DELETE
  USING (
    startup_id IN (
      SELECT id FROM startups 
      WHERE user_id = current_setting('app.current_user_id', true)::VARCHAR
    )
  );

-- ============================================================================
-- 4. ENABLE ROW-LEVEL SECURITY ON RISK_FLAGS TABLE
-- ============================================================================

ALTER TABLE risk_flags ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access risk flags for their own startups
CREATE POLICY access_own_risk_flags ON risk_flags
  FOR ALL
  USING (
    startup_id IN (
      SELECT id FROM startups 
      WHERE user_id = current_setting('app.current_user_id', true)::VARCHAR
    )
  );

-- ============================================================================
-- 5. ADMIN BYPASS POLICY (Optional - for admin users)
-- ============================================================================
-- Uncomment these if you want admin users to bypass RLS

-- CREATE POLICY admin_all_startups ON startups
--   FOR ALL
--   USING (
--     EXISTS (
--       SELECT 1 FROM users 
--       WHERE id = current_setting('app.current_user_id', true)::VARCHAR 
--       AND role = 'admin'
--     )
--   );

-- ============================================================================
-- 6. VERIFICATION
-- ============================================================================

-- Check RLS status
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'startups' AND rowsecurity = true
  ) THEN
    RAISE NOTICE '✅ RLS enabled on startups table';
  ELSE
    RAISE WARNING '⚠️  RLS not enabled on startups table';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'documents' AND rowsecurity = true
  ) THEN
    RAISE NOTICE '✅ RLS enabled on documents table';
  ELSE
    RAISE WARNING '⚠️  RLS not enabled on documents table';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'analyses' AND rowsecurity = true
  ) THEN
    RAISE NOTICE '✅ RLS enabled on analyses table';
  ELSE
    RAISE WARNING '⚠️  RLS not enabled on analyses table';
  END IF;
END $$;

-- List all policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('startups', 'documents', 'analyses', 'risk_flags')
ORDER BY tablename, policyname;

