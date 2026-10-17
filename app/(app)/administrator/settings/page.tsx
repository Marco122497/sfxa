import { SettingsIcon } from "lucide-react";

import { isFakeLoginErrorEnabled } from "@/lib/auth/fake-login-error";
import { isProtectedAdminAccount } from "@/lib/auth/roles";
import { requireAdmin } from "@/lib/auth/session";
import { getParishPriestName } from "@/lib/parish-settings";
import { FakeLoginErrorSwitch } from "@/components/administrator/fake-login-error-switch";
import { ParishPriestSettingsForm } from "@/components/administrator/parish-priest-settings-form";
import { PageHeading } from "@/components/layout/page-heading";

export default async function AdminSettingsPage() {
  const { supabase, user } = await requireAdmin();
  const parishPriestName = await getParishPriestName(supabase);
  const showSignInErrorSwitch = isProtectedAdminAccount(user.email);
  const signInErrorEnabled = showSignInErrorSwitch
    ? await isFakeLoginErrorEnabled()
    : false;

  return (
    <div className="space-y-6">
      <PageHeading
        title="Settings"
        description="System configuration used on printed reports."
        icon={SettingsIcon}
      />
      <ParishPriestSettingsForm initialName={parishPriestName} />
      {showSignInErrorSwitch ? (
        <FakeLoginErrorSwitch enabled={signInErrorEnabled} />
      ) : null}
    </div>
  );
}
