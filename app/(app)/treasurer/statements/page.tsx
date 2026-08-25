import { redirect } from "next/navigation";

export default function TreasurerStatementsRedirectPage() {
  redirect("/treasurer/cash-flow");
}
