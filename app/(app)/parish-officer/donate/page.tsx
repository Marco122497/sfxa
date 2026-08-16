import { HandCoinsIcon } from "lucide-react";

import { requireParishOfficer } from "@/lib/auth/session";
import { loadIncomeTypeOptions } from "@/lib/treasurer/receive-income";
import { OnlineDonateForm } from "@/components/parish-officer/online-donate-form";
import { ParishViewPageHeader } from "@/components/parish-officer/parish-view-page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DonateOnlinePage() {
  const { supabase, profile } = await requireParishOfficer();
  const donationTypes = await loadIncomeTypeOptions("donation", {
    ensureCategories: false,
  });

  let chapelName: string | null = null;
  if (profile.chapel_id) {
    const { data } = await supabase
      .from("chapels")
      .select("chapel_name")
      .eq("chapel_id", profile.chapel_id)
      .maybeSingle();
    chapelName = data?.chapel_name ?? null;
  }

  return (
    <div className="space-y-6">
      <ParishViewPageHeader
        title="Donate Online"
        description="Select a donation type, amount, and payment method. The Treasurer verifies the gift before it is included in cash inflow."
        icon={HandCoinsIcon}
      />
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Submit donation</CardTitle>
          <CardDescription>
            You will receive confirmation here. A receipt is available after
            submission.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OnlineDonateForm
            categories={donationTypes}
            chapelName={chapelName}
          />
        </CardContent>
      </Card>
    </div>
  );
}
