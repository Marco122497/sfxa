"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/** Refetch server-rendered table data after a successful server action. */
export function useRefreshOnSuccess(
  success?: string,
  onSuccess?: () => void
) {
  const router = useRouter();
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  useEffect(() => {
    if (!success) return;
    router.refresh();
    onSuccessRef.current?.();
  }, [success, router]);
}
