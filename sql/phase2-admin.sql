-- Phase 2 — Administrator: Chapel Access, User helpers, Parish Information
-- Run after db.sql
-- Safe to re-run.

ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS status BOOLEAN DEFAULT TRUE;

ALTER TABLE announcements
    ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION set_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS announcements_updated_at ON announcements;
CREATE TRIGGER announcements_updated_at
    BEFORE UPDATE ON announcements
    FOR EACH ROW
    EXECUTE FUNCTION set_announcements_updated_at();

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_administrator()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role = 'Administrator'
      AND COALESCE(status, TRUE) = TRUE
  );
$$;

CREATE OR REPLACE FUNCTION public.is_treasurer_or_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND COALESCE(status, TRUE) = TRUE
      AND role IN ('Treasurer', 'Administrator')
  );
$$;

-- Chapel Access: add/manage chapels, assign Treasurer, assign Parish Members
CREATE TABLE IF NOT EXISTS chapels (
    chapel_id BIGSERIAL PRIMARY KEY,
    chapel_name VARCHAR(150) NOT NULL,
    location TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    treasurer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chapel_members (
    chapel_id BIGINT NOT NULL REFERENCES chapels(chapel_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (chapel_id, user_id)
);

ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS chapel_id BIGINT REFERENCES chapels(chapel_id) ON DELETE SET NULL;

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapels ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapel_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read announcements" ON announcements;
CREATE POLICY "Authenticated can read announcements"
    ON announcements FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Administrators manage announcements" ON announcements;
CREATE POLICY "Administrators manage announcements"
    ON announcements FOR ALL
    TO authenticated
    USING (public.is_administrator())
    WITH CHECK (public.is_administrator());

DROP POLICY IF EXISTS "Administrators can view all profiles" ON profiles;
CREATE POLICY "Administrators can view all profiles"
    ON profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id OR public.is_administrator());

DROP POLICY IF EXISTS "Administrators can update all profiles" ON profiles;
CREATE POLICY "Administrators can update all profiles"
    ON profiles FOR UPDATE
    TO authenticated
    USING (public.is_administrator())
    WITH CHECK (public.is_administrator());

DROP POLICY IF EXISTS "Staff read chapels" ON chapels;
CREATE POLICY "Staff read chapels"
    ON chapels FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins manage chapels" ON chapels;
CREATE POLICY "Admins manage chapels"
    ON chapels FOR ALL TO authenticated
    USING (public.is_administrator())
    WITH CHECK (public.is_administrator());

DROP POLICY IF EXISTS "Staff read chapel members" ON chapel_members;
CREATE POLICY "Staff read chapel members"
    ON chapel_members FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins manage chapel members" ON chapel_members;
CREATE POLICY "Admins manage chapel members"
    ON chapel_members FOR ALL TO authenticated
    USING (public.is_administrator())
    WITH CHECK (public.is_administrator());

DROP POLICY IF EXISTS "Administrators can view all login history" ON login_history;
CREATE POLICY "Administrators can view all login history"
    ON login_history FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR public.is_administrator());

DROP POLICY IF EXISTS "Administrators can view all audit logs" ON audit_logs;
CREATE POLICY "Administrators can view all audit logs"
    ON audit_logs FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR public.is_administrator());

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.chapels TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.chapel_members TO authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_administrator() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_treasurer_or_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
