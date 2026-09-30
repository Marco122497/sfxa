import { redirect } from "next/navigation";

import { resolveIncomeCategory } from "@/lib/income-categories";
import { loadIncomeCategories } from "@/lib/income-categories-server";

export default async function TreasurerDonationsRedirectPage() {
  const categories = await loadIncomeCategories();
  const meta = resolveIncomeCategory(categories, "donations");
  redirect(`/treasurer/receive/${meta?.code ?? "donation"}`);
}
