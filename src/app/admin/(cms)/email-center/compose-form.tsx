"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { sendComposedEmailAction } from "./actions";
import { INITIAL_COMPOSE_STATE } from "./types";

const inputClass =
  "w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground dark:border-white/20";
const labelClass = "block text-sm font-medium";
const errorClass = "mt-1 text-xs text-red-600 dark:text-red-400";

type Recipient = { id: string; companyName: string; contactEmail: string | null };
type TemplateOption = { id: string; name: string; subject: string; body: string };

export function ComposeForm({
  recipients,
  templates,
}: {
  recipients: Recipient[];
  templates: TemplateOption[];
}) {
  const [state, formAction, pending] = useActionState(
    sendComposedEmailAction,
    INITIAL_COMPOSE_STATE,
  );
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const errors = state.errors ?? {};

  function applyTemplate(id: string) {
    const tpl = templates.find((t) => t.id === id);
    if (tpl) {
      setSubject(tpl.subject);
      setBody(tpl.body);
    }
  }

  return (
    <form
      action={(formData) => {
        formAction(formData);
        // Refresh the outreach log/stats after a send resolves.
        setTimeout(() => router.refresh(), 0);
      }}
      className="space-y-4"
      noValidate
    >
      {state.message && (
        <div
          className={`rounded-lg border px-3 py-2 text-sm ${
            state.ok
              ? "border-green-600/30 bg-green-600/5 text-green-700 dark:text-green-400"
              : "border-red-600/30 bg-red-600/5 text-red-700 dark:text-red-400"
          }`}
        >
          <p>{state.message}</p>
          {state.ok && state.previewUrl && (
            <a
              href={state.previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block underline underline-offset-4"
            >
              View sent email (dev preview) →
            </a>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="compose-sponsor">
            Candidate
          </label>
          <select
            id="compose-sponsor"
            name="sponsorId"
            defaultValue=""
            className={inputClass}
          >
            <option value="">— select a candidate —</option>
            {recipients.map((r) => (
              <option key={r.id} value={r.id}>
                {r.companyName}
                {r.contactEmail ? ` · ${r.contactEmail}` : ""}
              </option>
            ))}
          </select>
          {errors.recipient && <p className={errorClass}>{errors.recipient}</p>}
        </div>

        <div>
          <label className={labelClass} htmlFor="compose-email">
            Or send to another email
          </label>
          <input
            id="compose-email"
            name="email"
            type="email"
            placeholder="name@company.com"
            className={inputClass}
          />
          {errors.email && <p className={errorClass}>{errors.email}</p>}
        </div>
      </div>

      {templates.length > 0 && (
        <div>
          <label className={labelClass} htmlFor="compose-template">
            Start from a template
          </label>
          <select
            id="compose-template"
            name="templateId"
            defaultValue=""
            onChange={(e) => applyTemplate(e.currentTarget.value)}
            className={inputClass}
          >
            <option value="">— no template —</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className={labelClass} htmlFor="compose-subject">
          Subject
        </label>
        <input
          id="compose-subject"
          name="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={200}
          className={inputClass}
        />
        {errors.subject && <p className={errorClass}>{errors.subject}</p>}
      </div>

      <div>
        <label className={labelClass} htmlFor="compose-body">
          Body
        </label>
        <textarea
          id="compose-body"
          name="body"
          rows={7}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={5000}
          className={inputClass}
        />
        {errors.body && <p className={errorClass}>{errors.body}</p>}
        <p className="mt-1 text-xs text-zinc-500">
          Merge fields render on send: {"{{event}}"}, {"{{companyName}}"},{" "}
          {"{{contactName}}"}, {"{{packageName}}"}, {"{{link}}"}.
        </p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send email"}
      </button>
    </form>
  );
}
