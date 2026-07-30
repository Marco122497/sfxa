"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Loader2, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";

import {
  createCategory,
  createExpenseSubcategory,
  deleteCategory,
  deleteExpenseSubcategory,
  updateCategory,
  updateExpenseSubcategory,
  type CategoryActionState,
} from "@/app/actions/categories";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
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

const initialState: CategoryActionState = {};

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export type ExpenseGeneralCategory = {
  id: number;
  name: string;
};

export type ExpenseSpecificCategory = {
  subcategory_id: number;
  expense_category_id: number;
  subcategory_name: string;
};

function AddGeneralDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    createCategory,
    initialState
  );

  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button type="button" />}>
        <PlusIcon />
        Add general category
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Add general category</AlertDialogTitle>
          <AlertDialogDescription>
            Used for budget allocation (e.g. Utilities). Add specific categories
            under it in the table below.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form action={formAction} id="add-general-cat" className="space-y-4">
          <input type="hidden" name="kind" value="expense" />
          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="general-name">Name</Label>
            <Input
              id="general-name"
              name="category_name"
              required
              placeholder="e.g. Utilities"
            />
          </div>
        </form>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button type="submit" form="add-general-cat" disabled={pending}>
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

function EditGeneralDialog({ row }: { row: ExpenseGeneralCategory }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    updateCategory,
    initialState
  );

  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Edit general category"
          />
        }
      >
        <PencilIcon />
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Edit general category</AlertDialogTitle>
          <AlertDialogDescription>
            Renaming also updates the matching budget allocation category.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form
          action={formAction}
          id={`edit-general-${row.id}`}
          className="space-y-4"
        >
          <input type="hidden" name="kind" value="expense" />
          <input type="hidden" name="category_id" value={row.id} />
          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor={`edit-general-name-${row.id}`}>Name</Label>
            <Input
              id={`edit-general-name-${row.id}`}
              name="category_name"
              required
              defaultValue={row.name}
            />
          </div>
        </form>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            type="submit"
            form={`edit-general-${row.id}`}
            disabled={pending}
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

function DeleteGeneralButton({ categoryId }: { categoryId: number }) {
  const [state, formAction, pending] = useActionState(
    deleteCategory,
    initialState
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="kind" value="expense" />
      <input type="hidden" name="category_id" value={categoryId} />
      {state.error && (
        <span className="sr-only" role="alert">
          {state.error}
        </span>
      )}
      <Button
        type="submit"
        variant="ghost"
        size="icon-sm"
        disabled={pending}
        aria-label="Delete general category"
      >
        {pending ? <Loader2 className="animate-spin" /> : <Trash2Icon />}
      </Button>
    </form>
  );
}

function AddSpecificDialog({
  generals,
}: {
  generals: ExpenseGeneralCategory[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    createExpenseSubcategory,
    initialState
  );

  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  const disabled = generals.length === 0;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button type="button" variant="outline" disabled={disabled} />
        }
      >
        <PlusIcon />
        Add specific category
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Add specific category</AlertDialogTitle>
          <AlertDialogDescription>
            Belongs under a general category (e.g. Water Bill under Utilities).
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form action={formAction} id="add-specific-cat" className="space-y-4">
          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="specific-general">General category</Label>
            <select
              id="specific-general"
              name="expense_category_id"
              required
              className={selectClassName}
              defaultValue={generals[0]?.id ?? ""}
            >
              {generals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="specific-name">Specific category name</Label>
            <Input
              id="specific-name"
              name="subcategory_name"
              required
              placeholder="e.g. Water Bill"
            />
          </div>
        </form>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button type="submit" form="add-specific-cat" disabled={pending}>
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

function EditSpecificDialog({
  row,
  generals,
}: {
  row: ExpenseSpecificCategory;
  generals: ExpenseGeneralCategory[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    updateExpenseSubcategory,
    initialState
  );

  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  const generalName =
    generals.find((g) => g.id === row.expense_category_id)?.name ?? "—";

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Edit specific category"
          />
        }
      >
        <PencilIcon />
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Edit specific category</AlertDialogTitle>
          <AlertDialogDescription>
            Under general category: {generalName}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form
          action={formAction}
          id={`edit-specific-${row.subcategory_id}`}
          className="space-y-4"
        >
          <input type="hidden" name="subcategory_id" value={row.subcategory_id} />
          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor={`edit-specific-name-${row.subcategory_id}`}>
              Name
            </Label>
            <Input
              id={`edit-specific-name-${row.subcategory_id}`}
              name="subcategory_name"
              required
              defaultValue={row.subcategory_name}
            />
          </div>
        </form>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            type="submit"
            form={`edit-specific-${row.subcategory_id}`}
            disabled={pending}
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

function DeleteSpecificButton({ subcategoryId }: { subcategoryId: number }) {
  const [state, formAction, pending] = useActionState(
    deleteExpenseSubcategory,
    initialState
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="subcategory_id" value={subcategoryId} />
      {state.error && (
        <span className="sr-only" role="alert">
          {state.error}
        </span>
      )}
      <Button
        type="submit"
        variant="ghost"
        size="icon-sm"
        disabled={pending}
        aria-label="Delete specific category"
      >
        {pending ? <Loader2 className="animate-spin" /> : <Trash2Icon />}
      </Button>
    </form>
  );
}

export function ExpenseCategoryManager({
  generals,
  specifics,
}: {
  generals: ExpenseGeneralCategory[];
  specifics: ExpenseSpecificCategory[];
}) {
  const [query, setQuery] = useState("");

  const generalById = useMemo(() => {
    return new Map(generals.map((g) => [g.id, g.name]));
  }, [generals]);

  const filteredGenerals = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return generals;
    return generals.filter((g) => g.name.toLowerCase().includes(q));
  }, [generals, query]);

  const filteredSpecifics = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return specifics;
    return specifics.filter((s) => {
      const general = generalById.get(s.expense_category_id) ?? "";
      return (
        s.subcategory_name.toLowerCase().includes(q) ||
        general.toLowerCase().includes(q)
      );
    });
  }, [specifics, query, generalById]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search categories…"
          className="w-[220px]"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <section className="space-y-4 rounded-xl border p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight">
                General categories
              </h2>
              <p className="text-sm text-muted-foreground">
                Create these first. Also used for budget allocation.
              </p>
            </div>
            <AddGeneralDialog />
          </div>

          {filteredGenerals.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No general categories yet. Add one (e.g. Utilities) before adding
              specific categories.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-[88px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGenerals.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <EditGeneralDialog row={row} />
                        <DeleteGeneralButton categoryId={row.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>

        <section className="space-y-4 rounded-xl border p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight">
                Specific categories
              </h2>
              <p className="text-sm text-muted-foreground">
                Belong under a general (e.g. Water Bill under Utilities).
              </p>
            </div>
            <AddSpecificDialog generals={generals} />
          </div>

          {filteredSpecifics.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {generals.length === 0
                ? "Add a general category first, then add specific categories."
                : "No specific categories yet."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>General</TableHead>
                  <TableHead>Specific</TableHead>
                  <TableHead className="w-[88px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSpecifics.map((row) => (
                  <TableRow key={row.subcategory_id}>
                    <TableCell>
                      {generalById.get(row.expense_category_id) || "—"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {row.subcategory_name}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <EditSpecificDialog row={row} generals={generals} />
                        <DeleteSpecificButton
                          subcategoryId={row.subcategory_id}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>
      </div>
    </div>
  );
}
