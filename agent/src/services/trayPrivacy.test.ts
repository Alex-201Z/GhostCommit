import { describe, expect, it, vi } from 'vitest';
import { createPrivacySafeWatchControls } from './trayPrivacy';

describe('tray privacy controls', () => {
  it('summarizes legacy watched paths by count without exposing absolute paths or opening folders', () => {
    const openFolder = vi.fn();
    const controls = createPrivacySafeWatchControls(
      ['C:\\Users\\dev\\client-a', '/home/dev/private-project'],
      { openFolder },
    );

    expect(controls.watchSummary.label).toBe('Dossiers configurés (2)');
    expect(controls.watchSummary.items).toEqual([
      { label: '2 dossiers configurés localement — surveillance inactive', enabled: false },
    ]);
    expect(JSON.stringify(controls)).not.toMatch(/C:\\|Users|home|client-a|private-project/);

    controls.requestAddProject();

    expect(openFolder).not.toHaveBeenCalled();
  });

  it('offers the explicit local Git authorization action without exposing local paths', () => {
    const controls = createPrivacySafeWatchControls([], { openFolder: vi.fn() });

    expect(controls.addProjectLabel).toBe('Autoriser un projet Git local');
    expect(controls.canAddProjectLocally).toBe(true);
    expect(controls.watchSummary.items).toEqual([{ label: 'Aucun dossier surveillé', enabled: false }]);
    expect(JSON.stringify(controls)).not.toMatch(/C:\\|Users|home/);
  });

  it('offers local start and pause controls for authorized projects without exposing absolute paths', () => {
    const startProject = vi.fn();
    const pauseProject = vi.fn();
    const controls = createPrivacySafeWatchControls(
      [],
      { openFolder: vi.fn(), startProject, pauseProject },
      [
        {
          projectId: 'project_1',
          displayName: 'Client Portal',
          localAlias: 'client-portal',
          localRootPath: 'C:\\Users\\dev\\private-client',
          collectionEnabled: false,
        },
        {
          projectId: 'project_2',
          displayName: 'School Lab',
          localAlias: 'school-lab',
          localRootPath: '/home/dev/school-lab',
          collectionEnabled: true,
        },
      ],
    );

    expect(controls.projectControls.label).toBe('Projets autorisés (2)');
    expect(controls.projectControls.items.map((item) => item.label)).toEqual([
      'Client Portal — prêt, suivi en pause',
      'Démarrer le suivi local de Client Portal',
      'School Lab — suivi local actif',
      'Mettre en pause le suivi local de School Lab',
    ]);

    controls.projectControls.items[1].click?.();
    controls.projectControls.items[3].click?.();

    expect(startProject).toHaveBeenCalledWith('project_1');
    expect(pauseProject).toHaveBeenCalledWith('project_2');
    expect(JSON.stringify(controls)).not.toMatch(/C:\\|Users|home|private-client|school-lab/);
  });
});
