"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import {
  submitOnlineDonation,
  type OnlineDonationState,
} from "@/app/actions/online-donations";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: OnlineDonationState = {};

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function OnlineDonateForm({
  categories,
}: {
  categories: { category_id: number; category_name: string }[];
}) {
  const [state, formAction, pending] = useActionState(
    submitOnlineDonation,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state.success ? (
        <Alert>
          <AlertDescription>{state.success}</AlertDescription>
        </Alert>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="category_id">Donation type</Label>
        <select id="category_id" name="category_id" required className={selectClassName}>
          <option value="">Select type</option>
          {categories.map((item) => (
            <option key={item.category_id} value={item.category_id}>
              {item.category_name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="amount">Amount (₱)</Label>
        <Input id="amount" name="amount" type="number" min="1" step="0.01" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="payment_method">Payment method</Label>
        <select id="payment_method" name="payment_method" required className={selectClassName}>
          <option value="">Select method</option>
          <option value="GCash">GCash</option>
          <option value="Bank Transfer">Bank Transfer</option>
          <option value="Maya">Maya</option>
          <option value="Cash Pickup">Cash Pickup</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="remarks">Notes (optional)</Label>
        <Input id="remarks" name="remarks" />
      </div>
      <Button type="submit" disabled={pending || categories.length === 0}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        Submit donation
      </Button>
    </form>
  );
}
