"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Loader2, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";

import {
  createDonation,
  deleteDonation,
  updateDonation,
  type FinanceActionState,
} from "@/app/actions/finance";
import { formatDate, formatMoney } from "@/lib/format";
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

const initialState: FinanceActionState = {};

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export type DonationCategory = {
  category_id: number;
  category_name: string;
};

export type DonationRow = {
  donation_id: number;
  donor_name: string | null;
  category_id: number | null;
  amount: number | string;
  donation_date: string;
  remarks: string | null;
  category_name: string | null;
};

export type DonationManagerMode = "donation" | "collection";

function DonationFormFields({
  categories,
  defaults,
  idPrefix,
  mode,
}: {
  categories: DonationCategory[];
  defaults?: Partial<DonationRow>;
  idPrefix: string;
  mode: DonationManagerMode;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const isCollection = mode === "collection";

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {isCollection ? (
        <input type="hidden" name="donor_name" value="" />
      ) : (
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-donor`}>Donor name</Label>
          <Input
            id={`${idPrefix}-donor`}
            name="donor_name"
            defaultValue={defaults?.donor_name ?? ""}
          />
        </div>
      )}
      <div className={`space-y-2${isCollection ? " sm:col-span-2" : ""}`}>
        <Label htmlFor={`${idPrefix}-category`}>
          {isCollection ? "Collection type" : "Category"}
        </Label>
        <select
          id={`${idPrefix}-category`}
          name="category_id"
          required
          defaultValue={defaults?.category_id ?? categories[0]?.category_id ?? ""}
          className={selectClassName}
        >
          {categories.map((category) => (
            <option key={category.category_id} value={category.category_id}>
              {category.category_name}
            </option>
          ))}
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
          defaultValue={defaults?.amount ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-date`}>Date</Label>
        <Input
          id={`${idPrefix}-date`}
          name="donation_date"
          type="date"
          required
          defaultValue={defaults?.donation_date ?? today}
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor={`${idPrefix}-remarks`}>Remarks</Label>
        <Input
          id={`${idPrefix}-remarks`}
          name="remarks"
          defaultValue={defaults?.remarks ?? ""}
          placeholder={
            isCollection ? "Optional notes (e.g. envelope count)" : undefined
          }
        />
      </div>
    </div>
  );
}

function AddDonationDialog({
  categories,
  defaultCategoryId,
  mode,
}: {
  categories: DonationCategory[];
  defaultCategoryId?: number;
  mode: DonationManagerMode;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    createDonation,
    initialState
  );
  const isCollection = mode === "collection";

  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button type="button" />}>
        <PlusIcon />
        {isCollection ? "Add collection" : "Add donation"}
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isCollection ? "Add collection" : "Add donation"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isCollection
              ? "Choose the collection type (e.g. Sunday 1st or 2nd Mass), then enter the amount."
              : "Record a donation entry."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form action={formAction} id="add-donation-form" className="space-y-4">
          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          <DonationFormFields
            categories={categories}
            idPrefix="add"
            mode={mode}
            defaults={{
              category_id: defaultCategoryId ?? categories[0]?.category_id,
            }}
          />
        </form>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button type="submit" form="add-donation-form" disabled={pending}>
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

function EditDonationDialog({
  row,
  categories,
  mode,
}: {
  row: DonationRow;
  categories: DonationCategory[];
  mode: DonationManagerMode;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    updateDonation,
    initialState
  );
  const isCollection = mode === "collection";

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
            aria-label={isCollection ? "Edit collection" : "Edit donation"}
          />
        }
      >
        <PencilIcon />
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isCollection ? "Edit collection" : "Edit donation"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isCollection
              ? "Update collection details."
              : "Update donation details."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form
          action={formAction}
          id={`edit-donation-${row.donation_id}`}
          className="space-y-4"
        >
          <input type="hidden" name="donation_id" value={row.donation_id} />
          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          <DonationFormFields
            categories={categories}
            idPrefix={`edit-${row.donation_id}`}
            mode={mode}
            defaults={row}
          />
        </form>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            type="submit"
            form={`edit-donation-${row.donation_id}`}
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

function DeleteDonationButton({
  donationId,
  mode,
}: {
  donationId: number;
  mode: DonationManagerMode;
}) {
  const [state, formAction, pending] = useActionState(
    deleteDonation,
    initialState
  );
  const isCollection = mode === "collection";

  return (
    <form action={formAction}>
      <input type="hidden" name="donation_id" value={donationId} />
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
        aria-label={isCollection ? "Delete collection" : "Delete donation"}
      >
        {pending ? <Loader2 className="animate-spin" /> : <Trash2Icon />}
      </Button>
    </form>
  );
}

export function DonationManager({
  donations,
  categories,
  defaultCategoryId,
  title = "Donations",
  emptyMessage = "No donations yet.",
  mode = "donation",
}: {
  donations: DonationRow[];
  categories: DonationCategory[];
  defaultCategoryId?: number;
  title?: string;
  emptyMessage?: string;
  mode?: DonationManagerMode;
}) {
  const [query, setQuery] = useState("");
  const isCollection = mode === "collection";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return donations;
    return donations.filter((row) => {
      const haystack = [
        !isCollection ? row.donor_name : null,
        row.category_name,
        row.remarks,
        String(row.amount),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [donations, query, isCollection]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground">
            {filtered.length} record{filtered.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={
              isCollection ? "Search collections…" : "Search donations…"
            }
            className="w-[220px]"
          />
          <AddDonationDialog
            categories={categories}
            defaultCategoryId={defaultCategoryId}
            mode={mode}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              {!isCollection && <TableHead>Donor</TableHead>}
              <TableHead>{isCollection ? "Type" : "Category"}</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-[88px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => (
              <TableRow key={row.donation_id}>
                <TableCell>{formatDate(row.donation_date)}</TableCell>
                {!isCollection && (
                  <TableCell>{row.donor_name || "—"}</TableCell>
                )}
                <TableCell>{row.category_name || "—"}</TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {row.remarks || "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(row.amount)}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <EditDonationDialog
                      row={row}
                      categories={categories}
                      mode={mode}
                    />
                    <DeleteDonationButton
                      donationId={row.donation_id}
                      mode={mode}
                    />
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
