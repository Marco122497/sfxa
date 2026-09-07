"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EyeIcon, EyeOffIcon, Loader2, LogInIcon } from "lucide-react";
import { toast } from "sonner";

import { login, type AuthActionState } from "@/app/actions/auth";
import { useActionToast } from "@/hooks/use-action-toast";
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

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, formAction, pending] = useActionState(login, initialState);
  const [showPassword, setShowPassword] = useState(false);
  useActionToast(state);

  const redirecting = Boolean(state.redirectTo);
  const busy = pending || redirecting;

  const queryError = searchParams.get("error");
  const resetSuccess = searchParams.get("reset") === "success";
  const registered = searchParams.get("registered") === "1";

  useEffect(() => {
    if (queryError === "inactive") {
      toast.error("Your account is deactivated. Contact an administrator.");
    } else if (queryError === "noprofile") {
      toast.error(
        "Your account has no profile yet. Ask an administrator to set up your access."
      );
    } else if (queryError === "auth_callback") {
      toast.error("Sign-in link is invalid or expired. Please try again.");
    }

    if (resetSuccess) {
      toast.success("Password updated. You can sign in with your new password.");
    }

    if (registered) {
      toast.success(
        "Account created successfully. Sign in with your email and password."
      );
    }
  }, [queryError, resetSuccess, registered]);

  useEffect(() => {
    if (state.redirectTo) {
      router.replace(state.redirectTo);
    }
  }, [state.redirectTo, router]);

  return (
    <>
      {busy ? (
        <div
          className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-primary/10"
          aria-hidden
        >
          <div className="login-top-progress h-full w-1/4 bg-primary" />
        </div>
      ) : null}

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
          <CardDescription>
            Access the SFXA parish finance system with your staff account.
          </CardDescription>
        </CardHeader>
        <form action={formAction} aria-busy={busy}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="sfxa@example"
                required
                disabled={busy}
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your Password"
                  required
                  disabled={busy}
                  className="h-10 rounded-xl pr-10"
                />
                <button
                  type="button"
                  className="absolute top-1/2 right-1.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
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
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button
              type="submit"
              className="w-full rounded-full font-bold"
              disabled={busy}
              size="lg"
            >
              {redirecting ? (
                <>
                  <Loader2 className="animate-spin" />
                  Redirecting…
                </>
              ) : pending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <LogInIcon />
                  Sign in
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </>
  );
}
