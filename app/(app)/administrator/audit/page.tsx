import { Suspense } from "react";
import { ClipboardListIcon } from "lucide-react";

import { AuditTabContent } from "@/components/administrator/audit-tab-content";
import { AuditTabs } from "@/components/administrator/audit-tabs";
import { PageHeading } from "@/components/layout/page-heading";
import { AuditTabContentSkeleton } from "@/components/layout/page-skeletons";
import {
  parseAuditPage,
  parseAuditPerPage,
  parseAuditTab,
} from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/auth/session";

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string; perPage?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const tab = parseAuditTab(params.tab);
  const pageSize = parseAuditPerPage(params.perPage);
  const requestedPage = parseAuditPage(params.page);

  return (
    <div className="space-y-6">
      <PageHeading
        title="Audit Trail"
        description="See who performed financial and system actions, and when."
        icon={ClipboardListIcon}
      />

      <AuditTabs activeTab={tab} />

      <Suspense
        key={`${tab}-${requestedPage}-${pageSize}`}
        fallback={<AuditTabContentSkeleton />}
      >
        <AuditTabContent
          tab={tab}
          requestedPage={requestedPage}
          pageSize={pageSize}
        />
      </Suspense>
    </div>
  );
}
