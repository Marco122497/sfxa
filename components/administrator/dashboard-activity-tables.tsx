import { formatDate, formatMoney } from "@/lib/format";
import type {
  RecentFinancialActivity,
  RecentUserActivity,
} from "@/lib/admin/dashboard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function RecentFinancialActivitiesTable({
  rows,
}: {
  rows: RecentFinancialActivity[];
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Transaction</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.slice(0, 8).map((row) => (
          <TableRow key={row.id}>
            <TableCell className="whitespace-nowrap">
              {formatDate(row.date)}
            </TableCell>
            <TableCell className="max-w-[220px] truncate">
              {row.transaction}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatMoney(row.amount)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function RecentUserActivitiesTable({
  rows,
}: {
  rows: RecentUserActivity[];
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Activity</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.slice(0, 8).map((row) => (
          <TableRow key={row.id}>
            <TableCell className="whitespace-nowrap font-medium">
              {row.user}
            </TableCell>
            <TableCell className="max-w-[220px] truncate">
              {row.activity}
            </TableCell>
            <TableCell className="whitespace-nowrap">
              {formatDate(row.date)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
