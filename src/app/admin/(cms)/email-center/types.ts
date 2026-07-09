export type TemplateFormState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
};

export const INITIAL_TEMPLATE_STATE: TemplateFormState = { ok: false };

export type ComposeState = {
  ok: boolean;
  message?: string;
  previewUrl?: string;
  errors?: Record<string, string>;
};

export const INITIAL_COMPOSE_STATE: ComposeState = { ok: false };
