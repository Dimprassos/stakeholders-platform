"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { saveTemplateAction } from "./actions";
import { INITIAL_TEMPLATE_STATE } from "./types";

const inputClass =
  "w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground dark:border-white/20";
const labelClass = "block text-sm font-medium";
const errorClass = "mt-1 text-xs text-red-600 dark:text-red-400";

type TemplateInitial = { id: string; name: string; subject: string; body: string };

export function TemplateForm({ template }: { template?: TemplateInitial }) {
  const isEdit = !!template;
  const [state, formAction, pending] = useActionState(
    saveTemplateAction,
    INITIAL_TEMPLATE_STATE,
  );
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const errors = state.errors ?? {};

  useEffect(() => {
    if (state.ok) {
      router.refresh();
      if (!isEdit) formRef.current?.reset();
    }
  }, [state, isEdit, router]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4" noValidate>
      {template && <input type="hidden" name="id" value={template.id} />}

      {state.message && (
        <p
          className={`rounded-lg border px-3 py-2 text-sm ${
            state.ok
              ? "border-green-600/30 bg-green-600/5 text-green-700 dark:text-green-400"
              : "border-red-600/30 bg-red-600/5 text-red-700 dark:text-red-400"
          }`}
        >
          {state.message}
        </p>
      )}

      <div>
        <label className={labelClass} htmlFor={`name-${template?.id ?? "new"}`}>
          Name
        </label>
        <input
          id={`name-${template?.id ?? "new"}`}
          name="name"
          defaultValue={template?.name ?? ""}
          maxLength={120}
          placeholder="e.g. Invitation follow-up"
          className={inputClass}
        />
        {errors.name && <p className={errorClass}>{errors.name}</p>}
      </div>

      <div>
        <label className={labelClass} htmlFor={`subject-${template?.id ?? "new"}`}>
          Subject
        </label>
        <input
          id={`subject-${template?.id ?? "new"}`}
          name="subject"
          defaultValue={template?.subject ?? ""}
          maxLength={200}
          placeholder="Partner with {{event}}"
          className={inputClass}
        />
        {errors.subject && <p className={errorClass}>{errors.subject}</p>}
      </div>

      <div>
        <label className={labelClass} htmlFor={`body-${template?.id ?? "new"}`}>
          Body
        </label>
        <textarea
          id={`body-${template?.id ?? "new"}`}
          name="body"
          rows={7}
          defaultValue={template?.body ?? ""}
          maxLength={5000}
          placeholder={"Hi {{contactName}},\n\nWe'd love to have {{companyName}} on board for {{event}} with the {{packageName}} package.\n\n{{link}}"}
          className={inputClass}
        />
        {errors.body && <p className={errorClass}>{errors.body}</p>}
        <p className="mt-1 text-xs text-zinc-500">
          Merge fields: {"{{event}}"}, {"{{companyName}}"}, {"{{contactName}}"},{" "}
          {"{{packageName}}"}, {"{{link}}"}.
        </p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Saving…" : isEdit ? "Save changes" : "Create template"}
      </button>
    </form>
  );
}
