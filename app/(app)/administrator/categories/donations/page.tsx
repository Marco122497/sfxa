import { redirect } from "next/navigation";

export default function AdminDonationCategoriesRedirectPage() {
  redirect("/administrator/categories/income-services");
}
