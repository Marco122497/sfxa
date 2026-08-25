import Image from "next/image";

import { formatMoney, formatDate } from "@/lib/format";
import {
  buildReportNumber,
  formatReportPeriodLabel,
  getAnyReportTypeMeta,
} from "@/lib/reports";
import type { FormalReportData } from "@/lib/reports-data";
import { ReportDataTable } from "@/components/reports/report-data-table";
import { ReportPieChart } from "@/components/reports/report-pie-chart";

const APP_VERSION = "v1.0.0.0.1 beta";

export function FormalReportDocument({
  data,
  generatedBy,
  generatedRole,
  generatedAt,
  notedByName = "Parish Priest",
}: {
  data: FormalReportData;
  generatedBy: string;
  generatedRole?: string;
  generatedAt: Date;
  notedByName?: string;
}) {
  const meta = getAnyReportTypeMeta(data.type);
  const reportNo = buildReportNumber(data.type, data.from, data.to);
  const showBreakdown = data.showBreakdown !== false;
  const tableTitle = data.tableTitle ?? `${meta.label} Transactions`;
  const summaryTitle =
    data.type === "budget" || data.type === "summary"
      ? "Summary"
      : `${meta.label} Summary`;
  const breakdownTitle =
    data.type === "budget"
      ? "Allocation Breakdown"
      : data.type === "expenses"
        ? "Expenses by Category"
        : "Type Breakdown";
  const preparedDate = formatDate(generatedAt.toISOString().slice(0, 10));

  const totalMetric =
    data.metrics.find((metric) => metric.id === "total") ??
    data.metrics.find((metric) => metric.id === "allocated") ??
    data.metrics.find((metric) => metric.id === "income") ??
    data.metrics.find((metric) => metric.id === "net");

  const metaItems = [
    { label: "Report No.", value: reportNo },
    { label: "Prepared by", value: generatedBy },
    { label: "Period", value: formatReportPeriodLabel(data.from, data.to) },
    { label: "Total", value: totalMetric?.value || "—" },
  ];

  return (
    <article
      id="report-print-area"
      className="formal-report mx-auto bg-white text-[#111111]"
    >
      <header>
        <div className="mx-auto flex items-center justify-center gap-3">
          <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden">
            <Image
              src="/SFXA.png"
              alt="Saint Francis Xavier Parish"
              width={64}
              height={64}
              className="size-full object-contain"
              priority
            />
          </div>

          <div className="text-center">
            <p className="font-[family-name:var(--font-display)] text-[17px] font-bold tracking-[0.02em] text-[#111111] uppercase">
              Saint Francis Xavier Parish
            </p>
            <p className="mt-0.5 text-[12px] italic text-[#374151]">
              Stewardship in faith; transparency in service
            </p>
            <p className="mt-1 text-[11px] text-[#4b5563]">
              SFXA Finance · Parish Financial Management
            </p>
          </div>

          <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden">
            <Image
              src="/SFXA.png"
              alt=""
              width={64}
              height={64}
              className="size-full object-contain"
            />
          </div>
        </div>

        <p className="mt-4 text-center text-[15px] font-semibold tracking-[0.12em] text-[#111111] uppercase">
          SFXA Finance – {data.title}
        </p>

        <p className="mt-4 text-[12px] italic text-[#4b5563]">
          Printed: {formatDate(generatedAt.toISOString().slice(0, 10))}
        </p>

        <dl className="mt-4 grid grid-cols-4 gap-x-6 gap-y-3">
          {metaItems.map((item) => (
            <div key={item.label} className="min-w-0">
              <dt className="text-[10px] font-medium tracking-[0.16em] text-[#6b7280] uppercase">
                {item.label}
              </dt>
              <dd className="mt-1 text-[13px] font-semibold leading-snug text-[#111111]">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-5 border-b border-[#111111]" />
      </header>

      <section className="mt-6">
        <h3 className="mb-2 text-[11px] font-semibold tracking-[0.16em] text-[#6b7280] uppercase">
          {tableTitle}
        </h3>
        <ReportDataTable columns={data.columns} rows={data.rows} />
      </section>

      {(data.summaryLines.length > 0 ||
        (showBreakdown && data.breakdown.length > 0)) && (
        <section className="mt-8 grid grid-cols-2 gap-8">
          {data.summaryLines.length > 0 ? (
            <div className="report-keep">
              <h3 className="mb-2 text-[11px] font-semibold tracking-[0.16em] text-[#6b7280] uppercase">
                {summaryTitle}
              </h3>
              <table className="w-full border-collapse text-[13px]">
                <tbody>
                  {data.summaryLines.map((line) => (
                    <tr
                      key={line.label}
                      className={
                        line.emphasis
                          ? "border-t border-[#111111] font-semibold"
                          : "border-t border-[#e5e7eb]"
                      }
                    >
                      <td className="py-2 pr-3 align-top">{line.label}</td>
                      <td className="py-2 text-right tabular-nums">
                        {line.display ?? formatMoney(line.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {showBreakdown && data.breakdown.length > 0 ? (
            <div className="report-keep">
              <h3 className="mb-2 text-[11px] font-semibold tracking-[0.16em] text-[#6b7280] uppercase">
                {breakdownTitle}
              </h3>
              <ReportPieChart breakdown={data.breakdown} />
            </div>
          ) : null}
        </section>
      )}

      <section className="report-keep mt-10 grid grid-cols-2 gap-10">
        <div className="text-sm">
          <p className="text-[10px] font-medium tracking-[0.16em] text-[#6b7280] uppercase">
            Prepared by
          </p>
          <div className="mt-10 w-48 border-b border-[#111111]" />
          <p className="mt-2 font-medium uppercase">{generatedBy}</p>
          <p className="text-[12px] uppercase text-[#4b5563]">
            {generatedRole || "Staff"}
          </p>
          <p className="mt-1 text-[12px] text-[#4b5563]">
            Date: {preparedDate}
          </p>
        </div>
        <div className="text-sm">
          <p className="text-[10px] font-medium tracking-[0.16em] text-[#6b7280] uppercase">
            Noted by
          </p>
          <div className="mt-10 w-48 border-b border-[#111111]" />
          <p className="mt-2 font-medium uppercase">{notedByName}</p>
          <p className="text-[12px] uppercase text-[#4b5563]">Parish Priest</p>
          <p className="mt-1 text-[12px] text-[#4b5563]">Date: __________</p>
        </div>
      </section>

      {data.notes ? (
        <p className="report-keep mt-8 text-[12px] leading-relaxed text-[#4b5563]">
          <span className="font-semibold text-[#111111]">Notes. </span>
          {data.notes}
        </p>
      ) : null}

      <footer className="report-doc-footer mt-12 flex items-end justify-between gap-4 border-t border-[#d1d5db] pt-2 text-[11px] text-[#6b7280]">
        <span>Generated from SFXA Finance ({APP_VERSION})</span>
      </footer>
    </article>
  );
}
