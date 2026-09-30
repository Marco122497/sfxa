"use client";

import { useRef, useState } from "react";
import { MoreHorizontalIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type RowAction = {
  key: string;
  label: string;
  icon?: string;
  detail?: string;
  disabled: boolean;
  destructive: boolean;
};

function visibleActionButtons(root: HTMLElement) {
  return [...root.querySelectorAll("button")].filter((button) => {
    return !button.closest(
      "[data-slot='alert-dialog-content'], [data-slot='alert-dialog-footer'], [data-slot='dropdown-menu-content']"
    );
  });
}

function readActions(root: HTMLElement | null): RowAction[] {
  if (!root) return [];

  return visibleActionButtons(root).map((button, index) => {
    const label = (
      button.getAttribute("aria-label") ||
      button.textContent ||
      button.title ||
      "Action"
    )
      .replace(/\s+/g, " ")
      .trim();
    const title = button.title.trim();
    const destructive = /delete|deactivate|unpublish/i.test(label);

    return {
      key: `${index}-${label}`,
      label,
      icon: button.querySelector("svg")?.outerHTML,
      detail: title && title !== label ? title : undefined,
      disabled: button.disabled,
      destructive,
    };
  });
}

export function RowActionsDialog({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const actionsRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [actions, setActions] = useState<RowAction[]>([]);

  function runAction(index: number) {
    const button = actionsRef.current
      ? visibleActionButtons(actionsRef.current)[index]
      : undefined;
    setOpen(false);
    window.setTimeout(() => button?.click(), 0);
  }

  return (
    <>
      <div className="flex justify-end">
        <DropdownMenu
          open={open}
          onOpenChange={(next) => {
            if (next) setActions(readActions(actionsRef.current));
            setOpen(next);
          }}
        >
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Actions for ${label}`}
                title="Actions"
              />
            }
          >
            <MoreHorizontalIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="left"
            align="start"
            sideOffset={6}
            className="min-w-44"
          >
            {actions.length === 0 ? (
              <p className="px-1.5 py-1 text-sm text-muted-foreground">
                No actions available.
              </p>
            ) : (
              actions.map((action, index) => (
                <DropdownMenuItem
                  key={action.key}
                  variant={action.destructive ? "destructive" : "default"}
                  disabled={action.disabled}
                  title={action.detail}
                  onClick={() => runAction(index)}
                >
                  {action.icon ? (
                    <span
                      aria-hidden
                      className="inline-flex shrink-0 [&_svg]:size-4"
                      dangerouslySetInnerHTML={{ __html: action.icon }}
                    />
                  ) : null}
                  <span className="flex flex-col items-start gap-0.5">
                    <span>{action.label}</span>
                    {action.detail ? (
                      <span className="text-xs text-muted-foreground">
                        {action.detail}
                      </span>
                    ) : null}
                  </span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div ref={actionsRef} className="hidden" aria-hidden>
        {children}
      </div>
    </>
  );
}
