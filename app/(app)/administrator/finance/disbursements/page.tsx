import { redirect } from "next/navigation";

export default function AdminDisbursementsRedirectPage() {
  redirect("/administrator/finance/expenses");
}
