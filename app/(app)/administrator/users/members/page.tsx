import { redirect } from "next/navigation";

export default function AdminMembersRedirectPage() {
  redirect("/administrator/users");
}
