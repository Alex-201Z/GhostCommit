import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_AGENT_IGNORED_PATTERNS,
  ProjectSelectionService,
} from './projectSelection';

const tempRoots: string[] = [];

function createGitProject(name: string): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `ghostcommit-${name}-`));
  fs.mkdirSync(path.join(root, '.git'));
  tempRoots.push(root);
  return root;
}

describe('ProjectSelectionService', () => {
  afterEach(() => {
    for (const root of tempRoots.splice(0)) {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('creates a local-only draft that keeps absolute paths out of the API payload', async () => {
    const root = createGitProject('privacy');
    const service = new ProjectSelectionService();

    const draft = await service.createAuthorizationDraft(root);

    expect(draft.requiresUserConfirmation).toBe(true);
    expect(draft.localRootPath).toBe(root);
    expect(draft.apiPayload).toMatchObject({
      displayName: path.basename(root),
      gitProvider: 'LOCAL',
      localAlias: path.basename(root),
      ignoredPatterns: DEFAULT_AGENT_IGNORED_PATTERNS,
    });
    expect(JSON.stringify(draft.apiPayload)).not.toContain(root);
    expect(JSON.stringify(draft.apiPayload)).not.toContain(path.dirname(root));
  });

  it('does not produce a create-project payload before explicit confirmation', async () => {
    const root = createGitProject('confirm');
    const service = new ProjectSelectionService();
    const draft = await service.createAuthorizationDraft(root);

    expect(() => service.toCreateProjectPayload(draft, { confirmed: false })).toThrow(
      'Project tracking requires explicit user confirmation',
    );
  });

  it('normalizes ignored patterns to safe defaults plus user patterns without absolute paths', async () => {
    const root = createGitProject('patterns');
    const service = new ProjectSelectionService();

    const draft = await service.createAuthorizationDraft(root, {
      ignoredPatterns: ['tmp/**', `${root}/secrets/**`, '..\\private', '.env.local'],
    });

    expect(draft.apiPayload.ignoredPatterns).toEqual([
      ...DEFAULT_AGENT_IGNORED_PATTERNS,
      'tmp/**',
      '.env.local',
    ]);
    expect(JSON.stringify(draft.apiPayload.ignoredPatterns)).not.toContain(root);
    expect(draft.apiPayload.ignoredPatterns).not.toContain('..\\private');
  });

  it('rejects non-git folders so arbitrary personal directories are not authorized', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ghostcommit-non-git-'));
    tempRoots.push(root);
    const service = new ProjectSelectionService();

    await expect(service.createAuthorizationDraft(root)).rejects.toThrow(
      'Only Git repository folders can be selected',
    );
  });
});
