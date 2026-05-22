/* history.jsx – Trainingshistorie (read-only) — Workouts aus DB + Maße mit Source-Badge */

const GYM_API_HISTORY = window.__GYM_API_BASE ?? 'http://localhost:3001';

function HistoryScreen() {
  const [tab, setTab] = React.useState('workouts');
  const [workouts, setWorkouts] = React.useState([]);
  const [measurements, setMeasurements] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedWorkout, setSelectedWorkout] = React.useState(null);
  const [muscleFilter, setMuscleFilter] = React.useState('all');

  React.useEffect(() => {
    const token = sessionStorage.getItem('gym_token');
    if (!token) { setLoading(false); return; }

    Promise.all([
      fetchWorkouts(GYM_API_HISTORY, token).catch(() => []),
      fetchMeasurements(GYM_API_HISTORY, token).catch(() => []),
    ]).then(([w, m]) => {
      setWorkouts(w);
      setMeasurements(m);
    }).finally(() => setLoading(false));
  }, []);

  function calcDurationMin(w) {
    const diff = new Date(w.finished_at) - new Date(w.started_at);
    return Math.max(0, Math.round(diff / 60000));
  }

  function calcVolumeKg(w) {
    return (w.sets || []).reduce((sum, s) => sum + (s.weight_kg || 0) * (s.reps || 0), 0);
  }

  function getMuscles(w) {
    return [...new Set((w.sets || []).map(s => s.muscle).filter(Boolean))];
  }

  const allMuscles = [...new Set(workouts.flatMap(getMuscles))].sort();

  const filteredWorkouts = muscleFilter === 'all'
    ? workouts
    : workouts.filter(w => getMuscles(w).includes(muscleFilter));

  // ── Detail-Ansicht ────────────────────────────────────────────────────────────
  if (selectedWorkout) {
    const byExercise = {};
    (selectedWorkout.sets || []).forEach(s => {
      if (!byExercise[s.exercise_id]) {
        byExercise[s.exercise_id] = { name: s.exercise_name, muscle: s.muscle, sets: [] };
      }
      byExercise[s.exercise_id].sets.push(s);
    });

    const dur = calcDurationMin(selectedWorkout);
    const vol = calcVolumeKg(selectedWorkout);
    const exCount = Object.keys(byExercise).length;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.3s ease' }}>
        <button onClick={() => setSelectedWorkout(null)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-light)', fontSize: 14, fontWeight: 500, cursor: 'pointer', padding: 0 }}>
          <Icon name="arrowLeft" size={18} /> Zurück
        </button>

        <div>
          <h2 style={{ fontSize: 22 }}>{selectedWorkout.name || 'Workout'}</h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
            {new Date(selectedWorkout.finished_at).toLocaleDateString('de-DE', {
              weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
            })}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { label: 'Minuten', value: dur, color: 'var(--accent)' },
            { label: 'Übungen', value: exCount, color: 'var(--success)' },
            { label: 'Volumen', value: `${(vol / 1000).toFixed(1)}t`, color: 'var(--warning)' },
          ].map(({ label, value, color }) => (
            <Card key={label} style={{ textAlign: 'center', padding: 14 }}>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-display)', color }}>{value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{label}</div>
            </Card>
          ))}
        </div>

        {Object.values(byExercise).map((ex, i) => (
          <Card key={i} style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="dumbbell" size={15} color="var(--accent)" />
              </div>
              <div>
                <span style={{ fontWeight: 600, fontSize: 14, fontFamily: 'var(--font-display)' }}>{ex.name}</span>
                {ex.muscle && <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginLeft: 8 }}>{ex.muscle}</span>}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr', gap: 6, fontSize: 13 }}>
              <span style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>Set</span>
              <span style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>Gewicht</span>
              <span style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>Wdh. / Zeit</span>
              {ex.sets.map((s, si) => (
                <React.Fragment key={si}>
                  <span style={{ color: 'var(--text-secondary)' }}>{s.set_number}</span>
                  <span>{s.weight_kg != null ? `${s.weight_kg} kg` : '—'}</span>
                  <span>{s.duration_sec != null ? `${s.duration_sec} s` : s.reps != null ? `${s.reps} Reps` : '—'}</span>
                </React.Fragment>
              ))}
            </div>
          </Card>
        ))}

        {exCount === 0 && (
          <Card style={{ padding: 24, textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Keine Sätze aufgezeichnet.</p>
          </Card>
        )}

        {selectedWorkout.notes && (
          <Card style={{ padding: '14px 18px' }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{selectedWorkout.notes}</p>
          </Card>
        )}
      </div>
    );
  }

  // ── Listen-Ansicht ────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeIn 0.4s ease' }}>
      <h2 style={{ fontSize: 22 }}>Trainingshistorie</h2>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--bg-secondary)', padding: 4, borderRadius: 'var(--radius-lg)' }}>
        {[['workouts', 'Workouts'], ['measurements', 'Maße']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            flex: 1, padding: '9px 16px', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: 14,
            fontFamily: 'var(--font-display)', cursor: 'pointer', transition: 'var(--transition-fast)',
            background: tab === key ? 'var(--bg-card)' : 'transparent',
            color: tab === key ? 'var(--text-primary)' : 'var(--text-secondary)',
            boxShadow: tab === key ? 'var(--shadow-sm)' : 'none',
          }}>{label}</button>
        ))}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)', fontSize: 14 }}>Lädt…</div>
      )}

      {/* Workouts */}
      {!loading && tab === 'workouts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {allMuscles.length > 0 && (
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              {['all', ...allMuscles].map(g => (
                <button key={g} onClick={() => setMuscleFilter(g)} style={{
                  padding: '7px 16px', borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 600,
                  fontFamily: 'var(--font-display)', whiteSpace: 'nowrap', cursor: 'pointer',
                  background: muscleFilter === g ? 'var(--accent)' : 'var(--bg-card)',
                  color: muscleFilter === g ? '#fff' : 'var(--text-secondary)',
                  border: `1px solid ${muscleFilter === g ? 'var(--accent)' : 'var(--border)'}`,
                  transition: 'var(--transition-fast)',
                }}>
                  {g === 'all' ? 'Alle' : g}
                </button>
              ))}
            </div>
          )}

          {filteredWorkouts.length === 0 ? (
            <EmptyState icon="clock" title="Keine Workouts" subtitle="Schließe dein erstes Training ab!" />
          ) : filteredWorkouts.map(w => {
            const dur = calcDurationMin(w);
            const vol = calcVolumeKg(w);
            const muscles = getMuscles(w);
            return (
              <Card key={w.id} hover onClick={() => setSelectedWorkout(w)} style={{ padding: '16px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon name="dumbbell" size={18} color="var(--accent)" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, fontFamily: 'var(--font-display)' }}>{w.name || 'Workout'}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <span>{(w.sets || []).length} Sätze</span>
                        {dur > 0 && <span>{dur} min</span>}
                        {vol > 0 && <span>{(vol / 1000).toFixed(1)} t</span>}
                      </div>
                      {muscles.length > 0 && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                          {muscles.slice(0, 4).map(m => (
                            <Badge key={m} color="var(--text-tertiary)" style={{ fontSize: 10, padding: '2px 8px' }}>{m}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                      {new Date(w.finished_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })}
                    </span>
                    <div style={{ marginTop: 4 }}>
                      <Icon name="chevronRight" size={16} color="var(--text-tertiary)" />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Maße */}
      {!loading && tab === 'measurements' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {measurements.length === 0 ? (
            <EmptyState icon="chart" title="Keine Maße" subtitle="Erfasse deine Körpermaße im Profil oder nach dem Training." />
          ) : measurements.map(m => {
            const fields = [
              { key: 'weight_kg', label: 'Gewicht', unit: 'kg' },
              { key: 'chest_cm',  label: 'Brust',   unit: 'cm' },
              { key: 'waist_cm',  label: 'Taille',  unit: 'cm' },
              { key: 'hips_cm',   label: 'Hüfte',   unit: 'cm' },
              { key: 'bicep_cm',  label: 'Bizeps',  unit: 'cm' },
              { key: 'thigh_cm',  label: 'Oberschenkel', unit: 'cm' },
            ].filter(f => m[f.key] != null);

            const isWorkout = m.source === 'workout';

            return (
              <Card key={m.id} style={{ padding: '14px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: fields.length > 0 ? 10 : 0 }}>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {new Date(m.recorded_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginLeft: 8 }}>
                      {new Date(m.recorded_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 'var(--radius-full)',
                    background: isWorkout ? 'rgba(139,92,246,0.12)' : 'rgba(100,116,139,0.12)',
                    color: isWorkout ? 'var(--accent-light)' : 'var(--text-secondary)',
                  }}>
                    {isWorkout ? 'Workout' : 'Profil'}
                  </span>
                </div>
                {fields.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    {fields.map(({ key, label, unit }) => (
                      <div key={key} style={{ textAlign: 'center', minWidth: 56 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                          {m[key]}
                          <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-tertiary)', marginLeft: 2 }}>{unit}</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>{label}</div>
                      </div>
                    ))}
                  </div>
                )}
                {m.notes && (
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>{m.notes}</p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { HistoryScreen });
