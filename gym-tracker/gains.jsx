/* gains.jsx – Hidden Gains / Mikro-Fortschritt screen */

function GainsScreen() {
  const typeConfig = {
    volume: { icon: 'chart', color: 'var(--accent)', label: 'Volumen-Steigerung', bg: 'var(--accent-subtle)' },
    reps: { icon: 'trendUp', color: 'var(--success)', label: 'Mehr Wiederholungen', bg: 'var(--success-bg)' },
    frequency: { icon: 'flame', color: 'var(--warning)', label: 'Frequenz-Steigerung', bg: 'var(--warning-bg)' },
  };

  // Simulated sparkline data per gain
  const sparkData = {
    0: [80, 82, 85, 88, 90, 87, 92, 95],
    1: [6, 6, 6, 7, 7, 7, 8, 8],
    2: [1, 1, 1, 1, 2, 2, 2, 2],
    3: [60, 62, 65, 68, 70, 72, 75, 78],
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeIn 0.4s ease' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <h2 style={{ fontSize: 22 }}>Hidden Gains</h2>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="sparkles" size={16} color="var(--success)" />
          </div>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          Fortschritte, die auf den ersten Blick nicht sichtbar sind – aber echte Gains!
        </p>
      </div>

      {/* Summary banner */}
      <Card style={{ background: 'linear-gradient(135deg, rgba(52,211,153,0.1) 0%, rgba(139,92,246,0.08) 100%)', borderColor: 'rgba(52,211,153,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="zap" size={24} color="var(--success)" />
            </div>
            <div>
              <span style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--success)' }}>{HIDDEN_GAINS.length}</span>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)', marginLeft: 8 }}>Mikro-Fortschritte erkannt</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Type summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
        {Object.entries(typeConfig).map(([type, cfg]) => {
          const count = HIDDEN_GAINS.filter(g => g.type === type).length;
          return (
            <Card key={type} style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name={cfg.icon} size={16} color={cfg.color} />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{count}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{cfg.label}</div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Gain cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {HIDDEN_GAINS.map((gain, i) => {
          const cfg = typeConfig[gain.type];
          return (
            <Card key={i} style={{ borderColor: cfg.color + '25', animation: `fadeIn ${0.3 + i * 0.12}s ease` }}>
              <div style={{ display: 'flex', gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name={cfg.icon} size={22} color={cfg.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 15, fontFamily: 'var(--font-display)' }}>{gain.title}</span>
                      <Badge color={cfg.color} bg={cfg.bg} style={{ marginLeft: 8 }}>{gain.exercise}</Badge>
                    </div>
                    <MiniSparkline data={sparkData[i] || sparkData[0]} width={72} height={24} color={cfg.color} />
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.5 }}>{gain.detail}</p>

                  <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 'var(--radius-sm)', background: cfg.bg }}>
                      <Icon name="trendUp" size={14} color={cfg.color} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: cfg.color }}>{gain.metric}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Icon name="clock" size={13} color="var(--text-tertiary)" />
                      <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{gain.period}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Motivation banner */}
      <Card style={{ textAlign: 'center', padding: '28px 20px', background: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(52,211,153,0.06) 100%)' }}>
        <Icon name="trophy" size={32} color="var(--warning)" style={{ margin: '0 auto 12px' }} />
        <h3 style={{ fontSize: 17, marginBottom: 6 }}>Dranbleiben zahlt sich aus!</h3>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 380, margin: '0 auto', lineHeight: 1.5 }}>
          Auch wenn das Maximalgewicht mal stagniert – dein Körper macht Fortschritte. Diese Mikro-Gains sind die Basis für den nächsten Durchbruch.
        </p>
      </Card>
    </div>
  );
}

Object.assign(window, { GainsScreen });
