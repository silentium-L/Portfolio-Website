// ============ RIOT API CLIENT ============
// NOTE: Riot's API has no CORS — direct browser calls fail.
// For local dev we route through a public CORS proxy. For production,
// replace PROXY with your own backend that keeps the API key server-side.
//
// Dev API keys (RGAPI-...) expire every 24h — refresh from
// https://developer.riotgames.com/ when calls start returning 401/403.

const RIOT_API_KEY = window.RIOT_API_KEY || "";
const PROXY = "https://corsproxy.io/?";

// Region (UI code) -> { platform: summoner/league host, regional: account host }
const REGION_ROUTING = {
  EUW:  { platform: "euw1",  regional: "europe"   },
  EUNE: { platform: "eun1",  regional: "europe"   },
  NA:   { platform: "na1",   regional: "americas" },
  KR:   { platform: "kr",    regional: "asia"     },
  BR:   { platform: "br1",   regional: "americas" },
  JP:   { platform: "jp1",   regional: "asia"     },
  LAN:  { platform: "la1",   regional: "americas" },
  LAS:  { platform: "la2",   regional: "americas" },
  OCE:  { platform: "oc1",   regional: "sea"      },
  RU:   { platform: "ru",    regional: "europe"   },
  TR:   { platform: "tr1",   regional: "europe"   },
};

// Tier ordering for "TOP X%" estimation
const TIER_RANK_PCT = {
  CHALLENGER: 0.01, GRANDMASTER: 0.05, MASTER: 0.2,
  DIAMOND: 1.5, EMERALD: 4, PLATINUM: 10,
  GOLD: 25, SILVER: 45, BRONZE: 70, IRON: 90, UNRANKED: 100,
};

// Dev key budget: 20 req / 1s, 100 req / 2min. The free CORS proxy adds
// latency and may rate-limit on its own, so we keep concurrency very low
// and pause ALL requests globally when any one sees a 429.
const MAX_CONCURRENT = 2;
const MAX_RETRIES = 4;
const DEFAULT_RETRY_MS = 2000;

let _inFlight = 0;
const _waitQueue = [];
let _pausedUntil = 0; // epoch ms — all requests wait until this point

function _acquireSlot() {
  if (_inFlight < MAX_CONCURRENT) {
    _inFlight++;
    return Promise.resolve();
  }
  return new Promise(resolve => _waitQueue.push(resolve));
}

function _releaseSlot() {
  const next = _waitQueue.shift();
  if (next) next();
  else _inFlight--;
}

function _sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function _waitForGate() {
  while (Date.now() < _pausedUntil) {
    await _sleep(_pausedUntil - Date.now());
  }
}

async function riotFetch(url) {
  const proxied = PROXY + encodeURIComponent(url);
  await _acquireSlot();
  try {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      await _waitForGate();
      const res = await fetch(proxied, {
        headers: { "X-Riot-Token": RIOT_API_KEY },
      });
      if (res.ok) return res.json();

      if (res.status === 429 && attempt < MAX_RETRIES) {
        const retryAfter = parseInt(res.headers.get("Retry-After") || "", 10);
        const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
          ? retryAfter * 1000
          : DEFAULT_RETRY_MS * Math.pow(2, attempt);
        // Raise the global gate so concurrent requests stop hammering too.
        _pausedUntil = Math.max(_pausedUntil, Date.now() + waitMs);
        await _waitForGate();
        continue;
      }

      const body = await res.text().catch(() => "");
      const err = new Error(`Riot API ${res.status}: ${body || res.statusText}`);
      err.status = res.status;
      throw err;
    }
    throw new Error("Riot API: retries exhausted");
  } finally {
    _releaseSlot();
  }
}

function parseRiotId(query, regionCode) {
  const trimmed = query.trim();
  if (trimmed.includes("#")) {
    const [gameName, tagLine] = trimmed.split("#");
    return { gameName: gameName.trim(), tagLine: tagLine.trim() };
  }
  // Fallback: assume region code as tag (Riot requires a tag)
  return { gameName: trimmed, tagLine: regionCode };
}

async function fetchSummonerProfile({ region, query }) {
  const routing = REGION_ROUTING[region] || REGION_ROUTING.EUW;
  const { gameName, tagLine } = parseRiotId(query, region);

  // 1. Riot ID -> account (puuid)
  const account = await riotFetch(
    `https://${routing.regional}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
  );

  // 2. puuid -> summoner (level, profileIconId)
  const summoner = await riotFetch(
    `https://${routing.platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${account.puuid}`
  );

  // 3. puuid -> league entries (rank/LP/wins/losses)
  const entries = await riotFetch(
    `https://${routing.platform}.api.riotgames.com/lol/league/v4/entries/by-puuid/${account.puuid}`
  );

  const solo = entries.find(e => e.queueType === "RANKED_SOLO_5x5") || null;
  const flex = entries.find(e => e.queueType === "RANKED_FLEX_SR") || null;

  return {
    account,
    summoner,
    entries,
    solo,
    flex,
    gameName: account.gameName || gameName,
    tagLine: account.tagLine || tagLine,
    region,
  };
}

function formatRankLine(entry) {
  if (!entry) return { tier: "Unranked", division: "", lp: 0, wins: 0, losses: 0, winrate: 0, topPct: null };
  const tier = entry.tier?.charAt(0) + entry.tier?.slice(1).toLowerCase();
  const games = entry.wins + entry.losses;
  const winrate = games > 0 ? (entry.wins / games) * 100 : 0;
  const topPct = TIER_RANK_PCT[entry.tier] ?? null;
  return {
    tier,
    rawTier: entry.tier,
    division: entry.rank || "",
    lp: entry.leaguePoints ?? 0,
    wins: entry.wins ?? 0,
    losses: entry.losses ?? 0,
    winrate,
    topPct,
  };
}

// ============ MATCH HISTORY ============

const QUEUE_NAMES = {
  420: "Ranked Solo",
  440: "Ranked Flex",
  400: "Normal Draft",
  430: "Normal Blind",
  450: "ARAM",
  700: "Clash",
  900: "URF",
  1700: "Arena",
  1900: "URF",
  490: "Quickplay",
};

function queueName(queueId) {
  return QUEUE_NAMES[queueId] || `Queue ${queueId}`;
}

function timeAgo(ts) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  return `${mo}mo ago`;
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

async function fetchMatchIds({ region, puuid, start = 0, count = 10 }) {
  const routing = REGION_ROUTING[region] || REGION_ROUTING.EUW;
  return riotFetch(
    `https://${routing.regional}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=${start}&count=${count}`
  );
}

// Raw match cache so the detail view can re-use already-downloaded data
const _matchCache = new Map();

async function fetchMatch({ region, matchId }) {
  if (_matchCache.has(matchId)) return _matchCache.get(matchId);
  const routing = REGION_ROUTING[region] || REGION_ROUTING.EUW;
  const match = await riotFetch(
    `https://${routing.regional}.api.riotgames.com/lol/match/v5/matches/${matchId}`
  );
  _matchCache.set(matchId, match);
  return match;
}

function getCachedMatch(matchId) {
  return _matchCache.get(matchId) || null;
}

const _timelineCache = new Map();

async function fetchMatchTimeline({ region, matchId }) {
  if (_timelineCache.has(matchId)) return _timelineCache.get(matchId);
  const routing = REGION_ROUTING[region] || REGION_ROUTING.EUW;
  const timeline = await riotFetch(
    `https://${routing.regional}.api.riotgames.com/lol/match/v5/matches/${matchId}/timeline`
  );
  _timelineCache.set(matchId, timeline);
  return timeline;
}

function getCachedTimeline(matchId) {
  return _timelineCache.get(matchId) || null;
}

async function fetchMatchBatch({ region, puuid, start = 0, count = 10 }) {
  const ids = await fetchMatchIds({ region, puuid, start, count });
  if (!ids.length) return [];
  const matches = await Promise.all(ids.map(matchId => fetchMatch({ region, matchId })));
  return matches.map(m => extractParticipantView(m, puuid)).filter(Boolean);
}

function extractParticipantView(match, puuid) {
  const me = match?.info?.participants?.find(p => p.puuid === puuid);
  if (!me) return null;

  const durationSec = match.info.gameDuration;
  const minutes = Math.max(durationSec / 60, 1);
  const cs = (me.totalMinionsKilled || 0) + (me.neutralMinionsKilled || 0);
  const kda = ((me.kills + me.assists) / Math.max(me.deaths, 1));

  const enemies = (match.info.participants || [])
    .filter(p => p.teamId !== me.teamId)
    .map(p => ({
      championName: p.championName,
      teamPosition: p.teamPosition || p.individualPosition || "",
    }));

  const laneOpponent = enemies.find(p =>
    me.teamPosition && p.teamPosition === me.teamPosition
  ) || null;

  return {
    matchId: match.metadata.matchId,
    result: me.win ? "VICTORY" : "DEFEAT",
    win: me.win,
    duration: formatDuration(durationSec),
    durationSec,
    queue: queueName(match.info.queueId),
    queueId: match.info.queueId,
    champ: me.championName,
    letter: (me.championName || "?")[0].toUpperCase(),
    role: me.teamPosition || me.individualPosition || me.role || "—",
    k: me.kills,
    d: me.deaths,
    a: me.assists,
    kda: kda.toFixed(2),
    kdaNum: kda,
    cs,
    csPerMin: (cs / minutes).toFixed(1),
    gold: ((me.goldEarned || 0) / 1000).toFixed(1),
    vs: me.visionScore || 0,
    dmg: me.totalDamageDealtToChampions || 0,
    when: timeAgo(match.info.gameEndTimestamp),
    tags: deriveTags(me, kda),
    laneOpponent,
    enemies,
  };
}

function deriveTags(p, kda) {
  const tags = [];
  if (p.pentaKills > 0) tags.push("PENTA");
  else if (p.quadraKills > 0) tags.push("QUADRA");
  else if (p.tripleKills > 0) tags.push("TRIPLE");

  if (kda >= 6) tags.push("S+");
  else if (kda >= 4) tags.push("S");
  else if (kda >= 3) tags.push("A");
  else if (kda < 1.5) tags.push("C");

  if (p.win && kda >= 5 && p.kills >= 10) tags.push("GAP");
  return tags;
}

// ============ DATA DRAGON (static, no key, no rate limit) ============

async function fetchLatestVersion() {
  const res = await fetch("https://ddragon.leagueoflegends.com/api/versions.json");
  if (!res.ok) throw new Error(`DDragon versions ${res.status}`);
  const versions = await res.json();
  return versions[0];
}

async function fetchChampionIndex(version) {
  const res = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`);
  if (!res.ok) throw new Error(`DDragon champion.json ${res.status}`);
  const json = await res.json();
  const byId = {};
  const byKey = {};
  Object.values(json.data).forEach(c => {
    byId[c.id] = c;
    byKey[c.key] = c;
  });
  return { version, byId, byKey };
}

async function fetchItemIndex(version) {
  const res = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/item.json`);
  if (!res.ok) throw new Error(`DDragon item.json ${res.status}`);
  const json = await res.json();
  return json.data; // keyed by numeric id string
}

async function fetchSummonerSpellIndex(version) {
  const res = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/summoner.json`);
  if (!res.ok) throw new Error(`DDragon summoner.json ${res.status}`);
  const json = await res.json();
  const byKey = {};
  Object.values(json.data).forEach(spell => {
    byKey[spell.key] = spell; // numeric key string -> { id: "SummonerFlash", name, image }
  });
  return byKey;
}

async function fetchRunesReforged(version) {
  const res = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/runesReforged.json`);
  if (!res.ok) throw new Error(`DDragon runesReforged.json ${res.status}`);
  const styles = await res.json(); // array of paths
  const byPerkId = {};
  const byStyleId = {};
  styles.forEach(style => {
    byStyleId[style.id] = { id: style.id, name: style.name, icon: style.icon };
    style.slots.forEach(slot => {
      slot.runes.forEach(rune => {
        byPerkId[rune.id] = { id: rune.id, name: rune.name, icon: rune.icon, styleId: style.id };
      });
    });
  });
  return { byPerkId, byStyleId };
}

async function fetchDDragon() {
  const version = await fetchLatestVersion();
  const [champions, items, summoners, runes] = await Promise.all([
    fetchChampionIndex(version),
    fetchItemIndex(version).catch(() => ({})),
    fetchSummonerSpellIndex(version).catch(() => ({})),
    fetchRunesReforged(version).catch(() => ({ byPerkId: {}, byStyleId: {} })),
  ]);
  return { ...champions, items, summoners, runes };
}

function championPortraitUrl(version, championId) {
  if (!version || !championId) return null;
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${championId}.png`;
}

function itemIconUrl(version, itemId) {
  if (!version || !itemId) return null;
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${itemId}.png`;
}

function summonerSpellIconUrl(version, ddragon, spellKey) {
  if (!version || !ddragon?.summoners) return null;
  const spell = ddragon.summoners[String(spellKey)];
  if (!spell) return null;
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${spell.id}.png`;
}

function runeIconUrl(ddragon, perkId) {
  const rune = ddragon?.runes?.byPerkId?.[perkId];
  if (!rune) return null;
  return `https://ddragon.leagueoflegends.com/cdn/img/${rune.icon}`;
}

function runeStyleIconUrl(ddragon, styleId) {
  const style = ddragon?.runes?.byStyleId?.[styleId];
  if (!style) return null;
  return `https://ddragon.leagueoflegends.com/cdn/img/${style.icon}`;
}

// ============ CHAMPION MASTERY ============

async function fetchChampionMastery({ region, puuid }) {
  const routing = REGION_ROUTING[region] || REGION_ROUTING.EUW;
  return riotFetch(
    `https://${routing.platform}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}`
  );
}

// ============ AGGREGATION ============

const ROLE_LABEL = {
  TOP: "Top", JUNGLE: "Jungle", MIDDLE: "Mid", BOTTOM: "ADC", UTILITY: "Support",
};

function buildChampionRepertoire({ matches, mastery, championIndex }) {
  const byChamp = new Map();

  for (const m of matches || []) {
    if (!m.champ) continue;
    let entry = byChamp.get(m.champ);
    if (!entry) {
      entry = {
        name: m.champ,
        games: 0, wins: 0, losses: 0,
        kSum: 0, dSum: 0, aSum: 0, csSum: 0, dmgSum: 0, durationSum: 0, visSum: 0,
        roleCounts: {},
        matches: [],
      };
      byChamp.set(m.champ, entry);
    }
    entry.games++;
    if (m.win) entry.wins++; else entry.losses++;
    entry.kSum += m.k; entry.dSum += m.d; entry.aSum += m.a;
    entry.csSum += m.cs; entry.dmgSum += m.dmg;
    entry.durationSum += m.durationSec || 0;
    entry.visSum += m.vs || 0;
    if (m.role) entry.roleCounts[m.role] = (entry.roleCounts[m.role] || 0) + 1;
    entry.matches.push(m);
  }

  const finalized = [];
  byChamp.forEach(entry => {
    const minutes = Math.max(entry.durationSum / 60, 1);
    const winrate = entry.games > 0 ? (entry.wins / entry.games) * 100 : 0;
    const kda = (entry.kSum + entry.aSum) / Math.max(entry.dSum, 1);
    const topRole = Object.entries(entry.roleCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const role = ROLE_LABEL[topRole] || topRole || "—";

    const meta = championIndex?.byId?.[entry.name];
    const masteryEntry = meta && mastery
      ? mastery.find(x => String(x.championId) === meta.key)
      : null;

    finalized.push({
      name: entry.name,
      displayName: meta?.name || entry.name,
      championId: entry.name,
      portrait: championIndex ? championPortraitUrl(championIndex.version, entry.name) : null,
      role,
      games: entry.games,
      wins: entry.wins,
      losses: entry.losses,
      winrate,
      kda: kda.toFixed(2),
      kdaNum: kda,
      kAvg: (entry.kSum / entry.games).toFixed(1),
      dAvg: (entry.dSum / entry.games).toFixed(1),
      aAvg: (entry.aSum / entry.games).toFixed(1),
      csmin: (entry.csSum / minutes).toFixed(1),
      dmgmin: Math.round(entry.dmgSum / minutes),
      visAvg: (entry.visSum / entry.games).toFixed(1),
      masteryLevel: masteryEntry?.championLevel ?? null,
      masteryPoints: masteryEntry?.championPoints ?? 0,
      lastPlayTime: masteryEntry?.lastPlayTime ?? null,
      matches: entry.matches,
      hasRecentGames: true,
      letter: entry.name[0]?.toUpperCase() || "?",
    });
  });

  if (mastery && championIndex) {
    for (const masteryEntry of mastery) {
      const meta = championIndex.byKey[String(masteryEntry.championId)];
      if (!meta) continue;
      if (byChamp.has(meta.id)) continue;
      finalized.push({
        name: meta.id,
        displayName: meta.name,
        championId: meta.id,
        portrait: championPortraitUrl(championIndex.version, meta.id),
        role: meta.tags?.[0] || "—",
        games: 0, wins: 0, losses: 0, winrate: 0,
        kda: "0.00", kdaNum: 0,
        csmin: "0.0", dmgmin: 0, visAvg: "0.0",
        masteryLevel: masteryEntry.championLevel,
        masteryPoints: masteryEntry.championPoints,
        lastPlayTime: masteryEntry.lastPlayTime,
        matches: [],
        hasRecentGames: false,
        letter: meta.id[0]?.toUpperCase() || "?",
      });
    }
  }

  finalized.sort((a, b) => {
    if (a.hasRecentGames !== b.hasRecentGames) return a.hasRecentGames ? -1 : 1;
    if (a.hasRecentGames) {
      if (b.games !== a.games) return b.games - a.games;
      return b.masteryPoints - a.masteryPoints;
    }
    return b.masteryPoints - a.masteryPoints;
  });

  return finalized;
}

// role: "LANE" (direct lane opponent, default) or "TOP"|"JUNGLE"|"MIDDLE"|"BOTTOM"|"UTILITY"
function deriveMatchupsForChamp({ entry, championIndex, role = "LANE" }) {
  if (!entry?.matches?.length) return [];
  const byOpponent = new Map();

  for (const m of entry.matches) {
    let opp = null;
    if (role === "LANE") {
      opp = m.laneOpponent;
    } else if (m.enemies) {
      opp = m.enemies.find(e => e.teamPosition === role) || null;
    }
    if (!opp || !opp.championName) continue;
    let row = byOpponent.get(opp.championName);
    if (!row) {
      row = {
        vs: opp.championName,
        games: 0, wins: 0, losses: 0,
        kSum: 0, dSum: 0, aSum: 0,
      };
      byOpponent.set(opp.championName, row);
    }
    row.games++;
    if (m.win) row.wins++; else row.losses++;
    row.kSum += m.k; row.dSum += m.d; row.aSum += m.a;
  }

  return [...byOpponent.values()].map(row => {
    const meta = championIndex?.byId?.[row.vs];
    const wr = row.games > 0 ? (row.wins / row.games) * 100 : 0;
    const kda = (row.kSum + row.aSum) / Math.max(row.dSum, 1);
    return {
      vs: row.vs,
      displayName: meta?.name || row.vs,
      portrait: championIndex ? championPortraitUrl(championIndex.version, row.vs) : null,
      letter: row.vs[0]?.toUpperCase() || "?",
      games: row.games,
      wins: row.wins,
      losses: row.losses,
      wr,
      wrLabel: wr.toFixed(1),
      kda: kda.toFixed(2),
    };
  }).sort((a, b) => b.games - a.games);
}

// ============ MATCH DETAIL ============

function extractMatchDetail(match, focusPuuid, ddragon) {
  if (!match) return null;
  const info = match.info;
  const me = info.participants.find(p => p.puuid === focusPuuid);

  const allDmg = Math.max(...info.participants.map(p => p.totalDamageDealtToChampions || 0), 1);

  const teams = info.teams.map(t => {
    const players = info.participants.filter(p => p.teamId === t.teamId);
    const teamKills = players.reduce((s, p) => s + p.kills, 0);
    const teamGold = players.reduce((s, p) => s + (p.goldEarned || 0), 0);
    const teamDmg = players.reduce((s, p) => s + (p.totalDamageDealtToChampions || 0), 0);
    const teamTaken = players.reduce((s, p) => s + (p.totalDamageTaken || 0), 0);
    const teamHeal = players.reduce((s, p) => s + (p.totalHealsOnTeammates || 0), 0);
    const teamVision = players.reduce((s, p) => s + (p.visionScore || 0), 0);

    return {
      teamId: t.teamId,
      side: t.teamId === 100 ? "BLUE" : "RED",
      win: t.win,
      kills: teamKills,
      gold: teamGold,
      objectives: {
        dragon: t.objectives?.dragon?.kills || 0,
        baron: t.objectives?.baron?.kills || 0,
        herald: t.objectives?.riftHerald?.kills || 0,
        tower: t.objectives?.tower?.kills || 0,
        inhibitor: t.objectives?.inhibitor?.kills || 0,
      },
      bans: (t.bans || []).map(b => b.championId).filter(id => id > 0),
      players: players.map(p => extractPlayerDetail(p, {
        teamKills, teamGold, teamDmg, teamTaken, teamHeal, teamVision,
        allDmgMax: allDmg, focusPuuid, ddragon,
        durationSec: info.gameDuration,
      })),
    };
  });

  return {
    matchId: match.metadata.matchId,
    result: me?.win ? "VICTORY" : "DEFEAT",
    win: me?.win,
    duration: formatDuration(info.gameDuration),
    durationSec: info.gameDuration,
    queue: queueName(info.queueId),
    queueId: info.queueId,
    when: timeAgo(info.gameEndTimestamp),
    gameVersion: info.gameVersion,
    teams,
  };
}

function extractPlayerDetail(p, ctx) {
  const cs = (p.totalMinionsKilled || 0) + (p.neutralMinionsKilled || 0);
  const minutes = Math.max((ctx.durationSec || 1) / 60, 1);
  const items = [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5];
  const kda = (p.kills + p.assists) / Math.max(p.deaths, 1);
  const dmg = p.totalDamageDealtToChampions || 0;
  const taken = p.totalDamageTaken || 0;
  const heal = p.totalHealsOnTeammates || 0;
  const vision = p.visionScore || 0;
  const timeDead = p.totalTimeSpentDead || 0;
  const kp = ctx.teamKills > 0 ? (p.kills + p.assists) / ctx.teamKills : 0;

  return {
    puuid: p.puuid,
    name: p.riotIdGameName || p.summonerName || "—",
    tag: p.riotIdTagline || "",
    champion: p.championName,
    championPortrait: ctx.ddragon ? championPortraitUrl(ctx.ddragon.version, p.championName) : null,
    level: p.champLevel,
    role: p.teamPosition || p.individualPosition || "",
    teamId: p.teamId,
    win: p.win,
    k: p.kills, d: p.deaths, a: p.assists,
    kda: kda.toFixed(2),
    kdaNum: kda,
    cs,
    csPerMin: (cs / minutes).toFixed(1),
    gold: p.goldEarned || 0,
    goldPerMin: Math.round((p.goldEarned || 0) / minutes),
    goldShare: ctx.teamGold > 0 ? (p.goldEarned || 0) / ctx.teamGold : 0,

    // Damage
    dmg,
    dmgShare: ctx.teamDmg > 0 ? dmg / ctx.teamDmg : 0,
    dmgVsMax: dmg / ctx.allDmgMax,
    dmgPerMin: Math.round(dmg / minutes),
    dmgToTurrets: p.damageDealtToTurrets || 0,
    dmgToObjectives: p.damageDealtToObjectives || 0,

    // Tank / sustain
    taken,
    takenShare: ctx.teamTaken > 0 ? taken / ctx.teamTaken : 0,
    selfMitigated: p.damageSelfMitigated || 0,
    healOnTeammates: heal,
    healShare: ctx.teamHeal > 0 ? heal / ctx.teamHeal : 0,

    // Crowd Control
    ccTime: p.timeCCingOthers || 0,

    // Kill participation / streaks
    killParticipation: kp,
    largestKillingSpree: p.largestKillingSpree || 0,
    largestMultiKill: p.largestMultiKill || 0,
    pentaKills: p.pentaKills || 0,
    quadraKills: p.quadraKills || 0,
    tripleKills: p.tripleKills || 0,
    doubleKills: p.doubleKills || 0,
    firstBloodKill: !!p.firstBloodKill,
    firstBloodAssist: !!p.firstBloodAssist,
    firstTowerKill: !!p.firstTowerKill,
    firstTowerAssist: !!p.firstTowerAssist,

    // Time dead
    timeDead,
    timeDeadPct: ctx.durationSec > 0 ? timeDead / ctx.durationSec : 0,

    // Vision (broken out)
    vision,
    visionShare: ctx.teamVision > 0 ? vision / ctx.teamVision : 0,
    wardsPlaced: p.wardsPlaced || 0,
    wardsKilled: p.wardsKilled || 0,
    controlWards: p.visionWardsBoughtInGame || 0,
    sightWards: p.sightWardsBoughtInGame || 0,
    visionPerMin: (vision / minutes).toFixed(2),

    items,
    trinket: p.item6,
    summoner1: p.summoner1Id,
    summoner2: p.summoner2Id,
    keystone: p.perks?.styles?.[0]?.selections?.[0]?.perk,
    primaryStyle: p.perks?.styles?.[0]?.style,
    secondaryStyle: p.perks?.styles?.[1]?.style,
    isFocused: p.puuid === ctx.focusPuuid,
  };
}

// ============ TIMELINE EXTRACTION ============

function extractTimelineView(timeline, raw, focusPuuid) {
  if (!timeline || !raw) return null;

  // participantId (1..10) -> participant info
  const idMap = {};
  raw.metadata.participants.forEach((puuid, i) => {
    const part = raw.info.participants[i];
    idMap[i + 1] = {
      puuid,
      teamId: part.teamId,
      teamPosition: part.teamPosition || part.individualPosition || "",
      championName: part.championName,
      win: part.win,
    };
  });

  const focusedId = Object.keys(idMap).find(id => idMap[id].puuid === focusPuuid);
  const focusedTeam = focusedId ? idMap[focusedId].teamId : null;
  const focusedPos = focusedId ? idMap[focusedId].teamPosition : null;
  const oppId = focusedTeam && focusedPos
    ? Object.keys(idMap).find(id =>
        idMap[id].teamId !== focusedTeam &&
        idMap[id].teamPosition === focusedPos
      )
    : null;

  const frames = timeline.info.frames || [];

  // Aggregate per-team gold per frame
  const goldDiff = frames.map(f => {
    let blue = 0, red = 0;
    Object.entries(f.participantFrames || {}).forEach(([id, pf]) => {
      const team = idMap[id]?.teamId;
      const g = pf.totalGold || 0;
      if (team === 100) blue += g;
      else if (team === 200) red += g;
    });
    return {
      ms: f.timestamp,
      minute: f.timestamp / 60000,
      blue, red,
      diff: blue - red,
    };
  });

  // Per-player series (focused vs lane opponent)
  const csOfFrame = (pf) => pf ? ((pf.minionsKilled || 0) + (pf.jungleMinionsKilled || 0)) : null;
  const playerSeries = frames.map(f => {
    const me = focusedId ? f.participantFrames?.[focusedId] : null;
    const opp = oppId ? f.participantFrames?.[oppId] : null;
    return {
      ms: f.timestamp,
      minute: f.timestamp / 60000,
      youGold: me?.totalGold ?? null,
      youXp: me?.xp ?? null,
      youCs: csOfFrame(me),
      youLevel: me?.level ?? null,
      oppGold: opp?.totalGold ?? null,
      oppXp: opp?.xp ?? null,
      oppCs: csOfFrame(opp),
      oppLevel: opp?.level ?? null,
    };
  });

  // Snapshot at a given minute mark (closest frame at or before)
  const frameAtMinute = (targetMin) => {
    const targetMs = targetMin * 60000;
    let best = null;
    for (const f of frames) {
      if (f.timestamp <= targetMs) best = f;
      else break;
    }
    return best;
  };

  // Laning-phase snapshot per participant (1..10) at min 10 and min 14
  const buildSnapshot = (targetMin) => {
    const f = frameAtMinute(targetMin);
    if (!f) return null;
    const out = {};
    Object.entries(idMap).forEach(([id]) => {
      const pf = f.participantFrames?.[id];
      out[id] = {
        gold: pf?.totalGold ?? 0,
        xp: pf?.xp ?? 0,
        cs: csOfFrame(pf) ?? 0,
        level: pf?.level ?? 0,
      };
    });
    return { minute: f.timestamp / 60000, perPlayer: out };
  };
  const snapshot10 = buildSnapshot(10);
  const snapshot14 = buildSnapshot(14);

  // Skill-up order per participant (Q=1, W=2, E=3, R=4)
  const SKILL_LETTER = { 1: "Q", 2: "W", 3: "E", 4: "R" };
  const skillOrder = {};
  for (const f of frames) {
    for (const e of f.events || []) {
      if (e.type === "SKILL_LEVEL_UP" && e.levelUpType === "NORMAL") {
        const pid = e.participantId;
        const slot = e.skillSlot;
        if (!pid || !slot) continue;
        if (!skillOrder[pid]) skillOrder[pid] = [];
        skillOrder[pid].push({
          ms: e.timestamp,
          minute: e.timestamp / 60000,
          slot,
          letter: SKILL_LETTER[slot] || String(slot),
        });
      }
    }
  }

  // Major events
  const events = [];
  for (const f of frames) {
    for (const e of f.events || []) {
      if (e.type === "CHAMPION_KILL") {
        events.push({
          type: "KILL",
          ms: e.timestamp,
          killerTeam: idMap[e.killerId]?.teamId,
          killer: idMap[e.killerId]?.championName,
          victim: idMap[e.victimId]?.championName,
          victimTeam: idMap[e.victimId]?.teamId,
          assists: (e.assistingParticipantIds || []).map(id => idMap[id]?.championName).filter(Boolean),
          position: e.position,
          involvedFocus:
            (focusedId && (
              String(e.killerId) === focusedId ||
              String(e.victimId) === focusedId ||
              (e.assistingParticipantIds || []).map(String).includes(focusedId)
            )) || false,
        });
      } else if (e.type === "ELITE_MONSTER_KILL") {
        events.push({
          type: "OBJECTIVE",
          ms: e.timestamp,
          monster: e.monsterType, // DRAGON / BARON_NASHOR / RIFTHERALD
          monsterSubType: e.monsterSubType,
          killerTeam: idMap[e.killerId]?.teamId,
          killer: idMap[e.killerId]?.championName,
          assists: (e.assistingParticipantIds || []).map(id => idMap[id]?.championName).filter(Boolean),
          position: e.position,
        });
      } else if (e.type === "BUILDING_KILL") {
        events.push({
          type: "BUILDING",
          ms: e.timestamp,
          building: e.buildingType, // TOWER_BUILDING / INHIBITOR_BUILDING
          towerType: e.towerType,
          lane: e.laneType,
          // teamId in event is the team that OWNED the building
          killedFromTeam: e.teamId,
          killerTeam: e.teamId === 100 ? 200 : 100,
          killer: idMap[e.killerId]?.championName,
          assists: (e.assistingParticipantIds || []).map(id => idMap[id]?.championName).filter(Boolean),
        });
      }
    }
  }

  events.sort((a, b) => a.ms - b.ms);

  return {
    goldDiff,
    playerSeries,
    events,
    focusedId: focusedId ? parseInt(focusedId) : null,
    oppId: oppId ? parseInt(oppId) : null,
    focusedTeam,
    focusedPos,
    durationSec: raw.info.gameDuration,
    idMap,
    snapshot10,
    snapshot14,
    skillOrder,
  };
}

window.RiotAPI = {
  fetchSummonerProfile,
  fetchMatchBatch,
  fetchDDragon,
  fetchChampionMastery,
  fetchMatchTimeline,
  getCachedMatch,
  getCachedTimeline,
  extractMatchDetail,
  extractTimelineView,
  championPortraitUrl,
  itemIconUrl,
  summonerSpellIconUrl,
  runeIconUrl,
  runeStyleIconUrl,
  buildChampionRepertoire,
  deriveMatchupsForChamp,
  formatRankLine,
  parseRiotId,
};
