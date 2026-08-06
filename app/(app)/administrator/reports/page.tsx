import { requireAdmin } from "@/lib/auth/session";
import {
  ADMIN_REPORT_TYPES,
  isAdminReportType,
  resolveReportDateRange,
  type AdminReportType,
} from "@/lib/reports";
import { getAdminFormalReportData } from "@/lib/admin/reports-data";
import { FormalReportDocument } from "@/components/reports/formal-report-document";
import { ReportExportButtons } from "@/components/reports/report-export-buttons";
import { ReportFilters } from "@/components/reports/report-filters";

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
  const generatedAt = new Date();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
            Reports
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Financial summary, donations, collections, expenses, budget
            utilization, and audit trail reports.
          </p>
        </div>
        <ReportExportButtons
          filename={`sfxa-admin-${type}-report-${from}-to-${to}`}
          rows={data.exportRows}
          title={`SFXA ${data.title}`}
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
      />
    </div>
  );
}
