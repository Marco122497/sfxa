import { ShoppingBasketIcon } from "lucide-react";
import { requireParishOfficer } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { isCollectionCategoryName } from "@/lib/categories";
import { formatDate, formatMoney, toNumber } from "@/lib/format";
import { isReportPeriod } from "@/lib/reports";
import { startOfPeriod } from "@/lib/reports-period";
import { ParishViewPageHeader } from "@/components/parish-officer/parish-view-page-header";
import { ReportPeriodSelect } from "@/components/administrator/report-period-select";
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

export default async function ParishCollectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  await requireParishOfficer();
  const params = await searchParams;
  const period = isReportPeriod(params.period) ? params.period : "monthly";
  const fromDate = startOfPeriod(period);
  const supabase = await createClient();

  const [{ data: categories }, { data: donations }] = await Promise.all([
    supabase
      .from("donation_categories")
      .select("category_id, category_name")
      .order("category_name"),
    supabase
      .from("donations")
      .select("donation_id, amount, donation_date, remarks, category_id")
      .gte("donation_date", fromDate)
      .order("donation_date", { ascending: false }),
  ]);

  const collectionCategories = (categories ?? []).filter((row) =>
    isCollectionCategoryName(row.category_name)
  );
  const collectionIds = new Set(
    collectionCategories.map((row) => row.category_id)
  );
  const nameById = new Map(
    collectionCategories.map((row) => [row.category_id, row.category_name])
  );

  const records = (donations ?? []).filter(
    (row) => row.category_id != null && collectionIds.has(row.category_id)
  );

  const totals = new Map<number, number>();
  let grandTotal = 0;
  for (const row of records) {
    const amount = toNumber(row.amount);
    totals.set(row.category_id!, (totals.get(row.category_id!) ?? 0) + amount);
    grandTotal += amount;
  }

  const summaryRows = collectionCategories.map((category) => ({
    ...category,
    total: totals.get(category.category_id) ?? 0,
  }));

  return (
    <div className="space-y-6">
      <ParishViewPageHeader
        title="Collections"
        description="View parish collections and income by type. Read-only — no add, edit, or delete."
        icon={ShoppingBasketIcon}
        actions={
          <ReportPeriodSelect
            period={period}
            basePath="/parish-officer/collections"
          />
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Collections by type</CardTitle>
          <CardDescription>
            From {formatDate(fromDate)} · Total {formatMoney(grandTotal)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {summaryRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No collection categories yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Collection type</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summaryRows.map((row) => (
                  <TableRow key={row.category_id}>
                    <TableCell>{row.category_name}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(row.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Collection records</CardTitle>
          <CardDescription>Individual entries in the period.</CardDescription>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No collections in period.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Collection type</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((row) => (
                  <TableRow key={row.donation_id}>
                    <TableCell>{formatDate(row.donation_date)}</TableCell>
                    <TableCell>
                      {nameById.get(row.category_id!) || "—"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {row.remarks || "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(row.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
