import { AuditPagination } from "@/components/administrator/audit-pagination";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/auth/roles";
import type { AuditTab } from "@/lib/admin/audit";
import { createClient } from "@/lib/supabase/server";

function profileName(value: unknown) {
  if (Array.isArray(value)) return value[0]?.full_name || "—";
  if (value && typeof value === "object" && "full_name" in value) {
    return String((value as { full_name?: string }).full_name || "—");
  }
  return "—";
}

async function fetchAuditRows(
  tab: AuditTab,
  requestedPage: number,
  pageSize: number
): Promise<{ rows: Array<Record<string, unknown>>; totalItems: number }> {
  const supabase = await createClient();
  const from = (requestedPage - 1) * pageSize;
  const to = from + pageSize - 1;

  if (tab === "logins") {
    const { data, count } = await supabase
      .from("login_history")
      .select(
        "login_id, login_time, logout_time, ip_address, device_info, profiles(full_name, role)",
        { count: "exact" }
      )
      .order("login_time", { ascending: false })
      .range(from, to);

    return {
      rows: (data ?? []) as Array<Record<string, unknown>>,
      totalItems: count ?? 0,
    };
  }

  if (tab === "transactions") {
    const { data, count } = await supabase
      .from("audit_logs")
      .select(
        "audit_id, action, table_name, description, created_at, profiles(full_name)",
        { count: "exact" }
      )
      .in("table_name", ["donations", "expenses", "budgets", "announcements"])
      .order("created_at", { ascending: false })
      .range(from, to);

    return {
      rows: (data ?? []) as Array<Record<string, unknown>>,
      totalItems: count ?? 0,
    };
  }

  const { data, count } = await supabase
    .from("audit_logs")
    .select(
      "audit_id, action, table_name, description, ip_address, created_at, profiles(full_name)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  return {
    rows: (data ?? []) as Array<Record<string, unknown>>,
    totalItems: count ?? 0,
  };
}

export async function AuditTabContent({
  tab,
  requestedPage,
  pageSize,
}: {
  tab: AuditTab;
  requestedPage: number;
  pageSize: number;
}) {
  const { rows, totalItems } = await fetchAuditRows(
    tab,
    requestedPage,
    pageSize
  );
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);
  const page = Math.min(requestedPage, totalPages);

  if (tab === "logins") {
    return (
      <Card
        role="tabpanel"
        id="audit-panel-logins"
        aria-labelledby="audit-tab-logins"
      >
        <CardHeader>
          <CardTitle>Login History</CardTitle>
          <CardDescription>Recent sign-in sessions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Login</TableHead>
                <TableHead>Logout</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Device</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No login history found.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={String(row.login_id)}>
                    <TableCell>{profileName(row.profiles)}</TableCell>
                    <TableCell>
                      {formatDateTime(row.login_time as string)}
                    </TableCell>
                    <TableCell>
                      {formatDateTime(row.logout_time as string | null)}
                    </TableCell>
                    <TableCell>
                      {(row.ip_address as string | null) || "—"}
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate">
                      {(row.device_info as string | null) || "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <AuditPagination
            tab={tab}
            page={page}
            pageSize={pageSize}
            totalItems={totalItems}
          />
        </CardContent>
      </Card>
    );
  }

  if (tab === "transactions") {
    return (
      <Card
        role="tabpanel"
        id="audit-panel-transactions"
        aria-labelledby="audit-tab-transactions"
      >
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            Audit events related to finance and announcements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No transaction history found.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={String(row.audit_id)}>
                    <TableCell>
                      {formatDateTime(row.created_at as string)}
                    </TableCell>
                    <TableCell>{profileName(row.profiles)}</TableCell>
                    <TableCell>{String(row.action)}</TableCell>
                    <TableCell className="max-w-[320px] truncate">
                      {(row.description as string | null) || "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <AuditPagination
            tab={tab}
            page={page}
            pageSize={pageSize}
            totalItems={totalItems}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      role="tabpanel"
      id="audit-panel-activity"
      aria-labelledby="audit-tab-activity"
    >
      <CardHeader>
        <CardTitle>User Activities</CardTitle>
        <CardDescription>All recorded audit events</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Table</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  No user activities found.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={String(row.audit_id)}>
                  <TableCell>
                    {formatDateTime(row.created_at as string)}
                  </TableCell>
                  <TableCell>{profileName(row.profiles)}</TableCell>
                  <TableCell>{String(row.action)}</TableCell>
                  <TableCell>
                    {(row.table_name as string | null) || "—"}
                  </TableCell>
                  <TableCell className="max-w-[280px] truncate">
                    {(row.description as string | null) || "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <AuditPagination
          tab={tab}
          page={page}
          pageSize={pageSize}
          totalItems={totalItems}
        />
      </CardContent>
    </Card>
  );
}
