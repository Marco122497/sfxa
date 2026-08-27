import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";

function PageHeaderSkeleton({
  action,
  titleWidth = "w-64",
}: {
  action?: boolean;
  titleWidth?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0 space-y-2">
        <div className="flex items-center gap-2.5">
          <Skeleton className="size-9 rounded-lg" />
          <Skeleton className={`h-9 ${titleWidth}`} />
        </div>
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      {action ? <Skeleton className="h-8 w-32" /> : null}
    </div>
  );
}

function StatCardsSkeleton({
  count,
  columns = "sm:grid-cols-2 xl:grid-cols-3",
}: {
  count: number;
  columns?: string;
}) {
  return (
    <div className={`grid gap-4 ${columns}`}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="size-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-36" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TableRowsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-8 w-full" />
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton
          key={index}
          className={index === rows - 1 ? "h-8 w-3/4" : "h-8 w-full"}
        />
      ))}
    </div>
  );
}

function TableCardSkeleton({
  rows = 6,
  toolbar,
}: {
  rows?: number;
  toolbar?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="space-y-2">
        {toolbar ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-8 w-28" />
          </div>
        ) : (
          <>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-64" />
          </>
        )}
      </CardHeader>
      <CardContent>
        <TableRowsSkeleton rows={rows} />
      </CardContent>
    </Card>
  );
}

function ChartCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-56" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[260px] w-full rounded-xl" />
      </CardContent>
    </Card>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton titleWidth="w-80" />
      <StatCardsSkeleton count={5} />
      <div className="grid gap-4 xl:grid-cols-5">
        <ChartCardSkeleton className="xl:col-span-3" />
        <Card className="xl:col-span-2">
          <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-52" />
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <Skeleton className="size-48 rounded-full" />
          </CardContent>
        </Card>
      </div>
      <TableCardSkeleton rows={5} />
      <div className="grid gap-4 xl:grid-cols-2">
        <TableCardSkeleton rows={4} />
        <TableCardSkeleton rows={4} />
      </div>
    </div>
  );
}

export function TreasurerDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton titleWidth="w-72" />
      <StatCardsSkeleton count={3} />
      <div className="grid gap-4 xl:grid-cols-5">
        <ChartCardSkeleton className="xl:col-span-3" />
        <Card className="xl:col-span-2">
          <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <Skeleton className="size-48 rounded-full" />
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <TableCardSkeleton rows={5} />
        </div>
        <div className="xl:col-span-2">
          <TableCardSkeleton rows={5} />
        </div>
      </div>
    </div>
  );
}

export function ParishDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton titleWidth="w-[22rem]" />
      <StatCardsSkeleton count={3} />
      <div className="grid gap-4 xl:grid-cols-5">
        <ChartCardSkeleton className="xl:col-span-3" />
        <Card className="xl:col-span-2">
          <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <Skeleton className="size-48 rounded-full" />
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <TableCardSkeleton rows={3} />
        <TableCardSkeleton rows={3} />
      </div>
    </div>
  );
}

export function TableManagerSkeleton({ action = true }: { action?: boolean }) {
  return (
    <div className="space-y-4">
      <PageHeaderSkeleton action={action} />
      <Card size="sm">
        <CardContent className="space-y-4 px-3 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Skeleton className="h-5 w-36" />
            {action ? <Skeleton className="h-8 w-28" /> : null}
          </div>
          <TableRowsSkeleton rows={8} />
        </CardContent>
      </Card>
    </div>
  );
}

export function UsersPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton action titleWidth="w-56" />
      <TableCardSkeleton rows={8} toolbar />
    </div>
  );
}

export function ExpensesPageSkeleton() {
  return (
    <div className="space-y-4">
      <PageHeaderSkeleton titleWidth="w-40" />
      <Card>
        <CardHeader className="items-center space-y-2 text-center">
          <Skeleton className="mx-auto h-4 w-24" />
          <Skeleton className="mx-auto h-4 w-52" />
        </CardHeader>
        <CardContent className="flex justify-center">
          <Skeleton className="h-8 w-36" />
        </CardContent>
      </Card>
      <Card size="sm">
        <CardContent className="space-y-4 px-3 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-8 w-28" />
          </div>
          <TableRowsSkeleton rows={7} />
        </CardContent>
      </Card>
    </div>
  );
}

export function BudgetAllocationSkeleton() {
  return <TableManagerSkeleton />;
}

export function BudgetMonitoringSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="space-y-4">
      <PageHeaderSkeleton titleWidth="w-52" />
      <StatCardsSkeleton
        count={cards}
        columns={cards > 3 ? "sm:grid-cols-2 xl:grid-cols-4" : "sm:grid-cols-3"}
      />
      <TableCardSkeleton rows={7} />
    </div>
  );
}

export function IncomeOverviewSkeleton() {
  return (
    <div className="space-y-4">
      <PageHeaderSkeleton titleWidth="w-32" />
      <StatCardsSkeleton count={4} columns="sm:grid-cols-2 lg:grid-cols-3" />
      <TableCardSkeleton rows={5} toolbar />
      <TableCardSkeleton rows={5} toolbar />
    </div>
  );
}

export function ReceiveFundsSkeleton() {
  return <TableManagerSkeleton />;
}

export function CashFlowPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton titleWidth="w-36" />
      <ChartCardSkeleton />
      <TableCardSkeleton rows={8} />
    </div>
  );
}

export function ReportsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-9 rounded-lg" />
            <Skeleton className="h-9 w-56" />
          </div>
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-8 w-36" />
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-8 w-36" />
      </div>
      <Skeleton className="h-[720px] w-full rounded-xl" />
    </div>
  );
}

export function AuditPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton titleWidth="w-36" />
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-28" />
      </div>
      <TableCardSkeleton rows={8} />
    </div>
  );
}

export function SettingsPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton titleWidth="w-32" />
      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-8 w-full max-w-md" />
          <Skeleton className="h-9 w-28" />
        </CardContent>
      </Card>
    </div>
  );
}

export function AnnouncementManagerSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton action titleWidth="w-56" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-64" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ParishListSkeleton({ columns = 1 }: { columns?: 1 | 2 }) {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton titleWidth="w-72" />
      <div className={columns === 2 ? "grid gap-4 xl:grid-cols-2" : undefined}>
        {Array.from({ length: columns }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 4 }).map((__, row) => (
                <div key={row} className="space-y-1">
                  <Skeleton className="h-4 w-52" />
                  <Skeleton className="h-3 w-32" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ViewTableSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton titleWidth="w-48" />
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-8 w-40" />
      </div>
      <StatCardsSkeleton count={1} columns="sm:grid-cols-1" />
      <TableCardSkeleton rows={8} />
    </div>
  );
}

export function FormPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton titleWidth="w-40" />
      <Card className="max-w-xl">
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
          <Skeleton className="h-8 w-28" />
        </CardContent>
      </Card>
    </div>
  );
}
