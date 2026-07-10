import { EventEmitter } from 'events';
import { describe, expect, it, vi } from 'vitest';
import { ActivityTracker } from './activityTracker';
import { ApiClient, type ActivitySessionData } from './apiClient';
import { FileWatcher } from './fileWatcher';
import { GitDetector } from './gitDetector';
import { StorageService, type PendingSession } from './storage';

describe('ActivityTracker startup privacy', () => {
  it('does not sync pending sessions automatically when constructed', async () => {
    const pendingSession: PendingSession = {
      id: 'local_1',
      localTimestamp: Date.now(),
      startTime: new Date().toISOString(),
      filesModified: ['src/index.ts'],
    };
    const createActivitySession = vi.fn<[ActivitySessionData], Promise<unknown>>();
    const storage = {
      getPendingSessions: () => [pendingSession],
      removePendingSession: vi.fn(),
      savePendingSession: vi.fn(),
    } as unknown as StorageService;
    const apiClient = {
      isAuthenticated: () => true,
      createActivitySession,
    } as unknown as ApiClient;

    new ActivityTracker(
      new EventEmitter() as unknown as FileWatcher,
      {} as unknown as GitDetector,
      apiClient,
      storage,
    );
    await Promise.resolve();

    expect(createActivitySession).not.toHaveBeenCalled();
  });
});
