"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import {
  Loader2,
  PhoneIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
} from "lucide-react";

import {
  forgotPassword,
  resendPasswordResetOtp,
  verifyPasswordResetOtp,
  type AuthActionState,
} from "@/app/actions/auth";
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
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = { step: "phone" };

export function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneMasked, setPhoneMasked] = useState("");
  const [otp, setOtp] = useState("");

  const [phoneState, phoneAction, phonePending] = useActionState(
    forgotPassword,
    initialState
  );
  const [otpState, otpAction, otpPending] = useActionState(
    verifyPasswordResetOtp,
    initialState
  );
  const [resendState, resendAction, resendPending] = useActionState(
    resendPasswordResetOtp,
    initialState
  );

  useActionToast(phoneState);
  useActionToast(otpState);
  useActionToast(resendState);

  useEffect(() => {
    if (phoneState.step === "otp") {
      setStep("otp");
      setPhoneMasked(phoneState.phoneMasked ?? "");
      setOtp("");
    }
  }, [phoneState]);

  useEffect(() => {
    if (resendState.step === "otp") {
      setStep("otp");
      setPhoneMasked(resendState.phoneMasked ?? "");
      setOtp("");
    }
    if (resendState.step === "phone") {
      setStep("phone");
    }
  }, [resendState]);

  useEffect(() => {
    if (otpState.redirectTo) {
      router.replace(otpState.redirectTo);
      return;
    }
    if (otpState.step === "phone") {
      setStep("phone");
    }
    if (otpState.step === "otp" && otpState.phoneMasked) {
      setPhoneMasked(otpState.phoneMasked);
    }
  }, [otpState, router]);

  if (step === "otp") {
    return (
      <Card className="w-full max-w-md border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <ShieldCheckIcon className="size-5" />
            Verify your identity
          </CardTitle>
          <CardDescription>
            Enter the verification code we sent to your mobile number
            {phoneMasked ? (
              <>
                :{" "}
                <span className="font-medium text-foreground">{phoneMasked}</span>
                .
              </>
            ) : (
              "."
            )}
          </CardDescription>
        </CardHeader>
        <form action={otpAction}>
          <input type="hidden" name="otp" value={otp} />
          <CardContent>
            <Field>
              <div className="flex items-center justify-between gap-2">
                <FieldLabel htmlFor="otp-verification">
                  Verification code
                </FieldLabel>
                <Button
                  type="submit"
                  formAction={resendAction}
                  variant="outline"
                  size="xs"
                  disabled={resendPending || otpPending}
                >
                  {resendPending ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <RefreshCwIcon />
                  )}
                  Resend Code
                </Button>
              </div>
              <InputOTP
                maxLength={6}
                id="otp-verification"
                value={otp}
                onChange={setOtp}
                required
                containerClassName="justify-center"
              >
                <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-11 *:data-[slot=input-otp-slot]:text-xl">
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator className="mx-2" />
                <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-11 *:data-[slot=input-otp-slot]:text-xl">
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
              <FieldDescription>
                <Link href="/login">Back to sign in</Link>
              </FieldDescription>
            </Field>
          </CardContent>
          <CardFooter>
            <Field>
              <Button
                type="submit"
                className="w-full"
                disabled={otpPending || otp.length !== 6}
                size="lg"
              >
                {otpPending ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Verifying…
                  </>
                ) : (
                  "Verify"
                )}
              </Button>
              <div className="text-sm text-muted-foreground">
                Having trouble? Ask an administrator to confirm your contact
                number on file.
              </div>
            </Field>
          </CardFooter>
        </form>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md border-border/80 shadow-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2 text-2xl">
          <PhoneIcon className="size-5" />
          Forgot password
        </CardTitle>
        <CardDescription>
          Enter your registered mobile number and we will text a verification
          code.
        </CardDescription>
      </CardHeader>
      <form action={phoneAction}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mobile">Mobile number</Label>
            <Input
              id="mobile"
              name="mobile"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="09XXXXXXXXX"
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={phonePending} size="lg">
            {phonePending ? (
              <>
                <Loader2 className="animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <PhoneIcon />
                Send verification code
              </>
            )}
          </Button>
          <Link
            href="/login"
            className="text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
