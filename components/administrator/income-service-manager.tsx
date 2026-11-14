"use client";

import { useMemo, useState } from "react";
import {
  CircleOffIcon,
  Loader2,
  PencilIcon,
  PlusIcon,
  PowerIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import {
  createIncomeService,
  deleteIncomeService,
  toggleIncomeService,
  updateIncomeService,
  type IncomeServiceActionState,
} from "@/app/actions/income-services";
import { useServerAction } from "@/hooks/use-refresh-on-success";
import { RowActionsDialog } from "@/components/layout/row-actions-dialog";
import {
  INCOME_ACCESS_TYPES,
  incomeAccessTypeLabel,
  formatServiceDetail,
  formatTypeLabel,
  parseIncomeAccessType,
} from "@/lib/income-access";
import {
  ADDABLE_INCOME_CATEGORIES,
  incomeCategoryLabel,
} from "@/lib/income";
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
import { currentParishDateTime, formatMoney } from "@/lib/format";
import { feeForYear } from "@/lib/service-fees";
import { cn } from "@/lib/utils";

const initialState: IncomeServiceActionState = {};

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export type IncomeServiceRow = {
  service_id: number;
  service_name: string;
  category: string;
  is_active: boolean;
  standard_amount?: number | null;
  fee_years?: { year: number; adjustment: number }[];
};

export type IncomeCategoryOption = {
  code: string;
  name: string;
};

function categoryOptions(categories?: IncomeCategoryOption[]) {
  if (categories && categories.length > 0) return categories;
  return ADDABLE_INCOME_CATEGORIES.map((item) => ({
    code: item.id,
    name: item.label,
  }));
}

function categoryLabel(
  code: string,
  categories?: IncomeCategoryOption[]
) {
  return (
    categoryOptions(categories).find((item) => item.code === code)?.name ??
    incomeCategoryLabel(code)
  );
}

export function IncomeServiceManager({
  services,
  incomeCategories,
  initialCategory = "",
}: {
  services: IncomeServiceRow[];
  incomeCategories?: IncomeCategoryOption[];
  initialCategory?: string;
}) {
  const options = categoryOptions(incomeCategories);
  const defaultCategory = options.some((item) => item.code === initialCategory)
    ? initialCategory
    : "";
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState(defaultCategory);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return services.filter((service) => {
      if (filter && service.category !== filter) return false;
      if (!q) return true;
      return (
        service.service_name.toLowerCase().includes(q) ||
        categoryLabel(service.category, options).toLowerCase().includes(q) ||
        incomeAccessTypeLabel(
          parseIncomeAccessType(service.service_name).accessType
        )
          .toLowerCase()
          .includes(q)
      );
    });
  }, [filter, options, query, services]);

  const churchServices = filtered.filter(
    (service) => service.category === "church_service"
  );
  const otherServices = filtered.filter(
    (service) => service.category !== "church_service"
  );
  const showChurch = !filter || filter === "church_service";
  const showOther = !filter || filter !== "church_service";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold tracking-tight">
            Configurable income services
          </h2>
          <p className="text-xs text-muted-foreground">
            {filtered.length} service{filtered.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="h-8 min-w-[180px] rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none"
            aria-label="Filter by income category"
          >
            <option value="">All income categories</option>
            {options.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name}
              </option>
            ))}
          </select>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search services…"
            className="h-8 w-[180px]"
          />
          <AddServiceDialog
            defaultCategory={defaultCategory || options[0]?.code || "donation"}
            incomeCategories={options}
          />
        </div>
      </div>
      {showChurch ? (
        <ServiceTable
          title="Church services"
          description="These services use a standard fee."
          services={churchServices}
          options={options}
          showFee
          emptyMessage="No church services yet."
        />
      ) : null}
      {showOther ? (
        <ServiceTable
          title="Income services"
          services={otherServices}
          options={options}
          emptyMessage="No income services yet."
        />
      ) : null}
    </div>
  );
}

function ServiceTable({
  title,
  description,
  services,
  options,
  showFee = false,
  emptyMessage,
}: {
  title: string;
  description?: string;
  services: IncomeServiceRow[];
  options: IncomeCategoryOption[];
  showFee?: boolean;
  emptyMessage: string;
}) {
  return (
    <div className="space-y-2">
      <div>
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        <p className="text-xs text-muted-foreground">
          {description
            ? `${services.length} service${services.length === 1 ? "" : "s"} · ${description}`
            : `${services.length} service${services.length === 1 ? "" : "s"}`}
        </p>
      </div>
      {services.length === 0 ? (
        <p className="py-2 text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="h-8 px-2">Income Service</TableHead>
              {showFee ? null : (
                <TableHead className="h-8 px-2">Income Category</TableHead>
              )}
              {showFee ? (
                <TableHead className="h-8 px-2">Fee</TableHead>
              ) : null}
              <TableHead className="h-8 px-2">Status</TableHead>
              <TableHead className="h-8 w-12 px-2">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service) => {
              const { baseName, accessType } = parseIncomeAccessType(
                service.service_name
              );
              const displayName = formatServiceDetail(baseName);
              return (
                <TableRow key={service.service_id}>
                  <TableCell className="px-2 py-1.5 font-medium">
                    <IncomeServiceName
                      baseName={displayName}
                      accessType={accessType}
                    />
                  </TableCell>
                  {showFee ? null : (
                    <TableCell className="px-2 py-1.5">
                      {categoryLabel(service.category, options)}
                    </TableCell>
                  )}
                  {showFee ? (
                    <TableCell className="px-2 py-1.5 tabular-nums">
                      {service.standard_amount != null
                        ? formatMoney(service.standard_amount)
                        : "—"}
                    </TableCell>
                  ) : null}
                  <TableCell className="px-2 py-1.5">
                    {service.is_active ? "Active" : "Inactive"}
                  </TableCell>
                  <TableCell className="px-2 py-1.5">
                    <RowActionsDialog label={formatTypeLabel(service.service_name)}>
                      <EditServiceDialog
                        service={service}
                        incomeCategories={options}
                      />
                      <ToggleServiceDialog service={service} />
                      <DeleteServiceDialog service={service} />
                    </RowActionsDialog>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function IncomeServiceName({
  baseName,
  accessType,
}: {
  baseName: string;
  accessType: string;
}) {
  if (accessType !== "public" && accessType !== "private") {
    return <>{baseName}</>;
  }

  const isPublic = accessType === "public";
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span>{baseName}</span>
      <span
        className={cn(
          "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold tracking-wide",
          isPublic
            ? "bg-emerald-100 text-emerald-800"
            : "bg-slate-200 text-slate-800"
        )}
      >
        {isPublic ? "(Public)" : "(Private)"}
      </span>
    </span>
  );
}

function AccessTypeField({
  id,
  defaultValue = "",
}: {
  id: string;
  defaultValue?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Public or private</Label>
      <select
        id={id}
        name="access_type"
        defaultValue={defaultValue}
        className={selectClassName}
      >
        {INCOME_ACCESS_TYPES.map((item) => (
          <option key={item.id || "none"} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
      <p className="text-xs text-muted-foreground">
        Optional. Use this for services such as Wedding so the Treasurer can
        record a public wedding and a private wedding separately.
      </p>
    </div>
  );
}

function ChurchFeeFields({
  idPrefix,
  standardAmount,
  years,
}: {
  idPrefix: string;
  standardAmount?: number | null;
  years?: { year: number; adjustment: number }[];
}) {
  const [rows, setRows] = useState(() =>
    years?.map((row) => ({
      year: String(row.year),
      adjustment: row.adjustment === 0 ? "" : String(row.adjustment),
    })) ?? []
  );
  const standard = Number(standardAmount ?? 0);
  const currentYear = Number(currentParishDateTime().date.slice(0, 4));
  const nextYear = currentYear + 1;

  function nextOpenYear(list: { year: string }[]) {
    const taken = new Set(list.map((row) => Number(row.year)));
    let year = nextYear;
    while (taken.has(year) && year < 2100) year += 1;
    return year;
  }

  const savedYears = rows.map((row) => ({
    year: Number(row.year),
    adjustment:
      row.adjustment === "" || row.adjustment === "-" || row.adjustment === "."
        ? 0
        : Number(row.adjustment),
  }));

  return (
    <div className="space-y-3 rounded-lg border border-input p-3">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-fee`}>Standard fee</Label>
        <Input
          id={`${idPrefix}-fee`}
          name="standard_amount"
          type="number"
          min="0.01"
          step="0.01"
          required
          defaultValue={standardAmount ?? ""}
          placeholder="0.00"
        />
        <p className="text-xs text-muted-foreground">
          Every payment for this service uses this fee. A year below can add to
          it or subtract from it. Leave a year out to keep the standard fee.
        </p>
      </div>
      <input type="hidden" name="fee_years" value={JSON.stringify(savedYears)} />
      {rows.map((row, index) => (
        <div key={`${row.year}-${index}`} className="grid grid-cols-[1fr_1fr_auto] gap-2">
          <div className="space-y-1">
            <Label htmlFor={`${idPrefix}-year-${index}`}>Year</Label>
            <Input
              id={`${idPrefix}-year-${index}`}
              type="number"
              min={nextYear}
              max="2100"
              value={row.year}
              onChange={(event) => {
                const raw = event.target.value;
                if (raw !== "" && !/^\d+$/.test(raw)) return;
                if (raw.length >= 4) {
                  const year = Number(raw);
                  if (!Number.isInteger(year) || year <= currentYear || year > 2100) return;
                }
                setRows((current) =>
                  current.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, year: raw } : item
                  )
                );
              }}
              onBlur={() => {
                setRows((current) =>
                  current.map((item, itemIndex) => {
                    if (itemIndex !== index) return item;
                    const year = Number(item.year);
                    if (Number.isInteger(year) && year > currentYear && year <= 2100) {
                      return item;
                    }
                    return {
                      ...item,
                      year: String(nextOpenYear(current.filter((_, i) => i !== index))),
                    };
                  })
                );
              }}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${idPrefix}-adjust-${index}`}>
              {row.adjustment.trim().startsWith("-") ? "Minus" : "Add"}
            </Label>
            <Input
              id={`${idPrefix}-adjust-${index}`}
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={row.adjustment}
              onChange={(event) => {
                const raw = event.target.value.replace(/[^\d.-]/g, "");
                if (raw !== "" && !/^-?\d*\.?\d*$/.test(raw)) return;
                setRows((current) =>
                  current.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, adjustment: raw } : item
                  )
                );
              }}
            />
            <p className="text-xs text-muted-foreground">
              {row.adjustment.trim().startsWith("-")
                ? "This amount is subtracted from the standard fee."
                : "Type the amount to add. Start with a minus, such as -500, to subtract."}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="mt-6"
            onClick={() =>
              setRows((current) => current.filter((_, itemIndex) => itemIndex !== index))
            }
          >
            Remove
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          setRows((current) => [
            ...current,
            { year: String(nextOpenYear(current)), adjustment: "" },
          ])
        }
      >
        Add year
      </Button>
      {standard > 0 && savedYears.some((row) => Number.isFinite(row.year)) ? (
        <p className="text-xs text-muted-foreground">
          {savedYears
            .filter((row) => Number.isFinite(row.year) && Number.isFinite(row.adjustment))
            .map(
              (row) =>
                `${row.year}: ${formatMoney(feeForYear(standard, [row], row.year))}`
            )
            .join(" · ")}
        </p>
      ) : null}
    </div>
  );
}

function AddServiceDialog({
  defaultCategory,
  incomeCategories,
}: {
  defaultCategory: string;
  incomeCategories: IncomeCategoryOption[];
}) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState(defaultCategory);
  const [state, formAction, pending] = useServerAction(createIncomeService, initialState, () => setOpen(false));


  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button type="button" />}>
        <PlusIcon />
        Add income service
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Add income service</AlertDialogTitle>
          <AlertDialogDescription>
            New services become selectable when the Treasurer records cash
            inflow under the matching income category. For a wedding, add Public
            and Private as separate services.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form action={formAction} id="add-income-service" className="space-y-4">
          {state.error ? (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="service_name">Service name</Label>
            <Input
              id="service_name"
              name="service_name"
              required
              placeholder="e.g. Wedding, Baptism, Sunday Offering"
            />
          </div>
          <AccessTypeField id="access_type" />
          <div className="space-y-2">
            <Label htmlFor="category">Income category</Label>
            <select
              id="category"
              name="category"
              required
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className={selectClassName}
            >
              {incomeCategories.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          {category === "church_service" ? (
            <ChurchFeeFields idPrefix="add-service" />
          ) : null}
        </form>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button type="submit" form="add-income-service" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            Save
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function EditServiceDialog({
  service,
  incomeCategories,
}: {
  service: IncomeServiceRow;
  incomeCategories: IncomeCategoryOption[];
}) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState(service.category);
  const [state, formAction, pending] = useServerAction(updateIncomeService, initialState, () => setOpen(false));
  const formId = `edit-income-service-${service.service_id}`;
  const { baseName, accessType } = parseIncomeAccessType(service.service_name);


  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Edit income service"
            title="Edit"
          />
        }
      >
        <PencilIcon />
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Edit income service</AlertDialogTitle>
          <AlertDialogDescription>
            Rename this service, set public or private, or move it to another
            income category.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form action={formAction} id={formId} className="space-y-4">
          <input type="hidden" name="service_id" value={service.service_id} />
          {state.error ? (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor={`edit-service-name-${service.service_id}`}>
              Service name
            </Label>
            <Input
              key={`${service.service_name}-name`}
              id={`edit-service-name-${service.service_id}`}
              name="service_name"
              required
              defaultValue={baseName}
            />
          </div>
          <AccessTypeField
            key={`${service.service_name}-access`}
            id={`edit-access-type-${service.service_id}`}
            defaultValue={accessType}
          />
          <div className="space-y-2">
            <Label htmlFor={`edit-service-category-${service.service_id}`}>
              Income category
            </Label>
            <select
              id={`edit-service-category-${service.service_id}`}
              name="category"
              required
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className={selectClassName}
            >
              {incomeCategories.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          {category === "church_service" ? (
            <ChurchFeeFields
              idPrefix={`edit-service-${service.service_id}`}
              standardAmount={service.standard_amount}
              years={service.fee_years}
            />
          ) : null}
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

function ToggleServiceDialog({ service }: { service: IncomeServiceRow }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useServerAction(toggleIncomeService, initialState, () => setOpen(false));
  const formId = `toggle-income-service-${service.service_id}`;
  const activating = !service.is_active;


  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={activating ? "Activate income service" : "Deactivate income service"}
        title={activating ? "Activate" : "Deactivate"}
        onClick={() => setOpen(true)}
      >
        {activating ? <PowerIcon /> : <CircleOffIcon />}
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
            <AlertDialogMedia
              className={
                activating
                  ? "bg-muted text-foreground"
                  : "bg-destructive/10 text-destructive"
              }
            >
              {activating ? <PowerIcon /> : <CircleOffIcon />}
            </AlertDialogMedia>
            <AlertDialogTitle>
              {activating ? "Activate this service?" : "Deactivate this service?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {activating
                ? `“${formatTypeLabel(service.service_name)}” will become selectable when the Treasurer records income.`
                : `“${formatTypeLabel(service.service_name)}” will no longer be selectable for new income records. Existing records are kept.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {state.error ? (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          ) : null}
          <form action={formAction} id={formId}>
            <input type="hidden" name="service_id" value={service.service_id} />
            <input
              type="hidden"
              name="is_active"
              value={activating ? "1" : "0"}
            />
          </form>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              type="submit"
              form={formId}
              variant={activating ? "default" : "destructive"}
              disabled={pending}
            >
              {pending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Saving…
                </>
              ) : activating ? (
                <>
                  <PowerIcon />
                  Activate
                </>
              ) : (
                <>
                  <CircleOffIcon />
                  Deactivate
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function DeleteServiceDialog({ service }: { service: IncomeServiceRow }) {
  const [open, setOpen] = useState(false);
  const [, formAction, pending] = useServerAction(
    async (prev, formData) => {
      const result = await deleteIncomeService(prev, formData);
      if (result.error) {
        toast.error(result.error);
        setOpen(false);
      }
      return result;
    },
    initialState,
    () => setOpen(false)
  );
  const formId = `delete-income-service-${service.service_id}`;


  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Delete income service"
        title="Delete"
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
            <AlertDialogTitle>Delete income service?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove “{formatTypeLabel(service.service_name)}”. If it is
              already used in records, deactivate it instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form action={formAction} id={formId}>
            <input type="hidden" name="service_id" value={service.service_id} />
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
