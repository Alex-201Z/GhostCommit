export interface TrayMenuItemModel {
  label: string;
  enabled: boolean;
}

export interface PrivacySafeWatchControls {
  watchSummary: {
    label: string;
    items: TrayMenuItemModel[];
  };
  addProjectLabel: string;
  canAddProjectLocally: boolean;
  requestAddProject: () => void;
}

export interface PrivacySafeWatchControlDependencies {
  openFolder: (localPath: string) => void;
}

export function createPrivacySafeWatchControls(
  watchedPaths: string[],
  _dependencies: PrivacySafeWatchControlDependencies,
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
    addProjectLabel: 'Autoriser un projet Git local',
    canAddProjectLocally: true,
    requestAddProject: () => undefined,
  };
}
