"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteTemplateAction } from "./actions";

export function DeleteTemplateButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm(`Delete the template “${name}”? This can't be undone.`)) return;
        const formData = new FormData();
        formData.set("id", id);
        startTransition(async () => {
          await deleteTemplateAction(formData);
          router.refresh();
        });
      }}
      className="text-xs font-medium text-red-600 transition-colors hover:underline disabled:opacity-50 dark:text-red-400"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
