export const Role = {
  PracticeOwner: 'PracticeOwner',
  OfficeManager: 'OfficeManager',
  FrontDesk: 'FrontDesk',
  Dentist: 'Dentist',
  Hygienist: 'Hygienist',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export interface AuthUser {
  userId: string;
  email?: string;      // optional — not included in auth cookie claims; add when profile API exists
  roles: Role[];
  tenantId: string;
}
