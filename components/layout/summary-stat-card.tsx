import type { LucideIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
      className={cn(
        "text-center",
        isSecondary && "bg-muted/35 text-muted-foreground shadow-none"
      )}
    >
      <CardHeader className="items-center justify-items-center pb-2">
        <Icon
          className={cn(
            "text-muted-foreground",
            isSecondary ? "size-3.5" : "size-4"
          )}
        />
        <CardTitle
          className={cn(
            "font-medium text-muted-foreground",
            isSecondary ? "text-xs" : "text-sm"
          )}
        >
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "font-semibold tracking-tight",
            isSecondary
              ? "text-lg text-foreground/80"
              : "text-2xl text-foreground"
          )}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
