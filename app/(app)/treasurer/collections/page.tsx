import { requireTreasurer } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { isCollectionCategoryName } from "@/lib/treasurer";
import { relationName } from "@/lib/treasurer/relations";
import { TreasurerPageHeader } from "@/components/treasurer/treasurer-page-header";
import { DonationManager } from "@/components/treasurer/donation-manager";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

export default async function TreasurerCollectionsPage() {
  await requireTreasurer();
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("donation_categories")
    .select("category_id, category_name")
    .order("category_name");

  const collectionCategories = (categories ?? []).filter((row) =>
    isCollectionCategoryName(row.category_name)
  );
  const collectionIds = collectionCategories.map((c) => c.category_id);

  const { data: donations } =
    collectionIds.length > 0
      ? await supabase
          .from("donations")
          .select(
            "donation_id, donor_name, category_id, amount, donation_date, remarks, donation_categories(category_name)"
          )
          .in("category_id", collectionIds)
          .order("donation_date", { ascending: false })
          .limit(200)
      : { data: [] };

  const rows = (donations ?? []).map((row) => ({
    donation_id: row.donation_id,
    donor_name: null as string | null,
    category_id: row.category_id,
    amount: row.amount,
    donation_date: row.donation_date,
    remarks: row.remarks,
    category_name: relationName(
      row.donation_categories as
        | { category_name?: string }
        | { category_name?: string }[]
        | null
    ),
  }));

  return (
    <div className="space-y-6">
      <TreasurerPageHeader
        title="Collection Management"
        description="Record parish collections by type from donation categories."
      />
      <Card>
        <CardContent className="pt-6">
          <DonationManager
            mode="collection"
            donations={rows}
            categories={collectionCategories}
            defaultCategoryId={collectionCategories[0]?.category_id}
            title="Collection history"
            emptyMessage="No collection entries yet."
          />
        </CardContent>
      </Card>
    </div>
  );
}
