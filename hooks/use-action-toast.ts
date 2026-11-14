"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

type ActionMessageState = {
  error?: string;
  success?: string;
};

export function toastActionResult<T extends ActionMessageState>(result: T): T {
  if (result.error) toast.error(result.error);
  if (result.success) toast.success(result.success);
  return result;
}

export function useActionToast(state: ActionMessageState) {
  const seen = useRef(state);

  useEffect(() => {
    if (state === seen.current) return;
    seen.current = state;
    if (state.error) toast.error(state.error);
    if (state.success) toast.success(state.success);
  }, [state]);
}
