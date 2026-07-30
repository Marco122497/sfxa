-- Phase 9 — Expense specific categories under general categories
-- General: expense_categories (also synced to budget_categories for allocations)
-- Specific: expense_subcategories (e.g. Water Bill under Utilities)

CREATE TABLE IF NOT EXISTS expense_subcategories (
    subcategory_id BIGSERIAL PRIMARY KEY,
    expense_category_id BIGINT NOT NULL
        REFERENCES expense_categories(expense_category_id) ON DELETE CASCADE,
    subcategory_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (expense_category_id, subcategory_name)
);

ALTER TABLE expenses
    ADD COLUMN IF NOT EXISTS expense_subcategory_id BIGINT
        REFERENCES expense_subcategories(subcategory_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS expenses_subcategory_idx
    ON expenses (expense_subcategory_id);

ALTER TABLE expense_subcategories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can read expense subcategories" ON expense_subcategories;
CREATE POLICY "Staff can read expense subcategories"
    ON expense_subcategories FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Treasurer manage expense subcategories" ON expense_subcategories;
CREATE POLICY "Treasurer manage expense subcategories"
    ON expense_subcategories FOR ALL
    TO authenticated
    USING (public.is_treasurer_or_admin())
    WITH CHECK (public.is_treasurer_or_admin());
