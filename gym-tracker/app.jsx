/* app.jsx – Main App shell with navigation and routing */

const GYM_API = window.__GYM_API_BASE ?? 'http://localhost:3001';

function App() {
  const [screen, setScreen] = React.useState('login');
  const [user, setUser] = React.useState(null);
  const [authLoading, setAuthLoading] = React.useState(true);

  const [theme, setTheme] = React.useState(() => localStorage.getItem('gym_theme') || 'dark');
  const [unitSystem, setUnitSystem] = React.useState(() => localStorage.getItem('gym_unit_system') || 'metric');

  React.useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    localStorage.setItem('gym_theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme(t => (t === 'dark' ? 'light' : 'dark'));
  }

  React.useEffect(() => {
    localStorage.setItem('gym_unit_system', unitSystem);
  }, [unitSystem]);

  function toggleUnitSystem() {
    setUnitSystem(u => (u === 'metric' ? 'imperial' : 'metric'));
  }

  // Tweaks
  const DEFAULTS = window.__TWEAK_DEFAULTS || {};
  const [tweaks, setTweak] = useTweaks(DEFAULTS);

  // Token aus localStorage prüfen — beim Start
  React.useEffect(() => {
    const token = sessionStorage.getItem('gym_token');
    if (!token) { setAuthLoading(false); return; }

    fetch(`${GYM_API}/api/gym/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          setUser(json.data);
          setScreen('dashboard');
        } else {
          sessionStorage.removeItem('gym_token');
        }
      })
      .catch(() => sessionStorage.removeItem('gym_token'))
      .finally(() => setAuthLoading(false));
  }, []);

  function handleLogin(userData) {
    setUser(userData);
    setScreen('dashboard');
  }

  function handleLogout() {
    sessionStorage.removeItem('gym_token');
    setUser(null);
    setScreen('login');
  }

  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'var(--bg-base)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: 'var(--text-secondary)', fontSize: 14 }}>
          <Icon name="zap" size={32} color="var(--accent-light)" />
          <span>Laden...</span>
        </div>
      </div>
    );
  }

  if (screen === 'login' || !user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const navItems = [
    { id: 'dashboard', icon: 'home', label: 'Home' },
    { id: 'workout', icon: 'dumbbell', label: 'Workout' },
    { id: 'stats', icon: 'chart', label: 'Statistiken' },
    { id: 'plateau', icon: 'radar', label: 'Plateau' },
    { id: 'gains', icon: 'sparkles', label: 'Gains' },
    { id: 'history', icon: 'clock', label: 'Historie' },
    { id: 'profile', icon: 'user', label: 'Profil' },
  ];

  const mobileNav = [
    { id: 'dashboard', icon: 'home', label: 'Home' },
    { id: 'workout', icon: 'dumbbell', label: 'Workout' },
    { id: 'stats', icon: 'chart', label: 'Stats' },
    { id: 'gains', icon: 'sparkles', label: 'Gains' },
    { id: 'profile', icon: 'user', label: 'Profil' },
  ];

  const appS = {
    layout: {
      display: 'flex', height: '100%', width: '100%', overflow: 'hidden',
    },
    sidebar: {
      width: 'var(--sidebar-w)', height: '100%', background: 'var(--bg-primary)',
      borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
      padding: '20px 12px', gap: 4, flexShrink: 0, overflow: 'auto',
    },
    sidebarLogo: {
      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', marginBottom: 20,
    },
    sidebarItem: (active) => ({
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
      borderRadius: 'var(--radius-md)', cursor: 'pointer', width: '100%', textAlign: 'left',
      fontSize: 14, fontWeight: active ? 600 : 400, fontFamily: 'var(--font-display)',
      background: active ? 'var(--accent-subtle)' : 'transparent',
      color: active ? 'var(--accent-light)' : 'var(--text-secondary)',
      transition: 'var(--transition-fast)', border: 'none',
    }),
    main: {
      flex: 1, height: '100%', overflow: 'auto', padding: '28px 32px',
    },
    mainInner: {
      maxWidth: 680, margin: '0 auto', paddingBottom: 100,
    },
    bottomNav: {
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: 'var(--bottomnav-h)', background: 'var(--bg-primary)',
      borderTop: '1px solid var(--border)',
      display: 'none', alignItems: 'center', justifyContent: 'space-around',
      padding: '0 8px', zIndex: 100,
      backdropFilter: 'blur(12px)',
    },
    bottomItem: (active) => ({
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
      padding: '6px 12px', cursor: 'pointer', border: 'none', background: 'none',
      color: active ? 'var(--accent-light)' : 'var(--text-tertiary)',
      fontSize: 10, fontWeight: active ? 600 : 400, fontFamily: 'var(--font-display)',
      transition: 'var(--transition-fast)', position: 'relative',
    }),
  };

  function renderScreen() {
    switch(screen) {
      case 'dashboard': return <DashboardScreen onNavigate={setScreen} user={user} />;
      case 'workout': return <WorkoutScreen />;
      case 'history': return <HistoryScreen />;
      case 'stats': return <StatsScreen />;
      case 'plateau': return <PlateauScreen />;
      case 'gains': return <GainsScreen />;
      case 'profile': return <ProfileScreen user={user} onLogout={handleLogout} theme={theme} onThemeToggle={toggleTheme} unitSystem={unitSystem} onUnitSystemToggle={toggleUnitSystem} />;
      default: return <DashboardScreen onNavigate={setScreen} />;
    }
  }

  return (
    <div style={appS.layout}>
      {/* Desktop sidebar */}
      <nav className="desktop-sidebar" style={appS.sidebar}>
        <div style={appS.sidebarLogo}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, var(--accent-dark), var(--accent-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px rgba(139,92,246,0.3)' }}>
            <Icon name="zap" size={18} color="#fff" strokeWidth={2.2} />
          </div>
          <span style={{ fontSize: 17, fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}>GymTracker</span>
        </div>

        {navItems.map(item => (
          <button key={item.id} style={appS.sidebarItem(screen === item.id)}
            onClick={() => setScreen(item.id)}
            onMouseEnter={e => { if (screen !== item.id) e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
            onMouseLeave={e => { if (screen !== item.id) e.currentTarget.style.background = 'transparent'; }}>
            <Icon name={item.icon} size={18} />
            <span>{item.label}</span>
            {item.id === 'plateau' && PLATEAU_ALERTS.filter(a => a.severity === 'high').length > 0 && (
              <span style={{ width: 7, height: 7, borderRadius: 99, background: 'var(--danger)', marginLeft: 'auto' }} />
            )}
            {item.id === 'gains' && (
              <span style={{ width: 7, height: 7, borderRadius: 99, background: 'var(--success)', marginLeft: 'auto' }} />
            )}
          </button>
        ))}

        <div style={{ marginTop: 'auto', padding: '12px 0' }}>
          <button style={{ ...appS.sidebarItem(false), color: 'var(--text-tertiary)' }}
            onClick={handleLogout}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}>
            <Icon name="arrowLeft" size={18} />
            <span>Abmelden</span>
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main className="app-main" style={appS.main}>
        <div style={appS.mainInner}>
          {renderScreen()}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="mobile-bottomnav" style={appS.bottomNav}>
        {mobileNav.map(item => (
          <button key={item.id} style={appS.bottomItem(screen === item.id)} onClick={() => setScreen(item.id)}>
            {screen === item.id && <span style={{ position: 'absolute', top: 0, width: 24, height: 3, borderRadius: '0 0 3px 3px', background: 'var(--accent)' }} />}
            <Icon name={item.icon} size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Tweaks Panel */}
      <TweaksPanel>
        <TweakSection label="Akzentfarbe">
          <TweakColor label="Farbe" value={tweaks.accentColor}
            onChange={v => { setTweak('accentColor', v); document.documentElement.style.setProperty('--accent', v); document.documentElement.style.setProperty('--accent-light', v + 'cc'); }}
            options={['#8B5CF6', '#6366F1', '#EC4899', '#14B8A6', '#F59E0B', '#EF4444']} />
        </TweakSection>
        <TweakSection label="Darstellung">
          <TweakRadio label="Dichte" value={tweaks.density}
            onChange={v => setTweak('density', v)}
            options={['Kompakt', 'Normal', 'Locker']} />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

Object.assign(window, { App });
