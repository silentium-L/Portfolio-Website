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
    login: { title: 'Willkommen', subtitle: 'Mit deinem Konto anmelden', placeholderUser: 'Benutzername', placeholderPw: 'Passwort', btn: 'Einloggen', errorEmpty: 'Bitte Benutzername und Passwort eingeben', errorGeneric: 'Ungültige Anmeldedaten', errorNetwork: 'Verbindung fehlgeschlagen – Server erreichbar?', switchToRegister: 'Noch kein Konto? Registrieren', switchToLogin: 'Schon ein Konto? Einloggen' },
    register: { title: 'Konto erstellen', subtitle: 'Registriere dich jetzt', btn: 'Registrieren', sectionAccount: 'Zugangsdaten', sectionContact: 'Kontaktdaten', placeholderUser: 'Benutzername', placeholderPw: 'Passwort (min. 6 Zeichen)', placeholderVorname: 'Vorname', placeholderNachname: 'Nachname', placeholderEmail: 'E-Mail-Adresse', placeholderProfession: 'Beruf / Profession', placeholderGrund: 'Grund des Besuchs (optional)', placeholderTel: 'Telefonnummer (optional)', errorEmpty: 'Bitte alle Pflichtfelder ausfüllen', errorRequired: 'Erforderlich', errorEmail: 'Ungültige E-Mail-Adresse', placeholderPwConfirm: 'Passwort bestätigen', errorPasswordMatch: 'Passwörter stimmen nicht überein', errorPasswordMin: 'Passwort mind. 6 Zeichen', errorUsernameMin: 'Benutzername mind. 3 Zeichen', errorUsernameChars: 'Nur Buchstaben, Zahlen, _ und -', errorTel: 'Ungültige Telefonnummer', errorGeneric: 'Registrierung fehlgeschlagen', errorPrivacyRequired: 'Datenschutzerklärung akzeptieren erforderlich', success: 'Registrierung erfolgreich', pendingTitle: 'Antrag eingereicht!', pendingText: 'Deine Registrierung wurde erfolgreich eingereicht und wird von einem Administrator geprüft. Du erhältst Zugang, sobald dein Konto freigeschaltet wurde.', backToLogin: 'Zurück zum Login' },
    nav: { back: 'Zurück', logout: 'Abmelden' },
    dash: {
      greeting: 'Hallo',
      subtitle: 'Wähle ein Projekt',
      projects: {
        personal:  { title: 'Über Mich',     desc: 'Profil, Skills & Werdegang' },
        terminal:  { title: 'Terminal',       desc: 'Interaktiver Chat im Terminal-Stil' },
        gapped:    { title: 'Get Gapped',      desc: 'LoL Scouting & Spieleranalyse' },
        gymtracker: { title: 'Gym Tracker',    desc: 'Training, Übungen & Fortschritt' },
        admin:     { title: 'Benutzerverwaltung', desc: 'Benutzer anlegen & verwalten' },
      },
      soon: 'Demnächst',
      impressum: 'Impressum',
      datenschutz: 'Datenschutz',
      noPermsTitle: 'Bisher keine Programmberechtigungen.',
      noPermsText: 'Bitte melden Sie sich beim Admin Dennis Lorenscheit unter folgender Email:',
      noPermsLinkedIn: 'oder schreiben Sie Ihm direkt auf LinkedIn.',
    },
    terminal: {
      welcome: 'Willkommen im Terminal. Tippe /help für Befehle.',
      helpText: '/about    — Über Dennis\n/skills   — Technische Skills\n/contact  — Kontakt\n/clear    — Terminal leeren\n/help     — Diese Hilfe\n\nOder stelle eine freie Frage.',
      thinking: 'Verarbeite…',
    },
    placeholder: { title: 'Demnächst verfügbar', desc: 'Dieses Projekt ist noch in Entwicklung.', back: 'Zurück' },
    legal: { title: 'Rechtliches', tabImprint: 'Impressum', tabPrivacy: 'Datenschutz' },
    adminPage: {
      title: 'Benutzerverwaltung',
      newUser: 'Neuer Benutzer',
      usersCount: 'Benutzer',
      editPerms: 'Berechtigungen',
      delete: 'Löschen',
      superadminBadge: 'Superadmin',
      allPerms: 'Alle Berechtigungen',
      noPerms: 'Keine Berechtigungen',
      deleteConfirm: 'Wirklich löschen?',
      deleteYes: 'Ja, löschen',
      cancel: 'Abbrechen',
      save: 'Speichern',
      saving: 'Wird gespeichert…',
      creating: 'Wird angelegt…',
      createTitle: 'Neuen Benutzer anlegen',
      editTitle: 'Berechtigungen bearbeiten',
      fieldUsername: 'Benutzername',
      fieldPassword: 'Passwort (min. 6 Zeichen)',
      fieldVorname: 'Vorname (optional)',
      fieldNachname: 'Nachname (optional)',
      fieldEmail: 'E-Mail (optional)',
      createBtn: 'Benutzer anlegen',
      superadminNote: 'Superadmin erhält automatisch alle Berechtigungen.',
      errorLoad: 'Fehler beim Laden der Daten',
      errorDelete: 'Fehler beim Löschen',
      deleteSuccess: 'Benutzer gelöscht',
      createSuccess: 'Benutzer angelegt',
      permsSuccess: 'Berechtigungen gespeichert',
      createdAt: 'Erstellt',
      usersTab: 'Benutzer',
      registrationsTab: 'Anfragen',
      noRegistrations: 'Keine offenen Registrierungsanfragen.',
      pendingBadge: 'Ausstehend',
      approveBtn: 'Freischalten',
      rejectBtn: 'Ablehnen',
      approveSuccess: 'Benutzer freigeschaltet',
      rejectSuccess: 'Anfrage abgelehnt',
      requestedAt: 'Beantragt',
      profession: 'Beruf',
      reason: 'Besuchsgrund',
    },
  },
  en: {
    login: { title: 'Welcome', subtitle: 'Sign in to your account', placeholderUser: 'Username', placeholderPw: 'Password', btn: 'Sign in', errorEmpty: 'Please enter username and password', errorGeneric: 'Invalid credentials', errorNetwork: 'Connection failed – is the server running?', switchToRegister: 'No account yet? Register', switchToLogin: 'Already have an account? Sign in' },
    register: { title: 'Create Account', subtitle: 'Register now', btn: 'Register', sectionAccount: 'Account', sectionContact: 'Contact Details', placeholderUser: 'Username', placeholderPw: 'Password (min. 6 chars)', placeholderVorname: 'First Name', placeholderNachname: 'Last Name', placeholderEmail: 'Email Address', placeholderProfession: 'Job / Profession', placeholderGrund: 'Reason for visit (optional)', placeholderTel: 'Phone Number (optional)', errorEmpty: 'Please fill in all required fields', errorRequired: 'Required', errorEmail: 'Invalid email address', placeholderPwConfirm: 'Confirm Password', errorPasswordMatch: 'Passwords do not match', errorPasswordMin: 'Password min. 6 characters', errorUsernameMin: 'Username min. 3 characters', errorUsernameChars: 'Only letters, numbers, _ and -', errorTel: 'Invalid phone number', errorGeneric: 'Registration failed', errorPrivacyRequired: 'Please accept the privacy policy', success: 'Registration successful', pendingTitle: 'Request submitted!', pendingText: 'Your registration has been submitted and will be reviewed by an administrator. You will receive access once your account has been approved.', backToLogin: 'Back to Login' },
    nav: { back: 'Back', logout: 'Sign Out' },
    dash: {
      greeting: 'Hello',
      subtitle: 'Choose a project',
      projects: {
        personal:  { title: 'About Me',      desc: 'Profile, skills & journey' },
        terminal:  { title: 'Terminal',       desc: 'Interactive terminal-style chat' },
        gapped:    { title: 'Get Gapped',      desc: 'LoL Scouting & Player Intel' },
        gymtracker: { title: 'Gym Tracker',    desc: 'Workouts, exercises & progress' },
        admin:     { title: 'User Management', desc: 'Create & manage users' },
      },
      soon: 'Coming Soon',
      impressum: 'Imprint',
      datenschutz: 'Privacy Policy',
      noPermsTitle: 'No program permissions yet.',
      noPermsText: 'Please contact admin Dennis Lorenscheit by email:',
      noPermsLinkedIn: 'or message him directly on LinkedIn.',
    },
    terminal: {
      welcome: 'Welcome to the terminal. Type /help for commands.',
      helpText: '/about    — About Dennis\n/skills   — Technical skills\n/contact  — Contact info\n/clear    — Clear terminal\n/help     — Show this help\n\nOr ask any question.',
      thinking: 'Processing…',
    },
    placeholder: { title: 'Coming Soon', desc: 'This project is still in development.', back: 'Back' },
    legal: { title: 'Legal', tabImprint: 'Imprint', tabPrivacy: 'Privacy Policy' },
    adminPage: {
      title: 'User Management',
      newUser: 'New User',
      usersCount: 'Users',
      editPerms: 'Permissions',
      delete: 'Delete',
      superadminBadge: 'Superadmin',
      allPerms: 'All Permissions',
      noPerms: 'No Permissions',
      deleteConfirm: 'Really delete?',
      deleteYes: 'Yes, delete',
      cancel: 'Cancel',
      save: 'Save',
      saving: 'Saving…',
      creating: 'Creating…',
      createTitle: 'Create New User',
      editTitle: 'Edit Permissions',
      fieldUsername: 'Username',
      fieldPassword: 'Password (min. 6 chars)',
      fieldVorname: 'First Name (optional)',
      fieldNachname: 'Last Name (optional)',
      fieldEmail: 'Email (optional)',
      createBtn: 'Create User',
      superadminNote: 'Superadmin automatically receives all permissions.',
      errorLoad: 'Error loading data',
      errorDelete: 'Error deleting user',
      deleteSuccess: 'User deleted',
      createSuccess: 'User created',
      permsSuccess: 'Permissions saved',
      createdAt: 'Created',
      usersTab: 'Users',
      registrationsTab: 'Requests',
      noRegistrations: 'No pending registration requests.',
      pendingBadge: 'Pending',
      approveBtn: 'Approve',
      rejectBtn: 'Reject',
      approveSuccess: 'User approved',
      rejectSuccess: 'Request rejected',
      requestedAt: 'Requested',
      profession: 'Profession',
      reason: 'Visit reason',
    },
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
const UsersIcon  = () => <Icon d={<><circle cx="9" cy="7" r="3"/><path d="M3 21c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M21 21c0-2.8-1.8-5.2-4-5.8"/></>} />;

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

// ─── Legal Page ───────────────────────
function LegalPage({ onBack, onLogout, initialTab = 'impressum', showImprint = true }) {
  const { t } = useT();
  const [tab, setTab] = useState(!showImprint ? 'datenschutz' : initialTab);

  const tabBtn = (active) => ({
    ...navS.btn,
    background: active ? 'var(--accent-subtle)' : 'none',
    borderColor: active ? 'var(--accent)' : 'var(--border)',
    color: active ? 'var(--accent)' : 'var(--text-2)',
    fontWeight: active ? 650 : 400,
    cursor: 'pointer',
    padding: '8px 20px',
    fontSize: 13,
  });

  const card = { border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg-surface)', padding: '28px 32px' };
  const h4 = { fontSize: 14, fontWeight: 650, color: 'var(--text-1)', margin: '20px 0 8px' };
  const p  = { fontSize: 14, lineHeight: 1.75, color: 'var(--text-2)', marginBottom: 14 };

  return (
    <div>
      <NavBar onBack={onBack} onLogout={onLogout} title={t.legal.title} />
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 60px' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
          {showImprint && (
            <button style={tabBtn(tab === 'impressum')} onClick={() => setTab('impressum')}>
              {t.legal.tabImprint}
            </button>
          )}
          <button style={tabBtn(tab === 'datenschutz')} onClick={() => setTab('datenschutz')}>
            {t.legal.tabPrivacy}
          </button>
        </div>

        {tab === 'impressum' && (
          <div style={card}>
            <SectionHead>{t.legal.tabImprint}</SectionHead>
            <p style={p}><strong>Verantwortlich für den Inhalt:</strong><br />
              Dennis Lorenscheit<br />
              Beckmannstraße 107<br />
              42659 Solingen<br />
              Deutschland
            </p>
            <p style={p}><strong>Kontakt:</strong><br />
              E-Mail: <a href="mailto:lorenscheit.dennis.99@gmail.com" style={{ color: 'var(--accent)' }}>lorenscheit.dennis.99@gmail.com</a>
            </p>
            <p style={p}><strong>Berufsbezeichnung:</strong><br />Softwareentwickler</p>
            <p style={p}><strong>Haftungsausschluss:</strong><br />
              Die Inhalte dieser Website werden mit großer Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte kann keine Gewähr übernommen werden. Externe Links werden nach Sorgfalt ausgewählt, für deren Inhalte wird keine Haftung übernommen.
            </p>
          </div>
        )}

        {tab === 'datenschutz' && (
          <div style={card}>
            <SectionHead>{t.legal.tabPrivacy}</SectionHead>
            <h4 style={h4}>1. Verantwortliche Stelle</h4>
            <p style={p}>Dennis Lorenscheit<br />
              E-Mail: <a href="mailto:lorenscheit.dennis.99@gmail.com" style={{ color: 'var(--accent)' }}>lorenscheit.dennis.99@gmail.com</a>
            </p>
            <h4 style={h4}>2. Datenerfassung und -verarbeitung</h4>
            <p style={p}>Diese Webanwendung verwendet sessionStorage für die Sitzungsverwaltung (Login-Token, Berechtigungen). Es erfolgen keine Anfragen an externe Drittanbieter beim Laden der Seite. Das Hosting erfolgt auf dem Webserver des Betreibers, der automatisch Zugriffsdaten erfassen kann.</p>
            <h4 style={h4}>2b. Externe Dienste und Drittanbieter</h4>
            <p style={p}>
              Diese Anwendung nutzt die folgenden externen Dienste:
              <br /><br />
              <strong>Get Gapped Feature (League of Legends Scouting):</strong><br />
              Um Spielerdaten zu laden, kommuniziert diese Anwendung mit der Riot Games API (Riot Games, Inc., USA). Die Abfrage erfolgt über einen öffentlichen CORS-Proxy (corsproxy.io). Die eingegebenen Summoner-Namen werden an diese Dienste übertragen. Rechtsgrundlage: Berechtigtes Interesse (Art. 6 Abs. 1 lit. f).
              <br /><br />
              <strong>Content Delivery Network (CDN):</strong><br />
              React, React-DOM und Babel werden von unpkg.com (Cloudflare, USA) geladen. Bei diesem Abruf wird Ihre IP-Adresse an den CDN-Betreiber übertragen. Rechtsgrundlage: Berechtigtes Interesse (Art. 6 Abs. 1 lit. f).
            </p>
            <h4 style={h4}>3. Kontaktaufnahme</h4>
            <p style={p}>Für Kontaktanfragen nutze bitte direkt eine E-Mail an <a href="mailto:lorenscheit.dennis.99@gmail.com" style={{ color: 'var(--accent)' }}>lorenscheit.dennis.99@gmail.com</a>. Es gibt kein automatisches Kontaktformular.</p>
            <h4 style={h4}>4. Speichertechniken</h4>
            <p style={p}>Diese Anwendung verwendet sessionStorage zur Speicherung von Login-Token und Berechtigungen. Der sessionStorage wird beim Schließen des Browser-Tabs automatisch geleert. Es werden keine Tracking-Cookies eingesetzt.</p>
            <h4 style={h4}>5. Benutzerrechte</h4>
            <p style={p}>Sie haben das Recht, Auskunft über Ihre personenbezogenen Daten zu erhalten, diese zu berichtigen, zu löschen oder ihre Verarbeitung einzuschränken. Kontaktieren Sie dazu den Verantwortlichen.</p>
            <h4 style={h4}>6. Externe Links</h4>
            <p style={p}>Diese Website enthält Links zu externen Seiten (GitHub, LinkedIn). Für deren Inhalte wird keine Haftung übernommen. Das Anklicken öffnet einen neuen Browser-Tab und unterliegt den Datenschutzerklärungen der jeweiligen Zielseite.</p>
            <h4 style={h4}>7. Änderungen</h4>
            <p style={p}>Diese Datenschutzerklärung kann jederzeit geändert werden. Die jeweils aktuelle Version ist auf dieser Website verfügbar.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Exports ──────────────────────────
Object.assign(window, {
  LangCtx, useLang, useT, STRINGS,
  Icon, PersonIcon, TermIcon, ChartIcon, CodeIcon, DumbIcon, GridIcon, GapIcon, UsersIcon, ArrowLeft, LangIcon, LogoutIcon,
  NavBar, SectionHead, navS, LegalPage,
});
