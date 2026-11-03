-- Phase 8 — Official receipt numbers and transaction limit
-- Run after sql/phase7-parish-settings.sql
-- Safe to re-run.

ALTER TABLE donations
    ADD COLUMN IF NOT EXISTS or_number VARCHAR(40);

CREATE UNIQUE INDEX IF NOT EXISTS donations_or_number_unique
    ON donations (or_number)
    WHERE or_number IS NOT NULL AND btrim(or_number) <> '';

ALTER TABLE parish_settings
    ADD COLUMN IF NOT EXISTS transaction_limit NUMERIC(12, 2) NOT NULL DEFAULT 10000;

NOTIFY pgrst, 'reload schema';
