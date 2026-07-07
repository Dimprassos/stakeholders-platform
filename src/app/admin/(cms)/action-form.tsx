"use client";

import { useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";

/**
 * A drop-in replacement for a `<form action={serverAction}>` that, after the
 * server action resolves, calls `router.refresh()` so the current page's
 * Server Components re-fetch and the UI reflects the change without a manual
 * browser refresh.
 *
 * Needed because these admin pages are `force-dynamic` (uncached), so the
 * server-side `revalidatePath` alone does not refresh the client router.
 */
export function ActionForm({
  action,
  className,
  children,
}: {
  action: (formData: FormData) => Promise<void>;
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  return (
    <form
      className={className}
      action={(formData) => {
        startTransition(async () => {
          await action(formData);
          router.refresh();
        });
      }}
    >
      {children}
    </form>
  );
}
