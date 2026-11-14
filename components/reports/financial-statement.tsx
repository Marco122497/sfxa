import { Fragment } from "react";

import { formatMoney } from "@/lib/format";
import { formatReportPeriodLabel } from "@/lib/reports";
import type { FormalReportData, ReportBreakdownItem, ReportRow } from "@/lib/reports-data";
import { ReportPieChart } from "@/components/reports/report-pie-chart";

const PALETTE = [
  "#1d4ed8",
  "#16a34a",
  "#ca8a04",
  "#ea580c",
  "#7c3aed",
  "#0891b2",
  "#be123c",
  "#4d7c0f",
];

function money(value: number) {
  return formatMoney(value);
}

function StatementLine({
  label,
  amount,
  indent = false,
  total = false,
}: {
  label: string;
  amount: number;
  indent?: boolean;
  total?: boolean;
}) {
  return (
    <tr className={total ? "border-t-2 border-b-2 border-[#111111] font-semibold" : "border-t border-[#e5e7eb]"}>
      <td className={indent ? "py-1.5 pl-6 pr-3" : "py-1.5 pr-3"}>{label}</td>
      <td className="py-1.5 text-right tabular-nums">{money(amount)}</td>
    </tr>
  );
}

function breakdownFromRows(rows: ReportRow[]): ReportBreakdownItem[] {
  const total = rows.reduce((sum, row) => sum + row.amount, 0);
  return rows
    .filter((row) => row.amount > 0)
    .map((row, index) => ({
      label: row.cells.description || row.cells.category || "Item",
      amount: row.amount,
      percent: total > 0 ? Math.round((row.amount / total) * 1000) / 10 : 0,
      color: PALETTE[index % PALETTE.length],
    }));
}

function childBreakdown(
  children: { label: string; amount: number }[]
): ReportBreakdownItem[] {
  const total = children.reduce((sum, item) => sum + item.amount, 0);
  return children
    .filter((item) => item.amount > 0)
    .map((item, index) => ({
      label: item.label,
      amount: item.amount,
      percent: total > 0 ? Math.round((item.amount / total) * 1000) / 10 : 0,
      color: PALETTE[index % PALETTE.length],
    }));
}

export function FinancialStatement({ data }: { data: FormalReportData }) {
  const period = formatReportPeriodLabel(data.from, data.to);
  const revenue = data.rows.filter(
    (row) =>
      row.id !== "summary-income" &&
      row.id !== "summary-expenses" &&
      row.id !== "summary-net"
  );
  const income = data.rows.find((row) => row.id === "summary-income");
  const expenses = data.rows.find((row) => row.id === "summary-expenses");
  const net = data.rows.find((row) => row.id === "summary-net");
  const expenseLines = expenses?.children ?? [];

  return (
    <section className="report-keep mt-6">
      <div className="flex items-center justify-between bg-[#1e3a5f] px-3 py-2 text-white">
        <span className="text-[12px] font-semibold tracking-[0.12em] uppercase">
          Saint Francis Xavier Parish
        </span>
        <span className="text-[12px] font-semibold tracking-[0.08em] uppercase">
          Financial Report
        </span>
      </div>

      <div className="mt-4 grid grid-cols-[1.15fr_0.85fr] items-start gap-8">
        <div>
          <h3 className="text-[16px] font-bold tracking-[0.04em] text-[#111111] uppercase">
            Parish Financial Report
          </h3>
          <p className="mt-1 text-[12px] font-semibold tracking-[0.08em] text-[#9a3412] uppercase">
            For the period {period}
          </p>

          <table className="mt-4 w-full border-collapse text-[13px]">
            <tbody>
              <tr>
                <td colSpan={2} className="pt-2 pb-1 font-semibold">
                  Revenue
                </td>
              </tr>
              {revenue.map((row) => (
                <Fragment key={row.id}>
                  <StatementLine
                    label={row.cells.description || "Income"}
                    amount={row.amount}
                  />
                  {(row.children ?? []).map((child) => (
                    <StatementLine
                      key={`${row.id}-${child.label}`}
                      label={child.label}
                      amount={child.amount}
                      indent
                    />
                  ))}
                </Fragment>
              ))}
              <StatementLine
                label="Total Revenue"
                amount={income?.amount ?? 0}
                total
              />

              <tr>
                <td colSpan={2} className="pt-4 pb-1 font-semibold">
                  Expense
                </td>
              </tr>
              {expenseLines.map((line) => (
                <StatementLine
                  key={line.label}
                  label={line.label}
                  amount={line.amount}
                />
              ))}
              <StatementLine
                label="Total Expense"
                amount={expenses?.amount ?? 0}
                total
              />
              <StatementLine
                label={net?.cells.description || "Net"}
                amount={net?.amount ?? 0}
                total
              />
            </tbody>
          </table>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="mb-1 text-center text-[14px] font-bold tracking-[0.06em] text-[#1e3a5f] uppercase">
              {period} Revenue
            </h3>
            <ReportPieChart breakdown={breakdownFromRows(revenue)} />
          </div>
          <div>
            <h3 className="mb-1 text-center text-[14px] font-bold tracking-[0.06em] text-[#1e3a5f] uppercase">
              {period} Expenses
            </h3>
            <ReportPieChart breakdown={childBreakdown(expenseLines)} />
          </div>
        </div>
      </div>
    </section>
  );
}

function lineLabel(row: ReportRow) {
  const date = (row.cells.date || "").replace(/\n/g, " ").trim();
  const detail = [
    row.cells.priest,
    row.cells.user,
    row.cells.transaction,
    row.cells.type,
    row.cells.category,
    row.cells.extra,
    row.cells.or,
  ]
    .map((value) => (value || "").replace(/\n/g, " ").trim())
    .filter((value) => value && value !== "—" && value !== date)
    .slice(0, 2)
    .join(" · ");
  if (date && detail) return `${date} · ${detail}`;
  return date || detail || "Item";
}

export function CategoryStatement({ data }: { data: FormalReportData }) {
  const period = formatReportPeriodLabel(data.from, data.to);
  const groups: { name: string; rows: ReportRow[] }[] = [];
  const hasSections = data.rows.some((row) => row.section);

  if (hasSections) {
    let current: { name: string; rows: ReportRow[] } | null = null;
    for (const row of data.rows) {
      if (row.section) {
        current = { name: row.section, rows: [] };
        groups.push(current);
        continue;
      }
      if (!current) {
        current = { name: data.tableTitle || "Details", rows: [] };
        groups.push(current);
      }
      current.rows.push(row);
    }
  } else {
    const grouped = new Map<string, ReportRow[]>();
    for (const row of data.rows) {
      const name =
        row.cells.category ||
        row.cells.type ||
        row.cells.transaction ||
        data.tableTitle ||
        "Details";
      const list = grouped.get(name) ?? [];
      list.push(row);
      grouped.set(name, list);
    }
    for (const [name, rows] of grouped) {
      groups.push({ name, rows });
    }
  }

  const grand = groups.reduce(
    (sum, group) => sum + group.rows.reduce((inner, row) => inner + row.amount, 0),
    0
  );
  const pie =
    data.breakdown.length > 0
      ? data.breakdown
      : breakdownFromRows(
          groups.map((group) => ({
            id: group.name,
            amount: group.rows.reduce((sum, row) => sum + row.amount, 0),
            cells: { description: group.name },
          }))
        );

  return (
    <section className="report-keep mt-6">
      <div className="flex items-center justify-between bg-[#1e3a5f] px-3 py-2 text-white">
        <span className="text-[12px] font-semibold tracking-[0.12em] uppercase">
          Saint Francis Xavier Parish
        </span>
        <span className="text-[12px] font-semibold tracking-[0.08em] uppercase">
          {data.title}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-[1.15fr_0.85fr] items-start gap-8">
        <div>
          <h3 className="text-[16px] font-bold tracking-[0.04em] text-[#111111] uppercase">
            {data.title}
          </h3>
          <p className="mt-1 text-[12px] font-semibold tracking-[0.08em] text-[#9a3412] uppercase">
            For the period {period}
          </p>

          <table className="mt-4 w-full border-collapse text-[13px]">
            <tbody>
              {groups.map((group, index) => {
                const total = group.rows.reduce((sum, row) => sum + row.amount, 0);
                return (
                  <Fragment key={`${group.name}-${index}`}>
                    <tr>
                      <td colSpan={2} className="pt-3 pb-1 font-semibold uppercase">
                        {group.name}
                      </td>
                    </tr>
                    {group.rows.map((row) => (
                      <StatementLine
                        key={row.id}
                        label={lineLabel(row)}
                        amount={row.amount}
                        indent
                      />
                    ))}
                    <StatementLine label={`Total ${group.name}`} amount={total} total />
                  </Fragment>
                );
              })}
              <StatementLine label="Total" amount={grand} total />
            </tbody>
          </table>
        </div>

        <div>
          <h3 className="mb-1 text-center text-[14px] font-bold tracking-[0.06em] text-[#1e3a5f] uppercase">
            {period}
          </h3>
          <ReportPieChart breakdown={pie} />
        </div>
      </div>
    </section>
  );
}

export function BudgetStatement({ data }: { data: FormalReportData }) {
  const period = formatReportPeriodLabel(data.from, data.to);
  const allocated = data.summaryLines.find((line) => line.label === "Total Allocated")?.amount ?? 0;
  const used = data.summaryLines.find((line) => line.label === "Total Used")?.amount ?? 0;
  const percent = allocated > 0 ? Math.round((used / allocated) * 1000) / 10 : 0;

  return (
    <section className="report-keep mt-6">
      <div className="flex items-center justify-between bg-[#1e3a5f] px-3 py-2 text-white">
        <span className="text-[12px] font-semibold tracking-[0.12em] uppercase">
          Saint Francis Xavier Parish
        </span>
        <span className="text-[12px] font-semibold tracking-[0.08em] uppercase">
          Budget Report
        </span>
      </div>

      <div className="mt-4 grid grid-cols-[1.2fr_0.8fr] items-start gap-8">
        <div>
          <h3 className="text-[16px] font-bold tracking-[0.04em] text-[#111111] uppercase">
            Parish Budget Report
          </h3>
          <p className="mt-1 text-[12px] font-semibold tracking-[0.08em] text-[#9a3412] uppercase">
            For the period {period}
          </p>

          <table className="mt-4 w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[#111111]">
                <th className="py-2 pr-3 text-left text-[10px] font-semibold tracking-[0.12em] uppercase">
                  Category
                </th>
                <th className="py-2 pr-3 text-right text-[10px] font-semibold tracking-[0.12em] uppercase">
                  Actual
                </th>
                <th className="py-2 pr-3 text-right text-[10px] font-semibold tracking-[0.12em] uppercase">
                  Budget
                </th>
                <th className="py-2 text-right text-[10px] font-semibold tracking-[0.12em] uppercase">
                  Budget %
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={4} className="pt-3 pb-1 font-semibold uppercase">
                  Disbursements
                </td>
              </tr>
              {data.rows.map((row) => (
                <tr key={row.id} className="border-t border-[#e5e7eb]">
                  <td className="py-1.5 pr-3">{row.cells.category}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">{row.cells.used}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">{row.cells.allocated}</td>
                  <td className="py-1.5 text-right tabular-nums">{row.cells.percent}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-b-2 border-[#111111] font-semibold">
                <td className="py-1.5 pr-3">Total</td>
                <td className="py-1.5 pr-3 text-right tabular-nums">{money(used)}</td>
                <td className="py-1.5 pr-3 text-right tabular-nums">{money(allocated)}</td>
                <td className="py-1.5 text-right tabular-nums">{percent}%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h3 className="mb-1 text-center text-[14px] font-bold tracking-[0.06em] text-[#1e3a5f] uppercase">
            {period} Budgeted Expenses
          </h3>
          <ReportPieChart breakdown={data.breakdown} />
        </div>
      </div>
    </section>
  );
}
