import chokidar, { FSWatcher } from 'chokidar';
import { EventEmitter } from 'events';
import * as path from 'path';
import type { AuthorizedProjectMapping } from './projectAuthorizationStore';

export interface FileChangeEvent {
  path: string;
  type: 'add' | 'change' | 'unlink';
  timestamp: Date;
}

export interface AuthorizedFileChangeEvent {
  projectId: string;
  localAlias: string;
  relativePath: string;
  type: 'add' | 'change' | 'unlink';
  timestamp: Date;
}

export interface WatchHandle {
  on(event: string, handler: (filePath: string) => void): WatchHandle;
  close(): unknown;
}

export type WatchFactory = (watchPath: string, options: Record<string, unknown>) => WatchHandle;

export interface FileWatcherOptions {
  watchFactory?: WatchFactory;
  debounceMs?: number;
}

export type AuthorizedWatchResult =
  | { status: 'watching' }
  | { status: 'already_watching' }
  | { status: 'disabled' };

const SENSITIVE_SEGMENTS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.next',
  'secrets',
  'private',
]);

export class FileWatcher extends EventEmitter {
  private watchers: Map<string, WatchHandle> = new Map();
  private recentChanges: Map<string, FileChangeEvent> = new Map();
  private authorizedChanges: AuthorizedFileChangeEvent[] = [];
  private changeTimeout: NodeJS.Timeout | null = null;
  private authorizedChangeTimeout: NodeJS.Timeout | null = null;
  private readonly watchFactory: WatchFactory;
  private readonly debounceMs: number;

  constructor(options: FileWatcherOptions = {}) {
    super();
    this.watchFactory =
      options.watchFactory ??
      ((watchPath, watchOptions) => chokidar.watch(watchPath, watchOptions) as WatchHandle);
    this.debounceMs = options.debounceMs ?? 1000;
  }

  watchPath(watchPath: string): void {
    if (this.watchers.has(watchPath)) {
      console.log(`Already watching configured path`);
      return;
    }

    const watcher = this.watchFactory(watchPath, this.createWatchOptions());

    watcher
      .on('add', (filePath) => this.handleFileChange(filePath, 'add'))
      .on('change', (filePath) => this.handleFileChange(filePath, 'change'))
      .on('unlink', (filePath) => this.handleFileChange(filePath, 'unlink'))
      .on('error', () => console.error(`Watcher error`));

    this.watchers.set(watchPath, watcher);
    console.log(`Watching configured path`);
  }

  watchAuthorizedProject(project: AuthorizedProjectMapping): AuthorizedWatchResult {
    if (!project.collectionEnabled) {
      return { status: 'disabled' };
    }

    if (this.watchers.has(project.localRootPath)) {
      return { status: 'already_watching' };
    }

    const watcher = this.watchFactory(project.localRootPath, this.createWatchOptions());
    watcher
      .on('add', (filePath) => this.handleAuthorizedFileChange(project, filePath, 'add'))
      .on('change', (filePath) => this.handleAuthorizedFileChange(project, filePath, 'change'))
      .on('unlink', (filePath) => this.handleAuthorizedFileChange(project, filePath, 'unlink'))
      .on('error', () => console.error(`Authorized watcher error`));

    this.watchers.set(project.localRootPath, watcher);

    return { status: 'watching' };
  }

  unwatchPath(watchPath: string): void {
    const watcher = this.watchers.get(watchPath);
    if (watcher) {
      void watcher.close();
      this.watchers.delete(watchPath);
      console.log(`Stopped watching configured path`);
    }
  }

  private handleFileChange(filePath: string, type: 'add' | 'change' | 'unlink'): void {
    const event: FileChangeEvent = {
      path: filePath,
      type,
      timestamp: new Date(),
    };

    this.recentChanges.set(filePath, event);

    if (this.changeTimeout) {
      clearTimeout(this.changeTimeout);
    }

    this.changeTimeout = setTimeout(() => {
      this.emitChanges();
    }, this.debounceMs);
  }

  private handleAuthorizedFileChange(
    project: AuthorizedProjectMapping,
    filePath: string,
    type: 'add' | 'change' | 'unlink',
  ): void {
    const relativePath = this.toSafeRelativePath(project.localRootPath, filePath);
    if (!relativePath) {
      return;
    }

    this.authorizedChanges.push({
      projectId: project.projectId,
      localAlias: project.localAlias,
      relativePath,
      type,
      timestamp: new Date(),
    });

    if (this.authorizedChangeTimeout) {
      clearTimeout(this.authorizedChangeTimeout);
    }

    if (this.debounceMs === 0) {
      this.emitAuthorizedChanges();
      return;
    }

    this.authorizedChangeTimeout = setTimeout(() => {
      this.emitAuthorizedChanges();
    }, this.debounceMs);
  }

  private emitChanges(): void {
    if (this.recentChanges.size > 0) {
      const changes = Array.from(this.recentChanges.values());
      this.emit('changes', changes);
      this.recentChanges.clear();
    }
  }

  private emitAuthorizedChanges(): void {
    if (this.authorizedChanges.length > 0) {
      const changes = [...this.authorizedChanges];
      this.emit('authorizedChanges', changes);
      this.authorizedChanges = [];
    }
  }

  private toSafeRelativePath(projectRoot: string, filePath: string): string | null {
    const pathModule = this.pathModuleFor(projectRoot, filePath);
    const relative = pathModule.relative(projectRoot, filePath);
    if (!relative || relative.startsWith('..') || pathModule.isAbsolute(relative)) {
      return null;
    }

    const normalized = relative.split(/[\\/]+/).join('/');
    const segments = normalized.split('/');
    if (
      segments.some((segment) => SENSITIVE_SEGMENTS.has(segment)) ||
      segments.some((segment) => segment === '.env' || segment.startsWith('.env.')) ||
      segments.some((segment) => /\.(pem|key|crt|p12|pfx)$/i.test(segment))
    ) {
      return null;
    }

    return normalized;
  }

  private pathModuleFor(projectRoot: string, filePath: string): path.PlatformPath {
    const hasWindowsRoot = [projectRoot, filePath].some((value) =>
      /^(?:[a-zA-Z]:[\\/]|\\\\)/.test(value),
    );
    return hasWindowsRoot ? path.win32 : path.posix;
  }

  private createWatchOptions(): Record<string, unknown> {
    return {
      ignored: [
        /(^|[\/\\])\../,
        /node_modules/,
        /\.git/,
        /dist/,
        /build/,
        /coverage/,
        /\.log$/,
      ],
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100,
      },
    };
  }

  getRecentChanges(): FileChangeEvent[] {
    return Array.from(this.recentChanges.values());
  }

  clearChanges(): void {
    this.recentChanges.clear();
  }

  getWatchedPaths(): string[] {
    return Array.from(this.watchers.keys());
  }

  stopAll(): void {
    this.watchers.forEach((watcher) => void watcher.close());
    this.watchers.clear();
    if (this.changeTimeout) {
      clearTimeout(this.changeTimeout);
    }
    if (this.authorizedChangeTimeout) {
      clearTimeout(this.authorizedChangeTimeout);
    }
  }
}
