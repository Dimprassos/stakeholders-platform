import "server-only";

export function renderTemplate(
  template: string,
  fields: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => fields[key] ?? "");
}