import { redirect } from "next/navigation";
import { loadIncomeCategories } from "@/lib/income-categories-server";

export default async function TreasurerReceiveIndexPage() {
  const categories = await loadIncomeCategories();
  redirect(`/treasurer/receive/${categories[0]?.code ?? "collection"}`);
}
