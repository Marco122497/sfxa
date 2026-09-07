import { FileTextIcon } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import {
  ADMIN_REPORT_TYPES,
  isAdminReportType,
  resolveReportDateRange,
  type AdminReportType,
} from "@/lib/reports";
import { getAdminFormalReportData } from "@/lib/admin/reports-data";
import { getParishPriestName } from "@/lib/parish-settings";
import { FormalReportDocument } from "@/components/reports/formal-report-document";
import { ReportExportButtons } from "@/components/reports/report-export-buttons";
import { ReportFilters } from "@/components/reports/report-filters";
import { PageHeading } from "@/components/layout/page-heading";

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; from?: string; to?: string }>;
}) {
  const { supabase, profile } = await requireAdmin();
  const params = await searchParams;
  const type: AdminReportType = isAdminReportType(params.type)
    ? params.type
    : "summary";
  const { from, to } = resolveReportDateRange(params);
  const data = await getAdminFormalReportData(supabase, type, from, to);
  const parishPriestName = await getParishPriestName(supabase);
  const generatedAt = new Date();

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <PageHeading
          title="Financial Reports"
          description="Generate and view financial reports for donations, collections, expenses, and budget utilization, then print the document."
          icon={FileTextIcon}
          actions={<ReportExportButtons title={`SFXA ${data.title}`} />}
        />
      </div>

      <ReportFilters
        type={type}
        from={from}
        to={to}
        basePath="/administrator/reports"
        types={ADMIN_REPORT_TYPES}
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
