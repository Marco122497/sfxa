import { redirect } from "next/navigation";

export default function TreasurerDonationsRedirectPage() {
  redirect("/treasurer/receive/donation");
}
