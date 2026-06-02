import apiClient from '../apiClient';

export interface AiSuggestionResult {
  suggestionId: string;
  content: string;
  aiAssisted: boolean;
  aiToken?: string;
}

export async function structureClinicalNote(
  rawDictation: string,
  patientId: string,
): Promise<AiSuggestionResult> {
  const res = await apiClient.post('/api/ai/documentation/structure', {
    rawDictation,
    patientId,
  });
  return res.data as AiSuggestionResult;
}

export async function generateSchedulingSuggestion(
  patientId: string,
  appointmentType: string,
): Promise<AiSuggestionResult> {
  const res = await apiClient.post('/api/ai/scheduling/suggest', {
    patientId,
    appointmentType,
  });
  return res.data as AiSuggestionResult;
}

export interface AiFollowUpSuggestionResult {
  suggestionId: string;
  content: string;
  proposedSlotStart: string;   // ISO 8601 UTC string — parse as new Date(proposedSlotStart)
  durationMinutes: number;
  aiAssisted: boolean;
}

export async function generateFollowUpSuggestion(
  patientId: string,
): Promise<AiFollowUpSuggestionResult> {
  const res = await apiClient.post('/api/ai/scheduling/follow-up-suggest', {
    patientId,
  });
  return res.data as AiFollowUpSuggestionResult;
}
