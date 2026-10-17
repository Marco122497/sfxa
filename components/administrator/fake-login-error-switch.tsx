"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { setFakeLoginError } from "@/app/actions/settings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function FakeLoginErrorSwitch({ enabled }: { enabled: boolean }) {
  const [on, setOn] = useState(enabled);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !on;
    startTransition(async () => {
      const result = await setFakeLoginError(next);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setOn(next);
      toast.success(
        next ? "Sign-in server error is on." : "Sign-in server error is off."
      );
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign-in server error</CardTitle>
        <CardDescription>
          When this is on, administrator, treasurer, and parish member accounts
          see a server error after they sign in. superadmin@sfxa.com can still
          sign in and turn this off.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          disabled={pending}
          onClick={toggle}
          className="inline-flex items-center gap-3 disabled:opacity-60"
        >
          <span
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
              on ? "bg-primary" : "bg-muted"
            }`}
          >
            <span
              className={`absolute top-0.5 size-5 rounded-full bg-background shadow transition-transform ${
                on ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </span>
          <span className="text-sm font-medium">
            {pending ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="size-3.5 animate-spin" />
                Saving…
              </span>
            ) : on ? (
              "On"
            ) : (
              "Off"
            )}
          </span>
        </button>
      </CardContent>
    </Card>
  );
}
