import { describe, expect, it, vi } from 'vitest';
import { FileWatcher } from './fileWatcher';
import type { AuthorizedProjectMapping } from './projectAuthorizationStore';

function createProject(overrides: Partial<AuthorizedProjectMapping> = {}): AuthorizedProjectMapping {
  return {
    projectId: 'project_1',
    displayName: 'Client Portal',
    localAlias: 'client-portal',
    localRootPath: 'C:\\Users\\dev\\client-portal',
    collectionEnabled: true,
    authorizedAt: '2026-07-03T00:00:00.000Z',
    ...overrides,
  };
}

describe('FileWatcher authorized project boundary', () => {
  it('refuses to watch projects that are not explicitly enabled locally', () => {
    const watchFactory = vi.fn();
    const watcher = new FileWatcher({ watchFactory });

    const result = watcher.watchAuthorizedProject(createProject({ collectionEnabled: false }));

    expect(result).toEqual({ status: 'disabled' });
    expect(watchFactory).not.toHaveBeenCalled();
    expect(watcher.getWatchedPaths()).toEqual([]);
  });

  it('watches only the authorized project root and emits filtered relative project paths', () => {
    const close = vi.fn();
    const handlers = new Map<string, (filePath: string) => void>();
    const watchFactory = vi.fn((_root: string, _options: unknown) => ({
      on(event: string, handler: (filePath: string) => void) {
        handlers.set(event, handler);
        return this;
      },
      close,
    }));
    const watcher = new FileWatcher({ watchFactory, debounceMs: 0 });
    const project = createProject();
    const changes: unknown[] = [];
    watcher.on('authorizedChanges', (events) => changes.push(...events));

    const result = watcher.watchAuthorizedProject(project);
    handlers.get('change')?.('C:\\Users\\dev\\client-portal\\src\\feature\\index.ts');
    handlers.get('add')?.('C:\\Users\\dev\\client-portal\\.env');
    handlers.get('change')?.('C:\\Users\\dev\\client-portal\\.git\\HEAD');
    handlers.get('change')?.('C:\\Users\\dev\\client-portal\\node_modules\\pkg\\index.js');
    handlers.get('unlink')?.('C:\\Users\\dev\\outside\\secret.ts');

    expect(result).toEqual({ status: 'watching' });
    expect(watchFactory).toHaveBeenCalledWith(
      'C:\\Users\\dev\\client-portal',
      expect.objectContaining({ ignoreInitial: true }),
    );
    expect(changes).toEqual([
      {
        projectId: 'project_1',
        localAlias: 'client-portal',
        relativePath: 'src/feature/index.ts',
        type: 'change',
        timestamp: expect.any(Date),
      },
    ]);
    expect(JSON.stringify(changes)).not.toMatch(/C:\\|Users|client-portal\\|outside|secret|\\.env|node_modules|\\.git/);
  });
});
