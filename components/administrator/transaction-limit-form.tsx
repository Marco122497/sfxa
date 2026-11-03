"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  updateTransactionLimit,
  type ParishSettingsActionState,
} from "@/app/actions/settings";
import { useServerAction } from "@/hooks/use-refresh-on-success";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ParishSettingsActionState = {};

export function TransactionLimitForm({
  initialLimit,
}: {
  initialLimit: number;
}) {
  const [limit, setLimit] = useState(String(initialLimit));
  const [, formAction, pending] = useServerAction(
    async (prev, formData) => {
      const result = await updateTransactionLimit(prev, formData);
      if (result.error) toast.error(result.error);
      if (result.success) toast.success(result.success);
      return result;
    },
    initialState
  );

  useEffect(() => {
    setLimit(String(initialLimit));
  }, [initialLimit]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction limit</CardTitle>
        <CardDescription>
          The largest amount a treasurer can record in one walk-in payment. An
          administrator can still record a higher amount. Enter 0 for no cap.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex max-w-md flex-col gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="transaction_limit">Limit (₱)</Label>
            <Input
              id="transaction_limit"
              name="transaction_limit"
              type="number"
              min="0"
              step="0.01"
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
              required
            />
          </div>
          <div>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Saving…
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
