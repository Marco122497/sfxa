"use client";

import { useMemo, useState } from "react";
import { Loader2, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";

import { useServerAction } from "@/hooks/use-refresh-on-success";
import {
  createDonation,
  deleteDonation,
  updateDonation,
  type FinanceActionState,
} from "@/app/actions/finance";
import { formatDate, formatMoney } from "@/lib/format";
import {
  incomeRecordCopy,
  type IncomeRecordCopy,
} from "@/lib/income-categories";
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

function copyFromProps(
  mode: DonationManagerMode,
  categoryCode?: string,
  categoryName?: string
) {
  return incomeRecordCopy(
    categoryCode ?? (mode === "collection" ? "collection" : "donation"),
    categoryName ?? (mode === "collection" ? "Collections" : "Donations")
  );
}

function RecordKindFields({ copy }: { copy: IncomeRecordCopy }) {
  return (
    <>
      <input type="hidden" name="record_kind" value={copy.kind} />
      <input type="hidden" name="record_name" value={copy.plural} />
    </>
  );
}

function DonationFormFields({
  categories,
  defaults,
  idPrefix,
  copy,
}: {
  categories: DonationCategory[];
  defaults?: Partial<DonationRow>;
  idPrefix: string;
  copy: IncomeRecordCopy;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const showDonor = copy.showDonor;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <RecordKindFields copy={copy} />
      {showDonor ? (
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-donor`}>Donor name</Label>
          <Input
            id={`${idPrefix}-donor`}
            name="donor_name"
            defaultValue={defaults?.donor_name ?? ""}
          />
        </div>
      ) : (
        <input type="hidden" name="donor_name" value="" />
      )}
      <div className={`space-y-2${showDonor ? "" : " sm:col-span-2"}`}>
        <Label htmlFor={`${idPrefix}-category`}>{copy.typeLabel}</Label>
        <select
          id={`${idPrefix}-category`}
          name="category_id"
          required
          defaultValue={defaults?.category_id ?? categories[0]?.category_id ?? ""}
          className={selectClassName}
          disabled={categories.length === 0}
        >
          {categories.length === 0 ? (
            <option value="">No types configured</option>
          ) : null}
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
          placeholder={copy.remarksPlaceholder}
        />
      </div>
    </div>
  );
}

function AddDonationDialog({
  categories,
  defaultCategoryId,
  copy,
}: {
  categories: DonationCategory[];
  defaultCategoryId?: number;
  copy: IncomeRecordCopy;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useServerAction(createDonation, initialState, () => setOpen(false));
  const formId = `add-${copy.formKey}-form`;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button type="button" />}>
        <PlusIcon />
        {copy.addLabel}
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>{copy.addLabel}</AlertDialogTitle>
          <AlertDialogDescription>{copy.addDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <form action={formAction} id={formId} className="space-y-4">
          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          {categories.length === 0 ? (
            <Alert>
              <AlertDescription>{copy.noTypesMessage}</AlertDescription>
            </Alert>
          ) : (
            <DonationFormFields
              categories={categories}
              idPrefix={`add-${copy.formKey}`}
              copy={copy}
              defaults={{
                category_id: defaultCategoryId ?? categories[0]?.category_id,
              }}
            />
          )}
        </form>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            type="submit"
            form={formId}
            disabled={pending || categories.length === 0}
          >
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
  copy,
}: {
  row: DonationRow;
  categories: DonationCategory[];
  copy: IncomeRecordCopy;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useServerAction(updateDonation, initialState, () => setOpen(false));


  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={copy.editLabel}
          />
        }
      >
        <PencilIcon />
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>{copy.editLabel}</AlertDialogTitle>
          <AlertDialogDescription>{copy.editDescription}</AlertDialogDescription>
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
            key={JSON.stringify(row)}
            categories={
              row.category_id &&
              !categories.some((item) => item.category_id === row.category_id)
                ? [
                    ...categories,
                    {
                      category_id: row.category_id,
                      category_name: row.category_name || "Inactive type",
                    },
                  ]
                : categories
            }
            idPrefix={`edit-${row.donation_id}`}
            copy={copy}
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
  copy,
  label,
}: {
  donationId: number;
  copy: IncomeRecordCopy;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useServerAction(deleteDonation, initialState, () => setOpen(false));
  const formId = `delete-${copy.formKey}-${donationId}`;


  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Delete ${copy.singular}`}
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
            <AlertDialogTitle>{copy.deleteTitle}</AlertDialogTitle>
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
            <input type="hidden" name="donation_id" value={donationId} />
            <RecordKindFields copy={copy} />
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

export function DonationManager({
  donations,
  categories,
  defaultCategoryId,
  title,
  emptyMessage,
  mode = "donation",
  categoryCode,
  categoryName,
  canEdit = false,
  canDelete = false,
}: {
  donations: DonationRow[];
  categories: DonationCategory[];
  defaultCategoryId?: number;
  title?: string;
  emptyMessage?: string;
  mode?: DonationManagerMode;
  categoryCode?: string;
  categoryName?: string;
  canEdit?: boolean;
  canDelete?: boolean;
}) {
  const [query, setQuery] = useState("");
  const copy = copyFromProps(mode, categoryCode, categoryName);
  const showDonor = copy.showDonor;
  const showActions = canEdit || canDelete;
  const heading = title ?? copy.plural.replace(/\b\w/g, (letter) => letter.toUpperCase());
  const rows = showDonor
    ? donations
    : donations.map((row) => ({ ...row, donor_name: null }));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      const haystack = [
        showDonor ? row.donor_name : null,
        row.category_name,
        row.remarks,
        String(row.amount),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [rows, query, showDonor]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold tracking-tight">{heading}</h2>
          <p className="text-xs text-muted-foreground">
            {filtered.length} record{filtered.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.searchPlaceholder}
            className="h-8 w-[200px]"
          />
          <AddDonationDialog
            categories={categories}
            defaultCategoryId={defaultCategoryId}
            copy={copy}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-2 text-sm text-muted-foreground">
          {emptyMessage ?? copy.emptyMessage}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="h-8 px-2">Date</TableHead>
              {showDonor && (
                <TableHead className="h-8 px-2">Donor</TableHead>
              )}
              <TableHead className="h-8 px-2">
                {showDonor ? "Category" : "Type"}
              </TableHead>
              <TableHead className="h-8 px-2">Remarks</TableHead>
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
              <TableRow key={row.donation_id}>
                <TableCell className="px-2 py-1.5">
                  {formatDate(row.donation_date)}
                </TableCell>
                {showDonor && (
                  <TableCell className="px-2 py-1.5">
                    {row.donor_name || "—"}
                  </TableCell>
                )}
                <TableCell className="px-2 py-1.5">
                  {row.category_name || "—"}
                </TableCell>
                <TableCell className="max-w-[200px] truncate px-2 py-1.5">
                  {row.remarks || "—"}
                </TableCell>
                <TableCell className="px-2 py-1.5 text-right tabular-nums">
                  {formatMoney(row.amount)}
                </TableCell>
                {showActions ? (
                  <TableCell className="px-2 py-1.5">
                    <div className="flex justify-end gap-1">
                      {canEdit ? (
                        <EditDonationDialog
                          row={row}
                          categories={categories}
                          copy={copy}
                        />
                      ) : null}
                      {canDelete ? (
                        <DeleteDonationButton
                          donationId={row.donation_id}
                          copy={copy}
                          label={`${formatMoney(row.amount)} · ${row.category_name || "Uncategorized"} · ${formatDate(row.donation_date)}`}
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
