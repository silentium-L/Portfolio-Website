// Match detail (scoreboard) view — Phase A, no timeline

const ROLE_ORDER = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"];
const ROLE_LBL = { TOP: "Top", JUNGLE: "Jng", MIDDLE: "Mid", BOTTOM: "ADC", UTILITY: "Sup" };

function MatchDetail({ matchId, focusPuuid, region, ddragon, onBack }) {
  const raw = window.RiotAPI.getCachedMatch(matchId);
  const [tab, setTab] = React.useState("scoreboard");
  const [timeline, setTimeline] = React.useState(() => window.RiotAPI.getCachedTimeline(matchId));
  const [timelineLoading, setTimelineLoading] = React.useState(false);
  const [timelineError, setTimelineError] = React.useState(null);

  const onSelectTab = (next) => {
    setTab(next);
    if (next === "timeline" && !timeline && !timelineLoading) {
      setTimelineLoading(true);
      setTimelineError(null);
      window.RiotAPI.fetchMatchTimeline({ region, matchId })
        .then(setTimeline)
        .catch(err => {
          console.error("Timeline fetch failed:", err);
          setTimelineError(err.message || String(err));
        })
        .finally(() => setTimelineLoading(false));
    }
  };

  if (!raw) {
    return (
      <div style={{ padding: 40, textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--ink-faint)' }}>
        Match data not in cache. Go back and reopen.
        <div style={{ marginTop: 16 }}>
          <button onClick={onBack} style={backBtnStyle}>← Back</button>
        </div>
      </div>
    );
  }

  const detail = window.RiotAPI.extractMatchDetail(raw, focusPuuid, ddragon);
  if (!detail) return null;

  return (
    <div className="champ-detail">
      <div className="champ-detail-back">
        <button onClick={onBack}>← Back to history</button>
        <div className="champ-detail-meta">
          MATCH · {detail.matchId} · PATCH {detail.gameVersion?.split(".").slice(0,2).join(".")}
        </div>
      </div>

      <MatchHero detail={detail} />

      {/* Tab toggle */}
      <div className="matches-filter" style={{ display: 'inline-flex', marginBottom: 24 }}>
        <button
          className={tab === "scoreboard" ? "active" : ""}
          onClick={() => onSelectTab("scoreboard")}
        >Scoreboard</button>
        <button
          className={tab === "timeline" ? "active" : ""}
          onClick={() => onSelectTab("timeline")}
        >Timeline</button>
        <button
          className={tab === "compare" ? "active" : ""}
          onClick={() => onSelectTab("compare")}
        >Compare</button>
      </div>

      {tab === "scoreboard" && (
        <>
          {detail.teams.map(team => (
            <TeamPanel key={team.teamId} team={team} ddragon={ddragon} />
          ))}
          <div className="lane-note" style={{ marginTop: 32 }}>
            <div className="lane-note-label">METHODOLOGY</div>
            <p className="lane-note-text">
              Damage and gold bars compare each player to the <em>highest</em> on the scoreboard.
              Items reflect the final inventory at game end. Open the <em>Timeline</em> tab for
              the gold curve and event ledger, or <em>Compare</em> to put any two players side by side.
            </p>
          </div>
        </>
      )}

      {tab === "timeline" && (
        <TimelineView
          timeline={timeline}
          raw={raw}
          loading={timelineLoading}
          error={timelineError}
          focusPuuid={focusPuuid}
          ddragon={ddragon}
        />
      )}

      {tab === "compare" && (
        <CompareView
          detail={detail}
          focusPuuid={focusPuuid}
          ddragon={ddragon}
        />
      )}
    </div>
  );
}

const backBtnStyle = {
  background: 'transparent', border: '1px solid var(--accent)',
  color: 'var(--accent)', padding: '10px 18px',
  fontFamily: 'var(--font-mono)', fontSize: 11,
  letterSpacing: '0.24em', textTransform: 'uppercase', cursor: 'pointer',
};

function MatchHero({ detail }) {
  const winColor = detail.win ? 'var(--success)' : 'var(--danger)';
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto',
      gap: 32,
      alignItems: 'center',
      padding: '28px 0 32px',
      borderBottom: '1px solid var(--line)',
      marginBottom: 32,
    }}>
      <div>
        <div style={{
          fontFamily: 'var(--font-display)', fontStyle: 'italic',
          fontSize: 56, fontWeight: 400, lineHeight: 1, color: winColor,
        }}>
          {detail.result}
        </div>
        <div style={{
          marginTop: 6,
          fontFamily: 'var(--font-mono)', fontSize: 10,
          letterSpacing: '0.24em', color: 'var(--ink-faint)',
          textTransform: 'uppercase',
        }}>
          {detail.queue} · {detail.duration}
        </div>
      </div>

      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 32,
        fontFamily: 'var(--font-display)', fontStyle: 'italic',
      }}>
        <ScoreSide team={detail.teams[0]} />
        <div style={{
          fontSize: 22, color: 'var(--accent)',
          fontFamily: 'var(--font-mono)', letterSpacing: '0.32em',
        }}>VS</div>
        <ScoreSide team={detail.teams[1]} />
      </div>

      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 10,
        letterSpacing: '0.18em', color: 'var(--ink-faint)',
        textAlign: 'right', textTransform: 'uppercase',
      }}>
        {detail.when}
      </div>
    </div>
  );
}

function ScoreSide({ team }) {
  const sideColor = team.side === "BLUE" ? "#3c8ec8" : "#c83c3c";
  return (
    <div style={{ textAlign: 'center', minWidth: 100 }}>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 10,
        letterSpacing: '0.24em', color: sideColor, marginBottom: 4,
      }}>
        {team.side}{team.win ? ' · WIN' : ''}
      </div>
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: 44,
        color: team.win ? 'var(--accent-bright)' : 'var(--ink)',
        fontWeight: 400, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
      }}>
        {team.kills}
      </div>
    </div>
  );
}

function TeamPanel({ team, ddragon }) {
  const sideColor = team.side === "BLUE" ? "#3c8ec8" : "#c83c3c";

  // Sort players in canonical role order
  const sortedPlayers = [...team.players].sort((a, b) => {
    const ai = ROLE_ORDER.indexOf(a.role);
    const bi = ROLE_ORDER.indexOf(b.role);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <div style={{
      border: '1px solid var(--line-strong)',
      borderLeft: `3px solid ${sideColor}`,
      marginBottom: 24,
      background: 'color-mix(in srgb, var(--bg-deep) 30%, transparent)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 20px',
        borderBottom: '1px solid var(--line)',
        background: `color-mix(in srgb, ${sideColor} 8%, transparent)`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            letterSpacing: '0.32em', color: sideColor, fontWeight: 700,
          }}>
            {team.side} TEAM
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 10,
            letterSpacing: '0.2em',
            color: team.win ? 'var(--success)' : 'var(--danger)',
            textTransform: 'uppercase',
          }}>
            {team.win ? 'VICTORY' : 'DEFEAT'} · {team.kills} KILLS · {(team.gold / 1000).toFixed(1)}K GOLD
          </span>
        </div>
        <ObjectivesBar obj={team.objectives} />
      </div>

      {/* Scoreboard rows */}
      <div>
        {sortedPlayers.map((p, i) => (
          <PlayerRow key={p.puuid || i} p={p} ddragon={ddragon} />
        ))}
      </div>
    </div>
  );
}

function ObjectivesBar({ obj }) {
  const items = [
    { key: 'tower', label: 'T', val: obj.tower },
    { key: 'dragon', label: 'D', val: obj.dragon },
    { key: 'baron', label: 'B', val: obj.baron },
    { key: 'herald', label: 'H', val: obj.herald },
    { key: 'inhibitor', label: 'I', val: obj.inhibitor },
  ];
  return (
    <div style={{ display: 'flex', gap: 14 }}>
      {items.map(o => (
        <div key={o.key} style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.16em',
          color: o.val > 0 ? 'var(--accent)' : 'var(--ink-faint)',
        }}>
          <span style={{
            width: 16, height: 16, border: '1px solid currentColor',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontStyle: 'italic',
            fontSize: 11,
          }}>{o.label}</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>{o.val}</span>
        </div>
      ))}
    </div>
  );
}

function PlayerRow({ p, ddragon }) {
  const v = ddragon?.version;

  const focusedStyle = p.isFocused ? {
    background: 'color-mix(in srgb, var(--accent) 8%, transparent)',
    borderLeft: '3px solid var(--accent)',
    paddingLeft: 17,
  } : {
    paddingLeft: 20,
  };

  const kpPct = Math.round((p.killParticipation || 0) * 100);
  const timeDeadMin = Math.floor((p.timeDead || 0) / 60);
  const timeDeadSec = (p.timeDead || 0) % 60;
  const timeDeadPct = Math.round((p.timeDeadPct || 0) * 100);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '52px 30px 30px 1fr 110px 100px 200px 110px 200px',
      gap: 12,
      alignItems: 'center',
      padding: '12px 20px',
      borderBottom: '1px solid var(--line)',
      ...focusedStyle,
    }}>
      {/* Champion + level */}
      <div style={{ position: 'relative', width: 44, height: 44 }}>
        {p.championPortrait ? (
          <div style={{
            width: 44, height: 44,
            border: '1px solid var(--accent-deep)',
            backgroundImage: `url(${p.championPortrait})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
          }}></div>
        ) : (
          <div style={{
            width: 44, height: 44,
            border: '1px solid var(--accent-deep)',
            background: 'linear-gradient(135deg, var(--accent-deep), var(--accent-darker))',
          }}></div>
        )}
        <div style={{
          position: 'absolute', bottom: -4, right: -4,
          background: 'var(--bg)', border: '1px solid var(--accent-deep)',
          fontFamily: 'var(--font-mono)', fontSize: 9,
          padding: '1px 4px', color: 'var(--accent)',
          fontVariantNumeric: 'tabular-nums',
        }}>{p.level}</div>
      </div>

      {/* Summoner spells stacked vertically */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <SpellIcon spellKey={p.summoner1} ddragon={ddragon} />
        <SpellIcon spellKey={p.summoner2} ddragon={ddragon} />
      </div>

      {/* Runes: keystone + secondary tree */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <RuneIcon perkId={p.keystone} ddragon={ddragon} keystone />
        <RuneStyleIcon styleId={p.secondaryStyle} ddragon={ddragon} />
      </div>

      {/* Name + role */}
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 500,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          color: p.isFocused ? 'var(--accent-bright)' : 'var(--ink)',
        }}>
          {p.name}{p.tag && <span style={{ color: 'var(--ink-faint)', fontStyle: 'italic', fontSize: 13 }}>#{p.tag}</span>}
          {p.isFocused && (
            <span style={{
              marginLeft: 8, fontFamily: 'var(--font-mono)', fontSize: 9,
              letterSpacing: '0.2em', color: 'var(--accent)',
              border: '1px solid var(--accent)', padding: '1px 5px',
              verticalAlign: 'middle',
            }}>YOU</span>
          )}
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          letterSpacing: '0.18em', color: 'var(--ink-faint)',
          textTransform: 'uppercase', marginTop: 2,
        }}>
          {p.champion} · {ROLE_LBL[p.role] || p.role || '—'}
          {p.firstBloodKill && <span style={{ marginLeft: 6, color: 'var(--accent-bright)' }}>· FB</span>}
          {p.firstBloodAssist && !p.firstBloodKill && <span style={{ marginLeft: 6, color: 'var(--accent)' }}>· FB-A</span>}
        </div>
      </div>

      {/* KDA + KP% */}
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, lineHeight: 1 }}>
          {p.k} / <span style={{ color: 'var(--danger)' }}>{p.d}</span> / {p.a}
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em',
          color: parseFloat(p.kda) >= 4 ? 'var(--accent-bright)' : 'var(--ink-dim)', marginTop: 3,
          display: 'flex', justifyContent: 'space-between', gap: 6,
        }}>
          <span>{p.kda} KDA</span>
          <span style={{ color: kpPct >= 60 ? 'var(--accent-bright)' : 'var(--ink-faint)' }}>
            {kpPct}% KP
          </span>
        </div>
      </div>

      {/* CS + Time Dead */}
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, lineHeight: 1 }}>{p.cs}</div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em',
          color: 'var(--ink-faint)', marginTop: 3,
          display: 'flex', justifyContent: 'space-between', gap: 4,
        }}>
          <span>{p.csPerMin}/m</span>
          <span
            title={`${timeDeadMin}:${String(timeDeadSec).padStart(2,'0')} dead`}
            style={{ color: timeDeadPct >= 15 ? 'var(--danger)' : 'var(--ink-faint)' }}
          >
            ✝{timeDeadPct}%
          </span>
        </div>
      </div>

      {/* Damage bar */}
      <StatBar
        value={p.dmg.toLocaleString()}
        sub={`${(p.dmgShare * 100).toFixed(0)}% team`}
        fillPct={p.dmgVsMax * 100}
        color="var(--accent)"
      />

      {/* Vision broken out */}
      <VisionBlock p={p} />

      {/* Items */}
      <div style={{ display: 'flex', gap: 3, justifyContent: 'flex-end' }}>
        {p.items.map((id, i) => <ItemSlot key={i} itemId={id} version={v} />)}
        <div style={{ width: 4 }}></div>
        <ItemSlot itemId={p.trinket} version={v} trinket />
      </div>
    </div>
  );
}

function VisionBlock({ p }) {
  return (
    <div
      title={`Vision Score ${p.vision} · ${p.wardsPlaced} placed · ${p.wardsKilled} killed · ${p.controlWards} control`}
      style={{ textAlign: 'right' }}
    >
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, lineHeight: 1 }}>{p.vision}</div>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em',
        color: 'var(--ink-faint)', marginTop: 4,
        display: 'flex', justifyContent: 'flex-end', gap: 6,
      }}>
        <span title="Wards placed" style={{ color: 'var(--ink-dim)' }}>{p.wardsPlaced}<span style={{ color: 'var(--ink-faint)' }}>w</span></span>
        <span title="Wards killed" style={{ color: 'var(--ink-dim)' }}>{p.wardsKilled}<span style={{ color: 'var(--ink-faint)' }}>k</span></span>
        <span title="Control wards" style={{ color: p.controlWards > 0 ? 'var(--accent)' : 'var(--ink-faint)' }}>{p.controlWards}<span style={{ color: 'var(--ink-faint)' }}>c</span></span>
      </div>
    </div>
  );
}

function RuneIcon({ perkId, ddragon, keystone }) {
  const url = window.RiotAPI.runeIconUrl(ddragon, perkId);
  const size = keystone ? 22 : 18;
  return (
    <div style={{
      width: size, height: size,
      borderRadius: '50%',
      background: keystone ? 'rgba(0,0,0,0.4)' : 'transparent',
      overflow: 'hidden', flexShrink: 0,
    }}>
      {url && (
        <img
          src={url}
          alt=""
          width={size}
          height={size}
          style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      )}
    </div>
  );
}

function RuneStyleIcon({ styleId, ddragon }) {
  const url = window.RiotAPI.runeStyleIconUrl(ddragon, styleId);
  return (
    <div style={{
      width: 16, height: 16,
      borderRadius: '50%',
      background: 'rgba(0,0,0,0.3)',
      overflow: 'hidden', flexShrink: 0,
      margin: '0 1px',
    }}>
      {url && (
        <img
          src={url}
          alt=""
          width={16}
          height={16}
          style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      )}
    </div>
  );
}

function SpellIcon({ spellKey, ddragon }) {
  const url = ddragon ? window.RiotAPI.summonerSpellIconUrl(ddragon.version, ddragon, spellKey) : null;
  return (
    <div style={{
      width: 20, height: 20,
      border: '1px solid var(--line-strong)',
      background: 'var(--bg-deep)',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      {url && (
        <img
          src={url}
          alt=""
          width={20}
          height={20}
          style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      )}
    </div>
  );
}

function ItemSlot({ itemId, version, trinket }) {
  const url = (itemId && version) ? window.RiotAPI.itemIconUrl(version, itemId) : null;
  const empty = !itemId || itemId === 0;
  return (
    <div style={{
      width: 26, height: 26,
      border: `1px solid ${trinket ? 'var(--accent-deep)' : 'var(--line-strong)'}`,
      background: 'var(--bg-deep)',
      opacity: empty ? 0.4 : 1,
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      {url && (
        <img
          src={url}
          alt=""
          width={26}
          height={26}
          style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      )}
    </div>
  );
}

function StatBar({ value, sub, fillPct, color }) {
  return (
    <div style={{ minWidth: 180 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        marginBottom: 4,
      }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>{value}</span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 9,
          letterSpacing: '0.14em', color: 'var(--ink-faint)',
        }}>{sub}</span>
      </div>
      <div style={{ height: 3, background: 'var(--line)' }}>
        <div style={{
          height: '100%', width: `${Math.max(0, Math.min(100, fillPct))}%`,
          background: color, transition: 'width 0.3s',
        }}></div>
      </div>
    </div>
  );
}

// ============ TIMELINE ============

function TimelineView({ timeline, raw, loading, error, focusPuuid, ddragon }) {
  if (loading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.24em', color: 'var(--ink-faint)' }}>
        FETCHING TIMELINE…
      </div>
    );
  }
  if (error) {
    return (
      <div style={{
        padding: 24, border: '1px solid var(--danger)', color: 'var(--danger)',
        fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.18em',
      }}>
        TIMELINE FETCH FAILED · {error}
      </div>
    );
  }
  if (!timeline) return null;

  const view = window.RiotAPI.extractTimelineView(timeline, raw, focusPuuid);
  if (!view) return null;

  return (
    <>
      <GoldDiffChart goldDiff={view.goldDiff} focusedTeam={view.focusedTeam} />
      <PlayerSeriesCharts series={view.playerSeries} view={view} ddragon={ddragon} raw={raw} />
      <LaningPhaseScore view={view} ddragon={ddragon} />
      <SkillOrder view={view} ddragon={ddragon} />
      <EventTicker events={view.events} focusedTeam={view.focusedTeam} ddragon={ddragon} idMap={view.idMap} />
    </>
  );
}

// ---------- Laning-Phase Score (CS/Gold @ 10 and @ 14) ----------

function LaningPhaseScore({ view, ddragon }) {
  if (!view.focusedId || !view.oppId) return null;
  if (!view.snapshot10 && !view.snapshot14) return null;

  const youInfo = view.idMap[view.focusedId];
  const oppInfo = view.idMap[view.oppId];
  const youPortrait = ddragon ? window.RiotAPI.championPortraitUrl(ddragon.version, youInfo?.championName) : null;
  const oppPortrait = ddragon ? window.RiotAPI.championPortraitUrl(ddragon.version, oppInfo?.championName) : null;

  const buildRow = (snapshot, label) => {
    if (!snapshot) return null;
    const you = snapshot.perPlayer[String(view.focusedId)];
    const opp = snapshot.perPlayer[String(view.oppId)];
    if (!you || !opp) return null;
    return {
      label,
      minute: snapshot.minute,
      csDiff: (you.cs || 0) - (opp.cs || 0),
      goldDiff: (you.gold || 0) - (opp.gold || 0),
      xpDiff: (you.xp || 0) - (opp.xp || 0),
      youCs: you.cs, oppCs: opp.cs,
      youGold: you.gold, oppGold: opp.gold,
      youLvl: you.level, oppLvl: opp.level,
    };
  };

  const rows = [
    buildRow(view.snapshot10, "@ 10 MIN"),
    buildRow(view.snapshot14, "@ 14 MIN"),
  ].filter(Boolean);

  if (!rows.length) return null;

  // Verdict from minute 14 if available, else 10
  const verdictRow = rows[rows.length - 1];
  const won = verdictRow.goldDiff > 200 && verdictRow.csDiff > 0;
  const lost = verdictRow.goldDiff < -200 && verdictRow.csDiff < 0;
  const verdict = won ? "WON LANE" : lost ? "LOST LANE" : "EVEN LANE";
  const verdictColor = won ? 'var(--accent-bright)' : lost ? 'var(--danger)' : 'var(--ink-dim)';

  return (
    <section style={{ marginBottom: 32 }}>
      <SectionHeader
        title={<>Laning <em>phase</em></>}
        meta={`${youInfo?.championName} VS ${oppInfo?.championName}`}
      />
      <div style={{
        border: '1px solid var(--line-strong)',
        background: 'color-mix(in srgb, var(--bg-deep) 50%, transparent)',
      }}>
        {/* Header row with portraits + verdict */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center', gap: 24,
          padding: '16px 20px',
          borderBottom: '1px solid var(--line)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--accent-bright)' }}>{youInfo?.championName}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', color: 'var(--ink-faint)' }}>YOU</div>
            </div>
            <ChampDot url={youPortrait} letter={youInfo?.championName?.[0]} />
          </div>

          <div style={{
            textAlign: 'center',
            fontFamily: 'var(--font-display)', fontStyle: 'italic',
            fontSize: 22, color: verdictColor,
            padding: '0 20px',
          }}>
            {verdict}
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 9,
              letterSpacing: '0.24em', color: 'var(--ink-faint)',
              marginTop: 4, fontStyle: 'normal',
            }}>VERDICT</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ChampDot url={oppPortrait} letter={oppInfo?.championName?.[0]} />
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--danger)' }}>{oppInfo?.championName}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', color: 'var(--ink-faint)' }}>OPPONENT</div>
            </div>
          </div>
        </div>

        {/* Snapshot rows */}
        {rows.map((r, i) => (
          <LaneSnapshotRow key={i} row={r} />
        ))}
      </div>
    </section>
  );
}

function LaneSnapshotRow({ row }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '90px repeat(3, 1fr)',
      gap: 0,
      borderBottom: '1px solid var(--line)',
    }}>
      <div style={{
        padding: '14px 16px',
        borderRight: '1px solid var(--line)',
        fontFamily: 'var(--font-mono)', fontSize: 10,
        letterSpacing: '0.24em', color: 'var(--accent)',
        display: 'flex', alignItems: 'center',
      }}>{row.label}</div>
      <DiffCell label="CS"   you={row.youCs}   opp={row.oppCs}   diff={row.csDiff} format={v => String(v)} />
      <DiffCell label="GOLD" you={row.youGold} opp={row.oppGold} diff={row.goldDiff} format={v => `${(v/1000).toFixed(1)}k`} />
      <DiffCell label="XP"   you={row.youXp ?? row.youLvl} opp={row.oppXp ?? row.oppLvl} diff={row.xpDiff}
        format={v => v > 1000 ? `${(v/1000).toFixed(1)}k` : `lv${v}`} />
    </div>
  );
}

function DiffCell({ label, you, opp, diff, format }) {
  const sign = diff > 0 ? '+' : '';
  const color = diff > 0 ? 'var(--accent-bright)' : diff < 0 ? 'var(--danger)' : 'var(--ink-dim)';
  return (
    <div style={{
      padding: '12px 16px',
      borderRight: '1px solid var(--line)',
    }}>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 9,
        letterSpacing: '0.2em', color: 'var(--ink-faint)',
        marginBottom: 4,
      }}>{label}</div>
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 8,
        fontFamily: 'var(--font-display)', fontSize: 18,
      }}>
        <span style={{ color: 'var(--accent-bright)' }}>{format(you)}</span>
        <span style={{ color: 'var(--ink-faint)', fontSize: 11 }}>vs</span>
        <span style={{ color: 'var(--danger)' }}>{format(opp)}</span>
      </div>
      <div style={{
        marginTop: 4,
        fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.14em',
        color, fontVariantNumeric: 'tabular-nums',
      }}>
        {sign}{label === "GOLD" ? format(diff) : diff} diff
      </div>
    </div>
  );
}

// ---------- Skill order ----------

function SkillOrder({ view, ddragon }) {
  if (!view.skillOrder || !view.focusedId) return null;

  const youSkills = view.skillOrder[view.focusedId];
  const oppSkills = view.oppId ? view.skillOrder[view.oppId] : null;
  if (!youSkills?.length) return null;

  const youInfo = view.idMap[view.focusedId];
  const oppInfo = view.oppId ? view.idMap[view.oppId] : null;

  return (
    <section style={{ marginBottom: 32 }}>
      <SectionHeader
        title={<>Skill <em>order</em></>}
        meta="LEVEL-UP SEQUENCE"
      />
      <div style={{
        border: '1px solid var(--line-strong)',
        background: 'color-mix(in srgb, var(--bg-deep) 50%, transparent)',
      }}>
        <SkillRow
          label="YOU"
          champion={youInfo?.championName}
          skills={youSkills}
          ddragon={ddragon}
          color="var(--accent-bright)"
        />
        {oppSkills?.length && (
          <SkillRow
            label="OPP"
            champion={oppInfo?.championName}
            skills={oppSkills}
            ddragon={ddragon}
            color="var(--danger)"
          />
        )}
      </div>
    </section>
  );
}

function SkillRow({ label, champion, skills, ddragon, color }) {
  const portrait = ddragon ? window.RiotAPI.championPortraitUrl(ddragon.version, champion) : null;
  // Slot color tinting
  const slotBg = (slot) => ({
    1: 'color-mix(in srgb, #6080ff 25%, transparent)',  // Q
    2: 'color-mix(in srgb, #50d090 25%, transparent)',  // W
    3: 'color-mix(in srgb, #d09050 25%, transparent)',  // E
    4: 'color-mix(in srgb, #d04060 30%, transparent)',  // R
  })[slot] || 'transparent';

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '120px 1fr',
      borderBottom: '1px solid var(--line)',
      alignItems: 'center',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 16px',
        borderRight: '1px solid var(--line)',
      }}>
        <ChampDot url={portrait} letter={champion?.[0]} />
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, color }}>{champion}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', color: 'var(--ink-faint)' }}>{label}</div>
        </div>
      </div>
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 4,
        padding: '12px 16px',
      }}>
        {skills.map((s, i) => (
          <div
            key={i}
            title={`Lv ${i + 1} — ${Math.floor(s.minute)}:${String(Math.floor((s.minute % 1) * 60)).padStart(2,'0')}`}
            style={{
              width: 28, height: 28,
              border: '1px solid var(--line-strong)',
              background: slotBg(s.slot),
              fontFamily: 'var(--font-display)',
              fontSize: 14, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--ink)',
              position: 'relative',
            }}
          >
            {s.letter}
            <span style={{
              position: 'absolute', bottom: -2, right: -2,
              fontFamily: 'var(--font-mono)', fontSize: 7,
              color: 'var(--ink-faint)',
              background: 'var(--bg)',
              padding: '0 2px',
              lineHeight: 1,
            }}>{i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Gold diff chart ----------

function GoldDiffChart({ goldDiff, focusedTeam }) {
  if (!goldDiff?.length) return null;

  const W = 1000, H = 220, PAD_L = 50, PAD_R = 12, PAD_T = 16, PAD_B = 28;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;

  // From focus perspective: positive = focus team ahead
  const sign = focusedTeam === 200 ? -1 : 1;
  const data = goldDiff.map(d => ({ minute: d.minute, value: d.diff * sign }));
  const maxAbs = Math.max(1, ...data.map(d => Math.abs(d.value)));
  const maxMin = Math.max(1, ...data.map(d => d.minute));

  const x = (m) => PAD_L + (m / maxMin) * innerW;
  const y = (v) => PAD_T + innerH / 2 - (v / maxAbs) * (innerH / 2);

  // Build area path: along line, then drop to zero baseline back
  let pathTop = `M ${x(data[0].minute)} ${y(data[0].value)}`;
  data.slice(1).forEach(d => { pathTop += ` L ${x(d.minute)} ${y(d.value)}`; });
  const baseY = y(0);
  const areaPath = `${pathTop} L ${x(data[data.length - 1].minute)} ${baseY} L ${x(data[0].minute)} ${baseY} Z`;

  // Y ticks
  const yTicks = [maxAbs, maxAbs / 2, 0, -maxAbs / 2, -maxAbs].map(v => ({
    v, y: y(v), label: v >= 0 ? `+${Math.round(v / 100) / 10}k` : `${Math.round(v / 100) / 10}k`,
  }));
  const xTicks = [];
  const xTickStep = maxMin > 30 ? 10 : maxMin > 15 ? 5 : 2;
  for (let m = 0; m <= maxMin; m += xTickStep) xTicks.push(m);

  return (
    <section style={{ marginBottom: 32 }}>
      <SectionHeader
        title={<>Gold <em>differential</em></>}
        meta={`FOCUS PERSPECTIVE · ${focusedTeam === 100 ? 'BLUE' : 'RED'} SIDE`}
      />
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', border: '1px solid var(--line)', background: 'color-mix(in srgb, var(--bg-deep) 50%, transparent)' }}>
        {/* Grid */}
        {yTicks.map((t, i) => (
          <line key={i} x1={PAD_L} x2={W - PAD_R} y1={t.y} y2={t.y}
            stroke={t.v === 0 ? 'var(--line-strong)' : 'var(--line)'}
            strokeDasharray={t.v === 0 ? "" : "2 4"} strokeWidth={t.v === 0 ? 1 : 0.5}/>
        ))}
        {/* Y labels */}
        {yTicks.map((t, i) => (
          <text key={i} x={PAD_L - 8} y={t.y + 3} textAnchor="end"
            fontFamily="var(--font-mono)" fontSize="9"
            fill={t.v === 0 ? 'var(--ink-dim)' : 'var(--ink-faint)'}
            letterSpacing="1">
            {t.label}
          </text>
        ))}
        {/* X labels */}
        {xTicks.map((m, i) => (
          <text key={i} x={x(m)} y={H - PAD_B + 14} textAnchor="middle"
            fontFamily="var(--font-mono)" fontSize="9" fill="var(--ink-faint)" letterSpacing="1">
            {m}m
          </text>
        ))}
        {/* Split fill: positive (accent) and negative (danger) */}
        <defs>
          <linearGradient id="gd-pos" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-bright)" stopOpacity="0.6"/>
            <stop offset="100%" stopColor="var(--accent-bright)" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="gd-neg" x1="0" x2="0" y1="1" y2="0">
            <stop offset="0%" stopColor="var(--danger)" stopOpacity="0.5"/>
            <stop offset="100%" stopColor="var(--danger)" stopOpacity="0"/>
          </linearGradient>
          <clipPath id="clip-top">
            <rect x={PAD_L} y={PAD_T} width={innerW} height={innerH / 2}/>
          </clipPath>
          <clipPath id="clip-bot">
            <rect x={PAD_L} y={PAD_T + innerH / 2} width={innerW} height={innerH / 2}/>
          </clipPath>
        </defs>
        <path d={areaPath} fill="url(#gd-pos)" clipPath="url(#clip-top)"/>
        <path d={areaPath} fill="url(#gd-neg)" clipPath="url(#clip-bot)"/>
        {/* Line on top */}
        <path d={pathTop} fill="none" stroke="var(--accent)" strokeWidth="1.5"/>
      </svg>
    </section>
  );
}

// ---------- Player series (Gold/XP/CS lines) ----------

function PlayerSeriesCharts({ series, view, ddragon, raw }) {
  if (!view.focusedId || !view.oppId) {
    return (
      <section style={{ marginBottom: 32 }}>
        <SectionHeader title={<>Lane <em>duel</em></>} meta="NO LANE OPPONENT IDENTIFIED" />
      </section>
    );
  }

  const focusChamp = view.idMap[view.focusedId]?.championName;
  const oppChamp = view.idMap[view.oppId]?.championName;
  const focusPortrait = ddragon ? window.RiotAPI.championPortraitUrl(ddragon.version, focusChamp) : null;
  const oppPortrait = ddragon ? window.RiotAPI.championPortraitUrl(ddragon.version, oppChamp) : null;

  const youColor = "var(--accent-bright)";
  const oppColor = "var(--danger)";

  return (
    <section style={{ marginBottom: 32 }}>
      <SectionHeader
        title={<>Lane <em>duel</em></>}
        meta={`${focusChamp} VS ${oppChamp}`}
      />
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12,
        fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.18em',
        color: 'var(--ink-dim)', textTransform: 'uppercase',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ChampDot url={focusPortrait} letter={focusChamp?.[0]} />
          <span style={{ color: youColor }}>● You</span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ChampDot url={oppPortrait} letter={oppChamp?.[0]} />
          <span style={{ color: oppColor }}>● Opponent</span>
        </span>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16,
      }}>
        <MiniLineChart
          title="GOLD"
          series={series}
          a={s => s.youGold}
          b={s => s.oppGold}
          colorA={youColor} colorB={oppColor}
          format={v => `${(v / 1000).toFixed(1)}k`}
        />
        <MiniLineChart
          title="XP / LEVEL"
          series={series}
          a={s => s.youXp}
          b={s => s.oppXp}
          colorA={youColor} colorB={oppColor}
          format={v => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)}
        />
        <MiniLineChart
          title="CS"
          series={series}
          a={s => s.youCs}
          b={s => s.oppCs}
          colorA={youColor} colorB={oppColor}
          format={v => String(v)}
        />
      </div>
    </section>
  );
}

function ChampDot({ url, letter }) {
  return (
    <span style={{
      width: 18, height: 18, borderRadius: '50%',
      border: '1px solid var(--accent-deep)',
      overflow: 'hidden', display: 'inline-block',
      background: 'var(--bg-deep)',
    }}>
      {url && <img src={url} alt="" width={18} height={18} style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }} />}
    </span>
  );
}

function MiniLineChart({ title, series, a, b, colorA, colorB, format }) {
  const W = 320, H = 140, PAD_L = 36, PAD_R = 8, PAD_T = 10, PAD_B = 22;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;

  const points = series.map(s => ({ minute: s.minute, av: a(s), bv: b(s) }));
  const maxMin = Math.max(1, ...points.map(p => p.minute));
  const allVals = points.flatMap(p => [p.av, p.bv]).filter(v => v != null);
  const maxV = Math.max(1, ...allVals);

  const x = (m) => PAD_L + (m / maxMin) * innerW;
  const y = (v) => PAD_T + innerH - (v / maxV) * innerH;

  const buildPath = (sel) => {
    const pts = points.filter(p => sel(p) != null);
    if (!pts.length) return "";
    let path = `M ${x(pts[0].minute)} ${y(sel(pts[0]))}`;
    pts.slice(1).forEach(p => { path += ` L ${x(p.minute)} ${y(sel(p))}`; });
    return path;
  };

  const last = points[points.length - 1] || {};

  return (
    <div style={{ border: '1px solid var(--line)', background: 'color-mix(in srgb, var(--bg-deep) 40%, transparent)' }}>
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid var(--line)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          letterSpacing: '0.24em', color: 'var(--accent)', textTransform: 'uppercase',
        }}>{title}</span>
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: 13, fontStyle: 'italic',
          color: 'var(--ink-dim)',
        }}>
          <span style={{ color: colorA }}>{format(last.av || 0)}</span>
          {" · "}
          <span style={{ color: colorB }}>{format(last.bv || 0)}</span>
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {/* Grid */}
        {[0, 0.5, 1].map(t => (
          <line key={t} x1={PAD_L} x2={W - PAD_R}
            y1={PAD_T + innerH * t} y2={PAD_T + innerH * t}
            stroke="var(--line)" strokeDasharray="2 4" strokeWidth="0.5" />
        ))}
        {/* Y labels */}
        {[1, 0.5, 0].map((t, i) => {
          const v = maxV * (1 - t);
          return (
            <text key={i} x={PAD_L - 6} y={PAD_T + innerH * t + 3} textAnchor="end"
              fontFamily="var(--font-mono)" fontSize="8" fill="var(--ink-faint)" letterSpacing="1">
              {format(v)}
            </text>
          );
        })}
        <path d={buildPath(p => p.av)} fill="none" stroke={colorA} strokeWidth="1.5" />
        <path d={buildPath(p => p.bv)} fill="none" stroke={colorB} strokeWidth="1.5" />
      </svg>
    </div>
  );
}

// ---------- Event ticker ----------

function EventTicker({ events, focusedTeam, ddragon, idMap }) {
  const [filter, setFilter] = React.useState("ALL");

  if (!events?.length) {
    return (
      <section>
        <SectionHeader title={<>Event <em>ledger</em></>} meta="NO EVENTS" />
      </section>
    );
  }

  const champions = React.useMemo(() => {
    if (!idMap) return [];
    const seen = new Set();
    const list = [];
    Object.values(idMap).forEach(p => {
      if (p?.championName && !seen.has(p.championName)) {
        seen.add(p.championName);
        list.push({ name: p.championName, teamId: p.teamId });
      }
    });
    list.sort((a, b) => (a.teamId - b.teamId) || a.name.localeCompare(b.name));
    return list;
  }, [idMap]);

  const eventInvolves = (e, champ) => {
    if (e.killer === champ) return true;
    if (e.victim === champ) return true;
    if (Array.isArray(e.assists) && e.assists.includes(champ)) return true;
    return false;
  };

  const filtered = filter === "ALL" ? events : events.filter(e => eventInvolves(e, filter));

  return (
    <section>
      <SectionHeader
        title={<>Event <em>ledger</em></>}
        meta={`${filtered.length}${filter !== "ALL" ? ` / ${events.length}` : ""} EVENTS`}
      />
      <ChampionFilter
        champions={champions}
        focusedTeam={focusedTeam}
        value={filter}
        onChange={setFilter}
        ddragon={ddragon}
      />
      <div style={{ border: '1px solid var(--line)' }}>
        {filtered.length === 0 ? (
          <div style={{
            padding: '18px 16px', fontFamily: 'var(--font-mono)', fontSize: 11,
            letterSpacing: '0.18em', color: 'var(--ink-faint)', textTransform: 'uppercase',
          }}>No events for {filter}</div>
        ) : filtered.map((e, i) => (
          <EventRow key={i} e={e} focusedTeam={focusedTeam} ddragon={ddragon} />
        ))}
      </div>
    </section>
  );
}

function ChampionFilter({ champions, focusedTeam, value, onChange, ddragon }) {
  const buttonBase = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '6px 10px',
    border: '1px solid var(--line)',
    background: 'transparent',
    fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.16em',
    color: 'var(--ink-dim)', textTransform: 'uppercase', cursor: 'pointer',
  };
  const activeStyle = {
    borderColor: 'var(--accent-bright)',
    color: 'var(--accent-bright)',
    background: 'color-mix(in srgb, var(--accent) 6%, transparent)',
  };

  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 6,
      marginBottom: 10,
    }}>
      <button
        type="button"
        onClick={() => onChange("ALL")}
        style={{ ...buttonBase, ...(value === "ALL" ? activeStyle : null) }}
      >
        All
      </button>
      {champions.map(c => {
        const ally = c.teamId === focusedTeam;
        const active = value === c.name;
        return (
          <button
            key={c.name}
            type="button"
            onClick={() => onChange(c.name)}
            title={c.name}
            style={{
              ...buttonBase,
              ...(active ? activeStyle : null),
              borderLeftWidth: 2,
              borderLeftColor: active
                ? 'var(--accent-bright)'
                : (ally ? 'var(--accent-bright)' : 'var(--danger)'),
            }}
          >
            <ChampDot
              url={ddragon ? window.RiotAPI.championPortraitUrl(ddragon.version, c.name) : null}
              letter={c.name?.[0]}
            />
            <span style={{ textTransform: 'none', letterSpacing: '0.04em', fontSize: 11 }}>{c.name}</span>
          </button>
        );
      })}
    </div>
  );
}

function formatTimeMs(ms) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function EventRow({ e, focusedTeam, ddragon }) {
  const ally = e.killerTeam === focusedTeam;
  const sideColor = ally ? 'var(--accent-bright)' : 'var(--danger)';

  let icon, label, subtext;

  if (e.type === "KILL") {
    icon = "⚔";
    label = (
      <>
        <ChampDot url={ddragon ? window.RiotAPI.championPortraitUrl(ddragon.version, e.killer) : null} letter={e.killer?.[0]} />
        <span style={{ color: ally ? 'var(--accent-bright)' : 'var(--danger)' }}>{e.killer || '—'}</span>
        <span style={{ color: 'var(--ink-faint)', fontStyle: 'italic' }}>killed</span>
        <ChampDot url={ddragon ? window.RiotAPI.championPortraitUrl(ddragon.version, e.victim) : null} letter={e.victim?.[0]} />
        <span style={{ color: !ally ? 'var(--accent-bright)' : 'var(--danger)' }}>{e.victim || '—'}</span>
      </>
    );
    subtext = e.assists.length ? `assists: ${e.assists.join(", ")}` : "solo kill";
  } else if (e.type === "OBJECTIVE") {
    const monster = e.monster === "DRAGON"
      ? (e.monsterSubType ? `${prettyDragon(e.monsterSubType)} Drake` : "Dragon")
      : e.monster === "BARON_NASHOR" ? "Baron Nashor"
      : e.monster === "RIFTHERALD" ? "Rift Herald"
      : (e.monster || "Objective");
    icon = e.monster === "BARON_NASHOR" ? "♛" : e.monster === "RIFTHERALD" ? "♞" : "🐉";
    label = (
      <>
        <span style={{ color: sideColor, textTransform: 'uppercase', letterSpacing: '0.16em', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
          {ally ? 'ALLY' : 'ENEMY'}
        </span>
        <span style={{ color: 'var(--ink-faint)', fontStyle: 'italic' }}>secured</span>
        <span style={{ fontWeight: 500 }}>{monster}</span>
      </>
    );
  } else if (e.type === "BUILDING") {
    const isInhib = e.building === "INHIBITOR_BUILDING";
    icon = isInhib ? "▥" : "♜";
    const what = isInhib ? "inhibitor" : (e.towerType ? prettyTower(e.towerType) : "tower");
    const lane = e.lane ? prettyLane(e.lane) : "";
    label = (
      <>
        <span style={{ color: sideColor, textTransform: 'uppercase', letterSpacing: '0.16em', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
          {ally ? 'ALLY' : 'ENEMY'}
        </span>
        <span style={{ color: 'var(--ink-faint)', fontStyle: 'italic' }}>destroyed</span>
        <span style={{ fontWeight: 500 }}>{lane} {what}</span>
      </>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '70px 24px 1fr auto',
      gap: 14, alignItems: 'center',
      padding: '10px 16px',
      borderBottom: '1px solid var(--line)',
      background: ally ? 'color-mix(in srgb, var(--accent) 3%, transparent)' : 'transparent',
    }}>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.14em',
        color: 'var(--ink-dim)', fontVariantNumeric: 'tabular-nums',
      }}>{formatTimeMs(e.ms)}</div>
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: 18, color: sideColor, textAlign: 'center',
      }}>{icon}</div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
        fontFamily: 'var(--font-display)', fontSize: 16,
      }}>{label}</div>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.16em',
        color: 'var(--ink-faint)', textTransform: 'uppercase',
      }}>{subtext}</div>
    </div>
  );
}

function prettyDragon(sub) {
  const map = {
    AIR_DRAGON: "Cloud", FIRE_DRAGON: "Infernal", EARTH_DRAGON: "Mountain",
    WATER_DRAGON: "Ocean", HEXTECH_DRAGON: "Hextech", CHEMTECH_DRAGON: "Chemtech",
    ELDER_DRAGON: "Elder",
  };
  return map[sub] || sub.replace("_DRAGON", "").toLowerCase();
}
function prettyTower(t) {
  return ({
    OUTER_TURRET: "outer turret", INNER_TURRET: "inner turret",
    BASE_TURRET: "base turret", NEXUS_TURRET: "nexus turret",
  })[t] || "turret";
}
function prettyLane(l) {
  return ({ TOP_LANE: "top", MID_LANE: "mid", BOT_LANE: "bot" })[l] || "";
}

function SectionHeader({ title, meta }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      marginBottom: 14,
    }}>
      <h3 className="matches-title" style={{ fontSize: 26 }}>{title}</h3>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.24em',
        color: 'var(--ink-faint)', textTransform: 'uppercase',
      }}>{meta}</div>
    </div>
  );
}

// ============ COMPARE VIEW ============

function CompareView({ detail, focusPuuid, ddragon }) {
  // Flatten all 10 players, preserving team order
  const allPlayers = React.useMemo(() => {
    const list = [];
    detail.teams.forEach(team => {
      team.players.forEach(p => list.push({ ...p, side: team.side, teamWin: team.win }));
    });
    return list;
  }, [detail]);

  // Default selection: focused player on left, lane opponent on right (else first enemy)
  const focused = allPlayers.find(p => p.puuid === focusPuuid);
  const focusedRole = focused?.role;
  const opponent = focused
    ? allPlayers.find(p => p.teamId !== focused.teamId && p.role === focusedRole)
        || allPlayers.find(p => p.teamId !== focused.teamId)
    : allPlayers[5];

  const [leftPuuid, setLeftPuuid] = React.useState(focused?.puuid || allPlayers[0]?.puuid);
  const [rightPuuid, setRightPuuid] = React.useState(opponent?.puuid || allPlayers[allPlayers.length - 1]?.puuid);

  const left = allPlayers.find(p => p.puuid === leftPuuid) || allPlayers[0];
  const right = allPlayers.find(p => p.puuid === rightPuuid) || allPlayers[1];

  if (!left || !right) {
    return (
      <div style={{ padding: 40, textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--ink-faint)' }}>
        Not enough players to compare.
      </div>
    );
  }

  return (
    <section>
      <SectionHeader
        title={<>Side-by-side <em>comparison</em></>}
        meta={`${left.champion} VS ${right.champion}`}
      />

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto 1fr',
        gap: 16, alignItems: 'stretch', marginBottom: 18,
      }}>
        <PlayerPicker
          side="left"
          all={allPlayers}
          value={leftPuuid}
          onChange={setLeftPuuid}
          ddragon={ddragon}
        />
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-mono)', fontSize: 14, letterSpacing: '0.32em',
          color: 'var(--accent)', padding: '0 8px',
        }}>VS</div>
        <PlayerPicker
          side="right"
          all={allPlayers}
          value={rightPuuid}
          onChange={setRightPuuid}
          ddragon={ddragon}
        />
      </div>

      <CompareCard left={left} right={right} ddragon={ddragon} durationSec={detail.durationSec} />
    </section>
  );
}

function PlayerPicker({ side, all, value, onChange, ddragon }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const selected = all.find(p => p.puuid === value);

  return (
    <div
      ref={ref}
      style={{
        position: 'relative',
        border: '1px solid var(--line-strong)',
        background: 'color-mix(in srgb, var(--bg-deep) 50%, transparent)',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: '44px 1fr auto',
          gap: 12, alignItems: 'center',
          padding: '12px 16px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: side === 'right' ? 'left' : 'left',
          color: 'inherit',
        }}
      >
        {selected?.championPortrait ? (
          <div style={{
            width: 44, height: 44,
            border: '1px solid var(--accent-deep)',
            backgroundImage: `url(${selected.championPortrait})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
          }}></div>
        ) : (
          <div style={{
            width: 44, height: 44,
            border: '1px solid var(--accent-deep)',
            background: 'var(--bg-deep)',
          }}></div>
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 16,
            color: 'var(--ink)', whiteSpace: 'nowrap',
            overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {selected?.name}{selected?.tag && <span style={{ color: 'var(--ink-faint)' }}>#{selected.tag}</span>}
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 9,
            letterSpacing: '0.18em', color: 'var(--ink-faint)',
            textTransform: 'uppercase',
          }}>
            {selected?.champion} · {ROLE_LBL[selected?.role] || selected?.role || '—'} · {selected?.side}
          </div>
        </div>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          letterSpacing: '0.2em', color: 'var(--accent)',
        }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: '100%', left: 0, right: 0,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--line-strong)',
          borderTop: 'none',
          zIndex: 30,
          maxHeight: 360, overflowY: 'auto',
        }}>
          {all.map((p, i) => {
            const isSelected = p.puuid === value;
            const sideColor = p.teamId === 100 ? '#3c8ec8' : '#c83c3c';
            return (
              <div
                key={p.puuid || i}
                onClick={() => { onChange(p.puuid); setOpen(false); }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '32px 1fr auto',
                  gap: 10, alignItems: 'center',
                  padding: '8px 12px',
                  borderBottom: '1px solid var(--line)',
                  borderLeft: `3px solid ${sideColor}`,
                  background: isSelected
                    ? 'color-mix(in srgb, var(--accent) 12%, transparent)'
                    : 'transparent',
                  cursor: 'pointer',
                }}
              >
                {p.championPortrait ? (
                  <div style={{
                    width: 28, height: 28,
                    border: '1px solid var(--accent-deep)',
                    backgroundImage: `url(${p.championPortrait})`,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                  }}></div>
                ) : (
                  <div style={{
                    width: 28, height: 28,
                    border: '1px solid var(--accent-deep)',
                    background: 'var(--bg-deep)',
                  }}></div>
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontFamily: 'var(--font-display)', fontSize: 13,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {p.name}<span style={{ color: 'var(--ink-faint)' }}>#{p.tag}</span>
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: 9,
                    letterSpacing: '0.16em', color: 'var(--ink-faint)',
                  }}>
                    {p.champion} · {ROLE_LBL[p.role] || p.role || '—'}
                  </div>
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10,
                  color: 'var(--ink-dim)', whiteSpace: 'nowrap',
                }}>
                  {p.k}/{p.d}/{p.a}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Build the comparison stat list for any two players
function buildCompareStats(left, right, durationSec) {
  const minutes = Math.max((durationSec || 1) / 60, 1);
  // higher: which side wins. 'higher-is-better' (default) or 'lower-is-better' (e.g., deaths)
  const fmtPct  = v => `${Math.round(v * 100)}%`;
  const fmtNum  = v => Math.round(v).toLocaleString();
  const fmtDmg  = v => v.toLocaleString();
  const fmtSec  = v => `${Math.floor(v / 60)}:${String(Math.round(v % 60)).padStart(2, '0')}`;
  const fmtDec  = v => v.toFixed(2);

  return [
    { group: "OUTPUT", rows: [
      { label: "KDA",                fmt: fmtDec, l: left.kdaNum, r: right.kdaNum, better: 'high' },
      { label: "Kills",              fmt: fmtNum, l: left.k, r: right.k, better: 'high' },
      { label: "Deaths",             fmt: fmtNum, l: left.d, r: right.d, better: 'low' },
      { label: "Assists",            fmt: fmtNum, l: left.a, r: right.a, better: 'high' },
      { label: "Kill participation", fmt: fmtPct, l: left.killParticipation, r: right.killParticipation, better: 'high' },
      { label: "Largest spree",      fmt: fmtNum, l: left.largestKillingSpree, r: right.largestKillingSpree, better: 'high' },
    ]},
    { group: "DAMAGE", rows: [
      { label: "Dmg to champions",   fmt: fmtDmg, l: left.dmg, r: right.dmg, better: 'high' },
      { label: "Damage / min",       fmt: fmtNum, l: left.dmgPerMin, r: right.dmgPerMin, better: 'high' },
      { label: "Team damage share",  fmt: fmtPct, l: left.dmgShare, r: right.dmgShare, better: 'high' },
      { label: "Dmg to turrets",     fmt: fmtDmg, l: left.dmgToTurrets, r: right.dmgToTurrets, better: 'high' },
      { label: "Dmg to objectives",  fmt: fmtDmg, l: left.dmgToObjectives, r: right.dmgToObjectives, better: 'high' },
      { label: "Damage taken",       fmt: fmtDmg, l: left.taken, r: right.taken, better: 'neutral' },
      { label: "Self-mitigated",     fmt: fmtDmg, l: left.selfMitigated, r: right.selfMitigated, better: 'high' },
      { label: "Heal on team",       fmt: fmtDmg, l: left.healOnTeammates, r: right.healOnTeammates, better: 'high' },
      { label: "CC time (s)",        fmt: fmtDec, l: left.ccTime, r: right.ccTime, better: 'high' },
    ]},
    { group: "ECONOMY", rows: [
      { label: "CS",                 fmt: fmtNum, l: left.cs, r: right.cs, better: 'high' },
      { label: "CS / min",           fmt: fmtDec, l: left.cs / minutes, r: right.cs / minutes, better: 'high' },
      { label: "Gold",               fmt: fmtNum, l: left.gold, r: right.gold, better: 'high' },
      { label: "Gold / min",         fmt: fmtNum, l: left.goldPerMin, r: right.goldPerMin, better: 'high' },
      { label: "Team gold share",    fmt: fmtPct, l: left.goldShare, r: right.goldShare, better: 'high' },
    ]},
    { group: "VISION", rows: [
      { label: "Vision score",       fmt: fmtNum, l: left.vision, r: right.vision, better: 'high' },
      { label: "Wards placed",       fmt: fmtNum, l: left.wardsPlaced, r: right.wardsPlaced, better: 'high' },
      { label: "Wards killed",       fmt: fmtNum, l: left.wardsKilled, r: right.wardsKilled, better: 'high' },
      { label: "Control wards",      fmt: fmtNum, l: left.controlWards, r: right.controlWards, better: 'high' },
    ]},
    { group: "DISCIPLINE", rows: [
      { label: "Time spent dead",    fmt: fmtSec, l: left.timeDead, r: right.timeDead, better: 'low' },
      { label: "Time dead %",        fmt: fmtPct, l: left.timeDeadPct, r: right.timeDeadPct, better: 'low' },
      { label: "Final level",        fmt: fmtNum, l: left.level, r: right.level, better: 'high' },
    ]},
  ];
}

function CompareCard({ left, right, ddragon, durationSec }) {
  const groups = buildCompareStats(left, right, durationSec);
  const v = ddragon?.version;

  // Aggregate winner counts (only directional rows)
  let leftWins = 0, rightWins = 0;
  groups.forEach(g => g.rows.forEach(r => {
    if (r.better === 'neutral' || r.l == null || r.r == null) return;
    if (r.l === r.r) return;
    const leftBetter = (r.better === 'high') ? r.l > r.r : r.l < r.r;
    if (leftBetter) leftWins++; else rightWins++;
  }));

  return (
    <div style={{
      border: '1px solid var(--line-strong)',
      background: 'color-mix(in srgb, var(--bg-deep) 40%, transparent)',
    }}>
      <CompareHeader left={left} right={right} leftWins={leftWins} rightWins={rightWins} />

      {/* Items row */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto 1fr',
        gap: 0,
        borderBottom: '1px solid var(--line)',
      }}>
        <CompareItemsCell items={left.items} trinket={left.trinket} version={v} align="right" />
        <div style={{
          padding: '12px 16px',
          fontFamily: 'var(--font-mono)', fontSize: 9,
          letterSpacing: '0.24em', color: 'var(--ink-faint)',
          display: 'flex', alignItems: 'center',
          borderLeft: '1px solid var(--line)',
          borderRight: '1px solid var(--line)',
        }}>BUILD</div>
        <CompareItemsCell items={right.items} trinket={right.trinket} version={v} align="left" />
      </div>

      {/* Stat groups */}
      {groups.map((g, i) => (
        <CompareGroup key={i} group={g} />
      ))}
    </div>
  );
}

function CompareHeader({ left, right, leftWins, rightWins }) {
  const renderSide = (p, alignRight) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '18px 20px',
      flexDirection: alignRight ? 'row-reverse' : 'row',
      textAlign: alignRight ? 'right' : 'left',
    }}>
      {p.championPortrait ? (
        <div style={{
          width: 56, height: 56,
          border: '1px solid var(--accent-deep)',
          backgroundImage: `url(${p.championPortrait})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          flexShrink: 0,
        }}></div>
      ) : (
        <div style={{
          width: 56, height: 56,
          border: '1px solid var(--accent-deep)',
          background: 'var(--bg-deep)',
          flexShrink: 0,
        }}></div>
      )}
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          color: p.win ? 'var(--accent-bright)' : 'var(--ink)',
        }}>
          {p.name}<span style={{ color: 'var(--ink-faint)', fontStyle: 'italic', fontSize: 14 }}>#{p.tag}</span>
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          letterSpacing: '0.2em', color: 'var(--ink-faint)',
          textTransform: 'uppercase', marginTop: 4,
        }}>
          {p.champion} · {ROLE_LBL[p.role] || p.role || '—'} · {p.side} · {p.win ? 'WIN' : 'LOSS'}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr auto 1fr',
      borderBottom: '1px solid var(--line)',
      background: 'color-mix(in srgb, var(--bg-deep) 50%, transparent)',
      alignItems: 'center',
    }}>
      {renderSide(left, false)}
      <div style={{
        textAlign: 'center', padding: '0 24px',
        borderLeft: '1px solid var(--line)',
        borderRight: '1px solid var(--line)',
        alignSelf: 'stretch',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontStyle: 'italic',
          fontSize: 32, lineHeight: 1,
          color: 'var(--accent)',
        }}>{leftWins} <span style={{ color: 'var(--ink-faint)', fontSize: 18 }}>:</span> {rightWins}</div>
        <div style={{
          marginTop: 6,
          fontFamily: 'var(--font-mono)', fontSize: 9,
          letterSpacing: '0.24em', color: 'var(--ink-faint)',
          textTransform: 'uppercase',
        }}>WINS / METRIC</div>
      </div>
      {renderSide(right, true)}
    </div>
  );
}

function CompareItemsCell({ items, trinket, version, align }) {
  return (
    <div style={{
      display: 'flex',
      gap: 4,
      padding: '12px 16px',
      justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
      alignItems: 'center',
      flexWrap: 'wrap',
    }}>
      {align === 'right' && trinket ? (
        <>
          <ItemSlot itemId={trinket} version={version} trinket />
          <div style={{ width: 4 }}></div>
          {[...items].reverse().map((id, i) => <ItemSlot key={i} itemId={id} version={version} />)}
        </>
      ) : (
        <>
          {items.map((id, i) => <ItemSlot key={i} itemId={id} version={version} />)}
          <div style={{ width: 4 }}></div>
          <ItemSlot itemId={trinket} version={version} trinket />
        </>
      )}
    </div>
  );
}

function CompareGroup({ group }) {
  return (
    <div>
      <div style={{
        padding: '10px 20px',
        background: 'color-mix(in srgb, var(--accent) 4%, transparent)',
        borderBottom: '1px solid var(--line)',
        fontFamily: 'var(--font-mono)', fontSize: 10,
        letterSpacing: '0.32em', color: 'var(--accent)',
        textTransform: 'uppercase',
      }}>{group.group}</div>
      {group.rows.map((row, i) => (
        <CompareRow key={i} row={row} />
      ))}
    </div>
  );
}

function CompareRow({ row }) {
  const { l, r, fmt, better, label } = row;

  // Determine winner
  let leftIsWinner = false, rightIsWinner = false;
  if (better !== 'neutral' && l != null && r != null && l !== r) {
    const leftBetter = (better === 'high') ? l > r : l < r;
    leftIsWinner = leftBetter;
    rightIsWinner = !leftBetter;
  }

  // Bar fill — proportional to share of (l + r)
  const total = (l || 0) + (r || 0);
  const leftPct  = total > 0 ? (l || 0) / total * 100 : 50;
  const rightPct = total > 0 ? (r || 0) / total * 100 : 50;

  const winnerColor = 'var(--accent-bright)';
  const loserColor  = 'var(--ink-dim)';
  const neutralColor = 'var(--ink)';

  const leftColor  = leftIsWinner  ? winnerColor : (rightIsWinner ? loserColor : neutralColor);
  const rightColor = rightIsWinner ? winnerColor : (leftIsWinner  ? loserColor : neutralColor);

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 180px 1fr',
      gap: 0, alignItems: 'center',
      padding: '8px 0',
      borderBottom: '1px solid var(--line)',
    }}>
      <div style={{
        textAlign: 'right',
        padding: '0 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12,
      }}>
        {/* Left bar */}
        <div style={{
          flex: 1,
          height: 4,
          background: 'var(--line)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0,
            width: `${leftPct}%`,
            background: leftIsWinner ? winnerColor : 'var(--ink-faint)',
            transition: 'width 0.25s',
          }}></div>
        </div>
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: 17,
          color: leftColor, fontVariantNumeric: 'tabular-nums',
          minWidth: 80, textAlign: 'right',
        }}>{fmt(l ?? 0)}</span>
      </div>

      <div style={{
        textAlign: 'center',
        fontFamily: 'var(--font-mono)', fontSize: 9,
        letterSpacing: '0.2em', color: 'var(--ink-faint)',
        textTransform: 'uppercase',
        padding: '0 16px',
        borderLeft: '1px solid var(--line)',
        borderRight: '1px solid var(--line)',
      }}>{label}</div>

      <div style={{
        padding: '0 16px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: 17,
          color: rightColor, fontVariantNumeric: 'tabular-nums',
          minWidth: 80,
        }}>{fmt(r ?? 0)}</span>
        <div style={{
          flex: 1,
          height: 4,
          background: 'var(--line)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${rightPct}%`,
            background: rightIsWinner ? winnerColor : 'var(--ink-faint)',
            transition: 'width 0.25s',
          }}></div>
        </div>
      </div>
    </div>
  );
}

window.MatchDetail = MatchDetail;
