export type ToothCondition = 'healthy' | 'crown' | 'decay' | 'filling' | 'missing';

export type NoteType = 'Treatment' | 'Hygiene';

export interface ClinicalNoteData {
  noteId: string;
  noteType: NoteType;
  content: string;
  createdByName: string;
  visitDate: string;    // ISO 8601 UTC string
  createdAt: string;
  updatedAt: string;
  aiAssisted: boolean;
}

export interface CreateNotePayload {
  content: string;
  visitDate: string;   // ISO 8601 UTC string
  aiToken?: string;
}

export interface ToothData {
  toothNumber: number;   // 1–32 Universal Numbering System
  condition: ToothCondition;
}

export interface DentalChartData {
  chartId: string;
  patientId: string;
  chartNumber: string | null;
  teeth: ToothData[];
}
