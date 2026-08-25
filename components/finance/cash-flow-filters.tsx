"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import {
  REPORT_RANGE_PRESETS,
  getReportRangePreset,
  matchReportRangePreset,
  type ReportRangePreset,
} from "@/lib/reports";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const selectClassName =
  "h-8 min-w-[180px] rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-70";

const dateClassName =
  "h-8 w-[150px] rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-70";

export function CashFlowDateFilter({
  from,
  to,
  basePath,
}: {
  from: string;
  to: string;
  basePath?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const path = basePath ?? pathname;
  const [isPending, startTransition] = useTransition();
  const [fromDate, setFromDate] = useState(from);
  const [toDate, setToDate] = useState(to);

  useEffect(() => {
    setFromDate(from);
    setToDate(to);
  }, [from, to]);

  const activePreset = matchReportRangePreset(
    isPending ? fromDate : from,
    isPending ? toDate : to
  );

  function navigate(next: { from?: string; to?: string }) {
    const params = new URLSearchParams({
      from: next.from ?? fromDate,
      to: next.to ?? toDate,
    });
    startTransition(() => {
      router.push(`${path}?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1.5">
        <Label htmlFor="cash-flow-range" className="text-sm text-muted-foreground">
          Quick range
        </Label>
        <select
          id="cash-flow-range"
          value={activePreset ?? "custom"}
          disabled={isPending}
          className={selectClassName}
          onChange={(event) => {
            const next = event.target.value;
            if (next === "custom") return;
            const range = getReportRangePreset(next as ReportRangePreset);
            setFromDate(range.from);
            setToDate(range.to);
            navigate(range);
          }}
        >
          {REPORT_RANGE_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
          <option value="custom">Custom</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cash-flow-from" className="text-sm text-muted-foreground">
          From
        </Label>
        <Input
          id="cash-flow-from"
          type="date"
          value={isPending ? fromDate : from}
          disabled={isPending}
          className={dateClassName}
          onChange={(event) => {
            const next = event.target.value;
            setFromDate(next);
            if (!next) return;
            const end = toDate < next ? next : toDate;
            if (toDate < next) setToDate(next);
            navigate({ from: next, to: end });
          }}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cash-flow-to" className="text-sm text-muted-foreground">
          To
        </Label>
        <Input
          id="cash-flow-to"
          type="date"
          value={isPending ? toDate : to}
          disabled={isPending}
          className={dateClassName}
          onChange={(event) => {
            const next = event.target.value;
            setToDate(next);
            if (!next) return;
            const start = fromDate > next ? next : fromDate;
            if (fromDate > next) setFromDate(next);
            navigate({ from: start, to: next });
          }}
        />
      </div>

      {isPending ? (
        <div className="flex h-8 items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Updating cash flow…
        </div>
      ) : null}
    </div>
  );
}
