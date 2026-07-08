export type UpdateEventState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
};

export const INITIAL_UPDATE_EVENT_STATE: UpdateEventState = { ok: false };
