-- Phase 4 — Treasurer: Receive Funds and Expenses
-- Run after sql/phase3-categories.sql
-- Safe to re-run.
--
-- Receive Funds: collections, donations, church services, other income
--   (Treasurer selects income services created in phase 3)
-- Expenses: cash outflow
--   (Treasurer selects expense categories created in phase 3)

CREATE TABLE IF NOT EXISTS donations (
    donation_id BIGSERIAL PRIMARY KEY,
    donor_name VARCHAR(150),
    category_id BIGINT REFERENCES donation_categories(category_id),
    amount NUMERIC(12, 2) NOT NULL,
    donation_date DATE NOT NULL,
    remarks TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
    expense_id BIGSERIAL PRIMARY KEY,
    expense_category_id BIGINT REFERENCES expense_categories(expense_category_id),
    description TEXT,
    amount NUMERIC(12, 2) NOT NULL,
    expense_date DATE NOT NULL,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE expenses
    ADD COLUMN IF NOT EXISTS receipt_url TEXT,
    ADD COLUMN IF NOT EXISTS expense_subcategory_id BIGINT
        REFERENCES expense_subcategories(subcategory_id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS chapel_id BIGINT REFERENCES chapels(chapel_id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS disbursement_status VARCHAR(20) DEFAULT 'released';

ALTER TABLE donations
    ADD COLUMN IF NOT EXISTS chapel_id BIGINT REFERENCES chapels(chapel_id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS donor_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS payment_method VARCHAR(40),
    ADD COLUMN IF NOT EXISTS receipt_url TEXT,
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'received';

CREATE INDEX IF NOT EXISTS expenses_subcategory_idx
    ON expenses (expense_subcategory_id);

ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can read donations" ON donations;
CREATE POLICY "Staff can read donations"
    ON donations FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Staff can read expenses" ON expenses;
CREATE POLICY "Staff can read expenses"
    ON expenses FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Treasurer manage donations" ON donations;
CREATE POLICY "Treasurer manage donations"
    ON donations FOR ALL TO authenticated
    USING (public.is_treasurer_or_admin())
    WITH CHECK (public.is_treasurer_or_admin());

DROP POLICY IF EXISTS "Treasurer manage expenses" ON expenses;
CREATE POLICY "Treasurer manage expenses"
    ON expenses FOR ALL TO authenticated
    USING (public.is_treasurer_or_admin())
    WITH CHECK (public.is_treasurer_or_admin());

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'receipts',
    'receipts',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Receipts are publicly accessible" ON storage.objects;
CREATE POLICY "Receipts are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'receipts');

DROP POLICY IF EXISTS "Treasurer can upload receipts" ON storage.objects;
CREATE POLICY "Treasurer can upload receipts"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'receipts'
        AND public.is_treasurer_or_admin()
    );

DROP POLICY IF EXISTS "Treasurer can update receipts" ON storage.objects;
CREATE POLICY "Treasurer can update receipts"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'receipts'
        AND public.is_treasurer_or_admin()
    );

DROP POLICY IF EXISTS "Treasurer can delete receipts" ON storage.objects;
CREATE POLICY "Treasurer can delete receipts"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'receipts'
        AND public.is_treasurer_or_admin()
    );

NOTIFY pgrst, 'reload schema';
