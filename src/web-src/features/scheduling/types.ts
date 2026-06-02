export interface ProviderOption {
  id: string;       // EntityId from backend
  email: string;
  roles: string[];  // Clinical roles held: ['Dentist'] | ['Hygienist'] | ['Dentist', 'Hygienist']
}

export type AppointmentStatus = 'Scheduled' | 'Confirmed' | 'Cancelled' | 'Completed' | 'InProgress';

export interface ScheduleEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resourceId: string;  // providerId
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    patientId: string;
    patientName: string;
    appointmentType: string;
    status: AppointmentStatus;
    providerId: string;
  };
}

export interface ProviderResource {
  id: string;
  title: string;  // provider name/email
  email?: string;
  avatarUrl?: string;
  specialization?: string;
}
