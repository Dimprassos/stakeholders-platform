// FAQ / deadlines are stored as JSON strings (SQLite has no arrays), matching
// the `Package.benefits` convention. Admin forms edit them as plain text —
// one entry per line, "label :: value" — mirroring the benefits textarea UX.

export type FaqItem = { question: string; answer: string };
export type Deadline = { label: string; date: string };

export function parseFaq(json: string): FaqItem[] {
  try {
    const value = JSON.parse(json);
    if (!Array.isArray(value)) return [];
    return value.filter(
      (x): x is FaqItem =>
        !!x && typeof x === "object" && typeof x.question === "string" && typeof x.answer === "string",
    );
  } catch {
    return [];
  }
}

export function parseDeadlines(json: string): Deadline[] {
  try {
    const value = JSON.parse(json);
    if (!Array.isArray(value)) return [];
    return value.filter(
      (x): x is Deadline =>
        !!x && typeof x === "object" && typeof x.label === "string" && typeof x.date === "string",
    );
  } catch {
    return [];
  }
}

function parsePairLines<T>(
  raw: string,
  build: (left: string, right: string) => T,
): T[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf("::");
      return idx === -1 ? build(line, "") : build(line.slice(0, idx).trim(), line.slice(idx + 2).trim());
    });
}

/** "Question :: Answer" per line -> FaqItem[] (blank questions dropped). */
export function textToFaq(raw: string): FaqItem[] {
  return parsePairLines(raw, (question, answer) => ({ question, answer })).filter((f) => f.question);
}

export function faqToText(items: FaqItem[]): string {
  return items.map((f) => `${f.question} :: ${f.answer}`).join("\n");
}

/** "Label :: YYYY-MM-DD" per line -> Deadline[] (blank labels dropped). */
export function textToDeadlines(raw: string): Deadline[] {
  return parsePairLines(raw, (label, date) => ({ label, date })).filter((d) => d.label);
}

export function deadlinesToText(items: Deadline[]): string {
  return items.map((d) => `${d.label} :: ${d.date}`).join("\n");
}

/**
 * CSS custom-property overrides for an event's custom brand colors. Empty
 * unless `themeMode === "CUSTOM"` — LIGHT/DARK and preset themes rely on the
 * `data-theme` attribute + globals.css instead (see `(public)/layout.tsx`).
 */
export function customBrandVars(event: {
  themeMode: string;
  brandColor: string | null;
  brandInkColor: string | null;
  brandAccentColor: string | null;
}): Record<string, string> {
  if (event.themeMode !== "CUSTOM") return {};
  const vars: Record<string, string> = {};
  if (event.brandColor) vars["--brand"] = event.brandColor;
  if (event.brandInkColor) vars["--brand-ink"] = event.brandInkColor;
  if (event.brandAccentColor) vars["--brand-accent"] = event.brandAccentColor;
  return vars;
}
