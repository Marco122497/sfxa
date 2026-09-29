"use client";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function PageHeaderSkeleton({
  action,
  titleWidth = "w-64",
  actions = 1,
}: {
  action?: boolean;
  titleWidth?: string;
  actions?: number;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0 space-y-2">
        <div className="flex items-center gap-2.5">
          <Skeleton className="size-9 rounded-lg" />
          <Skeleton className={`h-8 ${titleWidth}`} />
        </div>
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      {action ? (
        <div className="flex gap-2">
          {Array.from({ length: actions }).map((_, index) => (
            <Skeleton key={index} className="h-8 w-32" />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function StatCardsSkeleton({
  count,
  columns = "sm:grid-cols-2 xl:grid-cols-3",
  layout = "center",
}: {
  count: number;
  columns?: string;
  layout?: "center" | "inline";
}) {
  return (
    <div className={`grid gap-4 ${columns}`}>
      {Array.from({ length: count }).map((_, index) =>
        layout === "inline" ? (
          <Card key={index} size="sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="size-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ) : (
          <Card key={index} className="text-center">
            <CardHeader className="items-center justify-items-center pb-2">
              <Skeleton className="size-4" />
              <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent className="flex justify-center">
              <Skeleton className="h-8 w-36" />
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}

function SkeletonTable({
  columns,
  rows = 6,
}: {
  columns: string[];
  rows?: number;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((width, index) => (
            <TableHead key={index} className="h-8 px-2">
              {width ? <Skeleton className={`h-3 ${width}`} /> : null}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, row) => (
          <TableRow key={row}>
            {columns.map((width, index) => (
              <TableCell key={index} className="px-2 py-2">
                <Skeleton
                  className={`h-4 ${width || "ml-auto size-7 rounded-md"}`}
                />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ManagerBlock({
  titleWidth = "w-36",
  search = true,
  extraFilters = 0,
  action = true,
  columns,
  rows = 6,
}: {
  titleWidth?: string;
  search?: boolean;
  extraFilters?: number;
  action?: boolean;
  columns: string[];
  rows?: number;
}) {
  return (
    <div className="space-y-2 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-1">
          <Skeleton className={`h-5 ${titleWidth}`} />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {Array.from({ length: extraFilters }).map((_, index) => (
            <Skeleton key={index} className="h-8 w-[180px]" />
          ))}
          {search ? <Skeleton className="h-8 w-[200px]" /> : null}
          {action ? <Skeleton className="h-8 w-28" /> : null}
        </div>
      </div>
      <SkeletonTable columns={columns} rows={rows} />
    </div>
  );
}

function PieCardSkeleton({
  className,
  titleWidth = "w-40",
}: {
  className?: string;
  titleWidth?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="space-y-2">
        <Skeleton className={`h-5 ${titleWidth}`} />
        <Skeleton className="h-4 w-56" />
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 sm:flex-row">
        <Skeleton className="size-48 shrink-0 rounded-full" />
        <div className="w-full space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center gap-2">
              <Skeleton className="size-2.5 rounded-full" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="ml-auto h-4 w-16" />
            </div>
          ))}
        </div>
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

function StatementSkeleton({
  rows = 6,
  link = false,
}: {
  rows?: number;
  link?: boolean;
}) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-40" />
      <SkeletonTable columns={["w-40", "ml-auto w-24"]} rows={rows} />
      {link ? <Skeleton className="h-8 w-32" /> : null}
    </div>
  );
}

function ListItemsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="space-y-1.5">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}

const incomeColumns = ["w-20", "w-28", "w-32", "ml-auto w-20", ""];
const expenseColumns = ["w-20", "w-24", "w-32", "ml-auto w-20", ""];
const budgetColumns = [
  "w-12",
  "w-28",
  "ml-auto w-20",
  "ml-auto w-16",
  "ml-auto w-20",
  "w-24",
  "",
];

export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton titleWidth="w-80" />
      <div className="space-y-3">
        <StatCardsSkeleton count={3} columns="sm:grid-cols-3" />
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <Card key={index} size="sm" className="bg-muted/35 text-center">
              <CardHeader className="items-center justify-items-center pb-2">
                <Skeleton className="size-3.5" />
                <Skeleton className="h-3 w-24" />
              </CardHeader>
              <CardContent className="flex justify-center">
                <Skeleton className="h-6 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-5">
        <ChartCardSkeleton className="xl:col-span-3" />
        <PieCardSkeleton className="xl:col-span-2" titleWidth="w-36" />
      </div>
      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-80" />
        </CardHeader>
        <CardContent>
          <StatementSkeleton rows={5} link />
        </CardContent>
      </Card>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-52" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent>
            <SkeletonTable columns={["w-20", "w-36", "ml-auto w-20"]} rows={4} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <SkeletonTable columns={["w-24", "w-40", "w-24"]} rows={4} />
          </CardContent>
        </Card>
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
        <PieCardSkeleton className="xl:col-span-2" />
      </div>
      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
            <div className="space-y-2">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-8 w-24" />
          </CardHeader>
          <CardContent>
            <SkeletonTable
              columns={["w-20", "w-36", "w-28", "ml-auto w-20"]}
              rows={5}
            />
          </CardContent>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent>
            <SkeletonTable
              columns={["w-24", "ml-auto w-16", "ml-auto w-20"]}
              rows={5}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function ParishDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton titleWidth="w-[22rem]" />
      <StatCardsSkeleton count={4} columns="sm:grid-cols-2 xl:grid-cols-4" />
      <div className="grid gap-4 xl:grid-cols-5">
        <ChartCardSkeleton className="xl:col-span-3" />
        <PieCardSkeleton className="xl:col-span-2" titleWidth="w-52" />
      </div>
      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-80" />
        </CardHeader>
        <CardContent>
          <StatementSkeleton rows={5} link />
        </CardContent>
      </Card>
      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <ListItemsSkeleton count={3} />
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function TableManagerSkeleton({ action = true }: { action?: boolean }) {
  return (
    <div className="space-y-4">
      <PageHeaderSkeleton action={action} />
      <Card size="sm">
        <CardContent className="px-3 py-0">
          <ManagerBlock
            action={action}
            columns={incomeColumns}
            rows={8}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export function UsersPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton action titleWidth="w-56" />
      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-80" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
          <SkeletonTable
            columns={[
              "w-28",
              "w-36",
              "w-24",
              "w-20",
              "w-24",
              "w-16",
              "w-24",
              "",
            ]}
            rows={8}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export function ExpensesPageSkeleton() {
  return (
    <div className="space-y-4">
      <PageHeaderSkeleton titleWidth="w-32" />
      <Card>
        <CardHeader className="items-center space-y-2 text-center">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-52" />
        </CardHeader>
        <CardContent className="flex justify-center">
          <Skeleton className="h-8 w-36" />
        </CardContent>
      </Card>
      <Card size="sm">
        <CardContent className="px-3 py-0">
          <ManagerBlock
            titleWidth="w-24"
            columns={expenseColumns}
            rows={7}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export function BudgetAllocationSkeleton() {
  return (
    <div className="space-y-4">
      <PageHeaderSkeleton titleWidth="w-52" />
      <Card size="sm">
        <CardContent className="px-3 py-0">
          <ManagerBlock titleWidth="w-24" columns={budgetColumns} rows={6} />
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminBudgetSkeleton() {
  return (
    <div className="space-y-4">
      <PageHeaderSkeleton titleWidth="w-28" />
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index} size="sm">
            <CardHeader className="pb-1">
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-36" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card size="sm">
        <CardContent className="px-3 py-0">
          <ManagerBlock titleWidth="w-24" columns={budgetColumns} rows={6} />
        </CardContent>
      </Card>
    </div>
  );
}

export function BudgetMonitoringSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton titleWidth="w-52" />
      <StatCardsSkeleton
        count={cards}
        columns="sm:grid-cols-2 xl:grid-cols-4"
        layout="inline"
      />
      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-3 w-full rounded-full" />
          <SkeletonTable
            columns={[
              "w-12",
              "w-24",
              "w-24",
              "ml-auto w-20",
              "ml-auto w-16",
              "ml-auto w-20",
              "ml-auto w-10",
            ]}
            rows={6}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export function BudgetHistorySkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton titleWidth="w-44" />
      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <SkeletonTable
            columns={["w-28", "w-32", "w-32", "ml-auto w-20", "w-24"]}
            rows={8}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export function IncomeOverviewSkeleton() {
  return (
    <div className="space-y-4">
      <PageHeaderSkeleton titleWidth="w-28" />
      <StatCardsSkeleton
        count={5}
        columns="sm:grid-cols-2 lg:grid-cols-3"
        layout="inline"
      />
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} size="sm">
          <CardContent className="px-3 py-0">
            <ManagerBlock columns={incomeColumns} rows={4} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ReceiveFundsSkeleton() {
  return (
    <div className="space-y-4">
      <PageHeaderSkeleton titleWidth="w-56" />
      <Card size="sm">
        <CardContent className="px-3 py-0">
          <ManagerBlock columns={incomeColumns} rows={8} />
        </CardContent>
      </Card>
    </div>
  );
}

export function IncomeCategoriesSkeleton() {
  return (
    <div className="space-y-4">
      <PageHeaderSkeleton titleWidth="w-52" />
      <Card size="sm">
        <CardContent className="px-3 py-0">
          <ManagerBlock
            titleWidth="w-40"
            columns={["w-32", "w-48", "ml-auto w-16", ""]}
            rows={6}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export function IncomeServicesSkeleton() {
  return (
    <div className="space-y-4">
      <PageHeaderSkeleton titleWidth="w-48" />
      <Card size="sm">
        <CardContent className="px-3 py-0">
          <ManagerBlock
            titleWidth="w-56"
            extraFilters={1}
            columns={["w-40", "w-36", "w-16", ""]}
            rows={8}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export function ExpenseCategoriesSkeleton() {
  return (
    <div className="space-y-4">
      <PageHeaderSkeleton titleWidth="w-52" />
      <Card size="sm">
        <CardContent className="space-y-3 px-3 py-3">
          <div className="flex justify-end">
            <Skeleton className="h-8 w-[200px]" />
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <section key={index} className="space-y-2 rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-3 w-52" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
                <SkeletonTable
                  columns={index === 0 ? ["w-32", ""] : ["w-28", "w-32", ""]}
                  rows={5}
                />
              </section>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function CashFlowPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton titleWidth="w-36" />
      <ChartCardSkeleton />
      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-72" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-8 w-[180px]" />
            <Skeleton className="h-8 w-[150px]" />
            <Skeleton className="h-8 w-[150px]" />
          </div>
          <StatementSkeleton rows={8} />
        </CardContent>
      </Card>
    </div>
  );
}

export function ReportsPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton action actions={2} titleWidth="w-56" />
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-[220px]" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-[180px]" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-8 w-[150px]" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-8 w-[150px]" />
        </div>
      </div>
      <article className="mx-auto space-y-6 rounded-xl border bg-white p-6 text-black dark:bg-white">
        <div className="flex items-center justify-center gap-3">
          <Skeleton className="size-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="mx-auto h-5 w-64" />
            <Skeleton className="mx-auto h-3 w-52" />
          </div>
          <Skeleton className="size-16 rounded-full" />
        </div>
        <Skeleton className="mx-auto h-5 w-72" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
        <Skeleton className="h-px w-full" />
        <SkeletonTable
          columns={["w-20", "w-28", "w-32", "w-24", "ml-auto w-20"]}
          rows={6}
        />
        <div className="grid gap-8 sm:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex justify-between gap-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
          <div className="flex justify-center">
            <Skeleton className="size-40 rounded-full" />
          </div>
        </div>
        <div className="grid gap-8 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="space-y-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-8 h-px w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}

export function AuditTabContentSkeleton() {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <SkeletonTable
          columns={["w-28", "w-28", "w-24", "w-24", "w-40"]}
          rows={8}
        />
      </CardContent>
    </Card>
  );
}

export function AuditPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton titleWidth="w-36" />
      <div className="flex gap-4 border-b pb-2">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-8 w-32" />
      </div>
      <AuditTabContentSkeleton />
    </div>
  );
}

export function SettingsPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton titleWidth="w-32" />
      <Card className="max-w-xl">
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-24" />
        </CardContent>
      </Card>
    </div>
  );
}

export function AnnouncementManagerSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton titleWidth="w-56" />
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-36" />
      </div>
      <SkeletonTable
        columns={["w-48", "w-20", "w-28", "w-28", ""]}
        rows={6}
      />
    </div>
  );
}

export function ParishInfoSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton titleWidth="w-56" />
      {Array.from({ length: 2 }).map((_, index) => (
        <Card key={index}>
          <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-52" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <ListItemsSkeleton count={3} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ParishListSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton titleWidth="w-72" />
      <Card>
        <CardContent className="pt-6">
          <ListItemsSkeleton count={4} />
        </CardContent>
      </Card>
    </div>
  );
}

export function ViewTableSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton titleWidth="w-48" />
      <StatCardsSkeleton count={1} columns="sm:grid-cols-1" layout="inline" />
      <Card>
        <CardContent className="pt-6">
          <SkeletonTable
            columns={["w-20", "w-32", "w-28", "ml-auto w-20"]}
            rows={8}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export function ProfilePageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton titleWidth="w-28" />
      <div className="mx-auto grid w-full max-w-4xl gap-6">
        <Card>
          <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <Skeleton className="size-20 rounded-full" />
            <Skeleton className="h-8 w-36" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-80" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-full" />
              </div>
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
            <Skeleton className="mt-6 h-8 w-28" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function PasswordPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton titleWidth="w-48" />
      <Card className="max-w-xl">
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
          <Skeleton className="h-8 w-36" />
        </CardContent>
      </Card>
    </div>
  );
}

export function FormPageSkeleton() {
  return <ProfilePageSkeleton />;
}
