--
-- PHASE 3.4B.1 — PRODUCTION-SAFE RLS POLICY SET
--

-- Helper function to get the current user's role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql;

-- Drop all previous, unsafe policies
DROP POLICY IF EXISTS "subjects_anon_select" ON public.subjects;
DROP POLICY IF EXISTS "authenticated_can_read_subjects" ON public.subjects;
DROP POLICY IF EXISTS "subjects_auth_write" ON public.subjects;
DROP POLICY IF EXISTS "subjects_select" ON public.subjects;
DROP POLICY IF EXISTS "subjects_insert" ON public.subjects;
DROP POLICY IF EXISTS "subjects_update" ON public.subjects;
DROP POLICY IF EXISTS "subjects_delete" ON public.subjects;

DROP POLICY IF EXISTS "units_anon_select" ON public.units;
DROP POLICY IF EXISTS "units_auth_select" ON public.units;
DROP POLICY IF EXISTS "units_auth_write" ON public.units;
DROP POLICY IF EXISTS "units_select" ON public.units;
DROP POLICY IF EXISTS "units_insert" ON public.units;
DROP POLICY IF EXISTS "units_update" ON public.units;
DROP POLICY IF EXISTS "units_delete" ON public.units;

DROP POLICY IF EXISTS "topics_anon_select" ON public.topics;
DROP POLICY IF EXISTS "topics_auth_select" ON public.topics;
DROP POLICY IF EXISTS "topics_auth_write" ON public.topics;
DROP POLICY IF EXISTS "topics_select" ON public.topics;
DROP POLICY IF EXISTS "topics_insert" ON public.topics;
DROP POLICY IF EXISTS "topics_update" ON public.topics;
DROP POLICY IF EXISTS "topics_delete" ON public.topics;

DROP POLICY IF EXISTS "content_items_anon_select" ON public.content_items;
DROP POLICY IF EXISTS "content_items_auth_select" ON public.content_items;
DROP POLICY IF EXISTS "content_items_auth_write" ON public.content_items;
DROP POLICY IF EXISTS "content_items_select" ON public.content_items;
DROP POLICY IF EXISTS "content_items_insert" ON public.content_items;
DROP POLICY IF EXISTS "content_items_update" ON public.content_items;
DROP POLICY IF EXISTS "content_items_delete" ON public.content_items;


-- =================================================================
-- Table: subjects
-- =================================================================
-- 1. Students can read all subjects.
CREATE POLICY "Allow read access to all authenticated users" ON public.subjects
  FOR SELECT TO authenticated USING (true);

-- 2. Admins and SubAdmins can insert subjects.
CREATE POLICY "Allow insert for admins and subadmins" ON public.subjects
  FOR INSERT TO authenticated WITH CHECK (
    get_my_role() IN ('admin', 'subadmin') AND
    created_by = auth.uid()::text
  );

-- 3. Admins can update any subject. SubAdmins can only update subjects they created.
CREATE POLICY "Allow update for owners and admins" ON public.subjects
  FOR UPDATE TO authenticated USING (
    get_my_role() = 'admin' OR
    created_by = auth.uid()::text
  ) WITH CHECK (
    get_my_role() = 'admin' OR
    created_by = auth.uid()::text
  );

-- 4. Admins can delete any subject. SubAdmins can only delete subjects they created.
CREATE POLICY "Allow delete for owners and admins" ON public.subjects
  FOR DELETE TO authenticated USING (
    get_my_role() = 'admin' OR
    created_by = auth.uid()::text
  );


-- =================================================================
-- Table: units (Ownership derived from subjects)
-- =================================================================
-- 1. Students can read all units.
CREATE POLICY "Allow read access to all authenticated users" ON public.units
  FOR SELECT TO authenticated USING (true);

-- 2. Admins and SubAdmins can insert units for subjects they own.
CREATE POLICY "Allow insert for admins and subadmins" ON public.units
  FOR INSERT TO authenticated WITH CHECK (
    get_my_role() = 'admin' OR
    (get_my_role() = 'subadmin' AND subject_id IN (
      SELECT id FROM public.subjects WHERE created_by = auth.uid()::text
    ))
  );

-- 3. Admins can update any unit. SubAdmins can only update units in subjects they own.
CREATE POLICY "Allow update for owners and admins" ON public.units
  FOR UPDATE TO authenticated USING (
    get_my_role() = 'admin' OR
    (get_my_role() = 'subadmin' AND subject_id IN (
      SELECT id FROM public.subjects WHERE created_by = auth.uid()::text
    ))
  ) WITH CHECK (
    get_my_role() = 'admin' OR
    (get_my_role() = 'subadmin' AND subject_id IN (
      SELECT id FROM public.subjects WHERE created_by = auth.uid()::text
    ))
  );

-- 4. Admins can delete any unit. SubAdmins can only delete units in subjects they own.
CREATE POLICY "Allow delete for owners and admins" ON public.units
  FOR DELETE TO authenticated USING (
    get_my_role() = 'admin' OR
    (get_my_role() = 'subadmin' AND subject_id IN (
      SELECT id FROM public.subjects WHERE created_by = auth.uid()::text
    ))
  );


-- =================================================================
-- Table: topics (Ownership derived from subjects)
-- =================================================================
-- 1. Students can read all topics.
CREATE POLICY "Allow read access to all authenticated users" ON public.topics
  FOR SELECT TO authenticated USING (true);

-- 2. Admins and SubAdmins can insert topics for subjects they own.
CREATE POLICY "Allow insert for admins and subadmins" ON public.topics
  FOR INSERT TO authenticated WITH CHECK (
    get_my_role() = 'admin' OR
    (get_my_role() = 'subadmin' AND subject_id IN (
      SELECT id FROM public.subjects WHERE created_by = auth.uid()::text
    ))
  );

-- 3. Admins can update any topic. SubAdmins can only update topics in subjects they own.
CREATE POLICY "Allow update for owners and admins" ON public.topics
  FOR UPDATE TO authenticated USING (
    get_my_role() = 'admin' OR
    (get_my_role() = 'subadmin' AND subject_id IN (
      SELECT id FROM public.subjects WHERE created_by = auth.uid()::text
    ))
  ) WITH CHECK (
    get_my_role() = 'admin' OR
    (get_my_role() = 'subadmin' AND subject_id IN (
      SELECT id FROM public.subjects WHERE created_by = auth.uid()::text
    ))
  );

-- 4. Admins can delete any topic. SubAdmins can only delete topics in subjects they own.
CREATE POLICY "Allow delete for owners and admins" ON public.topics
  FOR DELETE TO authenticated USING (
    get_my_role() = 'admin' OR
    (get_my_role() = 'subadmin' AND subject_id IN (
      SELECT id FROM public.subjects WHERE created_by = auth.uid()::text
    ))
  );


-- =================================================================
-- Table: content_items
-- =================================================================
-- 1. Students can read all content_items.
CREATE POLICY "Allow read access to all authenticated users" ON public.content_items
  FOR SELECT TO authenticated USING (true);

-- 2. Admins and SubAdmins can insert content_items.
CREATE POLICY "Allow insert for admins and subadmins" ON public.content_items
  FOR INSERT TO authenticated WITH CHECK (
    get_my_role() IN ('admin', 'subadmin') AND
    created_by = auth.uid()::text AND
    (get_my_role() = 'admin' OR subject_id IN (
        SELECT id FROM public.subjects WHERE created_by = auth.uid()::text
    ))
  );

-- 3. Admins can update any content_item. SubAdmins can only update items they created.
CREATE POLICY "Allow update for owners and admins" ON public.content_items
  FOR UPDATE TO authenticated USING (
    get_my_role() = 'admin' OR
    created_by = auth.uid()::text
  ) WITH CHECK (
    get_my_role() = 'admin' OR
    (
        created_by = auth.uid()::text AND
        subject_id IN (SELECT id FROM public.subjects WHERE created_by = auth.uid()::text)
    )
  );

-- 4. Admins can delete any content_item. SubAdmins can only delete items they created.
CREATE POLICY "Allow delete for owners and admins" ON public.content_items
  FOR DELETE TO authenticated USING (
    get_my_role() = 'admin' OR
    created_by = auth.uid()::text
  );
