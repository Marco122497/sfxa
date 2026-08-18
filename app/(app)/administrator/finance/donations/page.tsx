import { redirect } from "next/navigation";

export default function AdminDonationsRedirectPage() {
  redirect("/administrator/finance/donation");
}
