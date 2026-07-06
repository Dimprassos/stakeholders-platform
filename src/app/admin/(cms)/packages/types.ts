export type PackageFormState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
};

export const INITIAL_PACKAGE_STATE: PackageFormState = { ok: false };

export type DeleteState = { ok: boolean; message?: string };

export type ToggleState = { ok: boolean; message?: string };