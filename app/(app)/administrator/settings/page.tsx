import { SettingsIcon } from "lucide-react";

import { requireAdmin } from "@/lib/auth/session";
import { getParishPriestName } from "@/lib/parish-settings";
import { ParishPriestSettingsForm } from "@/components/administrator/parish-priest-settings-form";
import { PageHeading } from "@/components/layout/page-heading";

export default async function AdminSettingsPage() {
  const { supabase } = await requireAdmin();
  const parishPriestName = await getParishPriestName(supabase);

  return (
    <div className="space-y-6">
      <PageHeading
        title="Settings"
        description="System configuration used on printed reports."
        icon={SettingsIcon}
      />
      <ParishPriestSettingsForm initialName={parishPriestName} />
    </div>
  );
}
