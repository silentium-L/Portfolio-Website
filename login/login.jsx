/* ═══════════════════════════════════════
   Login + Registrierung — Username + Passwort via API
   ═══════════════════════════════════════ */

const API_BASE = window.APP_CONFIG?.apiBase ?? 'http://localhost:3001';

function LoginPage({ onLogin, onNavigate }) {
  const [mode, setMode]       = React.useState('login'); // 'login' | 'register'
  const [exiting, setExiting] = React.useState(false);

  function switchMode(next) {
    setMode(next);
  }

  function handleSuccess() {
    setExiting(true);
    setTimeout(onLogin, 400);
  }

  const cardStyle = {
    ...logS.card,
    maxWidth: mode === 'register' ? 460 : 380,
    opacity: exiting ? 0 : 1,
    transform: exiting ? 'scale(1.04)' : 'scale(1)',
    transition: 'all 0.4s var(--ease)',
  };

  return (
    <div style={logS.wrap}>
      <div style={cardStyle}>
        {/* Logo */}
        <div style={logS.hex}>
          <svg width="52" height="52" viewBox="0 0 52 52">
            <polygon
              points="26,2 49,14 49,38 26,50 3,38 3,14"
              fill="none" stroke="var(--accent)" strokeWidth="1.2" opacity="0.6"
            />
            <text x="26" y="30" textAnchor="middle" fill="var(--accent)"
              fontFamily="var(--font)" fontSize="18" fontWeight="700">D</text>
          </svg>
        </div>

        {mode === 'login'
          ? <LoginForm onSuccess={handleSuccess} onSwitch={() => switchMode('register')} />
          : <RegisterForm onSuccess={handleSuccess} onSwitch={() => switchMode('login')} onNavigate={onNavigate} />
        }
      </div>

      {onNavigate && (
        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 12 }}>
          <button onClick={() => onNavigate('datenschutz')} style={{
            background: 'none', border: 'none', color: 'var(--text-2)',
            cursor: 'pointer', textDecoration: 'underline', fontFamily: 'var(--font)',
          }}>Datenschutz</button>
        </div>
      )}
    </div>
  );
}

// ─── Login-Formular ───────────────────────────────────────────────────────────

function LoginForm({ onSuccess, onSwitch }) {
  const [username, setUsername] = React.useState('');
  const [pw, setPw]             = React.useState('');
  const [err, setErr]           = React.useState('');
  const [loading, setLoading]   = React.useState(false);
  const [shaking, setShaking]   = React.useState(false);
  const { t } = useT();

  function triggerShake(message) {
    setErr(message);
    setShaking(true);
    setTimeout(() => setShaking(false), 450);
  }

  async function submit(e) {
    e.preventDefault();
    if (!username.trim() || !pw) { triggerShake(t.login.errorEmpty); return; }

    setLoading(true);
    setErr('');
    try {
      const res  = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: pw }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) { triggerShake(json.error ?? t.login.errorGeneric); return; }

      sessionStorage.setItem('auth_token', json.data.token);
      sessionStorage.setItem('auth_user', JSON.stringify(json.data.user));
      sessionStorage.setItem('auth_permissions', JSON.stringify(json.data.permissions ?? []));
      onSuccess();
    } catch {
      triggerShake(t.login.errorNetwork);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className={shaking ? 'shake' : ''} style={{ textAlign: 'center' }} noValidate>
      <h1 style={logS.title}>{t.login.title}</h1>
      <p style={logS.sub}>{t.login.subtitle}</p>

      <div style={logS.inputWrap}>
        <input type="text" value={username} autoComplete="username" autoFocus
          onChange={e => { setUsername(e.target.value); setErr(''); }}
          placeholder={t.login.placeholderUser}
          style={{ ...logS.input, borderColor: err ? '#e05050' : 'var(--border)' }}
          disabled={loading} />
      </div>

      <div style={{ ...logS.inputWrap, marginBottom: 8 }}>
        <input type="password" value={pw} autoComplete="current-password"
          onChange={e => { setPw(e.target.value); setErr(''); }}
          placeholder={t.login.placeholderPw}
          style={{ ...logS.input, borderColor: err ? '#e05050' : 'var(--border)' }}
          disabled={loading} />
        <div style={{ ...logS.underGlow, opacity: err ? 0 : 1 }}></div>
      </div>

      {err && <p style={logS.err}>{err}</p>}

      <button type="submit" style={logS.btn} disabled={loading}>
        {loading ? <span style={logS.spinner}></span> : (
          <>{t.login.btn}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14m-6-6l6 6-6 6"/>
            </svg>
          </>
        )}
      </button>

      <button type="button" onClick={onSwitch} style={logS.switchBtn}>{t.login.switchToRegister}</button>
    </form>
  );
}

// ─── Vorwahl-Codes ────────────────────────────────────────────────────────────

const DIAL_CODES = [
  { code: '+49', label: 'DE +49' },
  { code: '+43', label: 'AT +43' },
  { code: '+41', label: 'CH +41' },
  { code: '+44', label: 'GB +44' },
  { code: '+33', label: 'FR +33' },
  { code: '+39', label: 'IT +39' },
  { code: '+34', label: 'ES +34' },
  { code: '+31', label: 'NL +31' },
  { code: '+48', label: 'PL +48' },
  { code: '+1',  label: 'US +1'  },
  { code: '+7',  label: 'RU +7'  },
  { code: '+86', label: 'CN +86' },
  { code: '+81', label: 'JP +81' },
  { code: '+82', label: 'KR +82' },
  { code: '+55', label: 'BR +55' },
  { code: '+61', label: 'AU +61' },
  { code: '+91', label: 'IN +91' },
  { code: '+90', label: 'TR +90' },
];

// ─── Registrierungs-Formular ──────────────────────────────────────────────────

function RegisterForm({ onSuccess, onSwitch, onNavigate }) {
  const [fields, setFields] = React.useState({
    username: '', password: '', pwConfirm: '',
    vorname: '', nachname: '', email: '',
    profession: '', grund_besuchs: '', telefonnummer: '',
  });
  const [dialCode, setDialCode]   = React.useState('+49');
  const [fieldErrors, setFieldErrors] = React.useState({});
  const [err, setErr]             = React.useState('');
  const [loading, setLoading]     = React.useState(false);
  const [shaking, setShaking]     = React.useState(false);
  const [agreeToPrivacy, setAgreeToPrivacy] = React.useState(false);
  const { t } = useT();
  const r = t.register;

  function set(key) {
    return e => {
      setFields(prev => ({ ...prev, [key]: e.target.value }));
      setFieldErrors(prev => { const next = { ...prev }; delete next[key]; return next; });
    };
  }

  function triggerShake() {
    setShaking(true);
    setTimeout(() => setShaking(false), 450);
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validate() {
    const { username, password, pwConfirm, vorname, nachname, email, telefonnummer } = fields;
    const errs = {};

    if (!username.trim())                                 errs.username = r.errorRequired;
    else if (username.trim().length < 3)                  errs.username = r.errorUsernameMin;
    else if (!/^[a-zA-Z0-9_-]+$/.test(username.trim()))  errs.username = r.errorUsernameChars;

    if (!password)                errs.password  = r.errorRequired;
    else if (password.length < 6) errs.password  = r.errorPasswordMin;

    if (!pwConfirm)               errs.pwConfirm = r.errorRequired;
    else if (password !== pwConfirm) errs.pwConfirm = r.errorPasswordMatch;

    if (!vorname.trim())  errs.vorname  = r.errorRequired;
    if (!nachname.trim()) errs.nachname = r.errorRequired;

    if (!email.trim())                    errs.email = r.errorRequired;
    else if (!validateEmail(email.trim())) errs.email = r.errorEmail;

    if (telefonnummer.trim() && !/^[0-9\s\-()+]+$/.test(telefonnummer.trim()))
      errs.telefonnummer = r.errorTel;

    if (!agreeToPrivacy)
      errs.agreeToPrivacy = r.errorPrivacyRequired || 'Datenschutzerklärung akzeptieren erforderlich';

    return errs;
  }

  async function submit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      triggerShake();
      return;
    }

    setFieldErrors({});
    setLoading(true);
    setErr('');

    const telFull = fields.telefonnummer.trim()
      ? `${dialCode} ${fields.telefonnummer.trim()}`
      : '';

    try {
      const res  = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username:      fields.username.trim(),
          password:      fields.password,
          vorname:       fields.vorname.trim(),
          nachname:      fields.nachname.trim(),
          email:         fields.email.trim(),
          profession:    fields.profession.trim(),
          grund_besuchs: fields.grund_besuchs.trim(),
          telefonnummer: telFull,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setErr(json.error ?? r.errorGeneric);
        triggerShake();
        return;
      }

      sessionStorage.setItem('auth_token', json.data.token);
      sessionStorage.setItem('auth_user', JSON.stringify(json.data.user));
      sessionStorage.setItem('auth_permissions', JSON.stringify(json.data.permissions ?? []));
      onSuccess();
    } catch {
      setErr(t.login.errorNetwork);
      triggerShake();
    } finally {
      setLoading(false);
    }
  }

  function iStyle(field) {
    return { ...logS.input, borderColor: fieldErrors[field] ? '#e05050' : 'var(--border)' };
  }

  return (
    <form onSubmit={submit} className={shaking ? 'shake' : ''} style={{ textAlign: 'center' }} noValidate>
      <h1 style={logS.title}>{r.title}</h1>
      <p style={logS.sub}>{r.subtitle}</p>

      {/* Zugangsdaten */}
      <p style={logS.sectionLabel}>{r.sectionAccount}</p>

      <div style={logS.inputWrap}>
        <input type="text" value={fields.username} autoComplete="username" autoFocus
          onChange={set('username')} placeholder={r.placeholderUser}
          style={iStyle('username')} disabled={loading} />
        {fieldErrors.username && <p style={logS.fieldErr}>{fieldErrors.username}</p>}
      </div>

      <div style={logS.grid2}>
        <div style={logS.inputWrap}>
          <input type="password" value={fields.password} autoComplete="new-password"
            onChange={set('password')} placeholder={r.placeholderPw}
            style={iStyle('password')} disabled={loading} />
          {fieldErrors.password && <p style={logS.fieldErr}>{fieldErrors.password}</p>}
        </div>
        <div style={logS.inputWrap}>
          <input type="password" value={fields.pwConfirm} autoComplete="new-password"
            onChange={set('pwConfirm')} placeholder={r.placeholderPwConfirm}
            style={iStyle('pwConfirm')} disabled={loading} />
          {fieldErrors.pwConfirm && <p style={logS.fieldErr}>{fieldErrors.pwConfirm}</p>}
        </div>
      </div>

      {/* Kontaktdaten */}
      <p style={{ ...logS.sectionLabel, marginTop: 18 }}>{r.sectionContact}</p>
      <div style={logS.grid2}>
        <div style={logS.inputWrap}>
          <input type="text" value={fields.vorname} autoComplete="given-name"
            onChange={set('vorname')} placeholder={r.placeholderVorname}
            style={iStyle('vorname')} disabled={loading} />
          {fieldErrors.vorname && <p style={logS.fieldErr}>{fieldErrors.vorname}</p>}
        </div>
        <div style={logS.inputWrap}>
          <input type="text" value={fields.nachname} autoComplete="family-name"
            onChange={set('nachname')} placeholder={r.placeholderNachname}
            style={iStyle('nachname')} disabled={loading} />
          {fieldErrors.nachname && <p style={logS.fieldErr}>{fieldErrors.nachname}</p>}
        </div>
      </div>

      <div style={logS.inputWrap}>
        <input type="email" value={fields.email} autoComplete="email"
          onChange={set('email')} placeholder={r.placeholderEmail}
          style={iStyle('email')} disabled={loading} />
        {fieldErrors.email && <p style={logS.fieldErr}>{fieldErrors.email}</p>}
      </div>

      <div style={logS.inputWrap}>
        <input type="text" value={fields.profession} autoComplete="organization-title"
          onChange={set('profession')} placeholder={r.placeholderProfession}
          style={logS.input} disabled={loading} />
      </div>

      <div style={logS.inputWrap}>
        <input type="text" value={fields.grund_besuchs}
          onChange={set('grund_besuchs')} placeholder={r.placeholderGrund}
          style={logS.input} disabled={loading} />
      </div>

      <div style={{ ...logS.inputWrap, marginBottom: 8 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={dialCode}
            onChange={e => setDialCode(e.target.value)}
            style={{ ...logS.input, flex: '0 0 90px', padding: '11px 8px', cursor: 'pointer' }}
            disabled={loading}
          >
            {DIAL_CODES.map(d => (
              <option key={d.code} value={d.code}>{d.label}</option>
            ))}
          </select>
          <input type="tel" value={fields.telefonnummer} autoComplete="tel"
            onChange={set('telefonnummer')} placeholder={r.placeholderTel}
            maxLength={44}
            style={{ ...iStyle('telefonnummer'), flex: 1 }} disabled={loading} />
        </div>
        {fieldErrors.telefonnummer && <p style={logS.fieldErr}>{fieldErrors.telefonnummer}</p>}
        <div style={{ ...logS.underGlow, opacity: err ? 0 : 1 }}></div>
      </div>

      {err && <p style={logS.err}>{err}</p>}

      <div style={{ marginTop: 16, marginBottom: 16, textAlign: 'left' }}>
        <label style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 13, color: 'var(--text-2)', cursor: loading ? 'default' : 'pointer'
        }}>
          <input
            type="checkbox"
            checked={agreeToPrivacy}
            onChange={e => setAgreeToPrivacy(e.target.checked)}
            disabled={loading}
            style={{ cursor: loading ? 'default' : 'pointer' }}
          />
          Ich habe die{' '}
          <a href="#" onClick={e => {
            e.preventDefault();
            if (onNavigate) onNavigate('datenschutz');
          }} style={{ color: 'var(--accent)' }}>
            Datenschutzerklärung
          </a>
          {' '}gelesen und stimme zu
        </label>
        {fieldErrors.agreeToPrivacy && <p style={logS.fieldErr}>{fieldErrors.agreeToPrivacy}</p>}
      </div>

      <button type="submit" style={logS.btn} disabled={loading || !agreeToPrivacy}>
        {loading ? <span style={logS.spinner}></span> : (
          <>{r.btn}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14m-6-6l6 6-6 6"/>
            </svg>
          </>
        )}
      </button>

      <button type="button" onClick={onSwitch} style={logS.switchBtn}>{t.login.switchToLogin}</button>
    </form>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const logS = {
  wrap: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', padding: 24,
  },
  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '48px 40px',
    width: '100%',
    textAlign: 'center',
    animation: 'fadeUp 0.6s cubic-bezier(0,0,0.2,1) both, glowPulse 4s ease-in-out infinite',
    transition: 'max-width 0.35s var(--ease)',
  },
  hex: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: 700, marginBottom: 6 },
  sub: { fontSize: 14, color: 'var(--text-2)', marginBottom: 20 },
  sectionLabel: {
    fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
    textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 10, textAlign: 'left',
  },
  grid2: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 0,
  },
  inputWrap: { position: 'relative', marginBottom: 10 },
  input: {
    width: '100%', padding: '11px 14px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-1)', fontSize: 14, outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'var(--font)',
    boxSizing: 'border-box',
  },
  underGlow: {
    position: 'absolute', bottom: -1, left: '20%', right: '20%',
    height: 2,
    background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
    borderRadius: 1, transition: 'opacity 0.3s',
  },
  err: { color: '#e05050', fontSize: 13, marginBottom: 8, marginTop: -4 },
  fieldErr: { color: '#e05050', fontSize: 11, textAlign: 'left', margin: '3px 0 0 2px' },
  btn: {
    marginTop: 14, width: '100%', padding: '12px 20px',
    background: 'linear-gradient(135deg, var(--accent-dim), var(--accent))',
    border: 'none', borderRadius: 'var(--radius-sm)',
    color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    transition: 'all 0.2s', fontFamily: 'var(--font)',
  },
  switchBtn: {
    marginTop: 14, background: 'none', border: 'none',
    color: 'var(--accent)', fontSize: 13, cursor: 'pointer',
    fontFamily: 'var(--font)', textDecoration: 'underline',
    display: 'block', width: '100%', textAlign: 'center',
  },
  spinner: {
    display: 'inline-block', width: 16, height: 16,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
};

Object.assign(window, { LoginPage });
