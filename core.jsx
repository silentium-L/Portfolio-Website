/* ═══════════════════════════════════════
   Core: i18n, Shared UI, Login, Dashboard
   ═══════════════════════════════════════ */

const { useState, useEffect, useRef, useContext, createContext, useCallback } = React;

// ─── Language Context ─────────────────
const LangCtx = createContext({ lang: 'de', setLang: () => {} });
function useLang() { return useContext(LangCtx); }
function useT() {
  const { lang } = useLang();
  return { t: STRINGS[lang], lang };
}

// ─── Translations ─────────────────────
const STRINGS = {
  de: {
    login: { title: 'Willkommen', subtitle: 'Passwort eingeben um fortzufahren', placeholder: 'Passwort', btn: 'Eintreten', error: 'Falsches Passwort' },
    nav: { back: 'Zurück', logout: 'Abmelden' },
    dash: {
      greeting: 'Hallo Dennis.',
      subtitle: 'Wähle ein Projekt',
      projects: {
        personal:  { title: 'Über Mich',     desc: 'Profil, Skills & Werdegang' },
        terminal:  { title: 'Terminal',       desc: 'Interaktiver Chat im Terminal-Stil' },
        gapped:    { title: 'Get Gapped',      desc: 'LoL Scouting & Spieleranalyse' },
        code:      { title: 'Code Forge',     desc: 'RPG & IBM i Projekte' },
        fitness:   { title: 'Fitness Log',    desc: 'Training & Fortschritt' },
        portfolio: { title: 'Projekte',       desc: 'Arbeitsproben & Portfolio' },
      },
      soon: 'Demnächst',
      impressum: 'Impressum',
      datenschutz: 'Datenschutz',
    },
    terminal: {
      welcome: 'Willkommen im Terminal. Tippe /help für Befehle.',
      helpText: '/about    — Über Dennis\n/skills   — Technische Skills\n/contact  — Kontakt\n/clear    — Terminal leeren\n/help     — Diese Hilfe\n\nOder stelle eine freie Frage.',
      thinking: 'Verarbeite…',
    },
    placeholder: { title: 'Demnächst verfügbar', desc: 'Dieses Projekt ist noch in Entwicklung.', back: 'Zurück' },
  },
  en: {
    login: { title: 'Welcome', subtitle: 'Enter password to continue', placeholder: 'Password', btn: 'Enter', error: 'Wrong password' },
    nav: { back: 'Back', logout: 'Sign Out' },
    dash: {
      greeting: 'Hello Dennis.',
      subtitle: 'Choose a project',
      projects: {
        personal:  { title: 'About Me',      desc: 'Profile, skills & journey' },
        terminal:  { title: 'Terminal',       desc: 'Interactive terminal-style chat' },
        gapped:    { title: 'Get Gapped',      desc: 'LoL Scouting & Player Intel' },
        code:      { title: 'Code Forge',     desc: 'RPG & IBM i projects' },
        fitness:   { title: 'Fitness Log',    desc: 'Training & progress' },
        portfolio: { title: 'Projects',       desc: 'Work samples & portfolio' },
      },
      soon: 'Coming Soon',
      impressum: 'Imprint',
      datenschutz: 'Privacy Policy',
    },
    terminal: {
      welcome: 'Welcome to the terminal. Type /help for commands.',
      helpText: '/about    — About Dennis\n/skills   — Technical skills\n/contact  — Contact info\n/clear    — Clear terminal\n/help     — Show this help\n\nOr ask any question.',
      thinking: 'Processing…',
    },
    placeholder: { title: 'Coming Soon', desc: 'This project is still in development.', back: 'Back' },
  }
};

// ─── SVG Icons ────────────────────────
const Icon = ({ d, size = 22, stroke = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    {typeof d === 'string' ? <path d={d} /> : d}
  </svg>
);

const PersonIcon = () => <Icon d={<><circle cx="12" cy="8" r="3.5"/><path d="M5.5 21c0-3.5 2.9-6.5 6.5-6.5s6.5 3 6.5 6.5"/></>} />;
const TermIcon   = () => <Icon d={<><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 10l3 3-3 3"/><path d="M13 16h4"/></>} />;
const ChartIcon  = () => <Icon d={<><path d="M3 20l5.5-8 3.5 3.5L21 5"/><path d="M17 5h4v4"/></>} />;
const CodeIcon   = () => <Icon d={<><path d="M16 18l6-6-6-6"/><path d="M8 6l-6 6 6 6"/></>} />;
const DumbIcon   = () => <Icon d={<><rect x="2" y="9" width="4" height="6" rx="1"/><rect x="18" y="9" width="4" height="6" rx="1"/><path d="M6 12h12"/><path d="M6 8v8"/><path d="M18 8v8"/></>} />;
const GridIcon   = () => <Icon d={<><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>} />;
const ArrowLeft  = () => <Icon d="M19 12H5m0 0l6-6m-6 6l6 6" size={18} />;
const LogoutIcon = () => <Icon d={<><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></>} size={16} />;
const LangIcon   = () => <Icon d={<><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 014 9 15 15 0 01-4 9 15 15 0 01-4-9 15 15 0 014-9"/></>} size={16} />;
const GapIcon    = () => <Icon d={<><polygon points="12,2 22,12 12,22 2,12"/><polygon points="12,6 18,12 12,18 6,12"/></>} />;

// ─── Shared UI ────────────────────────
function NavBar({ onBack, onLogout, title, showBack = true }) {
  const { lang, setLang } = useLang();
  return (
    <nav style={navS.bar}>
      <div style={navS.left}>
        {showBack && (
          <button onClick={onBack} style={navS.btn} title={STRINGS[lang].nav.back}>
            <ArrowLeft />
          </button>
        )}
        {title && <span style={navS.title}>{title}</span>}
      </div>
      <div style={navS.right}>
        <button onClick={() => setLang(lang === 'de' ? 'en' : 'de')} style={navS.langBtn}>
          <LangIcon /> {lang === 'de' ? 'DE' : 'EN'}
        </button>
        <button onClick={onLogout} style={navS.btn} title={STRINGS[lang].nav.logout}>
          <LogoutIcon />
        </button>
      </div>
    </nav>
  );
}
const navS = {
  bar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', position: 'sticky', top: 0, zIndex: 50, background: 'rgba(6,10,20,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)' },
  left: { display: 'flex', alignItems: 'center', gap: 12 },
  right: { display: 'flex', alignItems: 'center', gap: 8 },
  title: { fontSize: 14, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.04em', textTransform: 'uppercase' },
  btn: { background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-2)', cursor: 'pointer', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.2s', fontSize: 13 },
  langBtn: { background: 'var(--accent-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--accent)', cursor: 'pointer', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s', fontSize: 13, fontWeight: 600 },
};

function SectionHead({ children, gold }) {
  const c = gold ? 'var(--gold)' : 'var(--accent)';
  return (
    <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ width: 32, height: 2, background: c, borderRadius: 1, flexShrink: 0 }}></span>
      {children}
    </h2>
  );
}

// ─── Login Page ───────────────────────
function LoginPage({ onLogin }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [exiting, setExiting] = useState(false);
  const { t } = useT();

  const submit = (e) => {
    e.preventDefault();
    if (pw.toLowerCase() === 'dennis') {
      setExiting(true);
      setTimeout(onLogin, 400);
    } else {
      setErr(true); setShaking(true);
      setTimeout(() => setShaking(false), 450);
    }
  };

  return (
    <div style={logS.wrap}>
      <form onSubmit={submit} className={shaking ? 'shake' : ''} style={{ ...logS.card, opacity: exiting ? 0 : 1, transform: exiting ? 'scale(1.04)' : 'scale(1)', transition: 'all 0.4s var(--ease)' }}>
        {/* Hex icon */}
        <div style={logS.hex}>
          <svg width="52" height="52" viewBox="0 0 52 52">
            <polygon points="26,2 49,14 49,38 26,50 3,38 3,14" fill="none" stroke="var(--accent)" strokeWidth="1.2" opacity="0.6"/>
            <text x="26" y="30" textAnchor="middle" fill="var(--accent)" fontFamily="var(--font)" fontSize="18" fontWeight="700">D</text>
          </svg>
        </div>
        <h1 style={logS.title}>{t.login.title}</h1>
        <p style={logS.sub}>{t.login.subtitle}</p>
        <div style={logS.inputWrap}>
          <input
            type="password" value={pw} onChange={e => { setPw(e.target.value); setErr(false); }}
            placeholder={t.login.placeholder} autoFocus
            style={{ ...logS.input, borderColor: err ? '#e05050' : 'var(--border)' }}
          />
          <div style={{ ...logS.underGlow, opacity: err ? 0 : 1 }}></div>
        </div>
        {err && <p style={logS.err}>{t.login.error}</p>}
        <button type="submit" style={logS.btn}>
          {t.login.btn}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14m-6-6l6 6-6 6"/></svg>
        </button>
      </form>
    </div>
  );
}
const logS = {
  wrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24 },
  card: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '48px 40px', width: '100%', maxWidth: 380, textAlign: 'center', animation: 'fadeUp 0.6s cubic-bezier(0,0,0.2,1) both, glowPulse 4s ease-in-out infinite' },
  hex: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: 700, marginBottom: 6 },
  sub: { fontSize: 14, color: 'var(--text-2)', marginBottom: 28 },
  inputWrap: { position: 'relative', marginBottom: 8 },
  input: { width: '100%', padding: '12px 16px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-1)', fontSize: 15, outline: 'none', transition: 'border-color 0.2s', fontFamily: 'var(--font)' },
  underGlow: { position: 'absolute', bottom: -1, left: '20%', right: '20%', height: 2, background: 'linear-gradient(90deg, transparent, var(--accent), transparent)', borderRadius: 1, transition: 'opacity 0.3s' },
  err: { color: '#e05050', fontSize: 13, marginBottom: 8, marginTop: 4 },
  btn: { marginTop: 16, width: '100%', padding: '12px 20px', background: 'linear-gradient(135deg, var(--accent-dim), var(--accent))', border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s', fontFamily: 'var(--font)' },
};

// ─── Dashboard Page ───────────────────
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
      {/* Top bar */}
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

// ─── Placeholder (Coming Soon) ────────
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

// ─── Exports ──────────────────────────
Object.assign(window, {
  LangCtx, useLang, useT, STRINGS,
  Icon, PersonIcon, TermIcon, ChartIcon, CodeIcon, DumbIcon, GridIcon, GapIcon, ArrowLeft,
  NavBar, SectionHead,
  LoginPage, DashboardPage, PlaceholderPage,
});
