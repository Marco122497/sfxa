import { requireTreasurer } from "@/lib/auth/session";
import { TransactionHistory } from "@/components/finance/transaction-history";

export default async function TreasurerHistoryPage() {
  await requireTreasurer();
  return <TransactionHistory />;
}
