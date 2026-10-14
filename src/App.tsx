
import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import {
  Admin,
  Attempts,
  Dashboard,
  Leaderboard,
  Login,
  Moderator,
  Practice,
  Quizzes,
  SettingsPage,
} from './pages/Pages';
import { supabase } from './lib/supabase';
import type { Language } from './lib/i18n';

type AppRole = 'admin' | 'moderator' | 'student';

function homeForRole(role: AppRole | null) {
  if (role === 'admin') return '/admin';
  if (role === 'moderator') return '/moderator';
  return '/dashboard';
}

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <span className="loading-atom">✦</span>
      <span>Preparing your universe…</span>
    </div>
  );
}

export default function App() {
  const [lang, setLangState] = useState<Language>(
    (localStorage.getItem('aq-lang') as Language) || 'en'
  );
  const [theme, setThemeState] = useState(
    localStorage.getItem('aq-theme') || 'dark'
  );

  const [sessionReady, setSessionReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [role, setRole] = useState<AppRole | null>(null);
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    if (!supabase) {
      setSessionReady(true);
      return;
    }

    let alive = true;

    async function loadProfile(userId: string | undefined) {
      if (!alive) return;

      setRole(null);
      setProfileError('');

      if (!userId) {
        setProfileLoading(false);
        return;
      }

      setProfileLoading(true);

      const { data, error } = await supabase!
        .from('profiles')
        .select('role, is_active')
        .eq('id', userId)
        .maybeSingle();

      if (!alive) return;

      if (error) {
        setProfileError(`Could not load your profile: ${error.message}`);
        setProfileLoading(false);
        return;
      }

      if (!data) {
        setProfileError(
          'Your account has no profile. Ask the administrator to check your profiles row.'
        );
        setProfileLoading(false);
        return;
      }

      if (!data.is_active) {
        setProfileError(
          'Your account is inactive. Contact the administrator.'
        );
        setProfileLoading(false);
        return;
      }

      if (
        data.role !== 'admin' &&
        data.role !== 'moderator' &&
        data.role !== 'student'
      ) {
        setProfileError('Your account has an invalid role.');
        setProfileLoading(false);
        return;
      }

      setRole(data.role as AppRole);
      setProfileLoading(false);
    }

    supabase.auth.getSession().then(({ data, error }) => {
      if (!alive) return;

      if (error) {
        setProfileError(error.message);
        setSessionReady(true);
        return;
      }

      const session = data.session;
      setSignedIn(Boolean(session));

      void loadProfile(session?.user.id);
      setSessionReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;

      setSignedIn(Boolean(session));

      // Load the profile after the auth callback has returned.
      Promise.resolve().then(() => {
        if (alive) void loadProfile(session?.user.id);
      });
    });

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

  function setLang(value: Language) {
    localStorage.setItem('aq-lang', value);
    setLangState(value);
  }

  function setTheme(value: string) {
    localStorage.setItem('aq-theme', value);
    setThemeState(value);
  }

  if (!sessionReady || (signedIn && profileLoading)) {
    return <LoadingScreen />;
  }

  if (supabase && signedIn && profileError) {
    return (
      <div className="loading-screen">
        <div>
          <h2>Account setup problem</h2>
          <p>{profileError}</p>
          <button
            className="primary-button"
            onClick={() => {
              if (supabase) {
                void supabase.auth.signOut();
              }
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  const roleHome = homeForRole(role);

  function RequireRole({
    allowed,
    children,
  }: {
    allowed: AppRole[];
    children: React.ReactNode;
  }) {
    if (!supabase) return <>{children}</>;

    if (!signedIn) return <Navigate to="/login" replace />;

    if (!role) return <LoadingScreen />;

    if (!allowed.includes(role)) {
      return <Navigate to={roleHome} replace />;
    }

    return <>{children}</>;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          signedIn
            ? <Navigate to={roleHome} replace />
            : <Login lang={lang} />
        }
      />

      <Route
        element={
          supabase && !signedIn
            ? <Navigate to="/login" replace />
            : (
              <Layout
                lang={lang}
                setLang={setLang}
                theme={theme}
                setTheme={setTheme}
              />
            )
        }
      >
        <Route
          index
          element={<Navigate to={roleHome} replace />}
        />

        <Route
          path="/dashboard"
          element={
            <RequireRole allowed={['student']}>
              <Dashboard lang={lang} />
            </RequireRole>
          }
        />

        <Route
          path="/quizzes"
          element={
            <RequireRole allowed={['student']}>
              <Quizzes lang={lang} />
            </RequireRole>
          }
        />

        <Route
          path="/leaderboard"
          element={
            <RequireRole allowed={['student', 'moderator', 'admin']}>
              <Leaderboard lang={lang} />
            </RequireRole>
          }
        />

        <Route
          path="/attempts"
          element={
            <RequireRole allowed={['student']}>
              <Attempts lang={lang} />
            </RequireRole>
          }
        />

        <Route
          path="/practice"
          element={
            <RequireRole allowed={['student']}>
              <Practice lang={lang} />
            </RequireRole>
          }
        />

        <Route
          path="/settings"
          element={
            <RequireRole allowed={['student', 'moderator', 'admin']}>
              <SettingsPage
                lang={lang}
                setLang={setLang}
                theme={theme}
                setTheme={setTheme}
              />
            </RequireRole>
          }
        />

        <Route
          path="/moderator/*"
          element={
            <RequireRole allowed={['moderator', 'admin']}>
              <Moderator lang={lang} />
            </RequireRole>
          }
        />

        <Route
          path="/admin/*"
          element={
            <RequireRole allowed={['admin']}>
              <Admin />
            </RequireRole>
          }
        />
      </Route>

      <Route
        path="*"
        element={<Navigate to={roleHome} replace />}
      />
    </Routes>
  );
}
