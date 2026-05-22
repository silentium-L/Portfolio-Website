/* ═══════════════════════════════════════
   App: Routing, State, Tweaks, Mount
   ═══════════════════════════════════════ */

const { useState, useEffect, useCallback } = React;

const API_BASE = window.APP_CONFIG?.apiBase ?? 'http://localhost:3001';

// ─── Auth-Hilfsfunktionen ─────────────
function getStoredToken() {
  return sessionStorage.getItem('auth_token') ?? null;
}

function getStoredPermissions() {
  try {
    return JSON.parse(sessionStorage.getItem('auth_permissions') ?? '[]');
  } catch {
    return [];
  }
}

function getStoredUser() {
  try {
    return JSON.parse(sessionStorage.getItem('auth_user') ?? 'null');
  } catch {
    return null;
  }
}

function clearAuthStorage() {
  sessionStorage.removeItem('auth_token');
  sessionStorage.removeItem('auth_user');
  sessionStorage.removeItem('auth_permissions');
}

// ─── Protected Module Loader ──────────
// Lädt die geschützten JSX-Dateien vom Server (JWT-gesichert) und führt sie aus.
// Babel.transform() übersetzt JSX → JS; eval() setzt die window.*-Globals.
async function loadProtectedModules(token) {
  const storedPerms = getStoredPermissions();
  const keys = ['dashboard', 'about-me', 'ai-chat'];
  if (storedPerms.includes('manage:users')) keys.push('admin-page');
  for (const key of keys) {
    const res = await fetch(`${API_BASE}/api/src/${key}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Modul '${key}' nicht geladen (${res.status})`);
    const jsx = await res.text();
    const { code } = Babel.transform(jsx, { presets: ['react'] });
    // eslint-disable-next-line no-eval
    eval(code);
  }
}

// ─── Get Gapped Page ──────────────────
function GappedPage({ onBack, onLogout }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <NavBar onBack={onBack} onLogout={onLogout} title="Get Gapped" />
      <iframe
        src="get-gapped/gapped.html"
        title="Get Gapped"
        style={{ flex: 1, border: 'none', width: '100%' }}
        allow="fullscreen"
      />
    </div>
  );
}

// ─── Gym Tracker Page ─────────────────
function GymTrackerPage({ onBack, onLogout }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <NavBar onBack={onBack} onLogout={onLogout} title="Gym Tracker" />
      <iframe
        src="gym-tracker/gym-tracker.html"
        title="Gym Tracker"
        style={{ flex: 1, border: 'none', width: '100%' }}
        allow="fullscreen"
      />
    </div>
  );
}

// ─── Modul-Fehler-Bildschirm ──────────
function ModuleErrorScreen({ error, onRetry, onLogout }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', flexDirection: 'column', gap: 16, padding: 24, textAlign: 'center',
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        background: 'rgba(224,80,80,0.1)', border: '1px solid rgba(224,80,80,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e05050" strokeWidth="1.6">
          <circle cx="12" cy="12" r="9"/><path d="M12 7v5"/><circle cx="12" cy="16" r="0.5" fill="#e05050"/>
        </svg>
      </div>
      <p style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-1)', margin: 0 }}>Module konnten nicht geladen werden</p>
      <p style={{ fontSize: 13, color: 'var(--text-3)', maxWidth: 360, margin: 0 }}>{error}</p>
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button onClick={onRetry} style={{
          padding: '10px 20px', background: 'var(--accent)', border: 'none',
          borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: 14, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'var(--font)',
        }}>Erneut versuchen</button>
        <button onClick={onLogout} style={{
          padding: '10px 20px', background: 'none',
          border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
          color: 'var(--text-2)', fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font)',
        }}>Abmelden</button>
      </div>
    </div>
  );
}

// ─── Lade-Bildschirm ──────────────────
function LoadingScreen() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', flexDirection: 'column', gap: 16,
    }}>
      <div style={{
        width: 40, height: 40, border: '3px solid rgba(77,166,255,0.2)',
        borderTopColor: 'var(--accent)', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
    </div>
  );
}

function App() {
  const [loggedIn, setLoggedIn] = useState(() => !!getStoredToken());
  const [permissions, setPermissions] = useState(() => getStoredPermissions());
  const [user, setUser] = useState(() => getStoredUser());
  // Wenn bereits eingeloggt: Module müssen erst geladen werden (false).
  // Wenn nicht eingeloggt: Login-Seite wird sofort angezeigt (true).
  const [modulesReady, setModulesReady] = useState(() => !getStoredToken());
  const [modulesError, setModulesError] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [lang, setLang] = useState(localStorage.getItem('dl_lang') || 'de');
  const [pageKey, setPageKey] = useState(0);

  useEffect(() => { localStorage.setItem('dl_lang', lang); }, [lang]);

  useEffect(() => {
    const r = document.documentElement.style;
    const c = TWEAK_DEFAULTS.accentColor;
    r.setProperty('--accent', c);
    r.setProperty('--accent-subtle', c + '14');
    r.setProperty('--border', c + '1a');
    r.setProperty('--border-hover', c + '48');
  }, []);

  // Lädt die geschützten Module wenn eingeloggt (Login oder Page-Refresh).
  useEffect(() => {
    if (!loggedIn) {
      setModulesReady(true);
      return;
    }
    const token = getStoredToken();
    if (!token) {
      clearAuthStorage();
      setLoggedIn(false);
      setModulesReady(true);
      return;
    }
    setModulesReady(false);
    setModulesError(null);
    loadProtectedModules(token)
      .then(() => {
        setPermissions(getStoredPermissions());
        // Vorname frisch aus DB laden damit die Begrüßung immer den aktuellen Stammdaten entspricht
        return fetch(`${API_BASE}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }).then(r => r.json()).then(json => {
          if (json.success && json.data) {
            const { id, username, vorname } = json.data;
            const freshUser = { id, username, vorname: vorname ?? null };
            sessionStorage.setItem('auth_user', JSON.stringify(freshUser));
            setUser(freshUser);
          }
        }).catch(() => {
          // Vorname-Fetch schlägt fehl → vorhandenen Wert aus sessionStorage behalten
        });
      })
      .then(() => setModulesReady(true))
      .catch((err) => {
        console.error('[loadProtectedModules]', err);
        const msg = err?.message ?? 'Unbekannter Fehler';
        // Bei echtem Auth-Fehler (401/403) ausloggen, sonst Fehlerscreen zeigen
        if (msg.includes('401') || msg.includes('403')) {
          clearAuthStorage();
          setLoggedIn(false);
          setPermissions([]);
        }
        setModulesError(msg);
        setModulesReady(true);
      });
  }, [loggedIn]);

  const retryModules = useCallback(() => {
    const token = getStoredToken();
    if (!token) return;
    setModulesReady(false);
    setModulesError(null);
    loadProtectedModules(token)
      .then(() => {
        setPermissions(getStoredPermissions());
        return fetch(`${API_BASE}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }).then(r => r.json()).then(json => {
          if (json.success && json.data) {
            const { id, username, vorname } = json.data;
            const freshUser = { id, username, vorname: vorname ?? null };
            sessionStorage.setItem('auth_user', JSON.stringify(freshUser));
            setUser(freshUser);
          }
        }).catch(() => {});
      })
      .then(() => setModulesReady(true))
      .catch((err) => {
        console.error('[loadProtectedModules retry]', err);
        setModulesError(err?.message ?? 'Unbekannter Fehler');
        setModulesReady(true);
      });
  }, []);

  // login.jsx speichert Token + Permissions bereits vor dem Aufruf dieser Funktion
  const login = useCallback(() => {
    setModulesError(null);
    setModulesReady(false);
    setLoggedIn(true);
    setUser(getStoredUser());
    setPage('dashboard');
    setPageKey(k => k + 1);
  }, []);

  const logout = useCallback(() => {
    clearAuthStorage();
    setLoggedIn(false);
    setPermissions([]);
    setUser(null);
    setPage('dashboard');
    setPageKey(k => k + 1);
  }, []);

  const navigate = useCallback((p) => {
    setPage(p);
    setPageKey(k => k + 1);
    window.scrollTo(0, 0);
  }, []);

  const goBack = useCallback(() => navigate('dashboard'), [navigate]);

  const hasPermission = useCallback((key) => permissions.includes(key), [permissions]);


  const renderPage = () => {
    // Datenschutzerklärung vor Login erreichbar, Impressum nur eingeloggt
    if (page === 'datenschutz' && !loggedIn) {
      return <LegalPage onBack={() => navigate('login')} onLogout={null} initialTab={page} showImprint={false} />;
    }
    if (!loggedIn) return <LoginPage onLogin={login} onNavigate={navigate} />;
    if (!modulesReady) return <LoadingScreen />;
    if (modulesError) return <ModuleErrorScreen error={modulesError} onRetry={retryModules} onLogout={logout} />;

    switch (page) {
      case 'personal':
        if (!hasPermission('view:personal')) return <DashboardPage onNavigate={navigate} onLogout={logout} permissions={permissions} user={user} />;
        return <PersonalPage onBack={goBack} onLogout={logout} />;
      case 'terminal':
        if (!hasPermission('view:terminal')) return <DashboardPage onNavigate={navigate} onLogout={logout} permissions={permissions} user={user} />;
        return <TerminalPage onBack={goBack} onLogout={logout} />;
      case 'impressum':
      case 'datenschutz':
        return <LegalPage onBack={goBack} onLogout={logout} initialTab={page} />;
      case 'gapped':
        if (!hasPermission('view:gapped')) return <DashboardPage onNavigate={navigate} onLogout={logout} permissions={permissions} user={user} />;
        return <GappedPage onBack={goBack} onLogout={logout} />;
      case 'gymtracker':
        if (!hasPermission('view:gymtracker')) return <DashboardPage onNavigate={navigate} onLogout={logout} permissions={permissions} user={user} />;
        return <GymTrackerPage onBack={goBack} onLogout={logout} />;
      case 'admin':
        if (!hasPermission('manage:users')) return <DashboardPage onNavigate={navigate} onLogout={logout} permissions={permissions} user={user} />;
        return <AdminPage onBack={goBack} onLogout={logout} user={user} />;
      case 'settings':
        return <SettingsPage onBack={goBack} onLogout={logout} user={user} />;
      default:
        return <DashboardPage onNavigate={navigate} onLogout={logout} permissions={permissions} user={user} />;
    }
  };

  return (
    <LangCtx.Provider value={{ lang, setLang }}>
      <div key={pageKey} className="page-wrap">
        {renderPage()}
      </div>
    </LangCtx.Provider>
  );
}

// ─── Tweaks Panel ─────────────────────
function AppWithTweaks() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  useEffect(() => {
    const r = document.documentElement.style;
    r.setProperty('--accent', tweaks.accentColor);
    r.setProperty('--accent-bright', tweaks.accentColor + 'cc');
    r.setProperty('--accent-subtle', tweaks.accentColor + '14');

    const g = tweaks.glowIntensity;
    const gVals = {
      low:    { xs: '0 0 6px', sm: '0 0 10px', md: '0 0 18px' },
      medium: { xs: '0 0 8px', sm: '0 0 16px', md: '0 0 28px' },
      high:   { xs: '0 0 12px', sm: '0 0 24px', md: '0 0 40px' },
    };
    const gv = gVals[g] || gVals.medium;
    const ac = tweaks.accentColor;
    r.setProperty('--glow-xs', `${gv.xs} ${ac}18`);
    r.setProperty('--glow-sm', `${gv.sm} ${ac}28`);
    r.setProperty('--glow-md', `${gv.md} ${ac}38`);

    if (!tweaks.goldAccents) {
      r.setProperty('--gold', 'var(--accent)');
      r.setProperty('--gold-bright', 'var(--accent-bright)');
    } else {
      r.setProperty('--gold', '#c8a04a');
      r.setProperty('--gold-bright', '#ddb855');
    }
  }, [tweaks]);

  return (
    <>
      <App />
      <TweaksPanel>
        <TweakSection title="Visuell / Visual">
          <TweakColor
            label="Accent"
            value={tweaks.accentColor}
            onChange={v => setTweak('accentColor', v)}
            options={['#4da6ff', '#00c8e0', '#8b5cf6', '#22c55e', '#f59e0b']}
          />
          <TweakToggle
            label="Gold Accents"
            value={tweaks.goldAccents}
            onChange={v => setTweak('goldAccents', v)}
          />
          <TweakRadio
            label="Glow"
            value={tweaks.glowIntensity}
            onChange={v => setTweak('glowIntensity', v)}
            options={['low', 'medium', 'high']}
          />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

// ─── Mount ────────────────────────────
ReactDOM.createRoot(document.getElementById('root')).render(<AppWithTweaks />);
