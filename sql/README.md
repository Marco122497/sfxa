# SFXA Finance — Database setup

Run these in the **Supabase SQL Editor** of the same project the app uses. Every script is safe to re-run.

Parish Officer in the database is shown as **Parish Member** in the app. There is no fourth role.

## Fresh install

Run in this order:

1. `db.sql` — core schema (profiles, parish information, finance tables, storage, admin seed)
2. `sql/registration-trigger.sql` — only if registration returns HTTP 500
3. `sql/phase2-admin.sql` — Admin RLS and parish publish fields
4. `sql/phase3-categories.sql` — **Categories** (income categories, income services, expense categories)
5. `sql/phase4-treasurer.sql` — Receive / Release Funds extras (receipts, donation status)
6. `sql/phase5-budget.sql` — Budget allocations + history (uses expense categories)
7. `sql/phase6-transparency.sql` — Parish Member / public approved summaries
8. `sql/sample-parish-projects.sql` — optional sample projects

## How this maps to the system

| Phase | Who it serves | What it creates |
| --- | --- | --- |
| `db.sql` | All roles | Profiles, announcements, donations, expenses, budgets |
| Phase 2 | Administrator | Admin RLS, parish publish |
| Phase 3 | Administrator | Income categories/services and expense categories |
| Phase 4 | Treasurer | Cash inflow/outflow recording (uses phase 3 services) |
| Phase 5 | Treasurer + Administrator | Budget vs actual (same expense categories) |
| Phase 6 | Parish Member + public | Approved, non-confidential summaries |

## Existing databases

If you already ran the old `phase9` / `phase12` files, still run **phase 2 through 6** once. They only add missing tables, columns, policies, and the updated category seeds.
