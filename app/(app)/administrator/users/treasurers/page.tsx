import { redirect } from "next/navigation";

export default function AdminTreasurersRedirectPage() {
  redirect("/administrator/users");
}
