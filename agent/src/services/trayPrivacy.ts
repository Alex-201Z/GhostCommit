export interface TrayMenuItemModel {
  label: string;
  enabled: boolean;
  click?: () => void;
}

export interface AuthorizedProjectTrayModel {
  projectId: string;
  displayName: string;
  localAlias: string;
  localRootPath: string;
  collectionEnabled: boolean;
}

export interface PrivacySafeWatchControls {
  watchSummary: {
    label: string;
    items: TrayMenuItemModel[];
  };
  projectControls: {
    label: string;
    items: TrayMenuItemModel[];
  };
  addProjectLabel: string;
  canAddProjectLocally: boolean;
  requestAddProject: () => void;
}

export interface PrivacySafeWatchControlDependencies {
  openFolder: (localPath: string) => void;
  startProject?: (projectId: string) => void;
  pauseProject?: (projectId: string) => void;
}

export function createPrivacySafeWatchControls(
  watchedPaths: string[],
  dependencies: PrivacySafeWatchControlDependencies,
  authorizedProjects: AuthorizedProjectTrayModel[] = [],
): PrivacySafeWatchControls {
  const count = watchedPaths.length;

  return {
    watchSummary: {
      label: `Dossiers configurés (${count})`,
      items:
        count > 0
          ? [
              {
                label: `${count} dossiers configurés localement — surveillance inactive`,
                enabled: false,
              },
            ]
          : [{ label: 'Aucun dossier surveillé', enabled: false }],
    },
    projectControls: {
      label: `Projets autorisés (${authorizedProjects.length})`,
      items:
        authorizedProjects.length > 0
          ? authorizedProjects.flatMap((project) => createProjectControlItems(project, dependencies))
          : [{ label: 'Aucun projet autorisé', enabled: false }],
    },
    addProjectLabel: 'Autoriser un projet Git local',
    canAddProjectLocally: true,
    requestAddProject: () => undefined,
  };
}

function createProjectControlItems(
  project: AuthorizedProjectTrayModel,
  dependencies: PrivacySafeWatchControlDependencies,
): TrayMenuItemModel[] {
  const projectLabel = project.collectionEnabled
    ? `${project.displayName} — suivi local actif`
    : `${project.displayName} — prêt, suivi en pause`;
  const action: TrayMenuItemModel = project.collectionEnabled
    ? {
        label: `Mettre en pause le suivi local de ${project.displayName}`,
        enabled: true,
        click: () => dependencies.pauseProject?.(project.projectId),
      }
    : {
        label: `Démarrer le suivi local de ${project.displayName}`,
        enabled: true,
        click: () => dependencies.startProject?.(project.projectId),
      };

  return [{ label: projectLabel, enabled: false }, action];
}
