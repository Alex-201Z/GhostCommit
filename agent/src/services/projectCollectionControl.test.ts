import { describe, expect, it, vi } from 'vitest';
import {
  ProjectCollectionControlService,
  type ProjectCollectionControlDependencies,
} from './projectCollectionControl';
import type { AuthorizedProjectMapping } from './projectAuthorizationStore';

function createProject(
  overrides: Partial<AuthorizedProjectMapping> = {},
): AuthorizedProjectMapping {
  return {
    projectId: 'project_1',
    displayName: 'Client Portal',
    localAlias: 'client-portal',
    localRootPath: 'C:\\Users\\dev\\client-portal',
    collectionEnabled: false,
    authorizedAt: '2026-07-10T00:00:00.000Z',
    ...overrides,
  };
}

function createDependencies(project = createProject()): ProjectCollectionControlDependencies {
  return {
    setProjectCollectionEnabled: vi.fn((_projectId: string, collectionEnabled: boolean) => ({
      status: 'updated',
      project: { ...project, collectionEnabled },
    })),
    watchAuthorizedProject: vi.fn(() => ({ status: 'watching' })),
    unwatchPath: vi.fn(),
  };
}

describe('ProjectCollectionControlService', () => {
  it('starts only the privacy-safe watcher after explicitly enabling an authorized project', () => {
    const dependencies = createDependencies();
    const service = new ProjectCollectionControlService(dependencies);

    const result = service.startProject('project_1');

    expect(result).toEqual({ status: 'started', project: expect.objectContaining({ collectionEnabled: true }) });
    expect(dependencies.setProjectCollectionEnabled).toHaveBeenCalledWith('project_1', true);
    expect(dependencies.watchAuthorizedProject).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: 'project_1', collectionEnabled: true }),
    );
    expect(dependencies.unwatchPath).not.toHaveBeenCalled();
  });

  it('pauses an authorized project locally and stops only its safe watcher root', () => {
    const project = createProject({ collectionEnabled: true });
    const dependencies = createDependencies(project);
    const service = new ProjectCollectionControlService(dependencies);

    const result = service.pauseProject('project_1');

    expect(result).toEqual({ status: 'paused', project: expect.objectContaining({ collectionEnabled: false }) });
    expect(dependencies.setProjectCollectionEnabled).toHaveBeenCalledWith('project_1', false);
    expect(dependencies.unwatchPath).toHaveBeenCalledWith('C:\\Users\\dev\\client-portal');
    expect(dependencies.watchAuthorizedProject).not.toHaveBeenCalled();
  });

  it('restores the paused local state when the authorized watcher refuses to start', () => {
    const dependencies = createDependencies();
    dependencies.watchAuthorizedProject = vi.fn(() => ({ status: 'disabled' }));
    const service = new ProjectCollectionControlService(dependencies);

    expect(service.startProject('project_1')).toEqual({ status: 'not_started' });
    expect(dependencies.setProjectCollectionEnabled).toHaveBeenNthCalledWith(1, 'project_1', true);
    expect(dependencies.setProjectCollectionEnabled).toHaveBeenNthCalledWith(2, 'project_1', false);
    expect(dependencies.unwatchPath).not.toHaveBeenCalled();
  });

  it('does not start or stop a watcher when the local mapping no longer exists', () => {
    const dependencies = createDependencies();
    dependencies.setProjectCollectionEnabled = vi.fn(() => ({ status: 'not_found' }));
    const service = new ProjectCollectionControlService(dependencies);

    expect(service.startProject('missing')).toEqual({ status: 'not_found' });
    expect(service.pauseProject('missing')).toEqual({ status: 'not_found' });
    expect(dependencies.watchAuthorizedProject).not.toHaveBeenCalled();
    expect(dependencies.unwatchPath).not.toHaveBeenCalled();
  });
});
