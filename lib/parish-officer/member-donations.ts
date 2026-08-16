import { classifyIncomeName } from "@/lib/income";
import { relationName } from "@/lib/treasurer/relations";

export type MemberDonation = {
  donation_id: number;
  donor_name: string | null;
  amount: number | string;
  donation_date: string;
  remarks: string | null;
  category_name: string | null;
  status: string;
  receipt_url: string | null;
};

function isOnline(remarks: string | null, status: string) {
  return status === "pending" || status === "received" || String(remarks || "").includes("[ONLINE]");
}

export async function loadMemberDonations(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  userId: string,
  fullName: string
): Promise<MemberDonation[]> {
  const withExtra = await supabase
    .from("donations")
    .select(
      "donation_id, donor_name, amount, donation_date, remarks, status, receipt_url, created_by, donor_user_id, donation_categories(category_name)"
    )
    .order("donation_date", { ascending: false });

  const result = withExtra.error
    ? await supabase
        .from("donations")
        .select(
          "donation_id, donor_name, amount, donation_date, remarks, created_by, donation_categories(category_name)"
        )
        .order("donation_date", { ascending: false })
    : withExtra;

  const rows = (result.data ?? [])
    .filter((row) => {
      const donorUser =
        "donor_user_id" in row ? String(row.donor_user_id ?? "") : "";
      const createdBy = String(row.created_by ?? "");
      return (
        donorUser === userId ||
        createdBy === userId ||
        row.donor_name === fullName
      );
    })
    .map((row) => ({
      donation_id: row.donation_id,
      donor_name: row.donor_name,
      amount: row.amount,
      donation_date: row.donation_date,
      remarks: row.remarks,
      category_name: relationName(row.donation_categories as never),
      status: "status" in row ? String(row.status || "received") : "received",
      receipt_url:
        "receipt_url" in row ? (row.receipt_url as string | null) : null,
    }))
    .filter(
      (row) =>
        classifyIncomeName(row.category_name) === "donation" ||
        isOnline(row.remarks, row.status)
    );

  return rows;
}

export function donationStatusLabel(status: string, remarks: string | null) {
  if (status === "pending") return "Pending treasurer receive";
  if (status === "received") return "Received";
  if (String(remarks || "").includes("[ONLINE]")) return "Submitted";
  return "Recorded";
}
