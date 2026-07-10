import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { LocalProjectAuthorizationStore } from './projectAuthorizationStore';

const tempRoots: string[] = [];

function createStoreRoot(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ghostcommit-project-map-'));
  tempRoots.push(root);
  return root;
}

describe('LocalProjectAuthorizationStore', () => {
  afterEach(() => {
    for (const root of tempRoots.splice(0)) {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('persists authorized project mappings locally and idempotently without enabling collection', () => {
    const userDataPath = createStoreRoot();
    const localRootPath = path.join(userDataPath, 'private-client-project');
    const store = new LocalProjectAuthorizationStore(userDataPath);

    store.saveAuthorizedProject({
      projectId: 'project_1',
      displayName: 'Client Project',
      localAlias: 'client-project',
      localRootPath,
    });
    store.saveAuthorizedProject({
      projectId: 'project_1',
      displayName: 'Client Project Renamed',
      localAlias: 'client-project',
      localRootPath,
    });

    expect(store.listAuthorizedProjects()).toEqual([
      {
        projectId: 'project_1',
        displayName: 'Client Project Renamed',
        localAlias: 'client-project',
        localRootPath,
        collectionEnabled: false,
        authorizedAt: expect.any(String),
      },
    ]);
  });

  it('enables and pauses collection locally by project id without changing the local root path', () => {
    const userDataPath = createStoreRoot();
    const localRootPath = path.join(userDataPath, 'private-client-project');
    const store = new LocalProjectAuthorizationStore(userDataPath);
    store.saveAuthorizedProject({
      projectId: 'project_1',
      displayName: 'Client Project',
      localAlias: 'client-project',
      localRootPath,
    });

    expect(store.setProjectCollectionEnabled('missing_project', true)).toEqual({
      status: 'not_found',
    });
    expect(store.setProjectCollectionEnabled('project_1', true)).toEqual({
      status: 'updated',
      project: expect.objectContaining({
        projectId: 'project_1',
        localRootPath,
        collectionEnabled: true,
      }),
    });
    expect(store.setProjectCollectionEnabled('project_1', false)).toEqual({
      status: 'updated',
      project: expect.objectContaining({
        projectId: 'project_1',
        localRootPath,
        collectionEnabled: false,
      }),
    });
  });
});
