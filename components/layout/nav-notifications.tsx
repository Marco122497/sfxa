"use client";

import { BellIcon } from "lucide-react";

import { formatDateTime } from "@/lib/auth/roles";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type NavNotification = {
  id: number;
  title: string;
  content: string;
  date: string;
};

export function NavNotifications({
  notifications,
}: {
  notifications: NavNotification[];
}) {
  const count = notifications.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" className="relative" />
        }
      >
        <BellIcon className="size-4" />
        {count > 0 ? (
          <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-white">
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
        <span className="sr-only">Notifications</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-72 min-w-72 overflow-x-hidden sm:w-80 sm:min-w-80"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <div className="flex items-center justify-between gap-2 py-0.5">
              <span className="text-sm font-medium">Notifications</span>
              <span className="text-xs text-muted-foreground">
                {count} item{count === 1 ? "" : "s"}
              </span>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {count === 0 ? (
          <div className="px-2 py-8 text-center text-sm text-muted-foreground">
            No notifications yet.
          </div>
        ) : (
          <div className="max-h-80 overflow-x-hidden overflow-y-auto">
            {notifications.map((item, index) => (
              <div key={item.id}>
                {index > 0 ? <DropdownMenuSeparator /> : null}
                <div className="space-y-1 px-2 py-2.5">
                  <p className="break-words text-sm font-medium leading-snug">
                    {item.title}
                  </p>
                  <p className="line-clamp-2 break-words text-xs text-muted-foreground">
                    {item.content}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatDateTime(item.date)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
