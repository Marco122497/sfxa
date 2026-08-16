"use client";

import { useActionState, useMemo, useState } from "react";
import { Loader2, PencilIcon, Trash2Icon, UserRoundIcon } from "lucide-react";

import { useRefreshOnSuccess } from "@/hooks/use-refresh-on-success";
import {
  deleteUser,
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

function UserHoverCard({ user }: { user: Profile }) {
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
        <span className="font-medium underline-offset-2 hover:underline">
          {user.full_name}
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
  const [state, formAction, pending] = useActionState(updateUser, initialState);
  const formId = `edit-user-${user.id}`;
  const [firstName, setFirstName] = useState(user.first_name);
  const [middleName, setMiddleName] = useState(user.middle_name ?? "");
  const [lastName, setLastName] = useState(user.last_name);
  const [suffix, setSuffix] = useState(user.suffix ?? "");
  const [employeeNo, setEmployeeNo] = useState(user.employee_no ?? "");
  const [role, setRole] = useState(user.role);
  const [email, setEmail] = useState(user.email ?? "");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState(user.status ? "1" : "0");

  useRefreshOnSuccess(state.success, onSuccess);

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
  const [state, formAction, pending] = useActionState(deleteUser, initialState);
  const formId = `delete-user-${userId}`;

  useRefreshOnSuccess(state.success, () => setOpen(false));

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
          placeholder="Search name, email, employee no.…"
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
              <TableHead>Employee No.</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="w-[88px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <UserHoverCard user={user} />
                </TableCell>
                <TableCell className="max-w-[220px] truncate">
                  {user.email || "—"}
                </TableCell>
                <TableCell>{user.employee_no || "—"}</TableCell>
                <TableCell>{displayRoleName(user.role)}</TableCell>
                <TableCell>{user.status ? "Active" : "Inactive"}</TableCell>
                <TableCell>{formatDateTime(user.last_login)}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-0.5">
                    <EditUserButton
                      user={user}
                      isSelf={user.id === currentUserId}
                    />
                    <DeleteUserButton
                      userId={user.id}
                      userName={user.full_name}
                      disabled={user.id === currentUserId}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
