"use client";

import { useMemo, useState } from "react";
import {
  CircleOffIcon,
  Loader2,
  PencilIcon,
  PowerIcon,
  Trash2Icon,
  UserRoundIcon,
} from "lucide-react";

import { useActionToast } from "@/hooks/use-action-toast";
import { useServerAction } from "@/hooks/use-refresh-on-success";
import {
  deleteUser,
  toggleUserStatus,
  updateUser,
  type UserActionState,
} from "@/app/actions/users";
import { ROLES, formatDateTime, type Profile } from "@/lib/auth/roles";
import { displayRoleName } from "@/lib/income";
import { formatDate } from "@/lib/format";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const initialState: UserActionState = {};

function initials(user: Profile) {
  return `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase();
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="grid grid-cols-[88px_1fr] gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words font-medium">{value || "—"}</dd>
    </div>
  );
}

function UserHoverCard({
  user,
  isSelf,
}: {
  user: Profile;
  isSelf?: boolean;
}) {
  return (
    <HoverCard>
      <HoverCardTrigger className="flex cursor-default items-center gap-2.5 rounded-md outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/50">
        <Avatar size="sm">
          {user.profile_picture ? (
            <AvatarImage src={user.profile_picture} alt={user.full_name} />
          ) : null}
          <AvatarFallback>
            {initials(user) || <UserRoundIcon className="size-3.5" />}
          </AvatarFallback>
        </Avatar>
        <span className="inline-flex min-w-0 items-center gap-2">
          <span className="truncate font-medium underline-offset-2 hover:underline">
            {user.full_name}
          </span>
          {isSelf ? (
            <span className="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-primary uppercase">
              You
            </span>
          ) : null}
        </span>
      </HoverCardTrigger>
      <HoverCardContent side="top" align="start" className="w-80 p-3">
        <div className="flex items-start gap-3">
          <Avatar size="lg">
            {user.profile_picture ? (
              <AvatarImage src={user.profile_picture} alt={user.full_name} />
            ) : null}
            <AvatarFallback>
              {initials(user) || <UserRoundIcon className="size-5" />}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-0.5">
            <p className="truncate font-semibold leading-tight">
              {user.full_name}
            </p>
            <p className="text-xs text-muted-foreground">
              {displayRoleName(user.role)} · {user.status ? "Active" : "Inactive"}
            </p>
          </div>
        </div>
        <dl className="mt-3 space-y-1.5 text-xs">
          <DetailRow label="Email" value={user.email} />
          <DetailRow label="Employee" value={user.employee_no} />
          <DetailRow label="Contact" value={user.contact_number} />
          <DetailRow label="Sex" value={user.sex} />
          <DetailRow
            label="Birth date"
            value={user.birth_date ? formatDate(user.birth_date) : null}
          />
          <DetailRow label="Address" value={user.address} />
          <DetailRow
            label="Last login"
            value={formatDateTime(user.last_login)}
          />
          <DetailRow
            label="Created"
            value={formatDateTime(user.created_at)}
          />
        </dl>
      </HoverCardContent>
    </HoverCard>
  );
}

function EditUserForm({
  user,
  isSelf,
  onSuccess,
}: {
  user: Profile;
  isSelf: boolean;
  onSuccess: () => void;
}) {
  const [state, formAction, pending] = useServerAction(updateUser, initialState, onSuccess);
  const formId = `edit-user-${user.id}`;
  const [firstName, setFirstName] = useState(user.first_name);
  const [middleName, setMiddleName] = useState(user.middle_name ?? "");
  const [lastName, setLastName] = useState(user.last_name);
  const [suffix, setSuffix] = useState(user.suffix ?? "");
  const [employeeNo, setEmployeeNo] = useState(user.employee_no ?? "");
  const [contactNumber, setContactNumber] = useState(user.contact_number ?? "");
  const [role, setRole] = useState(user.role);
  const [email, setEmail] = useState(user.email ?? "");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState(user.status ? "1" : "0");


  return (
    <>
      <form action={formAction} className="space-y-4" id={formId}>
        <input type="hidden" name="user_id" value={user.id} />

        {state.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${formId}-first_name`}>First Name</Label>
            <Input
              id={`${formId}-first_name`}
              name="first_name"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${formId}-middle_name`}>Middle Name</Label>
            <Input
              id={`${formId}-middle_name`}
              name="middle_name"
              value={middleName}
              onChange={(event) => setMiddleName(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${formId}-last_name`}>Last Name</Label>
            <Input
              id={`${formId}-last_name`}
              name="last_name"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${formId}-suffix`}>Suffix</Label>
            <Input
              id={`${formId}-suffix`}
              name="suffix"
              value={suffix}
              onChange={(event) => setSuffix(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${formId}-employee_no`}>Employee No.</Label>
            <Input
              id={`${formId}-employee_no`}
              name="employee_no"
              value={employeeNo}
              onChange={(event) => setEmployeeNo(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${formId}-contact_number`}>Mobile number</Label>
            <Input
              id={`${formId}-contact_number`}
              name="contact_number"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="09XXXXXXXXX"
              value={contactNumber}
              onChange={(event) => setContactNumber(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${formId}-role`}>Role</Label>
            <select
              id={`${formId}-role`}
              name="role"
              required
              value={role}
              disabled={isSelf}
              className={selectClassName}
              onChange={(event) => setRole(event.target.value as Profile["role"])}
            >
              {ROLES.map((item) => (
                <option key={item} value={item}>
                  {displayRoleName(item)}
                </option>
              ))}
            </select>
            {isSelf ? <input type="hidden" name="role" value={role} /> : null}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor={`${formId}-email`}>Email</Label>
            <Input
              id={`${formId}-email`}
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${formId}-password`}>New Password</Label>
            <Input
              id={`${formId}-password`}
              name="password"
              type="password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Leave blank to keep current"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${formId}-status`}>Status</Label>
            <select
              id={`${formId}-status`}
              name="status"
              value={status}
              disabled={isSelf}
              className={selectClassName}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
            {isSelf ? <input type="hidden" name="status" value={status} /> : null}
          </div>
        </div>
      </form>

      <AlertDialogFooter>
        <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
        <Button type="submit" form={formId} disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <PencilIcon />
              Save changes
            </>
          )}
        </Button>
      </AlertDialogFooter>
    </>
  );
}

function EditUserButton({
  user,
  isSelf,
}: {
  user: Profile;
  isSelf: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Edit user"
        title="Edit user"
        onClick={() => setOpen(true)}
      >
        <PencilIcon />
      </Button>
      <AlertDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setFormKey((current) => current + 1);
        }}
      >
        <AlertDialogContent className="max-w-lg sm:max-w-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Edit User</AlertDialogTitle>
            <AlertDialogDescription>
              Update account details for {user.full_name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {open ? (
            <EditUserForm
              key={formKey}
              user={user}
              isSelf={isSelf}
              onSuccess={() => {
                setOpen(false);
                setFormKey((current) => current + 1);
              }}
            />
          ) : null}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ToggleUserStatusButton({
  user,
  disabled,
}: {
  user: Profile;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useServerAction(
    toggleUserStatus,
    initialState,
    () => setOpen(false)
  );
  useActionToast(state);
  const formId = `toggle-user-status-${user.id}`;
  const activating = !user.status;

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={disabled}
        aria-label={activating ? "Activate user" : "Deactivate user"}
        title={
          disabled
            ? "You cannot deactivate your own account"
            : activating
              ? "Activate user"
              : "Deactivate user"
        }
        onClick={() => setOpen(true)}
      >
        {activating ? <PowerIcon /> : <CircleOffIcon />}
      </Button>
      <AlertDialog
        open={open}
        onOpenChange={(next) => {
          if (pending) return;
          setOpen(next);
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia
              className={
                activating
                  ? "bg-[color:var(--chum-green-soft,#e8f8ef)] text-[color:var(--chum-green-deep,#1f9a5c)]"
                  : "bg-destructive/10 text-destructive"
              }
            >
              {activating ? <PowerIcon /> : <CircleOffIcon />}
            </AlertDialogMedia>
            <AlertDialogTitle>
              {activating ? "Activate this user?" : "Deactivate this user?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {activating
                ? `${user.full_name} will be able to sign in again.`
                : `${user.full_name} will no longer be able to sign in. You can activate the account later.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {state.error ? (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          ) : null}
          <form action={formAction} id={formId}>
            <input type="hidden" name="user_id" value={user.id} />
            <input
              type="hidden"
              name="status"
              value={activating ? "1" : "0"}
            />
          </form>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              type="submit"
              form={formId}
              variant={activating ? "default" : "destructive"}
              disabled={pending}
            >
              {pending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Saving…
                </>
              ) : activating ? (
                <>
                  <PowerIcon />
                  Activate
                </>
              ) : (
                <>
                  <CircleOffIcon />
                  Deactivate
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function DeleteUserButton({
  userId,
  userName,
  disabled,
}: {
  userId: string;
  userName: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useServerAction(deleteUser, initialState, () => setOpen(false));
  const formId = `delete-user-${userId}`;


  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={disabled}
        aria-label="Delete user"
        title={
          disabled
            ? "You cannot delete your own account"
            : state.error || "Delete user"
        }
        onClick={() => setOpen(true)}
      >
        <Trash2Icon />
      </Button>
      <AlertDialog
        open={open}
        onOpenChange={(next) => {
          if (pending) return;
          setOpen(next);
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <Trash2Icon />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {userName} and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {state.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}
          <form action={formAction} id={formId}>
            <input type="hidden" name="user_id" value={userId} />
          </form>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              type="submit"
              form={formId}
              variant="destructive"
              disabled={pending}
            >
              {pending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Deleting…
                </>
              ) : (
                <>
                  <Trash2Icon />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function UsersTable({
  users,
  currentUserId,
  lockedRole,
}: {
  users: Profile[];
  currentUserId: string;
  lockedRole?: Profile["role"];
}) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState(lockedRole ?? "");
  const [status, setStatus] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return users.filter((user) => {
      if ((lockedRole || role) && user.role !== (lockedRole || role))
        return false;
      if (status === "active" && !user.status) return false;
      if (status === "inactive" && user.status) return false;

      if (!q) return true;

      const haystack = [
        user.full_name,
        user.first_name,
        user.last_name,
        user.email,
        user.employee_no,
        user.role,
        user.contact_number,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [users, query, role, status, lockedRole]);

  return (
    <div className="space-y-4">
      <div className={`grid gap-3 ${lockedRole ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name, email, mobile, employee no.…"
          className="sm:col-span-1"
        />
        {lockedRole ? null : (
        <select
          value={role}
          onChange={(event) => setRole(event.target.value)}
          className={selectClassName}
          aria-label="Filter by role"
        >
          <option value="">All roles</option>
          {ROLES.map((item) => (
            <option key={item} value={item}>
              {displayRoleName(item)}
            </option>
          ))}
        </select>
        )}
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className={selectClassName}
          aria-label="Filter by status"
        >
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No users found.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Employee No.</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="w-[120px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((user) => {
              const isSelf = user.id === currentUserId;
              return (
              <TableRow key={user.id}>
                <TableCell>
                  <UserHoverCard user={user} isSelf={isSelf} />
                </TableCell>
                <TableCell className="max-w-[220px] truncate">
                  {user.email || "—"}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {user.contact_number || "—"}
                </TableCell>
                <TableCell>{user.employee_no || "—"}</TableCell>
                <TableCell>{displayRoleName(user.role)}</TableCell>
                <TableCell>
                  {user.status ? (
                    <span className="student-chum-pill">Active</span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                      Inactive
                    </span>
                  )}
                </TableCell>
                <TableCell>{formatDateTime(user.last_login)}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-0.5">
                    <EditUserButton
                      user={user}
                      isSelf={isSelf}
                    />
                    <ToggleUserStatusButton
                      user={user}
                      disabled={isSelf}
                    />
                    <DeleteUserButton
                      userId={user.id}
                      userName={user.full_name}
                      disabled={isSelf}
                    />
                  </div>
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
