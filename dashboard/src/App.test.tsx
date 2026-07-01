import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

const fetchMock = vi.fn();

function renderAt(path: string) {
  window.history.pushState({}, '', path);
  return render(<App />);
}

describe('Phase 1B-A public auth flow', () => {
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
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        accessToken: 'short-lived-access-token',
        expiresAt: '2026-07-01T12:00:00.000Z',
        user: { id: 'user-1', email: 'dev@example.com', name: 'Dev', username: 'dev', avatarUrl: null },
      }),
    });
    renderAt('/auth/callback?code=provider-code&state=oauth-state&accessToken=must-not-survive');

    expect(screen.getByText(/connexion sécurisée/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(window.location.pathname).toBe('/app');
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
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        accessToken: 'short-lived-access-token',
        expiresAt: '2026-07-01T12:00:00.000Z',
        user: { id: 'user-1', email: 'dev@example.com', name: 'Dev', username: 'dev', avatarUrl: null },
      }),
    });
    renderAt('/login');

    await waitFor(() => {
      expect(window.location.pathname).toBe('/app');
    });
    expect(screen.queryByRole('heading', { name: /connexion à ghostcommit/i })).not.toBeInTheDocument();
  });
});
