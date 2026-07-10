import {
  ProjectSelectionService,
  type ProjectAuthorizationDraft,
  type ProjectCreatePayload,
} from './projectSelection';
import type { SaveAuthorizedProjectInput } from './projectAuthorizationStore';

export interface ProjectAuthorizationConfirmation {
  confirmed: boolean;
  userAccessToken?: string;
}

export interface ProjectAuthorizationDependencies {
  selection: ProjectSelectionService;
  createProject: (payload: ProjectCreatePayload, userAccessToken: string) => Promise<unknown>;
  saveAuthorizedProject: (mapping: SaveAuthorizedProjectInput) => void;
  requestUserConfirmation: (
    draft: ProjectAuthorizationDraft,
  ) => Promise<ProjectAuthorizationConfirmation>;
}

export type ProjectAuthorizationResult =
  | { status: 'created'; project: unknown }
  | { status: 'cancelled' }
  | { status: 'error'; message: string };

const AUTH_REQUIRED_MESSAGE = 'Connectez-vous au dashboard avant d’autoriser un projet local.';
const INVALID_PROJECT_RESPONSE_MESSAGE = 'Le backend n’a pas retourné d’identifiant projet valide.';

export class ProjectAuthorizationFlow {
  constructor(private readonly dependencies: ProjectAuthorizationDependencies) {}

  async authorizeLocalProject(folderPath: string): Promise<ProjectAuthorizationResult> {
    try {
      const draft = await this.dependencies.selection.createAuthorizationDraft(folderPath);
      const confirmation = await this.dependencies.requestUserConfirmation(draft);

      if (!confirmation.confirmed) {
        return { status: 'cancelled' };
      }

      if (!confirmation.userAccessToken) {
        return { status: 'error', message: AUTH_REQUIRED_MESSAGE };
      }

      const payload = this.dependencies.selection.toCreateProjectPayload(draft, {
        confirmed: true,
      });
      const project = await this.dependencies.createProject(payload, confirmation.userAccessToken);
      const projectId = this.extractProjectId(project);
      if (!projectId) {
        return { status: 'error', message: INVALID_PROJECT_RESPONSE_MESSAGE };
      }

      this.dependencies.saveAuthorizedProject({
        projectId,
        displayName: payload.displayName,
        localAlias: payload.localAlias,
        localRootPath: draft.localRootPath,
      });

      return { status: 'created', project };
    } catch (error: unknown) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Impossible d’autoriser ce projet local.',
      };
    }
  }

  private extractProjectId(project: unknown): string | null {
    if (project && typeof project === 'object' && 'id' in project) {
      const id = project.id;
      return typeof id === 'string' && id.trim().length > 0 ? id : null;
    }

    return null;
  }
}
