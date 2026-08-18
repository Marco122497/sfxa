import { redirect } from "next/navigation";

export default function TreasurerDisbursementsRedirectPage() {
  redirect("/treasurer/release/expenses");
}
