import type { AuthorizedWatchResult } from './fileWatcher';
import type {
  AuthorizedProjectMapping,
  ProjectCollectionToggleResult,
} from './projectAuthorizationStore';

export type ProjectCollectionControlResult =
  | { status: 'started'; project: AuthorizedProjectMapping }
  | { status: 'paused'; project: AuthorizedProjectMapping }
  | { status: 'not_found' }
  | { status: 'not_started' };

export interface ProjectCollectionControlDependencies {
  setProjectCollectionEnabled: (
    projectId: string,
    collectionEnabled: boolean,
  ) => ProjectCollectionToggleResult;
  watchAuthorizedProject: (project: AuthorizedProjectMapping) => AuthorizedWatchResult;
  unwatchPath: (localRootPath: string) => void;
}

export class ProjectCollectionControlService {
  constructor(private readonly dependencies: ProjectCollectionControlDependencies) {}

  startProject(projectId: string): ProjectCollectionControlResult {
    const updated = this.dependencies.setProjectCollectionEnabled(projectId, true);
    if (updated.status === 'not_found') {
      return updated;
    }

    const watchResult = this.dependencies.watchAuthorizedProject(updated.project);
    if (watchResult.status === 'disabled') {
      this.dependencies.setProjectCollectionEnabled(projectId, false);
      return { status: 'not_started' };
    }

    return { status: 'started', project: updated.project };
  }

  pauseProject(projectId: string): ProjectCollectionControlResult {
    const updated = this.dependencies.setProjectCollectionEnabled(projectId, false);
    if (updated.status === 'not_found') {
      return updated;
    }

    this.dependencies.unwatchPath(updated.project.localRootPath);
    return { status: 'paused', project: updated.project };
  }
}
