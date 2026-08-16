-- Phase 3 — Categories (central configuration)
-- Run after sql/phase2-admin.sql
-- Safe to re-run.
--
-- Administrator creates/manages categories.
-- Treasurer selects them when receiving and releasing funds.
-- Budget uses the same expense categories.
--
-- Income Categories (fixed classifications):
--   donation | collection | church_service | other_income
-- Income Services (configurable types under those classifications)
-- Expense Categories (general) + expense_subcategories (specific types)

CREATE TABLE IF NOT EXISTS donation_categories (
    category_id BIGSERIAL PRIMARY KEY,
    category_name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS income_services (
    service_id BIGSERIAL PRIMARY KEY,
    service_name VARCHAR(150) UNIQUE NOT NULL,
    category VARCHAR(40) NOT NULL
        CHECK (category IN ('church_service', 'collection', 'donation', 'other_income')),
    is_active BOOLEAN DEFAULT TRUE,
    donation_category_id BIGINT REFERENCES donation_categories(category_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expense_categories (
    expense_category_id BIGSERIAL PRIMARY KEY,
    category_name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS expense_subcategories (
    subcategory_id BIGSERIAL PRIMARY KEY,
    expense_category_id BIGINT NOT NULL
        REFERENCES expense_categories(expense_category_id) ON DELETE CASCADE,
    subcategory_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (expense_category_id, subcategory_name)
);

CREATE TABLE IF NOT EXISTS budget_categories (
    budget_category_id BIGSERIAL PRIMARY KEY,
    category_name VARCHAR(100) UNIQUE NOT NULL
);

-- Income services used when the Treasurer records cash inflow
INSERT INTO donation_categories (category_name)
VALUES
    ('General Donation'),
    ('Special Donation'),
    ('Thanksgiving'),
    ('Ministry Support'),
    ('Online Donation'),
    ('Chapel Donation'),
    ('Regular Collection'),
    ('Sunday Offering'),
    ('Special Collection'),
    ('Chapel Collection'),
    ('Other Collection'),
    ('Baptism'),
    ('Confirmation'),
    ('Wedding'),
    ('Funeral'),
    ('Mass Intention'),
    ('Blessing'),
    ('Other Church Service'),
    ('Fundraising'),
    ('Other Income'),
    ('Facility Rental'),
    ('Sale of Religious Items')
ON CONFLICT (category_name) DO NOTHING;

INSERT INTO income_services (service_name, category, donation_category_id)
SELECT v.service_name, v.category, c.category_id
FROM (VALUES
    ('General Donation', 'donation'),
    ('Special Donation', 'donation'),
    ('Thanksgiving', 'donation'),
    ('Ministry Support', 'donation'),
    ('Online Donation', 'donation'),
    ('Chapel Donation', 'donation'),
    ('Regular Collection', 'collection'),
    ('Sunday Offering', 'collection'),
    ('Special Collection', 'collection'),
    ('Chapel Collection', 'collection'),
    ('Other Collection', 'collection'),
    ('Baptism', 'church_service'),
    ('Confirmation', 'church_service'),
    ('Wedding', 'church_service'),
    ('Funeral', 'church_service'),
    ('Mass Intention', 'church_service'),
    ('Blessing', 'church_service'),
    ('Other Church Service', 'church_service'),
    ('Fundraising', 'other_income'),
    ('Other Income', 'other_income'),
    ('Facility Rental', 'other_income'),
    ('Sale of Religious Items', 'other_income')
) AS v(service_name, category)
LEFT JOIN donation_categories c ON c.category_name = v.service_name
ON CONFLICT (service_name) DO NOTHING;

-- Keep older collection names classified if they already exist
INSERT INTO income_services (service_name, category, donation_category_id)
SELECT c.category_name, 'collection', c.category_id
FROM donation_categories c
WHERE (
    c.category_name ILIKE '%collection%'
    OR c.category_name ILIKE '%offering%'
)
AND NOT EXISTS (
    SELECT 1 FROM income_services s WHERE s.service_name = c.category_name
);

-- Expense categories used when the Treasurer records expenses and budgets
INSERT INTO expense_categories (category_name)
VALUES
    ('Utilities'),
    ('Maintenance & Repairs'),
    ('Church Activities'),
    ('Supplies'),
    ('Other Expenses')
ON CONFLICT (category_name) DO NOTHING;

INSERT INTO expense_subcategories (expense_category_id, subcategory_name)
SELECT ec.expense_category_id, v.subcategory_name
FROM (VALUES
    ('Utilities', 'Electricity'),
    ('Utilities', 'Water'),
    ('Utilities', 'Internet'),
    ('Maintenance & Repairs', 'Building Repair'),
    ('Maintenance & Repairs', 'Equipment Repair'),
    ('Church Activities', 'Parish Activity'),
    ('Church Activities', 'Catechesis'),
    ('Supplies', 'Office Supplies'),
    ('Supplies', 'Liturgical Supplies'),
    ('Other Expenses', 'Miscellaneous')
) AS v(category_name, subcategory_name)
JOIN expense_categories ec ON ec.category_name = v.category_name
ON CONFLICT (expense_category_id, subcategory_name) DO NOTHING;

INSERT INTO budget_categories (category_name)
SELECT category_name FROM expense_categories
ON CONFLICT (category_name) DO NOTHING;

ALTER TABLE expenses
    ADD COLUMN IF NOT EXISTS expense_subcategory_id BIGINT
        REFERENCES expense_subcategories(subcategory_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS expenses_subcategory_idx
    ON expenses (expense_subcategory_id);

CREATE OR REPLACE FUNCTION public.income_kind_for_category(
    p_category_id bigint,
    p_category_name text
)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT s.category
      FROM income_services s
      WHERE s.donation_category_id = p_category_id
         OR lower(s.service_name) = lower(COALESCE(p_category_name, ''))
      ORDER BY CASE WHEN s.donation_category_id = p_category_id THEN 0 ELSE 1 END
      LIMIT 1
    ),
    CASE
      WHEN COALESCE(p_category_name, '') ILIKE '%collection%'
        OR COALESCE(p_category_name, '') ILIKE '%offering%' THEN 'collection'
      WHEN COALESCE(p_category_name, '') ILIKE ANY (
        ARRAY['%baptism%', '%wedding%', '%funeral%', '%mass intention%', '%blessing%', '%confirmation%']
      ) THEN 'church_service'
      WHEN COALESCE(p_category_name, '') ILIKE ANY (
        ARRAY['%fundraising%', '%rental%', '%other income%', '%other receipt%']
      ) THEN 'other_income'
      ELSE 'donation'
    END
  );
$$;

ALTER TABLE donation_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can read donation categories" ON donation_categories;
CREATE POLICY "Staff can read donation categories"
    ON donation_categories FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated read income services" ON income_services;
CREATE POLICY "Authenticated read income services"
    ON income_services FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Staff can read expense categories" ON expense_categories;
CREATE POLICY "Staff can read expense categories"
    ON expense_categories FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Staff can read expense subcategories" ON expense_subcategories;
CREATE POLICY "Staff can read expense subcategories"
    ON expense_subcategories FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Staff can read budget categories" ON budget_categories;
CREATE POLICY "Staff can read budget categories"
    ON budget_categories FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins manage income services" ON income_services;
CREATE POLICY "Admins manage income services"
    ON income_services FOR ALL TO authenticated
    USING (public.is_administrator())
    WITH CHECK (public.is_administrator());

DROP POLICY IF EXISTS "Treasurer manage donation categories" ON donation_categories;
CREATE POLICY "Treasurer manage donation categories"
    ON donation_categories FOR ALL TO authenticated
    USING (public.is_treasurer_or_admin())
    WITH CHECK (public.is_treasurer_or_admin());

DROP POLICY IF EXISTS "Treasurer manage expense categories" ON expense_categories;
CREATE POLICY "Treasurer manage expense categories"
    ON expense_categories FOR ALL TO authenticated
    USING (public.is_treasurer_or_admin())
    WITH CHECK (public.is_treasurer_or_admin());

DROP POLICY IF EXISTS "Treasurer manage expense subcategories" ON expense_subcategories;
CREATE POLICY "Treasurer manage expense subcategories"
    ON expense_subcategories FOR ALL TO authenticated
    USING (public.is_treasurer_or_admin())
    WITH CHECK (public.is_treasurer_or_admin());

DROP POLICY IF EXISTS "Treasurer manage budget categories" ON budget_categories;
CREATE POLICY "Treasurer manage budget categories"
    ON budget_categories FOR ALL TO authenticated
    USING (public.is_treasurer_or_admin())
    WITH CHECK (public.is_treasurer_or_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.donation_categories TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.income_services TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.expense_categories TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.expense_subcategories TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.budget_categories TO authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.income_kind_for_category(bigint, text) TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
