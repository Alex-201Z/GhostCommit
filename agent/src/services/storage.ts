import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';
import { ActivitySessionData } from './apiClient';

export interface PendingSession extends ActivitySessionData {
  id: string;
  localTimestamp: number;
}

export class StorageService {
  private storagePath: string;
  private pendingSessionsPath: string;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.storagePath = path.join(userDataPath, 'data');
    this.pendingSessionsPath = path.join(this.storagePath, 'pending-sessions.json');
    this.ensureStorageDirectory();
  }

  private ensureStorageDirectory(): void {
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }
  }

  savePendingSession(session: ActivitySessionData): string {
    const sessions = this.getPendingSessions();
    const id = this.generateId();
    const pendingSession: PendingSession = {
      ...session,
      id,
      localTimestamp: Date.now(),
    };

    sessions.push(pendingSession);
    this.writePendingSessions(sessions);
    return id;
  }

  getPendingSessions(): PendingSession[] {
    try {
      if (fs.existsSync(this.pendingSessionsPath)) {
        const data = fs.readFileSync(this.pendingSessionsPath, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error reading pending sessions:', error);
    }
    return [];
  }

  removePendingSession(id: string): void {
    const sessions = this.getPendingSessions().filter((s) => s.id !== id);
    this.writePendingSessions(sessions);
  }

  private writePendingSessions(sessions: PendingSession[]): void {
    try {
      fs.writeFileSync(this.pendingSessionsPath, JSON.stringify(sessions, null, 2));
    } catch (error) {
      console.error('Error writing pending sessions:', error);
    }
  }

  private generateId(): string {
    return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  clearAll(): void {
    try {
      if (fs.existsSync(this.pendingSessionsPath)) {
        fs.unlinkSync(this.pendingSessionsPath);
      }
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }
}
