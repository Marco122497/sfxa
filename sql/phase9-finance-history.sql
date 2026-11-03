-- Phase 9 — Permanent treasurer transaction history
-- Safe to re-run. Rows are insert-only: there is no update or delete policy.

CREATE TABLE IF NOT EXISTS finance_history (
    history_id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    source TEXT NOT NULL,
    or_number TEXT,
    amount NUMERIC(12, 2),
    record_table TEXT,
    record_id BIGINT,
    summary TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS finance_history_created_at_idx
    ON finance_history (created_at DESC);

ALTER TABLE finance_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Treasurer and admin read finance history" ON finance_history;
CREATE POLICY "Treasurer and admin read finance history"
    ON finance_history FOR SELECT
    TO authenticated
    USING (public.is_treasurer_or_admin());

DROP POLICY IF EXISTS "Users insert their own finance history" ON finance_history;
CREATE POLICY "Users insert their own finance history"
    ON finance_history FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT ON TABLE public.finance_history TO authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE public.finance_history_history_id_seq TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
