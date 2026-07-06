export type LoginState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
};

export const INITIAL_LOGIN_STATE: LoginState = { ok: false };