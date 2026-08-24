"use client";

import { usePathname } from "next/navigation";

import { useOptionalNavigationPending } from "@/components/layout/navigation-pending";
import { RoutePageSkeleton } from "@/components/layout/route-page-skeleton";

export function CurrentRouteSkeleton({ href }: { href?: string | null }) {
  const pathname = usePathname();
  const pending = useOptionalNavigationPending();
  return (
    <RoutePageSkeleton href={href || pending?.pendingHref || pathname} />
  );
}

export default CurrentRouteSkeleton;
