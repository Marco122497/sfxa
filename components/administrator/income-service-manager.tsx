"use client";

import { useActionState, useMemo, useState } from "react";
import {
  CircleOffIcon,
  Loader2,
  PencilIcon,
  PlusIcon,
  PowerIcon,
  Trash2Icon,
} from "lucide-react";

import {
  createIncomeService,
  deleteIncomeService,
  toggleIncomeService,
  updateIncomeService,
  type IncomeServiceActionState,
} from "@/app/actions/income-services";
import { useRefreshOnSuccess } from "@/hooks/use-refresh-on-success";
import {
  ADDABLE_INCOME_CATEGORIES,
  INCOME_CATEGORIES,
  incomeCategoryLabel,
  isIncomeCategoryId,
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

const initialState: IncomeServiceActionState = {};

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export type IncomeServiceRow = {
  service_id: number;
  service_name: string;
  category: string;
  is_active: boolean;
};

export function IncomeServiceManager({
  services,
  initialCategory = "",
}: {
  services: IncomeServiceRow[];
  initialCategory?: string;
}) {
  const defaultCategory = isIncomeCategoryId(initialCategory)
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
        incomeCategoryLabel(service.category).toLowerCase().includes(q)
      );
    });
  }, [filter, query, services]);

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
            {INCOME_CATEGORIES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search services…"
            className="h-8 w-[180px]"
          />
          <AddServiceDialog defaultCategory={defaultCategory || "donation"} />
        </div>
      </div>
      {filtered.length === 0 ? (
        <p className="py-2 text-sm text-muted-foreground">No income services yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="h-8 px-2">Income Service</TableHead>
              <TableHead className="h-8 px-2">Income Category</TableHead>
              <TableHead className="h-8 px-2">Status</TableHead>
              <TableHead className="h-8 w-[120px] px-2" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((service) => (
              <TableRow key={service.service_id}>
                <TableCell className="px-2 py-1.5 font-medium">
                  {service.service_name}
                </TableCell>
                <TableCell className="px-2 py-1.5">
                  {incomeCategoryLabel(service.category)}
                </TableCell>
                <TableCell className="px-2 py-1.5">
                  {service.is_active ? "Active" : "Inactive"}
                </TableCell>
                <TableCell className="px-2 py-1.5">
                  <div className="flex justify-end gap-1">
                    <EditServiceDialog service={service} />
                    <ToggleServiceDialog service={service} />
                    <DeleteServiceDialog service={service} />
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

function AddServiceDialog({ defaultCategory }: { defaultCategory: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    createIncomeService,
    initialState
  );

  useRefreshOnSuccess(state.success, () => setOpen(false));

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
            inflow under the matching income category.
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
              placeholder="e.g. Baptism, Sunday Offering"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Income category</Label>
            <select
              id="category"
              name="category"
              required
              defaultValue={defaultCategory}
              className={selectClassName}
            >
              {ADDABLE_INCOME_CATEGORIES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
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

function EditServiceDialog({ service }: { service: IncomeServiceRow }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    updateIncomeService,
    initialState
  );
  const formId = `edit-income-service-${service.service_id}`;

  useRefreshOnSuccess(state.success, () => setOpen(false));

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
            Rename this service or move it to another income category.
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
              key={service.service_name}
              id={`edit-service-name-${service.service_id}`}
              name="service_name"
              required
              defaultValue={service.service_name}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`edit-service-category-${service.service_id}`}>
              Income category
            </Label>
            <select
              key={service.category}
              id={`edit-service-category-${service.service_id}`}
              name="category"
              required
              defaultValue={
                isIncomeCategoryId(service.category)
                  ? service.category
                  : "donation"
              }
              className={selectClassName}
            >
              {ADDABLE_INCOME_CATEGORIES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
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

function ToggleServiceDialog({ service }: { service: IncomeServiceRow }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    toggleIncomeService,
    initialState
  );
  const formId = `toggle-income-service-${service.service_id}`;
  const activating = !service.is_active;

  useRefreshOnSuccess(state.success, () => setOpen(false));

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
                ? `“${service.service_name}” will become selectable when the Treasurer records income.`
                : `“${service.service_name}” will no longer be selectable for new income records. Existing records are kept.`}
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
  const [state, formAction, pending] = useActionState(
    deleteIncomeService,
    initialState
  );
  const formId = `delete-income-service-${service.service_id}`;

  useRefreshOnSuccess(state.success, () => setOpen(false));

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
              This will permanently remove “{service.service_name}”. If it is
              already used in records, deactivate it instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {state.error ? (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          ) : null}
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
