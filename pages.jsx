/* ═══════════════════════════════════════
   Pages: Personal, Terminal
   ═══════════════════════════════════════ */

const { useState: uS, useEffect: uE, useRef: uR, useCallback: uCB, useMemo: uM } = React;

// ─── Skills Data ──────────────────────
const SKILLS = [
  { name: 'RPG Free / RPG IV', level: 95, cat: 'core' },
  { name: 'IBM i (AS/400)',    level: 90, cat: 'core' },
  { name: 'Profound UI',       level: 88, cat: 'core' },
  { name: 'CL Programming',    level: 85, cat: 'core' },
  { name: 'DB2 / SQL',         level: 82, cat: 'data' },
  { name: 'Legacy Modernization', level: 92, cat: 'specialty' },
  { name: 'JavaScript / Web',  level: 70, cat: 'web' },
  { name: 'API Development',   level: 75, cat: 'web' },
];

const TIMELINE_DE = [
  { year: 'Heute', title: 'Senior RPG Developer', desc: 'Legacy Modernisierung, Profound UI Frontends, Architekturberatung' },
  { year: '2022',  title: 'IBM i Developer', desc: 'RPG Free Entwicklung, DB2 Datenbankdesign, Service-Programme' },
  { year: '2020',  title: 'Junior Developer', desc: 'Einstieg in die IBM i Welt, erste RPG-Projekte' },
];
const TIMELINE_EN = [
  { year: 'Today', title: 'Senior RPG Developer', desc: 'Legacy modernization, Profound UI frontends, architecture consulting' },
  { year: '2022',  title: 'IBM i Developer', desc: 'RPG Free development, DB2 database design, service programs' },
  { year: '2020',  title: 'Junior Developer', desc: 'Entry into the IBM i world, first RPG projects' },
];

// ─── Personal Page ────────────────────
function PersonalPage({ onBack, onLogout }) {
  const { t, lang } = useT();
  const timeline = lang === 'de' ? TIMELINE_DE : TIMELINE_EN;
  const [visible, setVisible] = uS({});
  const observers = uR([]);

  uE(() => {
    const els = document.querySelectorAll('[data-reveal]');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          setVisible(v => ({ ...v, [e.target.dataset.reveal]: true }));
        }
      });
    }, { threshold: 0.15 });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const rev = (id) => ({
    'data-reveal': id,
    style: {
      opacity: visible[id] ? 1 : 0,
      transform: visible[id] ? 'translateY(0)' : 'translateY(24px)',
      transition: 'all 0.6s var(--ease-out)',
    }
  });

  return (
    <div className="page-wrap">
      <NavBar onBack={onBack} onLogout={onLogout} title={lang === 'de' ? 'Über Mich' : 'About Me'} />

      {/* ── Hero ── */}
      <section style={pS.hero}>
        <div style={pS.photoWrap}>
          <div style={pS.photoHex}>
            <img src="assets/profile.png" alt="Dennis" style={pS.photo} />
          </div>
          <svg style={pS.hexRing} viewBox="0 0 120 120" width="148" height="148">
            <polygon points="60,4 112,32 112,88 60,116 8,88 8,32" fill="none" stroke="var(--accent)" strokeWidth="0.8" opacity="0.35"/>
          </svg>
        </div>
        <h1 style={pS.heroName}>Dennis</h1>
        <p style={pS.heroSub}>{t.personal.heroSub}</p>
        <p style={pS.heroTag}>{t.personal.heroTag}</p>
      </section>

      <div style={pS.content}>
        {/* ── About ── */}
        <section {...rev('about')} style={{ ...rev('about').style, marginBottom: 56 }}>
          <SectionHead>{t.personal.aboutTitle}</SectionHead>
          {t.personal.aboutText.split('\n\n').map((p, i) => (
            <p key={i} style={pS.bodyText}>{p}</p>
          ))}
        </section>

        {/* ── Skills ── */}
        <section {...rev('skills')} style={{ ...rev('skills').style, marginBottom: 56 }}>
          <SectionHead>{t.personal.skillsTitle}</SectionHead>
          <div style={pS.skillGrid}>
            {SKILLS.map((s, i) => (
              <div key={s.name} style={pS.skillCard}>
                <div style={pS.skillTop}>
                  <span style={pS.skillName}>{s.name}</span>
                  <span style={pS.skillPct}>{s.level}%</span>
                </div>
                <div style={pS.skillBarBg}>
                  <div style={{
                    ...pS.skillBar,
                    width: visible['skills'] ? `${s.level}%` : '0%',
                    transitionDelay: `${i * 80}ms`,
                    background: s.cat === 'core' ? 'var(--accent)' :
                                s.cat === 'specialty' ? 'var(--gold)' : 'var(--accent-dim)'
                  }}></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Timeline ── */}
        <section {...rev('exp')} style={{ ...rev('exp').style, marginBottom: 56 }}>
          <SectionHead gold>{t.personal.expTitle}</SectionHead>
          <div style={pS.timeline}>
            {timeline.map((item, i) => (
              <div key={i} style={pS.tlItem}>
                <div style={pS.tlDot}></div>
                <div style={pS.tlLine}></div>
                <div style={pS.tlContent}>
                  <span style={pS.tlYear}>{item.year}</span>
                  <h3 style={pS.tlTitle}>{item.title}</h3>
                  <p style={pS.tlDesc}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Trading ── */}
        <section {...rev('trading')} style={{ ...rev('trading').style, marginBottom: 56 }}>
          <SectionHead>{t.personal.tradingTitle}</SectionHead>
          <p style={pS.bodyText}>{t.personal.tradingText}</p>
          <div style={pS.tagRow}>
            {t.personal.tradingTags.map(tag => (
              <span key={tag} style={pS.tag}>{tag}</span>
            ))}
          </div>
        </section>

        {/* ── Bodybuilding ── */}
        <section {...rev('bb')} style={{ ...rev('bb').style, marginBottom: 56 }}>
          <SectionHead gold>{t.personal.bbTitle}</SectionHead>
          <p style={pS.bodyText}>{t.personal.bbText}</p>
          <div style={pS.tagRow}>
            {t.personal.bbTags.map(tag => (
              <span key={tag} style={{ ...pS.tag, borderColor: 'rgba(200,160,74,0.25)', color: 'var(--gold-bright)', background: 'rgba(200,160,74,0.06)' }}>{tag}</span>
            ))}
          </div>
        </section>

        {/* ── Contact ── */}
        <section {...rev('contact')} style={{ ...rev('contact').style, marginBottom: 56 }}>
          <SectionHead>{t.personal.contactTitle}</SectionHead>
          <p style={pS.bodyText}>{t.personal.contactText}</p>
          <div style={pS.socialRow}>
            {['GitHub', 'LinkedIn', 'E-Mail'].map(name => (
              <a key={name} href="#" style={pS.socialBtn}>{name}</a>
            ))}
          </div>
        </section>

        {/* ── Impressum ── */}
        <section {...rev('imp')} style={{ ...rev('imp').style, marginBottom: 40, paddingTop: 40, borderTop: '1px solid var(--border)' }}>
          <SectionHead>{t.personal.impressumTitle}</SectionHead>
          <div style={pS.legalText}>
            <p><strong>Angaben gemäß § 5 TMG</strong></p>
            <p>Dennis<br/>Software Developer<br/>[Adresse hier einfügen]</p>
            <p><strong>{lang === 'de' ? 'Kontakt' : 'Contact'}</strong></p>
            <p>E-Mail: [E-Mail hier einfügen]</p>
          </div>
        </section>

        {/* ── Datenschutz ── */}
        <section {...rev('dsg')} style={{ ...rev('dsg').style, marginBottom: 80 }}>
          <SectionHead>{t.personal.datenschutzTitle}</SectionHead>
          <div style={pS.legalText}>
            <p><strong>{lang === 'de' ? 'Allgemeiner Hinweis' : 'General Notice'}</strong></p>
            <p>{lang === 'de'
              ? 'Diese Website wird durch ein Passwort geschützt und ist nicht öffentlich zugänglich. Es werden keine Cookies gesetzt und keine personenbezogenen Daten erhoben, gespeichert oder an Dritte weitergegeben. Es werden keine externen Schriftarten oder Tracking-Dienste eingebunden.'
              : 'This website is password-protected and not publicly accessible. No cookies are set and no personal data is collected, stored, or shared with third parties. No external fonts or tracking services are used.'
            }</p>
            <p><strong>{lang === 'de' ? 'Hosting' : 'Hosting'}</strong></p>
            <p>{lang === 'de'
              ? 'Die Website wird auf Servern gehostet, die den Anforderungen der DSGVO entsprechen.'
              : 'The website is hosted on servers that comply with GDPR requirements.'
            }</p>
          </div>
        </section>
      </div>
    </div>
  );
}

const pS = {
  hero: { textAlign: 'center', padding: '56px 24px 40px', position: 'relative', animation: 'fadeUp 0.6s var(--ease-out) both' },
  photoWrap: { position: 'relative', width: 130, height: 130, margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  photoHex: { width: 120, height: 120, clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', overflow: 'hidden', position: 'relative', zIndex: 1 },
  photo: { width: '100%', height: '100%', objectFit: 'cover' },
  hexRing: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 0 },
  heroName: { fontSize: 38, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 6 },
  heroSub: { fontSize: 17, color: 'var(--accent)', fontWeight: 500, marginBottom: 6 },
  heroTag: { fontSize: 14, color: 'var(--text-2)', fontFamily: 'var(--font-mono)', letterSpacing: '0.03em' },
  content: { maxWidth: 680, margin: '0 auto', padding: '0 24px 40px' },
  bodyText: { fontSize: 15, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 12 },
  skillGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 },
  skillCard: { background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '14px 16px' },
  skillTop: { display: 'flex', justifyContent: 'space-between', marginBottom: 8 },
  skillName: { fontSize: 13.5, fontWeight: 600 },
  skillPct: { fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' },
  skillBarBg: { height: 4, background: 'rgba(77,166,255,0.1)', borderRadius: 2 },
  skillBar: { height: '100%', borderRadius: 2, transition: 'width 0.8s var(--ease-out)' },
  timeline: { position: 'relative', paddingLeft: 28 },
  tlItem: { position: 'relative', paddingBottom: 28, paddingLeft: 20 },
  tlDot: { position: 'absolute', left: -6, top: 6, width: 12, height: 12, borderRadius: '50%', background: 'var(--bg-deep)', border: '2px solid var(--gold)', zIndex: 1 },
  tlLine: { position: 'absolute', left: 0, top: 18, bottom: 0, width: 1, background: 'rgba(200,160,74,0.15)' },
  tlContent: {},
  tlYear: { fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--gold)', fontWeight: 600, marginBottom: 2, display: 'block' },
  tlTitle: { fontSize: 16, fontWeight: 650, marginBottom: 4 },
  tlDesc: { fontSize: 14, color: 'var(--text-2)', lineHeight: 1.5 },
  tagRow: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  tag: { fontSize: 12.5, padding: '5px 14px', borderRadius: 20, border: '1px solid var(--border-hover)', color: 'var(--accent-bright)', background: 'var(--accent-subtle)', fontWeight: 500 },
  socialRow: { display: 'flex', gap: 10, marginTop: 16 },
  socialBtn: { padding: '10px 22px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-1)', fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s', textDecoration: 'none', display: 'inline-block' },
  legalText: { fontSize: 14, color: 'var(--text-2)', lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: 10 },
};

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
    <div className="page-wrap" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
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
              <div key={i} style={{ marginBottom: 6, animation: 'slideInLeft 0.25s var(--ease-out) both', animationDelay: `${Math.min(i * 20, 200)}ms` }}>
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
  termWrap: { width: '100%', maxWidth: 720, maxHeight: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--glow-sm)', animation: 'fadeUp 0.5s var(--ease-out) both' },
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
