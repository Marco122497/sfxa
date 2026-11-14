"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { useServerAction } from "@/hooks/use-refresh-on-success";
import { RowActionsDialog } from "@/components/layout/row-actions-dialog";
import {
  createDonation,
  deleteDonation,
  updateDonation,
  type FinanceActionState,
} from "@/app/actions/finance";
import { PrintOfficialReceiptButton } from "@/components/finance/official-receipt-document";
import {
  formatDate,
  formatMoney,
  formatTime,
  HOURLY_TIMES,
  parishTomorrow,
  scheduleHourKey,
  toDateTimeLocal,
} from "@/lib/format";
import { feeForYear, type ChurchServiceFee } from "@/lib/service-fees";
import { formatTypeLabel } from "@/lib/income-access";
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
  or_number?: string | null;
  payment_method?: string | null;
  paid_time?: string | null;
  service_at?: string | null;
  priest_name?: string | null;
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
  suggestedOrNumber = "",
  transactionLimit = 0,
  enforceLimit = false,
  serviceFees = [],
  onBlockedChange,
  recordNow = false,
  bookedSchedules = [],
}: {
  categories: DonationCategory[];
  defaults?: Partial<DonationRow>;
  idPrefix: string;
  copy: IncomeRecordCopy;
  suggestedOrNumber?: string;
  transactionLimit?: number;
  enforceLimit?: boolean;
  serviceFees?: ChurchServiceFee[];
  onBlockedChange?: (blocked: boolean) => void;
  recordNow?: boolean;
  bookedSchedules?: { donationId: number; at: string }[];
}) {
  const showDonor = copy.showDonor;
  const church = copy.kind === "church_service";
  const [categoryId, setCategoryId] = useState(
    Number(defaults?.category_id ?? categories[0]?.category_id ?? 0)
  );
  const initialSchedule = toDateTimeLocal(defaults?.service_at);
  const [scheduleDate, setScheduleDate] = useState(initialSchedule.slice(0, 10));
  const [scheduleTime, setScheduleTime] = useState(initialSchedule.slice(11, 16));
  const schedule =
    scheduleDate && scheduleTime ? `${scheduleDate}T${scheduleTime}` : "";
  const earliestSchedule = parishTomorrow();
  const savedScheduleDate = initialSchedule.slice(0, 10);
  const savedScheduleTime = initialSchedule.slice(11, 16);
  const takenHours = new Set(
    bookedSchedules
      .filter((item) => item.donationId !== defaults?.donation_id)
      .map((item) => scheduleHourKey(item.at))
      .filter((key) => scheduleDate && key.startsWith(`${scheduleDate}T`))
  );
  const hourlyOptions = HOURLY_TIMES.map((slot) => ({
    ...slot,
    taken: takenHours.has(scheduleHourKey(`${scheduleDate}T${slot.value}`)),
  }));
  const timeOptions =
    savedScheduleTime && !HOURLY_TIMES.some((slot) => slot.value === savedScheduleTime)
      ? [
          { value: savedScheduleTime, label: savedScheduleTime, taken: false },
          ...hourlyOptions,
        ]
      : hourlyOptions;
  const [amount, setAmount] = useState(String(defaults?.amount ?? ""));
  const [donorName, setDonorName] = useState(defaults?.donor_name ?? "");
  const [priestName, setPriestName] = useState(defaults?.priest_name ?? "");
  const [paidDate, setPaidDate] = useState(
    () => defaults?.donation_date?.slice(0, 10) || new Date().toISOString().slice(0, 10)
  );
  const [orNumber, setOrNumber] = useState(() => defaults?.or_number || suggestedOrNumber);
  const [remarks, setRemarks] = useState(defaults?.remarks ?? "");
  const scheduleYear = schedule
    ? new Date(schedule).getFullYear()
    : new Date().getFullYear();
  const fee = church
    ? serviceFees.find((item) => item.categoryId === categoryId)
    : undefined;
  const automatic =
    fee != null ? feeForYear(fee.standardAmount, fee.adjustments, scheduleYear) : null;
  const amountValue =
    church && automatic != null && automatic > 0 ? String(automatic) : amount;
  const missingFee = church && (automatic == null || automatic <= 0);
  const overLimit =
    enforceLimit &&
    transactionLimit > 0 &&
    amountValue !== "" &&
    Math.round(Number(amountValue) * 100) > Math.round(transactionLimit * 100);

  useEffect(() => {
    onBlockedChange?.(overLimit || missingFee);
  }, [missingFee, onBlockedChange, overLimit]);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <RecordKindFields copy={copy} />
      {showDonor ? (
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-donor`}>Donor name</Label>
          <Input
            id={`${idPrefix}-donor`}
            name="donor_name"
            value={donorName}
            onChange={(event) => setDonorName(event.target.value)}
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
          value={categoryId || ""}
          onChange={(event) => setCategoryId(Number(event.target.value))}
          className={selectClassName}
          disabled={categories.length === 0}
        >
          {categories.length === 0 ? (
            <option value="">No types configured</option>
          ) : null}
          {categories.map((category) => (
            <option key={category.category_id} value={category.category_id}>
              {formatTypeLabel(category.category_name)}
            </option>
          ))}
        </select>
      </div>
      {church ? (
        <>
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-schedule-date`}>Schedule date</Label>
            <Input
              id={`${idPrefix}-schedule-date`}
              type="date"
              required
              min={
                savedScheduleDate && savedScheduleDate < earliestSchedule
                  ? savedScheduleDate
                  : earliestSchedule
              }
              value={scheduleDate}
              onChange={(event) => {
                const next = event.target.value;
                if (
                  next &&
                  next < earliestSchedule &&
                  next !== savedScheduleDate
                ) {
                  return;
                }
                setScheduleDate(next);
                setScheduleTime((current) => {
                  const key = scheduleHourKey(`${next}T${current}`);
                  const taken = bookedSchedules.some(
                    (item) =>
                      item.donationId !== defaults?.donation_id &&
                      scheduleHourKey(item.at) === key
                  );
                  return taken ? "" : current;
                });
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-schedule-time`}>Schedule time</Label>
            <select
              id={`${idPrefix}-schedule-time`}
              required
              value={scheduleTime}
              onChange={(event) => setScheduleTime(event.target.value)}
              className={selectClassName}
            >
              <option value="">Select time</option>
              {timeOptions.map((slot) => (
                <option key={slot.value} value={slot.value} disabled={slot.taken}>
                  {slot.taken ? `${slot.label} — booked` : slot.label}
                </option>
              ))}
            </select>
          </div>
          <input type="hidden" name="service_at" value={schedule} />
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-priest`}>Priest</Label>
            <Input
              id={`${idPrefix}-priest`}
              name="priest_name"
              required
              value={priestName}
              onChange={(event) => setPriestName(event.target.value)}
              placeholder="Priest assigned to this service"
            />
          </div>
        </>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-amount`}>Amount</Label>
        <Input
          id={`${idPrefix}-amount`}
          name="amount"
          type="number"
          min="0.01"
          step="0.01"
          required
          readOnly={church}
          value={church ? amountValue : amount}
          onChange={(event) => {
            if (!church) setAmount(event.target.value);
          }}
        />
        {church && automatic != null && automatic > 0 ? (
          <p className="text-xs text-muted-foreground">
            {scheduleYear} fee {formatMoney(automatic)} is applied automatically.
          </p>
        ) : null}
        {missingFee ? (
          <p className="text-xs text-destructive" role="alert">
            Set the fee for this church service in Income Services before recording a payment.
          </p>
        ) : null}
        {overLimit ? (
          <p className="text-xs text-destructive" role="alert">
            Amount cannot exceed the transaction limit of{" "}
            {formatMoney(transactionLimit)}. An administrator must record it.
          </p>
        ) : null}
      </div>
      {recordNow ? null : (
        <>
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-date`}>Date</Label>
            <Input
              id={`${idPrefix}-date`}
              name="donation_date"
              type="date"
              required
              value={paidDate}
              onChange={(event) => setPaidDate(event.target.value)}
            />
          </div>
          <input
            type="hidden"
            name="paid_time"
            value={defaults?.paid_time?.slice(0, 5) ?? ""}
          />
        </>
      )}
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-or`}>OR number</Label>
        <Input
          id={`${idPrefix}-or`}
          name="or_number"
          required
          maxLength={40}
          value={orNumber}
          onChange={(event) => setOrNumber(event.target.value)}
          placeholder={suggestedOrNumber || "OR-2026-0001"}
        />
      </div>
      <input type="hidden" name="payment_method" value="Cash" />
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor={`${idPrefix}-remarks`}>Remarks</Label>
        <Input
          id={`${idPrefix}-remarks`}
          name="remarks"
          value={remarks}
          onChange={(event) => setRemarks(event.target.value)}
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
  suggestedOrNumber,
  transactionLimit,
  enforceLimit,
  serviceFees = [],
  bookedSchedules = [],
}: {
  categories: DonationCategory[];
  defaultCategoryId?: number;
  copy: IncomeRecordCopy;
  suggestedOrNumber: string;
  transactionLimit: number;
  enforceLimit: boolean;
  serviceFees?: ChurchServiceFee[];
  bookedSchedules?: { donationId: number; at: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const [state, formAction, pending] = useServerAction(createDonation, initialState, () => setOpen(false));
  const formId = `add-${copy.formKey}-form`;

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setFormKey((current) => current + 1);
      }}
    >
      <AlertDialogTrigger render={<Button type="button" />}>
        <PlusIcon />
        {copy.addLabel}
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>{copy.addLabel}</AlertDialogTitle>
          <AlertDialogDescription>{copy.addDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <form
          action={formAction}
          id={formId}
          className="space-y-4"
          onSubmit={(event) => {
            if (blocked) event.preventDefault();
          }}
        >
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
              key={formKey}
              categories={categories}
              idPrefix={`add-${copy.formKey}`}
              copy={copy}
              suggestedOrNumber={suggestedOrNumber}
              transactionLimit={transactionLimit}
              enforceLimit={enforceLimit}
              serviceFees={serviceFees}
              onBlockedChange={setBlocked}
              recordNow
              bookedSchedules={bookedSchedules}
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
            disabled={pending || blocked || categories.length === 0}
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
  suggestedOrNumber,
  serviceFees = [],
  bookedSchedules = [],
}: {
  row: DonationRow;
  categories: DonationCategory[];
  copy: IncomeRecordCopy;
  suggestedOrNumber: string;
  serviceFees?: ChurchServiceFee[];
  bookedSchedules?: { donationId: number; at: string }[];
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
            suggestedOrNumber={suggestedOrNumber}
            serviceFees={serviceFees}
            bookedSchedules={bookedSchedules}
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
  const [, formAction, pending] = useServerAction(
    async (prev, formData) => {
      const result = await deleteDonation(prev, formData);
      if (result.error) {
        toast.error(result.error);
        setOpen(false);
      }
      return result;
    },
    initialState,
    () => setOpen(false)
  );
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
  suggestedOrNumber = "",
  transactionLimit = 0,
  enforceLimit = false,
  serviceFees = [],
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
  suggestedOrNumber?: string;
  transactionLimit?: number;
  enforceLimit?: boolean;
  serviceFees?: ChurchServiceFee[];
}) {
  const [query, setQuery] = useState("");
  const copy = copyFromProps(mode, categoryCode, categoryName);
  const showDonor = copy.showDonor;
  const bookedSchedules = donations
    .filter((row) => row.service_at)
    .map((row) => ({
      donationId: row.donation_id,
      at: toDateTimeLocal(row.service_at),
    }))
    .filter((row) => row.at);
  const church = copy.kind === "church_service";
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
        formatTypeLabel(row.category_name),
        row.remarks,
        row.or_number,
        row.payment_method,
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
            suggestedOrNumber={suggestedOrNumber}
            transactionLimit={transactionLimit}
            enforceLimit={enforceLimit}
            serviceFees={serviceFees}
            bookedSchedules={bookedSchedules}
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
              {church ? <TableHead className="h-8 px-2">Schedule</TableHead> : null}
              {church ? <TableHead className="h-8 px-2">Priest</TableHead> : null}
              <TableHead className="h-8 px-2">OR No.</TableHead>
              {showDonor && (
                <TableHead className="h-8 px-2">Donor</TableHead>
              )}
              <TableHead className="h-8 px-2">
                {showDonor ? "Category" : "Type"}
              </TableHead>
              <TableHead className="h-8 px-2">Remarks</TableHead>
              <TableHead className="h-8 px-2 text-right">Amount</TableHead>
              <TableHead className="h-8 w-12 px-2">
                <span className="sr-only">Official receipt</span>
              </TableHead>
              {showActions ? (
                <TableHead className="h-8 w-12 px-2">
                  <span className="sr-only">Actions</span>
                </TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => (
              <TableRow key={row.donation_id}>
                <TableCell className="px-2 py-1.5 whitespace-nowrap">
                  {formatDate(row.donation_date)}
                  {formatTime(row.paid_time)
                    ? ` ${formatTime(row.paid_time)}`
                    : ""}
                </TableCell>
                {church ? (
                  <TableCell className="px-2 py-1.5">
                    {row.service_at
                      ? `${formatDate(row.service_at)} ${formatTime(row.service_at)}`
                      : "—"}
                  </TableCell>
                ) : null}
                {church ? (
                  <TableCell className="px-2 py-1.5">
                    {row.priest_name || "—"}
                  </TableCell>
                ) : null}
                <TableCell className="px-2 py-1.5">{row.or_number || "—"}</TableCell>
                {showDonor && (
                  <TableCell className="px-2 py-1.5">
                    {row.donor_name || "—"}
                  </TableCell>
                )}
                <TableCell className="px-2 py-1.5">
                  {formatTypeLabel(row.category_name) || "—"}
                </TableCell>
                <TableCell className="max-w-[200px] truncate px-2 py-1.5">
                  {row.remarks || "—"}
                </TableCell>
                <TableCell className="px-2 py-1.5 text-right tabular-nums">
                  {formatMoney(row.amount)}
                </TableCell>
                <TableCell className="px-2 py-1.5">
                  <PrintOfficialReceiptButton
                    receipt={
                      row.or_number
                        ? {
                            orNumber: row.or_number,
                            date: formatTime(row.paid_time)
                              ? `${formatDate(row.donation_date)} ${formatTime(row.paid_time)}`
                              : formatDate(row.donation_date),
                            receivedFrom: row.donor_name?.trim() || "Parish",
                            particulars: formatTypeLabel(row.category_name) || "Parish payment",
                            amount: formatMoney(row.amount),
                            schedule: row.service_at
                              ? `${formatDate(row.service_at)} ${formatTime(row.service_at)}`.trim()
                              : null,
                            priest: row.priest_name?.trim() || null,
                          }
                        : null
                    }
                  />
                </TableCell>
                {showActions ? (
                  <TableCell className="px-2 py-1.5">
                    <RowActionsDialog
                      label={`${formatTypeLabel(row.category_name) || "Record"} · ${formatMoney(row.amount)}`}
                    >
                      {canEdit ? (
                        <EditDonationDialog
                          row={row}
                          categories={categories}
                          copy={copy}
                          suggestedOrNumber={suggestedOrNumber}
                          serviceFees={serviceFees}
                          bookedSchedules={bookedSchedules}
                        />
                      ) : null}
                      {canDelete ? (
                        <DeleteDonationButton
                          donationId={row.donation_id}
                          copy={copy}
                          label={`${formatMoney(row.amount)} · ${formatTypeLabel(row.category_name) || "Uncategorized"} · ${formatDate(row.donation_date)}`}
                        />
                      ) : null}
                    </RowActionsDialog>
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
