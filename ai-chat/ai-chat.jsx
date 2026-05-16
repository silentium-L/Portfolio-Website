/* ═══════════════════════════════════════
   AI Chat (Terminal)
   ═══════════════════════════════════════ */

const DENNIS_CONTEXT = `You are an AI assistant on Dennis's portfolio website. Respond in the same language the user writes in.
About Dennis: Software Developer for IBM i (AS/400) legacy systems. Expert in RPG Free (RPG IV). Modernizes legacy RPG code to modern Profound UI web frontends. Passionate about quantitative/algorithmic trading and natural bodybuilding. Based in Germany.
Keep responses concise (2-4 sentences). Use plain text, no markdown.`;

function TerminalPage({ onBack, onLogout }) {
  const { t, lang } = useT();
  const [history, setHistory] = React.useState([]);
  const [input, setInput] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const endRef = React.useRef(null);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    setHistory([{ type: 'sys', text: t.terminal.welcome }]);
  }, [lang]);

  React.useEffect(() => {
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
      const skills = window.SKILLS || [];
      if (skills.length === 0) {
        add('sys', lang === 'de' ? 'Skills nicht verfügbar.' : 'Skills not available.');
      } else {
        add('out', skills.map(s => `${s.name.padEnd(24)} ${'█'.repeat(Math.round(s.level / 10))}${'░'.repeat(10 - Math.round(s.level / 10))} ${s.level}%`).join('\n'));
      }
      return;
    }
    if (c === '/contact') {
      add('out', 'GitHub:   [placeholder]\nLinkedIn: [placeholder]\nE-Mail:   [placeholder]');
      return;
    }

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
          <div style={tS.titleBar}>
            <div style={tS.dots}>
              <span style={{ ...tS.dot, background: '#ff5f57' }}></span>
              <span style={{ ...tS.dot, background: '#ffbd2e' }}></span>
              <span style={{ ...tS.dot, background: '#28c840' }}></span>
            </div>
            <span style={tS.titleText}>dennis@portfolio — terminal</span>
            <div style={{ width: 52 }}></div>
          </div>
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
                {line.type === 'out' && <pre style={tS.lineOut}>{line.text}</pre>}
                {line.type === 'sys' && <pre style={tS.lineSys}>{line.text}</pre>}
                {line.type === 'err' && <pre style={tS.lineErr}>{line.text}</pre>}
              </div>
            ))}
            {busy && (
              <div style={tS.lineSys}>
                <span style={{ animation: 'blink 1s infinite' }}>{t.terminal.thinking}</span>
              </div>
            )}
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

Object.assign(window, { TerminalPage });
