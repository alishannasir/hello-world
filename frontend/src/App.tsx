import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { trackPageview } from './lib/analytics';
import { useAuth } from './store/auth';

// Route-level code splitting: initial bundle only ships landing/auth.
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Home = lazy(() => import('./pages/Home'));
const Call = lazy(() => import('./pages/Call'));
const Upgrade = lazy(() => import('./pages/Upgrade'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Friends = lazy(() => import('./pages/Friends'));
const History = lazy(() => import('./pages/History'));
const Settings = lazy(() => import('./pages/Settings'));
const RegionBlocked = lazy(() => import('./pages/RegionBlocked'));
const Admin = lazy(() => import('./pages/Admin'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));

function Skeleton() {
  return (
    <div className="min-h-screen flex flex-col gap-4 p-6 max-w-md mx-auto animate-pulse">
      <div className="h-8 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-4 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-4 w-5/6 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-12 w-full rounded-xl bg-zinc-200 dark:bg-zinc-800 mt-4" />
    </div>
  );
}

function PageviewTracker() {
  const location = useLocation();
  useEffect(() => {
    trackPageview(location.pathname);
  }, [location.pathname]);
  return null;
}

/** Logs the user out 24 hours after login (see SESSION_TTL_MS in the auth store). */
function SessionExpiryGuard() {
  const token = useAuth((s) => s.token);
  const expiresAt = useAuth((s) => s.expiresAt);
  const logout = useAuth((s) => s.logout);
  useEffect(() => {
    if (!token) return;
    // Sessions persisted before expiry tracking existed are treated as expired.
    if (!expiresAt || Date.now() >= expiresAt) {
      logout();
      return;
    }
    const id = setTimeout(logout, expiresAt - Date.now());
    return () => clearTimeout(id);
  }, [token, expiresAt, logout]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <PageviewTracker />
      <SessionExpiryGuard />
      <ErrorBoundary>
        <Suspense fallback={<Skeleton />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/home" element={<Home />} />
            <Route path="/call" element={<Call />} />
            <Route path="/upgrade" element={<Upgrade />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/friends" element={<Friends />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/unavailable" element={<RegionBlocked />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
