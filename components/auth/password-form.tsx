"use client";

import { useActionState, useState } from "react";
import { EyeIcon, EyeOffIcon, KeyRoundIcon, Loader2 } from "lucide-react";

import {
  changePassword,
  resetPassword,
  type AuthActionState,
} from "@/app/actions/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = {};

type PasswordFormProps = {
  mode: "change" | "reset";
};

export function PasswordForm({ mode }: PasswordFormProps) {
  const action = mode === "change" ? changePassword : resetPassword;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Card className="w-full max-w-md border-border/80 shadow-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2 text-2xl">
          <KeyRoundIcon className="size-5" />
          {mode === "change" ? "Change password" : "Set new password"}
        </CardTitle>
        <CardDescription>
          {mode === "change"
            ? "Confirm your current password, then choose a new one."
            : "Choose a new password for your SFXA Finance account."}
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          {state.success && (
            <Alert>
              <AlertDescription>{state.success}</AlertDescription>
            </Alert>
          )}
          {mode === "change" && (
            <div className="space-y-2">
              <Label htmlFor="current_password">Current password</Label>
              <div className="relative">
                <Input
                  id="current_password"
                  name="current_password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute top-1/2 right-1.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOffIcon className="size-4" />
                  ) : (
                    <EyeIcon className="size-4" />
                  )}
                </button>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="new_password">New password</Label>
            <Input
              id="new_password"
              name="new_password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirm new password</Label>
            <Input
              id="confirm_password"
              name="confirm_password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={pending} size="lg">
            {pending ? (
              <>
                <Loader2 className="animate-spin" />
                Saving…
              </>
            ) : mode === "change" ? (
              <>
                <KeyRoundIcon />
                Update password
              </>
            ) : (
              <>
                <KeyRoundIcon />
                Save new password
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
