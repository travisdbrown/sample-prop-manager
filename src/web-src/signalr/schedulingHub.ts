import * as signalR from '@microsoft/signalr';
import { getSessionToken } from '../services/apiClient';

// Scheduling hub — real-time slot locking (UX-DR7, NFR-R2: ≤500ms)
// Mirrors the SignalR hub in dental.scheduling.api
//
// Each call returns a fresh HubConnection — callers store it in a useRef and
// stop it in the effect cleanup. No module-level singleton: avoids orphaned
// connections under HMR and React 18 Strict Mode double-mount.

export function buildSchedulingHub(baseUrl: string): signalR.HubConnection {
  return new signalR.HubConnectionBuilder()
    .withUrl(`${baseUrl}/hubs/scheduling`, {
      accessTokenFactory: () => {
        const token = getSessionToken();
        if (!token) throw new Error('No auth token available for SignalR connection.');
        return token;
      },
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Warning)
    .build();
}
