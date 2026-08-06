-- Phase 11 — Store specific category on budget history rows
-- Run in Supabase SQL Editor after phase10-budget-subcategories.sql

ALTER TABLE budget_history
    ADD COLUMN IF NOT EXISTS subcategory_name VARCHAR(100);
