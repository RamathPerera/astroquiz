import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Atom, LayoutDashboard, Telescope, Trophy, History, BookOpen, Settings, ShieldCheck, Users, LogOut, Sun, Moon, Languages, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { t, type Language } from '../lib/i18n';
import { getCurrentProfile, type Profile } from '../lib/api';

type AppRole = Profile['role'];

const links: Array<{
  to: string;
  key: Parameters<typeof t>[1];
  icon: typeof LayoutDashboard;
  roles: AppRole[];
}> = [
  { to: '/dashboard', key: 'dashboard', icon: LayoutDashboard, roles: ['student'] },
  { to: '/quizzes', key: 'quizzes', icon: Telescope, roles: ['student'] },
  { to: '/leaderboard', key: 'leaderboard', icon: Trophy, roles: ['student', 'moderator', 'admin'] },
  { to: '/attempts', key: 'attempts', icon: History, roles: ['student'] },
  { to: '/practice', key: 'practice', icon: BookOpen, roles: ['student'] },
  { to: '/settings', key: 'settings', icon: Settings, roles: ['student', 'moderator', 'admin'] },
  { to: '/moderator', key: 'moderator', icon: ShieldCheck, roles: ['moderator', 'admin'] },
  { to: '/admin', key: 'admin', icon: Users, roles: ['admin'] },
] as const;

export default function Layout({
  lang,
  setLang,
  theme,
  setTheme,
}: {
  lang: Language;
  setLang: (v: Language) => void;
  theme: string;
  setTheme: (v: string) => void;
}) {
  const [mobile, setMobile] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    getCurrentProfile().then((p) => {
      if (alive) setProfile(p);
    });
    return () => {
      alive = false;
    };
  }, []);

  async function logout() {
    if (supabase) await supabase.auth.signOut();
    navigate('/login');
  }

  const displayName = profile?.display_name || 'Astronomer';
  const roleLabel = profile?.role ? `${profile.role.charAt(0).toUpperCase() + profile.role.slice(1)} account` : 'Student account';
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'AS';

  return (
    <div className={`app-shell ${theme}`}>
      <aside className={`sidebar ${mobile ? 'show' : ''}`}>
        <div className="brand">
          <div className="brand-icon">
            <Atom size={29} />
          </div>
          <div>
            <strong>AstroQuiz <span>Sri Lanka</span></strong>
            <small>Astronomy Olympiad Platform</small>
          </div>
          <button className="mobile-close" onClick={() => setMobile(false)}>
            <X />
          </button>
        </div>

        <div className="nav-label">LEARN & COMPETE</div>
        <nav>
          {links.filter((link) => profile && link.roles.includes(profile.role)).map(({ to, key, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobile(false)}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{t(lang, key)}</span>
              {key === 'quizzes' && <i className="nav-dot" />}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="orbit-card">
            <div className="orbit">✦</div>
            <strong>Explore the universe</strong>
            <p>Every question brings you closer to the stars.</p>
          </div>
          <button className="nav-link logout" onClick={logout}>
            <LogOut size={18} />
            <span>{t(lang, 'signout')}</span>
          </button>
          <div className="profile-mini">
            <div className="avatar">{initials}</div>
            <div>
              <b>{displayName}</b>
              <small>{roleLabel}</small>
            </div>
            <span className="online-dot" />
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="menu-toggle" onClick={() => setMobile(!mobile)}>
            <Menu />
          </button>
          <div className="breadcrumb">
            <span>AstroQuiz</span>
            <span className="crumb-sep">/</span>
            <b>Learning space</b>
          </div>
          <div className="top-actions">
            <button
              className="icon-button"
              title="Toggle theme"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              className="language-button"
              onClick={() => setLang(lang === 'en' ? 'si' : 'en')}
            >
              <Languages size={17} />
              {lang === 'en' ? 'EN' : 'සිං'}
            </button>
            <div className="top-avatar" title={displayName}>
              {initials}
            </div>
          </div>
        </header>

        <div className="page-wrap">
          <Outlet />
        </div>

        <footer className="footer">
          <span>✦ AstroQuiz Sri Lanka</span>
          <span>Inspire your mind. Explore the universe.</span>
          <span>Free · Open source · Educational</span>
        </footer>
      </main>
    </div>
  );
}

