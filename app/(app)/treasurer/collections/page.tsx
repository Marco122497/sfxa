import { redirect } from "next/navigation";

import { resolveIncomeCategory } from "@/lib/income-categories";
import { loadIncomeCategories } from "@/lib/income-categories-server";

export default async function TreasurerCollectionsRedirectPage() {
  const categories = await loadIncomeCategories();
  const meta = resolveIncomeCategory(categories, "collections");
  redirect(`/treasurer/receive/${meta?.code ?? "collection"}`);
}
