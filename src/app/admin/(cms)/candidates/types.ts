export type CandidateFormState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
};

export const INITIAL_CANDIDATE_STATE: CandidateFormState = { ok: false };

export const PIPELINE_STATUSES = [
  "LEAD",
  "INVITE_SENT",
  "ACCEPTED",
  "DETAILS_SUBMITTED",
  "CONFIRMED",
  "DECLINED",
] as const;

export type PipelineStatus = (typeof PIPELINE_STATUSES)[number];