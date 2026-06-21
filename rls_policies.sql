-- Helper function to check role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql;

-- Remove existing policies for subjects, units, topics, and content_items
DROP POLICY IF EXISTS "subjects_anon_select" ON public.subjects;
DROP POLICY IF EXISTS "authenticated_can_read_subjects" ON public.subjects;
DROP POLICY IF EXISTS "subjects_auth_write" ON public.subjects;

DROP POLICY IF EXISTS "units_anon_select" ON public.units;
DROP POLICY IF EXISTS "units_auth_select" ON public.units;
DROP POLICY IF EXISTS "units_auth_write" ON public.units;

DROP POLICY IF EXISTS "topics_anon_select" ON public.topics;
DROP POLICY IF EXISTS "topics_auth_select" ON public.topics;
DROP POLICY IF EXISTS "topics_auth_write" ON public.topics;

DROP POLICY IF EXISTS "content_items_anon_select" ON public.content_items;
DROP POLICY IF EXISTS "content_items_auth_select" ON public.content_items;
DROP POLICY IF EXISTS "content_items_auth_write" ON public.content_items;


-- subjects POLICIES
-- Read access for all authenticated users
CREATE POLICY "subjects_select" ON public.subjects FOR SELECT TO authenticated USING (true);
-- Write access for admins and subadmins
CREATE POLICY "subjects_insert" ON public.subjects FOR INSERT WITH CHECK (get_my_role() IN ('admin', 'subadmin'));
CREATE POLICY "subjects_update" ON public.subjects FOR UPDATE USING (get_my_role() IN ('admin', 'subadmin'));
CREATE POLICY "subjects_delete" ON public.subjects FOR DELETE USING (get_my_role() IN ('admin', 'subadmin'));

-- units POLICIES
-- Read access for all authenticated users
CREATE POLICY "units_select" ON public.units FOR SELECT TO authenticated USING (true);
-- Write access for admins and subadmins
CREATE POLICY "units_insert" ON public.units FOR INSERT WITH CHECK (get_my_role() IN ('admin', 'subadmin'));
CREATE POLICY "units_update" ON public.units FOR UPDATE USING (get_my_role() IN ('admin', 'subadmin'));
CREATE POLICY "units_delete" ON public.units FOR DELETE USING (get_my_role() IN ('admin', 'subadmin'));

-- topics POLICIES
-- Read access for all authenticated users
CREATE POLICY "topics_select" ON public.topics FOR SELECT TO authenticated USING (true);
-- Write access for admins and subadmins
CREATE POLICY "topics_insert" ON public.topics FOR INSERT WITH CHECK (get_my_role() IN ('admin', 'subadmin'));
CREATE POLICY "topics_update" ON public.topics FOR UPDATE USING (get_my_role() IN ('admin', 'subadmin'));
CREATE POLICY "topics_delete" ON public.topics FOR DELETE USING (get_my_role() IN ('admin', 'subadmin'));

-- content_items POLICIES
-- Read access for all authenticated users
CREATE POLICY "content_items_select" ON public.content_items FOR SELECT TO authenticated USING (true);
-- Write access for admins and subadmins
CREATE POLICY "content_items_insert" ON public.content_items FOR INSERT WITH CHECK (get_my_role() IN ('admin', 'subadmin'));
CREATE POLICY "content_items_update" ON public.content_items FOR UPDATE USING (get_my_role() IN ('admin', 'subadmin'));
CREATE POLICY "content_items_delete" ON public.content_items FOR DELETE USING (get_my_role() IN ('admin', 'subadmin'));
