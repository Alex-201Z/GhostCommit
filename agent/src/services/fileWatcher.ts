import chokidar, { FSWatcher } from 'chokidar';
import { EventEmitter } from 'events';
import * as path from 'path';

export interface FileChangeEvent {
  path: string;
  type: 'add' | 'change' | 'unlink';
  timestamp: Date;
}

export class FileWatcher extends EventEmitter {
  private watchers: Map<string, FSWatcher> = new Map();
  private recentChanges: Map<string, FileChangeEvent> = new Map();
  private changeTimeout: NodeJS.Timeout | null = null;
  private readonly DEBOUNCE_MS = 1000; // 1 second debounce

  watchPath(watchPath: string): void {
    if (this.watchers.has(watchPath)) {
      console.log(`Already watching: ${watchPath}`);
      return;
    }

    const watcher = chokidar.watch(watchPath, {
      ignored: [
        /(^|[\/\\])\../, // dot files
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
    });

    watcher
      .on('add', (filePath) => this.handleFileChange(filePath, 'add'))
      .on('change', (filePath) => this.handleFileChange(filePath, 'change'))
      .on('unlink', (filePath) => this.handleFileChange(filePath, 'unlink'))
      .on('error', (error) => console.error(`Watcher error:`, error));

    this.watchers.set(watchPath, watcher);
    console.log(`Watching path: ${watchPath}`);
  }

  unwatchPath(watchPath: string): void {
    const watcher = this.watchers.get(watchPath);
    if (watcher) {
      watcher.close();
      this.watchers.delete(watchPath);
      console.log(`Stopped watching: ${watchPath}`);
    }
  }

  private handleFileChange(filePath: string, type: 'add' | 'change' | 'unlink'): void {
    const event: FileChangeEvent = {
      path: filePath,
      type,
      timestamp: new Date(),
    };

    this.recentChanges.set(filePath, event);

    // Debounce to avoid too many events
    if (this.changeTimeout) {
      clearTimeout(this.changeTimeout);
    }

    this.changeTimeout = setTimeout(() => {
      this.emitChanges();
    }, this.DEBOUNCE_MS);
  }

  private emitChanges(): void {
    if (this.recentChanges.size > 0) {
      const changes = Array.from(this.recentChanges.values());
      this.emit('changes', changes);
      this.recentChanges.clear();
    }
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
    this.watchers.forEach((watcher) => watcher.close());
    this.watchers.clear();
    if (this.changeTimeout) {
      clearTimeout(this.changeTimeout);
    }
  }
}
