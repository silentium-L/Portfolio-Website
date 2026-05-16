/* ═══════════════════════════════════════
   Pages: Personal, Terminal
   ═══════════════════════════════════════ */

const { useState: uS, useEffect: uE, useRef: uR, useCallback: uCB, useMemo: uM } = React;

// ─── Personal Page ────────────────────
function PersonalPage({ onBack, onLogout, scrollTo }) {
  const { lang } = useT();
  const title = lang === 'de' ? 'Über Mich' : 'About Me';
  const src = scrollTo ? `about_me.html#${scrollTo}` : 'about_me.html';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <NavBar onBack={onBack} onLogout={onLogout} title={title} />
      <iframe
        src={src}
        title={title}
        style={{ flex: 1, border: 'none', width: '100%' }}
      />
    </div>
  );
}

// ─── Terminal Page ────────────────────
const DENNIS_CONTEXT = `You are an AI assistant on Dennis's portfolio website. Respond in the same language the user writes in.
About Dennis: Software Developer for IBM i (AS/400) legacy systems. Expert in RPG Free (RPG IV). Modernizes legacy RPG code to modern Profound UI web frontends. Passionate about quantitative/algorithmic trading and natural bodybuilding. Based in Germany.
Keep responses concise (2-4 sentences). Use plain text, no markdown.`;

function TerminalPage({ onBack, onLogout }) {
  const { t, lang } = useT();
  const [history, setHistory] = uS([]);
  const [input, setInput] = uS('');
  const [busy, setBusy] = uS(false);
  const endRef = uR(null);
  const inputRef = uR(null);

  uE(() => {
    setHistory([{ type: 'sys', text: t.terminal.welcome }]);
  }, [lang]);

  uE(() => {
    if (endRef.current) endRef.current.scrollTop = endRef.current.scrollHeight;
  }, [history, busy]);

  const add = (type, text) => setHistory(h => [...h, { type, text }]);

  const run = async (cmd) => {
    if (!cmd.trim()) return;
    add('in', cmd);
    setInput('');
    const c = cmd.trim().toLowerCase();

    if (c === '/clear') { setHistory([]); return; }
    if (c === '/help') { add('sys', t.terminal.helpText); return; }
    if (c === '/about') {
      add('out', lang === 'de'
        ? 'Dennis ist Software-Entwickler mit Fokus auf IBM i Legacy-Systeme. Er modernisiert RPG-Anwendungen und transformiert AS/400-Systeme in moderne Web-Lösungen mit Profound UI.'
        : 'Dennis is a software developer focused on IBM i legacy systems. He modernizes RPG applications and transforms AS/400 systems into modern web solutions using Profound UI.'
      ); return;
    }
    if (c === '/skills') {
      add('out', SKILLS.map(s => `${s.name.padEnd(24)} ${'█'.repeat(Math.round(s.level / 10))}${'░'.repeat(10 - Math.round(s.level / 10))} ${s.level}%`).join('\n'));
      return;
    }
    if (c === '/contact') {
      add('out', 'GitHub:   [placeholder]\nLinkedIn: [placeholder]\nE-Mail:   [placeholder]');
      return;
    }

    // AI response
    setBusy(true);
    try {
      const resp = await window.claude.complete({
        messages: [
          { role: 'user', content: DENNIS_CONTEXT + '\n\nUser: ' + cmd }
        ]
      });
      add('out', resp);
    } catch (e) {
      add('err', lang === 'de' ? 'Verbindungsfehler. Versuche es erneut.' : 'Connection error. Try again.');
    }
    setBusy(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') { run(input); }
  };

  const focusTerm = () => inputRef.current?.focus();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <NavBar onBack={onBack} onLogout={onLogout} title="Terminal" />
      <div style={tS.outer} onClick={focusTerm}>
        <div style={tS.termWrap}>
          {/* Title bar */}
          <div style={tS.titleBar}>
            <div style={tS.dots}>
              <span style={{ ...tS.dot, background: '#ff5f57' }}></span>
              <span style={{ ...tS.dot, background: '#ffbd2e' }}></span>
              <span style={{ ...tS.dot, background: '#28c840' }}></span>
            </div>
            <span style={tS.titleText}>dennis@portfolio — terminal</span>
            <div style={{ width: 52 }}></div>
          </div>
          {/* Body */}
          <div ref={endRef} style={tS.body}>
            {history.map((line, i) => (
              <div key={i} style={{ marginBottom: 6, animation: 'slideInLeft 0.25s cubic-bezier(0,0,0.2,1) both', animationDelay: `${Math.min(i * 20, 200)}ms` }}>
                {line.type === 'in' && (
                  <div style={tS.lineIn}>
                    <span style={tS.prompt}>dennis@portfolio</span>
                    <span style={tS.promptSep}>:</span>
                    <span style={tS.promptDir}>~</span>
                    <span style={tS.promptSep}>$ </span>
                    <span>{line.text}</span>
                  </div>
                )}
                {line.type === 'out' && (
                  <pre style={tS.lineOut}>{line.text}</pre>
                )}
                {line.type === 'sys' && (
                  <pre style={tS.lineSys}>{line.text}</pre>
                )}
                {line.type === 'err' && (
                  <pre style={tS.lineErr}>{line.text}</pre>
                )}
              </div>
            ))}
            {busy && (
              <div style={tS.lineSys}>
                <span style={{ animation: 'blink 1s infinite' }}>{t.terminal.thinking}</span>
              </div>
            )}
            {/* Input line */}
            <div style={tS.inputLine}>
              <span style={tS.prompt}>dennis@portfolio</span>
              <span style={tS.promptSep}>:</span>
              <span style={tS.promptDir}>~</span>
              <span style={tS.promptSep}>$ </span>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                style={tS.input}
                autoFocus
                spellCheck={false}
                disabled={busy}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const tS = {
  outer: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, cursor: 'text' },
  termWrap: { width: '100%', maxWidth: 720, maxHeight: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--glow-sm)', animation: 'fadeUp 0.5s cubic-bezier(0,0,0.2,1) both' },
  titleBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: '#1a1e2e', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  dots: { display: 'flex', gap: 7 },
  dot: { width: 11, height: 11, borderRadius: '50%' },
  titleText: { fontSize: 12, color: '#6b7794', fontFamily: 'var(--font-mono)' },
  body: { flex: 1, padding: '16px 20px', overflowY: 'auto', background: '#0d111e', fontFamily: 'var(--font-mono)', fontSize: 13.5, lineHeight: 1.7 },
  lineIn: { color: 'var(--text-1)' },
  lineOut: { color: '#8ec8ff', whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 'inherit', margin: 0 },
  lineSys: { color: '#6b7794', whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 'inherit', margin: 0 },
  lineErr: { color: '#e05050', whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 'inherit', margin: 0 },
  prompt: { color: '#5cbf7a', fontWeight: 600 },
  promptSep: { color: '#6b7794' },
  promptDir: { color: '#5b9bd5', fontWeight: 600 },
  inputLine: { display: 'flex', alignItems: 'center', marginTop: 4 },
  input: { background: 'none', border: 'none', outline: 'none', color: 'var(--text-1)', fontFamily: 'var(--font-mono)', fontSize: 'inherit', flex: 1, marginLeft: 2, caretColor: 'var(--accent)' },
};

// ─── Exports ──────────────────────────
Object.assign(window, { PersonalPage, TerminalPage });


/* ═══════════════════════════════════════
   App: Routing, State, Tweaks
   ═══════════════════════════════════════ */

const { useState, useEffect, useCallback } = React;

// ─── Get Gapped Page ──────────────────
function GappedPage({ onBack, onLogout }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <NavBar onBack={onBack} onLogout={onLogout} title="Get Gapped" />
      <iframe
        src="gapped.html"
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

  // Persist language
  useEffect(() => { localStorage.setItem('dl_lang', lang); }, [lang]);

  // Apply tweaks to CSS vars
  useEffect(() => {
    const r = document.documentElement.style;
    const c = TWEAK_DEFAULTS.accentColor;
    r.setProperty('--accent', c);
    // Derive brighter/dimmer shades via opacity
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

  // Project titles for placeholder pages
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

  // Apply accent color tweak
  useEffect(() => {
    const r = document.documentElement.style;
    r.setProperty('--accent', tweaks.accentColor);
    r.setProperty('--accent-bright', tweaks.accentColor + 'cc');
    r.setProperty('--accent-subtle', tweaks.accentColor + '14');

    // Glow intensity
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

    // Gold accents
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
