/* store.js — single source of truth for player data.

   - One account can hold SEVERAL players (Netflix-style), each with their own
     assessment history across English, Bahasa and Maths
     (every session is tagged subject → topic → level).
   - Every change is written to localStorage first (works offline, nothing is
     lost if the tab closes), then synced to the cloud by firebase.js.
   - The cloud copy is MERGED, never blindly overwritten: sessions are combined
     by timestamp, deleted players / cleared histories are remembered with a
     timestamp, and the newest edit of a player's name wins. So a phone and a
     desktop signed in to the same account always end up with the same data.
   - POINTS: a level pays points only when the player beats their own best
     score on it — (new best − old best) × the subject's points-per-1% rate.
     Every new best is kept in a small ledger ("bests") with the rate at that
     moment, so changing the rate later never changes points already earned,
     and clearing history never lets points be earned twice.
   - SETTINGS (points rates, admin PIN) belong to the whole account; the
     newest saved version wins on every device.
   - QUEST ARENA: every finished game run is kept in "games" (newest first),
     and badges in "badges" as { badgeId: first-earned timestamp } — once
     earned on any device, a badge stays earned everywhere. */
(function () {
  "use strict";
  const LS_PREFIX = "qa_save_";
  const HISTORY_MAX = 120;     // finished sessions kept per player (all subjects)
  const DETAIL_KEEP = 20;      // newest sessions that keep every question for "View details"
  const MISTAKES_MAX = 8;      // mistakes kept per session for the Parent Report
  const DEFAULT_RATE = 1;      // points for each 1% improvement on a level's best score
  const GAMES_MAX = 100;       // game runs kept per player

  let uidKey = "guest";
  let syncer = null;           // set by firebase.js
  let saveTimer = null;
  const listeners = [];

  const clone = (o) => JSON.parse(JSON.stringify(o == null ? null : o));
  const isObj = (o) => !!o && typeof o === "object" && !Array.isArray(o);

  function newProfileId() {
    return "p_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  }
  function cleanName(n) { return String(n == null ? "" : n).trim().slice(0, 24) || "Player"; }

  function blankProfile(name, gender) {
    const now = Date.now();
    return {
      id: newProfileId(),
      name: cleanName(name),
      gender: gender === "girl" ? "girl" : "boy",
      createdAt: now,
      updatedAt: now,          // last edit of name / character — newest edit wins on merge
      lastPlayed: now,
      history: [],             // finished sessions, newest first, all subjects
      cleared: {},             // { english: ts, all: ts } — sessions at/before ts are gone
      bests: [],               // points ledger: one entry per new best score on a level
      games: [],               // Quest Arena runs, newest first
      badges: {}               // { badgeId: ts first earned }
    };
  }

  function defaultSettings() {
    return {
      updatedAt: 0,                                              // newest saved settings win
      pointsPerPercent: { english: DEFAULT_RATE, bahasa: DEFAULT_RATE, maths: DEFAULT_RATE },
      pin: null                                                  // { salt, hash } of the admin PIN
    };
  }
  function cleanRate(v) {
    const n = Number(v);
    return isFinite(n) && n >= 0 ? Math.min(100, Math.round(n * 100) / 100) : DEFAULT_RATE;
  }
  function normaliseSettings(raw) {
    const out = defaultSettings();
    if (!isObj(raw)) return out;
    out.updatedAt = raw.updatedAt || 0;
    if (isObj(raw.pointsPerPercent)) {
      Object.keys(raw.pointsPerPercent).forEach(function (k) { out.pointsPerPercent[k] = cleanRate(raw.pointsPerPercent[k]); });
    }
    out.pin = isObj(raw.pin) && raw.pin.hash && raw.pin.salt ? { salt: String(raw.pin.salt), hash: String(raw.pin.hash) } : null;
    return out;
  }

  // Points ledger: one entry per new best { s, t, l, ts, pct, rate }.
  const bestKey = (e) => e.s + "|" + e.t + "|" + e.l;
  function tidyBests(list) {
    const seen = {};
    return (list || []).filter(function (e) {
      if (!isObj(e) || e.ts == null || !e.s || !e.t || !e.l) return false;
      const k = bestKey(e) + "|" + e.ts;
      if (seen[k]) return false;
      seen[k] = true;
      return true;
    }).sort(function (a, b) { return (a.ts || 0) - (b.ts || 0); });
  }
  // Points for every ledger entry, worked out in time order: only the part
  // above the best so far counts. Re-run after every merge, so two devices
  // that both beat the same old score offline can't pay out twice.
  function scoreBests(list) {
    const best = {};
    return tidyBests(list).map(function (e) {
      const k = bestKey(e), prev = best[k] || 0;
      const gain = Math.max(0, (e.pct || 0) - prev);
      if ((e.pct || 0) > prev) best[k] = e.pct || 0;
      return Object.assign({}, e, { prev: prev, gain: gain, pts: Math.round(gain * cleanRate(e.rate)) });
    });
  }

  function tidyGames(list) {
    const seen = {};
    return (list || []).filter(function (e) {
      if (!isObj(e) || e.ts == null || !e.game) return false;
      const k = e.game + "|" + e.ts;
      if (seen[k]) return false;
      seen[k] = true;
      return true;
    }).sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); }).slice(0, GAMES_MAX);
  }
  // Earliest timestamp per key (badges keep the date they were FIRST earned).
  function minMap(a, b) {
    const out = Object.assign({}, isObj(a) ? a : {});
    Object.keys(isObj(b) ? b : {}).forEach(function (k) {
      if (!b[k]) return;
      out[k] = out[k] ? Math.min(out[k], b[k]) : b[k];
    });
    return out;
  }

  function blankState() {
    return {
      v: 1,
      account: { uid: null, email: null },
      settings: defaultSettings(),
      profiles: {},
      deleted: {},             // { profileId: ts } so a deleted player stays deleted everywhere
      activeProfileId: null    // per device — never taken from the cloud
    };
  }

  // Same key on every device for the same finished session.
  function sessionKey(h) { return (h.subjectId || "?") + "|" + (h.topicId || "?") + "|" + (h.levelId || "?") + "|" + (h.ts || 0); }

  function isCleared(h, cleared) {
    const c = cleared || {};
    return (h.ts || 0) <= Math.max(c.all || 0, c[h.subjectId] || 0);
  }

  // De-duplicate, drop cleared sessions, newest first, cap the size.
  function tidyHistory(list, cleared) {
    const seen = {};
    const out = [];
    (list || []).forEach(function (h) {
      if (!isObj(h) || h.ts == null || isCleared(h, cleared)) return;
      const k = sessionKey(h);
      if (seen[k]) {
        if (!seen[k].answers && h.answers) seen[k].answers = h.answers;
        return;
      }
      seen[k] = h;
      out.push(h);
    });
    out.sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
    const capped = out.slice(0, HISTORY_MAX);
    capped.forEach(function (h, i) { if (i >= DETAIL_KEEP && h.answers) delete h.answers; });
    return capped;
  }

  function maxMap(a, b) {
    const out = Object.assign({}, isObj(a) ? a : {});
    Object.keys(isObj(b) ? b : {}).forEach(function (k) { out[k] = Math.max(out[k] || 0, b[k] || 0); });
    return out;
  }

  function normaliseProfile(raw, pid) {
    const p = Object.assign({}, isObj(raw) ? raw : {});
    p.id = p.id || pid;
    p.name = cleanName(p.name);
    p.gender = p.gender === "girl" ? "girl" : "boy";
    p.createdAt = p.createdAt || Date.now();
    p.updatedAt = p.updatedAt || p.createdAt;
    p.lastPlayed = p.lastPlayed || p.updatedAt;
    p.cleared = isObj(p.cleared) ? p.cleared : {};
    p.history = tidyHistory(Array.isArray(p.history) ? p.history : [], p.cleared);
    p.bests = tidyBests(Array.isArray(p.bests) ? p.bests : []);
    p.games = tidyGames(Array.isArray(p.games) ? p.games : []);
    p.badges = isObj(p.badges) ? p.badges : {};
    return p;
  }

  function normalise(data) {
    const out = blankState();
    if (!isObj(data)) return out;
    data = clone(data);
    out.account = Object.assign(out.account, isObj(data.account) ? data.account : {});
    out.settings = normaliseSettings(data.settings);
    out.deleted = isObj(data.deleted) ? data.deleted : {};
    const profs = isObj(data.profiles) ? data.profiles : {};
    Object.keys(profs).forEach(function (pid) {
      if (!out.deleted[pid]) out.profiles[pid] = normaliseProfile(profs[pid], pid);
    });
    out.activeProfileId = data.activeProfileId && out.profiles[data.activeProfileId] ? data.activeProfileId : null;
    return out;
  }

  // Combine the cloud copy with this device's copy. Nothing finished on either
  // side is lost; deletions and "clear history" are respected on both sides.
  function merge(cloudRaw, localRaw) {
    const a = normalise(cloudRaw), b = normalise(localRaw);
    const out = blankState();
    out.account = Object.assign({}, a.account);
    Object.keys(b.account).forEach(function (k) { if (b.account[k] != null) out.account[k] = b.account[k]; });
    out.deleted = maxMap(a.deleted, b.deleted);
    out.settings = (b.settings.updatedAt || 0) >= (a.settings.updatedAt || 0) ? b.settings : a.settings;

    const ids = {};
    Object.keys(a.profiles).concat(Object.keys(b.profiles)).forEach(function (id) { ids[id] = true; });
    Object.keys(ids).forEach(function (id) {
      if (out.deleted[id]) return;
      const pa = a.profiles[id], pb = b.profiles[id];
      if (!pa || !pb) { out.profiles[id] = pa || pb; return; }
      const p = Object.assign({}, (pb.updatedAt || 0) >= (pa.updatedAt || 0) ? pb : pa);
      p.lastPlayed = Math.max(pa.lastPlayed || 0, pb.lastPlayed || 0);
      p.cleared = maxMap(pa.cleared, pb.cleared);
      p.history = tidyHistory(pb.history.concat(pa.history), p.cleared);
      p.bests = tidyBests(pb.bests.concat(pa.bests));
      p.games = tidyGames(pb.games.concat(pa.games));
      p.badges = minMap(pa.badges, pb.badges);
      out.profiles[id] = p;
    });

    const pick = b.activeProfileId || a.activeProfileId;   // this device's choice wins
    out.activeProfileId = pick && out.profiles[pick] ? pick : null;
    return out;
  }

  // What goes to the cloud: everything except this device's player choice.
  function forCloud(state) {
    const c = clone(state);
    delete c.activeProfileId;
    return c;
  }

  // JSON with sorted keys — used to tell whether two copies really differ.
  function stable(v) {
    if (Array.isArray(v)) return "[" + v.map(stable).join(",") + "]";
    if (isObj(v)) return "{" + Object.keys(v).sort().map(function (k) { return JSON.stringify(k) + ":" + stable(v[k]); }).join(",") + "}";
    return JSON.stringify(v === undefined ? null : v);
  }

  const STORE = {
    state: blankState(),

    // Load this account's local cache (guest when nobody is signed in).
    init() {
      try {
        const raw = localStorage.getItem(LS_PREFIX + uidKey);
        STORE.state = raw ? normalise(JSON.parse(raw)) : blankState();
      } catch (e) { STORE.state = blankState(); }
      return STORE.state;
    },

    // Called by firebase.js when someone signs in or out.
    setUser(account) {
      uidKey = account && account.uid ? account.uid : "guest";
      STORE.init();
      if (account) Object.keys(account).forEach(function (k) {
        if (account[k] != null) STORE.state.account[k] = account[k];
      });
      STORE.emit();
    },

    /* ---------------- players ---------------- */
    profilesList() {
      return Object.keys(STORE.state.profiles || {})
        .map(function (k) { return STORE.state.profiles[k]; })
        .sort(function (a, b) { return (b.lastPlayed || 0) - (a.lastPlayed || 0); });
    },
    active() {
      const id = STORE.state.activeProfileId;
      return id && STORE.state.profiles[id] ? STORE.state.profiles[id] : null;
    },
    createProfile(name, gender) {
      const p = blankProfile(name, gender);
      STORE.state.profiles[p.id] = p;
      STORE.state.activeProfileId = p.id;
      STORE.save({ immediate: true });
      return p;
    },
    updateProfile(id, patch) {
      const p = STORE.state.profiles[id]; if (!p) return false;
      if (patch.name != null) p.name = cleanName(patch.name);
      if (patch.gender === "boy" || patch.gender === "girl") p.gender = patch.gender;
      p.updatedAt = Date.now();
      STORE.save({ immediate: true });
      return true;
    },
    selectProfile(id) {
      if (!STORE.state.profiles[id]) return false;
      STORE.state.activeProfileId = id;
      STORE.state.profiles[id].lastPlayed = Date.now();
      STORE.save();
      return true;
    },
    deleteProfile(id) {
      if (!STORE.state.profiles[id]) return false;
      STORE.state.deleted[id] = Date.now();
      delete STORE.state.profiles[id];
      if (STORE.state.activeProfileId === id) STORE.state.activeProfileId = null;
      STORE.save({ immediate: true });
      return true;
    },

    /* ---------------- assessment history ---------------- */
    // Finished sessions for the active player, newest first.
    // Narrow it with subjectId, then topicId, then levelId (all optional).
    history(subjectId, profile, topicId, levelId) {
      const p = profile || STORE.active();
      return ((p && p.history) || []).filter(function (h) {
        return (!subjectId || h.subjectId === subjectId) &&
               (!topicId || h.topicId === topicId) &&
               (!levelId || h.levelId === levelId);
      });
    },

    // Records a finished assessment and pays points if it beats the best score.
    // Returns the stored session plus { points, prevBest, newBest, rate }.
    recordSession(entry) {
      const p = STORE.active(); if (!p || !entry) return null;
      const clean = {
        subjectId: entry.subjectId,
        topicId:   entry.topicId,
        levelId:   entry.levelId,
        ts:        entry.ts || Date.now(),
        total:     entry.total,
        correct:   entry.correct,
        pct:       entry.total ? Math.round(entry.correct / entry.total * 100) : 0,
        byCat:     entry.byCat || {},
        mistakes:  (entry.mistakes || []).slice(0, MISTAKES_MAX),
        answers:   entry.answers || null         // every question, for "View details"
      };
      const prevBest = STORE.bestScore(clean.subjectId, clean.topicId, clean.levelId, p);
      const rate = STORE.rate(clean.subjectId);
      let points = 0;
      if (clean.pct > prevBest) {
        p.bests.push({ s: clean.subjectId, t: clean.topicId, l: clean.levelId, ts: clean.ts, pct: clean.pct, rate: rate });
        p.bests = tidyBests(p.bests);
        points = Math.round((clean.pct - prevBest) * rate);
      }
      clean.points = points;
      p.history.unshift(clean);
      p.history = tidyHistory(p.history, p.cleared);
      p.lastPlayed = Date.now();
      STORE.save({ immediate: true });           // a finished session must never be lost
      return Object.assign({}, clean, { prevBest: prevBest, newBest: clean.pct > prevBest, rate: rate });
    },

    /* ---------------- points ---------------- */
    // Best score ever on a level (kept even if history is cleared).
    bestScore(subjectId, topicId, levelId, profile) {
      const p = profile || STORE.active();
      return ((p && p.bests) || []).reduce(function (m, e) {
        return e.s === subjectId && e.t === topicId && e.l === levelId ? Math.max(m, e.pct || 0) : m;
      }, 0);
    },
    // Every points-earning moment, oldest first, with .pts worked out.
    pointsLog(profile, subjectId) {
      const p = profile || STORE.active();
      return scoreBests((p && p.bests) || []).filter(function (e) { return !subjectId || e.s === subjectId; });
    },
    points(profile, subjectId) {
      return STORE.pointsLog(profile, subjectId).reduce(function (a, e) { return a + e.pts; }, 0);
    },

    /* ---------------- Quest Arena: games + badges ---------------- */
    // entry: { game, subjectId, ts, cleared, reached, correct, answered, tooSlow, livesLeft, r1Ms, r2Ms, reason }
    recordGame(entry) {
      const p = STORE.active(); if (!p || !entry || !entry.game) return null;
      const clean = JSON.parse(JSON.stringify(Object.assign({ ts: Date.now() }, entry)));
      p.games.unshift(clean);
      p.games = tidyGames(p.games);
      p.lastPlayed = Date.now();
      STORE.save({ immediate: true });
      return clean;
    },
    gameLog(gameId, profile) {
      const p = profile || STORE.active();
      return ((p && p.games) || []).filter(function (e) { return !gameId || e.game === gameId; });
    },
    badges(profile) {
      const p = profile || STORE.active();
      return (p && p.badges) || {};
    },
    // Returns true if this is the first time the badge is earned.
    awardBadge(badgeId) {
      const p = STORE.active(); if (!p || !badgeId) return false;
      if (p.badges[badgeId]) return false;
      p.badges[badgeId] = Date.now();
      STORE.save({ immediate: true });
      return true;
    },

    /* ---------------- account settings (admin) ---------------- */
    settings() { return STORE.state.settings || defaultSettings(); },
    rate(subjectId) {
      const r = (STORE.settings().pointsPerPercent || {})[subjectId];
      return r == null ? DEFAULT_RATE : cleanRate(r);
    },
    setRates(rates) {
      const st = STORE.state.settings = normaliseSettings(STORE.state.settings);
      Object.keys(rates || {}).forEach(function (k) { st.pointsPerPercent[k] = cleanRate(rates[k]); });
      st.updatedAt = Date.now();
      STORE.save({ immediate: true });
    },
    setPin(pin) {      // pin = { salt, hash } or null
      const st = STORE.state.settings = normaliseSettings(STORE.state.settings);
      st.pin = pin && pin.salt && pin.hash ? { salt: pin.salt, hash: pin.hash } : null;
      st.updatedAt = Date.now();
      STORE.save({ immediate: true });
    },

    // subjectId = "english" | "bahasa" | "maths" | "all"
    clearHistory(subjectId) {
      const p = STORE.active(); if (!p) return;
      p.cleared[subjectId || "all"] = Date.now();
      p.history = tidyHistory(p.history, p.cleared);
      STORE.save({ immediate: true });
    },

    /* ---------------- persistence + sync ---------------- */
    persistLocal() {
      try { localStorage.setItem(LS_PREFIX + uidKey, JSON.stringify(STORE.state)); } catch (e) { }
    },

    // { immediate: true } for anything that must reach the cloud right away.
    save(opts) {
      STORE.persistLocal();
      STORE.emit();
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = null;
      if (!syncer) return;
      if (opts && opts.immediate) syncer();
      else saveTimer = setTimeout(function () { saveTimer = null; syncer(); }, 900);
    },

    // Take in a merged copy from the cloud. Merging again with the current
    // state keeps anything that happened on this device while the network
    // call was in flight. Returns true if what the player sees changed.
    adopt(merged) {
      const before = stable(forCloud(STORE.state));
      STORE.state = merge(merged, STORE.state);
      const changed = stable(forCloud(STORE.state)) !== before;
      STORE.persistLocal();
      if (changed) STORE.emit();
      return changed;
    },

    snapshot() { return clone(STORE.state); },
    setSyncer(fn) { syncer = fn; },
    onChange(fn) { listeners.push(fn); },
    emit() { listeners.forEach(function (fn) { try { fn(STORE.state); } catch (e) { } }); },

    DEFAULT_RATE,
    // Exposed for firebase.js
    merge, normalise, forCloud, stable
  };

  window.STORE = STORE;
})();
