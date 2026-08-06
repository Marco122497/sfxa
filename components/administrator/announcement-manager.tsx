"use client";

import { useActionState, useEffect, useState } from "react";
import {
  Loader2,
  MegaphoneIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";

import {
  createAnnouncement,
  deleteAnnouncement,
  publishAnnouncement,
  updateAnnouncement,
  type AnnouncementActionState,
} from "@/app/actions/announcements";
import { formatDateTime } from "@/lib/auth/roles";
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

const initialState: AnnouncementActionState = {};

const textareaClassName =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export type AnnouncementRow = {
  announcement_id: number;
  title: string;
  content: string;
  is_published: boolean | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

function AddAnnouncementDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    createAnnouncement,
    initialState
  );

  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        setOpen(next);
      }}
    >
      <AlertDialogTrigger render={<Button type="button" />}>
        <PlusIcon />
        Add announcement
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-muted">
            <MegaphoneIcon />
          </AlertDialogMedia>
          <AlertDialogTitle>Add announcement?</AlertDialogTitle>
          <AlertDialogDescription>
            Create a parish announcement. Publish when ready for staff to see.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form action={formAction} id="add-announcement-form" className="space-y-4">
          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="add-announcement-title">Title</Label>
            <Input id="add-announcement-title" name="title" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="add-announcement-content">Content</Label>
            <textarea
              id="add-announcement-content"
              name="content"
              required
              rows={4}
              className={textareaClassName}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="publish" value="1" className="size-4" />
            Publish immediately
          </label>
        </form>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            type="submit"
            form="add-announcement-form"
            disabled={pending}
          >
            {pending ? (
              <>
                <Loader2 className="animate-spin" />
                Saving…
              </>
            ) : (
              "Save announcement"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function EditAnnouncementDialog({ item }: { item: AnnouncementRow }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    updateAnnouncement,
    initialState
  );
  const formId = `edit-announcement-${item.announcement_id}`;

  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        setOpen(next);
      }}
    >
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Edit announcement"
          />
        }
      >
        <PencilIcon />
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Edit announcement</AlertDialogTitle>
          <AlertDialogDescription>
            Update the title and content of this announcement.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form action={formAction} id={formId} className="space-y-4">
          <input
            type="hidden"
            name="announcement_id"
            value={item.announcement_id}
          />
          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor={`edit-title-${item.announcement_id}`}>Title</Label>
            <Input
              key={item.title}
              id={`edit-title-${item.announcement_id}`}
              name="title"
              required
              defaultValue={item.title}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`edit-content-${item.announcement_id}`}>
              Content
            </Label>
            <textarea
              key={item.content}
              id={`edit-content-${item.announcement_id}`}
              name="content"
              required
              rows={4}
              defaultValue={item.content}
              className={textareaClassName}
            />
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
              "Save changes"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function PublishAnnouncementButton({ item }: { item: AnnouncementRow }) {
  const [state, formAction, pending] = useActionState(
    publishAnnouncement,
    initialState
  );

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="announcement_id" value={item.announcement_id} />
      <input
        type="hidden"
        name="publish"
        value={item.is_published ? "0" : "1"}
      />
      {state.error && (
        <span className="sr-only" role="alert">
          {state.error}
        </span>
      )}
      <Button
        type="submit"
        variant="outline"
        size="sm"
        disabled={pending}
        title={state.error || undefined}
      >
        {pending ? (
          <Loader2 className="animate-spin" />
        ) : item.is_published ? (
          "Unpublish"
        ) : (
          "Publish"
        )}
      </Button>
    </form>
  );
}

function DeleteAnnouncementButton({ item }: { item: AnnouncementRow }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    deleteAnnouncement,
    initialState
  );
  const formId = `delete-announcement-${item.announcement_id}`;

  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Delete announcement"
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
            <AlertDialogTitle>Delete announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove “{item.title}”. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {state.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}
          <form action={formAction} id={formId}>
            <input
              type="hidden"
              name="announcement_id"
              value={item.announcement_id}
            />
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

export function AnnouncementManager({
  announcements,
}: {
  announcements: AnnouncementRow[];
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {announcements.length} announcement
          {announcements.length === 1 ? "" : "s"}
        </p>
        <AddAnnouncementDialog />
      </div>

      {announcements.length === 0 ? (
        <p className="text-sm text-muted-foreground">No announcements yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead>Published</TableHead>
              <TableHead className="w-[160px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {announcements.map((item) => (
              <TableRow key={item.announcement_id}>
                <TableCell>
                  <div className="max-w-[320px]">
                    <p className="truncate font-medium">{item.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {item.content}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  {item.is_published ? "Published" : "Draft"}
                </TableCell>
                <TableCell>{formatDateTime(item.updated_at)}</TableCell>
                <TableCell>
                  {item.published_at
                    ? formatDateTime(item.published_at)
                    : "—"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <EditAnnouncementDialog item={item} />
                    <PublishAnnouncementButton item={item} />
                    <DeleteAnnouncementButton item={item} />
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
