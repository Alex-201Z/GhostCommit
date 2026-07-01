import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

const queryClient = new QueryClient();
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

type PublicUser = {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
};

type RefreshResponse = {
  accessToken: string;
  expiresAt: string;
  user: PublicUser;
};

type AuthState =
  | { status: 'checking'; accessToken: null; user: null }
  | { status: 'anonymous'; accessToken: null; user: null }
  | { status: 'authenticated'; accessToken: string; user: PublicUser };

type AuthContextValue = AuthState & {
  refreshSession: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth must be used within AuthProvider');
  return auth;
}

async function parseJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

function AuthProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const shouldBootstrap = location.pathname === '/login' || location.pathname.startsWith('/app');
  const [state, setState] = useState<AuthState>(
    shouldBootstrap
      ? { status: 'checking', accessToken: null, user: null }
      : { status: 'anonymous', accessToken: null, user: null },
  );

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        setState({ status: 'anonymous', accessToken: null, user: null });
        return false;
      }
      const body = await parseJson<RefreshResponse>(response);
      setState({ status: 'authenticated', accessToken: body.accessToken, user: body.user });
      return true;
    } catch {
      setState({ status: 'anonymous', accessToken: null, user: null });
      return false;
    }
  }, []);

  useEffect(() => {
    if (shouldBootstrap) void refreshSession();
  }, [refreshSession, shouldBootstrap]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      refreshSession,
    }),
    [refreshSession, state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function Surface({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#1e293b,transparent_32rem),#020617] px-6 py-8 text-slate-100">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col">{children}</div>
    </main>
  );
}

function LandingPage() {
  return (
    <Surface>
      <nav className="flex items-center justify-between py-4" aria-label="Navigation publique">
        <Link to="/" className="text-lg font-semibold tracking-tight">
          GhostCommit
        </Link>
        <Link to="/login" className="rounded-full border border-slate-700 px-4 py-2 text-sm hover:border-emerald-400">
          Connexion
        </Link>
      </nav>

      <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300">
            Pas un outil de surveillance
          </p>
          <h1 className="max-w-4xl text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
            Preuve de travail privacy-first pour développeurs
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            GhostCommit transforme des métadonnées de développement autorisées en rapports privés, lisibles et
            partageables seulement après votre validation.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/login"
              className="rounded-full bg-emerald-400 px-6 py-3 text-center font-semibold text-slate-950 shadow-lg shadow-emerald-950/30 hover:bg-emerald-300 focus:outline focus:outline-2 focus:outline-offset-4 focus:outline-emerald-300"
            >
              Commencer
            </Link>
            <button
              type="button"
              className="rounded-full border border-slate-700 px-6 py-3 font-semibold text-slate-100 hover:border-slate-400 focus:outline focus:outline-2 focus:outline-offset-4 focus:outline-slate-300"
              aria-describedby="sample-report"
            >
              Voir un exemple de rapport
            </button>
          </div>
        </div>

        <aside
          id="sample-report"
          className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 shadow-2xl shadow-black/30"
          aria-label="Exemple statique de rapport"
        >
          <p className="text-sm font-medium text-emerald-300">Brouillon privé · Aujourd’hui</p>
          <h2 className="mt-3 text-2xl font-semibold">Rapport de travail</h2>
          <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-300">
            <li>• Finalisé l’authentification GitHub et les sessions sécurisées.</li>
            <li>• Validé la migration PostgreSQL dans la CI.</li>
            <li>• Préparé les prochaines étapes sans collecter d’activité locale.</li>
          </ul>
          <p className="mt-5 rounded-2xl bg-slate-900 p-4 text-sm text-slate-400">
            Les rapports restent des brouillons privés. Vous choisissez ce qui est conservé, supprimé ou exporté.
          </p>
        </aside>
      </section>

      <section className="grid gap-4 pb-10 md:grid-cols-3" aria-label="Bénéfices">
        {[
          ['Comprendre', 'Retrouver le fil de votre journée sans reconstruire chaque détail à la main.'],
          ['Prouver', 'Relier les livrables à des signaux techniques non sensibles et vérifiables.'],
          ['Partager', 'Exporter uniquement un rapport relu, édité et explicitement approuvé.'],
        ].map(([title, text]) => (
          <article key={title} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">{text}</p>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-emerald-900/70 bg-emerald-950/20 p-6">
        <h2 className="text-2xl font-semibold">Confidentialité par défaut</h2>
        <p className="mt-3 max-w-3xl leading-7 text-slate-300">
          GhostCommit ne collecte ni contenu de fichiers, ni frappes clavier, ni captures d’écran, ni navigation web.
          Le suivi reste désactivé tant qu’un projet n’est pas choisi explicitement dans une phase ultérieure.
        </p>
      </section>
    </Surface>
  );
}

function LoginPage() {
  const auth = useAuth();
  const [authorizationUrl, setAuthorizationUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  if (auth.status === 'checking') return <LoadingPage label="Vérification de la session…" />;
  if (auth.status === 'authenticated') return <Navigate to="/app" replace />;

  async function startGithub() {
    setError(null);
    setIsStarting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/github/start`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('OAuth start failed');
      const body = await parseJson<{ authorizationUrl: string }>(response);
      setAuthorizationUrl(body.authorizationUrl);
    } catch {
      setError('Connexion GitHub indisponible. Réessayez dans un instant.');
    } finally {
      setIsStarting(false);
    }
  }

  return (
    <Surface>
      <div className="flex flex-1 items-center justify-center py-16">
        <section className="w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-950/80 p-8 shadow-2xl">
          <Link to="/" className="text-sm text-slate-400 hover:text-slate-200">
            ← Retour
          </Link>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight">Connexion à GhostCommit</h1>
          <p className="mt-4 leading-7 text-slate-300">
            GitHub sert uniquement à confirmer votre identité. GhostCommit ne lit pas le contenu de votre code pendant
            cette connexion.
          </p>
          {error ? (
            <p role="alert" className="mt-5 rounded-2xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-100">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => void startGithub()}
            disabled={isStarting}
            className="mt-6 w-full rounded-full bg-emerald-400 px-5 py-3 font-semibold text-slate-950 hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-70"
          >
            {isStarting ? 'Préparation de GitHub…' : 'Continuer avec GitHub'}
          </button>
          {authorizationUrl ? (
            <a
              className="mt-4 block rounded-full border border-slate-700 px-5 py-3 text-center font-semibold text-slate-100 hover:border-emerald-400"
              href={authorizationUrl}
            >
              Ouvrir l’autorisation GitHub
            </a>
          ) : null}
        </section>
      </div>
    </Surface>
  );
}

function AuthCallbackPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(false);

  useEffect(() => {
    window.history.replaceState({}, '', '/auth/callback');
    let active = true;

    async function finish() {
      const ok = await auth.refreshSession();
      if (!active) return;
      if (ok) navigate('/app', { replace: true });
      else setError(true);
    }

    void finish();
    return () => {
      active = false;
    };
  }, [auth.refreshSession, navigate]);

  return (
    <Surface>
      <div className="flex flex-1 items-center justify-center">
        <section className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-950/80 p-8 text-center">
          <h1 className="text-3xl font-semibold">Connexion sécurisée</h1>
          {error ? (
            <p role="alert" className="mt-5 rounded-2xl border border-red-900 bg-red-950/40 p-4 text-red-100">
              Session expirée ou refusée. Relancez la connexion depuis GhostCommit.
            </p>
          ) : (
            <p className="mt-4 text-slate-300">Finalisation de votre session sans exposer de token dans l’URL…</p>
          )}
          <Link to="/login" className="mt-6 inline-flex rounded-full border border-slate-700 px-5 py-3">
            Retour à la connexion
          </Link>
        </section>
      </div>
    </Surface>
  );
}

function ProtectedRoute() {
  const auth = useAuth();
  if (auth.status === 'checking') return <LoadingPage label="Vérification de l’accès…" />;
  if (auth.status === 'anonymous') return <Navigate to="/login" replace />;
  return (
    <Surface>
      <section className="my-auto rounded-3xl border border-slate-800 bg-slate-950/80 p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300">Phase 1B-C à venir</p>
        <h1 className="mt-4 text-4xl font-semibold">Espace GhostCommit protégé</h1>
        <p className="mt-4 max-w-2xl leading-7 text-slate-300">
          Vous êtes connecté. Le shell applicatif complet reste volontairement hors périmètre de cette sous-phase.
        </p>
      </section>
    </Surface>
  );
}

function LoadingPage({ label }: { label: string }) {
  return (
    <Surface>
      <div className="flex flex-1 items-center justify-center">
        <p className="rounded-full border border-slate-800 px-5 py-3 text-slate-300">{label}</p>
      </div>
    </Surface>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/app/*" element={<ProtectedRoute />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
