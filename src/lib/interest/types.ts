// Shared state shape for the interest-form server action + client form.
export type SubmitState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
};

export const INITIAL_SUBMIT_STATE: SubmitState = { ok: false };
