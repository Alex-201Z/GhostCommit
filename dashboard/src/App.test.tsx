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
});
