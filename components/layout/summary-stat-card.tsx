import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function SummaryStatCard({
  title,
  value,
  icon: Icon,
  variant = "primary",
}: {
  title: string;
  value: string;
  icon: LucideIcon;
  variant?: "primary" | "secondary";
}) {
  const isSecondary = variant === "secondary";

  return (
    <Card
      size={isSecondary ? "sm" : "default"}
      className={cn(isSecondary && "bg-muted/40 shadow-none")}
    >
      <CardContent className="flex flex-col items-center gap-2 text-center">
        <span
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-2xl",
            isSecondary
              ? "size-9 bg-background text-muted-foreground"
              : "size-11 bg-primary/10 text-primary"
          )}
        >
          <Icon className={isSecondary ? "size-4" : "size-5"} aria-hidden />
        </span>
        <div className="min-w-0">
          <CardTitle
            className={cn(
              "font-medium text-muted-foreground",
              isSecondary ? "text-xs" : "text-sm"
            )}
          >
            {title}
          </CardTitle>
          <div
            className={cn(
              "mt-0.5 font-semibold tracking-tight text-foreground",
              isSecondary ? "text-lg" : "text-2xl"
            )}
          >
            {value}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
