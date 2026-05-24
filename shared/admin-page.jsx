/* ═══════════════════════════════════════
   Admin: Benutzerverwaltung
   ═══════════════════════════════════════ */

const ADMIN_API = window.APP_CONFIG?.apiBase ?? 'http://localhost:3001';

function authFetch(url, opts) {
  const token = sessionStorage.getItem('auth_token');
  return fetch(url, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(opts?.headers ?? {}),
    },
  });
}

// ─── Admin Modal (Benutzer anlegen / Berechtigungen bearbeiten) ───────────────
function AdminModal({ modal, allPerms, s, onClose, onSuccess, onError }) {
  const isCreate = modal.type === 'create';
  const targetUser = modal.targetUser ?? null;

  const [form, setForm] = React.useState({ username: '', password: '', vorname: '', nachname: '', email: '' });
  const [formErr, setFormErr] = React.useState('');
  const [checkedPerms, setCheckedPerms] = React.useState(() =>
    isCreate ? [] : (targetUser?.permissions ?? [])
  );
  const [loading, setLoading] = React.useState(false);

  function setField(field, val) {
    setForm(prev => ({ ...prev, [field]: val }));
    setFormErr('');
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.username.trim() || !form.password.trim()) {
      setFormErr('Benutzername und Passwort sind Pflicht');
      return;
    }
    setLoading(true);
    try {
      const res = await authFetch(`${ADMIN_API}/api/admin/users`, {
        method: 'POST',
        body: JSON.stringify({
          username: form.username.trim(),
          password: form.password,
          vorname:  form.vorname.trim(),
          nachname: form.nachname.trim(),
          email:    form.email.trim(),
        }),
      });
      const data = await res.json();
      if (!data.success) { setFormErr(data.error ?? 'Fehler'); return; }
      onSuccess(s.createSuccess);
    } catch {
      setFormErr('Netzwerkfehler');
    } finally {
      setLoading(false);
    }
  }

  async function handleSavePerms(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authFetch(`${ADMIN_API}/api/admin/users/${targetUser.id}/permissions`, {
        method: 'PUT',
        body: JSON.stringify({ permissions: checkedPerms }),
      });
      const data = await res.json();
      if (!data.success) { setFormErr(data.error ?? 'Fehler'); return; }
      onSuccess(s.permsSuccess);
    } catch {
      setFormErr('Netzwerkfehler');
    } finally {
      setLoading(false);
    }
  }

  function togglePerm(key) {
    setCheckedPerms(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  }

  const inp = {
    width: '100%', padding: '10px 12px', background: 'var(--bg-surface)',
    border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
    fontSize: 14, fontFamily: 'var(--font)', color: 'var(--text-1)', boxSizing: 'border-box',
  };
  const lbl = {
    display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.08em', color: 'var(--accent)', marginBottom: 5,
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
      onClick={() => !loading && onClose()}
    >
      <div
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '28px 32px', width: '100%', maxWidth: 480, maxHeight: '85vh', overflowY: 'auto', animation: 'fadeUp 0.25s both' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>
            {isCreate ? s.createTitle : `${s.editTitle}: ${targetUser?.username}`}
          </h2>
          <button onClick={onClose} disabled={loading} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>✕</button>
        </div>

        {isCreate ? (
          <form onSubmit={handleCreate}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={lbl}>{s.fieldUsername} *</label>
                <input style={inp} value={form.username} onChange={e => setField('username', e.target.value)} disabled={loading} autoFocus />
              </div>
              <div>
                <label style={lbl}>{s.fieldPassword} *</label>
                <input type="password" style={inp} value={form.password} onChange={e => setField('password', e.target.value)} disabled={loading} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={lbl}>{s.fieldVorname}</label>
                  <input style={inp} value={form.vorname} onChange={e => setField('vorname', e.target.value)} disabled={loading} />
                </div>
                <div>
                  <label style={lbl}>{s.fieldNachname}</label>
                  <input style={inp} value={form.nachname} onChange={e => setField('nachname', e.target.value)} disabled={loading} />
                </div>
              </div>
              <div>
                <label style={lbl}>{s.fieldEmail}</label>
                <input type="email" style={inp} value={form.email} onChange={e => setField('email', e.target.value)} disabled={loading} />
              </div>
            </div>
            {formErr && <p style={{ color: '#f87171', fontSize: 13, marginTop: 12 }}>{formErr}</p>}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button type="button" onClick={onClose} disabled={loading} style={{ flex: 1, padding: '10px 0', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 14 }}>{s.cancel}</button>
              <button type="submit" disabled={loading} style={{ flex: 1, padding: '10px 0', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 14, fontWeight: 600 }}>
                {loading ? s.creating : s.createBtn}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSavePerms}>
            {targetUser?.is_superadmin ? (
              <div style={{ background: 'var(--accent-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', fontSize: 13, color: 'var(--accent)' }}>
                {s.superadminNote}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {allPerms.map(p => (
                  <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: checkedPerms.includes(p.key) ? 'var(--accent-subtle)' : 'var(--bg-surface)', border: '1px solid', borderColor: checkedPerms.includes(p.key) ? 'var(--border-hover)' : 'var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 0.15s' }}>
                    <input
                      type="checkbox"
                      checked={checkedPerms.includes(p.key)}
                      onChange={() => togglePerm(p.key)}
                      disabled={loading}
                      style={{ accentColor: 'var(--accent)', width: 15, height: 15, cursor: 'pointer' }}
                    />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{p.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{p.key}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
            {formErr && <p style={{ color: '#f87171', fontSize: 13, marginTop: 12 }}>{formErr}</p>}
            {!targetUser?.is_superadmin && (
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="button" onClick={onClose} disabled={loading} style={{ flex: 1, padding: '10px 0', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 14 }}>{s.cancel}</button>
                <button type="submit" disabled={loading} style={{ flex: 1, padding: '10px 0', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 14, fontWeight: 600 }}>
                  {loading ? s.saving : s.save}
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

// ─── User-Karte ───────────────────────────────────────────────────────────────
function UserCard({ u, currentUserId, s, onEditPerms, onDeleteRequest, deleteTarget, onDeleteCancel, onDeleteConfirm }) {
  const isCurrentUser = u.id === currentUserId;
  const canDelete = !isCurrentUser && !u.is_superadmin;
  const initials = ((u.vorname?.[0] ?? '') + (u.nachname?.[0] ?? u.username?.[0] ?? '')).toUpperCase() || '?';
  const fullName = [u.vorname, u.nachname].filter(Boolean).join(' ');
  const isDeleteTarget = deleteTarget?.id === u.id;

  const displayPerms = u.is_superadmin
    ? [s.allPerms]
    : (u.permissions?.length > 0 ? u.permissions : [s.noPerms]);

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px 22px', display: 'flex', gap: 16, alignItems: 'flex-start', animation: 'fadeUp 0.3s both' }}>
      {/* Avatar */}
      <div style={{ width: 44, height: 44, borderRadius: '50%', background: u.is_superadmin ? 'rgba(200,160,74,0.15)' : 'var(--accent-subtle)', border: `1px solid ${u.is_superadmin ? 'rgba(200,160,74,0.3)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: u.is_superadmin ? 'var(--gold)' : 'var(--accent)', flexShrink: 0 }}>
        {initials}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
          <span style={{ fontSize: 15, fontWeight: 650, color: 'var(--text-1)' }}>{u.username}</span>
          {u.is_superadmin && (
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold)', background: 'rgba(200,160,74,0.12)', border: '1px solid rgba(200,160,74,0.25)', borderRadius: 20, padding: '2px 8px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{s.superadminBadge}</span>
          )}
          {isCurrentUser && (
            <span style={{ fontSize: 10, color: 'var(--text-3)', fontStyle: 'italic' }}>(Du)</span>
          )}
        </div>

        {fullName && <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 3 }}>{fullName}</div>}
        {u.email && <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>{u.email}</div>}

        {/* Permission chips */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
          {displayPerms.map((p, i) => (
            <span key={i} style={{ fontSize: 11, color: u.is_superadmin ? 'var(--gold)' : u.permissions?.length ? 'var(--accent)' : 'var(--text-3)', background: u.is_superadmin ? 'rgba(200,160,74,0.08)' : u.permissions?.length ? 'var(--accent-subtle)' : 'transparent', border: `1px solid ${u.is_superadmin ? 'rgba(200,160,74,0.2)' : u.permissions?.length ? 'var(--border)' : 'var(--border)'}`, borderRadius: 20, padding: '2px 8px', fontFamily: u.permissions?.length && !u.is_superadmin ? 'var(--font-mono)' : 'var(--font)' }}>
              {p}
            </span>
          ))}
        </div>

        {/* Actions */}
        {!isDeleteTarget ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={onEditPerms}
              style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, background: 'var(--accent-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'var(--font)', transition: 'all 0.2s' }}
            >
              {s.editPerms}
            </button>
            {canDelete && (
              <button
                onClick={onDeleteRequest}
                style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, background: 'rgba(224,80,80,0.08)', border: '1px solid rgba(224,80,80,0.2)', borderRadius: 'var(--radius-sm)', color: '#e05050', cursor: 'pointer', fontFamily: 'var(--font)', transition: 'all 0.2s' }}
              >
                {s.delete}
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(224,80,80,0.08)', border: '1px solid rgba(224,80,80,0.2)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: 13, color: '#f87171', fontWeight: 600 }}>{s.deleteConfirm}</span>
            <button onClick={onDeleteConfirm} style={{ padding: '4px 12px', fontSize: 12, fontWeight: 600, background: 'rgba(224,80,80,0.15)', border: '1px solid rgba(224,80,80,0.35)', borderRadius: 'var(--radius-sm)', color: '#f87171', cursor: 'pointer', fontFamily: 'var(--font)' }}>{s.deleteYes}</button>
            <button onClick={onDeleteCancel} style={{ padding: '4px 10px', fontSize: 12, background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'var(--font)' }}>{s.cancel}</button>
          </div>
        )}

        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8 }}>
          {s.createdAt}: {new Date(u.created_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}

// ─── Registrierungs-Karte ─────────────────────────────────────────────────────
function RegistrationCard({ reg, s, onApprove, onReject, actionTarget, onCancel }) {
  const fullName = [reg.vorname, reg.nachname].filter(Boolean).join(' ');
  const initials = ((reg.vorname?.[0] ?? '') + (reg.nachname?.[0] ?? reg.username?.[0] ?? '')).toUpperCase() || '?';
  const isTarget = actionTarget?.id === reg.id;

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px 22px', display: 'flex', gap: 16, alignItems: 'flex-start', animation: 'fadeUp 0.3s both' }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(77,166,255,0.10)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
        {initials}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
          <span style={{ fontSize: 15, fontWeight: 650, color: 'var(--text-1)' }}>{reg.username}</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 20, padding: '2px 8px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{s.pendingBadge}</span>
        </div>

        {fullName && <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 2 }}>{fullName}</div>}
        {reg.email && <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6 }}>{reg.email}</div>}

        {(reg.profession || reg.grund_besuchs) && (
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {reg.profession && <span>{s.profession}: {reg.profession}</span>}
            {reg.grund_besuchs && <span>{s.reason}: {reg.grund_besuchs}</span>}
          </div>
        )}

        {!isTarget ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => onApprove(reg)}
              style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 'var(--radius-sm)', color: '#4ade80', cursor: 'pointer', fontFamily: 'var(--font)', transition: 'all 0.2s' }}
            >
              {s.approveBtn}
            </button>
            <button
              onClick={() => onReject(reg)}
              style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, background: 'rgba(224,80,80,0.08)', border: '1px solid rgba(224,80,80,0.2)', borderRadius: 'var(--radius-sm)', color: '#e05050', cursor: 'pointer', fontFamily: 'var(--font)', transition: 'all 0.2s' }}
            >
              {s.rejectBtn}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: 13, color: '#f59e0b', fontWeight: 600 }}>
              {actionTarget.action === 'approve' ? `${s.approveBtn}?` : `${s.rejectBtn}?`}
            </span>
            <button
              onClick={() => actionTarget.confirm()}
              style={{ padding: '4px 12px', fontSize: 12, fontWeight: 600, background: actionTarget.action === 'approve' ? 'rgba(34,197,94,0.15)' : 'rgba(224,80,80,0.15)', border: `1px solid ${actionTarget.action === 'approve' ? 'rgba(34,197,94,0.35)' : 'rgba(224,80,80,0.35)'}`, borderRadius: 'var(--radius-sm)', color: actionTarget.action === 'approve' ? '#4ade80' : '#f87171', cursor: 'pointer', fontFamily: 'var(--font)' }}
            >
              {s.deleteYes}
            </button>
            <button
              onClick={onCancel}
              style={{ padding: '4px 10px', fontSize: 12, background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'var(--font)' }}
            >
              {s.cancel}
            </button>
          </div>
        )}

        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8 }}>
          {s.requestedAt}: {new Date(reg.created_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}

// ─── Registrierungs-Panel ─────────────────────────────────────────────────────
function RegistrationsPanel({ s, onFeedback }) {
  const [regs, setRegs]           = React.useState([]);
  const [loading, setLoading]     = React.useState(true);
  const [error, setError]         = React.useState(null);
  const [actionTarget, setActionTarget] = React.useState(null);

  async function loadRegs() {
    setLoading(true);
    setError(null);
    try {
      const res  = await authFetch(`${ADMIN_API}/api/admin/registrations`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setRegs(data.data.registrations);
    } catch (err) {
      setError(err.message ?? s.errorLoad);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { loadRegs(); }, []);

  async function doApprove(reg) {
    try {
      const res  = await authFetch(`${ADMIN_API}/api/admin/registrations/${reg.id}/approve`, { method: 'POST' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setActionTarget(null);
      onFeedback('success', s.approveSuccess);
      loadRegs();
    } catch (err) {
      onFeedback('error', err.message ?? s.errorLoad);
      setActionTarget(null);
    }
  }

  async function doReject(reg) {
    try {
      const res  = await authFetch(`${ADMIN_API}/api/admin/registrations/${reg.id}/reject`, { method: 'POST' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setActionTarget(null);
      onFeedback('success', s.rejectSuccess);
      loadRegs();
    } catch (err) {
      onFeedback('error', err.message ?? s.errorLoad);
      setActionTarget(null);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <div style={{ width: 36, height: 36, border: '3px solid rgba(77,166,255,0.15)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '16px 20px', background: 'rgba(224,80,80,0.08)', border: '1px solid rgba(224,80,80,0.2)', borderRadius: 'var(--radius)', color: '#f87171', fontSize: 14 }}>
        {error}
      </div>
    );
  }

  if (regs.length === 0) {
    return (
      <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 14, background: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
        {s.noRegistrations}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {regs.map(reg => (
        <RegistrationCard
          key={reg.id}
          reg={reg}
          s={s}
          actionTarget={actionTarget?.id === reg.id ? actionTarget : null}
          onApprove={r => setActionTarget({ id: r.id, action: 'approve', confirm: () => doApprove(r) })}
          onReject={r => setActionTarget({ id: r.id, action: 'reject', confirm: () => doReject(r) })}
          onCancel={() => setActionTarget(null)}
        />
      ))}
    </div>
  );
}

// ─── Admin Page ───────────────────────────────────────────────────────────────
function AdminPage({ onBack, onLogout, user: currentUser }) {
  const { lang } = useT();
  const s = STRINGS[lang].adminPage;

  const [activeTab, setActiveTab]   = React.useState('users');
  const [users, setUsers]           = React.useState([]);
  const [allPerms, setAllPerms]     = React.useState([]);
  const [loading, setLoading]       = React.useState(true);
  const [error, setError]           = React.useState(null);
  const [modal, setModal]           = React.useState(null);
  const [deleteTarget, setDeleteTarget] = React.useState(null);
  const [feedback, setFeedback]     = React.useState(null);

  function showFeedback(type, msg) {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3500);
  }

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [ur, pr] = await Promise.all([
        authFetch(`${ADMIN_API}/api/admin/users`),
        authFetch(`${ADMIN_API}/api/admin/permissions`),
      ]);
      const ud = await ur.json();
      const pd = await pr.json();
      if (!ud.success) throw new Error(ud.error);
      if (!pd.success) throw new Error(pd.error);
      setUsers(ud.data.users);
      setAllPerms(pd.data.permissions);
    } catch (err) {
      setError(err.message ?? s.errorLoad);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { loadData(); }, []);

  async function handleDelete(userId) {
    try {
      const res = await authFetch(`${ADMIN_API}/api/admin/users/${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setDeleteTarget(null);
      showFeedback('success', s.deleteSuccess);
      loadData();
    } catch (err) {
      showFeedback('error', err.message ?? s.errorDelete);
      setDeleteTarget(null);
    }
  }

  const tabStyle = (tab) => ({
    padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
    fontFamily: 'var(--font)', border: 'none', borderRadius: 'var(--radius-sm)',
    background: activeTab === tab ? 'var(--accent)' : 'var(--bg-surface)',
    color: activeTab === tab ? '#fff' : 'var(--text-2)',
    transition: 'all 0.2s',
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <NavBar onBack={onBack} onLogout={onLogout} title={s.title} />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px 60px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>{s.title}</h1>
            {activeTab === 'users' && (
              <p style={{ fontSize: 14, color: 'var(--text-2)' }}>
                {loading ? '…' : `${users.length} ${s.usersCount}`}
              </p>
            )}
          </div>
          {activeTab === 'users' && (
            <button
              onClick={() => setModal({ type: 'create' })}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)', flexShrink: 0 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
              {s.newUser}
            </button>
          )}
        </div>

        {/* Tab Bar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <button style={tabStyle('users')} onClick={() => setActiveTab('users')}>{s.usersTab}</button>
          <button style={tabStyle('registrations')} onClick={() => setActiveTab('registrations')}>{s.registrationsTab}</button>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid', background: feedback.type === 'success' ? 'rgba(34,197,94,0.10)' : 'rgba(224,80,80,0.10)', borderColor: feedback.type === 'success' ? 'rgba(34,197,94,0.25)' : 'rgba(224,80,80,0.25)', color: feedback.type === 'success' ? '#4ade80' : '#f87171', fontSize: 14, animation: 'fadeIn 0.2s both' }}>
            {feedback.msg}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <>
            {error && !loading && (
              <div style={{ padding: '16px 20px', background: 'rgba(224,80,80,0.08)', border: '1px solid rgba(224,80,80,0.2)', borderRadius: 'var(--radius)', color: '#f87171', fontSize: 14 }}>
                {error}
              </div>
            )}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
                <div style={{ width: 36, height: 36, border: '3px solid rgba(77,166,255,0.15)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
            )}
            {!loading && !error && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {users.map(u => (
                  <UserCard
                    key={u.id}
                    u={u}
                    currentUserId={currentUser?.id}
                    s={s}
                    onEditPerms={() => setModal({ type: 'perms', targetUser: u })}
                    onDeleteRequest={() => setDeleteTarget(u)}
                    deleteTarget={deleteTarget}
                    onDeleteCancel={() => setDeleteTarget(null)}
                    onDeleteConfirm={() => handleDelete(u.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Registrations Tab */}
        {activeTab === 'registrations' && (
          <RegistrationsPanel s={s} onFeedback={showFeedback} />
        )}
      </div>

      {/* Modal */}
      {modal && (
        <AdminModal
          modal={modal}
          allPerms={allPerms}
          s={s}
          onClose={() => setModal(null)}
          onSuccess={(msg) => { setModal(null); showFeedback('success', msg); loadData(); }}
          onError={(msg) => showFeedback('error', msg)}
        />
      )}
    </div>
  );
}

Object.assign(window, { AdminPage });
