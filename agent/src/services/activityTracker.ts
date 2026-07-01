import { EventEmitter } from 'events';
import { FileWatcher, FileChangeEvent } from './fileWatcher';
import { GitDetector, GitInfo } from './gitDetector';
import { ApiClient, ActivitySessionData } from './apiClient';
import { StorageService } from './storage';
import * as os from 'os';

export interface ActiveSession {
  startTime: Date;
  files: Set<string>;
  gitInfo: GitInfo | null;
  repoPath: string | null;
}

export interface ActivityTrackerOptions {
  syncOnStart?: boolean;
}

export class ActivityTracker extends EventEmitter {
  private fileWatcher: FileWatcher;
  private gitDetector: GitDetector;
  private apiClient: ApiClient;
  private storage: StorageService;
  private activeSession: ActiveSession | null = null;
  private sessionTimeout: NodeJS.Timeout | null = null;
  private syncInterval: NodeJS.Timeout | null = null;
  private readonly SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes of inactivity
  private readonly SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(
    fileWatcher: FileWatcher,
    gitDetector: GitDetector,
    apiClient: ApiClient,
    storage: StorageService,
    options: ActivityTrackerOptions = {},
  ) {
    super();
    this.fileWatcher = fileWatcher;
    this.gitDetector = gitDetector;
    this.apiClient = apiClient;
    this.storage = storage;

    this.setupListeners();
    if (options.syncOnStart === true) {
      this.startSyncInterval();
    }
  }

  private setupListeners(): void {
    this.fileWatcher.on('changes', (changes: FileChangeEvent[]) => {
      this.handleFileChanges(changes);
    });
  }

  private async handleFileChanges(changes: FileChangeEvent[]): Promise<void> {
    console.log(`Detected ${changes.length} file changes`);

    // Start new session if none exists
    if (!this.activeSession) {
      await this.startSession(changes[0].path);
    }

    // Add files to current session
    changes.forEach((change) => {
      this.activeSession?.files.add(change.path);
    });

    // Reset session timeout
    this.resetSessionTimeout();

    this.emit('activity', { sessionActive: true, fileCount: this.activeSession?.files.size });
  }

  private async startSession(filePath: string): Promise<void> {
    console.log('Starting new activity session');

    // Detect git repo
    const gitInfo = await this.gitDetector.detectRepo(filePath);

    this.activeSession = {
      startTime: new Date(),
      files: new Set(),
      gitInfo: gitInfo.isRepo ? gitInfo : null,
      repoPath: gitInfo.repoPath || null,
    };

    this.emit('sessionStarted', this.activeSession);
  }

  private async endSession(): Promise<void> {
    if (!this.activeSession) return;

    console.log('Ending activity session');

    const session = this.activeSession;
    const endTime = new Date();
    const durationMs = endTime.getTime() - session.startTime.getTime();

    // Get git statistics if in a repo
    let commitCount = 0;
    let linesAdded = 0;
    let linesDeleted = 0;

    if (session.repoPath) {
      commitCount = await this.gitDetector.getCommitCount(session.repoPath, session.startTime);
      const diff = await this.gitDetector.getDiff(session.repoPath);
      linesAdded = diff.added;
      linesDeleted = diff.deleted;
    }

    const sessionData: ActivitySessionData = {
      startTime: session.startTime.toISOString(),
      endTime: endTime.toISOString(),
      durationMs,
      filesModified: Array.from(session.files),
      linesAdded,
      linesDeleted,
      commitCount,
      metadata: {
        os: os.platform(),
        hostname: os.hostname(),
        gitRepo: session.gitInfo?.remoteName,
      },
    };

    // Try to send to API, or save locally if offline
    try {
      if (this.apiClient.isAuthenticated()) {
        await this.apiClient.createActivitySession(sessionData);
        console.log('Activity session sent to API');
      } else {
        this.storage.savePendingSession(sessionData);
        console.log('Activity session saved locally (not authenticated)');
      }
    } catch (error) {
      console.error('Error sending session, saving locally:', error);
      this.storage.savePendingSession(sessionData);
    }

    this.activeSession = null;
    this.emit('sessionEnded', sessionData);
  }

  private resetSessionTimeout(): void {
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
    }

    this.sessionTimeout = setTimeout(() => {
      this.endSession();
    }, this.SESSION_TIMEOUT_MS);
  }

  private startSyncInterval(): void {
    this.syncInterval = setInterval(() => {
      this.syncPendingSessions();
    }, this.SYNC_INTERVAL_MS);

    // Also sync immediately
    this.syncPendingSessions();
  }

  private async syncPendingSessions(): Promise<void> {
    if (!this.apiClient.isAuthenticated()) {
      return;
    }

    const pendingSessions = this.storage.getPendingSessions();
    if (pendingSessions.length === 0) {
      return;
    }

    console.log(`Syncing ${pendingSessions.length} pending sessions`);

    for (const session of pendingSessions) {
      try {
        await this.apiClient.createActivitySession(session);
        this.storage.removePendingSession(session.id);
        console.log(`Synced pending session: ${session.id}`);
      } catch (error) {
        console.error(`Error syncing session ${session.id}:`, error);
        // Keep in queue for next sync
      }
    }
  }

  getActiveSession(): ActiveSession | null {
    return this.activeSession;
  }

  stop(): void {
    if (this.activeSession) {
      this.endSession();
    }

    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
    }

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }
}
