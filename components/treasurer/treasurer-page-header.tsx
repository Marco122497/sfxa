import type { LucideIcon } from "lucide-react";

import { PageHeading } from "@/components/layout/page-heading";

export function TreasurerPageHeader({
  title,
  description,
  icon,
  actions,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
}) {
  return (
    <PageHeading
      title={title}
      description={description}
      icon={icon}
      actions={actions}
    />
  );
}
