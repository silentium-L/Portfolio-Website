/* ═══════════════════════════════════════
   Shared: i18n, Icons, NavBar
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

// ─── NavBar ───────────────────────────
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

// ─── Exports ──────────────────────────
Object.assign(window, {
  LangCtx, useLang, useT, STRINGS,
  Icon, PersonIcon, TermIcon, ChartIcon, CodeIcon, DumbIcon, GridIcon, GapIcon, ArrowLeft, LangIcon, LogoutIcon,
  NavBar, SectionHead, navS,
});
