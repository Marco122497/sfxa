import { FileTextIcon } from "lucide-react";
import { requireTreasurer } from "@/lib/auth/session";
import {
  isReportType,
  resolveReportDateRange,
  type ReportType,
} from "@/lib/reports";
import { getLimitedFormalReportData } from "@/lib/admin/reports-data";
import { getParishPriestName } from "@/lib/parish-settings";
import { FormalReportDocument } from "@/components/reports/formal-report-document";
import { ReportExportButtons } from "@/components/reports/report-export-buttons";
import { ReportFilters } from "@/components/reports/report-filters";
import { PageHeading } from "@/components/layout/page-heading";

export default async function TreasurerReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; from?: string; to?: string }>;
}) {
  const { supabase, profile } = await requireTreasurer();
  const params = await searchParams;
  const type: ReportType = isReportType(params.type)
    ? params.type
    : "church_services";
  const { from, to } = resolveReportDateRange(params);
  const data = await getLimitedFormalReportData(supabase, type, from, to);
  const parishPriestName = await getParishPriestName(supabase);
  const generatedAt = new Date();

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <PageHeading
          title="Financial Reports"
          description="Totals by type for walk-in payments, expenses, and budget use."
          icon={FileTextIcon}
          actions={<ReportExportButtons title={`SXFP ${data.title}`} />}
        />
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
