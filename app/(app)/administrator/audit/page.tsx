import { PageHeading } from "@/components/layout/page-heading";
import { ClipboardListIcon } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/auth/roles";
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

const PAGE_SIZES = [10, 25, 50, 100] as const;

function parseTab(value?: string) {
  if (value === "logins" || value === "transactions" || value === "activity") {
    return value;
  }
  return "activity";
}

function parsePage(value?: string) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

function parsePerPage(value?: string) {
  const n = Number(value);
  return (PAGE_SIZES as readonly number[]).includes(n) ? n : 25;
}

function tabHref(tab: string) {
  return `/administrator/audit?tab=${tab}&page=1&perPage=25`;
}

function profileName(value: unknown) {
  if (Array.isArray(value)) return value[0]?.full_name || "—";
  if (value && typeof value === "object" && "full_name" in value) {
    return String((value as { full_name?: string }).full_name || "—");
  }
  return "—";
}

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string; perPage?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const tab = parseTab(params.tab);
  const pageSize = parsePerPage(params.perPage);
  const requestedPage = parsePage(params.page);
  const supabase = await createClient();

  const from = (requestedPage - 1) * pageSize;
  const to = from + pageSize - 1;

  let rows: Array<Record<string, unknown>> = [];
  let totalItems = 0;

  if (tab === "logins") {
    const { data, count } = await supabase
      .from("login_history")
      .select(
        "login_id, login_time, logout_time, ip_address, device_info, profiles(full_name, role)",
        { count: "exact" }
      )
      .order("login_time", { ascending: false })
      .range(from, to);
    rows = data ?? [];
    totalItems = count ?? 0;
  } else if (tab === "transactions") {
    const { data, count } = await supabase
      .from("audit_logs")
      .select(
        "audit_id, action, table_name, description, created_at, profiles(full_name)",
        { count: "exact" }
      )
      .in("table_name", ["donations", "expenses", "budgets", "announcements"])
      .order("created_at", { ascending: false })
      .range(from, to);
    rows = data ?? [];
    totalItems = count ?? 0;
  } else {
    const { data, count } = await supabase
      .from("audit_logs")
      .select(
        "audit_id, action, table_name, description, ip_address, created_at, profiles(full_name)",
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(from, to);
    rows = data ?? [];
    totalItems = count ?? 0;
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);
  const page = Math.min(requestedPage, totalPages);

  return (
    <div className="space-y-6">
      <PageHeading
        title="Audit Trail"
        description="See who performed financial and system actions, and when."
        icon={ClipboardListIcon}
      />

      <div className="flex flex-wrap gap-2 text-sm">
        <a
          href={tabHref("logins")}
          className={
            tab === "logins"
              ? "font-semibold underline"
              : "underline-offset-4 hover:underline"
          }
        >
          Login History
        </a>
        <span className="text-muted-foreground">·</span>
        <a
          href={tabHref("activity")}
          className={
            tab === "activity"
              ? "font-semibold underline"
              : "underline-offset-4 hover:underline"
          }
        >
          User Activities
        </a>
        <span className="text-muted-foreground">·</span>
        <a
          href={tabHref("transactions")}
          className={
            tab === "transactions"
              ? "font-semibold underline"
              : "underline-offset-4 hover:underline"
          }
        >
          Transaction History
        </a>
      </div>

      {tab === "logins" ? (
        <Card>
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
      ) : tab === "transactions" ? (
        <Card>
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
      ) : (
        <Card>
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
      )}
    </div>
  );
}
