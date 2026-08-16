"use client";

import { useActionState, useState } from "react";
import {
  Loader2,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  UserRoundIcon,
  UsersIcon,
} from "lucide-react";

import {
  assignChapelMember,
  assignChapelTreasurerAction,
  createChapel,
  deleteChapel,
  unassignChapelMemberAction,
  unassignChapelTreasurerAction,
  updateChapel,
  type ChapelActionState,
} from "@/app/actions/chapels";
import { useRefreshOnSuccess } from "@/hooks/use-refresh-on-success";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
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

export type ChapelRow = {
  chapel_id: number;
  chapel_name: string;
  location: string | null;
  is_active: boolean;
  treasurer_id: string | null;
};

export type ChapelUser = {
  id: string;
  full_name: string;
  role: string;
};

export function ChapelManager({
  chapels,
  treasurers,
  members,
  memberAssignments,
}: {
  chapels: ChapelRow[];
  treasurers: ChapelUser[];
  members: ChapelUser[];
  memberAssignments: { chapel_id: number; user_id: string }[];
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <AddChapelDialog />
      </div>
      {chapels.length === 0 ? (
        <p className="text-sm text-muted-foreground">No chapels yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Chapel</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Treasurer</TableHead>
              <TableHead>Parish Members</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[168px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {chapels.map((chapel) => {
              const treasurer = treasurers.find(
                (user) => user.id === chapel.treasurer_id
              );
              const assignedMembers = memberAssignments
                .filter((row) => row.chapel_id === chapel.chapel_id)
                .map((row) => members.find((user) => user.id === row.user_id))
                .filter((user): user is ChapelUser => Boolean(user));
              return (
                <TableRow key={chapel.chapel_id}>
                  <TableCell className="font-medium">
                    {chapel.chapel_name}
                  </TableCell>
                  <TableCell>{chapel.location || "—"}</TableCell>
                  <TableCell>{treasurer?.full_name || "Unassigned"}</TableCell>
                  <TableCell>
                    {assignedMembers.length > 0
                      ? assignedMembers.map((user) => user.full_name).join(", ")
                      : "—"}
                  </TableCell>
                  <TableCell>{chapel.is_active ? "Active" : "Inactive"}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <EditChapelDialog chapel={chapel} />
                      <TreasurerAccessDialog
                        chapel={chapel}
                        treasurer={treasurer}
                        treasurers={treasurers}
                      />
                      <MemberAccessDialog
                        chapel={chapel}
                        members={members}
                        assignedMembers={assignedMembers}
                      />
                      <DeleteChapelButton chapel={chapel} />
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

function AddChapelDialog() {
  const [open, setOpen] = useState(false);
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button type="button" />}>
        <PlusIcon />
        Add Chapel
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        {open ? <AddChapelForm onSuccess={() => setOpen(false)} /> : null}
      </AlertDialogContent>
    </AlertDialog>
  );
}

function AddChapelForm({ onSuccess }: { onSuccess: () => void }) {
  const [state, formAction, pending] = useActionState(
    createChapel,
    {} as ChapelActionState
  );

  useRefreshOnSuccess(state.success, onSuccess);

  return (
    <form action={formAction} className="grid gap-4">
      <AlertDialogHeader>
        <AlertDialogTitle>Add Chapel</AlertDialogTitle>
        <AlertDialogDescription>
          Create a chapel so treasurers and parish members can be scoped to it.
        </AlertDialogDescription>
      </AlertDialogHeader>
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="chapel_name">Chapel name</Label>
        <Input id="chapel_name" name="chapel_name" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input id="location" name="location" />
      </div>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : null}
          Save
        </Button>
      </AlertDialogFooter>
    </form>
  );
}

function EditChapelDialog({ chapel }: { chapel: ChapelRow }) {
  const [open, setOpen] = useState(false);
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Edit chapel"
            title="Edit chapel"
          />
        }
      >
        <PencilIcon />
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        {open ? (
          <EditChapelForm chapel={chapel} onSuccess={() => setOpen(false)} />
        ) : null}
      </AlertDialogContent>
    </AlertDialog>
  );
}

function EditChapelForm({
  chapel,
  onSuccess,
}: {
  chapel: ChapelRow;
  onSuccess: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    updateChapel,
    {} as ChapelActionState
  );

  useRefreshOnSuccess(state.success, onSuccess);

  return (
    <form action={formAction} className="grid gap-4">
      <AlertDialogHeader>
        <AlertDialogTitle>Edit {chapel.chapel_name}</AlertDialogTitle>
        <AlertDialogDescription>
          Update chapel details. Assign treasurer and parish members with the
          user icons.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <input type="hidden" name="chapel_id" value={String(chapel.chapel_id)} />
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor={`name-${chapel.chapel_id}`}>Chapel name</Label>
        <Input
          id={`name-${chapel.chapel_id}`}
          name="chapel_name"
          defaultValue={chapel.chapel_name}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`loc-${chapel.chapel_id}`}>Location</Label>
        <Input
          id={`loc-${chapel.chapel_id}`}
          name="location"
          defaultValue={chapel.location ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`status-${chapel.chapel_id}`}>Status</Label>
        <select
          id={`status-${chapel.chapel_id}`}
          name="is_active"
          defaultValue={chapel.is_active ? "1" : "0"}
          className={selectClassName}
        >
          <option value="1">Active</option>
          <option value="0">Inactive</option>
        </select>
      </div>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : null}
          Save
        </Button>
      </AlertDialogFooter>
    </form>
  );
}

function TreasurerAccessDialog({
  chapel,
  treasurer,
  treasurers,
}: {
  chapel: ChapelRow;
  treasurer?: ChapelUser;
  treasurers: ChapelUser[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Assign treasurer"
            title="Assign treasurer"
          />
        }
      >
        <UserRoundIcon />
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        {open ? (
          <TreasurerAccessForm
            chapel={chapel}
            treasurer={treasurer}
            treasurers={treasurers}
          />
        ) : null}
      </AlertDialogContent>
    </AlertDialog>
  );
}

function TreasurerAccessForm({
  chapel,
  treasurer,
  treasurers,
}: {
  chapel: ChapelRow;
  treasurer?: ChapelUser;
  treasurers: ChapelUser[];
}) {
  const [assignState, assignAction, assignPending] = useActionState(
    assignChapelTreasurerAction,
    {} as ChapelActionState
  );
  const [removeState, removeAction, removePending] = useActionState(
    unassignChapelTreasurerAction,
    {} as ChapelActionState
  );

  useRefreshOnSuccess(assignState.success);
  useRefreshOnSuccess(removeState.success);

  const available = treasurers.filter((user) => user.id !== treasurer?.id);
  const error = assignState.error || removeState.error;

  return (
    <div className="grid gap-4">
      <AlertDialogHeader>
        <AlertDialogTitle>Treasurer — {chapel.chapel_name}</AlertDialogTitle>
        <AlertDialogDescription>
          Assign one treasurer to this chapel, or remove the current assignment.
        </AlertDialogDescription>
      </AlertDialogHeader>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="space-y-2">
        <p className="text-sm font-medium">Assigned</p>
        {treasurer ? (
          <div className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
            <span className="text-sm">{treasurer.full_name}</span>
            <form action={removeAction}>
              <input type="hidden" name="chapel_id" value={chapel.chapel_id} />
              <Button
                type="submit"
                variant="ghost"
                size="icon-sm"
                disabled={removePending}
                aria-label="Remove treasurer"
                title="Remove treasurer"
              >
                {removePending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Trash2Icon />
                )}
              </Button>
            </form>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No treasurer assigned.</p>
        )}
      </div>
      <form action={assignAction} className="grid gap-3">
        <input type="hidden" name="chapel_id" value={String(chapel.chapel_id)} />
        <div className="space-y-2">
          <Label htmlFor={`treasurer-${chapel.chapel_id}`}>Add treasurer</Label>
          <select
            id={`treasurer-${chapel.chapel_id}`}
            name="treasurer_id"
            required
            className={selectClassName}
            defaultValue=""
            disabled={available.length === 0}
          >
            <option value="">Select treasurer</option>
            {available.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name}
              </option>
            ))}
          </select>
          {treasurers.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Add a Treasurer in User Management first.
            </p>
          ) : null}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
          <Button type="submit" disabled={assignPending || available.length === 0}>
            {assignPending ? <Loader2 className="animate-spin" /> : <PlusIcon />}
            Assign
          </Button>
        </AlertDialogFooter>
      </form>
    </div>
  );
}

function MemberAccessDialog({
  chapel,
  members,
  assignedMembers,
}: {
  chapel: ChapelRow;
  members: ChapelUser[];
  assignedMembers: ChapelUser[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Assign parish members"
            title="Assign parish members"
          />
        }
      >
        <UsersIcon />
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        {open ? (
          <MemberAccessForm
            chapel={chapel}
            members={members}
            assignedMembers={assignedMembers}
          />
        ) : null}
      </AlertDialogContent>
    </AlertDialog>
  );
}

function MemberAccessForm({
  chapel,
  members,
  assignedMembers,
}: {
  chapel: ChapelRow;
  members: ChapelUser[];
  assignedMembers: ChapelUser[];
}) {
  const [assignState, assignAction, assignPending] = useActionState(
    assignChapelMember,
    {} as ChapelActionState
  );

  useRefreshOnSuccess(assignState.success);

  const assignedIds = new Set(assignedMembers.map((user) => user.id));
  const available = members.filter((user) => !assignedIds.has(user.id));

  return (
    <div className="grid gap-4">
      <AlertDialogHeader>
        <AlertDialogTitle>
          Parish members — {chapel.chapel_name}
        </AlertDialogTitle>
        <AlertDialogDescription>
          Add or remove parish members for this chapel.
        </AlertDialogDescription>
      </AlertDialogHeader>
      {assignState.error ? (
        <Alert variant="destructive">
          <AlertDescription>{assignState.error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="space-y-2">
        <p className="text-sm font-medium">Assigned</p>
        {assignedMembers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No parish members assigned.
          </p>
        ) : (
          <ul className="space-y-1">
            {assignedMembers.map((user) => (
              <li
                key={user.id}
                className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2"
              >
                <span className="text-sm">{user.full_name}</span>
                <RemoveMemberButton chapelId={chapel.chapel_id} userId={user.id} />
              </li>
            ))}
          </ul>
        )}
      </div>
      <form action={assignAction} className="grid gap-3">
        <input type="hidden" name="chapel_id" value={String(chapel.chapel_id)} />
        <div className="space-y-2">
          <Label htmlFor={`member-${chapel.chapel_id}`}>Add parish member</Label>
          <select
            id={`member-${chapel.chapel_id}`}
            name="user_id"
            required
            className={selectClassName}
            defaultValue=""
            disabled={available.length === 0}
          >
            <option value="">Select member</option>
            {available.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name}
              </option>
            ))}
          </select>
          {members.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Add a Parish Member in User Management first.
            </p>
          ) : null}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
          <Button type="submit" disabled={assignPending || available.length === 0}>
            {assignPending ? <Loader2 className="animate-spin" /> : <PlusIcon />}
            Assign
          </Button>
        </AlertDialogFooter>
      </form>
    </div>
  );
}

function RemoveMemberButton({
  chapelId,
  userId,
}: {
  chapelId: number;
  userId: string;
}) {
  const [state, formAction, pending] = useActionState(
    unassignChapelMemberAction,
    {} as ChapelActionState
  );
  useRefreshOnSuccess(state.success);

  return (
    <form action={formAction}>
      <input type="hidden" name="chapel_id" value={chapelId} />
      <input type="hidden" name="user_id" value={userId} />
      {state.error ? (
        <span className="sr-only" role="alert">
          {state.error}
        </span>
      ) : null}
      <Button
        type="submit"
        variant="ghost"
        size="icon-sm"
        disabled={pending}
        aria-label="Remove parish member"
        title="Remove parish member"
      >
        {pending ? <Loader2 className="animate-spin" /> : <Trash2Icon />}
      </Button>
    </form>
  );
}

function DeleteChapelButton({ chapel }: { chapel: ChapelRow }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    deleteChapel,
    {} as ChapelActionState
  );
  const formId = `delete-chapel-${chapel.chapel_id}`;

  useRefreshOnSuccess(state.success, () => setOpen(false));

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Delete chapel"
        title="Delete chapel"
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
            <AlertDialogTitle>Delete chapel?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {chapel.chapel_name} and its member
              assignments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {state.error ? (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          ) : null}
          <form action={formAction} id={formId}>
            <input type="hidden" name="chapel_id" value={chapel.chapel_id} />
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
