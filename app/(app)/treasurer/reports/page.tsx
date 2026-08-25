import { FileTextIcon } from "lucide-react";
import { requireTreasurer } from "@/lib/auth/session";
import {
  isReportType,
  resolveReportDateRange,
  type ReportType,
} from "@/lib/reports";
import { getFormalReportData } from "@/lib/reports-data";
import { getParishPriestName } from "@/lib/parish-settings";
import { FormalReportDocument } from "@/components/reports/formal-report-document";
import { ReportExportButtons } from "@/components/reports/report-export-buttons";
import { ReportFilters } from "@/components/reports/report-filters";

export default async function TreasurerReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; from?: string; to?: string }>;
}) {
  const { supabase, profile } = await requireTreasurer();
  const params = await searchParams;
  const type: ReportType = isReportType(params.type) ? params.type : "donations";
  const { from, to } = resolveReportDateRange(params);
  const data = await getFormalReportData(supabase, type, from, to);
  const parishPriestName = await getParishPriestName(supabase);
  const generatedAt = new Date();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40 text-foreground">
              <FileTextIcon className="size-4" aria-hidden />
            </span>
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
              Financial Reports
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate and view financial reports, then print the document.
          </p>
        </div>
        <ReportExportButtons title={`SFXA ${data.title}`} />
      </div>

      <ReportFilters
        type={type}
        from={from}
        to={to}
        basePath="/treasurer/reports"
      />

      <FormalReportDocument
        data={data}
        generatedBy={profile.full_name || profile.role}
        generatedRole={profile.role}
        generatedAt={generatedAt}
        notedByName={parishPriestName}
      />
    </div>
  );
}
