// Champion repertoire + drilldown — live data from Riot API + Data Dragon

function masteryAge(ts) {
  if (!ts) return null;
  const days = Math.floor((Date.now() - ts) / 86400000);
  if (days < 1) return "today";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function ChampPortrait({ url, letter, className = "champ-portrait" }) {
  if (url) {
    return (
      <div
        className={className}
        style={{
          backgroundImage: `url(${url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      ></div>
    );
  }
  return <div className={className} data-letter={letter}></div>;
}

function ChampionPool({
  matches, mastery, ddragon,
  matchesLoaded, matchesLoading, matchesExhausted,
  onSelectChampion, onBoost, onLoadUntilChampion,
}) {
  const repertoire = window.RiotAPI.buildChampionRepertoire({
    matches: matches || [],
    mastery,
    championIndex: ddragon,
  }).filter(c => c.hasRecentGames);

  const playedCount = repertoire.length;

  if (repertoire.length === 0) {
    return (
      <div className="champ-pool">
        <div className="champ-pool-header">
          <h3 className="matches-title">Champion <em>repertoire</em></h3>
          <div className="champ-pool-meta">
            {matchesLoading ? "BUILDING REPERTOIRE…" : "NO DATA YET"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="champ-pool">
      <div className="champ-pool-header">
        <h3 className="matches-title">Champion <em>repertoire</em></h3>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 18 }}>
          <div className="champ-pool-meta">
            {matchesLoaded} MATCHES AGGREGATED · {playedCount} CHAMPIONS PLAYED
          </div>
          {!matchesExhausted && onBoost && (
            <button
              onClick={onBoost}
              disabled={matchesLoading}
              title="Pull 30 more matches to stabilise champion stats"
              style={{
                background: 'transparent', border: '1px solid var(--accent-deep)',
                color: 'var(--accent)', padding: '6px 14px',
                fontFamily: 'var(--font-mono)', fontSize: 10,
                letterSpacing: '0.2em', textTransform: 'uppercase',
                cursor: matchesLoading ? 'wait' : 'pointer',
                opacity: matchesLoading ? 0.5 : 1,
              }}
            >
              {matchesLoading ? 'Boosting…' : '+ Boost (+30)'}
            </button>
          )}
        </div>
      </div>

      <div className="champ-grid">
        {repertoire.map(c => (
          <PlayedCard key={c.name} champ={c} onSelect={() => onSelectChampion(c)} />
        ))}
      </div>
    </div>
  );
}

function PlayedCard({ champ, onSelect }) {
  const wr = champ.winrate;
  const wrLabel = wr.toFixed(1);
  const wrCls = wr >= 60 ? 'high' : wr < 50 ? 'low' : '';

  return (
    <div className="champ-card" onClick={onSelect}>
      <div className="champ-card-head">
        <ChampPortrait url={champ.portrait} letter={champ.letter} />
        <div className="champ-card-id">
          <div className="champ-name">{champ.displayName}</div>
          <div className="champ-role">
            {champ.role}
            {champ.masteryLevel != null && ` · M${champ.masteryLevel}`}
          </div>
        </div>
        <div className={`champ-wr ${wrCls}`}>{wrLabel}%</div>
      </div>
      <div className="champ-bar">
        <div className="champ-bar-fill" style={{ width: `${wr}%` }}></div>
        <div className="champ-bar-loss" style={{ width: `${100 - wr}%` }}></div>
      </div>
      <div className="champ-card-stats">
        <div><span>{champ.games}</span> games</div>
        <div><span>{champ.kda}</span> KDA</div>
        <div><span>{champ.csmin}</span> cs/m</div>
        <div><span>{champ.dmgmin}</span> dmg/m</div>
      </div>
      <div className="champ-card-foot">
        <span>{champ.wins}W · {champ.losses}L</span>
        <span className="champ-detail-cta">View matchups →</span>
      </div>
    </div>
  );
}

function MasteryOnlyCard({ champ, matchesLoading, matchesExhausted, onLoadUntil }) {
  const last = masteryAge(champ.lastPlayTime);
  return (
    <div className="champ-card" style={{ opacity: 0.85 }}>
      <div className="champ-card-head">
        <ChampPortrait url={champ.portrait} letter={champ.letter} />
        <div className="champ-card-id">
          <div className="champ-name">{champ.displayName}</div>
          <div className="champ-role">
            M{champ.masteryLevel} · {(champ.masteryPoints / 1000).toFixed(0)}K pts
          </div>
        </div>
        <div className="champ-wr" style={{ fontSize: 18, color: 'var(--ink-faint)' }}>—</div>
      </div>

      <div style={{
        padding: '14px 0',
        borderTop: '1px solid var(--line)',
        borderBottom: '1px solid var(--line)',
        margin: '6px 0 14px',
        textAlign: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase',
        color: 'var(--ink-faint)',
      }}>
        No recent games {last && `· last played ${last}`}
      </div>

      <div className="champ-card-foot">
        <span style={{ color: 'var(--ink-faint)' }}>HISTORICAL</span>
        {!matchesExhausted ? (
          <button
            onClick={(e) => { e.stopPropagation(); onLoadUntil(); }}
            disabled={matchesLoading}
            title="Page back through match history until this champ appears (may take a moment)"
            style={{
              background: 'transparent', border: 'none',
              color: 'var(--accent)', padding: 0,
              fontFamily: 'var(--font-mono)', fontSize: 10,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              cursor: matchesLoading ? 'wait' : 'pointer',
              opacity: matchesLoading ? 0.5 : 1,
            }}
          >
            {matchesLoading ? 'Searching…' : 'Find games →'}
          </button>
        ) : (
          <span style={{ color: 'var(--ink-faint)' }}>NO MATCHES IN HISTORY</span>
        )}
      </div>
    </div>
  );
}

const MATCHUP_ROLES = [
  { key: "LANE",    label: "Lane" },
  { key: "TOP",     label: "Top" },
  { key: "JUNGLE",  label: "Jungle" },
  { key: "MIDDLE",  label: "Mid" },
  { key: "BOTTOM",  label: "ADC" },
  { key: "UTILITY", label: "Support" },
];

function ChampionDetail({ champ, ddragon, onBack, onSelectMatch }) {
  const wr = champ.winrate;
  const wrCls = wr >= 60 ? 'high' : wr < 50 ? 'low' : '';
  const wrLabel = wr.toFixed(1);

  const [matchupRole, setMatchupRole] = React.useState("LANE");

  const matchups = window.RiotAPI.deriveMatchupsForChamp({
    entry: champ,
    championIndex: ddragon,
    role: matchupRole,
  });

  const sortedMatchups = matchups;
  const reliable = matchups.filter(m => m.games >= 2);
  const best = reliable.length > 0
    ? [...reliable].sort((a, b) => b.wr - a.wr)[0]
    : null;
  const worst = reliable.length > 0
    ? [...reliable].sort((a, b) => a.wr - b.wr)[0]
    : null;

  const totalKills = champ.kAvg ? (parseFloat(champ.kAvg) * champ.games).toFixed(0) : 0;
  const lastPlayed = masteryAge(champ.lastPlayTime);

  return (
    <div className="champ-detail">
      <div className="champ-detail-back">
        <button onClick={onBack}>← Back to repertoire</button>
        <div className="champ-detail-meta">
          DOSSIER · {champ.games} GAMES AGGREGATED
        </div>
      </div>

      <div className="champ-detail-hero">
        <div className="champ-detail-portrait-wrap">
          <ChampPortrait url={champ.portrait} letter={champ.letter} className="champ-detail-portrait" />
          {champ.masteryLevel != null && (
            <div className="champ-mastery-badge">MASTERY {champ.masteryLevel}</div>
          )}
        </div>
        <div className="champ-detail-id">
          <div className="champ-detail-eyebrow">CHAMPION DEEP-DIVE</div>
          <h2 className="champ-detail-name">{champ.displayName}</h2>
          <div className="champ-detail-sub">
            {champ.role} · {(champ.masteryPoints || 0).toLocaleString()} mastery pts · {champ.games} games tracked
            {lastPlayed && ` · last played ${lastPlayed}`}
          </div>
        </div>
        <div className={`champ-detail-wr ${wrCls}`}>
          <div className="big">{wrLabel}<span>%</span></div>
          <div className="lbl">Win Rate · {champ.wins}W / {champ.losses}L</div>
        </div>
      </div>

      <div className="champ-detail-body">
        <div className="champ-detail-stats">
          <div className="cd-stat">
            <div className="cd-stat-num win">{champ.wins}</div>
            <div className="cd-stat-lbl">Wins</div>
          </div>
          <div className="cd-stat">
            <div className="cd-stat-num lose">{champ.losses}</div>
            <div className="cd-stat-lbl">Losses</div>
          </div>
          <div className="cd-stat">
            <div className="cd-stat-num">{champ.kda}</div>
            <div className="cd-stat-lbl">Avg KDA</div>
          </div>
          <div className="cd-stat">
            <div className="cd-stat-num">{champ.csmin}</div>
            <div className="cd-stat-lbl">CS / Min</div>
          </div>
          <div className="cd-stat">
            <div className="cd-stat-num">{champ.dmgmin}</div>
            <div className="cd-stat-lbl">DMG / Min</div>
          </div>
          <div className="cd-stat">
            <div className="cd-stat-num">{champ.masteryPoints ? `${(champ.masteryPoints / 1000).toFixed(0)}` : '—'}<em>K</em></div>
            <div className="cd-stat-lbl">Mastery Pts</div>
          </div>
        </div>

        {(best || worst) && (
          <div className="champ-callouts">
            {best && (
              <div className="champ-callout best">
                <div className="champ-callout-head">
                  <span className="lbl">Best Matchup ({best.games}g)</span>
                  <span className="val high">{best.wrLabel}% WR</span>
                </div>
                <div className="champ-callout-vs">
                  <ChampPortrait url={champ.portrait} letter={champ.letter} className="vs-portrait" />
                  <span className="vs-text"><em>vs</em></span>
                  <ChampPortrait url={best.portrait} letter={best.letter} className="vs-portrait small" />
                  <span className="vs-name">{best.displayName}</span>
                </div>
                <p className="champ-callout-note">
                  {best.wins}W / {best.losses}L · {best.kda} KDA — your strongest lane on {champ.displayName}.
                </p>
              </div>
            )}

            {worst && worst.vs !== best?.vs && (
              <div className="champ-callout worst">
                <div className="champ-callout-head">
                  <span className="lbl">Worst Matchup ({worst.games}g)</span>
                  <span className="val low">{worst.wrLabel}% WR</span>
                </div>
                <div className="champ-callout-vs">
                  <ChampPortrait url={champ.portrait} letter={champ.letter} className="vs-portrait" />
                  <span className="vs-text"><em>vs</em></span>
                  <ChampPortrait url={worst.portrait} letter={worst.letter} className="vs-portrait small" />
                  <span className="vs-name">{worst.displayName}</span>
                </div>
                <p className="champ-callout-note">
                  {worst.wins}W / {worst.losses}L · {worst.kda} KDA — the gap shows up here. Ban or dodge.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Matchup ledger */}
        <div className="matchup-section">
          <div className="matchup-header">
            <h3 className="matches-title">Matchup <em>ledger</em></h3>
            <div className="matchup-meta">
              {sortedMatchups.length > 0
                ? `${sortedMatchups.length} OPPONENTS · ${matchupRole === "LANE" ? "DIRECT LANE" : `VS ENEMY ${MATCHUP_ROLES.find(r => r.key === matchupRole)?.label.toUpperCase()}`}`
                : 'NO MATCHUP DATA'}
            </div>
          </div>

          <div className="matches-filter" style={{ marginBottom: 16 }}>
            {MATCHUP_ROLES.map(r => (
              <button
                key={r.key}
                className={matchupRole === r.key ? "active" : ""}
                onClick={() => setMatchupRole(r.key)}
              >{r.label}</button>
            ))}
          </div>

          {sortedMatchups.length === 0 ? (
            <div style={{
              padding: '32px', textAlign: 'center',
              fontFamily: 'var(--font-mono)', fontSize: 11,
              letterSpacing: '0.24em', color: 'var(--ink-faint)',
              border: '1px solid var(--line)',
            }}>
              MATCHUP DATA NEEDS MORE GAMES — LOAD MORE MATCHES OR BOOST AGGREGATE
            </div>
          ) : (
            <>
              <div className="matchup-table-head">
                <div>OPPONENT</div>
                <div>GAMES</div>
                <div>WIN RATE</div>
                <div>KDA</div>
                <div>RECORD</div>
                <div>VERDICT</div>
              </div>

              {sortedMatchups.map((m, i) => {
                const verdict = m.games < 2
                                ? { txt: "THIN", cls: "even" }
                              : m.wr >= 65 ? { txt: "FAVORED", cls: "fav" }
                              : m.wr >= 50 ? { txt: "EVEN", cls: "even" }
                              : m.wr >= 35 ? { txt: "ROUGH", cls: "rough" }
                                           : { txt: "GAPPED", cls: "gapped" };
                return (
                  <div key={i} className="matchup-row">
                    <div className="mu-vs">
                      <ChampPortrait url={m.portrait} letter={m.letter} className="mu-portrait" />
                      <span className="mu-name">{m.displayName}</span>
                    </div>
                    <div className="mu-games">{m.games}</div>
                    <div className="mu-wr">
                      <div className="mu-wr-bar">
                        <div className={`mu-wr-fill ${m.wr >= 60 ? 'high' : m.wr < 40 ? 'low' : ''}`} style={{ width: `${m.wr}%` }}></div>
                      </div>
                      <span className={`mu-wr-num ${m.wr >= 60 ? 'high' : m.wr < 40 ? 'low' : ''}`}>{m.wrLabel}%</span>
                    </div>
                    <div className="mu-kda">{m.kda}</div>
                    <div className="mu-note">{m.wins}W / {m.losses}L</div>
                    <div className={`mu-verdict ${verdict.cls}`}>{verdict.txt}</div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Recent games on this champion */}
        <div className="matchup-section">
          <div className="matchup-header">
            <h3 className="matches-title">Recent <em>games</em></h3>
            <div className="matchup-meta">{champ.matches.length} ON RECORD</div>
          </div>
          {champ.matches.slice(0, 8).map((m, i) => {
            const isWin = m.win;
            return (
              <div
                key={m.matchId || i}
                className="match-row"
                style={{ gridTemplateColumns: '8px 110px 60px 1fr 200px 140px 200px' }}
                onClick={() => m.matchId && onSelectMatch && onSelectMatch(m.matchId)}
              >
                <div className={`match-bar ${isWin ? '' : 'lose'}`}></div>
                <div>
                  <div className={`match-result ${isWin ? '' : 'lose'}`}>{m.result}</div>
                  <div className="match-result-meta">{m.duration} · {m.queue}</div>
                </div>
                <ChampPortrait
                  url={ddragon ? window.RiotAPI.championPortraitUrl(ddragon.version, m.champ) : null}
                  letter={m.letter}
                  className="match-champ"
                />
                <div className="match-info">
                  <div className="name">{m.laneOpponent ? `vs ${m.laneOpponent.championName}` : m.champ}</div>
                  <div className="role">{m.role} · {m.when}</div>
                </div>
                <div className="match-kda">
                  <div className="vals">
                    {m.k} / <span className="death">{m.d}</span> / {m.a}
                  </div>
                  <div className={`ratio ${parseFloat(m.kda) > 4 ? 'high' : ''}`}>{m.kda} KDA</div>
                </div>
                <div className="match-stats">
                  <div className="row"><span>CS</span><span className="v">{m.cs}</span></div>
                  <div className="row"><span>GOLD</span><span className="v">{m.gold}k</span></div>
                  <div className="row"><span>VIS</span><span className="v">{m.vs}</span></div>
                </div>
                <div className="match-tags">
                  {(m.tags || []).map((t, j) => (
                    <span key={j} className={`match-tag ${t === 'GAP' || t === 'PENTA' ? 'gap' : t === 'C' ? 'danger' : ''}`}>{t}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="lane-note">
          <div className="lane-note-label">METHODOLOGY</div>
          <p className="lane-note-text">
            All stats are aggregated from <em>your loaded match history</em> ({champ.games} {champ.games === 1 ? 'game' : 'games'} on {champ.displayName}).
            Matchups use the direct lane opponent (same role, opposing team). Load more matches or boost the aggregate
            to tighten the numbers — small samples lie.
          </p>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ChampionPool, ChampionDetail });
