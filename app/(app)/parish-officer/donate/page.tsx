import { HandCoinsIcon } from "lucide-react";

import { requireParishOfficer } from "@/lib/auth/session";
import { ParishViewPageHeader } from "@/components/parish-officer/parish-view-page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DonateOnlinePage() {
  await requireParishOfficer();

  return (
    <div className="space-y-6">
      <ParishViewPageHeader
        title="Parish Payments"
        description="Payments are received in person. The treasurer records each one with an official receipt number."
        icon={HandCoinsIcon}
      />
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Walk-in only</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          A payment such as a wedding is made at the parish. The treasurer
          enters it in Receive Funds and writes the OR number from the official
          receipt.
        </CardContent>
      </Card>
    </div>
  );
}
