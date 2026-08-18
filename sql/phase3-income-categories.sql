-- Income Categories as a managed table (add / edit / delete)
-- Run after sql/phase3-categories.sql
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS income_categories (
    income_category_id BIGSERIAL PRIMARY KEY,
    category_code VARCHAR(40) UNIQUE NOT NULL,
    category_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO income_categories (category_code, category_name, description)
VALUES
    (
        'donation',
        'Donations',
        'Money given freely to the parish, including general, special, thanksgiving, and ministry support.'
    ),
    (
        'collection',
        'Collections / Offerings',
        'Offerings collected during masses and parish services, including regular, Sunday, and special collections.'
    ),
    (
        'church_service',
        'Church Services',
        'Income from sacramental and parish services. Individual services are configurable by the Administrator.'
    ),
    (
        'other_income',
        'Other Income',
        'Receipts that are not donations, collections, or church services, such as fundraising.'
    )
ON CONFLICT (category_code) DO NOTHING;

ALTER TABLE income_services DROP CONSTRAINT IF EXISTS income_services_category_check;

ALTER TABLE income_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read income categories" ON income_categories;
CREATE POLICY "Authenticated read income categories"
    ON income_categories FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins manage income categories" ON income_categories;
CREATE POLICY "Admins manage income categories"
    ON income_categories FOR ALL TO authenticated
    USING (public.is_administrator())
    WITH CHECK (public.is_administrator());

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.income_categories TO authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
