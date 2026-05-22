/* workout.jsx – Workout logging screen */

const GYM_API_WORKOUT = window.__GYM_API_BASE ?? 'http://localhost:3001';

function WorkoutScreen() {
  const [phase, setPhase] = React.useState('idle'); // idle | active | done
  const [workoutName, setWorkoutName] = React.useState('');
  const [exercises, setExercises] = React.useState([]);
  const [showPicker, setShowPicker] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [elapsed, setElapsed] = React.useState(0);
  const [restTimer, setRestTimer] = React.useState(null);
  const [restLeft, setRestLeft] = React.useState(0);
  const timerRef = React.useRef(null);
  const restRef = React.useRef(null);

  // DB exercises (lazy-loaded on first picker/modal open)
  const [dbExercises, setDbExercises] = React.useState([]);
  const [exercisesLoaded, setExercisesLoaded] = React.useState(false);
  const [exercisesLoading, setExercisesLoading] = React.useState(false);

  // Template state
  const [templates, setTemplates] = React.useState([]);
  const [templatesLoading, setTemplatesLoading] = React.useState(true);
  const [showTemplateModal, setShowTemplateModal] = React.useState(false);
  const [editingTemplate, setEditingTemplate] = React.useState(null);
  const [templateName, setTemplateName] = React.useState('');
  const [templateExIds, setTemplateExIds] = React.useState([]);
  const [templateSearch, setTemplateSearch] = React.useState('');
  const [templateSaving, setTemplateSaving] = React.useState(false);
  const [templateError, setTemplateError] = React.useState('');

  // Finish-Modal state
  const [startedAt, setStartedAt] = React.useState(null);
  const [showFinishModal, setShowFinishModal] = React.useState(false);
  const [measureForm, setMeasureForm] = React.useState({
    weight_kg: '', chest_cm: '', waist_cm: '', hips_cm: '', bicep_cm: '', thigh_cm: '',
  });
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState('');

  React.useEffect(() => {
    const token = sessionStorage.getItem('gym_token');
    if (!token) { setTemplatesLoading(false); return; }
    fetchTemplates(GYM_API_WORKOUT, token)
      .then(data => setTemplates(data))
      .catch(() => {})
      .finally(() => setTemplatesLoading(false));
  }, []);

  React.useEffect(() => {
    if (phase === 'active') {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [phase]);

  React.useEffect(() => {
    if (restLeft > 0) {
      restRef.current = setTimeout(() => setRestLeft(r => r - 1), 1000);
    } else {
      setRestTimer(null);
    }
    return () => clearTimeout(restRef.current);
  }, [restLeft]);

  function loadExercisesIfNeeded() {
    if (exercisesLoaded || exercisesLoading) return;
    const token = sessionStorage.getItem('gym_token');
    if (!token) return;
    setExercisesLoading(true);
    fetchExercises(GYM_API_WORKOUT, token)
      .then(data => { setDbExercises(data); setExercisesLoaded(true); })
      .catch(() => {})
      .finally(() => setExercisesLoading(false));
  }

  function startWorkout() {
    setPhase('active');
    setElapsed(0);
    setExercises([]);
    setWorkoutName('Neues Workout');
    setStartedAt(new Date().toISOString());
    setMeasureForm({ weight_kg: '', chest_cm: '', waist_cm: '', hips_cm: '', bicep_cm: '', thigh_cm: '' });
    setSaveError('');
  }

  function addExercise(ex) {
    setExercises(prev => [...prev, {
      ...ex, sets: [{ weight: '', reps: '', done: false }]
    }]);
    setShowPicker(false);
    setSearchTerm('');
  }

  function updateSet(exIdx, setIdx, field, value) {
    setExercises(prev => prev.map((ex, ei) =>
      ei === exIdx ? { ...ex, sets: ex.sets.map((s, si) =>
        si === setIdx ? { ...s, [field]: value } : s
      )} : ex
    ));
  }

  function toggleSetDone(exIdx, setIdx) {
    setExercises(prev => prev.map((ex, ei) =>
      ei === exIdx ? { ...ex, sets: ex.sets.map((s, si) =>
        si === setIdx ? { ...s, done: !s.done } : s
      )} : ex
    ));
  }

  function addSet(exIdx) {
    setExercises(prev => prev.map((ex, ei) => {
      if (ei !== exIdx) return ex;
      const lastSet = ex.sets[ex.sets.length - 1];
      return { ...ex, sets: [...ex.sets, { weight: lastSet.weight, reps: lastSet.reps, done: false }] };
    }));
  }

  function removeExercise(exIdx) {
    setExercises(prev => prev.filter((_, i) => i !== exIdx));
  }

  function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  function startFromTemplate(tmpl) {
    const exList = (tmpl.exercises || []).map(te => ({
      id: te.exercise_id,
      name: te.name,
      muscle: te.muscle,
      sets: [{ weight: '', reps: '', done: false }],
    }));
    setWorkoutName(tmpl.name);
    setExercises(exList);
    setPhase('active');
    setElapsed(0);
    setStartedAt(new Date().toISOString());
    setMeasureForm({ weight_kg: '', chest_cm: '', waist_cm: '', hips_cm: '', bicep_cm: '', thigh_cm: '' });
    setSaveError('');
  }

  function openNewTemplateModal() {
    loadExercisesIfNeeded();
    setEditingTemplate(null);
    setTemplateName('');
    setTemplateExIds([]);
    setTemplateSearch('');
    setTemplateError('');
    setShowTemplateModal(true);
  }

  function openEditTemplateModal(tmpl) {
    loadExercisesIfNeeded();
    setEditingTemplate(tmpl);
    setTemplateName(tmpl.name);
    setTemplateExIds((tmpl.exercises || []).map(te => te.exercise_id));
    setTemplateSearch('');
    setTemplateError('');
    setShowTemplateModal(true);
  }

  function openExercisePicker() {
    loadExercisesIfNeeded();
    setShowPicker(true);
  }

  function toggleTemplateExercise(exId) {
    setTemplateExIds(prev =>
      prev.includes(exId) ? prev.filter(id => id !== exId) : [...prev, exId]
    );
  }

  function buildExercisesForDisplay(ids) {
    return ids.map((exId, i) => {
      const ex = dbExercises.find(e => e.id === exId);
      return ex ? { exercise_id: exId, sort_order: i, name: ex.name, muscle: ex.muscle } : null;
    }).filter(Boolean);
  }

  async function handleSaveTemplate() {
    if (!templateName.trim()) { setTemplateError('Name ist erforderlich'); return; }
    setTemplateSaving(true);
    setTemplateError('');
    const token = sessionStorage.getItem('gym_token');
    try {
      const payload = { name: templateName.trim(), exercise_ids: templateExIds };
      if (editingTemplate) {
        const saved = await updateTemplate(GYM_API_WORKOUT, token, editingTemplate.id, payload);
        setTemplates(prev => prev.map(t =>
          t.id === saved.id
            ? { ...t, name: saved.name, exercises: buildExercisesForDisplay(templateExIds) }
            : t
        ));
      } else {
        const saved = await saveTemplate(GYM_API_WORKOUT, token, payload);
        setTemplates(prev => [{ ...saved, exercises: buildExercisesForDisplay(templateExIds) }, ...prev]);
      }
      setShowTemplateModal(false);
    } catch (err) {
      setTemplateError(err.message || 'Speichern fehlgeschlagen');
    } finally {
      setTemplateSaving(false);
    }
  }

  async function handleDeleteTemplate(id, e) {
    e.stopPropagation();
    const token = sessionStorage.getItem('gym_token');
    try {
      await deleteTemplate(GYM_API_WORKOUT, token, id);
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch { /* ignore */ }
  }

  async function handleSaveWorkout() {
    setSaving(true);
    setSaveError('');
    const token = sessionStorage.getItem('gym_token');
    try {
      const now = new Date().toISOString();
      const sets = [];
      exercises.forEach(ex => {
        ex.sets.forEach((set, si) => {
          const reps = parseInt(set.reps, 10);
          const weight = parseFloat(set.weight);
          if (!isNaN(reps) && reps > 0) {
            sets.push({
              exercise_id: ex.id,
              set_number: si + 1,
              reps,
              weight_kg: isNaN(weight) ? null : weight,
            });
          }
        });
      });

      await saveWorkout(GYM_API_WORKOUT, token, {
        name: workoutName || 'Workout',
        started_at: startedAt ?? now,
        finished_at: now,
        sets,
      });

      const hasMeasurement = Object.values(measureForm).some(v => v !== '' && v !== null && v !== undefined);
      if (hasMeasurement) {
        const measurePayload = { source: 'workout' };
        Object.entries(measureForm).forEach(([k, v]) => {
          if (v !== '' && v !== null && v !== undefined) {
            measurePayload[k] = parseFloat(v);
          }
        });
        await saveMeasurement(GYM_API_WORKOUT, token, measurePayload);
      }

      setShowFinishModal(false);
      setPhase('done');
    } catch (err) {
      setSaveError(err.message || 'Speichern fehlgeschlagen');
    } finally {
      setSaving(false);
    }
  }

  const filteredTemplateExercises = dbExercises.filter(e =>
    (e.name ?? '').toLowerCase().includes(templateSearch.toLowerCase()) ||
    (e.muscle ?? '').toLowerCase().includes(templateSearch.toLowerCase())
  );

  const filteredExercises = dbExercises.filter(e =>
    (e.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.muscle ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const wS = {
    timer: {
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
      padding: '16px 20px', borderRadius: 'var(--radius-lg)',
      background: 'linear-gradient(135deg, rgba(139,92,246,0.12), var(--bg-card))',
      border: '1px solid var(--border)',
    },
    setRow: {
      display: 'grid', gridTemplateColumns: '32px 1fr 1fr 40px',
      gap: 8, alignItems: 'center', padding: '8px 0',
    },
    setInput: {
      ...uiBase.input, padding: '8px 12px', textAlign: 'center', fontSize: 14,
    },
    picker: {
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000,
      animation: 'fadeIn 0.2s ease',
    },
    pickerContent: {
      width: '100%', maxWidth: 520, maxHeight: '70vh',
      background: 'var(--bg-card)', borderRadius: '20px 20px 0 0',
      padding: '20px', overflow: 'auto',
      border: '1px solid var(--border)', borderBottom: 'none',
    },
    rest: {
      position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
      padding: '12px 24px', borderRadius: 'var(--radius-full)',
      background: 'var(--accent-dark)', color: '#fff',
      fontWeight: 700, fontFamily: 'var(--font-display)', fontSize: 16,
      boxShadow: 'var(--shadow-glow)', zIndex: 999,
      display: 'flex', alignItems: 'center', gap: 10,
      animation: 'scaleIn 0.3s ease',
    },
  };

  // IDLE state
  if (phase === 'idle') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.4s ease' }}>
        <h2 style={{ fontSize: 22 }}>Workout</h2>
        <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: 40 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="dumbbell" size={32} color="var(--accent)" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: 18, marginBottom: 6 }}>Bereit zum Trainieren?</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Starte ein leeres Workout oder wähle eine Vorlage.</p>
          </div>
          <Button variant="primary" icon="play" onClick={startWorkout} style={{ padding: '14px 32px', fontSize: 16 }}>
            Leeres Workout starten
          </Button>
        </Card>

        {/* Eigene Vorlagen */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: 16 }}>Meine Vorlagen</h3>
            <Button variant="secondary" size="sm" icon="plus" onClick={openNewTemplateModal}>
              Neue Vorlage
            </Button>
          </div>

          {templatesLoading ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-tertiary)', fontSize: 14 }}>Lädt…</div>
          ) : templates.length === 0 ? (
            <Card style={{ padding: 24, textAlign: 'center' }}>
              <Icon name="dumbbell" size={28} color="var(--text-tertiary)" style={{ marginBottom: 8 }} />
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8 }}>Noch keine Vorlagen.</p>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4 }}>Erstelle deine erste Vorlage und speichere deine Lieblingsübungen.</p>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {templates.map(tmpl => (
                <Card key={tmpl.id} hover onClick={() => startFromTemplate(tmpl)} style={{ padding: '14px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon name="dumbbell" size={18} color="var(--accent)" />
                      </div>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: 14, fontFamily: 'var(--font-display)' }}>{tmpl.name}</span>
                        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                          {tmpl.exercises?.length || 0} Übungen
                          {tmpl.exercises?.length > 0 && ' · ' + [...new Set(tmpl.exercises.map(e => e.muscle).filter(Boolean))].slice(0,3).join(', ')}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button onClick={e => { e.stopPropagation(); openEditTemplateModal(tmpl); }}
                        style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'var(--bg-secondary)', cursor: 'pointer', transition: 'var(--transition-fast)' }}
                        title="Vorlage bearbeiten">
                        <Icon name="edit" size={14} color="var(--text-secondary)" />
                      </button>
                      <button onClick={e => handleDeleteTemplate(tmpl.id, e)}
                        style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'var(--bg-secondary)', cursor: 'pointer', transition: 'var(--transition-fast)' }}
                        title="Vorlage löschen">
                        <Icon name="trash" size={14} color="var(--text-tertiary)" />
                      </button>
                      <Icon name="chevronRight" size={18} color="var(--text-tertiary)" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Template-Erstellungs-Modal */}
        {showTemplateModal && (
          <div style={wS.picker} onClick={() => setShowTemplateModal(false)}>
            <div style={{ ...wS.pickerContent, maxHeight: '85vh' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 18 }}>{editingTemplate ? 'Vorlage bearbeiten' : 'Neue Vorlage'}</h3>
                <button onClick={() => setShowTemplateModal(false)} style={{ color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                  <Icon name="x" size={22} />
                </button>
              </div>

              <input
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
                placeholder="Name der Vorlage (z.B. Push Day)"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)', background: 'var(--bg-input)',
                  color: 'var(--text-primary)', fontSize: 15, marginBottom: 14, boxSizing: 'border-box' }}
              />

              {templateExIds.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 6 }}>Ausgewählt ({templateExIds.length})</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {templateExIds.map(exId => {
                      const ex = dbExercises.find(e => e.id === exId);
                      return ex ? (
                        <span key={exId} onClick={() => toggleTemplateExercise(exId)}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20,
                            background: 'var(--accent-subtle)', color: 'var(--accent-light)', fontSize: 12,
                            fontWeight: 500, cursor: 'pointer' }}>
                          {ex.name}
                          <Icon name="x" size={10} />
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              <Input placeholder="Übung suchen..." icon="search" value={templateSearch} onChange={setTemplateSearch} style={{ marginBottom: 8 }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 280, overflowY: 'auto' }}>
                {exercisesLoading && (
                  <div style={{ textAlign: 'center', padding: 16, color: 'var(--text-tertiary)', fontSize: 13 }}>Übungen laden…</div>
                )}
                {!exercisesLoading && filteredTemplateExercises.map(ex => {
                  const selected = templateExIds.includes(ex.id);
                  return (
                    <button key={ex.id} onClick={() => toggleTemplateExercise(ex.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                        borderRadius: 'var(--radius-md)', background: selected ? 'var(--accent-subtle)' : 'transparent',
                        cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'var(--transition-fast)',
                        border: selected ? '1px solid var(--accent-dim)' : '1px solid transparent' }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                        background: selected ? 'var(--accent)' : 'var(--bg-elevated)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name={selected ? 'check' : 'plus'} size={14} color={selected ? '#fff' : 'var(--text-tertiary)'} />
                      </div>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{ex.name}</span>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{ex.muscle}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {templateError && (
                <p style={{ fontSize: 13, color: 'var(--error)', marginTop: 8 }}>{templateError}</p>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <Button variant="secondary" onClick={() => setShowTemplateModal(false)} style={{ flex: 1 }}>Abbrechen</Button>
                <Button variant="primary" onClick={handleSaveTemplate} disabled={templateSaving} style={{ flex: 1 }}>
                  {templateSaving ? 'Speichert…' : (editingTemplate ? 'Speichern' : 'Erstellen')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // DONE state
  if (phase === 'done') {
    const doneSets = exercises.reduce((n, ex) => n + ex.sets.filter(s => s.done).length, 0);
    const totalVol = exercises.reduce((sum, ex) =>
      sum + ex.sets.filter(s => s.done).reduce((s2, set) => s2 + (Number(set.weight)||0) * (Number(set.reps)||0), 0), 0);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, padding: '40px 0', animation: 'scaleIn 0.5s ease' }}>
        <div style={{ width: 80, height: 80, borderRadius: 24, background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="check" size={36} color="var(--success)" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 22 }}>Workout gespeichert!</h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 6 }}>{workoutName}</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, width: '100%', maxWidth: 400 }}>
          <Card style={{ textAlign: 'center', padding: 16 }}>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--accent)' }}>{formatTime(elapsed)}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Dauer</div>
          </Card>
          <Card style={{ textAlign: 'center', padding: 16 }}>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--success)' }}>{exercises.length}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Übungen</div>
          </Card>
          <Card style={{ textAlign: 'center', padding: 16 }}>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--warning)' }}>{doneSets}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Sätze</div>
          </Card>
        </div>
        {totalVol > 0 && (
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Gesamtvolumen: <strong style={{ color: 'var(--text-primary)' }}>{(totalVol / 1000).toFixed(1)} t</strong>
          </p>
        )}
        <Button variant="primary" onClick={() => setPhase('idle')}>Fertig</Button>
      </div>
    );
  }

  // ACTIVE state
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.4s ease' }}>
      {/* Timer header */}
      <div style={wS.timer}>
        <Icon name="timer" size={22} color="var(--accent)" />
        <span style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums' }}>{formatTime(elapsed)}</span>
        <Button variant="danger" size="sm" onClick={() => setShowFinishModal(true)}>Beenden</Button>
      </div>

      {/* Exercises */}
      {exercises.map((ex, exIdx) => (
        <Card key={exIdx} style={{ padding: '16px 18px', animation: 'fadeIn 0.3s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <span style={{ fontWeight: 600, fontSize: 15, fontFamily: 'var(--font-display)' }}>{ex.name}</span>
              <Badge color="var(--text-secondary)" style={{ marginLeft: 8, fontSize: 11 }}>{ex.muscle}</Badge>
            </div>
            <button onClick={() => removeExercise(exIdx)} style={{ color: 'var(--text-tertiary)', cursor: 'pointer', padding: 4 }}>
              <Icon name="trash" size={16} />
            </button>
          </div>
          {/* Set headers */}
          <div style={{ ...wS.setRow, paddingBottom: 4, borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center' }}>Set</span>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center' }}>kg</span>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center' }}>Reps</span>
            <span></span>
          </div>
          {ex.sets.map((set, si) => (
            <div key={si} style={wS.setRow}>
              <span style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center' }}>{si + 1}</span>
              <input type="number" value={set.weight} onChange={e => updateSet(exIdx, si, 'weight', e.target.value)}
                placeholder="0" style={{ ...wS.setInput, background: set.done ? 'var(--success-bg)' : 'var(--bg-input)' }} />
              <input type="number" value={set.reps} onChange={e => updateSet(exIdx, si, 'reps', e.target.value)}
                placeholder="0" style={{ ...wS.setInput, background: set.done ? 'var(--success-bg)' : 'var(--bg-input)' }} />
              <button onClick={() => { toggleSetDone(exIdx, si); if (!set.done) setRestLeft(90); }}
                style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: set.done ? 'var(--success)' : 'var(--bg-secondary)', cursor: 'pointer', transition: 'var(--transition-fast)' }}>
                <Icon name="check" size={16} color={set.done ? '#fff' : 'var(--text-tertiary)'} />
              </button>
            </div>
          ))}
          <button onClick={() => addSet(exIdx)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 0', color: 'var(--accent-light)', fontSize: 13, fontWeight: 500, cursor: 'pointer', marginTop: 4 }}>
            <Icon name="plus" size={14} /> Set hinzufügen
          </button>
        </Card>
      ))}

      {/* Add exercise button */}
      <Button variant="secondary" icon="plus" onClick={openExercisePicker} style={{ width: '100%', padding: '14px' }}>
        Übung hinzufügen
      </Button>

      {/* Rest timer */}
      {restLeft > 0 && (
        <div style={wS.rest}>
          <Icon name="pause" size={18} />
          Pause: {restLeft}s
          <button onClick={() => setRestLeft(0)} style={{ color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: 4 }}>
            <Icon name="x" size={16} />
          </button>
        </div>
      )}

      {/* Finish modal */}
      {showFinishModal && (
        <div style={wS.picker} onClick={() => !saving && setShowFinishModal(false)}>
          <div style={{ ...wS.pickerContent, maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18 }}>Workout abschließen</h3>
              <button onClick={() => !saving && setShowFinishModal(false)} style={{ color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                <Icon name="x" size={22} />
              </button>
            </div>

            {/* Workout name */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Workout-Name</label>
              <input
                value={workoutName}
                onChange={e => setWorkoutName(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)', background: 'var(--bg-input)',
                  color: 'var(--text-primary)', fontSize: 15, boxSizing: 'border-box' }}
              />
            </div>

            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[
                { label: 'Dauer', value: formatTime(elapsed), color: 'var(--accent)' },
                { label: 'Übungen', value: exercises.length, color: 'var(--success)' },
                { label: 'Sätze (done)', value: exercises.reduce((n, ex) => n + ex.sets.filter(s => s.done).length, 0), color: 'var(--warning)' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ padding: '12px 8px', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-display)', color }}>{value}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Optional measurements */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 10, display: 'block' }}>
                Körpermaße erfassen <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>(optional)</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { key: 'weight_kg', label: 'Gewicht (kg)' },
                  { key: 'chest_cm', label: 'Brust (cm)' },
                  { key: 'waist_cm', label: 'Taille (cm)' },
                  { key: 'hips_cm', label: 'Hüfte (cm)' },
                  { key: 'bicep_cm', label: 'Bizeps (cm)' },
                  { key: 'thigh_cm', label: 'Oberschenkel (cm)' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 3, display: 'block' }}>{label}</label>
                    <input
                      type="number" step="0.1" min="0"
                      value={measureForm[key]}
                      onChange={e => setMeasureForm(prev => ({ ...prev, [key]: e.target.value }))}
                      placeholder="—"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)', background: 'var(--bg-input)',
                        color: 'var(--text-primary)', fontSize: 14, boxSizing: 'border-box', textAlign: 'right' }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {saveError && (
              <p style={{ fontSize: 13, color: 'var(--error)', marginBottom: 10 }}>{saveError}</p>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" onClick={() => setShowFinishModal(false)} disabled={saving} style={{ flex: 1 }}>
                Zurück
              </Button>
              <Button variant="primary" onClick={handleSaveWorkout} disabled={saving} style={{ flex: 2 }}>
                {saving ? 'Speichert…' : 'Workout speichern'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Exercise picker modal */}
      {showPicker && (
        <div style={wS.picker} onClick={() => setShowPicker(false)}>
          <div style={wS.pickerContent} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18 }}>Übung wählen</h3>
              <button onClick={() => setShowPicker(false)} style={{ color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                <Icon name="x" size={22} />
              </button>
            </div>
            <Input placeholder="Suchen..." icon="search" value={searchTerm} onChange={setSearchTerm} style={{ marginBottom: 12 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {exercisesLoading && (
                <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-tertiary)', fontSize: 13 }}>Übungen laden…</div>
              )}
              {!exercisesLoading && filteredExercises.map(ex => (
                <button key={ex.id} onClick={() => addExercise(ex)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 'var(--radius-md)',
                    background: 'transparent', cursor: 'pointer', width: '100%', textAlign: 'left',
                    transition: 'var(--transition-fast)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="dumbbell" size={16} color="var(--accent)" />
                  </div>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{ex.name}</span>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                      {ex.muscle} · {ex.equipment_type === 'CARDIO' || ex.tracking_type === 'TIME' ? 'Cardio' : 'Kraft'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { WorkoutScreen });
