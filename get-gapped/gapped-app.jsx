const { useState, useEffect, useRef } = React;

// ============ DATA ============
const REGIONS = [
  { code: "EUW", name: "Europe West" },
  { code: "EUNE", name: "Europe Nordic & East" },
  { code: "NA", name: "North America" },
  { code: "KR", name: "Korea" },
  { code: "BR", name: "Brazil" },
  { code: "JP", name: "Japan" },
  { code: "LAN", name: "Latin America North" },
  { code: "LAS", name: "Latin America South" },
  { code: "OCE", name: "Oceania" },
  { code: "RU", name: "Russia" },
  { code: "TR", name: "Türkiye" },
];

const TRENDING = [
  { name: "Faker", tag: "KR1", region: "KR", rank: "Challenger", lp: 1842, delta: "+24" },
  { name: "Caps", tag: "G2C", region: "EUW", rank: "Grandmaster", lp: 987, delta: "+18" },
  { name: "Doublelift", tag: "NA1", region: "NA", rank: "Master", lp: 412, delta: "-12" },
  { name: "Chovy", tag: "GEN", region: "KR", rank: "Challenger", lp: 1564, delta: "+31" },
  { name: "Jankos", tag: "JNK", region: "EUW", rank: "Diamond I", lp: 84, delta: "+7" },
  { name: "Rekkles", tag: "RKL", region: "EUW", rank: "Master", lp: 298, delta: "-19" },
  { name: "Showmaker", tag: "DK1", region: "KR", rank: "Challenger", lp: 1278, delta: "+9" },
];

const COMPARISON = {
  left: {
    name: "PlayerOne", tag: "EUW", letter: "P",
    rank: "DIAMOND II",
    stats: [
      { label: "Win Rate", val: "58.2%", winner: true },
      { label: "Avg KDA", val: "3.84", winner: true },
      { label: "CS / Min", val: "8.1", winner: false },
      { label: "Vision Score", val: "24.6", winner: false },
      { label: "Damage / Min", val: "612", winner: true },
      { label: "Games (30d)", val: "142", winner: true },
    ]
  },
  right: {
    name: "RivalGap", tag: "EUW", letter: "R",
    rank: "PLATINUM I",
    stats: [
      { label: "Win Rate", val: "51.4%", winner: false },
      { label: "Avg KDA", val: "2.71", winner: false },
      { label: "CS / Min", val: "8.4", winner: true },
      { label: "Vision Score", val: "31.2", winner: true },
      { label: "Damage / Min", val: "498", winner: false },
      { label: "Games (30d)", val: "87", winner: false },
    ]
  }
};

const MATCHES = [
  { result: "VICTORY", duration: "31:04", queue: "Ranked Solo", champ: "Yasuo", letter: "Y", role: "Mid", k:14, d:3, a:8, cs:241, gold:18.4, vs:24, dmg:32100, tags:["S+", "GAP"] },
  { result: "VICTORY", duration: "28:42", queue: "Ranked Solo", champ: "Akali", letter: "A", role: "Mid", k:11, d:5, a:6, cs:198, gold:14.8, vs:18, dmg:24800, tags:["A", "PENTA"] },
  { result: "DEFEAT", duration: "42:18", queue: "Ranked Solo", champ: "Zed", letter: "Z", role: "Mid", k:6, d:9, a:4, cs:284, gold:16.1, vs:14, dmg:28400, tags:["B"] },
  { result: "VICTORY", duration: "24:51", queue: "Ranked Flex", champ: "Sett", letter: "S", role: "Top", k:9, d:2, a:11, cs:174, gold:13.2, vs:21, dmg:21600, tags:["S", "GAP"] },
  { result: "VICTORY", duration: "35:09", queue: "Ranked Solo", champ: "Lee Sin", letter: "L", role: "Jungle", k:8, d:4, a:14, cs:201, gold:15.7, vs:42, dmg:19400, tags:["A", "MVP"] },
  { result: "DEFEAT", duration: "29:33", queue: "Ranked Solo", champ: "Vayne", letter: "V", role: "ADC", k:4, d:7, a:3, cs:218, gold:12.4, vs:11, dmg:18200, tags:["C"] },
  { result: "VICTORY", duration: "33:47", queue: "Ranked Solo", champ: "Thresh", letter: "T", role: "Support", k:2, d:5, a:24, cs:42, gold:9.8, vs:78, dmg:8400, tags:["S+", "VISION"] },
];

// ============ TWEAKS ============
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "gold",
  "theme": "dark",
  "bgEffect": true
}/*EDITMODE-END*/;

const ACCENT_PALETTES = {
  gold:   { accent: "#c89b3c", bright: "#f0b94e", deep: "#785a28", darker: "#463714" },
  blue:   { accent: "#3c8ec8", bright: "#5db5e8", deep: "#28557a", darker: "#143246" },
  red:    { accent: "#c83c3c", bright: "#e85d5d", deep: "#7a2828", darker: "#461414" },
  purple: { accent: "#9c3cc8", bright: "#b95de8", deep: "#5e287a", darker: "#371446" },
};

// ============ COMPONENTS ============

function Nav({ onLogo, onSignIn, isLoggedIn, onSignOut }) {
  return (
    <nav className="nav">
      <div className="nav-brand" onClick={onLogo} style={{ cursor: 'pointer' }}>
        <div className="nav-mark"></div>
        <span>GET <em className="gap">GAPPED</em></span>
      </div>
      <ul className="nav-links">
        <li><a href="#features">Intelligence</a></li>
        <li><a href="#trending">Leaderboards</a></li>
        <li><a href="#compare">Comparison</a></li>
        <li><a href="#api">API</a></li>
      </ul>
      <div className="nav-cta">
        <span className="lang">EN</span>
        {isLoggedIn ? (
          <div className="nav-user" onClick={onSignOut} style={{ cursor: 'pointer' }} title="Sign out">
            <span className="nav-user-dot"></span>
            Dennis
          </div>
        ) : (
          <button onClick={onSignIn}>Sign In</button>
        )}
      </div>
    </nav>
  );
}

function LoginModal({ onClose, onSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      if (username === "Dennis" && password === "Dennis") {
        onSuccess();
      } else {
        setError("Invalid credentials — access denied.");
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="login-overlay" onClick={onClose}>
      <div className="login-panel" onClick={e => e.stopPropagation()}>
        <div className="login-corners"></div>
        <div className="login-header">
          <div className="nav-mark"></div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>
            GET <em style={{ fontStyle: 'italic', color: 'var(--accent-bright)' }}>GAPPED</em>
          </span>
          <button className="login-close" onClick={onClose}>✕</button>
        </div>
        <div className="login-eyebrow">Operator Access · Secure Terminal</div>
        <h2 className="login-title">Authenticate<br /><em>your identity.</em></h2>
        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <div className="login-label">Operator ID</div>
            <input
              className="login-input"
              type="text"
              placeholder="username"
              value={username}
              onChange={e => { setUsername(e.target.value); setError(""); }}
              autoFocus
              autoComplete="off"
              spellCheck="false"
            />
          </div>
          <div className="login-field">
            <div className="login-label">Access Code</div>
            <input
              className="login-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(""); }}
            />
          </div>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? "Verifying…" : "Authenticate →"}
          </button>
        </form>
        <div className="login-footer">Authorized Operators Only · All Access Logged</div>
      </div>
    </div>
  );
}

function SearchBar({ onSearch }) {
  const [region, setRegion] = useState("EUW");
  const [name, setName] = useState("");
  const [regionOpen, setRegionOpen] = useState(false);
  const [acOpen, setAcOpen] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setRegionOpen(false);
        setAcOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleSubmit = (e) => {
    e?.preventDefault();
    const q = name.trim() || "Faker#KR1";
    onSearch({ region, query: q });
  };

  const filtered = TRENDING.filter(p => {
    if (!name) return true;
    const q = name.toLowerCase();
    return (p.name + "#" + p.tag).toLowerCase().includes(q);
  }).slice(0, 5);

  return (
    <form className="search-frame" onSubmit={handleSubmit} ref={containerRef}>
      <div className="search-corners"></div>
      <div className="search-header">
        <div className="label">SUMMONER LOOKUP / VOL.07</div>
        <div className="meta">
          <span>EST. 2024</span>
          <span className="live">LIVE INDEX</span>
        </div>
      </div>
      <div className="search-body">
        <div
          className={`region-select ${regionOpen ? 'open' : ''}`}
          onClick={() => { setRegionOpen(!regionOpen); setAcOpen(false); }}
        >
          <div className="label">Region</div>
          <div className="value">
            <span>{region}</span>
            <span className="chev">▾</span>
          </div>
          {regionOpen && (
            <div className="region-dropdown" onClick={e => e.stopPropagation()}>
              {REGIONS.map(r => (
                <div
                  key={r.code}
                  className="region-option"
                  onClick={() => { setRegion(r.code); setRegionOpen(false); }}
                >
                  <span className="code">{r.code}</span>
                  <span className="name">{r.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="name-input">
          <div className="label">Summoner · Tag</div>
          <input
            ref={inputRef}
            type="text"
            placeholder="GameName#TAG"
            value={name}
            onChange={(e) => { setName(e.target.value); setAcOpen(true); }}
            onFocus={() => setAcOpen(true)}
            autoComplete="off"
            spellCheck="false"
          />
          {acOpen && filtered.length > 0 && (
            <div className="autocomplete">
              <div className="ac-header">{name ? `Matches for "${name}"` : "Trending lookups"}</div>
              {filtered.map((p, i) => (
                <div
                  key={i}
                  className="ac-item"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setName(p.name + "#" + p.tag);
                    setAcOpen(false);
                    setTimeout(() => onSearch({ region: p.region, query: `${p.name}#${p.tag}` }), 80);
                  }}
                >
                  <div className="ac-name">{p.name}<span className="tag">#{p.tag}</span></div>
                  <div className="ac-meta">
                    <span>{p.region}</span>
                    <span className="ac-rank">{p.rank}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" className="search-submit">Expose</button>
      </div>
    </form>
  );
}

function Hero({ onSearch }) {
  return (
    <section className="hero">
      <div className="hero-eyebrow">VOL. VII · SEASON FOURTEEN INTELLIGENCE</div>
      <h1 className="hero-title">
        Show them<br /><em>the gap.</em>
      </h1>
      <p className="hero-sub">
        Forensic-grade scouting telemetry for League of Legends.
        Every match, every metric, every excuse — accounted for.
      </p>
      <SearchBar onSearch={onSearch} />
      <div className="hero-tools">
        <a href="#trending">Live leaderboards</a>
        <span className="sep"></span>
        <a href="#compare">Player comparison</a>
        <span className="sep"></span>
        <a href="#api">Champion meta</a>
        <span className="sep"></span>
        <a href="#api">Pro scouting API</a>
      </div>
    </section>
  );
}

function StatsStrip() {
  return (
    <div className="stats-strip">
      <div className="stat-item">
        <div className="stat-num">487<em>M</em></div>
        <div className="stat-label">Matches Indexed</div>
      </div>
      <div className="stat-item">
        <div className="stat-num">12.4<em>M</em></div>
        <div className="stat-label">Summoners Tracked</div>
      </div>
      <div className="stat-item">
        <div className="stat-num">163</div>
        <div className="stat-label">Champion Matchup Profiles</div>
      </div>
      <div className="stat-item">
        <div className="stat-num">11</div>
        <div className="stat-label">Regional Servers Live</div>
      </div>
    </div>
  );
}

function Features() {
  const items = [
    {
      mark: "I",
      title: <>Forensic <em>match dissection</em></>,
      desc: "Every objective, every rotation, every misplay surfaced with frame-accurate timestamps. Your teammates can't hide behind ping anymore.",
      tag: "Replay Intel",
    },
    {
      mark: "II",
      title: <>Predictive <em>rank trajectory</em></>,
      desc: "Bayesian elo modeling predicts where you'll peak this season — and the exact champions blocking your climb. No more coping.",
      tag: "Forecasting",
    },
    {
      mark: "III",
      title: <>Lane-phase <em>gap analysis</em></>,
      desc: "CS differential, gold lead, and zone control mapped against the global percentile of your matchup. See exactly when you got cooked.",
      tag: "Lane Phase",
    },
    {
      mark: "IV",
      title: <>Real-time <em>opponent dossiers</em></>,
      desc: "Pre-game intel on every player in your lobby — main champ pool, tilt patterns, smurf probability. Know who's int-ing before champ select.",
      tag: "Pre-Game Recon",
    },
    {
      mark: "V",
      title: <>Build & rune <em>provenance</em></>,
      desc: "Trace every successful build back to the pro player who pioneered it. Cite your sources or stay silver.",
      tag: "Build Intel",
    },
    {
      mark: "VI",
      title: <>Esports-grade <em>scouting</em></>,
      desc: "The same toolkit used by tier-one orgs to scout academy talent. Now exposed to the public, against management's wishes.",
      tag: "Pro Suite",
    },
  ];

  return (
    <section className="section" id="features">
      <div className="section-header">
        <div>
          <div className="section-num">CHAPTER 01 · INTELLIGENCE</div>
          <h2 className="section-title">A scouting tool that <em>doesn't blink.</em></h2>
        </div>
        <p className="section-lede">
          Six instruments engineered to surface the truth your duo partner has been hiding from you all season.
        </p>
      </div>
      <div className="features-grid">
        {items.map((f, i) => (
          <div key={i} className="feature">
            <div className="feature-mark">{f.mark}</div>
            <h3 className="feature-title">{f.title}</h3>
            <p className="feature-desc">{f.desc}</p>
            <span className="feature-tag">{f.tag}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Trending({ onSelectPlayer }) {
  return (
    <section className="section" id="trending">
      <div className="section-header">
        <div>
          <div className="section-num">CHAPTER 02 · LIVE INDEX</div>
          <h2 className="section-title">Names <em>you should know.</em></h2>
        </div>
        <p className="section-lede">
          The most-searched summoners across all regions in the past 24 hours. Updated continuously, ranked by climbing velocity.
        </p>
      </div>
      <div className="trending-list">
        {TRENDING.map((p, i) => (
          <div
            key={i}
            className="trending-row"
            onClick={() => onSelectPlayer({ region: p.region, query: `${p.name}#${p.tag}` })}
          >
            <div className="trending-rank">{String(i + 1).padStart(2, '0')}</div>
            <div className="trending-player">
              <div className="trending-avatar" data-letter={p.name[0]}></div>
              <div className="trending-name">{p.name}<span className="tag">#{p.tag}</span></div>
            </div>
            <div className="trending-region">{p.region}</div>
            <div className="trending-rank-text">{p.rank}</div>
            <div className="trending-lp">{p.lp.toLocaleString()} LP</div>
            <div className={`trending-delta ${p.delta.startsWith('+') ? 'up' : 'down'}`}>
              {p.delta} 24H
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Comparison() {
  const { left, right } = COMPARISON;
  return (
    <section className="section" id="compare">
      <div className="section-header">
        <div>
          <div className="section-num">CHAPTER 03 · GAP ANALYSIS</div>
          <h2 className="section-title">Settle it. <em>Numerically.</em></h2>
        </div>
        <p className="section-lede">
          Drop in two summoners. We surface the cold, queryable truth — and a verdict you can screenshot for the group chat.
        </p>
      </div>
      <div className="comparison">
        <div className="comp-side left">
          <div className="comp-player">
            <div className="comp-avatar" data-letter={left.letter}></div>
            <div>
              <div className="comp-name">{left.name}<span className="tag">#{left.tag}</span></div>
              <div className="comp-rank-text">{left.rank}</div>
            </div>
          </div>
          <div className="comp-stats">
            {left.stats.map((s, i) => (
              <div key={i} className="comp-stat">
                <div className="label">{s.label}</div>
                <div className={`val ${s.winner ? 'win' : 'lose'}`}>{s.val}</div>
              </div>
            ))}
          </div>
          <div className="comp-verdict">
            <div className="comp-verdict-label">Verdict</div>
            <div className="comp-verdict-text">
              The <span className="winner">aggressor.</span><br />
              Higher kill participation, deeper damage share.
            </div>
          </div>
        </div>

        <div className="comp-divider">
          <div className="comp-vs">vs</div>
        </div>

        <div className="comp-side right">
          <div className="comp-player">
            <div className="comp-avatar" data-letter={right.letter}></div>
            <div>
              <div className="comp-name">{right.name}<span className="tag">#{right.tag}</span></div>
              <div className="comp-rank-text">{right.rank}</div>
            </div>
          </div>
          <div className="comp-stats">
            {right.stats.map((s, i) => (
              <div key={i} className="comp-stat">
                <div className="label">{s.label}</div>
                <div className={`val ${s.winner ? 'win' : 'lose'}`}>{s.val}</div>
              </div>
            ))}
          </div>
          <div className="comp-verdict">
            <div className="comp-verdict-label">Verdict</div>
            <div className="comp-verdict-text">
              The <span className="loser">passenger.</span><br />
              Carried by vision, exposed in damage.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection({ onSearch }) {
  return (
    <section className="cta-section">
      <h2 className="cta-title">Pull up the <em>receipts.</em></h2>
      <p className="cta-sub">Eleven regions. Twelve million summoners. Zero excuses.</p>
      <button className="cta-button" onClick={() => onSearch({ region: "KR", query: "Faker#KR1" })}>
        Run a Sample Lookup
      </button>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div>© 2026 GET GAPPED · ALL RECEIPTS RESERVED</div>
      <div className="disclaimer">
        Get Gapped isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing League of Legends.
      </div>
      <div>v 7.04.21 · STATUS: <span style={{color:'var(--success)'}}>NOMINAL</span></div>
    </footer>
  );
}

// ============ LOADING ============
function LoadingScreen({ query, region }) {
  const [step, setStep] = useState(0);
  const steps = [
    "Authenticating with Riot endpoint",
    "Fetching match history (last 100)",
    "Cross-referencing rank percentiles",
    "Compiling gap analysis dossier",
  ];

  useEffect(() => {
    const timers = steps.map((_, i) =>
      setTimeout(() => setStep(i + 1), (i + 1) * 500)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="loading-screen">
      <div className="loading-emblem"></div>
      <div className="loading-status">
        EXTRACTING DOSSIER · {region}
        <div className="loading-name">{query}</div>
      </div>
      <div className="loading-steps">
        {steps.map((s, i) => (
          <div key={i} className={`loading-step ${i < step ? 'done' : i === step ? 'active' : ''}`}>
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ PROFILE ============
function ProfilePage({ query, region, data, error, mastery, ddragon, onBack }) {
  const fallbackName = query.includes('#') ? query.split('#')[0] : query;
  const fallbackTag = query.includes('#') ? query.split('#')[1] : region + "1";

  const name = data?.gameName || fallbackName;
  const tag = data?.tagLine || fallbackTag;
  const letter = name[0]?.toUpperCase() || "?";
  const level = data?.summoner?.summonerLevel ?? 487;

  const solo = data?.solo ? window.RiotAPI.formatRankLine(data.solo) : null;
  const flex = data?.flex ? window.RiotAPI.formatRankLine(data.flex) : null;
  const rank = solo || flex;

  const [filter, setFilter] = useState("All");
  const [selectedChamp, setSelectedChamp] = useState(null);
  const [selectedMatchId, setSelectedMatchId] = useState(null);

  const [matches, setMatches] = useState([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchesError, setMatchesError] = useState(null);
  const [matchesExhausted, setMatchesExhausted] = useState(false);

  const puuid = data?.account?.puuid;
  const matchesRef = useRef([]);
  matchesRef.current = matches;

  const loadBatch = async ({ reset = false, count = 10 } = {}) => {
    if (!puuid) return [];
    setMatchesLoading(true);
    setMatchesError(null);
    const start = reset ? 0 : matchesRef.current.length;
    try {
      const batch = await window.RiotAPI.fetchMatchBatch({ region, puuid, start, count });
      if (batch.length < count) setMatchesExhausted(true);
      const next = reset ? batch : [...matchesRef.current, ...batch];
      matchesRef.current = next;
      setMatches(next);
      return batch;
    } catch (e) {
      console.error("Match fetch failed:", e);
      setMatchesError(e.message || String(e));
      return [];
    } finally {
      setMatchesLoading(false);
    }
  };

  const loadMore = async (count = 10) => {
    if (matchesLoading) return [];
    return loadBatch({ reset: false, count });
  };

  // Hybrid boost: pulls 30 more on demand
  const boostAggregate = () => loadMore(30);

  // Page through history until target champion appears (or safety cap hit)
  const loadUntilChampion = async (championName, { batchSize = 10, maxBatches = 8 } = {}) => {
    if (!puuid || matchesLoading) return;
    for (let i = 0; i < maxBatches; i++) {
      if (matchesRef.current.some(m => m.champ === championName)) return;
      const batch = await loadBatch({ reset: false, count: batchSize });
      if (batch.length === 0) return;
      if (batch.some(m => m.champ === championName)) return;
    }
  };

  useEffect(() => {
    if (puuid) {
      setMatches([]);
      matchesRef.current = [];
      setMatchesExhausted(false);
      loadBatch({ reset: true, count: 10 });
    }
  }, [puuid]);

  useEffect(() => {
    if (selectedChamp) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedChamp?.name]);

  useEffect(() => {
    if (selectedMatchId) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedMatchId]);

  // Keep the drilldown in sync when matches grow / mastery loads
  useEffect(() => {
    if (!selectedChamp) return;
    const repertoire = window.RiotAPI.buildChampionRepertoire({
      matches, mastery, championIndex: ddragon,
    });
    const refreshed = repertoire.find(c => c.name === selectedChamp.name);
    if (refreshed && refreshed !== selectedChamp) setSelectedChamp(refreshed);
  }, [matches, mastery, ddragon]);

  const baseMatches = matches.length > 0 ? matches : (data ? [] : MATCHES);
  const FILTER_QUEUES = {
    All: null,
    Solo: [420],
    Flex: [440],
    Norms: [400, 430, 490],
  };
  const activeQueues = FILTER_QUEUES[filter];
  const displayMatches = activeQueues
    ? baseMatches.filter(m => m.queueId != null && activeQueues.includes(m.queueId))
    : baseMatches;

  return (
    <div className="profile-page">
      <div className="profile-back">
        <button onClick={onBack}>← Back to Index</button>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.24em', color: 'var(--ink-faint)' }}>
          DOSSIER ID · {Math.random().toString(36).slice(2, 8).toUpperCase()}-{region}
        </div>
      </div>

      <div className="profile-hero">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar" data-letter={letter}></div>
          <div className="profile-level">LV. {level}</div>
        </div>
        <div className="profile-id">
          <div className="label">SUMMONER PROFILE</div>
          <div className="profile-name">{name}<span className="tag">#{tag}</span></div>
          <div className="profile-meta">
            <span className="badge">{region}</span>
            <span>LAST SEEN · 14 MIN AGO</span>
            <span>SEASON 14 · ACTIVE</span>
          </div>
        </div>
        <div className="profile-actions">
          <button className="primary">+ Track Player</button>
          <button>Generate Report</button>
          <button>Compare</button>
        </div>
      </div>

      {error && (
        <div className="verdict-banner" style={{ background: 'color-mix(in srgb, var(--danger) 14%, var(--bg-deep))', borderColor: 'var(--danger)' }}>
          <div className="text" style={{ fontSize: 18 }}>
            <em style={{ color: 'var(--danger)' }}>Riot API request failed.</em>{' '}
            Showing placeholder data — check API key (24h dev keys expire), Riot ID format (Name#TAG), and that the CORS proxy is reachable.
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, marginTop: 8, color: 'var(--ink-faint)' }}>{error}</div>
          </div>
        </div>
      )}

      {!error && (
        <div className="verdict-banner">
          <div className="text">
            {rank ? (
              <>Verdict: <em>{rank.tier} {rank.division}</em> · <em>{rank.lp} LP</em><br />
                {rank.wins}W / {rank.losses}L · {rank.winrate.toFixed(1)}% winrate
                {rank.topPct !== null && ` · top ${rank.topPct}% globally`}
              </>
            ) : data ? (
              <>Verdict: <em>Unranked this season.</em><br />
                Profile loaded — no ranked entries on record.
              </>
            ) : (
              <>Verdict: <em>this one's gapping the lobby.</em><br />
                Top 4% damage share, top 11% climbing velocity, season-long.
              </>
            )}
          </div>
          <div className="badge-wrap">
            <span className="verdict-badge">{rank ? `${rank.rawTier}` : 'CERTIFIED GAP'}</span>
            {rank && <span className="verdict-badge" style={{background:'transparent', color:'var(--accent)', border:'1px solid var(--accent)'}}>{rank.lp} LP</span>}
          </div>
        </div>
      )}

      <div className="profile-body">
        {selectedMatchId ? (
          <div style={{ gridColumn: '1 / -1' }}>
            <MatchDetail
              matchId={selectedMatchId}
              focusPuuid={puuid}
              region={region}
              ddragon={ddragon}
              onBack={() => setSelectedMatchId(null)}
            />
          </div>
        ) : selectedChamp ? (
          <div style={{ gridColumn: '1 / -1' }}>
            <ChampionDetail
              champ={selectedChamp}
              ddragon={ddragon}
              onSelectMatch={setSelectedMatchId}
              onBack={() => setSelectedChamp(null)}
            />
          </div>
        ) : (
          <>
        <aside className="profile-rank-card">
          <div className="queue">{solo ? 'RANKED · SOLO / DUO' : flex ? 'RANKED · FLEX' : 'RANKED · UNRANKED'}</div>
          <div className="rank-emblem"></div>
          <div className="rank-tier">
            {rank ? <><em>{rank.tier}</em> {rank.division}</> : <><em>Unranked</em></>}
          </div>
          <div className="rank-lp">
            <strong>{rank ? rank.lp : 0}</strong> LP
            {rank && rank.topPct !== null && ` · TOP ${rank.topPct}%`}
          </div>
          <div className="rank-stats">
            <div className="rank-stat">
              <div className="num win">{rank ? rank.wins : 0}</div>
              <div className="lbl">Wins</div>
            </div>
            <div className="rank-stat">
              <div className="num lose">{rank ? rank.losses : 0}</div>
              <div className="lbl">Losses</div>
            </div>
            <div className="rank-stat">
              <div className="num">{rank ? rank.wins + rank.losses : 0}</div>
              <div className="lbl">Played</div>
            </div>
          </div>
          <div className="rank-winrate">
            <strong>{rank ? rank.winrate.toFixed(1) : '0.0'}% Win Rate</strong>
            {data ? `LV ${level} · ${region}` : '+14 LP / DAY AVG · 8-GAME STREAK'}
          </div>
        </aside>

        <div className="matches-section">
          <div className="matches-header">
            <h3 className="matches-title">Recent <em>autopsies</em></h3>
            <div className="matches-filter">
              {["All", "Solo", "Flex", "Norms"].map(f => (
                <button
                  key={f}
                  className={filter === f ? "active" : ""}
                  onClick={() => setFilter(f)}
                >{f}</button>
              ))}
            </div>
          </div>

          {displayMatches.length === 0 && matchesLoading && (
            <div style={{ padding: '40px 0', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.24em', color: 'var(--ink-faint)' }}>
              FETCHING MATCH HISTORY…
            </div>
          )}

          {displayMatches.length === 0 && !matchesLoading && data && !matchesError && (
            <div style={{ padding: '40px 0', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.24em', color: 'var(--ink-faint)' }}>
              {baseMatches.length === 0
                ? 'NO MATCHES ON RECORD'
                : `NO ${filter.toUpperCase()} MATCHES IN ${baseMatches.length} LOADED · TRY LOAD MORE`}
            </div>
          )}

          {displayMatches.map((m, i) => {
            const isWin = m.result === "VICTORY";
            const kda = m.kda ?? ((m.k + m.a) / Math.max(m.d, 1)).toFixed(2);
            const cs = m.cs;
            const gold = typeof m.gold === 'string' ? m.gold : m.gold;
            return (
              <div
                key={m.matchId || i}
                className="match-row"
                onClick={() => m.matchId && setSelectedMatchId(m.matchId)}
              >
                <div className={`match-bar ${isWin ? '' : 'lose'}`}></div>
                <div>
                  <div className={`match-result ${isWin ? '' : 'lose'}`}>{m.result}</div>
                  <div className="match-result-meta">{m.duration} · {m.queue}</div>
                </div>
                {ddragon && m.champ ? (
                  <div className="match-champ" style={{
                    backgroundImage: `url(${window.RiotAPI.championPortraitUrl(ddragon.version, m.champ)})`,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                  }}></div>
                ) : (
                  <div className="match-champ" data-letter={m.letter}></div>
                )}
                <div className="match-info">
                  <div className="name">{m.champ}</div>
                  <div className="role">{m.role} · {m.when || '2 days ago'}</div>
                </div>
                <div className="match-kda">
                  <div className="vals">
                    {m.k} / <span className="death">{m.d}</span> / {m.a}
                  </div>
                  <div className={`ratio ${parseFloat(kda) > 4 ? 'high' : ''}`}>{kda} KDA</div>
                </div>
                <div className="match-stats">
                  <div className="row"><span>CS</span><span className="v">{cs}</span></div>
                  <div className="row"><span>GOLD</span><span className="v">{gold}k</span></div>
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

          {matchesError && (
            <div style={{ padding: '24px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--danger)', border: '1px solid var(--danger)', marginTop: 16 }}>
              MATCH FETCH FAILED · {matchesError}
            </div>
          )}

          {puuid && !matchesExhausted && displayMatches.length > 0 && (
            <button
              onClick={() => loadMore(10)}
              disabled={matchesLoading}
              style={{
                marginTop: 24, padding: '16px 32px', alignSelf: 'center',
                background: 'transparent', border: '1px solid var(--accent)',
                color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 11,
                letterSpacing: '0.24em', textTransform: 'uppercase', cursor: matchesLoading ? 'wait' : 'pointer',
                opacity: matchesLoading ? 0.5 : 1, transition: 'all 0.2s',
              }}
              onMouseEnter={e => { if (!matchesLoading) { e.target.style.background = 'var(--accent)'; e.target.style.color = 'var(--bg-deep)'; } }}
              onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = 'var(--accent)'; }}
            >
              {matchesLoading ? 'Loading…' : `Load 10 more · ${matches.length} loaded`}
            </button>
          )}

          {matchesExhausted && matches.length > 0 && (
            <div style={{ marginTop: 24, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.24em', color: 'var(--ink-faint)' }}>
              END OF HISTORY · {matches.length} MATCHES
            </div>
          )}
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <ChampionPool
            matches={matches}
            mastery={mastery}
            ddragon={ddragon}
            matchesLoaded={matches.length}
            matchesLoading={matchesLoading}
            matchesExhausted={matchesExhausted}
            onSelectChampion={setSelectedChamp}
            onBoost={boostAggregate}
            onLoadUntilChampion={loadUntilChampion}
          />
        </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============ TWEAKS PANEL ============
function TweaksUI({ tweaks, setTweak }) {
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection title="Accent">
        <TweakRadio
          options={[
            { value: "gold", label: "Gold" },
            { value: "blue", label: "Blue" },
            { value: "red", label: "Red" },
            { value: "purple", label: "Purple" },
          ]}
          value={tweaks.accent}
          onChange={v => setTweak("accent", v)}
        />
      </TweakSection>
      <TweakSection title="Theme">
        <TweakRadio
          options={[
            { value: "dark", label: "Dark" },
            { value: "light", label: "Light" },
          ]}
          value={tweaks.theme}
          onChange={v => setTweak("theme", v)}
        />
      </TweakSection>
      <TweakSection title="Background Effect">
        <TweakToggle
          value={tweaks.bgEffect}
          onChange={v => setTweak("bgEffect", v)}
          label="Atmospheric grid + glow"
        />
      </TweakSection>
    </TweaksPanel>
  );
}

// ============ APP ============
function App() {
  const [view, setView] = useState("landing"); // landing | loading | profile
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("EUW");
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [showLogin, setShowLogin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Apply tweaks to DOM
  useEffect(() => {
    const palette = ACCENT_PALETTES[tweaks.accent] || ACCENT_PALETTES.gold;
    const root = document.documentElement;
    root.style.setProperty('--accent', palette.accent);
    root.style.setProperty('--accent-bright', palette.bright);
    root.style.setProperty('--accent-deep', palette.deep);
    root.style.setProperty('--accent-darker', palette.darker);
    root.setAttribute('data-theme', tweaks.theme);
    document.getElementById('bgfx').classList.toggle('off', !tweaks.bgEffect);
  }, [tweaks]);

  const [profileData, setProfileData] = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [mastery, setMastery] = useState(null);
  const [ddragon, setDDragon] = useState(null);

  // DDragon is global / one-time — load once on mount and cache
  useEffect(() => {
    if (!ddragon) {
      window.RiotAPI.fetchDDragon().then(setDDragon).catch(err => {
        console.warn("DDragon load failed:", err);
      });
    }
  }, []);

  const handleSearch = ({ region, query }) => {
    setRegion(region);
    setQuery(query);
    setProfileData(null);
    setProfileError(null);
    setMastery(null);
    setView("loading");
    window.scrollTo(0, 0);

    const minDelay = new Promise(r => setTimeout(r, 1800));
    const apiCall = window.RiotAPI.fetchSummonerProfile({ region, query })
      .then(data => ({ ok: true, data }))
      .catch(err => ({ ok: false, err }));

    Promise.all([minDelay, apiCall]).then(([, result]) => {
      if (result.ok) {
        setProfileData(result.data);
        // Mastery in parallel — non-blocking
        window.RiotAPI.fetchChampionMastery({ region, puuid: result.data.account.puuid })
          .then(setMastery)
          .catch(err => console.warn("Mastery load failed:", err));
      } else {
        console.error("Riot API failed:", result.err);
        setProfileError(result.err.message || String(result.err));
      }
      setView("profile");
    });
  };

  const handleBack = () => {
    setView("landing");
    setQuery("");
    setProfileData(null);
    setProfileError(null);
    setMastery(null);
  };

  return (
    <>
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={() => { setIsLoggedIn(true); setShowLogin(false); }}
        />
      )}
      {view === "landing" && (
        <>
          <Nav
            onLogo={handleBack}
            onSignIn={() => setShowLogin(true)}
            isLoggedIn={isLoggedIn}
            onSignOut={() => setIsLoggedIn(false)}
          />
          <Hero onSearch={handleSearch} />
          <StatsStrip />
          <Features />
          <Trending onSelectPlayer={handleSearch} />
          <Comparison />
          <CTASection onSearch={handleSearch} />
          <Footer />
        </>
      )}
      {view === "loading" && <LoadingScreen query={query} region={region} />}
      {view === "profile" && <ProfilePage query={query} region={region} data={profileData} error={profileError} mastery={mastery} ddragon={ddragon} onBack={handleBack} />}
      <TweaksUI tweaks={tweaks} setTweak={setTweak} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('app')).render(<App />);
