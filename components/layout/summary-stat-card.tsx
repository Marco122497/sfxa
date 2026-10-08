import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
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
    <Card className={cn(isSecondary && "bg-muted/40 shadow-none")}>
      <CardContent className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p
            className={cn(
              "mt-2 font-bold tracking-tight text-foreground",
              isSecondary ? "text-xl" : "text-2xl"
            )}
          >
            {value}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary",
            isSecondary ? "size-8" : "size-10"
          )}
        >
          <Icon className={isSecondary ? "size-4" : "size-[18px]"} aria-hidden />
        </span>
      </CardContent>
    </Card>
  );
}
