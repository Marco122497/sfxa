import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/auth/session";
import { getDashboardPath } from "@/lib/auth/roles";

export default async function HomePage() {
  const { user, profile } = await getSessionUser();

  if (user && profile?.status) {
    redirect(getDashboardPath(profile.role));
  }

  redirect("/login");
}
