"use client";

import { useActionState, useState } from "react";
import { Loader2, UserPlusIcon } from "lucide-react";

import { createUser, type UserActionState } from "@/app/actions/users";
import { useRefreshOnSuccess } from "@/hooks/use-refresh-on-success";
import { ROLES } from "@/lib/auth/roles";
import { displayRoleName } from "@/lib/income";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: UserActionState = {};

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function AddUserForm({
  onSuccess,
}: {
  onSuccess: () => void;
}) {
  const [state, formAction, pending] = useActionState(createUser, initialState);

  useRefreshOnSuccess(state.success, onSuccess);

  return (
    <>
      <form action={formAction} className="space-y-4" id="add-user-form">
        {state.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="add-first_name">First Name</Label>
            <Input id="add-first_name" name="first_name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="add-middle_name">Middle Name</Label>
            <Input id="add-middle_name" name="middle_name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="add-last_name">Last Name</Label>
            <Input id="add-last_name" name="last_name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="add-suffix">Suffix</Label>
            <Input id="add-suffix" name="suffix" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="add-employee_no">Employee No.</Label>
            <Input id="add-employee_no" name="employee_no" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="add-role">Role</Label>
            <select
              id="add-role"
              name="role"
              required
              defaultValue=""
              className={selectClassName}
            >
              <option value="">Select role</option>
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {displayRoleName(role)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="add-email">Email</Label>
            <Input id="add-email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="add-password">Temporary Password</Label>
            <Input
              id="add-password"
              name="password"
              type="password"
              minLength={8}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="add-status">Status</Label>
            <select
              id="add-status"
              name="status"
              defaultValue="1"
              className={selectClassName}
            >
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
          </div>
        </div>
      </form>

      <AlertDialogFooter>
        <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
        <Button type="submit" form="add-user-form" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="animate-spin" />
              Creating…
            </>
          ) : (
            <>
              <UserPlusIcon />
              Add user
            </>
          )}
        </Button>
      </AlertDialogFooter>
    </>
  );
}

export function AddUserDialog({
  label,
}: {
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button type="button" />}>
        <UserPlusIcon />
        {label ?? "Add User"}
      </AlertDialogTrigger>

      <AlertDialogContent className="max-w-lg sm:max-w-xl">
        <AlertDialogHeader>
          <AlertDialogTitle>{label ?? "Add User"}</AlertDialogTitle>
          <AlertDialogDescription>
            Create an Administrator, Treasurer, or Parish Member account.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AddUserForm
          key={formKey}
          onSuccess={() => {
            setOpen(false);
            setFormKey((current) => current + 1);
          }}
        />
      </AlertDialogContent>
    </AlertDialog>
  );
}
