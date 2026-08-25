"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  updateParishPriestName,
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

export function ParishPriestSettingsForm({
  initialName,
}: {
  initialName: string;
}) {
  const [name, setName] = useState(initialName);
  const [, formAction, pending] = useServerAction(
    async (prev, formData) => {
      const result = await updateParishPriestName(prev, formData);
      if (result.error) toast.error(result.error);
      if (result.success) toast.success(result.success);
      return result;
    },
    initialState
  );

  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Report signatory</CardTitle>
        <CardDescription>
          This name appears under Noted by on printed financial reports.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex max-w-md flex-col gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="parish_priest_name">Parish priest name</Label>
            <Input
              id="parish_priest_name"
              name="parish_priest_name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={150}
              placeholder="Parish Priest"
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
