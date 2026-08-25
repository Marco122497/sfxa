"use client";

import { Fragment } from "react";

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
  return (
    <table className="w-full border-collapse text-[13px]">
      <thead>
        <tr className="border-b border-[#111111]">
          {columns.map((col) => (
            <th
              key={col.key}
              className={cn(
                "py-2 pr-3 text-left text-[10px] font-medium tracking-[0.16em] text-[#6b7280] uppercase",
                col.align === "right" && "text-right"
              )}
            >
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td
              colSpan={columns.length}
              className="py-8 text-center text-[#6b7280]"
            >
              {emptyMessage}
            </td>
          </tr>
        ) : (
          rows.map((row) => {
            const children = row.children ?? [];

            return (
              <Fragment key={row.id}>
                <tr className="border-b border-[#e5e7eb]">
                  {columns.map((col) => {
                    const raw = row.cells[col.key] ?? "—";
                    const display =
                      col.key === "date" && /^\d{4}-\d{2}-\d{2}/.test(raw)
                        ? formatReportShortDate(raw.slice(0, 10))
                        : raw;

                    return (
                      <td
                        key={col.key}
                        className={cn(
                          "py-2 pr-3 align-middle",
                          col.align === "right" && "text-right tabular-nums"
                        )}
                      >
                        {display}
                      </td>
                    );
                  })}
                </tr>

                {children.map((child) => (
                  <tr
                    key={`${row.id}-${child.label}`}
                    className="border-b border-[#f3f4f6] text-[#4b5563]"
                  >
                    <td className="py-1.5 pl-6 text-[12px]">{child.label}</td>
                    {columns.slice(1, -1).map((col) => (
                      <td key={col.key} className="py-1.5" />
                    ))}
                    <td className="py-1.5 pr-3 text-right text-[12px] tabular-nums">
                      {child.display}
                    </td>
                  </tr>
                ))}
              </Fragment>
            );
          })
        )}
      </tbody>
    </table>
  );
}
