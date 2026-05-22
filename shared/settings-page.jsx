/* ═══════════════════════════════════════
   Konto-Einstellungen — Profil + Delete + Export
   ═══════════════════════════════════════ */

const API_BASE = window.APP_CONFIG?.apiBase ?? 'http://localhost:3001';

// ── Profil-Daten laden ────────────────────────────────────────────────────────
function useProfile() {
  const [profile, setProfile] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const token = sessionStorage.getItem('auth_token');
    if (!token) {
      setError('Nicht angemeldet');
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    fetch(`${API_BASE}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(res => res.json())
      .then(json => {
        if (!json.success) throw new Error(json.error ?? 'Fehler beim Laden');
        setProfile(json.data);
      })
      .catch(err => { if (err.name !== 'AbortError') setError(err.message ?? 'Netzwerkfehler'); })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  return { profile, loading, error };
}

// ── Profil-Tab ────────────────────────────────────────────────────────────────
function ProfileTab({ s }) {
  const { profile, loading, error } = useProfile();

  if (loading) {
    return (
      <div style={{ ...s.card, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 20, height: 20, border: '2px solid rgba(77,166,255,0.2)',
          borderTopColor: 'var(--accent)', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite', flexShrink: 0,
        }} />
        <span style={{ fontSize: 14, color: 'var(--text-2)' }}>Profildaten werden geladen…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ ...s.card }}>
        <p style={{ fontSize: 14, color: '#e05050', margin: 0 }}>{error}</p>
      </div>
    );
  }

  const fields = [
    { label: 'Benutzername', value: profile?.username },
    { label: 'Vorname', value: profile?.vorname },
    { label: 'Nachname', value: profile?.nachname },
    { label: 'E-Mail', value: profile?.email },
    { label: 'Telefon', value: profile?.telefonnummer },
    { label: 'Beruf', value: profile?.profession },
    { label: 'Grund des Besuchs', value: profile?.grund_besuchs },
    { label: 'Mitglied seit', value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('de-DE') : null },
  ];

  return (
    <div style={s.card}>
      <h3 style={s.label}>Meine Angaben</h3>
      <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20 }}>
        Diese Daten wurden bei der Registrierung hinterlegt.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {fields.map(({ label, value }) => (
          <div key={label} style={s.profileField}>
            <span style={s.fieldLabel}>{label}</span>
            <span style={s.fieldValue}>{value || <em style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>—</em>}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Sicherheit-Tab ────────────────────────────────────────────────────────────
function SecurityTab({ s, onLogout }) {
  const [deleteModal, setDeleteModal] = React.useState(false);
  const [deletePassword, setDeletePassword] = React.useState('');
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState('');

  async function handleDelete() {
    if (!deletePassword.trim()) {
      setDeleteError('Passwort erforderlich');
      return;
    }
    setDeleteLoading(true);
    setDeleteError('');
    try {
      const token = sessionStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE}/api/auth/account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ password: deletePassword }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setDeleteError(json.error ?? 'Löschung fehlgeschlagen');
        return;
      }
      onLogout();
    } catch {
      setDeleteError('Netzwerkfehler');
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <>
      <div style={s.card}>
        <h3 style={s.label}>Account-Sicherheit</h3>
        <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>
          Dein Konto ist mit Benutzername und Passwort geschützt. Du kannst Dein Konto
          hier dauerhaft löschen. Diese Aktion ist unwiderruflich (Art. 17 DSGVO).
        </p>
        <button
          onClick={() => setDeleteModal(true)}
          style={{ ...s.btn, ...s.btnDanger }}
        >
          Konto löschen
        </button>
      </div>

      {deleteModal && (
        <div style={s.modal} onClick={() => !deleteLoading && setDeleteModal(false)}>
          <div style={s.modalContent} onClick={e => e.stopPropagation()}>
            <h2 style={s.modalTitle}>Konto wirklich löschen?</h2>
            <p style={s.modalText}>
              Diese Aktion kann nicht rückgängig gemacht werden.
              Alle Deine Daten werden dauerhaft gelöscht.
            </p>
            <div style={s.section}>
              <label style={s.label}>Passwort zur Bestätigung</label>
              <input
                type="password"
                value={deletePassword}
                onChange={e => { setDeletePassword(e.target.value); setDeleteError(''); }}
                placeholder="Gib Dein Passwort ein"
                style={s.input}
                disabled={deleteLoading}
              />
              {deleteError && <p style={s.error}>{deleteError}</p>}
            </div>
            <div style={s.modalButtons}>
              <button
                onClick={() => setDeleteModal(false)}
                style={{ ...s.btn, flex: 1, background: 'var(--bg-surface)', color: 'var(--text-1)' }}
                disabled={deleteLoading}
              >
                Abbrechen
              </button>
              <button
                onClick={handleDelete}
                style={{ ...s.btn, ...s.btnDanger, flex: 1 }}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Wird gelöscht…' : 'Löschen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Daten-Tab ─────────────────────────────────────────────────────────────────
function DataTab({ s }) {
  const [exportLoading, setExportLoading] = React.useState(false);

  async function handleExport() {
    setExportLoading(true);
    try {
      const token = sessionStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE}/api/auth/export`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert('Export fehlgeschlagen: ' + (json.error ?? 'Unbekannter Fehler'));
        return;
      }
      const blob = new Blob([JSON.stringify(json.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meine-daten-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert('Export fehlgeschlagen: Netzwerkfehler');
    } finally {
      setExportLoading(false);
    }
  }

  return (
    <div style={s.card}>
      <h3 style={s.label}>Datenexport</h3>
      <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>
        Lade eine Kopie aller Deiner gespeicherten Daten herunter (Art. 20 DSGVO).
        Die Datei wird im JSON-Format bereitgestellt.
      </p>
      <button
        onClick={handleExport}
        style={{ ...s.btn, ...s.btnPrimary }}
        disabled={exportLoading}
      >
        {exportLoading ? 'Wird exportiert…' : 'Daten exportieren'}
      </button>
    </div>
  );
}

// ── Haupt-Komponente ──────────────────────────────────────────────────────────
function SettingsPage({ onBack, onLogout }) {
  const [activeTab, setActiveTab] = React.useState('profile');

  const s = {
    wrap: { minHeight: '100vh', background: 'var(--bg-primary)', padding: '24px' },
    container: { maxWidth: 800, margin: '0 auto' },
    title: { fontSize: 24, fontWeight: 700, marginBottom: 8, color: 'var(--text-1)' },
    sub: { fontSize: 13, color: 'var(--text-2)', marginBottom: 24 },
    tabs: { display: 'flex', gap: 12, marginBottom: 24, borderBottom: '1px solid var(--border)' },
    tab: {
      padding: '12px 0', marginRight: 8, fontSize: 14, fontWeight: 600,
      background: 'none', border: 'none', cursor: 'pointer',
      color: 'var(--text-2)', borderBottom: '2px solid transparent',
      transition: 'all 0.2s',
    },
    tabActive: { color: 'var(--accent)', borderBottomColor: 'var(--accent)' },
    card: {
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: 24, marginBottom: 20,
    },
    section: { marginBottom: 24 },
    label: {
      display: 'block', fontSize: 12, fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.08em',
      color: 'var(--accent)', marginBottom: 8,
    },
    profileField: {
      display: 'flex', flexDirection: 'column', gap: 4,
      padding: '12px 16px',
      background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--border)',
    },
    fieldLabel: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)' },
    fieldValue: { fontSize: 14, color: 'var(--text-1)', wordBreak: 'break-all' },
    input: {
      width: '100%', maxWidth: '100%', padding: '10px 12px',
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)', fontSize: 14,
      fontFamily: 'var(--font)', color: 'var(--text-1)', boxSizing: 'border-box',
    },
    btn: {
      padding: '12px 24px', fontSize: 14, fontWeight: 600,
      borderRadius: 'var(--radius-sm)', border: 'none',
      cursor: 'pointer', fontFamily: 'var(--font)', transition: 'all 0.2s',
    },
    btnPrimary: { background: 'var(--accent)', color: '#fff' },
    btnDanger: {
      background: 'rgba(224,80,80,0.1)', color: '#e05050',
      border: '1px solid rgba(224,80,80,0.3)',
    },
    error: { color: '#e05050', fontSize: 13, marginTop: 8 },
    modal: {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    },
    modalContent: {
      background: 'var(--bg-card)', borderRadius: 'var(--radius)',
      padding: 32, maxWidth: 400, width: '90%', textAlign: 'center',
      border: '1px solid var(--border)',
    },
    modalTitle: { fontSize: 18, fontWeight: 700, marginBottom: 12, color: 'var(--text-1)' },
    modalText: { fontSize: 14, color: 'var(--text-2)', marginBottom: 20, lineHeight: 1.5 },
    modalButtons: { display: 'flex', gap: 12 },
  };

  const tabs = [
    { id: 'profile', label: 'Profil' },
    { id: 'security', label: 'Sicherheit' },
    { id: 'data', label: 'Meine Daten' },
  ];

  return (
    <div style={s.wrap}>
      <NavBar onBack={onBack} onLogout={onLogout} title="Einstellungen" />
      <div style={s.container}>
        <h1 style={s.title}>Konto-Einstellungen</h1>
        <p style={s.sub}>Verwalte Dein Konto und Deine Daten</p>

        <div style={s.tabs}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{ ...s.tab, ...(activeTab === t.id ? s.tabActive : {}) }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'profile'   && <ProfileTab  s={s} />}
        {activeTab === 'security'  && <SecurityTab s={s} onLogout={onLogout} />}
        {activeTab === 'data'      && <DataTab     s={s} />}
      </div>
    </div>
  );
}
