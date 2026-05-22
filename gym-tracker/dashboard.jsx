/* dashboard.jsx – Dashboard / Home screen */

function DashboardScreen({ onNavigate, user }) {
  const ws = WEEK_SUMMARY;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Guten Morgen';
    if (h < 18) return 'Guten Tag';
    return 'Guten Abend';
  })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header greeting */}
      <div style={{ animation: 'fadeIn 0.4s ease' }}>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>{greeting}</p>
        <h1 style={{ fontSize: 26 }}>{user?.vorname || user?.username} 👋</h1>
      </div>

      {/* Weekly progress bar */}
      <Card style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, var(--bg-card) 100%)', animation: 'fadeIn 0.5s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-display)' }}>Wochenziel</span>
          <Badge color="var(--accent)">{ws.workoutsThisWeek} / {ws.weeklyGoal} Workouts</Badge>
        </div>
        <div style={{ height: 8, borderRadius: 99, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 99,
            background: 'linear-gradient(90deg, var(--accent-dark), var(--accent-light))',
            width: `${(ws.workoutsThisWeek / ws.weeklyGoal) * 100}%`,
            transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          }} />
        </div>
      </Card>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, animation: 'fadeIn 0.6s ease' }}>
        <Card>
          <StatValue label="Volumen" value={(ws.totalVolume/1000).toFixed(1)} unit="t" icon="chart" color="var(--accent)" trend={ws.volumeChange} sub="diese Woche" />
        </Card>
        <Card>
          <StatValue label="Streak" value={ws.streak} unit="Tage" icon="flame" color="var(--warning)" />
        </Card>
        <Card>
          <StatValue label="Schlaf Ø" value={ws.avgSleep} unit="h" icon="moon" color="var(--info)" sub={`Qualität ${ws.sleepQuality}%`} />
        </Card>
        <Card>
          <StatValue label="Gewicht" value={user.currentWeight} unit="kg" icon="scale" color="var(--success)" trend={-0.5} sub="vs. letzte Woche" />
        </Card>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', animation: 'fadeIn 0.65s ease' }}>
        <Button variant="primary" icon="plus" onClick={() => onNavigate('workout')} style={{ flex: 1, minWidth: 160, padding: '14px 20px' }}>
          Workout starten
        </Button>
        <Button variant="secondary" icon="chart" onClick={() => onNavigate('stats')} style={{ flex: 1, minWidth: 160, padding: '14px 20px' }}>
          Statistiken
        </Button>
      </div>

      {/* Recent Workouts */}
      <div style={{ animation: 'fadeIn 0.7s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 16 }}>Letzte Workouts</h3>
          <button onClick={() => onNavigate('history')} style={{ fontSize: 13, color: 'var(--accent-light)', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            Alle ansehen <Icon name="chevronRight" size={14} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {RECENT_WORKOUTS.slice(0, 4).map((w, i) => (
            <Card key={w.id} hover onClick={() => onNavigate('history')} style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ fontWeight: 600, fontSize: 15, fontFamily: 'var(--font-display)' }}>{w.name}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {w.exercises.length} Übungen · {w.duration} min · {(calcVolume(w)/1000).toFixed(1)}t
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                    {new Date(w.date).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* PRs */}
      <div style={{ animation: 'fadeIn 0.75s ease' }}>
        <h3 style={{ fontSize: 16, marginBottom: 12 }}>Persönliche Rekorde</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
          {PERSONAL_RECORDS.map((pr, i) => (
            <Card key={i} style={{ padding: '14px 16px', textAlign: 'center' }}>
              <Icon name="trophy" size={20} color="var(--warning)" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--warning)' }}>{pr.value} {pr.unit}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{pr.label}</div>
            </Card>
          ))}
        </div>
      </div>

      {/* Alerts preview */}
      {PLATEAU_ALERTS.filter(a => a.severity === 'high').length > 0 && (
        <Card hover onClick={() => onNavigate('plateau')}
          style={{ borderColor: 'rgba(251,191,36,0.2)', background: 'rgba(251,191,36,0.04)', cursor: 'pointer', animation: 'fadeIn 0.8s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--warning-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="alertTriangle" size={18} color="var(--warning)" />
            </div>
            <div>
              <span style={{ fontWeight: 600, fontSize: 14, fontFamily: 'var(--font-display)' }}>Plateau erkannt</span>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                {PLATEAU_ALERTS.filter(a => a.severity === 'high')[0].exercise} – keine Steigerung seit {PLATEAU_ALERTS.filter(a => a.severity === 'high')[0].weeks} Wochen
              </p>
            </div>
            <Icon name="chevronRight" size={18} color="var(--text-tertiary)" style={{ marginLeft: 'auto' }} />
          </div>
        </Card>
      )}

      {/* Hidden gains teaser */}
      <Card hover onClick={() => onNavigate('gains')}
        style={{ borderColor: 'rgba(52,211,153,0.2)', background: 'rgba(52,211,153,0.04)', cursor: 'pointer', animation: 'fadeIn 0.85s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="sparkles" size={18} color="var(--success)" />
          </div>
          <div>
            <span style={{ fontWeight: 600, fontSize: 14, fontFamily: 'var(--font-display)' }}>Hidden Gains entdeckt</span>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
              {HIDDEN_GAINS.length} Mikro-Fortschritte erkannt — Details ansehen
            </p>
          </div>
          <Icon name="chevronRight" size={18} color="var(--text-tertiary)" style={{ marginLeft: 'auto' }} />
        </div>
      </Card>
    </div>
  );
}

Object.assign(window, { DashboardScreen });
