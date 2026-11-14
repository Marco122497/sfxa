-- Church service fees, yearly add/minus, schedule, and assigned priest.
-- Run after sql/phase3-categories.sql. Safe to re-run.

ALTER TABLE income_services
    ADD COLUMN IF NOT EXISTS standard_amount NUMERIC(12,2);

ALTER TABLE donations
    ADD COLUMN IF NOT EXISTS paid_time TIME,
    ADD COLUMN IF NOT EXISTS service_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS priest_name VARCHAR(150);

CREATE TABLE IF NOT EXISTS service_fee_years (
    fee_year_id BIGSERIAL PRIMARY KEY,
    service_id BIGINT NOT NULL REFERENCES income_services(service_id) ON DELETE CASCADE,
    fee_year INTEGER NOT NULL CHECK (fee_year BETWEEN 2000 AND 2100),
    adjustment NUMERIC(12,2) NOT NULL DEFAULT 0,
    UNIQUE (service_id, fee_year)
);

ALTER TABLE service_fee_years ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read service fee years" ON service_fee_years;
CREATE POLICY "Authenticated read service fee years"
    ON service_fee_years FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins manage service fee years" ON service_fee_years;
CREATE POLICY "Admins manage service fee years"
    ON service_fee_years FOR ALL TO authenticated
    USING (public.is_administrator())
    WITH CHECK (public.is_administrator());

GRANT SELECT ON TABLE public.service_fee_years TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.service_fee_years TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.service_fee_years_fee_year_id_seq TO service_role;

NOTIFY pgrst, 'reload schema';
