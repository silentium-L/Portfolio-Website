/* login.jsx – Login & mehrstufige Registrierung (3-Schritt-Wizard) */

const GYM_API = window.__GYM_API_BASE ?? 'http://localhost:3001';

// ── Schritt-Fortschrittsanzeige ────────────────────────────────────────────────
function StepIndicator({ current, labels }) {
  const total = labels.length;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', marginBottom: 24 }}>
      {labels.map((label, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <React.Fragment key={step}>
            {i > 0 && (
              <div style={{
                flex: 1, height: 2, maxWidth: 36, marginTop: 15,
                background: done ? 'var(--accent)' : 'var(--border)',
                transition: 'background 0.3s ease',
              }} />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, minWidth: 56 }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: done || active ? 'var(--accent)' : 'var(--bg-elevated)',
                border: done || active ? 'none' : '1.5px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-display)',
                color: done || active ? '#fff' : 'var(--text-tertiary)',
                transition: 'all 0.3s ease', flexShrink: 0,
              }}>
                {done
                  ? <Icon name="check" size={13} strokeWidth={2.5} />
                  : step
                }
              </div>
              <span style={{
                fontSize: 10, fontFamily: 'var(--font-display)', fontWeight: active ? 600 : 400,
                color: active ? 'var(--accent-light)' : done ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                whiteSpace: 'nowrap', transition: 'color 0.3s ease',
              }}>
                {label}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Geschlecht-Chips ───────────────────────────────────────────────────────────
function GeschlechtSelector({ value, onChange }) {
  const opts = ['männlich', 'weiblich', 'divers', 'keine Angabe'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>
        Geschlecht{' '}
        <span style={{ color: 'var(--text-tertiary)', fontSize: 11, fontWeight: 400 }}>(optional)</span>
      </label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {opts.map(opt => (
          <button key={opt} type="button"
            onClick={() => onChange(value === opt ? '' : opt)}
            style={{
              padding: '7px 13px', borderRadius: 'var(--radius-full)',
              fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 500,
              cursor: 'pointer', transition: 'var(--transition-fast)',
              background: value === opt ? 'var(--accent)' : 'var(--bg-elevated)',
              color: value === opt ? '#fff' : 'var(--text-secondary)',
              border: value === opt ? '1px solid transparent' : '1px solid var(--border)',
            }}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Registrierungs-Wizard ──────────────────────────────────────────────────────
function RegisterWizard({ onSuccess, onCancel }) {
  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  // Step 1: Zugangsdaten
  const [username, setUsername] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [pwConfirm, setPwConfirm] = React.useState('');

  // Step 2: Persönliche Daten
  const [vorname, setVorname] = React.useState('');
  const [nachname, setNachname] = React.useState('');
  const [tel, setTel] = React.useState('');

  // Step 3: Fitness-Profil (alle optional)
  const [geburtsdatum, setGeburtsdatum] = React.useState('');
  const [geschlecht, setGeschlecht] = React.useState('');
  const [groesse, setGroesse] = React.useState('');
  const [startgewicht, setStartgewicht] = React.useState('');
  const [zielgewicht, setZielgewicht] = React.useState('');

  function clearError() { setError(''); }

  function validateStep1() {
    if (!username.trim()) return 'Benutzername erforderlich.';
    if (username.trim().length < 3) return 'Benutzername: mindestens 3 Zeichen.';
    if (!/^[a-zA-Z0-9_-]+$/.test(username.trim())) return 'Benutzername: nur Buchstaben, Zahlen, _ und - erlaubt.';
    if (!email.trim() || !email.includes('@')) return 'Gültige E-Mail-Adresse erforderlich.';
    if (!password) return 'Passwort erforderlich.';
    if (password.length < 6) return 'Passwort: mindestens 6 Zeichen.';
    if (password !== pwConfirm) return 'Passwörter stimmen nicht überein.';
    return null;
  }

  function validateStep2() {
    if (!vorname.trim()) return 'Vorname erforderlich.';
    if (!nachname.trim()) return 'Nachname erforderlich.';
    if (!tel.trim()) return 'Telefonnummer erforderlich.';
    return null;
  }

  function goNext() {
    const err = step === 1 ? validateStep1() : step === 2 ? validateStep2() : null;
    if (err) { setError(err); return; }
    setError('');
    setStep(s => s + 1);
  }

  function goBack() {
    setError('');
    setStep(s => s - 1);
  }

  async function handleSubmit() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${GYM_API}/api/gym/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username:        username.trim(),
          email:           email.trim().toLowerCase(),
          password,
          vorname:         vorname.trim(),
          nachname:        nachname.trim(),
          telefonnummer:   tel.trim(),
          geburtsdatum:    geburtsdatum || null,
          geschlecht:      geschlecht   || null,
          groesse_cm:      groesse      ? parseFloat(groesse)      : null,
          startgewicht_kg: startgewicht ? parseFloat(startgewicht) : null,
          zielgewicht_kg:  zielgewicht  ? parseFloat(zielgewicht)  : null,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? 'Registrierung fehlgeschlagen');
        return;
      }
      sessionStorage.setItem('gym_token', json.data.token);
      onSuccess(json.data.user);
    } catch {
      setError('Server nicht erreichbar. Bitte prüfe deine Verbindung.');
    } finally {
      setLoading(false);
    }
  }

  const STEP_LABELS = ['Konto', 'Persönlich', 'Fitness'];

  const s = {
    form: { display: 'flex', flexDirection: 'column', gap: 14 },
    row:  { display: 'flex', gap: 12 },
    nav:  { display: 'flex', gap: 10, marginTop: 4 },
    errorBox: {
      padding: '10px 14px', borderRadius: 'var(--radius-sm)',
      background: 'var(--danger-bg)', color: 'var(--danger)',
      fontSize: 13, border: '1px solid rgba(248,113,113,0.2)',
    },
    switchLink: {
      marginTop: 6, background: 'none', border: 'none',
      color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer',
      fontFamily: 'inherit', width: '100%', textAlign: 'center',
      textDecoration: 'underline', padding: '6px 0',
    },
  };

  return (
    <div>
      <StepIndicator current={step} labels={STEP_LABELS} />

      {step === 1 && (
        <div style={s.form}>
          <h3 style={{ margin: '0 0 2px', fontSize: 15, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>Zugangsdaten</h3>
          <Input label="Benutzername" value={username} onChange={v => { setUsername(v); clearError(); }} placeholder="max_muster" icon="user" />
          <Input label="E-Mail" type="email" value={email} onChange={v => { setEmail(v); clearError(); }} placeholder="max@example.com" />
          <Input label="Passwort" type="password" value={password} onChange={v => { setPassword(v); clearError(); }} placeholder="Mindestens 6 Zeichen" />
          <Input label="Passwort bestätigen" type="password" value={pwConfirm} onChange={v => { setPwConfirm(v); clearError(); }} placeholder="••••••••" />
          {error && <div style={s.errorBox}>{error}</div>}
          <div style={s.nav}>
            <Button variant="secondary" onClick={onCancel} style={{ flex: 1 }}>Abbrechen</Button>
            <Button variant="primary" onClick={goNext} style={{ flex: 2 }}>Weiter →</Button>
          </div>
          <button type="button" onClick={onCancel} style={s.switchLink}>
            Zurück zur Anmeldung
          </button>
        </div>
      )}

      {step === 2 && (
        <div style={s.form}>
          <h3 style={{ margin: '0 0 2px', fontSize: 15, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>Persönliche Daten</h3>
          <div style={s.row}>
            <Input label="Vorname" value={vorname} onChange={v => { setVorname(v); clearError(); }} placeholder="Max" />
            <Input label="Nachname" value={nachname} onChange={v => { setNachname(v); clearError(); }} placeholder="Muster" />
          </div>
          <Input label="Telefonnummer" type="tel" value={tel} onChange={v => { setTel(v); clearError(); }} placeholder="+49 170 1234567" />
          {error && <div style={s.errorBox}>{error}</div>}
          <div style={s.nav}>
            <Button variant="secondary" onClick={goBack} style={{ flex: 1 }}>← Zurück</Button>
            <Button variant="primary" onClick={goNext} style={{ flex: 2 }}>Weiter →</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={s.form}>
          <div>
            <h3 style={{ margin: '0 0 3px', fontSize: 15, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>Fitness-Profil</h3>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)' }}>Alle Felder optional — jederzeit im Profil anpassbar</p>
          </div>
          <Input label="Geburtsdatum" type="date" value={geburtsdatum} onChange={v => setGeburtsdatum(v)} />
          <GeschlechtSelector value={geschlecht} onChange={setGeschlecht} />
          <div style={s.row}>
            <Input label="Größe (cm)" type="number" value={groesse} onChange={v => setGroesse(v)} placeholder="175" />
            <Input label="Startgewicht (kg)" type="number" value={startgewicht} onChange={v => setStartgewicht(v)} placeholder="80" />
          </div>
          <Input label="Zielgewicht (kg)" type="number" value={zielgewicht} onChange={v => setZielgewicht(v)} placeholder="75" />
          {error && <div style={s.errorBox}>{error}</div>}
          <div style={s.nav}>
            <Button variant="secondary" onClick={goBack} style={{ flex: 1 }} disabled={loading}>← Zurück</Button>
            <Button variant="primary" onClick={handleSubmit} style={{ flex: 2, opacity: loading ? 0.7 : 1 }} disabled={loading}>
              {loading ? 'Konto wird erstellt…' : 'Konto erstellen'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Login-Screen (Haupt-Komponente) ────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [mode, setMode] = React.useState('login');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [identifier, setIdentifier] = React.useState('');
  const [password, setPassword] = React.useState('');

  function resetError() { setError(''); }

  async function handleLogin(e) {
    if (e?.preventDefault) e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('Bitte alle Felder ausfüllen.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${GYM_API}/api/gym/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? 'Anmeldung fehlgeschlagen');
        return;
      }
      sessionStorage.setItem('gym_token', json.data.token);
      onLogin(json.data.user);
    } catch {
      setError('Server nicht erreichbar. Bitte prüfe deine Verbindung.');
    } finally {
      setLoading(false);
    }
  }

  const s = {
    wrapper: {
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: '100%', height: '100%',
      background: 'radial-gradient(ellipse at 30% 20%, rgba(139,92,246,0.12) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(124,58,237,0.08) 0%, transparent 50%), var(--bg-base)',
      overflow: 'auto',
    },
    card: {
      width: '100%', maxWidth: 440, padding: '40px 36px',
      background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)',
      border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)',
      animation: 'scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      margin: 16,
    },
    logo: {
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 28,
    },
    logoIcon: {
      width: 52, height: 52, borderRadius: 14,
      background: 'linear-gradient(135deg, var(--accent-dark), var(--accent-light))',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 4px 20px rgba(139,92,246,0.35)',
    },
    form: { display: 'flex', flexDirection: 'column', gap: 14 },
    switchLink: {
      marginTop: 6, background: 'none', border: 'none',
      color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer',
      fontFamily: 'inherit', width: '100%', textAlign: 'center',
      textDecoration: 'underline', padding: '6px 0',
    },
    errorBox: {
      padding: '10px 14px', borderRadius: 'var(--radius-sm)',
      background: 'var(--danger-bg)', color: 'var(--danger)',
      fontSize: 13, border: '1px solid rgba(248,113,113,0.2)',
    },
  };

  return (
    <div style={s.wrapper}>
      <div style={s.card}>
        <div style={s.logo}>
          <div style={s.logoIcon}>
            <Icon name="zap" size={26} color="#fff" strokeWidth={2.2} />
          </div>
          <h1 style={{ fontSize: 22, letterSpacing: '-0.03em', margin: 0 }}>GymTracker</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
            {mode === 'login' ? 'Willkommen zurück' : 'Konto erstellen'}
          </p>
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleLogin} style={s.form}>
            <Input
              label="Benutzername oder E-Mail"
              value={identifier}
              onChange={v => { setIdentifier(v); resetError(); }}
              placeholder="max_muster oder max@example.com"
              icon="user"
            />
            <Input
              label="Passwort"
              type="password"
              value={password}
              onChange={v => { setPassword(v); resetError(); }}
              placeholder="••••••••"
            />
            {error && <div style={s.errorBox}>{error}</div>}
            <Button
              variant="primary"
              onClick={handleLogin}
              style={{ width: '100%', marginTop: 4, padding: '13px 24px', fontSize: 14, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Anmelden…' : 'Anmelden'}
            </Button>
            <button type="button" onClick={() => { setMode('register'); setError(''); }} style={s.switchLink}>
              Noch kein Konto? Registrieren
            </button>
          </form>
        ) : (
          <RegisterWizard
            onSuccess={onLogin}
            onCancel={() => { setMode('login'); setError(''); }}
          />
        )}
      </div>
    </div>
  );
}

Object.assign(window, { LoginScreen });
