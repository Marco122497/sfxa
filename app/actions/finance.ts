"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import {
  requireAdmin,
  requireTreasurerOrAdmin,
} from "@/lib/auth/session";
import { formatMoney, toNumber } from "@/lib/format";
import { incomeRecordCopy } from "@/lib/income-categories";
import {
  resolveExpenseBudgetCap,
  toExpenseBudgetCaps,
} from "@/lib/expense-budget";
import { getBudgetModuleData } from "@/lib/treasurer/budget-data";
import { getActualCashAmount } from "@/lib/cash-flow";

export type FinanceActionState = {
  error?: string;
  success?: string;
};

function recordCopyFromForm(formData: FormData) {
  return incomeRecordCopy(
    String(formData.get("record_kind") || "donation"),
    String(formData.get("record_name") || "")
  );
}

async function getIp() {
  const headerStore = await headers();
  return (
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip") ||
    null
  );
}

function revalidateFinance() {
  revalidatePath("/treasurer");
  revalidatePath("/treasurer/donations");
  revalidatePath("/treasurer/collections");
  revalidatePath("/treasurer/expenses");
  revalidatePath("/treasurer/budgets");
  revalidatePath("/treasurer/budgets/categories");
  revalidatePath("/treasurer/budgets/allocation");
  revalidatePath("/treasurer/budgets/monitoring");
  revalidatePath("/treasurer/budgets/history");
  revalidatePath("/treasurer/receive", "layout");
  revalidatePath("/treasurer/release/expenses");
  revalidatePath("/treasurer/cash-flow");
  revalidatePath("/administrator/cash-flow");
  revalidatePath("/administrator/finance", "layout");
  revalidatePath("/administrator");
  revalidatePath("/administrator/reports");
  revalidatePath("/parish-officer/budget");
  revalidatePath("/");
}

async function logBudgetHistory(
  supabase: Awaited<ReturnType<typeof requireTreasurerOrAdmin>>["supabase"],
  userId: string,
  entry: {
    budget_id: number | null;
    budget_category_id: number | null;
    category_name: string | null;
    subcategory_name?: string | null;
    fiscal_year: number | null;
    previous_amount: number | null;
    new_amount: number | null;
    action: string;
    remarks: string | null;
  }
) {
  await supabase.from("budget_history").insert({
    ...entry,
    changed_by: userId,
  });
}

async function resolveBudgetCategoryName(
  supabase: Awaited<ReturnType<typeof requireTreasurerOrAdmin>>["supabase"],
  budgetCategoryId: number
) {
  const { data } = await supabase
    .from("budget_categories")
    .select("category_name")
    .eq("budget_category_id", budgetCategoryId)
    .maybeSingle();
  return data?.category_name ?? null;
}

async function resolveExpenseSubcategoryName(
  supabase: Awaited<ReturnType<typeof requireTreasurerOrAdmin>>["supabase"],
  subcategoryId: number | null
) {
  if (!subcategoryId) return null;
  const { data } = await supabase
    .from("expense_subcategories")
    .select("subcategory_name")
    .eq("subcategory_id", subcategoryId)
    .maybeSingle();
  return data?.subcategory_name ?? null;
}

/** A budget's specific category must belong to the expense category matching the budget category name. */
async function validateBudgetSubcategory(
  supabase: Awaited<ReturnType<typeof requireTreasurerOrAdmin>>["supabase"],
  subcategoryId: number,
  budgetCategoryName: string | null
): Promise<string | null> {
  const { data: sub } = await supabase
    .from("expense_subcategories")
    .select("subcategory_id, subcategory_name, expense_categories(category_name)")
    .eq("subcategory_id", subcategoryId)
    .maybeSingle();

  if (!sub) {
    return "Specific category not found.";
  }

  const related = sub.expense_categories as
    | { category_name?: string }
    | { category_name?: string }[]
    | null;
  const parentName = Array.isArray(related)
    ? related[0]?.category_name
    : related?.category_name;

  if (!budgetCategoryName || parentName !== budgetCategoryName) {
    return "Specific category does not belong to the selected general category.";
  }
  return null;
}

/** Expenses may only be recorded against general categories that have a budget allocation. */
async function ensureCategoryHasBudget(
  supabase: Awaited<ReturnType<typeof requireTreasurerOrAdmin>>["supabase"],
  expenseCategoryId: number
): Promise<string | null> {
  const { data: category } = await supabase
    .from("expense_categories")
    .select("category_name")
    .eq("expense_category_id", expenseCategoryId)
    .maybeSingle();

  if (!category?.category_name) {
    return "General category not found.";
  }

  const { data: budgetCategory } = await supabase
    .from("budget_categories")
    .select("budget_category_id")
    .eq("category_name", category.category_name)
    .maybeSingle();

  if (budgetCategory) {
    const { count } = await supabase
      .from("budgets")
      .select("budget_id", { count: "exact", head: true })
      .eq("budget_category_id", budgetCategory.budget_category_id);
    if ((count ?? 0) > 0) return null;
  }

  return `"${category.category_name}" has no budget allocation yet. Create one in Budgets → Allocation first.`;
}

async function ensureExpenseWithinBudget(
  supabase: Awaited<ReturnType<typeof requireTreasurerOrAdmin>>["supabase"],
  expenseCategoryId: number,
  expenseSubcategoryId: number,
  amount: number,
  expenseDate: string,
  credit = 0
): Promise<string | null> {
  const [{ rows }, { data: expenseCategories }] = await Promise.all([
    getBudgetModuleData(),
    supabase
      .from("expense_categories")
      .select("expense_category_id, category_name"),
  ]);
  const cap = resolveExpenseBudgetCap(
    toExpenseBudgetCaps(rows, expenseCategories ?? []),
    expenseCategoryId,
    expenseSubcategoryId,
    Number(expenseDate.slice(0, 4)) || new Date().getFullYear()
  );
  if (!cap) return null;

  const remaining = Math.max(0, cap.remaining + credit);
  if (amount - remaining > 0.0001) {
    return `Amount exceeds the remaining budget of ${formatMoney(remaining)}.`;
  }
  return null;
}

async function ensureExpenseWithinCash(amount: number, credit = 0) {
  const cash = await getActualCashAmount();
  const available = Math.max(0, cash + credit);
  if (Math.round(amount * 100) > Math.round(available * 100)) {
    return `Not enough actual cash. Available cash is ${formatMoney(available)}.`;
  }
  return null;
}

function parseAmount(value: FormDataEntryValue | null) {
  const amount = Number(String(value || "").trim());
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }
  return amount;
}

export async function createDonation(
  _prev: FinanceActionState,
  formData: FormData
): Promise<FinanceActionState> {
  const { supabase, user } = await requireTreasurerOrAdmin();

  const donor_name = String(formData.get("donor_name") || "").trim() || null;
  const category_id = Number(formData.get("category_id"));
  const amount = parseAmount(formData.get("amount"));
  const donation_date = String(formData.get("donation_date") || "").trim();
  const remarks = String(formData.get("remarks") || "").trim() || null;

  if (!category_id || !amount || !donation_date) {
    return { error: "Category, amount, and date are required." };
  }

  const { data, error } = await supabase
    .from("donations")
    .insert({
      donor_name,
      category_id,
      amount,
      donation_date,
      remarks,
      created_by: user.id,
    })
    .select("donation_id")
    .single();

  if (error) {
    return { error: error.message };
  }

  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "CREATE_DONATION",
    table_name: "donations",
    record_id: data.donation_id,
    description: `Created donation of ${amount}`,
    ip_address: await getIp(),
  });

  revalidateFinance();
  return { success: recordCopyFromForm(formData).recordedMessage };
}

export async function updateDonation(
  _prev: FinanceActionState,
  formData: FormData
): Promise<FinanceActionState> {
  const { supabase, user } = await requireAdmin();

  const donation_id = Number(formData.get("donation_id"));
  const donor_name = String(formData.get("donor_name") || "").trim() || null;
  const category_id = Number(formData.get("category_id"));
  const amount = parseAmount(formData.get("amount"));
  const donation_date = String(formData.get("donation_date") || "").trim();
  const remarks = String(formData.get("remarks") || "").trim() || null;

  if (!donation_id || !category_id || !amount || !donation_date) {
    return { error: "Category, amount, and date are required." };
  }

  const { error } = await supabase
    .from("donations")
    .update({
      donor_name,
      category_id,
      amount,
      donation_date,
      remarks,
    })
    .eq("donation_id", donation_id);

  if (error) {
    return { error: error.message };
  }

  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "UPDATE_DONATION",
    table_name: "donations",
    record_id: donation_id,
    description: `Updated donation #${donation_id}`,
    ip_address: await getIp(),
  });

  revalidateFinance();
  return { success: recordCopyFromForm(formData).updatedMessage };
}

export async function deleteDonation(
  _prev: FinanceActionState,
  formData: FormData
): Promise<FinanceActionState> {
  const { supabase, user } = await requireAdmin();
  const donation_id = Number(formData.get("donation_id"));

  if (!donation_id) {
    return { error: "Invalid donation." };
  }

  const { error } = await supabase
    .from("donations")
    .delete()
    .eq("donation_id", donation_id);

  if (error) {
    return { error: error.message };
  }

  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "DELETE_DONATION",
    table_name: "donations",
    record_id: donation_id,
    description: `Deleted donation #${donation_id}`,
    ip_address: await getIp(),
  });

  revalidateFinance();
  return { success: recordCopyFromForm(formData).deletedMessage };
}

export async function createExpense(
  _prev: FinanceActionState,
  formData: FormData
): Promise<FinanceActionState> {
  const { supabase, user } = await requireTreasurerOrAdmin();

  const expense_category_id = Number(formData.get("expense_category_id"));
  const expense_subcategory_id = Number(
    formData.get("expense_subcategory_id")
  );
  const description = String(formData.get("description") || "").trim() || null;
  const amount = parseAmount(formData.get("amount"));
  const expense_date = String(formData.get("expense_date") || "").trim();

  if (!expense_category_id || !amount || !expense_date) {
    return { error: "General category, amount, and date are required." };
  }

  if (!expense_subcategory_id) {
    return { error: "Please choose a specific category." };
  }

  const { data: sub } = await supabase
    .from("expense_subcategories")
    .select("subcategory_id, subcategory_name, expense_category_id")
    .eq("subcategory_id", expense_subcategory_id)
    .maybeSingle();

  if (!sub || sub.expense_category_id !== expense_category_id) {
    return {
      error: "Specific category does not match the selected general category.",
    };
  }

  const budgetError = await ensureCategoryHasBudget(
    supabase,
    expense_category_id
  );
  if (budgetError) {
    return { error: budgetError };
  }

  const overBudgetError = await ensureExpenseWithinBudget(
    supabase,
    expense_category_id,
    expense_subcategory_id,
    amount,
    expense_date
  );
  if (overBudgetError) {
    return { error: overBudgetError };
  }

  const overCashError = await ensureExpenseWithinCash(amount);
  if (overCashError) {
    return { error: overCashError };
  }

  const { data, error } = await supabase
    .from("expenses")
    .insert({
      expense_category_id,
      expense_subcategory_id,
      description: description || sub.subcategory_name,
      amount,
      expense_date,
      created_by: user.id,
    })
    .select("expense_id")
    .single();

  if (error) {
    if (/expense_subcategory_id|column|expense_subcategories/i.test(error.message)) {
      return {
        error:
          "Specific categories are not set up yet. Run sql/phase3-categories.sql in Supabase.",
      };
    }
    return { error: error.message };
  }

  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "CREATE_EXPENSE",
    table_name: "expenses",
    record_id: data.expense_id,
    description: `Created expense ${sub.subcategory_name} of ${amount}`,
    ip_address: await getIp(),
  });

  revalidateFinance();
  return { success: "Expense recorded." };
}

export async function updateExpense(
  _prev: FinanceActionState,
  formData: FormData
): Promise<FinanceActionState> {
  const { supabase, user } = await requireAdmin();

  const expense_id = Number(formData.get("expense_id"));
  const expense_category_id = Number(formData.get("expense_category_id"));
  const expense_subcategory_id = Number(
    formData.get("expense_subcategory_id")
  );
  const description = String(formData.get("description") || "").trim() || null;
  const amount = parseAmount(formData.get("amount"));
  const expense_date = String(formData.get("expense_date") || "").trim();

  if (!expense_id || !expense_category_id || !amount || !expense_date) {
    return { error: "General category, amount, and date are required." };
  }

  if (!expense_subcategory_id) {
    return { error: "Please choose a specific category." };
  }

  const { data: sub } = await supabase
    .from("expense_subcategories")
    .select("subcategory_id, subcategory_name, expense_category_id")
    .eq("subcategory_id", expense_subcategory_id)
    .maybeSingle();

  if (!sub || sub.expense_category_id !== expense_category_id) {
    return {
      error: "Specific category does not match the selected general category.",
    };
  }

  const budgetError = await ensureCategoryHasBudget(
    supabase,
    expense_category_id
  );
  if (budgetError) {
    return { error: budgetError };
  }

  const { data: existing } = await supabase
    .from("expenses")
    .select("amount, expense_category_id, expense_subcategory_id")
    .eq("expense_id", expense_id)
    .maybeSingle();
  const sameBucket =
    existing?.expense_category_id === expense_category_id &&
    existing?.expense_subcategory_id === expense_subcategory_id;
  const overBudgetError = await ensureExpenseWithinBudget(
    supabase,
    expense_category_id,
    expense_subcategory_id,
    amount,
    expense_date,
    sameBucket ? toNumber(existing?.amount) : 0
  );
  if (overBudgetError) {
    return { error: overBudgetError };
  }

  const overCashError = await ensureExpenseWithinCash(
    amount,
    toNumber(existing?.amount)
  );
  if (overCashError) {
    return { error: overCashError };
  }

  const { error } = await supabase
    .from("expenses")
    .update({
      expense_category_id,
      expense_subcategory_id,
      description: description || sub.subcategory_name,
      amount,
      expense_date,
    })
    .eq("expense_id", expense_id);

  if (error) {
    if (/expense_subcategory_id|column|expense_subcategories/i.test(error.message)) {
      return {
        error:
          "Specific categories are not set up yet. Run sql/phase3-categories.sql in Supabase.",
      };
    }
    return { error: error.message };
  }

  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "UPDATE_EXPENSE",
    table_name: "expenses",
    record_id: expense_id,
    description: `Updated expense #${expense_id}`,
    ip_address: await getIp(),
  });

  revalidateFinance();
  return { success: "Expense updated." };
}

export async function deleteExpense(
  _prev: FinanceActionState,
  formData: FormData
): Promise<FinanceActionState> {
  const { supabase, user } = await requireAdmin();
  const expense_id = Number(formData.get("expense_id"));

  if (!expense_id) {
    return { error: "Invalid expense." };
  }

  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("expense_id", expense_id);

  if (error) {
    return { error: error.message };
  }

  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "DELETE_EXPENSE",
    table_name: "expenses",
    record_id: expense_id,
    description: `Deleted expense #${expense_id}`,
    ip_address: await getIp(),
  });

  revalidateFinance();
  return { success: "Expense deleted." };
}

export async function createBudget(
  _prev: FinanceActionState,
  formData: FormData
): Promise<FinanceActionState> {
  const { supabase, user } = await requireTreasurerOrAdmin();

  const budget_category_id = Number(formData.get("budget_category_id"));
  const expense_subcategory_id =
    Number(formData.get("expense_subcategory_id")) || null;
  const fiscal_year = Number(formData.get("fiscal_year"));
  const allocated_amount = parseAmount(formData.get("allocated_amount"));
  const remarks = String(formData.get("remarks") || "").trim() || null;

  if (!budget_category_id || !fiscal_year || !allocated_amount) {
    return { error: "Category, fiscal year, and amount are required." };
  }

  const categoryName = await resolveBudgetCategoryName(
    supabase,
    budget_category_id
  );

  if (expense_subcategory_id) {
    const subError = await validateBudgetSubcategory(
      supabase,
      expense_subcategory_id,
      categoryName
    );
    if (subError) {
      return { error: subError };
    }
  }

  const { data, error } = await supabase
    .from("budgets")
    .insert({
      budget_category_id,
      expense_subcategory_id,
      fiscal_year,
      allocated_amount,
      remarks,
      created_by: user.id,
    })
    .select("budget_id")
    .single();

  if (error) {
    if (/expense_subcategory_id|column/i.test(error.message)) {
      return {
        error:
          "Specific budget allocations are not set up yet. Run sql/phase5-budget.sql in Supabase.",
      };
    }
    return { error: error.message };
  }

  await logBudgetHistory(supabase, user.id, {
    budget_id: data.budget_id,
    budget_category_id,
    category_name: categoryName,
    subcategory_name: await resolveExpenseSubcategoryName(
      supabase,
      expense_subcategory_id
    ),
    fiscal_year,
    previous_amount: null,
    new_amount: allocated_amount,
    action: "CREATE",
    remarks,
  });

  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "CREATE_BUDGET",
    table_name: "budgets",
    record_id: data.budget_id,
    description: `Created budget of ${allocated_amount} for ${fiscal_year}`,
    ip_address: await getIp(),
  });

  revalidateFinance();
  return { success: "Budget created." };
}

export async function updateBudget(
  _prev: FinanceActionState,
  formData: FormData
): Promise<FinanceActionState> {
  const { supabase, user } = await requireAdmin();

  const budget_id = Number(formData.get("budget_id"));
  const budget_category_id = Number(formData.get("budget_category_id"));
  const expense_subcategory_id =
    Number(formData.get("expense_subcategory_id")) || null;
  const fiscal_year = Number(formData.get("fiscal_year"));
  const allocated_amount = parseAmount(formData.get("allocated_amount"));
  const remarks = String(formData.get("remarks") || "").trim() || null;

  if (!budget_id || !budget_category_id || !fiscal_year || !allocated_amount) {
    return { error: "Category, fiscal year, and amount are required." };
  }

  const categoryName = await resolveBudgetCategoryName(
    supabase,
    budget_category_id
  );

  if (expense_subcategory_id) {
    const subError = await validateBudgetSubcategory(
      supabase,
      expense_subcategory_id,
      categoryName
    );
    if (subError) {
      return { error: subError };
    }
  }

  const { data: existing } = await supabase
    .from("budgets")
    .select("allocated_amount, remarks")
    .eq("budget_id", budget_id)
    .maybeSingle();

  const { error } = await supabase
    .from("budgets")
    .update({
      budget_category_id,
      expense_subcategory_id,
      fiscal_year,
      allocated_amount,
      remarks,
    })
    .eq("budget_id", budget_id);

  if (error) {
    if (/expense_subcategory_id|column/i.test(error.message)) {
      return {
        error:
          "Specific budget allocations are not set up yet. Run sql/phase5-budget.sql in Supabase.",
      };
    }
    return { error: error.message };
  }

  await logBudgetHistory(supabase, user.id, {
    budget_id,
    budget_category_id,
    category_name: categoryName,
    subcategory_name: await resolveExpenseSubcategoryName(
      supabase,
      expense_subcategory_id
    ),
    fiscal_year,
    previous_amount: existing ? Number(existing.allocated_amount) : null,
    new_amount: allocated_amount,
    action: "UPDATE",
    remarks,
  });

  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "UPDATE_BUDGET",
    table_name: "budgets",
    record_id: budget_id,
    description: `Updated budget #${budget_id}`,
    ip_address: await getIp(),
  });

  revalidateFinance();
  return { success: "Budget updated." };
}

export async function deleteBudget(
  _prev: FinanceActionState,
  formData: FormData
): Promise<FinanceActionState> {
  const { supabase, user } = await requireAdmin();
  const budget_id = Number(formData.get("budget_id"));

  if (!budget_id) {
    return { error: "Invalid budget." };
  }

  const { data: existing } = await supabase
    .from("budgets")
    .select(
      "allocated_amount, fiscal_year, budget_category_id, expense_subcategory_id, remarks, budget_categories(category_name), expense_subcategories(subcategory_name)"
    )
    .eq("budget_id", budget_id)
    .maybeSingle();

  const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("budget_id", budget_id);

  if (error) {
    return { error: error.message };
  }

  const related = existing?.budget_categories as
    | { category_name?: string }
    | { category_name?: string }[]
    | null
    | undefined;
  const categoryName = Array.isArray(related)
    ? related[0]?.category_name
    : related?.category_name;

  const subRelated = existing?.expense_subcategories as
    | { subcategory_name?: string }
    | { subcategory_name?: string }[]
    | null
    | undefined;
  const subcategoryName = Array.isArray(subRelated)
    ? subRelated[0]?.subcategory_name
    : subRelated?.subcategory_name;

  await logBudgetHistory(supabase, user.id, {
    budget_id,
    budget_category_id: existing?.budget_category_id ?? null,
    category_name: categoryName ?? null,
    subcategory_name: subcategoryName ?? null,
    fiscal_year: existing?.fiscal_year ?? null,
    previous_amount: existing ? Number(existing.allocated_amount) : null,
    new_amount: null,
    action: "DELETE",
    remarks: existing?.remarks ?? null,
  });

  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "DELETE_BUDGET",
    table_name: "budgets",
    record_id: budget_id,
    description: `Deleted budget #${budget_id}`,
    ip_address: await getIp(),
  });

  revalidateFinance();
  return { success: "Budget deleted." };
}
