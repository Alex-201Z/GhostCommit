import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

const fetchMock = vi.fn();
const authenticatedSession = {
  accessToken: 'short-lived-access-token',
  expiresAt: '2026-07-01T12:00:00.000Z',
  user: { id: 'user-1', email: 'dev@example.com', name: 'Dev', username: 'dev', avatarUrl: null },
};
const incompleteOnboarding = {
  currentStep: 'PRIVACY_CONSENT',
  completedAt: null,
  user: { privacyConsents: [], personalWorkspace: { id: 'workspace-1', name: 'Dev workspace' } },
};
const completedOnboarding = {
  currentStep: 'PRIVACY_ACCEPTED',
  completedAt: '2026-07-01T10:00:00.000Z',
  user: {
    privacyConsents: [{ policyVersion: '2026-06-22' }],
    personalWorkspace: { id: 'workspace-1', name: 'Dev workspace' },
  },
};
const emptyToday = {
  date: '2026-07-01',
  agentStatus: 'NOT_INSTALLED',
  session: { state: 'AGENT_NOT_CONNECTED' },
  draft: { status: 'NOT_GENERATED', preview: [] },
  activity: { totalSessions: 0, projectsTouched: 0, commitsDetected: 0, workItemsOrBlockers: 0 },
  recentSessions: [],
  checklist: {
    accountCreated: true,
    agentLinked: false,
    firstProjectTracked: false,
    firstSessionSynced: false,
    firstDraftGenerated: false,
  },
  canGenerateDraft: false,
};
const sampleProjects = [
  {
    id: 'project-1',
    displayName: 'GhostCommit',
    gitProvider: 'LOCAL',
    localAlias: 'ghostcommit-dev',
    branch: 'main',
    trackingStatus: 'ACTIVE',
    ignoredPatterns: ['dist/**', '.env*'],
    includeFilePathsInReports: false,
    excludedFromReports: false,
    lastActivityAt: '2026-07-01T12:00:00.000Z',
  },
];
const sampleInstallations = [
  {
    id: 'agent-1',
    deviceLabel: 'Windows dev laptop',
    osFamily: 'windows',
    agentVersion: '0.1.0',
    status: 'CONNECTED',
    lastSeenAt: '2026-07-01T12:10:00.000Z',
  },
];

function renderAt(path: string) {
  window.history.pushState({}, '', path);
  return render(<App />);
}

describe('Phase 1B dashboard authentication and onboarding flow', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
    sessionStorage.clear();
    cleanup();
  });

  it('shows the public privacy-first proof-of-work landing page', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', {
        name: /preuve de travail privacy-first pour développeurs/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/comprendre/i)).toBeInTheDocument();
    expect(screen.getByText(/prouver/i)).toBeInTheDocument();
    expect(screen.getByText(/partager/i)).toBeInTheDocument();
    expect(screen.getByText(/pas un outil de surveillance/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /commencer/i })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('button', { name: /voir un exemple de rapport/i })).toBeInTheDocument();
  });

  it('starts GitHub OAuth from the login page through the Phase 1A API', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authorizationUrl: 'https://github.com/login/oauth/authorize?state=safe' }),
      });
    renderAt('/login');

    fireEvent.click(await screen.findByRole('button', { name: /continuer avec github/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/v1/auth/github/start', {
        method: 'POST',
        credentials: 'include',
      });
    });
    expect(
      await screen.findByRole('link', { name: /ouvrir l’autorisation github/i }),
    ).toHaveAttribute('href', 'https://github.com/login/oauth/authorize?state=safe');
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it('exchanges the refresh cookie on callback without keeping OAuth tokens in URL or web storage', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => authenticatedSession })
      .mockResolvedValueOnce({ ok: true, json: async () => incompleteOnboarding });
    renderAt('/auth/callback?code=provider-code&state=oauth-state&accessToken=must-not-survive');

    expect(screen.getByText(/connexion sécurisée/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(window.location.pathname).toBe('/onboarding');
    });
    expect(window.location.search).toBe('');
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it('shows a safe callback error without echoing provider parameters', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, json: async () => ({ message: 'raw provider code abc123' }) });
    renderAt('/auth/callback?code=abc123&state=secret-state');

    expect(await screen.findByRole('alert')).toHaveTextContent(/session expirée ou refusée/i);
    expect(screen.getByRole('alert')).not.toHaveTextContent('abc123');
    expect(screen.getByRole('alert')).not.toHaveTextContent('secret-state');
  });

  it('redirects unauthenticated protected routes to login', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, json: async () => ({}) });
    renderAt('/app/projects');

    expect(await screen.findByRole('heading', { name: /connexion à ghostcommit/i })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/login');
  });

  it('redirects an already connected user away from login', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => authenticatedSession })
      .mockResolvedValueOnce({ ok: true, json: async () => incompleteOnboarding });
    renderAt('/login');

    await waitFor(() => {
      expect(window.location.pathname).toBe('/onboarding');
    });
    expect(screen.queryByRole('heading', { name: /connexion à ghostcommit/i })).not.toBeInTheDocument();
  });

  it('guides an authenticated user through the five-step privacy onboarding with persisted progress', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => authenticatedSession })
      .mockResolvedValueOnce({ ok: true, json: async () => incompleteOnboarding });
    const { unmount } = renderAt('/onboarding');

    expect(await screen.findByRole('heading', { name: /bienvenue dans ghostcommit/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /continuer/i }));
    expect(screen.getByRole('heading', { name: /votre espace personnel/i })).toBeInTheDocument();

    unmount();
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => authenticatedSession })
      .mockResolvedValueOnce({ ok: true, json: async () => incompleteOnboarding });
    renderAt('/onboarding');

    expect(await screen.findByRole('heading', { name: /votre espace personnel/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /retour/i }));
    expect(screen.getByRole('heading', { name: /bienvenue dans ghostcommit/i })).toBeInTheDocument();
  });

  it('requires transparency confirmations before recording consent and entering the app', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => authenticatedSession })
      .mockResolvedValueOnce({ ok: true, json: async () => incompleteOnboarding })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ...incompleteOnboarding, currentStep: 'PRIVACY_ACCEPTED' }) });
    renderAt('/onboarding');

    await screen.findByRole('heading', { name: /bienvenue dans ghostcommit/i });
    for (let i = 0; i < 4; i += 1) {
      fireEvent.click(screen.getByRole('button', { name: /continuer/i }));
    }

    expect(screen.getByRole('heading', { name: /consentement et contrôle/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /ghostcommit peut utiliser/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /ghostcommit ne peut jamais utiliser/i })).toBeInTheDocument();
    expect(screen.getByText(/sessions/i)).toBeInTheDocument();
    expect(screen.getByText(/contenu de fichiers/i)).toBeInTheDocument();

    const finish = screen.getByRole('button', { name: /terminer l’onboarding/i });
    expect(finish).toBeDisabled();
    fireEvent.click(screen.getByLabelText(/j’ai lu la notice de collecte/i));
    expect(finish).toBeDisabled();
    fireEvent.click(screen.getByLabelText(/je comprends que je garde le contrôle/i));
    fireEvent.click(finish);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/v1/onboarding/status', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          Authorization: 'Bearer short-lived-access-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          privacyPolicyAccepted: true,
          hasReadCollectionNotice: true,
          understandsDataControl: true,
          policyVersion: '2026-06-22',
          source: 'ONBOARDING',
        }),
      });
      expect(window.location.pathname).toBe('/app');
    });
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringMatching(/activity|agent|sessions/i), expect.anything());
  });

  it('redirects an authenticated user without consent from app routes to onboarding', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => authenticatedSession })
      .mockResolvedValueOnce({ ok: true, json: async () => incompleteOnboarding });
    renderAt('/app');

    await waitFor(() => {
      expect(window.location.pathname).toBe('/onboarding');
    });
  });

  it('renders the app shell with workspace, profile, notifications, keyboard navigation and permanent agent status', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => authenticatedSession })
      .mockResolvedValueOnce({ ok: true, json: async () => completedOnboarding });
    renderAt('/app');

    expect(await screen.findByRole('banner')).toHaveTextContent('Dev workspace');
    expect(screen.getByRole('navigation', { name: /navigation principale/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /aujourd’hui/i })).toHaveAttribute('href', '/app');
    expect(screen.getByRole('link', { name: /projets/i })).toHaveAttribute('href', '/app/projects');
    expect(screen.getByRole('button', { name: /profil dev/i })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Agent non installé — aucune activité collectée');
    expect(screen.getByLabelText(/notifications/i)).toHaveTextContent(/aucune notification/i);
  });

  it.each([
    ['/app/projects', /aucun projet connecté/i, /la connexion de repositories arrive dans une phase ultérieure/i],
    ['/app/activity', /aucune activité collectée/i, /l’agent n’est pas installé/i],
    ['/app/reports', /aucun rapport généré/i, /les rapports resteront privés/i],
    ['/app/settings', /paramètres à venir/i, /confidentialité, pause, suppression et déconnexion/i],
  ])('renders useful empty state for %s without calling future product APIs', async (path, heading, body) => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => authenticatedSession })
      .mockResolvedValueOnce({ ok: true, json: async () => completedOnboarding });
    renderAt(path);

    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument();
    expect(screen.getByText(body)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringMatching(/repos|activity|reports|agent/i), expect.anything());
  });

  it('renders the projects page from the privacy-safe projects API and never displays absolute paths', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => authenticatedSession })
      .mockResolvedValueOnce({ ok: true, json: async () => completedOnboarding })
      .mockResolvedValueOnce({ ok: true, json: async () => sampleProjects });
    renderAt('/app/projects');

    expect(await screen.findByRole('heading', { name: /projets suivis/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ajouter un projet/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/rechercher un projet/i)).toBeInTheDocument();
    expect(screen.getByText('GhostCommit')).toBeInTheDocument();
    expect(screen.getByText(/actif/i)).toBeInTheDocument();
    expect(screen.getByText(/ghostcommit-dev/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ouvrir ghostcommit/i })).toHaveAttribute('href', '/app/projects/project-1');
    expect(document.body.textContent).not.toMatch(/C:\\|Users|\/home|absolute/i);
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/projects', {
      method: 'GET',
      credentials: 'include',
      headers: { Authorization: 'Bearer short-lived-access-token' },
    });
  });

  it('renders a useful projects empty state without activating collection', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => authenticatedSession })
      .mockResolvedValueOnce({ ok: true, json: async () => completedOnboarding })
      .mockResolvedValueOnce({ ok: true, json: async () => [] });
    renderAt('/app/projects');

    expect(await screen.findByRole('heading', { name: /projets suivis/i })).toBeInTheDocument();
    expect(screen.getByText(/ghostcommit ne suit aucun dossier avant votre autorisation/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /configurer l.agent/i })).toHaveAttribute('href', '/app/settings/agent');
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringMatching(/sessions|activity|reports/i), expect.anything());
  });

  it('renders project detail privacy controls without file contents or absolute paths', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => authenticatedSession })
      .mockResolvedValueOnce({ ok: true, json: async () => completedOnboarding })
      .mockResolvedValueOnce({ ok: true, json: async () => sampleProjects[0] });
    renderAt('/app/projects/project-1');

    expect(await screen.findByRole('heading', { name: /ghostcommit/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /aper/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /sessions/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /livrables/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /confidentialit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mettre le suivi en pause/i })).toBeInTheDocument();
    expect(screen.getByText(/alias local/i)).toBeInTheDocument();
    expect(screen.getByText(/ne pas inclure les chemins de fichiers dans les rapports/i)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/C:\\|Users|\/home|contenu de fichiers/i);
  });

  it('renders the agent settings page from installations without exposing token material', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => authenticatedSession })
      .mockResolvedValueOnce({ ok: true, json: async () => completedOnboarding })
      .mockResolvedValueOnce({ ok: true, json: async () => sampleInstallations });
    renderAt('/app/settings/agent');

    expect(await screen.findByRole('heading', { name: /agent local/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /t.l.charger \/ relancer l.agent/i })).toBeInTheDocument();
    expect(screen.getByText(/windows dev laptop/i)).toBeInTheDocument();
    expect(screen.getByText(/connect/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /r.voquer cet appareil/i })).toBeInTheDocument();
    expect(document.body.textContent?.toLowerCase()).not.toMatch(/token|secret|hostname|machine/);
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/agent/installations', {
      method: 'GET',
      credentials: 'include',
      headers: { Authorization: 'Bearer short-lived-access-token' },
    });
  });

  it('renders the Today dashboard from the privacy-safe API without performance scoring', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => authenticatedSession })
      .mockResolvedValueOnce({ ok: true, json: async () => completedOnboarding })
      .mockResolvedValueOnce({ ok: true, json: async () => emptyToday });
    renderAt('/app');

    expect(await screen.findByRole('heading', { name: /aujourd’hui/i })).toBeInTheDocument();
    expect(screen.getByText(/voici votre activité de développement du jour/i)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Agent non installé — aucune activité collectée');
    expect(screen.getByRole('heading', { name: /session actuelle/i })).toBeInTheDocument();
    expect(screen.getByText(/agent non connecté/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /pourquoi un agent local/i })).toHaveAttribute('href', '/app/settings');
    expect(screen.getByRole('heading', { name: /brouillon du jour/i })).toBeInTheDocument();
    expect(screen.getByText(/pas encore généré/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /générer le brouillon/i })).toBeDisabled();
    expect(screen.getByRole('heading', { name: /activité du jour/i })).toBeInTheDocument();
    expect(screen.getByText(/0 sessions/i)).toBeInTheDocument();
    expect(screen.getByText(/0 projets/i)).toBeInTheDocument();
    expect(screen.getByText(/0 commits/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /dernières sessions/i })).toBeInTheDocument();
    expect(screen.getByText(/aucune session synchronisée/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /checklist de démarrage/i })).toBeInTheDocument();
    expect(document.body.textContent?.toLowerCase()).not.toContain('score');
  });

  it('supports demonstration data for active, paused, empty, finished and agent-missing session states', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => authenticatedSession })
      .mockResolvedValueOnce({ ok: true, json: async () => completedOnboarding })
      .mockResolvedValueOnce({ ok: true, json: async () => emptyToday });
    renderAt('/app');

    fireEvent.click(await screen.findByRole('button', { name: /utiliser des données de démonstration/i }));

    expect(screen.getByText(/session active/i)).toBeInTheDocument();
    expect(screen.getByText(/suivi en pause/i)).toBeInTheDocument();
    expect(screen.getByText(/aucune session aujourd’hui/i)).toBeInTheDocument();
    expect(screen.getByText(/session terminée/i)).toBeInTheDocument();
    expect(screen.getByText(/agent non connecté/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /mettre en pause/i }));
    expect(screen.getByRole('dialog')).toHaveTextContent(/confirmer la pause/i);
    expect(screen.getByRole('button', { name: /reprendre le suivi/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /terminer ma journée/i })).toBeInTheDocument();
  });
});
