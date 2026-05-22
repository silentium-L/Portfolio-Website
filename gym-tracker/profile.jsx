/* profile.jsx – Profile & Settings screen */

function DeleteAccountModal({ onClose, onConfirmed }) {
  const GYM_API = window.__GYM_API_BASE ?? 'http://localhost:3001';
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  async function handleDelete() {
    if (!password) { setError('Passwort erforderlich'); return; }
    setLoading(true);
    setError('');
    try {
      const token = sessionStorage.getItem('gym_token');
      const res = await fetch(`${GYM_API}/api/gym/auth/account`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (!json.success) { setError(json.error ?? 'Löschen fehlgeschlagen'); return; }
      sessionStorage.removeItem('gym_token');
      localStorage.removeItem('gym_profile_data');
      onConfirmed();
    } catch {
      setError('Netzwerkfehler — bitte erneut versuchen');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 20,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
        border: '1px solid rgba(248,113,113,0.3)', padding: 28,
        maxWidth: 380, width: '100%',
        display: 'flex', flexDirection: 'column', gap: 20,
        animation: 'fadeIn 0.2s ease',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="trash" size={24} color="var(--danger)" />
          </div>
          <h3 style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 700 }}>Account wirklich löschen?</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Diese Aktion ist <strong style={{ color: 'var(--danger)' }}>unwiderruflich</strong>. Dein Profil und alle serverseitig gespeicherten Daten werden dauerhaft gelöscht (Art. 17 DSGVO).
          </p>
        </div>

        <Input
          label="Passwort zur Bestätigung"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="Dein aktuelles Passwort"
        />

        {error && (
          <div style={{ fontSize: 13, color: 'var(--danger)', background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="ghost" style={{ flex: 1 }} onClick={onClose} disabled={loading}>
            Abbrechen
          </Button>
          <Button variant="danger" style={{ flex: 1 }} onClick={handleDelete} disabled={loading || !password}>
            {loading ? 'Löschen...' : 'Account löschen'}
          </Button>
        </div>
      </div>
    </div>
  );
}

const KG_TO_LBS = 2.20462;
const CM_TO_IN  = 0.393701;

function kgToLbs(kg)  { return +(kg  * KG_TO_LBS).toFixed(1); }
function lbsToKg(lbs) { return +(lbs / KG_TO_LBS).toFixed(2); }
function cmToIn(cm)   { return +(cm  * CM_TO_IN).toFixed(1);  }
function inToCm(inch) { return +(inch / CM_TO_IN).toFixed(1); }

function toDisplayWeight(kg,  imperial) { return imperial ? kgToLbs(kg)  : kg;  }
function toDisplayLength(cm,  imperial) { return imperial ? cmToIn(cm)   : cm;  }
function toMetricWeight(val,  imperial) { return imperial ? lbsToKg(val) : +val; }
function toMetricLength(val,  imperial) { return imperial ? inToCm(val)  : +val; }

function ProfileScreen({ user, onLogout, theme, onThemeToggle, unitSystem, onUnitSystemToggle }) {
  const GYM_API = window.__GYM_API_BASE ?? 'http://localhost:3001';
  const mockUser = MOCK_USER;

  const [profileData, setProfileData] = React.useState(() => {
    const stored = loadProfile();
    return {
      vorname:         user?.vorname || stored?.vorname || '',
      nachname:        stored?.nachname || '',
      geburtsdatum:    stored?.geburtsdatum || null,
      geschlecht:      stored?.geschlecht || null,
      groesse_cm:      stored?.groesse_cm ?? null,
      startgewicht_kg: stored?.startgewicht_kg ?? null,
      zielgewicht_kg:  stored?.zielgewicht_kg ?? null,
      goalWorkouts:    stored?.goalWorkouts ?? mockUser.goals.weeklyWorkouts,
    };
  });

  const [editMode, setEditMode] = React.useState(false);
  const [editVorname, setEditVorname] = React.useState(profileData.vorname);
  const [editNachname, setEditNachname] = React.useState(profileData.nachname);
  const [editGeburtsdatum, setEditGeburtsdatum] = React.useState(profileData.geburtsdatum || '');
  const [editGeschlecht, setEditGeschlecht] = React.useState(profileData.geschlecht || '');
  const [editGroesseCm, setEditGroesseCm] = React.useState(profileData.groesse_cm != null ? profileData.groesse_cm.toString() : '');
  const [editStartgewicht, setEditStartgewicht] = React.useState(profileData.startgewicht_kg != null ? profileData.startgewicht_kg.toString() : '');
  const [editZielgewicht, setEditZielgewicht] = React.useState(profileData.zielgewicht_kg != null ? profileData.zielgewicht_kg.toString() : '');
  const [editGoalWorkouts, setEditGoalWorkouts] = React.useState(profileData.goalWorkouts.toString());
  const [saveError, setSaveError] = React.useState('');

  const [showAppSettings, setShowAppSettings] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [exportLoading, setExportLoading] = React.useState(false);
  const [exportError, setExportError] = React.useState('');

  // ── Measurements ────────────────────────────────────────────────────────────
  const [measurements, setMeasurements] = React.useState(null);
  const [showMeasureForm, setShowMeasureForm] = React.useState(false);
  const [mDate, setMDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [mWeight, setMWeight] = React.useState('');
  const [mChest, setMChest] = React.useState('');
  const [mWaist, setMWaist] = React.useState('');
  const [mHips, setMHips] = React.useState('');
  const [mBicep, setMBicep] = React.useState('');
  const [mThigh, setMThigh] = React.useState('');
  const [mNotes, setMNotes] = React.useState('');
  const [mSaving, setMSaving] = React.useState(false);
  const [mError, setMError] = React.useState('');
  const [mEditId, setMEditId] = React.useState(null);

  const isImperial = unitSystem === 'imperial';
  const weightUnit = isImperial ? 'lbs' : 'kg';
  const lengthUnit = isImperial ? 'in'  : 'cm';

  React.useEffect(() => {
    const token = sessionStorage.getItem('gym_token');
    if (!token) return;
    fetch(`${GYM_API}/api/gym/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(json => {
        if (!json.success) return;
        const d = json.data;
        const updated = {
          vorname:         d.vorname || '',
          nachname:        d.nachname || '',
          geburtsdatum:    d.geburtsdatum ? d.geburtsdatum.slice(0, 10) : null,
          geschlecht:      d.geschlecht || null,
          groesse_cm:      d.groesse_cm != null ? parseFloat(d.groesse_cm) : null,
          startgewicht_kg: d.startgewicht_kg != null ? parseFloat(d.startgewicht_kg) : null,
          zielgewicht_kg:  d.zielgewicht_kg != null ? parseFloat(d.zielgewicht_kg) : null,
          goalWorkouts:    profileData.goalWorkouts,
        };
        setProfileData(updated);
        saveProfile(updated);
      })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    const token = sessionStorage.getItem('gym_token');
    if (!token) { setMeasurements([]); return; }
    fetchMeasurements(GYM_API, token)
      .then(data => setMeasurements(data))
      .catch(() => setMeasurements([]));
  }, []);

  // Resolve display values: API data takes priority over localStorage/mock
  const toNum = v => v == null ? null : parseFloat(v);
  const apiLatest = measurements && measurements.length > 0 ? measurements[0] : null;
  const apiFirst  = measurements && measurements.length > 0 ? measurements[measurements.length - 1] : null;
  const mockLatest = BODY_MEASUREMENTS[BODY_MEASUREMENTS.length - 1];
  const mockFirst  = BODY_MEASUREMENTS[0];

  function getVal(apiKey, mockObj, mockKey) {
    const apiVal = apiLatest ? toNum(apiLatest[apiKey]) : null;
    return apiVal ?? (mockObj ? mockObj[mockKey] : null);
  }
  function getFirstVal(apiKey, mockObj, mockKey) {
    const apiVal = apiFirst ? toNum(apiFirst[apiKey]) : null;
    return apiVal ?? (mockObj ? mockObj[mockKey] : null);
  }

  function resetMeasureForm() {
    setMWeight(''); setMChest(''); setMWaist(''); setMHips('');
    setMBicep(''); setMThigh(''); setMNotes('');
    setMDate(new Date().toISOString().slice(0, 10));
    setMEditId(null);
    setMError('');
  }

  function openMeasureForm() {
    if (showMeasureForm) {
      setShowMeasureForm(false);
      resetMeasureForm();
      return;
    }
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayEntry = (measurements ?? []).find(m => m.recorded_at.slice(0, 10) === todayStr);
    if (todayEntry) {
      setMEditId(todayEntry.id);
      setMDate(todayStr);
      setMWeight(todayEntry.weight_kg != null ? String(toDisplayWeight(parseFloat(todayEntry.weight_kg), isImperial)) : '');
      setMChest( todayEntry.chest_cm  != null ? String(toDisplayLength(parseFloat(todayEntry.chest_cm),  isImperial)) : '');
      setMWaist( todayEntry.waist_cm  != null ? String(toDisplayLength(parseFloat(todayEntry.waist_cm),  isImperial)) : '');
      setMHips(  todayEntry.hips_cm   != null ? String(toDisplayLength(parseFloat(todayEntry.hips_cm),   isImperial)) : '');
      setMBicep( todayEntry.bicep_cm  != null ? String(toDisplayLength(parseFloat(todayEntry.bicep_cm),  isImperial)) : '');
      setMThigh( todayEntry.thigh_cm  != null ? String(toDisplayLength(parseFloat(todayEntry.thigh_cm),  isImperial)) : '');
      setMNotes( todayEntry.notes ?? '');
    } else {
      resetMeasureForm();
    }
    setShowMeasureForm(true);
    setMError('');
  }

  async function handleSaveMeasurement() {
    const payload = {};
    if (mWeight) payload.weight_kg = toMetricWeight(parseFloat(mWeight), isImperial);
    if (mChest)  payload.chest_cm  = toMetricLength(parseFloat(mChest),  isImperial);
    if (mWaist)  payload.waist_cm  = toMetricLength(parseFloat(mWaist),  isImperial);
    if (mHips)   payload.hips_cm   = toMetricLength(parseFloat(mHips),   isImperial);
    if (mBicep)  payload.bicep_cm  = toMetricLength(parseFloat(mBicep),  isImperial);
    if (mThigh)  payload.thigh_cm  = toMetricLength(parseFloat(mThigh),  isImperial);
    if (mNotes.trim()) payload.notes = mNotes.trim();

    if (Object.keys(payload).filter(k => k !== 'notes').length === 0) {
      setMError('Mindestens ein Messwert erforderlich');
      return;
    }
    payload.recorded_at = new Date(mDate + 'T12:00:00Z').toISOString();

    setMSaving(true);
    setMError('');
    try {
      const token = sessionStorage.getItem('gym_token');
      if (mEditId) {
        const updated = await updateMeasurement(GYM_API, token, mEditId, payload);
        setMeasurements(prev => (prev ?? []).map(m => m.id === mEditId ? updated : m));
      } else {
        const newEntry = await saveMeasurement(GYM_API, token, payload);
        setMeasurements(prev => [newEntry, ...(prev ?? [])]);
      }
      setShowMeasureForm(false);
      resetMeasureForm();
    } catch (err) {
      setMError(err.message ?? 'Speichern fehlgeschlagen');
    } finally {
      setMSaving(false);
    }
  }

  async function handleDeleteMeasurement(id) {
    const token = sessionStorage.getItem('gym_token');
    try {
      await deleteMeasurement(GYM_API, token, id);
      setMeasurements(prev => (prev ?? []).filter(m => m.id !== id));
    } catch { /* silent — retry option not needed for list delete */ }
  }

  const displayName = [profileData.vorname, profileData.nachname].filter(Boolean).join(' ') || user?.username || mockUser.name;
  const displayEmail = user?.email || mockUser.email;
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
    : new Date(mockUser.joined).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  const HISTORICAL_WORKOUTS_BEFORE_TRACKING = 24;
  const totalWorkouts = RECENT_WORKOUTS.length + HISTORICAL_WORKOUTS_BEFORE_TRACKING;

  function openEdit() {
    setEditVorname(profileData.vorname);
    setEditNachname(profileData.nachname);
    setEditGeburtsdatum(profileData.geburtsdatum || '');
    setEditGeschlecht(profileData.geschlecht || '');
    setEditGroesseCm(profileData.groesse_cm != null ? String(toDisplayLength(profileData.groesse_cm, isImperial)) : '');
    setEditStartgewicht(profileData.startgewicht_kg != null ? String(toDisplayWeight(profileData.startgewicht_kg, isImperial)) : '');
    setEditZielgewicht(profileData.zielgewicht_kg != null ? String(toDisplayWeight(profileData.zielgewicht_kg, isImperial)) : '');
    setEditGoalWorkouts(profileData.goalWorkouts.toString());
    setSaveError('');
    setEditMode(true);
  }

  async function handleSaveProfile() {
    setSaveError('');
    const token = sessionStorage.getItem('gym_token');
    const payload = {
      vorname:         editVorname.trim() || undefined,
      nachname:        editNachname.trim() || undefined,
      geburtsdatum:    editGeburtsdatum || null,
      geschlecht:      editGeschlecht || null,
      groesse_cm:      editGroesseCm ? toMetricLength(parseFloat(editGroesseCm), isImperial) : null,
      startgewicht_kg: editStartgewicht ? toMetricWeight(parseFloat(editStartgewicht), isImperial) : null,
      zielgewicht_kg:  editZielgewicht ? toMetricWeight(parseFloat(editZielgewicht), isImperial) : null,
    };
    Object.keys(payload).forEach(k => { if (payload[k] === undefined) delete payload[k]; });

    try {
      let updated;
      if (token) {
        const res = await fetch(`${GYM_API}/api/gym/auth/me`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!json.success) { setSaveError(json.error ?? 'Speichern fehlgeschlagen'); return; }
        const d = json.data;
        updated = {
          vorname:         d.vorname || '',
          nachname:        d.nachname || '',
          geburtsdatum:    d.geburtsdatum ? d.geburtsdatum.slice(0, 10) : null,
          geschlecht:      d.geschlecht || null,
          groesse_cm:      d.groesse_cm != null ? parseFloat(d.groesse_cm) : null,
          startgewicht_kg: d.startgewicht_kg != null ? parseFloat(d.startgewicht_kg) : null,
          zielgewicht_kg:  d.zielgewicht_kg != null ? parseFloat(d.zielgewicht_kg) : null,
          goalWorkouts:    parseInt(editGoalWorkouts) || profileData.goalWorkouts,
        };
      } else {
        updated = {
          vorname:         editVorname.trim(),
          nachname:        editNachname.trim(),
          geburtsdatum:    editGeburtsdatum || null,
          geschlecht:      editGeschlecht || null,
          groesse_cm:      editGroesseCm ? toMetricLength(parseFloat(editGroesseCm), isImperial) : null,
          startgewicht_kg: editStartgewicht ? toMetricWeight(parseFloat(editStartgewicht), isImperial) : null,
          zielgewicht_kg:  editZielgewicht ? toMetricWeight(parseFloat(editZielgewicht), isImperial) : null,
          goalWorkouts:    parseInt(editGoalWorkouts) || profileData.goalWorkouts,
        };
      }
      saveProfile(updated);
      setProfileData(updated);
      setEditMode(false);
    } catch {
      setSaveError('Netzwerkfehler — bitte erneut versuchen');
    }
  }

  async function handleExport() {
    setExportLoading(true);
    setExportError('');
    try {
      const token = sessionStorage.getItem('gym_token');
      const res = await fetch(`${GYM_API}/api/gym/auth/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!json.success) {
        setExportError(json.error ?? 'Export fehlgeschlagen');
        return;
      }
      const blob = new Blob([JSON.stringify(json.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gymtracker-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setExportError('Netzwerkfehler — bitte erneut versuchen');
    } finally {
      setExportLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeIn 0.4s ease' }}>
      {showDeleteModal && (
        <DeleteAccountModal
          onClose={() => setShowDeleteModal(false)}
          onConfirmed={onLogout}
        />
      )}

      {/* Profile header */}
      <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '32px 24px',
        background: 'linear-gradient(180deg, rgba(139,92,246,0.1) 0%, var(--bg-card) 100%)' }}>
        <Avatar name={displayName} size={72} />
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 22 }}>{displayName}</h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>{displayEmail}</p>
        </div>
        <div style={{ display: 'flex', gap: 24, marginTop: 8 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--accent)' }}>{totalWorkouts}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Workouts</div>
          </div>
          <div style={{ width: 1, background: 'var(--border)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--warning)' }}>{WEEK_SUMMARY.streak}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Tage Streak</div>
          </div>
          <div style={{ width: 1, background: 'var(--border)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--success)' }}>{PERSONAL_RECORDS.length}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>PRs</div>
          </div>
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Mitglied seit {memberSince}</span>
      </Card>

      {/* Body Stats */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 16 }}>Körperdaten</h3>
          <Button
            variant="ghost" size="sm"
            icon={editMode ? 'check' : 'edit'}
            onClick={editMode ? handleSaveProfile : openEdit}
          >
            {editMode ? 'Speichern' : 'Bearbeiten'}
          </Button>
        </div>

        {editMode ? (
          <Card style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Vorname" type="text" value={editVorname} onChange={setEditVorname} />
              <Input label="Nachname" type="text" value={editNachname} onChange={setEditNachname} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Geburtsdatum" type="date" value={editGeburtsdatum} onChange={setEditGeburtsdatum} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Geschlecht</span>
                <select
                  value={editGeschlecht}
                  onChange={e => setEditGeschlecht(e.target.value)}
                  style={{
                    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)', color: editGeschlecht ? 'var(--text-primary)' : 'var(--text-tertiary)',
                    fontSize: 14, padding: '10px 12px', width: '100%',
                    fontFamily: 'inherit', outline: 'none', cursor: 'pointer',
                  }}
                >
                  <option value="">Keine Angabe</option>
                  <option value="männlich">Männlich</option>
                  <option value="weiblich">Weiblich</option>
                  <option value="divers">Divers</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label={`Körpergröße (${lengthUnit})`} type="number" value={editGroesseCm} onChange={setEditGroesseCm} />
              <Input label={`Startgewicht (${weightUnit})`} type="number" value={editStartgewicht} onChange={setEditStartgewicht} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label={`Zielgewicht (${weightUnit})`} type="number" value={editZielgewicht} onChange={setEditZielgewicht} />
              <Input label="Workouts / Woche" type="number" value={editGoalWorkouts} onChange={setEditGoalWorkouts} />
            </div>
            {saveError && (
              <div style={{ fontSize: 13, color: 'var(--danger)', background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>
                {saveError}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="ghost" size="sm" onClick={() => setEditMode(false)}
                style={{ color: 'var(--text-tertiary)' }}>
                Abbrechen
              </Button>
              <Button size="sm" onClick={handleSaveProfile}>
                Speichern
              </Button>
            </div>
          </Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
            {[
              { label: 'Gewicht', rawCur: getVal('weight_kg', null, null), rawFirst: getFirstVal('weight_kg', null, null), isWeight: true, smallerIsBetter: true, color: 'var(--accent)' },
              { label: 'Größe', rawCur: profileData.groesse_cm, rawFirst: null, isWeight: false, smallerIsBetter: false, color: 'var(--info)' },
              { label: 'Brust', rawCur: getVal('chest_cm', mockLatest, 'chest'), rawFirst: getFirstVal('chest_cm', mockFirst, 'chest'), isWeight: false, smallerIsBetter: false, color: 'var(--success)' },
              { label: 'Taille', rawCur: getVal('waist_cm', mockLatest, 'waist'), rawFirst: getFirstVal('waist_cm', mockFirst, 'waist'), isWeight: false, smallerIsBetter: true, color: 'var(--warning)' },
              { label: 'Arm', rawCur: getVal('bicep_cm', mockLatest, 'arm'), rawFirst: getFirstVal('bicep_cm', mockFirst, 'arm'), isWeight: false, smallerIsBetter: false, color: 'var(--accent-light)' },
              { label: 'Oberschenkel', rawCur: getVal('thigh_cm', mockLatest, 'thigh'), rawFirst: getFirstVal('thigh_cm', mockFirst, 'thigh'), isWeight: false, smallerIsBetter: false, color: 'var(--info)' },
            ].map(stat => {
              const convert = stat.isWeight
                ? v => toDisplayWeight(v, isImperial)
                : v => toDisplayLength(v, isImperial);
              const unit = stat.isWeight ? weightUnit : lengthUnit;
              const cur   = stat.rawCur   != null ? convert(stat.rawCur)   : null;
              const first = stat.rawFirst != null ? convert(stat.rawFirst) : null;
              const diff  = first != null && cur != null ? (cur - first).toFixed(1) : null;
              const diffPositive = diff !== null && (stat.smallerIsBetter ? parseFloat(diff) < 0 : parseFloat(diff) > 0);
              return (
                <Card key={stat.label} style={{ padding: 14, textAlign: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{stat.label}</span>
                  <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-display)', color: stat.color, margin: '4px 0' }}>
                    {cur ?? '—'} <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-tertiary)' }}>{unit}</span>
                  </div>
                  {diff !== null && (
                    <span style={{ fontSize: 11, color: diffPositive ? 'var(--success)' : parseFloat(diff) === 0 ? 'var(--text-tertiary)' : 'var(--danger)' }}>
                      {parseFloat(diff) > 0 ? '+' : ''}{diff} {unit}
                    </span>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Goals */}
      <div>
        <h3 style={{ fontSize: 16, marginBottom: 12 }}>Ziele</h3>
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="dumbbell" size={16} color="var(--accent)" />
              </div>
              <div>
                <span style={{ fontWeight: 600, fontSize: 14, fontFamily: 'var(--font-display)' }}>Wöchentliche Workouts</span>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 1 }}>{WEEK_SUMMARY.workoutsThisWeek} / {profileData.goalWorkouts} diese Woche</p>
              </div>
            </div>
            <ProgressRing value={WEEK_SUMMARY.workoutsThisWeek} max={profileData.goalWorkouts} size={44} strokeWidth={4} showValue={false} />
          </div>
          <div style={{ height: 1, background: 'var(--border)' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="scale" size={16} color="var(--success)" />
              </div>
              <div>
                <span style={{ fontWeight: 600, fontSize: 14, fontFamily: 'var(--font-display)' }}>Zielgewicht</span>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 1 }}>
                  {profileData.startgewicht_kg != null ? toDisplayWeight(profileData.startgewicht_kg, isImperial) : '—'} → {profileData.zielgewicht_kg != null ? toDisplayWeight(profileData.zielgewicht_kg, isImperial) : '—'} {weightUnit}
                </p>
              </div>
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--success)' }}>
              {profileData.startgewicht_kg != null && profileData.zielgewicht_kg != null
                ? `−${Math.abs(toDisplayWeight(profileData.startgewicht_kg, isImperial) - toDisplayWeight(profileData.zielgewicht_kg, isImperial)).toFixed(1)} ${weightUnit}`
                : '—'}
            </span>
          </div>
        </Card>
      </div>

      {/* Settings */}
      <div>
        <h3 style={{ fontSize: 16, marginBottom: 12 }}>Einstellungen</h3>
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 0, padding: 0, overflow: 'hidden' }}>
          {/* Profil bearbeiten */}
          <button style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
            cursor: 'pointer', transition: 'var(--transition-fast)',
            borderBottom: '1px solid var(--border)',
            background: 'transparent', width: '100%', textAlign: 'left',
          }}
          onClick={openEdit}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <Icon name="user" size={18} color="var(--text-secondary)" />
            <span style={{ flex: 1, fontSize: 14 }}>Profil bearbeiten</span>
            {editMode && <Badge color="var(--accent)">Aktiv</Badge>}
            <Icon name="chevronRight" size={16} color="var(--text-tertiary)" />
          </button>

          {/* App-Einstellungen */}
          <button style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
            cursor: 'pointer', transition: 'var(--transition-fast)',
            borderBottom: '1px solid var(--border)',
            background: showAppSettings ? 'var(--bg-card-hover)' : 'transparent',
            width: '100%', textAlign: 'left',
          }}
          onClick={() => setShowAppSettings(s => !s)}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = showAppSettings ? 'var(--bg-card-hover)' : 'transparent'}>
            <Icon name="settings" size={18} color="var(--text-secondary)" />
            <span style={{ flex: 1, fontSize: 14 }}>App-Einstellungen</span>
            <Icon name={showAppSettings ? 'chevronDown' : 'chevronRight'} size={16} color="var(--text-tertiary)" />
          </button>

          {/* App-Einstellungen */}
          {showAppSettings && (
            <div style={{
              padding: '8px 0', borderBottom: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
            }}>
              <button style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px',
                cursor: 'pointer', transition: 'var(--transition-fast)',
                background: 'transparent', width: '100%', textAlign: 'left',
              }}
              onClick={onUnitSystemToggle}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <Icon name="scale" size={18} color="var(--text-secondary)" />
                <span style={{ flex: 1, fontSize: 14 }}>Einheiten</span>
                <Badge color={isImperial ? 'var(--warning)' : 'var(--accent)'}>
                  {isImperial ? 'Imperial (lbs / in)' : 'Metrisch (kg / cm)'}
                </Badge>
                <Icon name="chevronRight" size={16} color="var(--text-tertiary)" />
              </button>
            </div>
          )}

          {/* Dark / Light Mode Toggle */}
          <button style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
            cursor: 'pointer', transition: 'var(--transition-fast)',
            background: 'transparent', width: '100%', textAlign: 'left',
          }}
          onClick={onThemeToggle}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <Icon name={theme === 'light' ? 'sun' : 'moon'} size={18} color="var(--text-secondary)" />
            <span style={{ flex: 1, fontSize: 14 }}>
              {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
            </span>
            <Badge color={theme === 'light' ? 'var(--warning)' : 'var(--info)'}>
              {theme === 'light' ? 'Hell' : 'Dunkel'}
            </Badge>
            <Icon name="chevronRight" size={16} color="var(--text-tertiary)" />
          </button>
        </Card>
      </div>

      {/* Messungen */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 16 }}>Messungen</h3>
          <Button variant="ghost" size="sm" icon="plus" onClick={openMeasureForm}>
            {showMeasureForm ? 'Abbrechen' : 'Hinzufügen'}
          </Button>
        </div>

        {showMeasureForm && (
          <Card style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 12 }}>
            {mEditId && (
              <div style={{ fontSize: 12, color: 'var(--info)', background: 'rgba(99,179,237,0.1)', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>
                Messung vom heutigen Tag wird aktualisiert.
              </div>
            )}
            <Input label="Datum" type="date" value={mDate} onChange={setMDate} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label={`Gewicht (${weightUnit})`} type="number" value={mWeight} onChange={setMWeight} />
              <Input label={`Brust (${lengthUnit})`} type="number" value={mChest} onChange={setMChest} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label={`Taille (${lengthUnit})`} type="number" value={mWaist} onChange={setMWaist} />
              <Input label={`Hüfte (${lengthUnit})`} type="number" value={mHips} onChange={setMHips} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label={`Arm/Bizeps (${lengthUnit})`} type="number" value={mBicep} onChange={setMBicep} />
              <Input label={`Oberschenkel (${lengthUnit})`} type="number" value={mThigh} onChange={setMThigh} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Notizen (optional)</span>
              <textarea
                value={mNotes}
                onChange={e => setMNotes(e.target.value)}
                maxLength={500}
                rows={2}
                placeholder="z.B. nach dem Aufwachen, nüchtern"
                style={{
                  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
                  fontSize: 14, padding: '8px 12px', resize: 'vertical',
                  fontFamily: 'inherit', outline: 'none',
                }}
              />
            </div>
            {mError && (
              <div style={{ fontSize: 13, color: 'var(--danger)', background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>
                {mError}
              </div>
            )}
            <Button onClick={handleSaveMeasurement} disabled={mSaving}>
              {mSaving ? 'Speichern...' : mEditId ? 'Messung aktualisieren' : 'Messung speichern'}
            </Button>
          </Card>
        )}

        {measurements === null && (
          <Card style={{ padding: 20, textAlign: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Lade Messungen…</span>
          </Card>
        )}

        {measurements !== null && measurements.length === 0 && !showMeasureForm && (
          <Card style={{ padding: 20, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Icon name="chart" size={28} color="var(--text-tertiary)" />
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Noch keine Messungen vorhanden.</p>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Erfasse deine erste Messung um deinen Fortschritt zu verfolgen.</p>
          </Card>
        )}

        {measurements !== null && measurements.length > 0 && (
          <Card style={{ display: 'flex', flexDirection: 'column', gap: 0, padding: 0, overflow: 'hidden' }}>
            {measurements.slice(0, 8).map((m, idx) => {
              const date = new Date(m.recorded_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
              const parts = [];
              if (m.weight_kg != null) parts.push(`${toDisplayWeight(parseFloat(m.weight_kg), isImperial)} ${weightUnit}`);
              if (m.chest_cm  != null) parts.push(`Brust ${toDisplayLength(parseFloat(m.chest_cm), isImperial)} ${lengthUnit}`);
              if (m.waist_cm  != null) parts.push(`Taille ${toDisplayLength(parseFloat(m.waist_cm), isImperial)} ${lengthUnit}`);
              if (m.hips_cm   != null) parts.push(`Hüfte ${toDisplayLength(parseFloat(m.hips_cm), isImperial)} ${lengthUnit}`);
              if (m.bicep_cm  != null) parts.push(`Arm ${toDisplayLength(parseFloat(m.bicep_cm), isImperial)} ${lengthUnit}`);
              if (m.thigh_cm  != null) parts.push(`OSchenkel ${toDisplayLength(parseFloat(m.thigh_cm), isImperial)} ${lengthUnit}`);
              return (
                <div key={m.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  borderBottom: idx < Math.min(measurements.length, 8) - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{date}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {parts.join(' · ')}
                    </div>
                    {m.notes && <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2, fontStyle: 'italic' }}>{m.notes}</div>}
                  </div>
                  <button
                    onClick={() => handleDeleteMeasurement(m.id)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}
                    title="Löschen"
                  >
                    <Icon name="trash" size={15} color="var(--text-tertiary)" />
                  </button>
                </div>
              );
            })}
            {measurements.length > 8 && (
              <div style={{ padding: '10px 16px', textAlign: 'center', fontSize: 12, color: 'var(--text-tertiary)', borderTop: '1px solid var(--border)' }}>
                +{measurements.length - 8} weitere Einträge (in Statistiken sichtbar)
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Datenschutz (DSGVO) */}
      <div>
        <h3 style={{ fontSize: 16, marginBottom: 4 }}>Datenschutz</h3>
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 12 }}>
          Datenportabilität (Art. 20 DSGVO) und Recht auf Löschung (Art. 17 DSGVO).
        </p>
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 0, padding: 0, overflow: 'hidden' }}>
          <button
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
              cursor: exportLoading ? 'not-allowed' : 'pointer', transition: 'var(--transition-fast)',
              borderBottom: '1px solid var(--border)',
              background: 'transparent', width: '100%', textAlign: 'left',
              opacity: exportLoading ? 0.6 : 1,
            }}
            onClick={handleExport}
            disabled={exportLoading}
            onMouseEnter={e => { if (!exportLoading) e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Icon name="save" size={18} color="var(--text-secondary)" />
            <span style={{ flex: 1, fontSize: 14 }}>{exportLoading ? 'Exportiere...' : 'Daten exportieren'}</span>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginRight: 6 }}>Art. 20</span>
            <Icon name="chevronRight" size={16} color="var(--text-tertiary)" />
          </button>
          <button
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
              cursor: 'pointer', transition: 'var(--transition-fast)',
              background: 'transparent', width: '100%', textAlign: 'left',
            }}
            onClick={() => setShowDeleteModal(true)}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.06)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Icon name="trash" size={18} color="var(--danger)" />
            <span style={{ flex: 1, fontSize: 14, color: 'var(--danger)' }}>Account löschen</span>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginRight: 6 }}>Art. 17</span>
            <Icon name="chevronRight" size={16} color="var(--text-tertiary)" />
          </button>
        </Card>
        {exportError && (
          <div style={{ marginTop: 10, fontSize: 13, color: 'var(--danger)', background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>
            {exportError}
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { ProfileScreen });
