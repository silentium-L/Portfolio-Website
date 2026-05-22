/* stats.jsx – Statistics & Charts screen */

function StatsScreen() {
  const [activeTab, setActiveTab] = React.useState('volume');
  const GYM_API = window.__GYM_API_BASE ?? 'http://localhost:3001';
  const [measurements, setMeasurements] = React.useState(null);

  React.useEffect(() => {
    const token = sessionStorage.getItem('gym_token');
    if (!token) { setMeasurements([]); return; }
    fetchMeasurements(GYM_API, token)
      .then(data => setMeasurements(data))
      .catch(() => setMeasurements([]));
  }, []);

  // API data is sorted DESC — reverse for chronological chart order
  const toNum = v => v == null ? null : parseFloat(v);
  const hasRealData = measurements && measurements.length > 0;
  const chrono = hasRealData ? [...measurements].reverse() : null;

  function buildSeries(apiKey, mockArr, mockKey) {
    if (chrono) {
      const filtered = chrono.filter(m => m[apiKey] != null);
      return {
        values: filtered.map(m => toNum(m[apiKey])),
        labels: filtered.map(m => new Date(m.recorded_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })),
      };
    }
    return { values: mockArr.map(m => m[mockKey]), labels: WEEK_LABELS };
  }

  const weightSeries = hasRealData
    ? buildSeries('weight_kg', BODY_MEASUREMENTS, 'weight')
    : { values: BODY_WEIGHT_SERIES, labels: WEEK_LABELS };

  const withWeight = hasRealData ? measurements.filter(m => m.weight_kg != null) : [];
  const weightDiff = withWeight.length >= 2
    ? toNum(withWeight[0].weight_kg) - toNum(withWeight[withWeight.length - 1].weight_kg)
    : null;

  const tabs = [
    { id: 'volume', label: 'Volumen' },
    { id: 'weight', label: 'Gewicht' },
    { id: 'muscles', label: 'Muskeln' },
    { id: 'frequency', label: 'Frequenz' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeIn 0.4s ease' }}>
      <h2 style={{ fontSize: 22 }}>Statistiken</h2>
      <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'volume' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.3s ease' }}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15 }}>Wochenvolumen (kg)</h3>
              <Badge color="var(--success)">+6.3%</Badge>
            </div>
            <div style={{ height: 200 }}>
              <BarChart data={WEEKLY_VOLUME} labels={WEEK_LABELS} width={520} height={200} />
            </div>
          </Card>
          <Card>
            <h3 style={{ fontSize: 15, marginBottom: 16 }}>Volumen-Trend</h3>
            <div style={{ height: 180 }}>
              <LineChart data={WEEKLY_VOLUME} labels={WEEK_LABELS} width={520} height={180} />
            </div>
          </Card>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Card style={{ textAlign: 'center' }}>
              <StatValue label="Ø pro Woche" value={(WEEKLY_VOLUME.reduce((a,b)=>a+b,0)/WEEKLY_VOLUME.length/1000).toFixed(1)} unit="t" icon="chart" color="var(--accent)" />
            </Card>
            <Card style={{ textAlign: 'center' }}>
              <StatValue label="Bestes Woche" value={(Math.max(...WEEKLY_VOLUME)/1000).toFixed(1)} unit="t" icon="trophy" color="var(--warning)" />
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'weight' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.3s ease' }}>
          {measurements === null && (
            <Card style={{ padding: 20, textAlign: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Lade Messdaten…</span>
            </Card>
          )}
          {measurements !== null && weightSeries.values.length > 0 && (
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 15 }}>Körpergewicht (kg)</h3>
                {weightDiff !== null && weightDiff !== 0 && (
                  <Badge color={weightDiff < 0 ? 'var(--success)' : 'var(--danger)'}>
                    {weightDiff < 0 ? '' : '+'}{weightDiff.toFixed(1)} kg
                  </Badge>
                )}
              </div>
              <div style={{ height: 200 }}>
                <LineChart data={weightSeries.values} labels={weightSeries.labels} width={520} height={200} color="var(--success)" yUnit="kg" />
              </div>
            </Card>
          )}
          {measurements !== null && (
            <Card>
              <h3 style={{ fontSize: 15, marginBottom: 16 }}>Körpermaße</h3>
              {measurements.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: '12px 0' }}>
                  Noch keine Messungen — erfasse deine ersten Maße im Profil.
                </p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 12 }}>
                  {[
                    { label: 'Brust',        apiKey: 'chest_cm',  mockKey: 'chest',  unit: 'cm', color: 'var(--accent)' },
                    { label: 'Taille',       apiKey: 'waist_cm',  mockKey: 'waist',  unit: 'cm', color: 'var(--success)' },
                    { label: 'Arm',          apiKey: 'bicep_cm',  mockKey: 'arm',    unit: 'cm', color: 'var(--info)' },
                    { label: 'Oberschenkel', apiKey: 'thigh_cm',  mockKey: 'thigh',  unit: 'cm', color: 'var(--warning)' },
                  ].map(metric => {
                    const s = buildSeries(metric.apiKey, BODY_MEASUREMENTS, metric.mockKey);
                    if (s.values.length === 0) return null;
                    const latest = s.values[s.values.length - 1];
                    const first  = s.values[0];
                    const diff   = (latest - first).toFixed(1);
                    return (
                      <Card key={metric.label} style={{ padding: 14, textAlign: 'center' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{metric.label}</span>
                        <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-display)', color: metric.color, margin: '6px 0' }}>{latest}</div>
                        <MiniSparkline data={s.values} width={70} height={24} color={metric.color} style={{ margin: '0 auto' }} />
                        <span style={{ fontSize: 11, color: parseFloat(diff) > 0 ? 'var(--success)' : 'var(--danger)', marginTop: 4, display: 'block' }}>
                          {parseFloat(diff) > 0 ? '+' : ''}{diff} {metric.unit}
                        </span>
                      </Card>
                    );
                  })}
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {activeTab === 'muscles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.3s ease' }}>
          <Card>
            <h3 style={{ fontSize: 15, marginBottom: 16 }}>Muskelgruppen-Balance</h3>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
              <RadarChart data={MUSCLE_DISTRIBUTION} size={260} />
            </div>
          </Card>
          <Card>
            <h3 style={{ fontSize: 15, marginBottom: 16 }}>Verteilung</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(MUSCLE_DISTRIBUTION).sort((a,b) => b[1]-a[1]).map(([muscle, pct]) => (
                <div key={muscle} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', width: 90, flexShrink: 0 }}>{muscle}</span>
                  <div style={{ flex: 1, height: 8, borderRadius: 99, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 99, width: `${pct}%`,
                      background: 'linear-gradient(90deg, var(--accent-dark), var(--accent-light))',
                      transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', width: 36, textAlign: 'right' }}>{pct}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'frequency' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.3s ease' }}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15 }}>Trainingsfrequenz</h3>
              <span style={{ fontSize: 13, color: 'var(--text-secondary) '}}>Letzte 90 Tage</span>
            </div>
            <HeatmapChart data={HEATMAP_DATA} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Weniger</span>
              {[0,1,2,3].map(i => (
                <div key={i} style={{ width: 12, height: 12, borderRadius: 3,
                  background: ['var(--bg-secondary)','rgba(139,92,246,0.2)','rgba(139,92,246,0.45)','rgba(139,92,246,0.8)'][i] }} />
              ))}
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Mehr</span>
            </div>
          </Card>
          <Card>
            <h3 style={{ fontSize: 15, marginBottom: 16 }}>Workouts pro Woche</h3>
            <div style={{ height: 180 }}>
              <BarChart data={WEEKLY_WORKOUTS_COUNT} labels={WEEK_LABELS} width={520} height={180} color="var(--accent-light)" />
            </div>
          </Card>
          <Card>
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>Schlaf & Recovery</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
              {SLEEP_DATA.map((s, i) => {
                const qualColor = s.quality >= 85 ? 'var(--success)' : s.quality >= 70 ? 'var(--warning)' : 'var(--danger)';
                return (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginBottom: 4 }}>
                      {new Date(s.date).toLocaleDateString('de-DE', { weekday: 'short' })}
                    </div>
                    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                      <ProgressRing value={s.quality} size={44} strokeWidth={4} color={qualColor} showValue={false} />
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4 }}>{s.hours}h</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { StatsScreen });
