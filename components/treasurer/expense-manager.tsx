"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";

import { useServerAction } from "@/hooks/use-refresh-on-success";

import {
  createExpense,
  deleteExpense,
  updateExpense,
  type FinanceActionState,
} from "@/app/actions/finance";
import { formatDate, formatMoney, toNumber } from "@/lib/format";
import {
  resolveExpenseBudgetCap,
  type ExpenseBudgetCap,
} from "@/lib/expense-budget";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const initialState: FinanceActionState = {};

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export type ExpenseCategory = {
  expense_category_id: number;
  category_name: string;
  has_budget: boolean;
};

export type ExpenseSubcategory = {
  subcategory_id: number;
  expense_category_id: number;
  subcategory_name: string;
};

export type ExpenseRow = {
  expense_id: number;
  expense_category_id: number | null;
  expense_subcategory_id: number | null;
  description: string | null;
  amount: number | string;
  expense_date: string;
  category_name: string | null;
  subcategory_name: string | null;
};

function ExpenseFormFields({
  categories,
  subcategories,
  budgetCaps,
  actualCash = 0,
  defaults,
  idPrefix,
  onBlockedChange,
}: {
  categories: ExpenseCategory[];
  subcategories: ExpenseSubcategory[];
  budgetCaps: ExpenseBudgetCap[];
  actualCash?: number;
  defaults?: Partial<ExpenseRow>;
  idPrefix: string;
  onBlockedChange?: (blocked: boolean) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const firstBudgeted = categories.find((c) => c.has_budget);
  const [categoryId, setCategoryId] = useState<number | "">(
    defaults?.expense_category_id ??
      firstBudgeted?.expense_category_id ??
      categories[0]?.expense_category_id ??
      ""
  );
  const specificForCategory = useMemo(
    () =>
      subcategories.filter(
        (s) => s.expense_category_id === Number(categoryId)
      ),
    [subcategories, categoryId]
  );
  const [subcategoryId, setSubcategoryId] = useState<number | "">(
    defaults?.expense_subcategory_id &&
      specificForCategory.some(
        (s) => s.subcategory_id === defaults.expense_subcategory_id
      )
      ? defaults.expense_subcategory_id
      : (specificForCategory[0]?.subcategory_id ?? "")
  );
  const [expenseDate, setExpenseDate] = useState(
    defaults?.expense_date ?? today
  );
  const [amount, setAmount] = useState(
    defaults?.amount != null ? String(defaults.amount) : ""
  );

  useEffect(() => {
    const stillValid = specificForCategory.some(
      (s) => s.subcategory_id === subcategoryId
    );
    if (!stillValid) {
      setSubcategoryId(specificForCategory[0]?.subcategory_id ?? "");
    }
  }, [specificForCategory, subcategoryId]);

  const cap = resolveExpenseBudgetCap(
    budgetCaps,
    categoryId,
    subcategoryId,
    Number(expenseDate.slice(0, 4)) || new Date().getFullYear()
  );
  const sameBucket =
    defaults?.expense_category_id === categoryId &&
    defaults?.expense_subcategory_id === subcategoryId;
  const remaining = cap
    ? Math.max(0, cap.remaining + (sameBucket ? toNumber(defaults?.amount) : 0))
    : null;
  const availableCash = Math.max(
    0,
    (Number(actualCash) || 0) +
      (defaults?.amount != null ? toNumber(defaults.amount) : 0)
  );
  const enteredCents = Math.round(toNumber(amount) * 100);
  const cashCents = Math.round(availableCash * 100);
  const remainingCents =
    remaining == null ? null : Math.round(remaining * 100);
  const overBudget =
    remainingCents != null && amount !== "" && enteredCents > remainingCents;
  const overCash = amount !== "" && enteredCents > cashCents;
  const blocked =
    overBudget ||
    overCash ||
    (remaining != null && remaining <= 0) ||
    availableCash <= 0;

  useEffect(() => {
    onBlockedChange?.(blocked);
  }, [onBlockedChange, blocked]);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-category`}>General category</Label>
        <select
          id={`${idPrefix}-category`}
          name="expense_category_id"
          required
          value={categoryId}
          onChange={(event) =>
            setCategoryId(event.target.value ? Number(event.target.value) : "")
          }
          className={selectClassName}
        >
          {categories.map((category) => (
            <option
              key={category.expense_category_id}
              value={category.expense_category_id}
              disabled={!category.has_budget}
            >
              {category.category_name}
              {category.has_budget ? "" : " — needs budget allocation"}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-subcategory`}>Specific category</Label>
        <select
          id={`${idPrefix}-subcategory`}
          name="expense_subcategory_id"
          required
          value={subcategoryId}
          onChange={(event) =>
            setSubcategoryId(
              event.target.value ? Number(event.target.value) : ""
            )
          }
          className={selectClassName}
          disabled={specificForCategory.length === 0}
        >
          {specificForCategory.length === 0 ? (
            <option value="">No specific categories</option>
          ) : (
            specificForCategory.map((sub) => (
              <option key={sub.subcategory_id} value={sub.subcategory_id}>
                {sub.subcategory_name}
              </option>
            ))
          )}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-amount`}>Amount</Label>
        <Input
          id={`${idPrefix}-amount`}
          name="amount"
          type="number"
          min="0.01"
          step="0.01"
          required
          value={amount}
          aria-invalid={overBudget || overCash || undefined}
          onChange={(event) => setAmount(event.target.value)}
        />
        {overCash || availableCash <= 0 ? (
          <p className="text-xs text-destructive" role="alert">
            {availableCash <= 0
              ? "Not enough actual cash to record this expense."
              : `Not enough actual cash. Available cash is ${formatMoney(availableCash)}.`}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Actual cash: {formatMoney(availableCash)}
          </p>
        )}
        {remaining != null && !overCash && availableCash > 0 ? (
          overBudget || remaining <= 0 ? (
            <p className="text-xs text-destructive" role="alert">
              {remaining <= 0
                ? "No remaining budget for this category."
                : `Amount cannot exceed the remaining budget of ${formatMoney(remaining)}.`}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Remaining budget: {formatMoney(remaining)}
            </p>
          )
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-date`}>Date</Label>
        <Input
          id={`${idPrefix}-date`}
          name="expense_date"
          type="date"
          required
          value={expenseDate}
          onChange={(event) => setExpenseDate(event.target.value)}
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor={`${idPrefix}-description`}>Note (optional)</Label>
        <Input
          id={`${idPrefix}-description`}
          name="description"
          defaultValue={defaults?.description ?? ""}
          placeholder="Optional extra detail"
        />
      </div>
    </div>
  );
}

function AddExpenseDialog({
  categories,
  subcategories,
  budgetCaps,
  actualCash,
}: {
  categories: ExpenseCategory[];
  subcategories: ExpenseSubcategory[];
  budgetCaps: ExpenseBudgetCap[];
  actualCash: number;
}) {
  const [open, setOpen] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [state, formAction, pending] = useServerAction(createExpense, initialState, () => setOpen(false));


  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setBlocked(false);
      }}
    >
      <AlertDialogTrigger render={<Button type="button" />}>
        <PlusIcon />
        Add expense
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Add expense</AlertDialogTitle>
          <AlertDialogDescription>
            Choose a general category and a specific category under it. This
            uses remaining budget and reduces actual cash. It does not deduct
            from collected income.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form
          action={formAction}
          id="add-expense-form"
          className="space-y-4"
          noValidate
          onSubmit={(event) => {
            if (blocked) event.preventDefault();
          }}
        >
          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          <ExpenseFormFields
            categories={categories}
            subcategories={subcategories}
            budgetCaps={budgetCaps}
            actualCash={actualCash}
            idPrefix="add"
            onBlockedChange={setBlocked}
          />
        </form>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button type="submit" form="add-expense-form" disabled={pending || blocked}>
            {pending ? (
              <>
                <Loader2 className="animate-spin" />
                Saving…
              </>
            ) : (
              "Save"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function EditExpenseDialog({
  row,
  categories,
  subcategories,
  budgetCaps,
  actualCash,
}: {
  row: ExpenseRow;
  categories: ExpenseCategory[];
  subcategories: ExpenseSubcategory[];
  budgetCaps: ExpenseBudgetCap[];
  actualCash: number;
}) {
  const [open, setOpen] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [state, formAction, pending] = useServerAction(updateExpense, initialState, () => setOpen(false));


  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setBlocked(false);
      }}
    >
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Edit expense"
          />
        }
      >
        <PencilIcon />
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Edit expense</AlertDialogTitle>
          <AlertDialogDescription>
            Update general/specific category or amount.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form
          action={formAction}
          id={`edit-expense-${row.expense_id}`}
          className="space-y-4"
          noValidate
          onSubmit={(event) => {
            if (blocked) event.preventDefault();
          }}
        >
          <input type="hidden" name="expense_id" value={row.expense_id} />
          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          <ExpenseFormFields
            key={JSON.stringify(row)}
            categories={categories}
            subcategories={subcategories}
            budgetCaps={budgetCaps}
            actualCash={actualCash}
            idPrefix={`edit-${row.expense_id}`}
            defaults={row}
            onBlockedChange={setBlocked}
          />
        </form>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            type="submit"
            form={`edit-expense-${row.expense_id}`}
            disabled={pending || blocked}
          >
            {pending ? (
              <>
                <Loader2 className="animate-spin" />
                Saving…
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function DeleteExpenseButton({
  expenseId,
  label,
}: {
  expenseId: number;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useServerAction(deleteExpense, initialState, () => setOpen(false));
  const formId = `delete-expense-${expenseId}`;


  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Delete expense"
        onClick={() => setOpen(true)}
      >
        <Trash2Icon />
      </Button>
      <AlertDialog
        open={open}
        onOpenChange={(next) => {
          if (pending) return;
          setOpen(next);
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <Trash2Icon />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete expense?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {label}. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {state.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}
          <form action={formAction} id={formId}>
            <input type="hidden" name="expense_id" value={expenseId} />
          </form>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              type="submit"
              form={formId}
              variant="destructive"
              disabled={pending}
            >
              {pending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Deleting…
                </>
              ) : (
                <>
                  <Trash2Icon />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function ExpenseManager({
  expenses,
  categories,
  subcategories,
  budgetCaps = [],
  actualCash = 0,
  canEdit = false,
  canDelete = false,
}: {
  expenses: ExpenseRow[];
  categories: ExpenseCategory[];
  subcategories: ExpenseSubcategory[];
  budgetCaps?: ExpenseBudgetCap[];
  actualCash?: number;
  canEdit?: boolean;
  canDelete?: boolean;
}) {
  const [query, setQuery] = useState("");
  const showActions = canEdit || canDelete;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return expenses;
    return expenses.filter((row) => {
      const haystack = [
        row.description,
        row.category_name,
        row.subcategory_name,
        String(row.amount),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [expenses, query]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Expenses</h2>
          <p className="text-xs text-muted-foreground">
            {filtered.length} record{filtered.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search expenses…"
            className="h-8 w-[200px]"
          />
          <AddExpenseDialog
            categories={categories}
            subcategories={subcategories}
            budgetCaps={budgetCaps}
            actualCash={actualCash}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-2 text-sm text-muted-foreground">No expenses yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="h-8 px-2">Date</TableHead>
              <TableHead className="h-8 px-2">General</TableHead>
              <TableHead className="h-8 px-2">Specific</TableHead>
              <TableHead className="h-8 px-2 text-right">Amount</TableHead>
              {showActions ? (
                <TableHead
                  className={`h-8 px-2 ${canEdit && canDelete ? "w-[88px]" : "w-[48px]"}`}
                />
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => (
              <TableRow key={row.expense_id}>
                <TableCell className="px-2 py-1.5">
                  {formatDate(row.expense_date)}
                </TableCell>
                <TableCell className="px-2 py-1.5">
                  {row.category_name || "—"}
                </TableCell>
                <TableCell className="max-w-[200px] truncate px-2 py-1.5 font-medium">
                  {row.subcategory_name || row.description || "—"}
                </TableCell>
                <TableCell className="px-2 py-1.5 text-right tabular-nums">
                  {formatMoney(row.amount)}
                </TableCell>
                {showActions ? (
                  <TableCell className="px-2 py-1.5">
                    <div className="flex justify-end gap-1">
                      {canEdit ? (
                        <EditExpenseDialog
                          row={row}
                          categories={categories}
                          subcategories={subcategories}
                          budgetCaps={budgetCaps}
                          actualCash={actualCash}
                        />
                      ) : null}
                      {canDelete ? (
                        <DeleteExpenseButton
                          expenseId={row.expense_id}
                          label={`${formatMoney(row.amount)} · ${row.subcategory_name || row.category_name || row.description || "expense"} · ${formatDate(row.expense_date)}`}
                        />
                      ) : null}
                    </div>
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
