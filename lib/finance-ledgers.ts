/**
 * Parish finance uses three ledgers that must stay separate:
 *
 * 1. Income — treasurer collects donations, collections, and other inflows.
 *    This total stays gross. Expenses never deduct from income.
 * 2. Budget — treasurer allocates a spending plan after income is collected.
 *    Creating a budget does not move cash and does not reduce income.
 * 3. Cash — money on hand. Collecting income increases cash. Recording an
 *    expense decreases cash and increases actual expenses / budget usage.
 */

export function actualCash(grossIncome: number, actualExpenses: number) {
  return grossIncome - actualExpenses;
}

export function remainingBudget(allocated: number, spent: number) {
  return allocated - spent;
}
