import apiClient from '../apiClient';
import type { DentalChartData, ToothCondition, ClinicalNoteData, CreateNotePayload } from '../../features/clinical/types';

export async function getDentalChart(patientId: string): Promise<DentalChartData | null> {
  try {
    const res = await apiClient.get(`/api/clinical/chart/${patientId}`);
    return res.data as DentalChartData;
  } catch (err) {
    if ((err as { response?: { status?: number } })?.response?.status === 404) return null;
    throw err;
  }
}

export async function createChart(patientId: string): Promise<DentalChartData> {
  const res = await apiClient.post(`/api/clinical/chart/${patientId}`);
  return res.data as DentalChartData;
}

export async function updateToothCondition(
  patientId: string,
  toothNumber: number,
  condition: ToothCondition,
): Promise<{ toothNumber: number; condition: string }> {
  const res = await apiClient.patch(
    `/api/clinical/chart/${patientId}/teeth/${toothNumber}`,
    { condition },
  );
  return res.data;
}

export async function setChartNumber(
  patientId: string,
  chartNumber: string | null,
): Promise<{ chartId: string; patientId: string; chartNumber: string | null }> {
  const res = await apiClient.patch(
    `/api/clinical/chart/${patientId}/chart-number`,
    { chartNumber },
  );
  return res.data;
}

export async function getClinicalNotes(patientId: string): Promise<ClinicalNoteData[]> {
  const res = await apiClient.get(`/api/clinical/notes/${patientId}`);
  return res.data as ClinicalNoteData[];
}

export async function createClinicalNote(
  patientId: string,
  payload: CreateNotePayload,
): Promise<ClinicalNoteData> {
  const res = await apiClient.post(`/api/clinical/notes/${patientId}`, payload);
  return res.data as ClinicalNoteData;
}

export async function createHygieneNote(
  patientId: string,
  payload: CreateNotePayload,
): Promise<ClinicalNoteData> {
  const res = await apiClient.post(`/api/clinical/notes/${patientId}/hygiene`, payload);
  return res.data as ClinicalNoteData;
}

export async function updateClinicalNote(
  noteId: string,
  content: string,
): Promise<{ noteId: string; content: string; updatedAt: string }> {
  const res = await apiClient.put(`/api/clinical/notes/${noteId}`, { content });
  return res.data;
}
