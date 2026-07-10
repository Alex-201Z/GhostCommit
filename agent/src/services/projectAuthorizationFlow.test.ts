import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProjectSelectionService, type ProjectCreatePayload } from './projectSelection';
import { ProjectAuthorizationFlow } from './projectAuthorizationFlow';

const tempRoots: string[] = [];

function createGitProject(name: string): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `ghostcommit-auth-${name}-`));
  fs.mkdirSync(path.join(root, '.git'));
  tempRoots.push(root);
  return root;
}

describe('ProjectAuthorizationFlow', () => {
  afterEach(() => {
    for (const root of tempRoots.splice(0)) {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('creates a backend project only after explicit confirmation with a path-free payload', async () => {
    const root = createGitProject('confirmed');
    const saveAuthorizedProject = vi.fn();
    const createProject = vi.fn(
      async (payload: ProjectCreatePayload, userAccessToken: string) => ({
        id: 'project_1',
        ...payload,
        userAccessToken,
      }),
    );
    const flow = new ProjectAuthorizationFlow({
      selection: new ProjectSelectionService(),
      createProject,
      saveAuthorizedProject,
      requestUserConfirmation: async (draft) => {
        expect(draft.localRootPath).toBe(root);
        expect(JSON.stringify(draft.apiPayload)).not.toContain(root);
        return { confirmed: true, userAccessToken: 'user_access_token' };
      },
    });

    const result = await flow.authorizeLocalProject(root);

    expect(result.status).toBe('created');
    expect(createProject).toHaveBeenCalledTimes(1);
    expect(createProject).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: path.basename(root),
        gitProvider: 'LOCAL',
        localAlias: path.basename(root),
      }),
      'user_access_token',
    );
    expect(JSON.stringify(createProject.mock.calls[0][0])).not.toContain(root);
    expect(JSON.stringify(createProject.mock.calls[0][0])).not.toContain(path.dirname(root));
    expect(saveAuthorizedProject).toHaveBeenCalledWith({
      projectId: 'project_1',
      displayName: path.basename(root),
      localAlias: path.basename(root),
      localRootPath: root,
    });
  });

  it('does not call the backend when confirmation is cancelled', async () => {
    const root = createGitProject('cancelled');
    const createProject = vi.fn();
    const flow = new ProjectAuthorizationFlow({
      selection: new ProjectSelectionService(),
      createProject,
      saveAuthorizedProject: vi.fn(),
      requestUserConfirmation: async () => ({ confirmed: false }),
    });

    const result = await flow.authorizeLocalProject(root);

    expect(result).toEqual({ status: 'cancelled' });
    expect(createProject).not.toHaveBeenCalled();
  });

  it('requires an authenticated dashboard session before creating the project', async () => {
    const root = createGitProject('tokenless');
    const createProject = vi.fn();
    const flow = new ProjectAuthorizationFlow({
      selection: new ProjectSelectionService(),
      createProject,
      saveAuthorizedProject: vi.fn(),
      requestUserConfirmation: async () => ({ confirmed: true }),
    });

    const result = await flow.authorizeLocalProject(root);

    expect(result).toEqual({
      status: 'error',
      message: 'Connectez-vous au dashboard avant d’autoriser un projet local.',
    });
    expect(createProject).not.toHaveBeenCalled();
  });

  it('does not save a local mapping when the backend response has no project id', async () => {
    const root = createGitProject('missing-id');
    const saveAuthorizedProject = vi.fn();
    const flow = new ProjectAuthorizationFlow({
      selection: new ProjectSelectionService(),
      createProject: vi.fn(async () => ({ displayName: 'missing id' })),
      saveAuthorizedProject,
      requestUserConfirmation: async () => ({ confirmed: true, userAccessToken: 'user_access_token' }),
    });

    const result = await flow.authorizeLocalProject(root);

    expect(result).toEqual({
      status: 'error',
      message: 'Le backend n’a pas retourné d’identifiant projet valide.',
    });
    expect(saveAuthorizedProject).not.toHaveBeenCalled();
  });
});
