import { requireAdmin } from "@/lib/auth/session";
import { TransactionHistory } from "@/components/finance/transaction-history";

export default async function AdminHistoryPage() {
  await requireAdmin();
  return <TransactionHistory />;
}
