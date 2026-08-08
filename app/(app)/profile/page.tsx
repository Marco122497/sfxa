import { UserRoundIcon } from "lucide-react";

import { ProfileForm } from "@/components/profile/profile-form";
import { PageHeading } from "@/components/layout/page-heading";
import { requireUser } from "@/lib/auth/session";

export default async function ProfilePage() {
  const { profile } = await requireUser();

  return (
    <div className="space-y-6">
      <PageHeading
        title="Profile"
        description="View and update your personal information."
        icon={UserRoundIcon}
      />
      <ProfileForm profile={profile} />
    </div>
  );
}
