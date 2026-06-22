import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

const queryClient = new QueryClient();

function HealthPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-6 text-slate-100">
      <section className="max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center shadow-2xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
          Phase 0 health check
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">GhostCommit is running</h1>
        <p className="mt-4 text-base leading-7 text-slate-300">
          The dashboard foundation is ready. No development activity is collected from this page.
        </p>
      </section>
    </main>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="*" element={<HealthPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

