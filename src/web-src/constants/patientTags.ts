// MVP: hardcoded tag list — admin-configurable in Growth phase
export const AVAILABLE_TAGS = ['VIP', 'Surgical', 'Pediatric', 'Maintenance', 'Anxiety', 'NeedsTranslator'] as const;
export type PatientTag = typeof AVAILABLE_TAGS[number];
