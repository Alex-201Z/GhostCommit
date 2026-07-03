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
});
