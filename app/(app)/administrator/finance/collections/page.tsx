import { redirect } from "next/navigation";

export default function AdminCollectionsRedirectPage() {
  redirect("/administrator/finance/collection");
}
