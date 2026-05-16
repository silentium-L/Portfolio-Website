/* ═══════════════════════════════════════
   Login
   ═══════════════════════════════════════ */

function LoginPage({ onLogin }) {
  const [pw, setPw] = React.useState('');
  const [err, setErr] = React.useState(false);
  const [shaking, setShaking] = React.useState(false);
  const [exiting, setExiting] = React.useState(false);
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

Object.assign(window, { LoginPage });
