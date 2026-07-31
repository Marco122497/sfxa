-- Phase 10 — Budget allocation per specific expense category
-- Budgets can now target a specific category (expense subcategory).
-- The general category total is the sum of its allocations.
-- Run in Supabase SQL Editor after phase9-expense-subcategories.sql

ALTER TABLE budgets
    ADD COLUMN IF NOT EXISTS expense_subcategory_id BIGINT
        REFERENCES expense_subcategories(subcategory_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS budgets_subcategory_idx
    ON budgets (expense_subcategory_id);
