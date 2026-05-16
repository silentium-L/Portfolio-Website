/* ═══════════════════════════════════════
   App: Routing, State, Tweaks, Mount
   ═══════════════════════════════════════ */

const { useState, useEffect, useCallback } = React;

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

function App() {
  const [loggedIn, setLoggedIn] = useState(sessionStorage.getItem('dl') === '1');
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

  const login = useCallback(() => {
    sessionStorage.setItem('dl', '1');
    setLoggedIn(true);
    setPage('dashboard');
    setPageKey(k => k + 1);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('dl');
    setLoggedIn(false);
    setPage('dashboard');
    setPageKey(k => k + 1);
  }, []);

  const navigate = useCallback((p) => {
    setPage(p);
    setPageKey(k => k + 1);
    window.scrollTo(0, 0);
  }, []);

  const goBack = useCallback(() => navigate('dashboard'), [navigate]);

  const projectTitles = {
    code: 'Code Forge',
    fitness: lang === 'de' ? 'Fitness Log' : 'Fitness Log',
    portfolio: lang === 'de' ? 'Projekte' : 'Projects',
  };

  const renderPage = () => {
    if (!loggedIn) return <LoginPage onLogin={login} />;

    switch (page) {
      case 'personal':
        return <PersonalPage onBack={goBack} onLogout={logout} />;
      case 'terminal':
        return <TerminalPage onBack={goBack} onLogout={logout} />;
      case 'impressum':
      case 'datenschutz':
        return <PersonalPage onBack={goBack} onLogout={logout} scrollTo="legal" />;
      case 'gapped':
        return <GappedPage onBack={goBack} onLogout={logout} />;
      case 'code':
      case 'fitness':
      case 'portfolio':
        return <PlaceholderPage onBack={goBack} onLogout={logout} projectTitle={projectTitles[page]} />;
      default:
        return <DashboardPage onNavigate={navigate} onLogout={logout} />;
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
