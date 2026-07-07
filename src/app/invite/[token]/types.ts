export type OnboardingState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
};

export const INITIAL_ONBOARDING_STATE: OnboardingState = { ok: false };