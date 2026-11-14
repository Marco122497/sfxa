export type FeeYearAdjustment = {
  year: number;
  adjustment: number;
};

export type ChurchServiceFee = {
  categoryId: number;
  standardAmount: number;
  adjustments: FeeYearAdjustment[];
};

export function feeForYear(
  standardAmount: number,
  adjustments: FeeYearAdjustment[],
  year: number
) {
  const match = adjustments.find((item) => item.year === year);
  const adjustment = match?.adjustment ?? 0;
  return Math.round((standardAmount + adjustment) * 100) / 100;
}

export function feeSchemaMessage(message: string) {
  if (/standard_amount|service_at|priest_name|paid_time|service_fee_years/i.test(message)) {
    return "Run sql/phase10-church-services.sql in Supabase, then try again.";
  }
  return null;
}
