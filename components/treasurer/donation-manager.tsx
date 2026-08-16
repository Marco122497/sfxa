"use client";

import { useActionState, useMemo, useState } from "react";
import { Loader2, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";

import { useRefreshOnSuccess } from "@/hooks/use-refresh-on-success";
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
          {isCollection ? "Collection type" : "Donation type"}
        </Label>
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

  useRefreshOnSuccess(state.success, () => setOpen(false));

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
              ? "Choose a collection type from Income Services, then enter the amount."
              : "Choose a donation type from Income Services, then enter the amount."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form action={formAction} id="add-donation-form" className="space-y-4">
          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          {categories.length === 0 ? (
            <Alert>
              <AlertDescription>
                No {isCollection ? "collection" : "donation"} types found.
                Add them under Categories → Income Services first.
              </AlertDescription>
            </Alert>
          ) : (
            <DonationFormFields
              categories={categories}
              idPrefix="add"
              mode={mode}
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
            form="add-donation-form"
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

  useRefreshOnSuccess(state.success, () => setOpen(false));

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
  label,
}: {
  donationId: number;
  mode: DonationManagerMode;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    deleteDonation,
    initialState
  );
  const isCollection = mode === "collection";
  const entity = isCollection ? "collection" : "donation";
  const formId = `delete-donation-${donationId}`;

  useRefreshOnSuccess(state.success, () => setOpen(false));

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Delete ${entity}`}
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
            <AlertDialogTitle>
              Delete {entity}?
            </AlertDialogTitle>
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
  title = "Donations",
  emptyMessage = "No donations yet.",
  mode = "donation",
  canEdit = false,
  canDelete = false,
}: {
  donations: DonationRow[];
  categories: DonationCategory[];
  defaultCategoryId?: number;
  title?: string;
  emptyMessage?: string;
  mode?: DonationManagerMode;
  canEdit?: boolean;
  canDelete?: boolean;
}) {
  const [query, setQuery] = useState("");
  const isCollection = mode === "collection";
  const showActions = canEdit || canDelete;

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
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          <p className="text-xs text-muted-foreground">
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
            className="h-8 w-[200px]"
          />
          <AddDonationDialog
            categories={categories}
            defaultCategoryId={defaultCategoryId}
            mode={mode}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-2 text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="h-8 px-2">Date</TableHead>
              {!isCollection && (
                <TableHead className="h-8 px-2">Donor</TableHead>
              )}
              <TableHead className="h-8 px-2">
                {isCollection ? "Type" : "Category"}
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
                {!isCollection && (
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
                          mode={mode}
                        />
                      ) : null}
                      {canDelete ? (
                        <DeleteDonationButton
                          donationId={row.donation_id}
                          mode={mode}
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
