/* ═══════════════════════════════════════
   Dashboard & Placeholder
   ═══════════════════════════════════════ */

function DashboardPage({ onNavigate, onLogout, permissions = [], user = null }) {
  const { t, lang } = useT();
  const { lang: l, setLang } = useLang();
  const displayName = user?.vorname || user?.username || '';

  const allProjects = [
    { id: 'personal',  permission: 'view:personal',  icon: PersonIcon, ...t.dash.projects.personal,  active: true },
    { id: 'terminal',  permission: 'view:terminal',   icon: TermIcon,   ...t.dash.projects.terminal,  active: true },
    { id: 'gapped',    permission: 'view:gapped',     icon: GapIcon,    ...t.dash.projects.gapped,    active: true },
    { id: 'gymtracker', permission: 'view:gymtracker', icon: DumbIcon,   ...t.dash.projects.gymtracker, active: true },
    { id: 'admin',     permission: 'manage:users',    icon: UsersIcon,  ...t.dash.projects.admin,      active: true },
  ];

  // Nur Kacheln rendern für die eine Berechtigung vorliegt.
  // Kacheln ohne Berechtigung existieren weder im DOM noch im Quelltext des Renders.
  const projects = allProjects.filter(p => permissions.includes(p.permission));

  return (
    <div style={dshS.wrap}>
      <div style={dshS.topBar}>
        <button onClick={() => setLang(l === 'de' ? 'en' : 'de')} style={navS.langBtn}><LangIcon /> {l === 'de' ? 'DE' : 'EN'}</button>
        <button onClick={() => onNavigate('settings')} style={navS.btn} title="Einstellungen">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m0 5.08l-4.24 4.24M20 4.22l-4.24 4.24m0 5.08l4.24 4.24"/>
          </svg>
        </button>
        <button onClick={onLogout} style={navS.btn}><LogoutIcon /></button>
      </div>

      <header style={dshS.header}>
        <h1 style={dshS.greeting}>{t.dash.greeting}{displayName ? ` ${displayName}.` : '.'}</h1>
        <p style={dshS.subtitle}>{t.dash.subtitle}</p>
      </header>

      {projects.length === 0 ? (
        <div style={dshS.noPerms}>
          <div style={dshS.noPermsIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
          </div>
          <p style={dshS.noPermsTitle}>{t.dash.noPermsTitle}</p>
          <p style={dshS.noPermsText}>
            {t.dash.noPermsText}{' '}
            <a href="mailto:lorenscheit.dennis.99@gmail.com" style={{ color: 'var(--accent)' }}>
              lorenscheit.dennis.99@gmail.com
            </a>
            {' '}{t.dash.noPermsLinkedIn}
          </p>
        </div>
      ) : (
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
      )}

      <footer style={dshS.footer}>
        <a onClick={() => onNavigate('impressum')} style={dshS.footLink}>{t.dash.impressum}</a>
        <span style={{ color: 'var(--text-3)' }}>·</span>
        <a onClick={() => onNavigate('datenschutz')} style={dshS.footLink}>{t.dash.datenschutz}</a>
      </footer>
    </div>
  );
}

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
  noPerms: { textAlign: 'center', padding: '48px 32px', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-surface)', animation: 'fadeUp 0.5s cubic-bezier(0,0,0.2,1) both' },
  noPermsIcon: { width: 56, height: 56, borderRadius: '50%', background: 'var(--accent-subtle)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', animation: 'glowPulse 3s ease-in-out infinite' },
  noPermsTitle: { fontSize: 17, fontWeight: 650, marginBottom: 10, color: 'var(--text-1)' },
  noPermsText: { fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7, maxWidth: 480, margin: '0 auto' },
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
