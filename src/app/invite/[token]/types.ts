export type OnboardingValues = {
  legalName: string;
  billingAddress: string;
  vatNumber: string;
  websiteUrl: string;
  logoUrl: string;
  description: string;
  isHiddenFromPublic: boolean;
};

export type OnboardingState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
  values?: OnboardingValues;
};

export const INITIAL_ONBOARDING_STATE: OnboardingState = { ok: false };
