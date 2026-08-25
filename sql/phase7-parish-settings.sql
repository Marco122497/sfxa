-- Phase 7 — Parish settings (report signatory)
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS parish_settings (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    parish_priest_name VARCHAR(150) NOT NULL DEFAULT 'Parish Priest',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO parish_settings (id, parish_priest_name)
VALUES (1, 'Parish Priest')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE parish_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read parish settings" ON parish_settings;
CREATE POLICY "Authenticated read parish settings"
    ON parish_settings FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Admins manage parish settings" ON parish_settings;
CREATE POLICY "Admins manage parish settings"
    ON parish_settings FOR ALL
    TO authenticated
    USING (public.is_administrator())
    WITH CHECK (public.is_administrator());

GRANT SELECT, INSERT, UPDATE ON TABLE public.parish_settings TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
