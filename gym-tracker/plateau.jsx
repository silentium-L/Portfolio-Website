/* plateau.jsx – Plateau Radar screen */

function PlateauScreen() {
  const severityConfig = {
    high: { color: 'var(--danger)', bg: 'var(--danger-bg)', label: 'Hoch', border: 'rgba(248,113,113,0.2)' },
    medium: { color: 'var(--warning)', bg: 'var(--warning-bg)', label: 'Mittel', border: 'rgba(251,191,36,0.2)' },
    low: { color: 'var(--info)', bg: 'var(--info-bg)', label: 'Niedrig', border: 'rgba(96,165,250,0.2)' },
  };

  const tips = {
    'Gewicht': ['Deload-Woche einlegen', 'Rep-Schema variieren (z.B. 5x5 statt 4x8)', 'Pausenzeiten verlängern'],
    'Wiederholungen': ['Tempo-Training versuchen', 'Drop-Sets einbauen', 'Gewicht leicht reduzieren, Reps steigern'],
    'Volumen': ['Einen Satz mehr pro Übung', 'Zusätzliche Isolationsübung', 'Trainingsfrequenz erhöhen'],
    'Variation': ['Übungsvariante wechseln', 'Griffweite/Position ändern', 'Supersätze einbauen'],
  };

  // Radar visualization data
  const radarData = {};
  PLATEAU_ALERTS.forEach(a => {
    radarData[a.exercise.split(' ')[0]] = Math.min(100, a.weeks * 20 + 20);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeIn 0.4s ease' }}>
      <div>
        <h2 style={{ fontSize: 22 }}>Plateau-Radar</h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
          Erkennt Stagnation bei deinen Übungen frühzeitig.
        </p>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
        {Object.entries(severityConfig).map(([key, cfg]) => {
          const count = PLATEAU_ALERTS.filter(a => a.severity === key).length;
          return (
            <Card key={key} style={{ padding: 14, textAlign: 'center', borderColor: count > 0 ? cfg.border : 'var(--border)' }}>
              <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-display)', color: cfg.color }}>{count}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{cfg.label}</div>
            </Card>
          );
        })}
      </div>

      {/* Radar viz */}
      {Object.keys(radarData).length >= 3 && (
        <Card>
          <h3 style={{ fontSize: 15, marginBottom: 12 }}>Stagnations-Übersicht</h3>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <RadarChart data={radarData} size={240} color="var(--danger)" />
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center', marginTop: 8 }}>
            Höhere Werte = stärkere Stagnation
          </p>
        </Card>
      )}

      {/* Alert cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {PLATEAU_ALERTS.sort((a, b) => {
          const order = { high: 0, medium: 1, low: 2 };
          return order[a.severity] - order[b.severity];
        }).map((alert, i) => {
          const cfg = severityConfig[alert.severity];
          return (
            <Card key={i} style={{ borderColor: cfg.border, animation: `fadeIn ${0.3 + i * 0.1}s ease` }}>
              <div style={{ display: 'flex', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="alertTriangle" size={20} color={cfg.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 15, fontFamily: 'var(--font-display)' }}>{alert.exercise}</span>
                      <Badge color={cfg.color} bg={cfg.bg} style={{ marginLeft: 8 }}>{alert.metric}</Badge>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{alert.weeks} Wochen</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.5 }}>{alert.detail}</p>

                  {/* Tips */}
                  <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Empfehlungen:</span>
                    <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {(tips[alert.metric] || tips['Variation']).map((tip, ti) => (
                        <li key={ti} style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { PlateauScreen });
