"use client";

import { useActionState, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, PhoneIcon } from "lucide-react";

import {
  saveContactNumber,
  type ProfileActionState,
} from "@/app/actions/profile";
import { useActionToast } from "@/hooks/use-action-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ProfileActionState = {};

type RequiredMobileDialogProps = {
  missing: boolean;
};

export function RequiredMobileDialog({ missing }: RequiredMobileDialogProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    saveContactNumber,
    initialState
  );

  useActionToast(state);

  // Show on app pages when contact number is missing (including profile).
  useEffect(() => {
    setOpen(missing);
  }, [missing, pathname]);

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      router.refresh();
    }
  }, [state.success, router]);

  if (!missing) {
    return null;
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        // Required until a number is saved — ignore dismiss attempts.
        if (!next && missing && !state.success) {
          setOpen(true);
          return;
        }
        setOpen(next);
      }}
    >
      <AlertDialogContent className="max-w-md" size="default">
        <AlertDialogHeader>
          <AlertDialogMedia>
            <PhoneIcon />
          </AlertDialogMedia>
          <AlertDialogTitle>Mobile number required</AlertDialogTitle>
          <AlertDialogDescription>
            Add your mobile number so you can recover your account with SMS
            verification if you forget your password. This field is required.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form action={formAction} className="space-y-4" id="required-mobile-form">
          <div className="space-y-2">
            <Label htmlFor="required-contact_number">Mobile number</Label>
            <Input
              id="required-contact_number"
              name="contact_number"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="09XXXXXXXXX"
              required
              disabled={pending}
            />
          </div>
        </form>

        <AlertDialogFooter>
          <AlertDialogAction
            type="submit"
            form="required-mobile-form"
            disabled={pending}
          >
            {pending ? (
              <>
                <Loader2 className="animate-spin" />
                Saving…
              </>
            ) : (
              "Save mobile number"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
