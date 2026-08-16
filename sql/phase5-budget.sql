-- Phase 5 — Budget (uses the same Expense Categories from phase 3)
-- Run after sql/phase4-treasurer.sql
-- Safe to re-run.
--
-- Budget Category → Expense Category → Actual Expense → Remaining Budget

CREATE TABLE IF NOT EXISTS budget_categories (
    budget_category_id BIGSERIAL PRIMARY KEY,
    category_name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS budgets (
    budget_id BIGSERIAL PRIMARY KEY,
    budget_category_id BIGINT REFERENCES budget_categories(budget_category_id),
    fiscal_year INT NOT NULL,
    allocated_amount NUMERIC(12, 2) NOT NULL,
    remarks TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO budget_categories (category_name)
SELECT category_name FROM expense_categories
ON CONFLICT (category_name) DO NOTHING;

ALTER TABLE budgets
    ADD COLUMN IF NOT EXISTS expense_subcategory_id BIGINT
        REFERENCES expense_subcategories(subcategory_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS budgets_subcategory_idx
    ON budgets (expense_subcategory_id);

CREATE TABLE IF NOT EXISTS budget_history (
    history_id BIGSERIAL PRIMARY KEY,
    budget_id BIGINT REFERENCES budgets(budget_id) ON DELETE SET NULL,
    budget_category_id BIGINT,
    category_name VARCHAR(100),
    fiscal_year INT,
    previous_amount NUMERIC(12, 2),
    new_amount NUMERIC(12, 2),
    action VARCHAR(30) NOT NULL,
    remarks TEXT,
    changed_by UUID REFERENCES profiles(id),
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE budget_history
    ADD COLUMN IF NOT EXISTS subcategory_name VARCHAR(100);

CREATE INDEX IF NOT EXISTS budget_history_changed_at_idx
    ON budget_history (changed_at DESC);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can read budgets" ON budgets;
CREATE POLICY "Staff can read budgets"
    ON budgets FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Staff can read budget categories" ON budget_categories;
CREATE POLICY "Staff can read budget categories"
    ON budget_categories FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Staff can read budget history" ON budget_history;
CREATE POLICY "Staff can read budget history"
    ON budget_history FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Treasurer manage budgets" ON budgets;
CREATE POLICY "Treasurer manage budgets"
    ON budgets FOR ALL TO authenticated
    USING (public.is_treasurer_or_admin())
    WITH CHECK (public.is_treasurer_or_admin());

DROP POLICY IF EXISTS "Treasurer manage budget categories" ON budget_categories;
CREATE POLICY "Treasurer manage budget categories"
    ON budget_categories FOR ALL TO authenticated
    USING (public.is_treasurer_or_admin())
    WITH CHECK (public.is_treasurer_or_admin());

DROP POLICY IF EXISTS "Treasurer manage budget history" ON budget_history;
CREATE POLICY "Treasurer manage budget history"
    ON budget_history FOR INSERT TO authenticated
    WITH CHECK (public.is_treasurer_or_admin());

NOTIFY pgrst, 'reload schema';
