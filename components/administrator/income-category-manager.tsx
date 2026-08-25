"use client";

import { useMemo, useState } from "react";
import { Loader2, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import {
  createIncomeCategory,
  deleteIncomeCategory,
  updateIncomeCategory,
  type IncomeCategoryActionState,
} from "@/app/actions/income-categories";
import { useServerAction } from "@/hooks/use-refresh-on-success";
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

const initialState: IncomeCategoryActionState = {};

const textareaClassName =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export type IncomeCategoryRow = {
  income_category_id: number;
  category_code: string;
  category_name: string;
  description: string | null;
  service_count: number;
};

function AddIncomeCategoryDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useServerAction(
    createIncomeCategory,
    initialState,
    () => setOpen(false)
  );

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button type="button" />}>
        <PlusIcon />
        Add income category
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Add income category</AlertDialogTitle>
          <AlertDialogDescription>
            Main classification of money received. Add income services under it
            afterward.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form action={formAction} id="add-income-category" className="space-y-4">
          {state.error ? (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="add-income-category-name">Name</Label>
            <Input
              id="add-income-category-name"
              name="category_name"
              required
              placeholder="e.g. Donations"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="add-income-category-description">
              Description (optional)
            </Label>
            <textarea
              id="add-income-category-description"
              name="description"
              rows={3}
              className={textareaClassName}
              placeholder="How this category is used"
            />
          </div>
        </form>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button type="submit" form="add-income-category" disabled={pending}>
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

function EditIncomeCategoryDialog({ row }: { row: IncomeCategoryRow }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useServerAction(
    updateIncomeCategory,
    initialState,
    () => setOpen(false)
  );
  const formId = `edit-income-category-${row.income_category_id}`;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Edit income category"
          />
        }
      >
        <PencilIcon />
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Edit income category</AlertDialogTitle>
          <AlertDialogDescription>
            Update the display name or description. Existing income services
            stay linked.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form action={formAction} id={formId} className="space-y-4">
          <input
            type="hidden"
            name="income_category_id"
            value={row.income_category_id}
          />
          {state.error ? (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor={`${formId}-name`}>Name</Label>
            <Input
              key={row.category_name}
              id={`${formId}-name`}
              name="category_name"
              required
              defaultValue={row.category_name}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${formId}-description`}>
              Description (optional)
            </Label>
            <textarea
              key={row.description ?? ""}
              id={`${formId}-description`}
              name="description"
              rows={3}
              className={textareaClassName}
              defaultValue={row.description ?? ""}
            />
          </div>
        </form>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button type="submit" form={formId} disabled={pending}>
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

function DeleteIncomeCategoryButton({ row }: { row: IncomeCategoryRow }) {
  const [open, setOpen] = useState(false);
  const [, formAction, pending] = useServerAction(
    async (prev, formData) => {
      const result = await deleteIncomeCategory(prev, formData);
      if (result.error) {
        toast.error(result.error);
        setOpen(false);
      }
      return result;
    },
    initialState,
    () => setOpen(false)
  );
  const formId = `delete-income-category-${row.income_category_id}`;

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Delete income category"
        title={
          row.service_count > 0
            ? "Move or delete income services first"
            : "Delete income category"
        }
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
            <AlertDialogTitle>Delete income category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove “{row.category_name}”. Income
              services under it must be moved or deleted first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form action={formAction} id={formId}>
            <input
              type="hidden"
              name="income_category_id"
              value={row.income_category_id}
            />
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

export function IncomeCategoryManager({
  categories,
}: {
  categories: IncomeCategoryRow[];
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (row) =>
        row.category_name.toLowerCase().includes(q) ||
        (row.description ?? "").toLowerCase().includes(q)
    );
  }, [categories, query]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold tracking-tight">
            Income categories
          </h2>
          <p className="text-xs text-muted-foreground">
            {filtered.length} categor{filtered.length === 1 ? "y" : "ies"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search income categories…"
            className="h-8 w-[220px]"
          />
          <AddIncomeCategoryDialog />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-2 text-sm text-muted-foreground">
          No income categories yet.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="h-8 px-2">Name</TableHead>
              <TableHead className="h-8 px-2">Description</TableHead>
              <TableHead className="h-8 px-2 text-right">Services</TableHead>
              <TableHead className="h-8 w-[88px] px-2" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => (
              <TableRow key={row.income_category_id}>
                <TableCell className="px-2 py-1.5 font-medium">
                  {row.category_name}
                </TableCell>
                <TableCell className="px-2 py-1.5 text-muted-foreground">
                  {row.description || "—"}
                </TableCell>
                <TableCell className="px-2 py-1.5 text-right tabular-nums">
                  {row.service_count}
                </TableCell>
                <TableCell className="px-2 py-1.5">
                  <div className="flex justify-end gap-1">
                    <EditIncomeCategoryDialog row={row} />
                    <DeleteIncomeCategoryButton row={row} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
