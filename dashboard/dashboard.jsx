/* ═══════════════════════════════════════
   Dashboard & Placeholder
   ═══════════════════════════════════════ */

function DashboardPage({ onNavigate, onLogout }) {
  const { t, lang } = useT();
  const { lang: l, setLang } = useLang();

  const projects = [
    { id: 'personal',  icon: PersonIcon, ...t.dash.projects.personal,  active: true },
    { id: 'terminal',  icon: TermIcon,   ...t.dash.projects.terminal,  active: true },
    { id: 'gapped',    icon: GapIcon,    ...t.dash.projects.gapped,    active: true },
    { id: 'code',      icon: CodeIcon,   ...t.dash.projects.code,      active: false },
    { id: 'fitness',   icon: DumbIcon,   ...t.dash.projects.fitness,   active: false },
    { id: 'portfolio', icon: GridIcon,   ...t.dash.projects.portfolio, active: false },
  ];

  return (
    <div style={dshS.wrap}>
      <div style={dshS.topBar}>
        <button onClick={() => setLang(l === 'de' ? 'en' : 'de')} style={navS.langBtn}><LangIcon /> {l === 'de' ? 'DE' : 'EN'}</button>
        <button onClick={onLogout} style={navS.btn}><LogoutIcon /></button>
      </div>

      <header style={dshS.header}>
        <h1 style={dshS.greeting}>{t.dash.greeting}</h1>
        <p style={dshS.subtitle}>{t.dash.subtitle}</p>
      </header>

      <div style={dshS.grid}>
        {projects.map((p, i) => (
          <div
            key={p.id}
            className={`glow-card ${p.active ? '' : 'inactive'}`}
            style={{ animationDelay: `${i * 70}ms` }}
            onClick={() => p.active && onNavigate(p.id)}
          >
            <div style={dshS.iconBox}>
              <p.icon />
            </div>
            <h3 style={dshS.cardTitle}>{p.title}</h3>
            <p style={dshS.cardDesc}>{p.desc}</p>
            {!p.active && <span style={dshS.badge}>{t.dash.soon}</span>}
            {p.active && <span style={dshS.arrow}>→</span>}
          </div>
        ))}
      </div>

      <footer style={dshS.footer}>
        <a onClick={() => onNavigate('impressum')} style={dshS.footLink}>{t.dash.impressum}</a>
        <span style={{ color: 'var(--text-3)' }}>·</span>
        <a onClick={() => onNavigate('datenschutz')} style={dshS.footLink}>{t.dash.datenschutz}</a>
      </footer>
    </div>
  );
}

const navS = {
  btn: { background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-2)', cursor: 'pointer', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.2s', fontSize: 13 },
  langBtn: { background: 'var(--accent-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--accent)', cursor: 'pointer', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s', fontSize: 13, fontWeight: 600 },
};

const dshS = {
  wrap: { maxWidth: 900, margin: '0 auto', padding: '40px 24px 60px' },
  topBar: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 20 },
  header: { marginBottom: 40 },
  greeting: { fontSize: 32, fontWeight: 700, marginBottom: 6 },
  subtitle: { fontSize: 16, color: 'var(--text-2)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 },
  iconBox: { width: 44, height: 44, borderRadius: 10, background: 'var(--accent-subtle)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', marginBottom: 16 },
  cardTitle: { fontSize: 17, fontWeight: 650, marginBottom: 4 },
  cardDesc: { fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.5 },
  badge: { position: 'absolute', top: 14, right: 14, fontSize: 11, fontWeight: 600, color: 'var(--gold)', background: 'rgba(200,160,74,0.1)', border: '1px solid rgba(200,160,74,0.2)', borderRadius: 20, padding: '2px 10px', letterSpacing: '0.03em' },
  arrow: { position: 'absolute', bottom: 16, right: 20, fontSize: 18, color: 'var(--accent)', opacity: 0.4, transition: 'opacity 0.2s' },
  footer: { marginTop: 48, display: 'flex', justifyContent: 'center', gap: 12, fontSize: 13 },
  footLink: { color: 'var(--text-3)', cursor: 'pointer', transition: 'color 0.2s' },
};

function PlaceholderPage({ onBack, onLogout, projectTitle }) {
  const { t } = useT();
  return (
    <div>
      <NavBar onBack={onBack} onLogout={onLogout} title={projectTitle} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 60px)', textAlign: 'center', padding: 24 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--accent-subtle)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, animation: 'glowPulse 3s ease-in-out infinite' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>{t.placeholder.title}</h2>
        <p style={{ color: 'var(--text-2)', maxWidth: 320 }}>{t.placeholder.desc}</p>
      </div>
    </div>
  );
}

Object.assign(window, { DashboardPage, PlaceholderPage });
