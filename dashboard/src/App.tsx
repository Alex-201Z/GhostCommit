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

type OnboardingStatusResponse = {
  currentStep: string;
  completedAt: string | null;
  user?: {
    privacyConsents?: Array<{ policyVersion: string }>;
    personalWorkspace?: { id: string; name: string } | null;
  };
};

type TodaySummary = {
  date: string;
  agentStatus: 'NOT_INSTALLED' | 'CONNECTED' | 'PAUSED' | 'OFFLINE';
  session: {
    state:
      | 'AGENT_NOT_CONNECTED'
      | 'TRACKING_PAUSED'
      | 'NO_SESSION_TODAY'
      | 'ACTIVE_SESSION'
      | 'FINISHED_SESSION';
    project?: string;
    startedAt?: string;
    pausedAt?: string;
    durationMinutes?: number;
    filteredFilesCount?: number;
  };
  draft: {
    status: 'NOT_GENERATED' | 'NEEDS_REVIEW' | 'VALIDATED';
    preview: string[];
  };
  activity: {
    totalSessions: number;
    projectsTouched: number;
    commitsDetected: number;
    workItemsOrBlockers: number;
  };
  recentSessions: Array<{
    id: string;
    time: string;
    project: string;
    durationMinutes: number;
    syncState: 'SYNCED' | 'PENDING' | 'FAILED';
  }>;
  checklist: {
    accountCreated: boolean;
    agentLinked: boolean;
    firstProjectTracked: boolean;
    firstSessionSynced: boolean;
    firstDraftGenerated: boolean;
  };
  canGenerateDraft: boolean;
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
  if (auth.status === 'authenticated') return <Navigate to="/onboarding" replace />;

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
      if (ok) navigate('/onboarding', { replace: true });
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

function hasCompletedOnboarding(status: OnboardingStatusResponse) {
  return Boolean(status.completedAt || status.currentStep === 'PRIVACY_ACCEPTED' || status.user?.privacyConsents?.length);
}

function authHeaders(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

async function fetchOnboardingStatus(accessToken: string) {
  const response = await fetch(`${API_BASE_URL}/onboarding/status`, {
    method: 'GET',
    credentials: 'include',
    headers: authHeaders(accessToken),
  });
  if (!response.ok) throw new Error('Unable to load onboarding status');
  return parseJson<OnboardingStatusResponse>(response);
}

const ONBOARDING_STEP_KEY = 'ghostcommit_onboarding_step';
const ONBOARDING_COMPLETE_KEY = 'ghostcommit_onboarding_completed';
const POLICY_VERSION = '2026-06-22';

const onboardingSteps = [
  {
    title: 'Bienvenue dans GhostCommit',
    body: "GhostCommit vous aide à transformer votre travail de développement en preuves lisibles, sans devenir un outil de surveillance.",
  },
  {
    title: 'Votre espace personnel',
    body: 'Un workspace personnel est créé automatiquement pour garder la V1 centrée sur votre usage et vos rapports privés.',
  },
  {
    title: 'Comment fonctionne GhostCommit',
    body: "Plus tard, l’agent local ne suivra que les projets que vous choisissez explicitement. Pour l’instant, aucune collecte n’est activée.",
  },
  {
    title: 'Données jamais collectées',
    body: 'GhostCommit ne collecte jamais contenu de fichiers, frappes clavier, captures, navigation, mots de passe ou fichiers hors dossiers autorisés.',
  },
  {
    title: 'Consentement et contrôle',
    body: 'Validez uniquement si vous comprenez les données utilisables et les limites permanentes du produit.',
  },
] as const;

function OnboardingRoute() {
  const auth = useAuth();
  if (auth.status === 'checking') return <LoadingPage label="Préparation de l’onboarding…" />;
  if (auth.status === 'anonymous') return <Navigate to="/login" replace />;
  return <OnboardingPage accessToken={auth.accessToken} />;
}

function OnboardingPage({ accessToken }: { accessToken: string }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [step, setStep] = useState(() => Number(localStorage.getItem(ONBOARDING_STEP_KEY) || '0'));
  const [hasReadNotice, setHasReadNotice] = useState(false);
  const [understandsControl, setUnderstandsControl] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const body = await fetchOnboardingStatus(accessToken);
        if (!active) return;
        if (hasCompletedOnboarding(body)) {
          localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
          navigate('/app', { replace: true });
          return;
        }
        setStatus('ready');
      } catch {
        if (active) setStatus('error');
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [accessToken, navigate]);

  function persistStep(nextStep: number) {
    setStep(nextStep);
    localStorage.setItem(ONBOARDING_STEP_KEY, String(nextStep));
  }

  async function complete() {
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/onboarding/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          ...authHeaders(accessToken),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          privacyPolicyAccepted: true,
          hasReadCollectionNotice: true,
          understandsDataControl: true,
          policyVersion: POLICY_VERSION,
          source: 'ONBOARDING',
        }),
      });
      if (!response.ok) throw new Error('Unable to update onboarding');
      localStorage.removeItem(ONBOARDING_STEP_KEY);
      localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
      navigate('/app', { replace: true });
    } catch {
      setStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (status === 'loading') return <LoadingPage label="Chargement de l’onboarding…" />;
  if (status === 'error') {
    return (
      <Surface>
        <div className="flex flex-1 items-center justify-center">
          <p role="alert" className="rounded-2xl border border-red-900 bg-red-950/40 p-5 text-red-100">
            Impossible de reprendre l’onboarding. Réessayez depuis la connexion.
          </p>
        </div>
      </Surface>
    );
  }

  const current = onboardingSteps[Math.min(Math.max(step, 0), onboardingSteps.length - 1)];
  const isLast = step >= onboardingSteps.length - 1;

  return (
    <Surface>
      <section className="mx-auto my-auto w-full max-w-5xl rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-2xl sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300">
          Étape {Math.min(step + 1, onboardingSteps.length)} sur {onboardingSteps.length}
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">{current.title}</h1>
        <p className="mt-4 max-w-3xl leading-7 text-slate-300">{current.body}</p>

        {isLast ? (
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <article className="rounded-2xl border border-emerald-900/70 bg-emerald-950/20 p-5">
              <h2 className="text-2xl font-semibold">GhostCommit peut utiliser</h2>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
                <li>Sessions de travail autorisées.</li>
                <li>Projets Git explicitement autorisés.</li>
                <li>Chemins relatifs filtrés.</li>
                <li>Statistiques Git agrégées.</li>
              </ul>
            </article>
            <article className="rounded-2xl border border-red-900/70 bg-red-950/20 p-5">
              <h2 className="text-2xl font-semibold">GhostCommit ne peut jamais utiliser</h2>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
                <li>Contenu de fichiers.</li>
                <li>Frappes clavier, captures ou navigateur.</li>
                <li>Mots de passe, secrets ou fichiers hors dossiers autorisés.</li>
              </ul>
            </article>
            <div className="space-y-4 md:col-span-2">
              <label className="flex gap-3 rounded-2xl border border-slate-800 p-4">
                <input
                  type="checkbox"
                  checked={hasReadNotice}
                  onChange={(event) => setHasReadNotice(event.currentTarget.checked)}
                />
                <span>J’ai lu la notice de collecte.</span>
              </label>
              <label className="flex gap-3 rounded-2xl border border-slate-800 p-4">
                <input
                  type="checkbox"
                  checked={understandsControl}
                  onChange={(event) => setUnderstandsControl(event.currentTarget.checked)}
                />
                <span>Je comprends que je garde le contrôle des données et rapports.</span>
              </label>
            </div>
          </div>
        ) : null}

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={() => persistStep(Math.max(step - 1, 0))}
            disabled={step === 0}
            className="rounded-full border border-slate-700 px-5 py-3 font-semibold disabled:opacity-40"
          >
            Retour
          </button>
          {isLast ? (
            <button
              type="button"
              onClick={() => void complete()}
              disabled={!hasReadNotice || !understandsControl || isSubmitting}
              className="rounded-full bg-emerald-400 px-5 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Validation…' : 'Terminer l’onboarding'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => persistStep(Math.min(step + 1, onboardingSteps.length - 1))}
              className="rounded-full bg-emerald-400 px-5 py-3 font-semibold text-slate-950"
            >
              Continuer
            </button>
          )}
        </div>
      </section>
    </Surface>
  );
}

function ProtectedRoute() {
  const auth = useAuth();
  if (auth.status === 'checking') return <LoadingPage label="Vérification de l’accès…" />;
  if (auth.status === 'anonymous') return <Navigate to="/login" replace />;
  if (localStorage.getItem(ONBOARDING_COMPLETE_KEY) !== 'true') {
    return <RequireConsent accessToken={auth.accessToken} />;
  }
  return <AppShell accessToken={auth.accessToken} user={auth.user} />;
}

function RequireConsent({ accessToken }: { accessToken: string }) {
  const [status, setStatus] = useState<'checking' | 'accepted' | 'missing' | 'error'>('checking');
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatusResponse | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const body = await fetchOnboardingStatus(accessToken);
        if (!active) return;
        if (hasCompletedOnboarding(body)) {
          localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
          setOnboardingStatus(body);
          setStatus('accepted');
        } else {
          setStatus('missing');
        }
      } catch {
        if (active) setStatus('error');
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [accessToken]);

  if (status === 'checking') return <LoadingPage label="Vérification du consentement…" />;
  if (status === 'missing') return <Navigate to="/onboarding" replace />;
  if (status === 'error') return <Navigate to="/login" replace />;
  return <AppShell accessToken={accessToken} onboardingStatus={onboardingStatus} />;
}

function AppShell({
  accessToken,
  user,
  onboardingStatus,
}: {
  accessToken: string;
  user?: PublicUser;
  onboardingStatus?: OnboardingStatusResponse | null;
}) {
  const location = useLocation();
  const workspaceName = onboardingStatus?.user?.personalWorkspace?.name || 'Workspace personnel';
  const displayName = user?.name || user?.username || 'Dev';
  const page = shellPageFor(location.pathname);
  const isToday = location.pathname === '/app' || location.pathname.startsWith('/app/today');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="border-b border-slate-800 bg-slate-950/95 p-4 lg:w-72 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-3 lg:block">
            <Link to="/app" className="text-lg font-semibold">
              GhostCommit
            </Link>
            <div role="status" className="rounded-full border border-amber-700/70 px-3 py-1 text-xs text-amber-200">
              Agent non installé — aucune activité collectée
            </div>
          </div>
          <nav className="mt-5 flex gap-2 overflow-x-auto lg:flex-col" aria-label="Navigation principale">
            {[
              ['Aujourd’hui', '/app'],
              ['Projets', '/app/projects'],
              ['Activité', '/app/activity'],
              ['Rapports', '/app/reports'],
              ['Paramètres', '/app/settings'],
            ].map(([label, href]) => (
              <Link
                key={href}
                to={href}
                className="rounded-2xl px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-900 hover:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-emerald-300"
              >
                {label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header role="banner" className="border-b border-slate-800 bg-slate-950/80 px-5 py-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-emerald-300">Espace courant</p>
                <p className="mt-1 text-xl font-semibold">{workspaceName}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div
                  aria-label="Notifications"
                  className="rounded-full border border-slate-800 px-4 py-2 text-sm text-slate-300"
                >
                  Aucune notification
                </div>
                <button
                  type="button"
                  className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold hover:border-slate-400"
                  aria-label={`Profil ${displayName}`}
                >
                  {displayName}
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 p-5">
            {isToday ? (
              <TodayDashboard accessToken={accessToken} />
            ) : (
              <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">{page.eyebrow}</p>
                <h1 className="mt-3 text-3xl font-semibold">{page.heading}</h1>
                <p className="mt-4 max-w-3xl leading-7 text-slate-300">{page.body}</p>
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

const demoToday: TodaySummary = {
  date: '2026-07-01',
  agentStatus: 'PAUSED',
  session: {
    state: 'ACTIVE_SESSION',
    project: 'GhostCommit',
    startedAt: '09:12',
    filteredFilesCount: 12,
  },
  draft: {
    status: 'NEEDS_REVIEW',
    preview: [
      'Préparé le tableau de bord Aujourd’hui avec états vides.',
      'Gardé les actions de suivi en mode local tant que l’agent n’est pas livré.',
    ],
  },
  activity: {
    totalSessions: 3,
    projectsTouched: 1,
    commitsDetected: 2,
    workItemsOrBlockers: 1,
  },
  recentSessions: [
    { id: 'demo-1', time: '09:12', project: 'GhostCommit', durationMinutes: 95, syncState: 'SYNCED' },
    { id: 'demo-2', time: '11:30', project: 'GhostCommit', durationMinutes: 25, syncState: 'PENDING' },
  ],
  checklist: {
    accountCreated: true,
    agentLinked: true,
    firstProjectTracked: true,
    firstSessionSynced: true,
    firstDraftGenerated: false,
  },
  canGenerateDraft: true,
};

function TodayDashboard({ accessToken }: { accessToken: string }) {
  const [summary, setSummary] = useState<TodaySummary | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [showDemoStates, setShowDemoStates] = useState(false);
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadToday() {
      try {
        const response = await fetch(`${API_BASE_URL}/dashboard/today`, {
          method: 'GET',
          credentials: 'include',
          headers: authHeaders(accessToken),
        });
        if (!response.ok) throw new Error('Unable to load today dashboard');
        const body = await parseJson<TodaySummary>(response);
        if (!active) return;
        setSummary(body);
        setState('ready');
      } catch {
        if (active) setState('error');
      }
    }
    void loadToday();
    return () => {
      active = false;
    };
  }, [accessToken]);

  const visibleSummary = summary;

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300">
              {visibleSummary?.date || 'Aujourd’hui'}
            </p>
            <h1 className="mt-3 text-3xl font-semibold">Aujourd’hui</h1>
            <p className="mt-4 max-w-3xl leading-7 text-slate-300">
              Voici votre activité de développement du jour.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setShowDemoStates((current) => !current)}
              className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold hover:border-emerald-400"
            >
              {showDemoStates ? 'Masquer les données de démonstration' : 'Utiliser des données de démonstration'}
            </button>
            <button type="button" className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950">
              {primaryAgentAction(visibleSummary?.agentStatus)}
            </button>
          </div>
        </div>
      </section>

      {state === 'loading' && !visibleSummary ? (
        <p className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-slate-300">
          Chargement du résumé du jour…
        </p>
      ) : null}
      {state === 'error' && !visibleSummary ? (
        <p role="alert" className="rounded-2xl border border-amber-900 bg-amber-950/30 p-5 text-amber-100">
          Impossible de charger le résumé. Aucune collecte locale n’est déclenchée.
        </p>
      ) : null}

      {visibleSummary ? (
        <>
          <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <SessionCard summary={visibleSummary} onPause={() => setPauseDialogOpen(true)} />
            <DraftCard summary={visibleSummary} />
          </div>
          <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <ActivityCard summary={visibleSummary} />
            <RecentSessionsCard summary={visibleSummary} />
          </div>
          <ChecklistCard summary={visibleSummary} />
          {showDemoStates ? <DemoSessionStates onPause={() => setPauseDialogOpen(true)} /> : null}
        </>
      ) : null}

      {pauseDialogOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pause-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5"
        >
          <section className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-950 p-6 shadow-2xl">
            <h2 id="pause-dialog-title" className="text-2xl font-semibold">
              Confirmer la pause
            </h2>
            <p className="mt-3 text-slate-300">
              La pause reste sous votre contrôle. Cette démonstration ne contacte pas l’agent local.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPauseDialogOpen(false)}
                className="rounded-full border border-slate-700 px-4 py-2"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => setPauseDialogOpen(false)}
                className="rounded-full bg-emerald-400 px-4 py-2 font-semibold text-slate-950"
              >
                Confirmer
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function SessionCard({ summary, onPause }: { summary: TodaySummary; onPause: () => void }) {
  const session = sessionCopy(summary);
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
      <h2 className="text-2xl font-semibold">Session actuelle</h2>
      <p className="mt-3 text-lg font-medium text-emerald-200">{session.title}</p>
      <p className="mt-3 leading-7 text-slate-300">{session.body}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        {summary.session.state === 'AGENT_NOT_CONNECTED' ? (
          <>
            <button type="button" className="rounded-full bg-emerald-400 px-4 py-2 font-semibold text-slate-950">
              Installer l’agent
            </button>
            <Link to="/app/settings" className="rounded-full border border-slate-700 px-4 py-2 hover:border-slate-400">
              Pourquoi un agent local ?
            </Link>
          </>
        ) : null}
        {summary.session.state === 'TRACKING_PAUSED' ? (
          <>
            <button type="button" className="rounded-full bg-emerald-400 px-4 py-2 font-semibold text-slate-950">
              Reprendre le suivi
            </button>
            <button type="button" className="rounded-full border border-slate-700 px-4 py-2">
              Voir les données collectées
            </button>
          </>
        ) : null}
        {summary.session.state === 'NO_SESSION_TODAY' ? (
          <button type="button" className="rounded-full border border-slate-700 px-4 py-2">
            Ajouter une note manuelle
          </button>
        ) : null}
        {summary.session.state === 'ACTIVE_SESSION' ? (
          <>
            <button type="button" onClick={onPause} className="rounded-full border border-slate-700 px-4 py-2">
              Mettre en pause
            </button>
            <button type="button" className="rounded-full bg-emerald-400 px-4 py-2 font-semibold text-slate-950">
              Terminer ma journée
            </button>
          </>
        ) : null}
        {summary.session.state === 'FINISHED_SESSION' ? (
          <Link to="/app/activity" className="rounded-full border border-slate-700 px-4 py-2">
            Voir la session
          </Link>
        ) : null}
      </div>
    </section>
  );
}

function DraftCard({ summary }: { summary: TodaySummary }) {
  const status = draftStatusLabel(summary.draft.status);
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
      <h2 className="text-2xl font-semibold">Brouillon du jour</h2>
      <p className="mt-3 text-lg font-medium text-emerald-200">{status}</p>
      {summary.draft.preview.length ? (
        <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
          {summary.draft.preview.slice(0, 3).map((line) => (
            <li key={line}>• {line}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-slate-300">
          Aucun brouillon privé n’est disponible tant qu’une session ou une note n’a pas été créée.
        </p>
      )}
      <button
        type="button"
        disabled={!summary.canGenerateDraft}
        className="mt-5 rounded-full bg-emerald-400 px-4 py-2 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Générer le brouillon
      </button>
    </section>
  );
}

function ActivityCard({ summary }: { summary: TodaySummary }) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
      <h2 className="text-2xl font-semibold">Activité du jour</h2>
      <div className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <Metric label={`${summary.activity.totalSessions} sessions`} />
        <Metric label={`${summary.activity.projectsTouched} projets`} />
        <Metric label={`${summary.activity.commitsDetected} commits`} />
        <Metric label={`${summary.activity.workItemsOrBlockers} livrables ou blocages`} />
      </div>
    </section>
  );
}

function Metric({ label }: { label: string }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 font-semibold">{label}</div>;
}

function RecentSessionsCard({ summary }: { summary: TodaySummary }) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
      <h2 className="text-2xl font-semibold">Dernières sessions</h2>
      {summary.recentSessions.length ? (
        <ul className="mt-4 divide-y divide-slate-800">
          {summary.recentSessions.slice(0, 5).map((session) => (
            <li key={session.id} className="py-3">
              <Link to="/app/activity" className="flex flex-wrap items-center justify-between gap-3 hover:text-emerald-200">
                <span>
                  {session.time} · {session.project} · {session.durationMinutes} min
                </span>
                <span className="text-sm text-slate-400">{syncStateLabel(session.syncState)}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-slate-300">Aucune session synchronisée.</p>
      )}
    </section>
  );
}

function ChecklistCard({ summary }: { summary: TodaySummary }) {
  const items = [
    ['Compte créé', summary.checklist.accountCreated],
    ['Agent lié', summary.checklist.agentLinked],
    ['Premier projet choisi', summary.checklist.firstProjectTracked],
    ['Première session synchronisée', summary.checklist.firstSessionSynced],
    ['Premier brouillon généré', summary.checklist.firstDraftGenerated],
  ] as const;
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
      <h2 className="text-2xl font-semibold">Checklist de démarrage</h2>
      <ul className="mt-4 grid gap-3 md:grid-cols-2">
        {items.map(([label, done]) => (
          <li key={label} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
            {done ? '✓' : '○'} {label}
          </li>
        ))}
      </ul>
    </section>
  );
}

function DemoSessionStates({ onPause }: { onPause: () => void }) {
  const states: TodaySummary[] = [
    { ...demoToday, session: { ...demoToday.session, state: 'ACTIVE_SESSION' } },
    { ...demoToday, session: { state: 'TRACKING_PAUSED', pausedAt: '10:40' } },
    { ...demoToday, session: { state: 'NO_SESSION_TODAY' } },
    { ...demoToday, session: { state: 'FINISHED_SESSION', project: 'GhostCommit', durationMinutes: 95 } },
  ];

  return (
    <section className="rounded-3xl border border-emerald-900/70 bg-emerald-950/10 p-6">
      <h2 className="text-2xl font-semibold">États de session démontrés</h2>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {states.map((item) => (
          <SessionCard key={item.session.state} summary={item} onPause={onPause} />
        ))}
      </div>
    </section>
  );
}

function sessionCopy(summary: TodaySummary) {
  switch (summary.session.state) {
    case 'TRACKING_PAUSED':
      return {
        title: 'Suivi en pause',
        body: `Pause active${summary.session.pausedAt ? ` depuis ${summary.session.pausedAt}` : ''}. Vous pouvez reprendre quand vous voulez.`,
      };
    case 'NO_SESSION_TODAY':
      return {
        title: 'Aucune session aujourd’hui',
        body: 'Rien à signaler pour le moment. Vous pouvez ajouter une note manuelle si votre journée a commencé hors agent.',
      };
    case 'ACTIVE_SESSION':
      return {
        title: 'Session active',
        body: `${summary.session.project || 'Projet choisi'} · début ${summary.session.startedAt || 'inconnu'} · ${
          summary.session.filteredFilesCount || 0
        } fichiers filtrés.`,
      };
    case 'FINISHED_SESSION':
      return {
        title: 'Session terminée',
        body: `${summary.session.project || 'Dernier projet'} · ${summary.session.durationMinutes || 0} min enregistrées.`,
      };
    case 'AGENT_NOT_CONNECTED':
    default:
      return {
        title: 'Agent non connecté',
        body: 'Installez l’agent local plus tard pour collecter uniquement les signaux de projets que vous choisissez.',
      };
  }
}

function draftStatusLabel(status: TodaySummary['draft']['status']) {
  if (status === 'NEEDS_REVIEW') return 'À relire';
  if (status === 'VALIDATED') return 'Validé';
  return 'Pas encore généré';
}

function syncStateLabel(state: TodaySummary['recentSessions'][number]['syncState']) {
  if (state === 'PENDING') return 'Synchronisation en attente';
  if (state === 'FAILED') return 'Synchronisation à vérifier';
  return 'Synchronisé';
}

function primaryAgentAction(status?: TodaySummary['agentStatus']) {
  if (status === 'PAUSED') return 'Reprendre le suivi';
  if (status === 'CONNECTED') return 'Nouvelle note';
  return 'Installer l’agent';
}

function shellPageFor(pathname: string) {
  if (pathname.startsWith('/app/projects')) {
    return {
      eyebrow: 'Projets',
      heading: 'Aucun projet connecté',
      body: 'La connexion de repositories arrive dans une phase ultérieure. Aucun dossier local ou dépôt distant n’est suivi.',
    };
  }
  if (pathname.startsWith('/app/activity')) {
    return {
      eyebrow: 'Activité',
      heading: 'Aucune activité collectée',
      body: 'L’agent n’est pas installé. Aucune session, aucun chemin et aucun signal local ne sont collectés.',
    };
  }
  if (pathname.startsWith('/app/reports')) {
    return {
      eyebrow: 'Rapports',
      heading: 'Aucun rapport généré',
      body: 'Les rapports resteront privés par défaut et ne seront créés qu’après des phases dédiées avec validation humaine.',
    };
  }
  if (pathname.startsWith('/app/settings')) {
    return {
      eyebrow: 'Paramètres',
      heading: 'Paramètres à venir',
      body: 'Confidentialité, pause, suppression et déconnexion seront ajoutées dans leurs phases prévues.',
    };
  }
  return {
    eyebrow: 'Aujourd’hui',
    heading: 'Bienvenue dans votre espace GhostCommit',
    body: 'Le shell est prêt. Agent non installé : aucune activité n’est collectée tant que vous ne l’autorisez pas dans une phase ultérieure.',
  };
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
            <Route path="/onboarding" element={<OnboardingRoute />} />
            <Route path="/app/*" element={<ProtectedRoute />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
