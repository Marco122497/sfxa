"use client";

import { useActionState, useRef } from "react";
import { useRouter } from "next/navigation";

type ActionState = {
  success?: string;
  error?: string;
};

/**
 * Run a server action and, on success, refresh the page and optionally close a dialog.
 * Closes from the action result itself so leftover success messages still dismiss next saves.
 */
export function useServerAction<T extends ActionState>(
  action: (prevState: T, formData: FormData) => Promise<T> | T,
  initialState: T,
  onSuccess?: () => void
) {
  const router = useRouter();
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  return useActionState(
    async (prevState: T, formData: FormData) => {
      const result = await action(prevState, formData);
      if (result.success) {
        onSuccessRef.current?.();
        router.refresh();
      }
      return result;
    },
    initialState as never
  );
}
