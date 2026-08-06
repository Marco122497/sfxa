"use client";

import { Fragment, useState } from "react";
import { ChevronDownIcon } from "lucide-react";

import { formatReportShortDate } from "@/lib/reports";
import type { ReportColumn, ReportRow } from "@/lib/reports-data";
import { cn } from "@/lib/utils";

export function ReportDataTable({
  columns,
  rows,
  emptyMessage = "No records found for this period.",
}: {
  columns: ReportColumn[];
  rows: ReportRow[];
  emptyMessage?: string;
}) {
  const [openRows, setOpenRows] = useState<Record<string, boolean>>({});

  function toggleRow(id: string) {
    setOpenRows((current) => ({ ...current, [id]: !current[id] }));
  }

  if (rows.length === 0) {
    return (
      <div className="overflow-x-auto rounded-md border border-[#c5d0de]">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="bg-[#1e3a5f] text-left text-white">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-3 py-2.5 text-xs font-semibold uppercase tracking-wide ${
                    col.align === "right" ? "text-right" : ""
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                colSpan={columns.length}
                className="px-3 py-8 text-center text-[#6b7c90]"
              >
                {emptyMessage}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-[#c5d0de]">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="bg-[#1e3a5f] text-left text-white">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-3 py-2.5 text-xs font-semibold uppercase tracking-wide ${
                  col.align === "right" ? "text-right" : ""
                }`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const hasChildren = Boolean(row.children?.length);
            const isOpen = Boolean(openRows[row.id]);

            return (
              <Fragment key={row.id}>
                <tr
                  className={cn(
                    index % 2 === 0 ? "bg-white" : "bg-[#f3f6fa]",
                    hasChildren && "cursor-pointer hover:bg-[#e8eef6]"
                  )}
                  onClick={hasChildren ? () => toggleRow(row.id) : undefined}
                >
                  {columns.map((col, colIndex) => {
                    const raw = row.cells[col.key] ?? "—";
                    const display =
                      col.key === "date" && /^\d{4}-\d{2}-\d{2}/.test(raw)
                        ? formatReportShortDate(raw.slice(0, 10))
                        : raw;

                    return (
                      <td
                        key={col.key}
                        className={cn(
                          "px-3 py-2 align-middle",
                          col.align === "right" &&
                            "text-right font-medium tabular-nums"
                        )}
                      >
                        {colIndex === 0 && hasChildren ? (
                          <span className="inline-flex items-center gap-1.5">
                            <ChevronDownIcon
                              className={cn(
                                "size-4 shrink-0 text-[#1e3a5f] transition-transform print:hidden",
                                isOpen && "rotate-180"
                              )}
                            />
                            <span className="font-medium">{display}</span>
                          </span>
                        ) : (
                          display
                        )}
                      </td>
                    );
                  })}
                </tr>

                {hasChildren
                  ? row.children!.map((child) => (
                      <tr
                        key={`${row.id}-${child.label}`}
                        className={cn(
                          "bg-[#f7f9fc] text-[#3d4f63]",
                          !isOpen && "hidden print:table-row"
                        )}
                      >
                        <td className="px-3 py-1.5 pl-10 text-sm">
                          {child.label}
                        </td>
                        {columns.slice(1, -1).map((col) => (
                          <td key={col.key} className="px-3 py-1.5" />
                        ))}
                        <td className="px-3 py-1.5 text-right text-sm tabular-nums">
                          {child.display}
                        </td>
                      </tr>
                    ))
                  : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
