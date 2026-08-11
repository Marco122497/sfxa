import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/auth/session";
import { getDashboardPath } from "@/lib/auth/roles";
import { SplashScreen } from "@/components/auth/splash-screen";

export default async function HomePage() {
  const { user, profile } = await getSessionUser();

  if (user && profile?.status) {
    redirect(getDashboardPath(profile.role));
  }

  return <SplashScreen durationMs={2000} href="/login" />;
}
  